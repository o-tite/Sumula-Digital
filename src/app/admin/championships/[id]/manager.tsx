"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = {
  id: string;
  name: string;
  color: string | null;
  logoUrl: string | null;
  _count?: { players: number };
};

type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string | Date;
  status: string;
  refereeUserId?: string | null;
};

type Round = {
  id: string;
  number: number;
  label: string | null;
  matches: Match[];
};

type Regulation = {
  numPeriods: number;
  periodDurationMin: number;
  intervalDurationMin: number;
  cardTypes: string;
  cardBlueMode: string | null;
  cardBlueDurationMin: number | null;
  yellowAccumulationLimit: number;
  foulFreeKickEnabled: boolean;
  foulFreeKickLimit: number;
  foulIndividualEnabled: boolean;
  foulIndividualLimit: number | null;
  penaltiesEnabled: boolean;
  penaltyKicksPerTeam: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pointsPenaltyWin: number;
  pointsPenaltyLoss: number;
  tiebreakOrder: string;
  goalkeeperRankingFormula: string;
};

type Championship = {
  id: string;
  name: string;
  regulation: Regulation | null;
};

interface Props {
  championship: Championship;
  teams: Team[];
  rounds: Round[];
}

export function ChampionshipManager({ championship, teams, rounds }: Props) {
  const [tab, setTab] = useState<"regulation" | "teams" | "rounds">("regulation");
  return (
    <div>
      <div className="flex gap-3 border-b border-surface-100 mb-4 overflow-x-auto">
        {(["regulation", "teams", "rounds"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-primary-500 text-primary-700"
                : "text-muted"
            }`}
          >
            {t === "regulation" ? "Regulamento" : t === "teams" ? "Times" : "Rodadas e jogos"}
          </button>
        ))}
      </div>

      {tab === "regulation" && (
        <RegulationForm championshipId={championship.id} regulation={championship.regulation} />
      )}
      {tab === "teams" && <TeamsManager championshipId={championship.id} teams={teams} />}
      {tab === "rounds" && (
        <RoundsManager championshipId={championship.id} teams={teams} rounds={rounds} />
      )}
    </div>
  );
}

function RegulationForm({
  championshipId,
  regulation
}: {
  championshipId: string;
  regulation: Regulation | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Regulation>(
    regulation ?? {
      numPeriods: 2,
      periodDurationMin: 20,
      intervalDurationMin: 5,
      cardTypes: "amarelo_vermelho",
      cardBlueMode: null,
      cardBlueDurationMin: null,
      yellowAccumulationLimit: 3,
      foulFreeKickEnabled: false,
      foulFreeKickLimit: 5,
      foulIndividualEnabled: false,
      foulIndividualLimit: null,
      penaltiesEnabled: false,
      penaltyKicksPerTeam: 5,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      pointsPenaltyWin: 2,
      pointsPenaltyLoss: 1,
      tiebreakOrder: '["confronto_direto","saldo_gols","gols_pro"]',
      goalkeeperRankingFormula: "media"
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Regulation>(k: K, v: Regulation[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/championships/${championshipId}/regulation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tiebreakOrder: JSON.parse(form.tiebreakOrder)
      })
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Erro ao salvar");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4 bg-white rounded-lg p-4 border border-surface-100">
      <div className="grid gap-3 md:grid-cols-3">
        <NumberField label="Períodos" value={form.numPeriods} onChange={(v) => set("numPeriods", v)} />
        <NumberField
          label="Duração do período (min)"
          value={form.periodDurationMin}
          onChange={(v) => set("periodDurationMin", v)}
        />
        <NumberField
          label="Intervalo (min)"
          value={form.intervalDurationMin}
          onChange={(v) => set("intervalDurationMin", v)}
        />
      </div>

      <fieldset className="border-t pt-3">
        <legend className="text-sm font-semibold mb-2">Cartões</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Tipos"
            value={form.cardTypes}
            options={[
              ["amarelo_vermelho", "Amarelo + Vermelho"],
              ["com_azul", "Com azul"]
            ]}
            onChange={(v) => set("cardTypes", v)}
          />
          {form.cardTypes === "com_azul" && (
            <Select
              label="Modo do azul"
              value={form.cardBlueMode ?? ""}
              options={[
                ["", "—"],
                ["temporario", "Temporário"],
                ["definitivo_sub", "Definitivo + sub"]
              ]}
              onChange={(v) => set("cardBlueMode", v || null)}
            />
          )}
          {form.cardBlueMode === "temporario" && (
            <NumberField
              label="Tempo de exclusão (min)"
              value={form.cardBlueDurationMin ?? 2}
              onChange={(v) => set("cardBlueDurationMin", v)}
            />
          )}
          <NumberField
            label="Limite de acúmulo (amarelos)"
            value={form.yellowAccumulationLimit}
            onChange={(v) => set("yellowAccumulationLimit", v)}
          />
        </div>
      </fieldset>

      <fieldset className="border-t pt-3">
        <legend className="text-sm font-semibold mb-2">Faltas</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <Toggle
            label="Tiro livre por faltas do time"
            value={form.foulFreeKickEnabled}
            onChange={(v) => set("foulFreeKickEnabled", v)}
          />
          {form.foulFreeKickEnabled && (
            <NumberField
              label="Limite por período"
              value={form.foulFreeKickLimit}
              onChange={(v) => set("foulFreeKickLimit", v)}
            />
          )}
          <Toggle
            label="Punição individual"
            value={form.foulIndividualEnabled}
            onChange={(v) => set("foulIndividualEnabled", v)}
          />
          {form.foulIndividualEnabled && (
            <NumberField
              label="Limite individual"
              value={form.foulIndividualLimit ?? 5}
              onChange={(v) => set("foulIndividualLimit", v)}
            />
          )}
        </div>
      </fieldset>

      <fieldset className="border-t pt-3">
        <legend className="text-sm font-semibold mb-2">Pênaltis</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <Toggle
            label="Disputa habilitada"
            value={form.penaltiesEnabled}
            onChange={(v) => set("penaltiesEnabled", v)}
          />
          {form.penaltiesEnabled && (
            <>
              <NumberField
                label="Cobranças por time"
                value={form.penaltyKicksPerTeam}
                onChange={(v) => set("penaltyKicksPerTeam", v)}
              />
              <NumberField
                label="Pts vitória pênalti"
                value={form.pointsPenaltyWin}
                onChange={(v) => set("pointsPenaltyWin", v)}
              />
              <NumberField
                label="Pts derrota pênalti"
                value={form.pointsPenaltyLoss}
                onChange={(v) => set("pointsPenaltyLoss", v)}
              />
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="border-t pt-3">
        <legend className="text-sm font-semibold mb-2">Pontuação</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <NumberField label="Vitória" value={form.pointsWin} onChange={(v) => set("pointsWin", v)} />
          <NumberField label="Empate" value={form.pointsDraw} onChange={(v) => set("pointsDraw", v)} />
          <NumberField label="Derrota" value={form.pointsLoss} onChange={(v) => set("pointsLoss", v)} />
        </div>
      </fieldset>

      <fieldset className="border-t pt-3">
        <legend className="text-sm font-semibold mb-2">Goleiro menos vazado</legend>
        <Select
          label="Fórmula"
          value={form.goalkeeperRankingFormula}
          options={[
            ["media", "Média (gols ÷ jogos)"],
            ["absoluto", "Total absoluto"],
            ["por_minuto", "Por minuto jogado"]
          ]}
          onChange={(v) => set("goalkeeperRankingFormula", v)}
        />
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="rounded bg-primary-500 px-6 py-3 text-white font-semibold disabled:opacity-50"
      >
        {saving ? "Salvando…" : "Salvar regulamento"}
      </button>
    </div>
  );
}

function TeamsManager({
  championshipId,
  teams
}: {
  championshipId: string;
  teams: Team[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/admin/championships/${championshipId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: color || null })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message);
      return;
    }
    setName("");
    setColor("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {teams.map((t) => (
          <li
            key={t.id}
            className="bg-white rounded-lg border border-surface-100 p-3 flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-full"
              style={{ background: t.color ?? "#0088CC" }}
            />
            <div className="flex-1">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-muted">
                {t._count?.players ?? 0} jogadores
              </div>
            </div>
            <a
              href={`/admin/teams/${t.id}`}
              className="text-primary-500 text-sm font-medium"
            >
              Elenco →
            </a>
          </li>
        ))}
      </ul>
      <form
        onSubmit={create}
        className="bg-white p-4 rounded-lg border border-surface-100 grid gap-3 md:grid-cols-3"
      >
        <input
          required
          placeholder="Nome do time"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-surface-100 px-3 py-2 md:col-span-2"
        />
        <input
          placeholder="Cor #RRGGBB"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="rounded border border-surface-100 px-3 py-2"
        />
        {error && <p className="md:col-span-3 text-sm text-danger">{error}</p>}
        <button className="md:col-span-3 rounded bg-primary-500 text-white py-3 font-semibold">
          Adicionar time
        </button>
      </form>
    </div>
  );
}

function RoundsManager({
  championshipId,
  teams,
  rounds
}: {
  championshipId: string;
  teams: Team[];
  rounds: Round[];
}) {
  const router = useRouter();
  const [referees, setReferees] = useState<{ id: string; name: string; email: string }[]>([]);
  const [number, setNumber] = useState<number>(rounds.length + 1);
  const [label, setLabel] = useState("");
  const [matchForm, setMatchForm] = useState({
    roundId: rounds[0]?.id ?? "",
    homeTeamId: teams[0]?.id ?? "",
    awayTeamId: teams[1]?.id ?? "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    venue: "",
    refereeNameText: "",
    refereeUserId: "",
    homeResponsible: "",
    awayResponsible: ""
  });
  const [error, setError] = useState<string | null>(null);

  async function loadRefs() {
    const r = await fetch("/api/admin/referees").then((r) => r.json());
    setReferees(r);
  }

  async function createRound(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/admin/championships/${championshipId}/rounds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, label: label || undefined })
    });
    if (!res.ok) {
      setError("Erro ao criar rodada");
      return;
    }
    setLabel("");
    setNumber((n) => n + 1);
    router.refresh();
  }

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (matchForm.homeTeamId === matchForm.awayTeamId) {
      setError("Times devem ser diferentes");
      return;
    }
    const res = await fetch(`/api/admin/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...matchForm,
        scheduledAt: new Date(matchForm.scheduledAt).toISOString(),
        refereeUserId: matchForm.refereeUserId || undefined,
        venue: matchForm.venue || undefined,
        refereeNameText: matchForm.refereeNameText || undefined,
        homeResponsible: matchForm.homeResponsible || undefined,
        awayResponsible: matchForm.awayResponsible || undefined
      })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Erro");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {rounds.map((r) => (
          <div
            key={r.id}
            className="bg-white border border-surface-100 rounded-lg p-3"
          >
            <div className="font-semibold mb-2">
              Rodada {r.number}
              {r.label ? ` — ${r.label}` : ""}
            </div>
            {r.matches.length === 0 && (
              <p className="text-sm text-muted">Sem jogos.</p>
            )}
            <ul className="space-y-1">
              {r.matches.map((m) => {
                const home = teams.find((t) => t.id === m.homeTeamId)?.name;
                const away = teams.find((t) => t.id === m.awayTeamId)?.name;
                return (
                  <li key={m.id} className="text-sm flex justify-between">
                    <span>
                      {home} × {away}
                    </span>
                    <span className="text-muted">
                      {new Date(m.scheduledAt).toLocaleString("pt-BR")} · {m.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <form
        onSubmit={createRound}
        className="bg-white p-4 rounded-lg border border-surface-100 grid gap-3 md:grid-cols-3"
      >
        <h3 className="md:col-span-3 font-semibold">Nova rodada</h3>
        <input
          type="number"
          min={1}
          required
          value={number}
          onChange={(e) => setNumber(Number(e.target.value))}
          className="rounded border border-surface-100 px-3 py-2"
        />
        <input
          placeholder="Rótulo (opcional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded border border-surface-100 px-3 py-2 md:col-span-2"
        />
        <button className="md:col-span-3 rounded bg-primary-500 text-white py-2 font-semibold">
          Criar rodada
        </button>
      </form>

      {teams.length >= 2 && rounds.length > 0 && (
        <form
          onSubmit={createMatch}
          onFocus={() => referees.length === 0 && loadRefs()}
          className="bg-white p-4 rounded-lg border border-surface-100 grid gap-3 md:grid-cols-2"
        >
          <h3 className="md:col-span-2 font-semibold">Novo jogo</h3>
          <Select
            label="Rodada"
            value={matchForm.roundId}
            options={rounds.map((r) => [r.id, `Rodada ${r.number}${r.label ? ` — ${r.label}` : ""}`])}
            onChange={(v) => setMatchForm({ ...matchForm, roundId: v })}
          />
          <input
            type="datetime-local"
            value={matchForm.scheduledAt}
            onChange={(e) => setMatchForm({ ...matchForm, scheduledAt: e.target.value })}
            className="rounded border border-surface-100 px-3 py-2"
          />
          <Select
            label="Mandante"
            value={matchForm.homeTeamId}
            options={teams.map((t) => [t.id, t.name])}
            onChange={(v) => setMatchForm({ ...matchForm, homeTeamId: v })}
          />
          <Select
            label="Visitante"
            value={matchForm.awayTeamId}
            options={teams.map((t) => [t.id, t.name])}
            onChange={(v) => setMatchForm({ ...matchForm, awayTeamId: v })}
          />
          <Select
            label="Mesário"
            value={matchForm.refereeUserId}
            options={[
              ["", "—"],
              ...referees.map((r) => [r.id, `${r.name} (${r.email})`] as [string, string])
            ]}
            onChange={(v) => setMatchForm({ ...matchForm, refereeUserId: v })}
          />
          <input
            placeholder="Árbitro (texto livre)"
            value={matchForm.refereeNameText}
            onChange={(e) => setMatchForm({ ...matchForm, refereeNameText: e.target.value })}
            className="rounded border border-surface-100 px-3 py-2"
          />
          <input
            placeholder="Local (opcional)"
            value={matchForm.venue}
            onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
            className="rounded border border-surface-100 px-3 py-2"
          />
          <input
            placeholder="Responsável mandante"
            value={matchForm.homeResponsible}
            onChange={(e) => setMatchForm({ ...matchForm, homeResponsible: e.target.value })}
            className="rounded border border-surface-100 px-3 py-2"
          />
          <input
            placeholder="Responsável visitante"
            value={matchForm.awayResponsible}
            onChange={(e) => setMatchForm({ ...matchForm, awayResponsible: e.target.value })}
            className="rounded border border-surface-100 px-3 py-2 md:col-span-2"
          />
          {error && <p className="md:col-span-2 text-sm text-danger">{error}</p>}
          <button className="md:col-span-2 rounded bg-primary-500 text-white py-3 font-semibold">
            Criar jogo
          </button>
        </form>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted block mb-1">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded border border-surface-100 px-3 py-2"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-surface-100 px-3 py-2"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 mt-5">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

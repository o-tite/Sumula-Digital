# Saint Clair — Súmula Digital

Plataforma de gerenciamento de campeonatos de futebol e operação de súmula digital
(MVP · Entrega 1, baseada nos requisitos funcionais §1–§16).

## Stack

- **Next.js 14 (App Router)** + **TypeScript** — backend e frontend unificados
- **Prisma + SQLite** em dev (basta trocar `provider` por `postgresql` em produção)
- **Auth.js (NextAuth 5 beta)** com Credentials e perfis `ORGANIZER` / `REFEREE`
- **Server-Sent Events** nativos do Next para tempo real
- **Tailwind CSS** com a paleta Saint Clair (`#0088CC` / `#0D1117`)
- **Vitest** para o domínio puro (50 testes)

## Estrutura

```
src/
├── domain/           # Regras puras: clock, score, cards, fouls, goalkeeper, penalty, state
├── application/      # Use cases por feature + guards
├── infrastructure/   # Prisma, Auth.js, SSE bus
├── shared/           # Tipos compartilhados, erros de domínio
└── app/              # Rotas Next: páginas (admin, sumula, login) e API
prisma/
├── schema.prisma     # Modelo de dados (championships → matches → scoresheets → events)
└── seed.ts           # Usuários demo + campeonato + jogo
tests/domain/         # Vitest cobrindo regras críticas (TC-* do TDD)
```

## Como rodar

```bash
npm install
npx prisma migrate dev      # cria SQLite + tabelas
npm run prisma:seed         # popula usuários e jogo demo
npm run dev                 # http://localhost:3000
```

### Credenciais demo (após seed)

| Perfil       | Email                       | Senha     |
| ------------ | --------------------------- | --------- |
| Organizador  | `admin@saintclair.com`      | `admin123` |
| Mesário      | `mesario@saintclair.com`    | `mesa123`  |

## Comandos

```bash
npm run dev            # dev server
npm run build          # build de produção
npm run typecheck      # tsc --noEmit
npm test               # vitest run (50 testes)
npm run prisma:migrate # nova migration
npm run prisma:seed    # popular dev.db
```

## Fluxo coberto

### Organizador (`/admin`)
- Criar campeonato (RF §2.1) — apenas 1 em andamento por vez
- Configurar regulamento (RF §2.2): períodos, cartões, faltas, pênaltis, pontuação, desempate, fórmula de goleiro
- Cadastrar times (RF §3) com cor — bloqueia cores funcionais
- Cadastrar jogadores (RF §4) com status `ativo`/`suspenso`/`inativo`
- Criar rodadas e jogos (RF §5), atribuir mesário
- Criar/redefinir senha de mesários (RF §1.5)

### Mesário (`/sumula/[id]`)
- Tela pré-jogo (RF §6): presença, número de camisa com `inputmode="numeric"`,
  modal de ausência (justificada/injustificada), goleiro inicial (cadastrado ou avulso)
- Cronômetro crescente (RF §7) com alerta vermelho ao atingir o tempo configurado
- Timeline (RF §8) como **fonte de verdade** — placar, faltas e cartões derivados
- Registro de gol/gol contra (RF §9), cartões (RF §10) com **2º amarelo → vermelho automático**,
  faltas (RF §11) com contadores por time/período e por jogador, troca de goleiro (RF §12),
  substituição (RF §13)
- Modal de pênaltis (RF §14) — sequência alternada, desfazer última, banner de vencedor
- Revisão (RF §15), ocorrência opcional, salvamento com bloqueio sem goleiros definidos
- Compartilhamento via Web Share API (RF §16) com fallback de link copiável

## Arquitetura (por que essas escolhas)

- **Camadas**: regras de negócio em `src/domain` puro (testável sem mocks); use cases compõem domínio + Prisma; rotas Next traduzem HTTP ↔ use case.
- **Timeline como fonte de verdade**: `deriveScore()` calcula placar a partir dos eventos; nunca há campo `score` independente — alinhado a §11.2.
- **Cronômetro persistido só como timestamp**: `period_started_at` no banco; cliente calcula `MM:SS` por `(now - start)`. Atende §7.3 e reconexão (§3.3 da arquitetura).
- **SSE com event bus em memória**: pronto para trocar por Redis/PG LISTEN sem alterar a API. Replay via `Last-Event-ID` já implementado.
- **Idempotência**: `clientEventId` único na timeline garante que retries não dupliquem eventos (Arquitetura §4.2).
- **Suspensões automáticas**: vermelho direto e 2 amarelos geram `SuspensionLog` pendente; organizador confirma/descarta (RF §10.5).

## Fora desta entrega (presentes no escopo, schema preparado)

- Tabelas em tempo real (classificação, artilharia, goleiro menos vazado, cartões, presença)
- Landing page pública
- Painel administrativo de gestão de tabelas e suspensões
- Geração server-side do card visual PNG (estrutura prevista — `shareCardUrl` no schema)
- IndexedDB queue offline no cliente

Esses itens dependem somente de **leituras** sobre os dados já capturados pela súmula
e pelo bus SSE — nenhuma alteração estrutural será necessária.

## Testes

Os testes unitários do domínio (50 cenários) cobrem as regras críticas do TDD:
clock, derivação de placar, máquina de estados, cartões (2 amarelos), faltas,
tempo de goleiro, pênaltis, validação pré-jogo e validação do regulamento.

```bash
npm test
# Tests  9 passed (9)
# Tests  50 passed (50)
```

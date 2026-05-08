# Saint Clair — Requisitos Funcionais · Entrega 1

> **Contexto para o agente:** Este documento descreve os requisitos funcionais da primeira entrega do sistema Saint Clair — plataforma de gerenciamento de campeonatos de futebol. Leia cada seção por completo antes de implementar. Cada requisito inclui regras de negócio, restrições e critérios de aceite para orientar tanto a implementação quanto os testes.
>
> **Stack:** em aberto. Priorize separação clara entre camada de domínio, aplicação e infraestrutura. Toda regra de negócio deve estar na camada de domínio, não em controllers ou handlers.
>
> **Paleta de cores:**
> - Primário: `#0088CC` (azul Saint Clair)
> - Secundário: `#0D1117` (preto azulado)
> - Alerta: `#E87722` (laranja)
> - Erro/crítico: `#E24B4A` (vermelho)
> - Sucesso: `#00CC88` (verde)
> - Fundo geral: `#F4F5F7`
> - Bordas/separadores: `#E2E4E8`
> - Texto secundário: `#6B7280`

---

## Índice

1. [Autenticação e Controle de Acesso](#1-autenticação-e-controle-de-acesso)
2. [Gestão de Campeonato](#2-gestão-de-campeonato)
3. [Gestão de Times](#3-gestão-de-times)
4. [Gestão de Jogadores](#4-gestão-de-jogadores)
5. [Gestão de Rodadas e Jogos](#5-gestão-de-rodadas-e-jogos)
6. [Tela Pré-Jogo da Súmula](#6-tela-pré-jogo-da-súmula)
7. [Cronômetro da Súmula](#7-cronômetro-da-súmula)
8. [Timeline de Eventos](#8-timeline-de-eventos)
9. [Registro de Gol](#9-registro-de-gol)
10. [Registro de Cartões](#10-registro-de-cartões)
11. [Registro de Faltas](#11-registro-de-faltas)
12. [Gestão de Goleiros](#12-gestão-de-goleiros)
13. [Substituições](#13-substituições)
14. [Modal de Pênaltis](#14-modal-de-pênaltis)
15. [Revisão e Encerramento da Súmula](#15-revisão-e-encerramento-da-súmula)
16. [Compartilhamento da Súmula](#16-compartilhamento-da-súmula)

---

## 1. Autenticação e Controle de Acesso

### Contexto
O sistema possui dois perfis autenticados: **Organizador** (administrador do campeonato) e **Mesário** (operador da súmula). A landing page pública não requer autenticação. Não há auto-cadastro — toda conta é criada pelo organizador.

### 1.1 Login do Organizador

**Requisito:** O organizador deve conseguir autenticar-se com e-mail e senha para acessar o painel administrativo.

**Regras de negócio:**
- Credenciais inválidas retornam erro genérico sem indicar qual campo está errado
- Sessão é persistente (sobrevive ao fechamento do browser)
- Após autenticação, redirecionar para o painel do organizador
- O perfil Organizador não tem acesso à tela de súmula (operação exclusiva do mesário)

**Critérios de aceite:**
- [ ] Login com credenciais válidas redireciona para o painel
- [ ] Login com credenciais inválidas exibe mensagem de erro sem detalhes sobre qual campo falhou
- [ ] Sessão persiste após fechar e reabrir o browser
- [ ] Tentativa de acessar a súmula com sessão de organizador é negada

---

### 1.2 Login do Mesário

**Requisito:** O mesário deve conseguir autenticar-se com e-mail e senha para acessar exclusivamente os jogos atribuídos a ele.

**Regras de negócio:**
- Após login, o mesário vê apenas a lista de jogos atribuídos a ele — nenhum outro jogo é visível
- Um mesário pode ser atribuído a múltiplos jogos simultaneamente
- O mesário não tem acesso ao painel do organizador
- Tentativa de acessar a URL da súmula de um jogo não atribuído a ele deve retornar erro de autorização (403)

**Critérios de aceite:**
- [ ] Login com credenciais válidas redireciona para a lista de jogos atribuídos
- [ ] Apenas jogos do mesário autenticado aparecem na lista
- [ ] Acesso direto por URL a jogo de outro mesário retorna 403
- [ ] Acesso ao painel do organizador com sessão de mesário retorna 403

---

### 1.3 Controle de Sessão

**Requisito:** As sessões devem ser gerenciadas de forma segura e isolada por perfil.

**Regras de negócio:**
- Sessão do organizador: persistente, sem expiração no MVP
- Sessão do mesário: persistente durante o jogo; não expira enquanto a súmula estiver em andamento
- Logout disponível para ambos os perfis
- Não há compartilhamento de sessão entre perfis

**Critérios de aceite:**
- [ ] Logout encerra a sessão e redireciona para a tela de login
- [ ] Após logout, acesso às rotas protegidas redireciona para login
- [ ] Tokens/cookies de sessão são isolados por perfil

---

### 1.4 Restrição de Jogos por Mesário

**Requisito:** O sistema deve garantir que um mesário só consiga operar a súmula do jogo ao qual foi atribuído.

**Regras de negócio:**
- A atribuição é feita pelo organizador ao criar ou editar um jogo
- O organizador pode reatribuir um mesário enquanto o jogo estiver com status `agendado`
- Após o jogo estar `em_andamento`, a reatribuição só é possível pelo organizador via edição administrativa
- Um jogo sem mesário atribuído não pode ser iniciado

**Critérios de aceite:**
- [ ] Mesário sem atribuição não consegue iniciar a súmula
- [ ] Reatribuição de mesário funciona para jogos `agendado`
- [ ] Reatribuição não é possível diretamente pelo mesário em nenhuma situação

---

### 1.5 Gestão de Contas de Mesário

**Requisito:** O organizador deve conseguir criar, editar e redefinir a senha das contas de mesário.

**Regras de negócio:**
- Não há auto-cadastro de mesários — a conta é criada exclusivamente pelo organizador
- O organizador define o nome e a senha do mesário no momento da criação
- Recuperação de senha: no MVP, o organizador redefine a senha manualmente pelo painel (sem fluxo de e-mail)
- Uma conta de mesário pode ser atribuída a vários jogos simultaneamente

**Endpoints esperados:**
```
POST   /admin/referees          — criar conta de mesário
GET    /admin/referees          — listar contas de mesário
PATCH  /admin/referees/:id      — editar nome
PATCH  /admin/referees/:id/password — redefinir senha
```

**Critérios de aceite:**
- [ ] Organizador cria conta de mesário com nome e senha
- [ ] Mesário consegue fazer login com as credenciais criadas
- [ ] Organizador redefine senha e a nova senha passa a funcionar
- [ ] Senha anterior deixa de funcionar após redefinição

---

## 2. Gestão de Campeonato

### Contexto
No MVP existe apenas um campeonato ativo por vez. O campeonato possui uma série pai (`championship_series`) que agrupa edições anuais. O regulamento é criado junto ao campeonato e pertence exclusivamente a ele — não há templates reutilizáveis.

### 2.1 Cadastro de Campeonato

**Requisito:** O organizador deve conseguir criar um campeonato com suas informações básicas.

**Campos:**
| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `name` | string | sim | Nome do campeonato |
| `series_id` | uuid | não | Vínculo com série pai (pode ser criada junto) |
| `modality` | enum | sim | `futsal`, `suico`, `campo` |
| `season` | string | sim | Ex: "2025" |
| `status` | enum | auto | Inicia como `em_andamento` |

**Regras de negócio:**
- Apenas um campeonato pode estar com status `em_andamento` por vez no MVP
- O campeonato deve ter um regulamento configurado antes de poder ter jogos criados
- Status possíveis: `em_andamento`, `encerrado`

**Critérios de aceite:**
- [ ] Campeonato criado aparece no painel do organizador
- [ ] Não é possível criar um segundo campeonato com status `em_andamento`
- [ ] Modalidade é validada contra os valores permitidos

---

### 2.2 Configuração de Regulamento

**Requisito:** O organizador deve configurar o regulamento do campeonato antes do início das partidas. O regulamento define todas as regras que a súmula e as tabelas usarão durante o campeonato.

**Campos do regulamento:**

#### Período e Tempo

| Campo | Tipo | Padrão | Notas |
|---|---|---|---|
| `num_periods` | integer | 2 | Número de períodos por jogo |
| `period_duration_min` | integer | 20 | Duração de cada período em minutos |
| `interval_duration_min` | integer | 5 | Duração do intervalo entre períodos |

**Regras:**
- O cronômetro é sempre crescente e não pode ser pausado manualmente
- O alerta de fim de período dispara ao atingir `period_duration_min`, mas o cronômetro continua rodando para acréscimos
- O mesário encerra o período manualmente após o alerta

---

#### Configuração de Cartões

| Campo | Tipo | Padrão | Notas |
|---|---|---|---|
| `card_types` | enum | `amarelo_vermelho` | `amarelo_vermelho` ou `com_azul` |
| `card_blue_mode` | enum | null | `temporario` ou `definitivo_sub` — obrigatório se `card_types = com_azul` |
| `card_blue_duration_min` | integer | null | Minutos de exclusão — obrigatório se `card_blue_mode = temporario` |
| `yellow_accumulation_limit` | integer | 3 | Nº de amarelos acumulados entre rodadas que gera suspensão |

**Regras:**
- `card_blue_mode` e `card_blue_duration_min` só são relevantes quando `card_types = com_azul`
- Dois cartões amarelos no mesmo jogo geram cartão vermelho automático (regra fixa, não configurável)
- Cartão vermelho direto gera suspensão automática para o próximo jogo (regra fixa)

---

#### Configuração de Faltas

| Campo | Tipo | Padrão | Notas |
|---|---|---|---|
| `foul_free_kick_enabled` | boolean | false | Habilita regra de tiro livre por faltas do time |
| `foul_free_kick_limit` | integer | 5 | Nº de faltas do time no período que dispara o alerta |
| `foul_individual_enabled` | boolean | false | Habilita punição por faltas individuais |
| `foul_individual_limit` | integer | null | Nº de faltas do jogador no jogo que dispara o alerta |

**Regras:**
- Quando `foul_free_kick_enabled = false`, a súmula não exibe contadores de faltas por time
- Quando `foul_individual_enabled = false`, a súmula não exibe o painel de faltas por jogador
- O contador de faltas do time por período é zerado a cada início de período

---

#### Configuração de Pênaltis

| Campo | Tipo | Padrão | Notas |
|---|---|---|---|
| `penalties_enabled` | boolean | false | Habilita disputa de pênaltis em caso de empate |
| `penalty_kicks_per_team` | integer | 5 | Número de cobranças por time na disputa |
| `points_penalty_win` | integer | 2 | Pontos para o vencedor nos pênaltis |
| `points_penalty_loss` | integer | 1 | Pontos para o perdedor nos pênaltis |

**Regras:**
- `penalty_kicks_per_team` só é relevante quando `penalties_enabled = true`
- Gols de pênalti da disputa NÃO contam para artilharia e NÃO alteram o placar do tempo regulamentar
- Jogo decidido nos pênaltis é registrado como empate (E) para ambos os times na classificação, com pontuação diferenciada (EP/DP)

---

#### Pontuação na Classificação

| Campo | Tipo | Padrão |
|---|---|---|
| `points_win` | integer | 3 |
| `points_draw` | integer | 1 |
| `points_loss` | integer | 0 |

---

#### Critérios de Desempate

| Campo | Tipo | Notas |
|---|---|---|
| `tiebreak_order` | array de enum | Ordem dos critérios aplicados em sequência |

**Valores possíveis para `tiebreak_order`:**
- `confronto_direto`
- `saldo_gols`
- `gols_pro`
- `gols_sofridos`
- `num_vitorias` *(NÃO conta vitórias por pênaltis)*
- `menos_cartoes` *(ponderado: amarelo=1, azul=2, vermelho=3)*
- `sorteio`

---

#### Fórmula de Goleiro Menos Vazado

| Campo | Tipo | Notas |
|---|---|---|
| `goalkeeper_ranking_formula` | enum | `media`, `absoluto`, `por_minuto` |

- `media`: gols sofridos ÷ jogos como goleiro
- `absoluto`: total de gols sofridos
- `por_minuto`: gols sofridos ÷ minutos jogados como goleiro

**Critérios de aceite do regulamento:**
- [ ] Regulamento salvo com todos os campos válidos
- [ ] `card_blue_mode` é exigido quando `card_types = com_azul`
- [ ] `card_blue_duration_min` é exigido quando `card_blue_mode = temporario`
- [ ] `foul_individual_limit` é exigido quando `foul_individual_enabled = true`
- [ ] `penalties_enabled = true` exige `penalty_kicks_per_team` definido
- [ ] `tiebreak_order` deve conter ao menos um critério

---

## 3. Gestão de Times

### 3.1 Cadastro de Times

**Requisito:** O organizador deve conseguir cadastrar, editar e listar os times do campeonato.

**Campos:**
| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `name` | string | sim | Nome do time |
| `championship_id` | uuid | sim | Vínculo com o campeonato |
| `logo_url` | string | não | URL pública da imagem após upload |
| `color` | string | não | Hex da cor do time (ex: `#2E7D32`) |

**Regras de negócio:**
- Times são específicos por campeonato — não são reutilizados entre edições
- Times sem cor definida usam `#0088CC` para mandante e `#0D1117` para visitante como fallback na interface
- Cores funcionais (`#E87722`, `#E24B4A`, `#00CC88`) são proibidas como cor de time — têm significado semântico fixo na interface
- Um time não pode ser excluído se já tiver jogos cadastrados

**Critérios de aceite:**
- [ ] Time criado aparece na listagem do campeonato
- [ ] Time sem cor usa as cores de fallback corretas na súmula
- [ ] Tentativa de usar cor funcional como cor de time retorna erro de validação

---

### 3.2 Upload de Escudo/Logo

**Requisito:** O organizador deve conseguir fazer upload da logo do time, que será exibida na súmula, na landing page e no card de compartilhamento.

**Regras de negócio:**
- Formatos aceitos: PNG, JPG, WebP
- Tamanho máximo: 2 MB
- Armazenamento: cloud storage (Supabase Storage ou equivalente) com URL pública
- O arquivo é armazenado no path: `/championships/{championship_id}/teams/{team_id}/logo.{ext}`
- A logo não é armazenada no servidor de aplicação — apenas a URL é salva no banco

**Critérios de aceite:**
- [ ] Upload de PNG/JPG/WebP até 2 MB funciona e retorna URL pública
- [ ] Upload de arquivo acima de 2 MB retorna erro com mensagem clara
- [ ] Upload de formato não suportado retorna erro com mensagem clara
- [ ] A URL retornada é acessível publicamente sem autenticação
- [ ] Logo aparece na súmula e na landing page após upload

---

## 4. Gestão de Jogadores

### 4.1 Cadastro de Jogadores

**Requisito:** O organizador deve conseguir cadastrar, editar e listar jogadores vinculados a um time do campeonato.

**Campos:**
| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `full_name` | string | sim | Nome completo do jogador |
| `team_id` | uuid | sim | Time ao qual o jogador pertence |
| `status` | enum | auto | `ativo`, `suspenso`, `inativo` — inicia como `ativo` |

**Regras de negócio:**
- Jogadores não possuem conta/login no sistema
- Um jogador pertence a um único time no campeonato — não pode ser cadastrado em dois times simultaneamente
- Jogadores são específicos por campeonato — não são reutilizados entre edições
- Não há campo de posição no MVP

**Critérios de aceite:**
- [ ] Jogador criado aparece no elenco do time
- [ ] Tentativa de vincular o mesmo jogador a dois times retorna erro
- [ ] Status inicial é `ativo`

---

### 4.2 Vínculo Jogador → Time

**Requisito:** O vínculo entre jogador e time deve ser exclusivo por campeonato.

**Regras de negócio:**
- O organizador pode editar o time de um jogador — o jogador migra para o novo time e sai do anterior
- Não há duplicação: o jogador nunca aparece em dois times ao mesmo tempo
- A alteração de time não afeta registros históricos de súmulas já salvas

**Critérios de aceite:**
- [ ] Editar o time de um jogador move-o para o novo time
- [ ] Jogador não aparece mais no elenco do time anterior após a migração
- [ ] Súmulas salvas antes da migração mantêm o time original registrado

---

### 4.3 Status do Jogador

**Requisito:** O organizador deve conseguir alterar o status de um jogador entre `ativo`, `suspenso` e `inativo`.

**Regras de negócio:**
- Status `suspenso`: gera alerta visual na súmula quando o mesário tenta marcar o jogador como presente. O alerta não bloqueia a marcação — a decisão final é do mesário/organizador
- Status `inativo`: jogador não aparece na lista de presença da súmula
- O sistema gera alertas de suspensão automaticamente (ver módulo de cartões), mas a confirmação do status `suspenso` é sempre manual pelo organizador
- Alertas de suspensão gerados pelo sistema ficam pendentes até o organizador confirmar ou descartar

**Critérios de aceite:**
- [ ] Alterar status para `suspenso` exibe alerta na súmula ao marcar presença
- [ ] O alerta de suspensão não bloqueia a marcação de presença
- [ ] Jogador `inativo` não aparece na lista de presença da súmula
- [ ] Organizador pode confirmar ou descartar alertas de suspensão no painel

---

### 4.4 Histórico do Número da Camisa por Jogo

**Requisito:** O número da camisa do jogador é registrado por jogo na súmula — não é um campo global do cadastro do jogador.

**Regras de negócio:**
- O número de camisa é informado pelo mesário na tela pré-jogo para cada jogador presente
- O sistema pré-preenche com o último número registrado para aquele jogador no campeonato
- O mesário pode alterar o número a cada jogo
- O número de camisa é obrigatório para jogadores marcados como presentes antes de iniciar o cronômetro
- O campo deve ativar o teclado numérico nativo do dispositivo (`inputmode="numeric"`)
- O número de camisa é exibido ao lado do nome em todos os registros de evento da timeline e na súmula pública

**Modelo de dado:**
```
presence_record {
  scoresheet_id: uuid
  player_id: uuid
  jersey_number: integer  -- nulo se ausente
  present: boolean
  absence_type: 'justificada' | 'injustificada' | null
}
```

**Critérios de aceite:**
- [ ] Campo de camisa pré-preenchido com o último número usado no campeonato
- [ ] Campo vazio bloqueia o botão "Iniciar 1º Período" para o jogador presente
- [ ] Campo ativa teclado numérico nativo em dispositivos móveis
- [ ] Número da camisa aparece na timeline junto ao nome do jogador

---

## 5. Gestão de Rodadas e Jogos

### 5.1 Cadastro de Rodadas

**Requisito:** O organizador deve conseguir criar e gerenciar rodadas dentro do campeonato.

**Campos:**
| Campo | Tipo | Obrigatório |
|---|---|---|
| `championship_id` | uuid | sim |
| `number` | integer | sim |
| `label` | string | não | Ex: "Rodada 1", "Semifinal" |

**Critérios de aceite:**
- [ ] Rodada criada aparece na listagem do campeonato
- [ ] Rodadas são exibidas em ordem numérica

---

### 5.2 Cadastro de Jogos

**Requisito:** O organizador deve conseguir criar jogos dentro de uma rodada, definindo confronto, data, horário, local e participantes.

**Campos:**
| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `round_id` | uuid | sim | |
| `home_team_id` | uuid | sim | Time mandante |
| `away_team_id` | uuid | sim | Time visitante |
| `referee_user_id` | uuid | não | Mesário atribuído |
| `referee_name_text` | string | não | Árbitro — texto livre |
| `home_responsible` | string | não | Responsável time mandante — texto livre |
| `away_responsible` | string | não | Responsável time visitante — texto livre |
| `scheduled_at` | datetime | sim | Data e hora do jogo |
| `venue` | string | não | Local do jogo |
| `status` | enum | auto | Inicia como `agendado` |

---

### 5.3 Definição dos Confrontos

**Regras de negócio:**
- `home_team_id` e `away_team_id` devem ser times do mesmo campeonato
- Um time não pode jogar contra si mesmo
- Mesário pode ser atribuído no momento da criação ou posteriormente

**Critérios de aceite:**
- [ ] Jogo criado aparece na rodada correta
- [ ] Não é possível criar jogo com o mesmo time nos dois lados
- [ ] Times de campeonatos diferentes não podem ser confrontados

---

### 5.4 Status do Jogo

**Ciclo de vida:**

```
agendado → em_andamento → encerrado → editado
                ↑                        ↓
            reaberto ←─────────── (org. reabre)
                ↓
         (cancelado) → agendado
```

| Status | Descrição |
|---|---|
| `agendado` | Jogo criado, aguardando início |
| `em_andamento` | Súmula iniciada pelo mesário |
| `encerrado` | Súmula salva; dados publicados |
| `editado` | Súmula alterada pelo organizador após encerramento |
| `reaberto` | Organizador reabriu para o mesário operar novamente |

**Regras de transição:**
- `agendado → em_andamento`: apenas o mesário atribuído pode iniciar
- `em_andamento → encerrado`: apenas o mesário salva a súmula
- `encerrado → editado`: apenas o organizador edita
- `encerrado/editado → reaberto`: apenas o organizador reabre
- `reaberto → encerrado`: mesário salva novamente
- `em_andamento → agendado`: cancelamento pelo mesário com confirmação explícita (apaga a scoresheet)
- Organizador NÃO pode excluir jogo com súmula salva

**Critérios de aceite:**
- [ ] Apenas o mesário atribuído consegue iniciar a súmula
- [ ] Organizador não consegue iniciar ou operar a súmula
- [ ] Status é atualizado corretamente em cada transição
- [ ] Tentativa de excluir jogo com súmula salva retorna erro

---

### 5.5 Atribuição de Mesário

**Regras de negócio:**
- Apenas o organizador faz a atribuição
- Pode ser feita ao criar o jogo ou posteriormente
- Reatribuição é permitida enquanto o status for `agendado`
- Após o jogo estar `em_andamento`, a reatribuição exige que o jogo seja reaberto pelo organizador primeiro

**Critérios de aceite:**
- [ ] Atribuição e reatribuição funcionam para jogos `agendado`
- [ ] Mesário anterior não consegue acessar o jogo após reatribuição
- [ ] Novo mesário consegue acessar o jogo imediatamente após atribuição

---

### 5.6 Responsáveis dos Times e Árbitro

**Regras de negócio:**
- Árbitro: campo de texto livre, opcional. Não existe entidade "árbitro" no sistema — é apenas o nome digitado para aquele jogo
- Responsável de cada time: texto livre, opcional, por jogo
- O árbitro pode ser alterado pelo organizador enquanto o jogo estiver `agendado`; após isso, só via edição administrativa da súmula
- O responsável pode ser alterado pelo organizador a qualquer momento antes de salvar a súmula
- O mesário pode preencher/alterar o responsável de cada time na tela pré-jogo, antes de iniciar o cronômetro
- Após o cronômetro iniciado, o campo de responsável fica bloqueado para o mesário
- Campos não preenchidos simplesmente não aparecem na súmula ou no compartilhamento — sem placeholder ou campo em branco visível

**Critérios de aceite:**
- [ ] Árbitro e responsáveis aparecem na súmula quando preenchidos
- [ ] Árbitro e responsáveis não aparecem quando não preenchidos (sem campo vazio)
- [ ] Mesário consegue preencher responsável na tela pré-jogo
- [ ] Mesário não consegue alterar responsável após iniciar o cronômetro

---

## 6. Tela Pré-Jogo da Súmula

### Contexto
A tela pré-jogo é exibida ao mesário antes de iniciar o cronômetro do primeiro período. Nela, o mesário confirma os dados do confronto, gerencia presença, define números de camisa e escolhe o goleiro inicial de cada time.

### 6.1 Visualização do Confronto

**Requisito:** A tela pré-jogo deve exibir todas as informações do jogo antes do início.

**Informações exibidas:**
- Times (nome, badge com cor do time)
- Data, hora e local do jogo
- Modalidade e nome do campeonato
- Árbitro (se preenchido)
- Responsáveis de cada time (se preenchidos)
- Regulamento ativo: número de períodos, duração

**Critérios de aceite:**
- [ ] Todas as informações do jogo são exibidas corretamente
- [ ] Árbitro e responsáveis aparecem apenas quando preenchidos
- [ ] Regulamento do campeonato está visível (períodos, duração)

---

### 6.2 Lista de Jogadores e Controle de Presença

**Requisito:** O mesário deve conseguir marcar e desmarcar a presença de cada jogador, separados por time.

**Comportamento:**
- Estado inicial de todos os jogadores: **ausente**
- Marcar como presente (primeira vez): sem modal
- Desmarcar presença (jogador estava presente): exibe **modal de ausência**
- Jogadores com status `inativo` não aparecem na lista
- Jogadores com status `suspenso` aparecem com alerta visual (`⚠ suspenso`) e borda vermelha no toggle, mas o toggle não é bloqueado

**Modal de ausência:**
- Título: nome e número do jogador
- Opções: `Justificada` (fundo verde ao selecionar) / `Injustificada` (fundo vermelho ao selecionar)
- Botão "Confirmar ausência": desabilitado até uma opção ser selecionada
- Fechar o modal sem confirmar mantém o jogador como presente
- A classificação da ausência é registrada em `presence_record.absence_type`

**Critérios de aceite:**
- [ ] Estado inicial de todos os jogadores é ausente
- [ ] Marcar pela primeira vez não exibe modal
- [ ] Desmarcar jogador presente exibe modal de ausência
- [ ] Botão "Confirmar ausência" desabilitado sem seleção
- [ ] Fechar modal sem confirmar mantém jogador como presente
- [ ] Jogador suspenso exibe alerta visual mas pode ser marcado
- [ ] Jogador inativo não aparece na lista

---

### 6.3 Definição do Número da Camisa

**Requisito:** O mesário deve definir o número da camisa de cada jogador para aquele jogo específico.

**Comportamento:**
- O campo pré-preenche com o último número registrado para o jogador no campeonato
- O campo deve usar `inputmode="numeric"` para acionar teclado numérico nativo
- O número de camisa é exibido como círculo ao lado do nome do jogador na lista
- Jogadores ausentes exibem `—` no lugar do número

**Regra de bloqueio:**
> O botão "Iniciar 1º Período" fica **desabilitado** enquanto houver qualquer jogador marcado como **presente sem número de camisa preenchido**.
> Jogadores sem presença marcada (ausentes) NÃO bloqueiam o início.

**Critérios de aceite:**
- [ ] Campo pré-preenchido com último número do campeonato
- [ ] Campo ativa teclado numérico em mobile
- [ ] Botão de iniciar bloqueado com presente sem camisa
- [ ] Botão de iniciar liberado quando todos os presentes têm camisa
- [ ] Botão de iniciar liberado quando não há nenhum presente marcado
- [ ] Número exibido como círculo ao lado do nome

---

### 6.4 Definição do Goleiro Inicial

**Requisito:** O mesário deve definir o goleiro inicial de cada time antes de iniciar o cronômetro.

**Localização:** no cabeçalho de cada seção de time na lista de presença há um campo "Goleiro inicial".

**Comportamento:**
- O campo exibe uma lista dos jogadores **já marcados como presentes** naquele time
- Ao selecionar um jogador, ele recebe a tag `goleiro` na lista de presença
- Se nenhum jogador cadastrado puder ser o goleiro, o mesário pode registrar um **goleiro avulso** (ver seção 12.3)
- O goleiro inicial é obrigatório para salvar a súmula (mas não bloqueia o início do cronômetro)

**Critérios de aceite:**
- [ ] Campo "Goleiro inicial" aparece no cabeçalho de cada time
- [ ] Lista exibe apenas jogadores marcados como presentes
- [ ] Selecionar goleiro adiciona tag `goleiro` ao lado do nome
- [ ] Opção "+ Goleiro avulso" está disponível

---

### 6.5 Validação Antes do Início

**Requisito:** O sistema deve validar as condições mínimas antes de permitir o início do cronômetro.

**Única regra de bloqueio:**
> Todos os jogadores marcados como **presentes** devem ter o **número de camisa preenchido**.

**Regras que NÃO bloqueiam o início:**
- Não ter nenhum jogador marcado como presente
- Não ter goleiro inicial definido (obrigatório apenas para salvar, não para iniciar)
- Responsáveis dos times não preenchidos

**Critérios de aceite:**
- [ ] Início bloqueado apenas por presente sem camisa
- [ ] Início permitido sem nenhum presente marcado
- [ ] Início permitido sem goleiro inicial definido
- [ ] Indicador visual no botão mostra por que está bloqueado

---

## 7. Cronômetro da Súmula

### Contexto
O cronômetro é crescente, corre continuamente (sem pausas manuais) e é a referência temporal de todos os eventos registrados na súmula. Nunca é armazenado em segundos absolutos — apenas o timestamp de início de cada período é gravado; o tempo exibido é calculado no cliente como `now - period_started_at`.

### 7.1 Início de Período

**Requisito:** O mesário deve conseguir iniciar um período pressionando o botão "Iniciar [N]º Período".

**Comportamento:**
- Ao pressionar, o sistema grava `period_started_at = now()` no banco
- O cronômetro começa a exibir `00:00` e incrementa em tempo real
- O cronômetro é exibido em destaque máximo, sempre visível no topo da tela
- Após iniciar, o botão desaparece — não é possível "reiniciar" o período

**Dados gravados:**
```
scoresheet.period_started_at: timestamp
scoresheet.current_period: integer
scoresheet.status: 'em_andamento'
```

**Critérios de aceite:**
- [ ] Cronômetro inicia em 00:00 ao pressionar o botão
- [ ] Cronômetro incrementa continuamente sem pausas
- [ ] `period_started_at` é gravado no banco no momento exato do início
- [ ] Ao reabrir o app, o cronômetro exibe o tempo correto calculado a partir de `period_started_at`

---

### 7.2 Cronômetro Crescente

**Requisito:** O cronômetro conta de `00:00` em diante, sem possibilidade de pausa manual.

**Comportamento:**
- Formato de exibição: `MM:SS`
- Não há botão de pausa — o cronômetro corre continuamente até o mesário encerrar o período manualmente
- Ao reabrir o app após desconexão, o cronômetro é recalculado: `elapsed = now - period_started_at`

**Critérios de aceite:**
- [ ] Cronômetro não tem botão de pausa
- [ ] Formato exibido é `MM:SS`
- [ ] Recálculo correto após reabrir o app (ex: se period_started_at foi há 14min, exibe 14:XX)

---

### 7.3 Alertas de Fim de Período

**Requisito:** Ao atingir a duração configurada no regulamento, o sistema deve alertar o mesário — mas o cronômetro continua rodando para cobrir acréscimos.

**Comportamento ao atingir `period_duration_min`:**
- Alerta visual: cronômetro muda para cor de destaque vermelho (`#E24B4A`)
- Alerta sonoro: beep (usando Web Audio API ou arquivo de áudio)
- O cronômetro continua incrementando além do tempo configurado
- O alerta visual permanece até o período ser encerrado

**Critérios de aceite:**
- [ ] Alerta visual dispara exatamente ao atingir `period_duration_min`
- [ ] Alerta sonoro dispara junto com o visual
- [ ] Cronômetro continua após o alerta (não para)
- [ ] Alerta visual permanece até o encerramento manual

---

### 7.4 Encerramento Manual

**Requisito:** O mesário deve encerrar o período pressionando "Encerrar Período", com confirmação para evitar acionamento acidental.

**Fluxo:**
1. Mesário pressiona "Encerrar Período"
2. Sistema exibe dialog de confirmação:
   - Título: "Encerrar [N]º período?"
   - Corpo: minutagem atual + tempo de acréscimo se houver (ex: "21:14 — 1:14 de acréscimo")
   - Aviso de irreversibilidade
   - Botões: "Cancelar" (neutro) e "Encerrar" (vermelho `#E24B4A`)
3. Ao confirmar:
   - Sistema grava o evento `fim_periodo` na timeline com a minutagem exata
   - Cronômetro para
   - Se houver mais períodos: exibe botão "Iniciar Intervalo"
   - Se for o último período: verifica condição de pênaltis ou vai para revisão

**Dados gravados:**
```
timeline_event {
  type: 'fim_periodo',
  clock_label: '21:14',
  period: N
}
```

**Critérios de aceite:**
- [ ] Dialog de confirmação exibe minutagem atual
- [ ] Dialog exibe tempo de acréscimo quando houver
- [ ] Confirmação grava evento `fim_periodo` na timeline
- [ ] Cancelamento fecha o dialog sem alterar nada

---

### 7.5 Controle de Intervalo

**Requisito:** Entre períodos, o sistema deve gerenciar o estado de intervalo antes de permitir iniciar o próximo período.

**Comportamento:**
- Após encerrar o período (quando houver mais períodos): botão "Iniciar Intervalo" aparece
- Durante o intervalo: cronômetro exibe `00:00` parado — não há cronômetro de intervalo
- O mesário inicia o próximo período quando quiser — sem obrigação de respeitar `interval_duration_min`
- `interval_duration_min` é apenas informativo na tela

**Critérios de aceite:**
- [ ] Botão "Iniciar Intervalo" aparece após encerrar um período não-final
- [ ] Cronômetro exibe `00:00` durante o intervalo
- [ ] Botão "Iniciar [N+1]º Período" aparece após clicar em "Iniciar Intervalo"

---

### 7.6 Controle de Períodos

**Requisito:** O sistema deve controlar o ciclo de períodos conforme configurado no regulamento.

**Regras:**
- `num_periods` define quantos períodos o jogo tem
- Após encerrar o último período, não há "Iniciar Intervalo" — o sistema verifica condição de pênaltis
- O mesário pode reabrir o período mais recente encerrado (desfazer encerramento acidental)
- Apenas o período mais recente pode ser reaberto; períodos anteriores são imutáveis

**Reabertura de período:**
- Disponível via botão "Reabrir período" na tela pós-encerramento, antes de iniciar o próximo período ou o intervalo
- Ao reabrir: o evento `fim_periodo` é removido da timeline e o cronômetro é retomado

**Critérios de aceite:**
- [ ] Sistema controla o número correto de períodos conforme regulamento
- [ ] Após o último período, não aparece "Iniciar Intervalo"
- [ ] Botão "Reabrir período" disponível após encerrar um período
- [ ] Reabertura remove o evento `fim_periodo` da timeline e retoma o cronômetro

---

## 8. Timeline de Eventos

### Contexto
A timeline é a fonte de verdade de tudo que acontece no jogo. Placar, artilharia, contadores e tabelas são **derivados** dos eventos da timeline — nunca de campos separados. Todo evento é persistido imediatamente no banco, não dependendo do salvamento final da súmula.

### 8.1 Estrutura da Timeline

**Modelo de evento:**
```typescript
timeline_event {
  id: uuid
  scoresheet_id: uuid
  type: EventType
  clock_label: string        // ex: "14:32" — imutável após registro
  player_id?: uuid           // nullable para alguns tipos
  team_id: uuid
  secondary_player_id?: uuid // para substituições (jogador que entra)
  period: integer
  recorded_at: timestamp     // momento real do registro
}

type EventType =
  | 'gol'
  | 'gol_contra'
  | 'cartao_amarelo'
  | 'cartao_vermelho'
  | 'cartao_azul'
  | 'falta'
  | 'substituicao'
  | 'troca_goleiro'
  | 'inicio_periodo'
  | 'fim_periodo'
```

**Critérios de aceite:**
- [ ] Todo evento é persistido no banco imediatamente ao ser registrado
- [ ] Eventos são associados ao período correto
- [ ] `clock_label` é gravado no momento do registro e não pode ser alterado

---

### 8.2 Registro Automático de Minutagem

**Requisito:** A minutagem de cada evento é capturada automaticamente no momento do toque do mesário.

**Regras:**
- `clock_label` = valor atual do cronômetro no momento do registro (ex: `"14:32"`)
- A minutagem é **imutável** — não pode ser editada após o registro
- Para corrigir uma minutagem errada, o mesário deve excluir o evento e registrar novamente

**Critérios de aceite:**
- [ ] `clock_label` captura o valor exato do cronômetro no momento do registro
- [ ] Campo `clock_label` não é editável via UI ou API após o registro
- [ ] Exclusão e recriação do evento resulta no novo `clock_label`

---

### 8.3 Ordenação Cronológica

**Requisito:** A timeline exibe os eventos em ordem cronológica reversa (mais recente primeiro) na súmula, e em ordem cronológica (mais antigo primeiro) na súmula pública.

**Critérios de aceite:**
- [ ] Tela da súmula: evento mais recente no topo
- [ ] Súmula pública: evento mais antigo no topo
- [ ] Eventos do mesmo `clock_label` são ordenados por `recorded_at`

---

### 8.4 Edição de Eventos

**Requisito:** O mesário pode editar qualquer evento da timeline enquanto a súmula não foi salva.

**O que pode ser editado:**
- Jogador (ex: trocar o autor do gol)
- Time (quando aplicável)
- Tipo de evento (ex: gol → gol contra)

**O que NÃO pode ser editado:**
- `clock_label` (minutagem) — é imutável
- `period` — o período do evento é fixo

**Efeito da edição:**
- O impacto derivado é recalculado: ex: trocar o jogador de um gol atualiza a artilharia na tela
- Se o evento editado era um cartão que gerou vermelho automático, o vermelho automático é atualizado junto

**Critérios de aceite:**
- [ ] Jogador e time de um evento podem ser alterados antes do salvamento
- [ ] Minutagem não aparece como campo editável
- [ ] Edição de gol recalcula o placar na tela imediatamente
- [ ] Edição de cartão recalcula alertas de suspensão

---

### 8.5 Exclusão de Eventos

**Requisito:** O mesário pode excluir qualquer evento da timeline enquanto a súmula não foi salva.

**Regras:**
- Exclusão de gol → placar decrementado automaticamente
- Exclusão do 2º cartão amarelo que havia gerado vermelho automático → o vermelho automático também é excluído
- Exclusão de evento de início/fim de período não é permitida via UI (são gerenciados pelo sistema)
- Ao excluir, não há confirmação extra — a ação pode ser desfeita adicionando um novo evento

**Critérios de aceite:**
- [ ] Qualquer evento pode ser excluído antes do salvamento
- [ ] Exclusão de gol decrementa o placar imediatamente
- [ ] Exclusão do 2º amarelo remove o vermelho automático
- [ ] Eventos de início/fim de período não têm botão de exclusão

---

## 9. Registro de Gol

### 9.1 Gol Normal

**Requisito:** O mesário deve conseguir registrar um gol para um jogador de um time.

**Fluxo (máximo 3 toques):**
1. Toque em "Gol" no card do time que marcou
2. Selecionar o jogador na lista dos presentes
3. Confirmar (ou confirmação automática com o toque no jogador)

**Evento gerado:**
```
{ type: 'gol', team_id: X, player_id: Y, clock_label: '14:32', period: 1 }
```

**Critérios de aceite:**
- [ ] Fluxo completo em no máximo 3 toques
- [ ] Lista exibe apenas jogadores presentes do time selecionado
- [ ] Evento aparece na timeline imediatamente

---

### 9.2 Gol Contra

**Requisito:** O mesário deve conseguir registrar um gol contra, onde o jogador selecionado pertence ao time que cometeu o gol contra.

**Regras:**
- O ponto é contabilizado para o time adversário
- Gol contra **não conta** para a artilharia do jogador
- Conta como gol sofrido para o time do jogador e gol marcado para o adversário
- Na timeline aparece como `gol_contra` com o nome do jogador e o time que cometeu

**Evento gerado:**
```
{ type: 'gol_contra', team_id: time_que_cometeu, player_id: Y, clock_label: '08:10', period: 1 }
```

**Impacto no placar:**
- `home_score` ou `away_score` é incrementado para o time ADVERSÁRIO ao `team_id` do evento

**Critérios de aceite:**
- [ ] Ponto vai para o time adversário ao selecionado
- [ ] Jogador não aparece na artilharia pelo gol contra
- [ ] Timeline exibe claramente "Gol contra — [jogador] — [time]"

---

### 9.3 Atualização de Placar

**Requisito:** O placar deve ser atualizado instantaneamente na tela da súmula e transmitido em tempo real para a landing page.

**Regras:**
- O placar é derivado dos eventos `gol` e `gol_contra` da timeline — não é armazenado como campo independente calculado manualmente
- `home_score` e `away_score` no `scoresheet` são campos calculados e atualizados a cada evento
- Atualização via SSE para a landing page: latência máxima de 3 segundos

**Evento SSE emitido:**
```json
{ "type": "match.score", "home_score": 1, "away_score": 0 }
```

**Critérios de aceite:**
- [ ] Placar atualiza imediatamente na tela da súmula após registro
- [ ] Landing page recebe atualização em até 3 segundos
- [ ] Excluir um gol decrementa o placar imediatamente

---

## 10. Registro de Cartões

### 10.1 Cartão Amarelo

**Requisito:** O mesário deve conseguir registrar cartão amarelo para um jogador.

**Evento gerado:**
```
{ type: 'cartao_amarelo', team_id: X, player_id: Y, clock_label: '...', period: N }
```

**Critérios de aceite:**
- [ ] Cartão aparece na timeline com minutagem
- [ ] Tabela de cartões é atualizada em tempo real
- [ ] Evento SSE emitido para atualização da landing page

---

### 10.2 Cartão Vermelho

**Evento gerado:**
```
{ type: 'cartao_vermelho', team_id: X, player_id: Y, clock_label: '...', period: N }
```

**Regra automática:**
- Ao registrar cartão vermelho direto: sistema gera alerta de suspensão para o jogo seguinte
- O alerta é exibido para o mesário na tela da súmula e fica pendente no painel do organizador

**Critérios de aceite:**
- [ ] Cartão vermelho gera alerta de suspensão imediatamente
- [ ] Alerta exibido na tela da súmula para o mesário
- [ ] Alerta fica pendente no painel do organizador para confirmação

---

### 10.3 Cartão Azul

**Requisito:** Disponível apenas quando `card_types = com_azul` no regulamento. Comportamento varia conforme `card_blue_mode`.

**Modo `temporario`:**
- Sistema exibe alert na tela com o tempo de exclusão configurado (ex: "2 minutos de exclusão — #9 João")
- O controle do tempo de exclusão é responsabilidade do mesário/árbitro — o sistema não conta o tempo automaticamente

**Modo `definitivo_sub`:**
- Sistema exibe alert: "Jogador retirado. O time tem direito a substituição. Registre a substituição na súmula."
- O mesário deve registrar manualmente a substituição

**Critérios de aceite:**
- [ ] Botão de cartão azul não aparece quando `card_types = amarelo_vermelho`
- [ ] Modo `temporario`: exibe tempo de exclusão configurado
- [ ] Modo `definitivo_sub`: exibe instrução de substituição

---

### 10.4 Regra de Dois Amarelos

**Requisito:** Ao registrar o 2º cartão amarelo para o mesmo jogador no mesmo jogo, o sistema deve automaticamente registrar um cartão vermelho.

**Fluxo automático:**
1. Mesário registra 2º cartão amarelo para jogador X
2. Sistema detecta que X já tem 1 amarelo neste jogo
3. Sistema gera automaticamente um evento `cartao_vermelho` na timeline
4. Sistema exibe notificação para o mesário: "Vermelho automático — [nome do jogador]"
5. Sistema gera alerta de suspensão

**Efeito na exclusão:**
- Se o mesário excluir o 2º amarelo da timeline, o vermelho automático também é removido

**Critérios de aceite:**
- [ ] 2º amarelo dispara criação automática de vermelho
- [ ] Notificação exibida ao mesário
- [ ] Excluir 2º amarelo remove o vermelho automático junto
- [ ] Alerta de suspensão gerado

---

### 10.5 Alertas Automáticos de Suspensão

**Requisito:** O sistema deve gerar alertas de suspensão nas seguintes situações.

**Gatilhos:**
1. Cartão vermelho direto (ao registrar)
2. 2 cartões amarelos no mesmo jogo → vermelho automático (ao registrar)
3. Acúmulo de amarelos atingindo `yellow_accumulation_limit` (verificado ao salvar a súmula)

**Modelo:**
```
suspension_log {
  id: uuid
  player_id: uuid
  championship_id: uuid
  reason: 'vermelho_direto' | 'dois_amarelos' | 'acumulo_amarelos'
  source_match_id: uuid
  confirmed: boolean  // false = pendente, true = confirmado pelo org.
  created_at: timestamp
}
```

**Regras:**
- Alertas são informativos — não bloqueiam nenhuma ação
- O organizador confirma ou descarta cada alerta manualmente
- Ao confirmar: status do jogador muda para `suspenso`
- Ao descartar: status permanece `ativo`

**Critérios de aceite:**
- [ ] Alertas 1 e 2 gerados imediatamente ao registrar o evento
- [ ] Alerta 3 gerado ao salvar a súmula
- [ ] Alertas aparecem no painel do organizador
- [ ] Organizador pode confirmar (→ `suspenso`) ou descartar (→ mantém `ativo`)
- [ ] Alertas não bloqueiam nenhuma ação no sistema

---

## 11. Registro de Faltas

### 11.1 Registro de Faltas

**Requisito:** O mesário deve conseguir registrar faltas, com o jogador sendo opcional.

**Evento gerado:**
```
{ type: 'falta', team_id: X, player_id: Y|null, clock_label: '...', period: N }
```

**Critérios de aceite:**
- [ ] Falta pode ser registrada sem selecionar jogador
- [ ] Evento aparece na timeline com minutagem
- [ ] Falta não impacta nenhuma tabela diretamente

---

### 11.2 Contador de Faltas por Time

**Requisito:** Quando `foul_free_kick_enabled = true`, a súmula exibe dois contadores independentes de faltas por time.

**Comportamento visual:**
| Faltas do time | Estado visual |
|---|---|
| 0–3 | Neutro (cinza) |
| 4 | Destaque laranja (`#E87722`) + texto "próxima = tiro livre" |
| ≥ 5 | Alerta vermelho (`#E24B4A`) + texto "TIRO LIVRE !" |

**Regras:**
- Contadores ficam acima dos cards de ação na tela principal da súmula
- O alerta é visual — não bloqueia nenhuma ação
- Cada contador é zerado individualmente ao início de cada período
- Quando `foul_free_kick_enabled = false`: contadores não aparecem na tela

**Critérios de aceite:**
- [ ] Dois contadores independentes (um por time) visíveis quando habilitado
- [ ] Transição visual correta em 4 e 5 faltas
- [ ] Contadores zerados ao início de cada período
- [ ] Contadores não aparecem quando `foul_free_kick_enabled = false`

---

### 11.3 Contador de Faltas por Jogador

**Requisito:** Quando `foul_individual_enabled = true`, a súmula exibe um painel com o contador de faltas de cada jogador.

**Comportamento visual:**
- Painel sempre visível durante o jogo (não é uma aba — fica na tela principal)
- Exibe: número da camisa, nome do jogador, total de faltas no jogo
- Destaque progressivo ao se aproximar do limite (`foul_individual_limit`)
- Alerta imediato ao atingir o limite

**Regras:**
- O alerta é visual — não remove o jogador automaticamente
- O painel exibe jogadores de ambos os times
- Quando `foul_individual_enabled = false`: painel não aparece

**Critérios de aceite:**
- [ ] Painel visível durante o jogo quando habilitado
- [ ] Destaque progressivo ao se aproximar do limite
- [ ] Alerta ao atingir o limite
- [ ] Painel não aparece quando `foul_individual_enabled = false`

---

## 12. Gestão de Goleiros

### 12.1 Seleção do Goleiro Inicial

**Requisito:** O goleiro inicial de cada time é definido na tela pré-jogo, dentro da aba de presença.

**Localização:** cabeçalho de cada seção de time na lista de presença.

**Campo "Goleiro inicial":**
- Exibe lista dos jogadores **marcados como presentes** no time
- Ao selecionar, o jogador recebe tag `goleiro` na lista
- O campo é atualizado dinamicamente: se um jogador é desmarcado da presença, sai das opções
- O goleiro inicial é obrigatório para **salvar** a súmula — bloqueia o botão "Salvar Súmula" se não definido

**Critérios de aceite:**
- [ ] Apenas presentes aparecem nas opções de goleiro
- [ ] Tag `goleiro` aparece ao lado do nome selecionado
- [ ] Se goleiro é desmarcado da presença, o campo de goleiro é resetado
- [ ] Salvamento bloqueado sem goleiro definido para cada time

---

### 12.2 Troca de Goleiro

**Requisito:** Durante o jogo, o mesário pode trocar o goleiro de um time tocando no ícone de edição ao lado do nome do goleiro atual no card do time.

**Interação:**
- O card de cada time exibe: `#[número] [Nome] ✎`
- Ao tocar no ícone, abre o seletor de goleiro com:
  - Lista de jogadores presentes do time (exceto o goleiro atual, que já está selecionado)
  - Opção "+ Goleiro avulso"
- Ao selecionar novo goleiro, o sistema registra o evento na timeline

**Evento gerado:**
```
{ type: 'troca_goleiro', team_id: X, player_id: novo_goleiro, clock_label: '31:00', period: N }
```

**Cálculo de tempo:**
- O sistema calcula automaticamente o tempo jogado por cada goleiro:
  - Goleiro inicial: de `00:00` até a primeira troca (ou até o fim do jogo)
  - Goleiro após troca: do `clock_label` da troca até a próxima troca ou fim do jogo
- Usado na fórmula `por_minuto` do ranking de goleiro menos vazado

**Critérios de aceite:**
- [ ] Ícone de edição visível ao lado do nome do goleiro no card
- [ ] Seletor abre com jogadores presentes do time
- [ ] Evento `troca_goleiro` registrado na timeline com minutagem
- [ ] Tempo de cada goleiro calculado corretamente

---

### 12.3 Goleiro Avulso

**Requisito:** Quando o time precisar usar um goleiro não cadastrado no campeonato, o mesário pode registrá-lo como avulso.

**Campos do formulário de goleiro avulso:**
- Nome (texto livre, obrigatório)
- Número da camisa (numérico, obrigatório)

**Disponível em:**
- Campo "Goleiro inicial" na tela pré-jogo
- Seletor de troca de goleiro durante o jogo

**Regras:**
- O goleiro avulso é identificado na timeline e na súmula com a tag `[avulso]`: ex: `#12 Rafael [avulso]`
- Goleiro avulso **não entra** no ranking de goleiro menos vazado — seus gols sofridos ficam apenas na súmula do jogo
- Cada registro avulso é independente por jogo — mesmo nome em jogos diferentes não é considerado a mesma pessoa
- O organizador pode editar nome e camisa do avulso após a súmula salva, sem impacto em tabelas

**Modelo:**
```
// Armazenado como campo especial no scoresheet ou como player_id=null com campos extra
scoresheet.home_goalkeeper_player_id: uuid | null  // null se avulso
scoresheet.home_goalkeeper_avulso_name: string | null
scoresheet.home_goalkeeper_avulso_jersey: integer | null
```

**Critérios de aceite:**
- [ ] Formulário de goleiro avulso acessível nos dois pontos de seleção
- [ ] Tag `[avulso]` exibida ao lado do nome na súmula
- [ ] Goleiro avulso não aparece no ranking de goleiro menos vazado
- [ ] Organizador pode editar nome/camisa do avulso pós-salvamento
- [ ] Dois registros avulsos com o mesmo nome são tratados como pessoas diferentes

---

### 12.4 Registro na Timeline

**Regras gerais de goleiro na timeline:**
- Evento `inicio_periodo` registra implicitamente o goleiro ativo no início de cada período
- Evento `troca_goleiro` registra explicitamente a troca
- Se nenhuma troca for registrada, o sistema assume que o goleiro inicial jogou o período inteiro
- Fórmula `por_minuto`: tempo_goleiro = soma de (clock_label_fim - clock_label_inicio) para cada intervalo

**Critérios de aceite:**
- [ ] Sem troca: goleiro inicial é considerado por todo o jogo
- [ ] Com trocas: tempo calculado corretamente para cada goleiro
- [ ] Cálculo correto mesmo com múltiplas trocas no mesmo período

---

## 13. Substituições

### 13.1 Registro de Entrada/Saída

**Requisito:** O mesário deve conseguir registrar substituições (saída de um jogador, entrada de outro do mesmo time).

**Fluxo:**
1. Toque em "Subst." no card do time
2. Selecionar jogador que sai (lista dos presentes do time)
3. Selecionar jogador que entra (lista dos presentes do time, exceto o que sai)
4. Confirmar

**Evento gerado:**
```
{
  type: 'substituicao',
  team_id: X,
  player_id: jogador_que_sai,
  secondary_player_id: jogador_que_entra,
  clock_label: '38:22',
  period: N
}
```

**Regras:**
- Ambos os jogadores devem ser do mesmo time
- Não há limite de substituições no MVP
- Substituições são informativas — não impactam artilharia, cartões ou classificação

**Critérios de aceite:**
- [ ] Evento registrado com jogador que sai e que entra
- [ ] Ambos os jogadores são do mesmo time
- [ ] Substituição aparece na timeline com minutagem
- [ ] Não há validação de limite de substituições

---

### 13.2 Timeline de Substituições

**Exibição na timeline:**
```
38:22' — Substituição — Sai: #9 João | Entra: #11 Pedro — Leões FC
```

**Exibição na súmula pública:**
- Mesmo formato, na seção de elenco: `Saiu: #7 João | Entrou: #11 Pedro — 32'`

**Critérios de aceite:**
- [ ] Formato correto na timeline da súmula
- [ ] Formato correto na súmula pública e no compartilhamento

---

### 13.3 Exclusão de Substituição

**Requisito:** O mesário pode excluir uma substituição registrada por engano, antes de salvar a súmula.

**Regras:**
- Ao excluir: evento desaparece da timeline
- Nenhum impacto em tabelas (substituições são informativas)
- Não há confirmação extra para exclusão de substituição

**Critérios de aceite:**
- [ ] Exclusão remove o evento da timeline sem confirmação extra
- [ ] Nenhuma tabela é afetada pela exclusão

---

## 14. Modal de Pênaltis

### 14.1 Abertura Automática

**Requisito:** O modal de pênaltis deve abrir automaticamente quando duas condições são simultaneamente verdadeiras ao encerrar o último período.

**Condições:**
1. `penalties_enabled = true` no regulamento
2. Placar empatado ao fim do tempo regulamentar (`home_score === away_score`)

**Se apenas uma condição for verdadeira:** modal não é exibido — vai direto para a tela de revisão.

**Critérios de aceite:**
- [ ] Modal abre automaticamente com empate + pênaltis habilitados
- [ ] Modal não abre com placar diferente, mesmo com pênaltis habilitados
- [ ] Modal não abre com placar empatado, se pênaltis não habilitados

---

### 14.2 Registro de Cobranças

**Requisito:** O mesário registra cada cobrança sequencialmente: time cobrador → jogador → resultado.

**Sequência:**
- Cobranças são alternadas entre os times (A1, B1, A2, B2, ...)
- O sistema controla a sequência automaticamente — o mesário não escolhe qual time cobra
- Lista de jogadores disponíveis: apenas os marcados como **presentes** naquele jogo
- Se o cobrador não estiver na lista: o mesário deve sair do modal, marcar presença do jogador (com camisa), e retornar — **o estado do modal é preservado**

**Visual do modal:**
- Placar parcial da disputa em destaque (atualiza a cada cobrança)
- Grid de cobranças por time: `✓` (verde = convertida), `✗` (vermelho = errada), borda verde (cobrança atual), cinza (futuras)
- Rótulo da cobrança atual: ex: `"3ª cobrança — Leões FC"`
- Seletor de jogador cobrador
- Botões: "Converteu" (verde) e "Errou" (vermelho)
- Botão "Desfazer última cobrança" (largura total, abaixo dos botões de resultado)

**Evento gerado para cada cobrança:**
```
penalty_kick {
  penalty_shoot_id: uuid,
  team_id: X,
  player_id: Y,
  kick_order: N,
  converted: boolean
}
```

**Critérios de aceite:**
- [ ] Sequência alternada controlada pelo sistema
- [ ] Apenas presentes disponíveis como cobradores
- [ ] Estado do modal preservado ao sair para marcar presença
- [ ] Grid visual atualiza a cada cobrança registrada

---

### 14.3 Controle de Resultado

**Requisito:** O resultado de cada cobrança é "Converteu" ou "Errou".

**Regras:**
- Gols de pênalti NÃO contam para artilharia individual
- Gols de pênalti NÃO alteram o placar do tempo regulamentar
- O resultado da disputa é armazenado separadamente: `penalty_shoot.home_score / away_score`

**Critérios de aceite:**
- [ ] Placar do tempo regulamentar não é alterado
- [ ] Artilharia não registra gols de pênalti da disputa
- [ ] `penalty_shoot` armazena o placar da disputa separadamente

---

### 14.4 Desfazer Cobrança

**Requisito:** O mesário pode desfazer a última cobrança registrada enquanto a disputa ainda estiver em andamento.

**Comportamento:**
- Botão "Desfazer última cobrança" disponível enquanto houver cobranças registradas
- Ao desfazer: o `penalty_kick` mais recente é removido
- O grid visual reverte para o estado anterior
- O placar da disputa é recalculado

**Critérios de aceite:**
- [ ] Botão disponível enquanto houver cobranças registradas
- [ ] Desfazer remove a última cobrança e reverte o estado visual
- [ ] Placar da disputa recalculado após desfazer

---

### 14.5 Encerramento da Disputa

**Requisito:** Após o número configurado de cobranças por time, o sistema calcula o vencedor e exibe o resultado.

**Comportamento:**
- Ao registrar a última cobrança prevista: sistema calcula automaticamente o vencedor
- Banner de resultado: `"[Time] vence nos pênaltis: X x Y"`
- Botão "Confirmar resultado" fecha o modal e abre a tela de revisão

**Impacto na classificação:**
- Ambos os times recebem `E` (empate) na coluna de empates
- Vencedor recebe `EP` + `points_penalty_win` pontos
- Perdedor recebe `DP` + `points_penalty_loss` pontos
- O critério de desempate "número de vitórias" NÃO conta vitórias por pênaltis

**Exibição pública:**
- Placar: `"1 x 1 (4 x 3 nos pênaltis)"`
- Sequência completa de cobranças com cobrador e resultado

**Critérios de aceite:**
- [ ] Banner de resultado exibido ao finalizar todas as cobranças
- [ ] Classificação atualizada com EP/DP e pontuação correta
- [ ] Vitórias por pênaltis não contam no critério "número de vitórias"
- [ ] Súmula pública exibe formato correto com placar e sequência

---

## 15. Revisão e Encerramento da Súmula

### 15.1 Tela de Revisão

**Requisito:** Após encerrar o último período (ou confirmar os pênaltis), o mesário acessa a tela de revisão antes de salvar.

**Informações exibidas:**
- Placar final do tempo regulamentar
- Resultado dos pênaltis (se houver)
- Árbitro (se preenchido)
- Responsáveis de cada time (se preenchidos)
- Timeline completa de eventos
- Lista de presença com números de camisa
- Cartões aplicados
- Goleiros de cada time

**Critérios de aceite:**
- [ ] Todas as informações listadas são exibidas
- [ ] Campos não preenchidos (árbitro, responsáveis) não aparecem

---

### 15.2 Conferência de Eventos

**Requisito:** Na tela de revisão, o mesário pode voltar para registrar mais eventos ou corrigir a timeline.

**Regras:**
- Botão "Voltar" na tela de revisão retorna para o estado `periodo_em_andamento`
- O jogo ainda não está encerrado — o mesário pode registrar eventos adicionais
- Após voltar, o mesário precisa novamente encerrar o período e acessar a revisão

**Critérios de aceite:**
- [ ] Botão "Voltar" disponível na tela de revisão
- [ ] Retorno à tela principal permite registro de novos eventos
- [ ] O estado da súmula é preserved corretamente após a volta

---

### 15.3 Registro de Ocorrência

**Requisito:** O mesário pode opcionalmente registrar uma ocorrência antes de salvar.

**Campos:**
- Tipo/categoria: lista pré-definida — `briga`, `lesao`, `invasao_campo`, `outros`
- Jogadores envolvidos: seleção múltipla opcional da lista de jogadores do jogo
- Descrição: texto livre

**Regras:**
- Ocorrência é opcional — não é obrigatória para salvar
- Ocorrência é **privada** — visível apenas para o organizador no painel administrativo
- Ocorrência NÃO aparece na landing page pública nem no compartilhamento

**Modelo:**
```
occurrence {
  id: uuid
  scoresheet_id: uuid
  type: 'briga' | 'lesao' | 'invasao_campo' | 'outros'
  description: text
  players_involved: uuid[]  // nullable
  recorded_at: timestamp
}
```

**Critérios de aceite:**
- [ ] Registro de ocorrência é opcional
- [ ] Ocorrência não aparece na súmula pública nem no compartilhamento
- [ ] Organizador consegue ver ocorrências no painel

---

### 15.4 Salvamento da Súmula

**Requisito:** O mesário deve confirmar o salvamento com um dialog de confirmação, pois a ação é irreversível para o mesário.

**Pré-condições para salvar:**
- Goleiro de cada time deve estar definido (cadastrado ou avulso)
- (Todas as outras validações já foram feitas no pré-jogo)

**Fluxo:**
1. Mesário pressiona "Salvar Súmula"
2. Dialog de confirmação (mesmo padrão do encerramento de período)
3. Ao confirmar:
   - `scoresheet.status = 'salvo'`
   - `scoresheet.saved_at = now()`
   - `match.status = 'encerrado'`
   - Sistema verifica acúmulo de amarelos e gera alertas de suspensão pendentes
   - Sistema dispara geração do card visual (job assíncrono)
   - Sistema exibe opção de compartilhamento nativo

**Critérios de aceite:**
- [ ] Salvamento bloqueado sem goleiro definido para cada time
- [ ] Dialog de confirmação exibido antes de salvar
- [ ] Status do jogo muda para `encerrado` após salvamento
- [ ] Alertas de acúmulo de amarelos gerados ao salvar
- [ ] Job de geração de card visual disparado

---

### 15.5 Bloqueio Pós-Salvamento

**Requisito:** Após salvar a súmula, o mesário não pode mais editar nada — apenas o organizador pode.

**Regras:**
- Mesário perde acesso de edição à súmula após salvar
- O organizador pode editar qualquer campo via painel administrativo
- O organizador pode reabrir o jogo para o mesário operar novamente (`status = reaberto`)
- Edições pelo organizador recalculam todas as tabelas derivadas imediatamente
- Toda edição é registrada em `scoresheet.edit_log` com data, hora e autor

**Critérios de aceite:**
- [ ] Mesário não consegue editar a súmula após salvar
- [ ] Organizador consegue editar qualquer campo
- [ ] Edição recalcula tabelas imediatamente
- [ ] `edit_log` registra data, hora e autor de cada edição

---

## 16. Compartilhamento da Súmula

### 16.1 Geração da Súmula Final

**Requisito:** Ao salvar a súmula, o sistema gera automaticamente o conteúdo de compartilhamento: um card visual (PNG) e um documento de texto estruturado.

**Timing:**
- Geração do card visual: job assíncrono disparado ao salvar, disponível em até 5 segundos
- Documento de texto: gerado síncronamente ao salvar, disponível imediatamente

**Conteúdo do documento de texto (seções em ordem):**
1. Cabeçalho: campeonato, rodada, data, hora, local (se preenchido)
2. Árbitro (apenas se preenchido)
3. Responsáveis dos times (apenas se preenchidos)
4. Placar: `X x Y` ou `X x Y (P x P nos pênaltis)`
5. Elenco presente por time: `#[camisa] [nome]` + goleiro identificado + substituições
6. Timeline: `[minuto]' — [tipo] — [#camisa nome] — [time]`
7. Pênaltis (apenas se houve): sequência com cobrador e resultado
8. Resumo de cartões por time

**Regra importante:** Qualquer dado ausente (árbitro, responsável, local) simplesmente não aparece — sem placeholder ou campo em branco.

**Critérios de aceite:**
- [ ] Documento gerado com todas as seções obrigatórias
- [ ] Campos não preenchidos não geram linhas vazias no documento
- [ ] Card visual gerado em até 5 segundos após salvamento
- [ ] Fallback se card demorar mais de 5s: exibe link copiável da súmula

---

### 16.2 Compartilhamento Nativo

**Requisito:** Após salvar, o sistema aciona a Web Share API do dispositivo para compartilhamento nativo.

**Comportamento:**
- O menu de compartilhamento do SO é acionado automaticamente
- Conteúdo compartilhado: card visual (PNG) + documento de texto
- O compartilhamento é opcional — o mesário pode fechar sem compartilhar
- **Fallback** para browsers sem suporte à Web Share API: exibe link copiável da súmula pública

**Critérios de aceite:**
- [ ] Web Share API acionada automaticamente ao salvar
- [ ] Menu de compartilhamento do SO é aberto
- [ ] Falhar silenciosamente e exibir link copiável quando API não disponível
- [ ] O mesmo conteúdo fica acessível permanentemente via link da súmula na landing page

---

### 16.3 Documento Estruturado

**Formato das linhas da timeline no documento:**
```
14:32' — Gol — #9 João — Leões FC
08:10' — Gol contra — #5 Pedro — Tigres EC
22:15' — Cartão amarelo — #7 André — Leões FC
38:22' — Substituição — Sai: #9 João | Entra: #11 Bruno — Leões FC
31:00' — Troca de goleiro — Sai: #1 Carlos | Entra: #22 Rafael — Leões FC
```

**Critérios de aceite:**
- [ ] Formato correto para cada tipo de evento
- [ ] Gol contra identificado explicitamente
- [ ] Substituições e trocas de goleiro com jogadores que saem e entram
- [ ] 2 amarelos → vermelho automático indicados explicitamente no resumo de cartões

---

### 16.4 Card Visual

**Requisito:** O card visual é uma imagem PNG gerada no servidor, otimizada para compartilhamento em redes sociais e mensageiros.

**Conteúdo do card:**
- Nome do campeonato + rodada
- Times com seus escudos (se cadastrados) ou inicial em círculo colorido
- Placar final do tempo regulamentar
- Resultado dos pênaltis (se houve): ex: `(4 x 3 nos pênaltis)`
- Data e local do jogo
- Árbitro (se preenchido)

**Especificações técnicas:**
- Geração: server-side (node-canvas, Puppeteer headless, ou sharp + SVG)
- Armazenamento: cloud storage, path `/scoresheets/{id}/share_card.png`
- URL pública sem autenticação
- Compatível com protocolo Open Graph (preview em WhatsApp, iMessage, etc.)

**Critérios de aceite:**
- [ ] Card gerado em até 5 segundos após salvamento
- [ ] URL pública acessível sem autenticação
- [ ] Card exibe todos os campos obrigatórios
- [ ] Campos opcionais ausentes não deixam espaço vazio no card
- [ ] Imagem compatível com preview do WhatsApp (Open Graph)

---

## Apêndice: Regras Transversais

### Persistência Imediata
Todo evento registrado na súmula é persistido imediatamente no banco — não aguarda o salvamento final. Em caso de queda de conexão, os eventos registrados durante a desconexão são enfileirados no IndexedDB e enviados ao reconectar, em ordem, usando `client_event_id` para garantir idempotência.

### Timeline como Fonte de Verdade
Placar, artilharia, saldo de gols e demais contadores são sempre **derivados** dos eventos da timeline. Nunca armazenar esses valores como campos independentes calculados manualmente fora da lógica de derivação.

### Indicador de Sincronização
A tela da súmula exibe um indicador de status de sincronização:
- Ponto verde: todos os eventos sincronizados
- Ponto laranja pulsante: eventos pendentes na fila
- Banner laranja abaixo da topbar com a contagem: `"X eventos aguardando sincronização"`
- Eventos pendentes na timeline exibidos com opacidade reduzida e badge `pendente`

### Responsividade e Mobile-First
- A tela de súmula é projetada mobile-first
- Todos os botões interativos da súmula: área mínima de toque de **48×48px**
- Cronômetro sempre visível no topo, mesmo durante scroll
- Campos numéricos (número de camisa, etc.) usam `inputmode="numeric"`
- Registro de qualquer evento (gol, cartão, falta): **máximo 3 toques**
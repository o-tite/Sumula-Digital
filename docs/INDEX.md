# Saint Clair — Índice de Documentação

Mapa do que vive em cada doc. Use isso para abrir só o que precisa.

## Documentos de referência (fonte da verdade)

| Doc | Arquivo | O que tem |
|---|---|---|
| Escopo MVP | `saint_clair_escopo_mvp.docx` | Visão geral, módulos, regulamento, telas, NFRs |
| Arquitetura | `saint_clair_arquitetura_tecnica.docx` | Modelo de dados, SSE, máquina de estados, infra |
| TDD | `saint_clair_tdd_v1.docx` | Casos de teste TC-* por módulo |
| Requisitos Funcionais | `Saint Clair — Requisitos Funcionais.md` | RF §1–§16 — escopo desta entrega |

## Ordem de prioridade em conflito
**TDD > Arquitetura > Escopo > Requisitos** (avisar se houver divergência).

## Mapa do código (`/src`)

| Camada | Pasta | Conteúdo |
|---|---|---|
| Domínio | `src/domain` | Entidades, value objects, regras de negócio puras |
| Aplicação | `src/application` | Use cases (orquestram domínio + portas) |
| Infraestrutura | `src/infrastructure` | Prisma, auth, SSE, storage, ports adapters |
| Web | `src/app` | Rotas Next.js (UI + API handlers) |
| Compartilhado | `src/shared` | Tipos, erros, utilidades transversais |
| Testes | `tests` | Unit (domínio/use cases) + integração |

## Convenção de IDs de teste
`TC-AUT-*`, `TC-REG-*`, `TC-TIM-*`, `TC-JOG-*`, `TC-SUM-*`, `TC-TAB-*`, `TC-LND-*`, `TC-ORG-*`, `TC-GLB-*`, `TC-NFR-*`.

## Escopo desta entrega (Entrega 1)
RF §1 a §16 apenas. Tabelas em tempo real, landing page pública e painel administrativo de gestão de tabelas/suspensões ficam para entregas futuras — schema e SSE preparados.

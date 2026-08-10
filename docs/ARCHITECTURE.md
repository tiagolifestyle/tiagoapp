# Arquitetura — TiagoLifeStyle

## 1. Plataformas e stack

| Camada | Escolha | Porquê |
|---|---|---|
| App do cliente | **Expo (React Native) + Expo Router** | Um único código para iPhone, iPad, Android e Web, com caminho direto para App Store/Play Store via EAS Build/Submit sem reescrever nada. |
| Área de administração | **Next.js (App Router)** | Um coach a gerir muitos clientes precisa de tabelas densas, drag & drop e um layout desktop-first — melhor servido por uma app web dedicada do que espremido dentro da app mobile. |
| Backend | **Supabase** (Postgres + Auth + Storage + Realtime) | Em vez de manter um servidor à parte, a autorização vive na base de dados via Row Level Security — um cliente literalmente não consegue, ao nível do Postgres, ler a linha de outro cliente. Reduz superfície de infraestrutura a manter. |
| Base de dados | **PostgreSQL** (via Supabase) | Relacional, robusto, com RLS nativo — adequado ao modelo multi-tenant (admin/coach/client). |
| Storage | **Supabase Storage** | Buckets privados para fotos de progresso e anexos de chat; bucket público para média da biblioteca de exercícios. |
| Partilha de código | **pnpm workspaces + Turborepo** (`packages/shared`) | Tipos, validação (zod) e i18n partilhados entre as duas apps — zero duplicação de regras de negócio. |

## 2. Modelo de dados

Ver `supabase/migrations/` para o schema completo e comentado. Pontos-chave:

- **`profiles`** estende `auth.users` com `role` (`admin` | `coach` | `client`) e `locale`.
- **`clients`** guarda dados específicos de cliente (objetivo, estado,
  `coach_id`, notas privadas do coach).
- **Templates == planos**: um template é um `workout_plan` com
  `client_id = null` e `is_template = true`, reutilizando toda a
  estrutura de `workout_days`/`workout_exercises`. Duplicar um template
  para um cliente é uma cópia direta da mesma estrutura.
- **Versionamento**: `workout_plans`/`nutrition_plans` têm `version` e
  `parent_plan_id` — editar um plano ativo não apaga o histórico; "Nova
  versão" cria uma linha nova encadeada ao plano original.
- **Fotos de progresso** vivem num bucket privado (`progress-photos`),
  path `{client_id}/{ficheiro}` — só o próprio cliente e o coach
  responsável têm política de leitura.

## 3. Papéis e permissões (RLS)

```
admin  → acesso total a todos os clientes e conteúdo
coach  → acesso total apenas aos clientes com clients.coach_id = coach
client → acesso apenas às suas próprias linhas (client_id = auth.uid())
```

Implementado com funções `security definer` (`is_admin()`, `is_staff()`,
`manages_client(client_id)`, `manages_plan_client(client_id)`) usadas em
todas as políticas RLS — ver `supabase/migrations/0003_rls_policies.sql`
e `0005_plan_templates.sql`. Isto significa que **mesmo um bug no
frontend não consegue vazar dados entre clientes**: a proteção está na
base de dados, não apenas no código da app.

Criação de contas de cliente usa a **Supabase Auth Admin API**
(`auth.admin.inviteUserByEmail`, chamada apenas a partir de Server
Actions no Next.js com a `service_role` key — nunca exposta ao browser)
para que o coach possa convidar clientes sem nunca ver ou definir a
password deles.

## 4. Navegação

**App do cliente** (5 separadores): Início · Treino · Nutrição ·
Progresso · Perfil. Mensagens do coach acessíveis a partir do Início
(ícone + badge de não lidas) para manter a barra de separadores limpa.

**Admin**: barra lateral fixa — Visão geral · Clientes · Biblioteca de
exercícios · Templates. Dentro de cada cliente, um **perfil 360º** com
separadores (Informação, Treino, Nutrição, Progresso, Check-ins,
Mensagens, Notas privadas) para gerir tudo num único sítio sem saltar
entre menus.

## 5. Design system

Dark-first, premium, minimalista — paleta neutra (`#0B0B0F` fundo,
`#16161D`/`#1E1E27` superfícies) com um único acento dourado (`#C9A227`)
em vez de múltiplas cores vivas, tipografia Inter, cantos muito
arredondados (`rounded-2xl`/`3xl`), espaçamento generoso. Tema claro
suportado desde o início (`darkMode: "class"` no Tailwind). Implementado
com NativeWind (mobile) e Tailwind (admin) a partir dos mesmos tokens de
cor, para as duas apps parecerem a mesma marca.

## 6. MVP por fases

**Fase 1 (implementada nesta primeira iteração)**
Autenticação (login, recuperação de password, sessão persistente),
papéis, dashboard "Bom dia, [Nome]", gestão de clientes (criar/editar,
perfil 360º), biblioteca de exercícios (CRUD, upload de imagem, filtros),
editor de treinos drag & drop (reordenar, duplicar, editar, eliminar),
planos versionados, templates.

**Fase 2** — check-ins semanais com fluxo completo cliente↔coach,
fotografias de progresso com timeline, push notifications
(`expo-notifications` + Supabase Edge Function como trigger), chat em
tempo real via Supabase Realtime (atualmente é polling simples),
refinamento dos ecrãs de nutrição/progresso já existentes.

**Fase 3** — gamificação premium (badges, streaks, "novo recorde
pessoal"), assistente inteligente do coach, subscrições (Stripe web +
Apple IAP + Google Play Billing, usando o campo `subscription_tier` já
presente em `clients`), analytics.

## 7. Funcionalidades diferenciadoras (Fase 3, não copiadas de concorrentes)

1. **Coach Radar** — deteta quebra de consistência, estagnação de força
   ou risco de abandono a partir de `exercise_logs`/`checkins` e sugere
   ações ao coach; nunca altera um plano sozinho.
2. **Weekly Story** — resumo semanal automático e visual, partilhável.
3. **Plan Diff Viewer** — visualização lado-a-lado do que mudou entre
   `parent_plan_id` e a versão atual de um plano.
4. **Live Session Mode** — modo de treino ao vivo no telemóvel, com
   temporizador de descanso automático e registo de carga/reps sem sair
   do ecrã.
5. **Confidence Score** — pontuação de consistência combinando treino +
   nutrição + check-ins, usada pelo coach para priorizar atenção.

## 8. Limitações conhecidas desta primeira iteração

- Substituir um exercício no editor de treinos ainda é "eliminar +
  arrastar um novo" em vez de um botão de troca dedicado.
- O chat (mobile e admin) usa pull-to-refresh/polling; Realtime
  (`supabase.channel`) fica para a Fase 2.
- Push notifications ainda não estão ligadas (tabela `notifications`
  existe, o envio efetivo via `expo-notifications` fica para a Fase 2).
- Ícones/splash da app mobile são placeholders — substituir antes de
  submeter às lojas (ver `apps/mobile/assets/README.md`).

## 9. Notas de manutenção do monorepo

O `apps/mobile` corre React 18 (Expo/React Native) e o `apps/admin` corre
React 19 (Next.js) **no mesmo workspace pnpm, de propósito**. Isso expõe
uma armadilha conhecida do pnpm: algumas dependências (`react-i18next`,
`react-native-chart-kit`) referenciam `react` nos seus `.d.ts` sem
declarar `@types/react` como peer dependency, e o hoist automático de
pnpm para `node_modules/.pnpm/node_modules` só consegue guardar **uma**
versão por pacote — com duas versões de `@types/react` no workspace isso
causava resolução de tipos ambígua (e por vezes errada) entre as apps.
Resolvido com:
- `.npmrc` — exclui `react`/`react-dom`/`@types/react`/`@types/react-dom`
  desse hoist automático, forçando resolução estrita pelo grafo de
  dependências real.
- `pnpm-workspace.yaml` (`packageExtensions`) — declara explicitamente
  `@types/react` como peer dependency dos pacotes que precisam mas não a
  declaram, para o pnpm aninhar a versão correta junto de cada um.

Se um erro de tipos "JSX element class does not support attributes" ou
"cannot be used as a JSX component" voltar a aparecer depois de
adicionar uma dependência nova, é provavelmente o mesmo problema — a
correção é adicionar essa dependência a `packageExtensions` em
`pnpm-workspace.yaml`.

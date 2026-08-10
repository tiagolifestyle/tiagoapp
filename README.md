# TiagoLifeStyle

Plataforma premium de coaching de fitness — acompanhamento personalizado,
não uma app genérica de treinos. Um coach gere clientes, planos de treino
versionados, nutrição, progresso e comunicação a partir de uma área de
administração dedicada; cada cliente tem a sua própria conta e um
dashboard construído à sua volta.

Ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para as decisões de
arquitetura e as razões por trás delas.

## Estrutura do monorepo

```
apps/
  mobile/     App Expo Router (iPhone, iPad, Android, Web) — área do cliente
  admin/      Next.js — área de administração/coach
packages/
  shared/     Tipos, validação (zod), cliente Supabase, i18n PT/ES partilhados
supabase/
  migrations/ Schema SQL + RLS (versionado, aplicado com `supabase db push`)
  seed.sql    Dados de desenvolvimento (biblioteca de exercícios, badges)
```

## Pré-requisitos

- Node.js ≥ 20
- [pnpm](https://pnpm.io) 10.x (`corepack enable` já trata disto)
- Uma conta [Supabase](https://supabase.com) (grátis para começar)
- Para a app mobile: [Expo Go](https://expo.dev/go) no telemóvel, ou
  Xcode/Android Studio para simuladores
- Opcional: [Supabase CLI](https://supabase.com/docs/guides/cli) para
  correr a base de dados localmente com Docker

## 1. Configurar o Supabase

1. Cria um projeto em [supabase.com](https://supabase.com/dashboard).
2. Em **SQL Editor**, corre as migrations por ordem (`supabase/migrations/0001…`
   até `0005…`), ou usa a Supabase CLI:
   ```bash
   supabase link --project-ref <o-teu-project-ref>
   supabase db push
   ```
3. (Opcional, dev) corre `supabase/seed.sql` para teres a biblioteca de
   exercícios de exemplo.
4. Em **Project Settings → API**, copia o `Project URL`, a `anon key` e a
   `service_role key`.
5. Cria a tua própria conta de coach/admin: regista-te normalmente via
   `supabase.auth.signUp` (ou pelo ecrã de login, se já tiveres um
   utilizador) e depois corre no SQL Editor:
   ```sql
   update profiles set role = 'admin' where id = '<o-teu-user-id>';
   ```

## 2. Instalar dependências

```bash
pnpm install
```

## 3. Configurar variáveis de ambiente

```bash
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env.local
```

Preenche `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` etc. com
os valores do passo 1. **Nunca** commitar estes ficheiros — já estão no
`.gitignore`.

## 4. Correr em desenvolvimento

```bash
# App do cliente (Expo — abre no Expo Go, simulador iOS/Android, ou browser)
pnpm dev:mobile

# Área de administração (Next.js)
pnpm dev:admin
```

## 5. Build para produção

- **Admin (Next.js)**: deploy num serviço como Vercel — liga o repositório,
  define as env vars de `apps/admin/.env.example` e o build command
  `pnpm --filter @tiagolifestyle/admin build`.
- **Mobile**: usa [EAS Build](https://docs.expo.dev/build/introduction/)
  ```bash
  cd apps/mobile
  npx eas login
  npx eas build:configure
  npx eas build --platform android --profile production   # gera o .apk/.aab
  npx eas build --platform ios --profile production        # requer conta Apple Developer
  ```
  Antes do primeiro build, adiciona os ícones/splash em `apps/mobile/assets/`
  (ver `assets/README.md`) e configura os segredos com `eas secret:create`.

## Ambientes

Recomendado: um projeto Supabase para `development` e outro para
`production`, cada um com o seu próprio `.env`. O admin em Vercel deve ter
Preview Deployments ligados ao projeto de desenvolvimento e Production
Deployment ligado ao de produção. O CI (`.github/workflows/ci.yml`) corre
lint, typecheck e build em cada PR.

## Roadmap

- **Fase 1 (atual)** — autenticação, papéis (admin/coach/cliente),
  dashboard do cliente, gestão de clientes, biblioteca de exercícios,
  editor de treinos drag & drop, planos versionados, templates.
- **Fase 2** — check-ins semanais completos, fotografias de progresso,
  push notifications, refinamento de nutrição/progresso/mensagens.
- **Fase 3** — gamificação (badges, streaks), assistente inteligente do
  coach (Coach Radar, Weekly Story), subscrições (Stripe/IAP/Play Billing).

Ver `docs/ARCHITECTURE.md` para detalhe de cada fase.

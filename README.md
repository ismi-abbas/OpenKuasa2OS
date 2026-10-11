# OpenKuasa OS

**The open-source business OS for Malaysian SMEs — one self-hostable app
instead of a stack of separate CRM, HR, payroll and accounting subscriptions.**
Ads, CRM, HR, recruitment and accounting in one place, with an AI command center
on top — built in the open on React (Vite), Hono, Cloudflare Workers and Postgres.

OpenKuasa is crowd-sourced: it is developed in the open by its maintainers and
volunteer contributors.

**Free to self-host, always.** A paid hosted version is planned for people who
would rather not run it themselves. It is built on the code in this repository,
which stays open source under AGPL-3.0.

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="OpenKuasa OS — the Api (Ads) module overview; every module has a dashboard like this" width="900">
</p>

> [!IMPORTANT]
> **OpenKuasa is an independent, community-run project.** It is not affiliated
> with, endorsed by, or connected to any other company or product, and it speaks
> only for its own contributors.
>
> - Everything in this repository was written from scratch by the community. It
>   contains no third-party source code, proprietary assets or customer data.
> - Product names are inspired by elemental themes. The project is not affiliated
>   with any animation studio or franchise.
> - Any third-party product or company names that come up belong to their
>   respective owners, and are used only to describe the kind of software this is
>   an alternative to.
> - The software is provided "as is", without warranty of any kind — self-host it
>   at your own risk.

## What's inside

Six products named after elemental powers (fire, water, leaf, wind, earth, plus
the command hub that ties them together), and Ochobot, the helper that rides
along on every screen. **83 module screens** are built so far.

| Module | What it does | Alternative to | Route | Screens |
| --- | --- | --- | --- | --- |
| **Kokotiam** | AI command center — chat with your whole business | AI business copilots | `/command` | chat |
| **Api** | Ads — ad studio, creative bank, lead forms, reports | ad platforms & agencies | `/reach` | 10 |
| **Air** | CRM — contacts, deals kanban, broadcast, chatbot, automations | CRM tools | `/crm` | 11 |
| **Daun** | Team — employees, attendance, leave, claims, payroll, performance | HR & payroll suites | `/people` | 27 |
| **Taufan** | Recruit — jobs, candidates, applications, interviews, talent pool | recruiting (ATS) | `/hire` | 9 |
| **Gempa** | Finance — invoicing, expenses, banking, e-Invoice, SST, ledgers | accounting software | `/finance` | 26 |
| **Ochobot** | The helper available from every screen | — | everywhere | — |

The full menu for each module lives in `apps/web/src/features/app/nav.ts`.

### Module highlights

- **Kokotiam** — a command chat with rich reply cards, plus an Ask Ochobot
  conversation view.
- **Api** — overview dashboard, AI agents, Ad Studio, Creative Bank, reports,
  contacts, lead forms, appointments, ad settings and an account health check.
- **Air** — CMO assistant, deals pipeline as a kanban board, broadcasts, AI
  chatbot, automations, landing pages, calendar, billings, plugins and reports.
- **Daun** — employee self-service (attendance, goals, documents), leave /
  time-off / claims / overtime applications with a matching approvals queue,
  timesheets, shift calendar, payroll, payment vouchers, scorecards and
  training.
- **Taufan** — recruiter assistant, hiring dashboard, jobs, candidates kanban,
  applications, interviews, talent pool and a careers page builder.
- **Gempa** — cash book, quotations, invoices, credit notes, refunds,
  supplier bills, receipts inbox, banking, e-Invoice LHDN, SST report, audit
  trail, journals, chart of accounts, contra entries and FX revaluation.

### Platform

- **App shell** — a two-level sidebar (product rail + collapsible per-module
  menu), responsive down to mobile.
- **Marketing site** — landing page with a products mega-menu, pricing and
  privacy pages.
- **Auth flow** — login and a multi-step onboarding.
- **Account area** — 19 pages: profile, company, team, clients, security,
  notifications, plan, subscriptions, add-ons, payment methods, transactions,
  connected apps, developers, activity, changelog, docs, support and feedback.
- **Polish** — loading skeletons, empty states and not-found pages throughout.

## Screenshots

A look at the running app (sample data):

| | |
| :---: | :---: |
| <img src="docs/screenshots/command.png" alt="Kokotiam — AI command center"><br>**Kokotiam** · AI command center | <img src="docs/screenshots/ads-ad-studio.png" alt="Api — AI Ad Studio"><br>**Api** · AI Ad Studio |
| <img src="docs/screenshots/crm-deals.png" alt="Air — deals pipeline"><br>**Air** · deals pipeline | <img src="docs/screenshots/people-payroll.png" alt="Daun — payroll"><br>**Daun** · payroll |
| <img src="docs/screenshots/hire-candidates.png" alt="Taufan — candidate pipeline"><br>**Taufan** · candidate pipeline | <img src="docs/screenshots/finance-invoices.png" alt="Gempa — invoicing"><br>**Gempa** · invoicing |
| <img src="docs/screenshots/assistant.png" alt="Ochobot — the assistant, available from every screen"><br>**Ochobot** · ask Ochobot from any screen | <img src="docs/screenshots/onboarding.png" alt="Multi-step onboarding"><br>**Onboarding** · multi-step setup |

## Status

OpenKuasa OS is in early development. Being upfront about where it stands:

- **Built** — the complete product surface listed above: every screen,
  navigation, layout and interaction, running on sample data.
- **Wired up** — sign-in, workspaces and teams, the account area, CRM contacts,
  the Api overview and the AI chat run against a real backend. Most other
  module screens still run on sample data, and integrations such as ad
  platforms, WhatsApp, payroll filings and LHDN MyInvois submission are not
  connected.

It is not ready to run a real business on. Contributions towards the backend
are very welcome.

## Contributing

OpenKuasa is built by its contributors, and anyone can join in — code, design,
docs, translations, bug reports and ideas are all welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

- Report a bug or suggest a feature:
  [open an issue](https://github.com/OpenKuasa/OpenKuasaOS/issues/new/choose)
- Looking for something to pick up:
  [good first issues](https://github.com/OpenKuasa/OpenKuasaOS/labels/good%20first%20issue)
- Found a security problem: follow the [security policy](SECURITY.md)
- Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md)

One rule matters above all: **contribute only your own original work.** Never
copy code, text, designs, screenshots or assets from any proprietary product.

Contributions are accepted under a Contributor License Agreement, set out in
`CONTRIBUTING.md`. You keep your copyright, and everything accepted into this
repository stays available under AGPL-3.0.

## Stack

- **Frontend** (`apps/web`): React 19 + **Vite**, React Router, TypeScript, Tailwind CSS v4, shadcn/ui (Radix)
- **Backend** (`apps/api`): **Hono** on **Cloudflare Workers**, serving the API under `/api/*` and the built SPA as static assets
- **Database**: plain **Postgres** (Supabase DB, Neon, PlanetScale Postgres or self-hosted) with **Drizzle ORM**, reached through Cloudflare Hyperdrive
- **Auth**: **better-auth** (email + password, two-factor, anonymous demo guests)
- **AI**: Vercel AI SDK + OpenRouter

## Getting Started

Requires Node 22+, [pnpm](https://pnpm.io) and Docker (for the local Postgres).

```bash
git clone https://github.com/OpenKuasa/OpenKuasaOS.git
cd OpenKuasaOS
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # then edit the secrets
docker compose up -d --wait db                     # Postgres on localhost:54320
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54320/openkuasa pnpm db:migrate
pnpm build                                         # the Worker serves apps/web/dist
pnpm dev:api
```

Open [http://localhost:8787](http://localhost:8787). For hot reload of the UI, run
`pnpm dev:web` too and use [http://localhost:5173](http://localhost:5173) (it proxies `/api`).

## Configuration

Worker settings live in `apps/api/wrangler.jsonc` (Hyperdrive id, R2 bucket for
avatars, hourly cron) and secrets in `apps/api/.dev.vars` locally or
`wrangler secret put` in production. See `apps/api/.dev.vars.example`.

- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN` — required.
- `AI_KEY_SECRET` — encrypts workspace AI keys; `OPENROUTER_API_KEY` — optional shared key for free questions.
- `RESEND_API_KEY`, `MAIL_FROM` — sends verification and reset emails. Without it, links are logged and email verification is not enforced.
- `DEMO_ENABLED=1` (Worker) and `VITE_DEMO_ENABLED=1` (web build) — enable the demo workspace.

## Moving from the old Supabase version

`apps/api/db/import_supabase_users.sql` copies existing Supabase Auth users (ids and
bcrypt hashes) into better-auth. Authenticator-app (TOTP) setups are not copied;
those users re-enrol in Settings → Security.

## Scripts

```bash
pnpm dev:web      # Vite dev server
pnpm dev:api      # Worker (wrangler dev)
pnpm build        # build the web app
pnpm typecheck    # api + web
pnpm test         # api + web (vitest)
pnpm db:generate  # after editing apps/api/src/core/schema.ts
pnpm db:migrate   # apply migrations to $DATABASE_URL
pnpm deploy       # build web, deploy the Worker
```

## License

[AGPL-3.0](LICENSE). You are free to use, modify and self-host OpenKuasa OS. If
you run a modified version as a network service, you must make your source
available to its users under the same license.

The license covers this project's code only. It grants no rights to any
third-party names, marks or products.

# CookMyWork — Production-Grade Multi-Tenant Workspace & CRM

![CookMyWork Architecture](https://img.shields.io/badge/Architecture-Next.js%2016%20App%20Router-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat-square)
![UI](https://img.shields.io/badge/UI-shadcn%2Fui%20Primitives-black?style=flat-square)
![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-green?style=flat-square)
![Testing](https://img.shields.io/badge/Tests-Jest%20Passed-brightgreen?style=flat-square)

`CookMyWork` is a full-featured, multi-tenant workspace, task, and project management platform built with Next.js 16 App Router, TypeScript (strict mode), shadcn/ui design primitives, MongoDB Mongoose ODM, TanStack Query, Recharts, and role-based access control (RBAC).

---

## Key Features

### 1. Multi-Tenancy & RBAC Security
- **Strict Tenant Isolation**: Every collection read/write is strictly scoped by `organizationId`.
- **Soft Deletes**: Uses `isDeleted: true` flags rather than destructive physical deletes.
- **Hierarchical RBAC**:
  - `Super Admin`: Wildcard permissions across all modules and tenants.
  - `Admin`: Full organizational settings, user invites, and CRM lifecycle operations.
  - `Manager`: Pipeline management, team reporting, deals oversight, and marketing.
  - `Sales Rep`: Deal updates, contact/company records, activity logs, and personal tasks.
  - `Viewer / Read-only`: Auditing and reporting access with mutation safeguards.
- **Audit Log Trail**: Real-time logging of user invitations, permission updates, and organizational parameter changes.

### 2. Contact & Corporate Account Management
- **Contacts**: Full CRUD, dynamic tags, custom field attributes, and slide-over detail drawers.
- **Companies**: Parent-child account hierarchies, subsidiary linkages, and active deal rolls.
- **CSV Data Engine**: Client-side PapaParse CSV import with column-mapping preview and deduplication checks, alongside instant CSV export.
- **Deduplication Engine**: Interactive record merge dialog to unify fragmented customer profiles.
- **Activity Stream**: Unified omnichannel timeline (Calls, Meetings, Emails, Status Notes) with quick-log triggers.

### 3. Lead Qualification & Scoring Engine
- **Algorithmic Lead Scoring**: Deterministic, rule-based scoring (0–100) evaluating authority titles (CXO, VP, Director), acquisition channels, and email domain validity.
- **Single-Click Conversion Flow**: Seamlessly transforms qualified leads into a Contact, Account, and Pipeline Deal simultaneously.
- **Public Capture Web-Form**: Embeddable API endpoint (`POST /api/v1/leads/capture`) for external landing page integration.

### 4. Sales Pipeline & Kanban Deal Management
- **Interactive Multi-Pipeline Kanban**: Smooth `@dnd-kit` drag-and-drop board with customizable stage columns and probability percentages.
- **Weighted Sales Forecasting**: Dynamic ARR forecasting calculated by deal probability: $\text{Value} \times (\text{Probability} / 100)$.
- **Win/Loss Analysis**: Prompts sales reps for close reasons to maintain win/loss analytics.
- **Multiple Currency Support**: USD, EUR, GBP, CAD, AUD.

### 5. Task & Calendar Agenda
- **Task Management**: Priority flags (`High`, `Medium`, `Low`), status toggles, and cross-record linkages.
- **Interactive Calendar View**: Full monthly calendar built with shadcn/ui `Calendar` rendering scheduled meetings, calls, and deadlines.
- **Call Logging**: Structured logs capturing call outcome (`Connected`, `Left Voicemail`, `No Answer`, `Wrong Number`) and follow-ups.

### 6. Marketing Campaigns & Email Templates
- **Broadcast Campaigns**: Filter contacts by tag or lifecycle stage, select template layouts, and dispatch bulk email blasts.
- **Email Template Builder**: Parameterized layouts with dynamic merge tags (`{{first_name}}`, `{{company}}`, `{{email}}`).
- **Telemetry Analytics**: Recharts vertical funnel charts tracking Sent, Opens, Clicks, and Bounce rates.

### 7. Support Desk & Ticket System
- **Omnichannel Service Cloud**: Ticket priorities (`Urgent`, `High`, `Medium`, `Low`) and dynamic SLA resolution deadline badges.
- **Conversation Threads**: Tabbed thread separating internal staff collaboration notes from customer-facing replies.

### 8. Analytics & Custom Report Builder
- **Ad-Hoc Report Builder**: Query any object (`Deals`, `Leads`, `Contacts`, `Tickets`), select grouping dimensions (Stage, Source, Rep, Status), and choose between Recharts visualizations or data tables.
- **Executive Revenue Trajectory**: Monthly revenue trendline compared against forecast targets.
- **Sales Rep Leaderboard**: Real-time rep rankings tracking closed volume and quota attainment percentage.
- **Export to CSV**: Client-side formatted CSV generation.

### 9. Automation & Event-Driven Workflows
- **Rule Engine**: Trigger (e.g., `deal.stage_changed`, `lead.created`) $\rightarrow$ Condition filter $\rightarrow$ Automated Action (e.g., Round-robin assignment, email trigger, task generation).
- **Zero-Latency Switch**: Instant toggle switch to activate or pause workflows.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Actions & Route Handlers) |
| **Language** | TypeScript (Strict Mode) |
| **UI Primitives** | shadcn/ui (Radix UI) — *100% strictly used, no raw HTML buttons/inputs* |
| **Styling** | Tailwind CSS v4 (Neutral theme tokens, Dark & Light Mode) |
| **Database** | MongoDB 7.0 with Mongoose ODM (21 Schemas) |
| **Data Fetching** | TanStack Query (React Query) v5 |
| **Charts** | Recharts (ResponsiveContainer, BarChart, LineChart, PieChart) |
| **Drag & Drop** | `@dnd-kit/core` & `@dnd-kit/sortable` |
| **Forms & Validation** | React Hook Form + Zod |
| **Testing** | Jest + ts-jest (14 unit tests covering RBAC, scoring, and forecasting) |
| **Containerization** | Docker & Docker Compose |

---

## Quick Start (Docker Compose)

The easiest way to run the entire CookMyWork stack (Next.js application, MongoDB 7, and Mongo Express):

```bash
# 1. Clone repository and start Docker services
docker-compose up --build -d

# 2. Access the services
# CookMyWork Application: http://localhost:3000
# Mongo Express Admin:    http://localhost:8081
```

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: v20+ recommended
- **MongoDB**: Local MongoDB instance running on `localhost:27017` or Atlas cluster

### 2. Installation & Configuration

```bash
# Install dependencies
npm install

# Configure environment variables (.env)
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 4. Default Admin Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@cookmywork.com` | `Password123!` |

---

## Automated Test Suite

Run the unit tests covering critical business logic:

```bash
npm run test
```

### Test Coverage:
- `tests/unit/lead-scorer.test.ts`: Deterministic lead score algorithm (executive titles, domain validation, channels, and caps).
- `tests/unit/rbac.test.ts`: Permission evaluation matrix across Super Admin, Admin, Manager, Sales Rep, and Viewer roles.
- `tests/unit/deal-forecasting.test.ts`: Weighted pipeline forecasting formulas and closed win-rate calculations.

---

## Production Build Verification

To verify that the application compiles without TypeScript or Turbopack bundling errors:

```bash
npm run build
```

---

## API Reference Overview

All endpoints are organized under Next.js Route Handlers (`/api/v1/...`):

| Resource | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | JWT authentication & session issuance |
| **Auth** | `POST` | `/api/v1/auth/register` | Workspace & admin registration |
| **Contacts** | `GET, POST` | `/api/v1/contacts` | Paginated search, sorting, filtering & creation |
| **Contacts** | `GET, PATCH, DELETE` | `/api/v1/contacts/[id]` | Single contact management & soft-delete |
| **Contacts** | `POST` | `/api/v1/contacts/merge` | Unify and merge duplicate contact profiles |
| **Companies** | `GET, POST` | `/api/v1/companies` | Corporate accounts and parent-child hierarchies |
| **Leads** | `GET, POST` | `/api/v1/leads` | Lead pipeline with automatic scoring |
| **Leads** | `POST` | `/api/v1/leads/[id]/convert` | Single-click lead to Contact + Company + Deal |
| **Leads** | `POST` | `/api/v1/leads/capture` | Public inbound lead webhook |
| **Deals** | `GET, POST` | `/api/v1/deals` | Pipeline deals with stage probabilities |
| **Deals** | `PATCH` | `/api/v1/deals/[id]` | Move stage, adjust probability, log win/loss |
| **Pipelines** | `GET, POST` | `/api/v1/pipelines` | Custom pipelines and drag-to-reorder stages |
| **Tasks** | `GET, POST` | `/api/v1/tasks` | Task assignments, calendar schedule, & call logs |
| **Tickets** | `GET, POST` | `/api/v1/tickets` | Support desk tickets with SLA deadlines |
| **Tickets** | `POST` | `/api/v1/tickets/[id]/comments` | Internal notes vs customer reply threads |
| **Campaigns** | `GET, POST` | `/api/v1/campaigns` | Marketing broadcasts & segment filtering |
| **Campaigns** | `POST` | `/api/v1/campaigns/[id]/send` | Dispatch campaign & record open/click telemetry |
| **Templates** | `GET, POST, DELETE`| `/api/v1/email-templates` | Parameterized email layouts |
| **Reports** | `GET` | `/api/v1/reports/dashboard` | Executive KPIs, revenue curves, & leaderboard |
| **Reports** | `POST` | `/api/v1/reports/custom` | Dynamic ad-hoc query builder with grouping |
| **Workflows** | `GET, POST, PATCH`| `/api/v1/workflows` | Event trigger rules & automated sequences |
| **Settings** | `GET, PATCH` | `/api/v1/settings/organization` | Tenant parameters, timezone, & fiscal calendar |
| **Settings** | `GET, POST` | `/api/v1/settings/users` | Team management & email invitations |
| **Settings** | `GET, POST, DELETE`| `/api/v1/settings/custom-fields` | Dynamic entity schema extensions |
| **Settings** | `GET, POST, DELETE`| `/api/v1/settings/tags` | Organization taxonomy tags |
| **Settings** | `GET, POST` | `/api/v1/settings/api-keys` | Generate external integration tokens |
| **Settings** | `GET` | `/api/v1/settings/audit-logs` | Immutable security audit trail |
| **Global Search**| `GET` | `/api/v1/search` | `Cmd+K` cross-entity search |

---

## License
Proprietary & Confidential — Built for production enterprise CRM deployments.

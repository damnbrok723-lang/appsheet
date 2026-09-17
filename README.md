# OfficeHub

OfficeHub is a modern office collaboration platform for multi-user organizations. It provides task management, team collaboration, calendar, documents, announcements, notifications, attendance, and reports — all in one unified application.

## Features

- **Authentication** — Secure login and registration with role-based access
- **User Management** — Admin can manage users, departments, and teams
- **Task Management** — Create, assign, track, and approve tasks with workflow
- **Calendar** — Schedule events with participants
- **Documents** — Upload and share documents with permissions
- **Announcements** — Create announcements targeted to departments or teams
- **Notifications** — Real-time notification system
- **Attendance** — Check-in and check-out tracking
- **Reports** — Generate reports from database data
- **Activity Feed** — Automatic activity logging

## Roles

- **ADMIN** — Full organization management
- **MANAGER** — Team management, task creation and approval
- **EMPLOYEE** — View and update own tasks, check attendance

## Requirements

- Node.js 20+
- pnpm
- Supabase project (PostgreSQL)

## Installation

```bash
git clone <repository>
cd officehub

pnpm install

cp .env.example .env

# Fill DATABASE_URL and AUTH_SECRET in .env with your Supabase values

npx prisma generate

pnpm db:push

pnpm db:seed

pnpm run dev
```

## Environment Variables

Create a `.env` file:

```
DATABASE_URL="postgresql://postgres.fgpnuwlanatjwlomoopq:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.fgpnuwlanatjwlomoopq:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
AUTH_SECRET="your-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STORAGE_PATH="./local-storage"
```

Use the database connection string from **Project Settings > Database** in Supabase. Add the same `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` values to the Vercel project environment variables.

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to a new Supabase database
pnpm db:push

# Seed database with dummy data
pnpm db:seed
```

## Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.local | password123 | ADMIN |
| manager@example.local | password123 | MANAGER |
| andi@example.local | password123 | EMPLOYEE |
| rina@example.local | password123 | EMPLOYEE |
| doni@example.local | password123 | EMPLOYEE |
| sinta@example.local | password123 | EMPLOYEE |

## Project Structure

```
officehub/
├── src/
│   ├── app/          # Next.js App Router pages and API routes
│   ├── components/   # React components (layout, UI, features)
│   ├── lib/          # Core libraries (auth, db, permissions)
│   └── generated/    # Generated Prisma client
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Seed data script
├── components/       # Additional components
├── .env              # Environment variables
├── .env.example      # Environment template
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

## API Overview

- `GET/POST /api/tasks` — Task management
- `GET/PATCH/DELETE /api/tasks/:id` — Task operations
- `GET/POST /api/tasks/:id/comments` — Task comments
- `POST /api/tasks/:id/accept` — Accept task
- `POST /api/tasks/:id/start` — Start task
- `POST /api/tasks/:id/submit` — Submit for review
- `POST /api/tasks/:id/approve` — Approve task
- `POST /api/tasks/:id/revision` — Request revision
- `GET/POST /api/users` — User management
- `GET/PATCH/DELETE /api/users/:id` — User operations
- `GET/POST /api/departments` — Department management
- `GET/POST /api/teams` — Team management
- `GET/POST /api/calendar` — Calendar events
- `GET/POST /api/documents` — Document management
- `GET/POST /api/announcements` — Announcements
- `GET/PATCH /api/notifications` — Notifications
- `GET/POST /api/attendance` — Attendance
- `GET /api/reports` — Reports
- `GET /api/search` — Global search

## Roles & Permissions

All API endpoints enforce authorization server-side:

- **ADMIN** — Full access to all resources
- **MANAGER** — Team-level task and event management
- **EMPLOYEE** — Own tasks and profile management

## Production Deployment

1. Create a Supabase project and configure `DATABASE_URL` in Vercel.
2. Run `pnpm db:push` once against the Supabase database.
3. Run `pnpm db:seed` once to load demo data.
4. Set `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` in Vercel.
5. Deploy with `pnpm run build`.

## License

MIT

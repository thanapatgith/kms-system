# SECURITY KM GUARD & SUPPLY GROUP

Next.js App Router + TypeScript + Tailwind CSS starter with a PostgreSQL Prisma schema.

## Start locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` (Supabase PostgreSQL is supported).
2. Install dependencies: `npm install`
3. Generate the Prisma client: `npm run db:generate`
4. Create the initial migration: `npm run db:migrate -- --name init`
5. Run: `npm run dev`

## Employee Portal

Set `AUTH_SECRET` in `.env` before signing in. Password hashes in `users.password_hash` must be generated with bcrypt. The leave endpoint saves a leave request and sends a notification only when all four Twilio variables in `.env.example` are configured. File uploads are intentionally marked as `pending-upload/...`; connect Supabase Storage or S3 before production use.

## Theme tokens

- `security-orange`: `#F15A24`
- `security-navy`: `#1A2B4C`
- `security-dark`: `#0F1A30`

## Phase 2 extension points

The schema intentionally has stable IDs, audit timestamps and indexed relationships. Recommended next models are `Shift`, `ShiftAssignment`, `AttendanceLog`, `LeaveApproval` and `Notification`. This keeps attendance, payroll and approval workflows independent of the Phase 1 core records.

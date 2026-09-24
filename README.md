# Mountain Kill List

> Conquer mountains. Build your elevation. Reach the next summit.

A social mountain logbook: track the 20-objective progression from Cape Town → Western Cape → 2,000 m+ peaks → **Kilimanjaro (5,895 m)**. Log hikes with photos, track distance and elevation, earn achievements automatically, follow friends and see their summits.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · Lucide · Vercel

---

## 1. Install dependencies

Requires Node.js 20+.

```bash
npm install
```

> **Windows PowerShell:** if you see *"running scripts is disabled on this system"*, use `npm.cmd` instead of `npm` (e.g. `npm.cmd run dev`), run from Command Prompt / Git Bash, or run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a region close to you and set a database password (keep it somewhere safe).

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to find it | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → Project URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → **publishable** key (`sb_publishable_…`) or legacy `anon` key | yes (safe — RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → **secret** key / legacy `service_role` | **never** — server only, optional |
| `OPENAI_API_KEY` | platform.openai.com → API keys | **never** — server only, optional. Enables "Generate with AI" mountain covers |
| `OPENAI_IMAGE_MODEL` | defaults to `gpt-image-1` | server only, optional |

The app never needs the service-role key to run: every request uses the signed-in user's session so Row Level Security applies. It's only wired up in `lib/supabase/admin.ts` for future admin tasks. Never prefix it with `NEXT_PUBLIC_`, never commit it. `.env.local` is git-ignored.

## 4. Run migrations

Migrations live in [`supabase/migrations`](supabase/migrations):

| File | What it does |
| --- | --- |
| `…01_schema.sql` | Tables, constraints, indexes |
| `…02_functions.sql` | Profile-on-signup trigger, achievement engine, activity triggers, RPCs |
| `…03_rls.sql` | Row Level Security on every table |
| `…04_storage.sql` | `hike-photos` (private) and `avatars` (public) buckets + policies |

**Option A — SQL Editor (easiest).** Generate a single file and paste it into Supabase → SQL Editor → Run:

```bash
npm run db:bundle   # writes supabase/setup.sql (migrations + seeds)
```

**Option B — Supabase CLI.**

```bash
npx supabase login
npx supabase init                 # first time only: creates supabase/config.toml
npx supabase link --project-ref <your-project-ref>
npx supabase db push              # applies migrations
```

## 5. Seed mountains

`setup.sql` (Option A) already includes the seeds. With the CLI (Option B), paste the files in [`supabase/seed`](supabase/seed) into the SQL Editor and run them.

- `01_mountains.sql` — the 20 starter objectives, in progression order
- `03_starter_lists.sql` — gives existing accounts the starter list
- `02_achievements.sql` — the 14 achievement definitions

**The mountain data is starter data, not authoritative.** Some elevations are `NULL` (unknown) and most coordinates are approximate. The UI never hardcodes mountain data — fix anything in Supabase → Table Editor → `mountains` and the app updates. Hikers can also add their own mountains in the app. Row 19 (`groot-winterhoek`) is a placeholder for your "additional Western Cape objective". Seeds use `on conflict do nothing`, so re-running them never overwrites your corrections.

## 6. Configure Supabase Auth

Authentication → **URL Configuration**:

- **Site URL:** `http://localhost:3000` (change to your Vercel URL in production)
- **Redirect URLs:** `http://localhost:3000/auth/confirm` and `https://<your-domain>/auth/confirm`

Authentication → **Sign In / Providers → Email**: email + password is on by default. "Confirm email" is on by default — new users must click the emailed link, which lands on `/auth/confirm`. Turn it off during development if you want instant sign-up.

Password reset emails link to `/auth/confirm?next=/reset-password` and work with the default email templates.

*Google OAuth later:* enable the Google provider in Supabase, then call `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/confirm` } })` from a button — `/auth/confirm` already exchanges OAuth codes.

## 7. Configure Storage

Created by the storage migration — nothing to click:

| Bucket | Access | Path | Limits |
| --- | --- | --- | --- |
| `hike-photos` | **private** — served via 1-hour signed URLs | `{user_id}/{hike_id}/{uuid}.jpg` | 10 MB · JPG/PNG/WebP |
| `avatars` | public | `{user_id}/{uuid}.jpg` | 5 MB · JPG/PNG/WebP |
| `mountain-images` | public | `{user_id}/{uuid}.jpg` (`ai-…` if generated) | 10 MB · JPG/PNG/WebP |

Photos upload straight from the browser to Storage (so they don't hit Vercel's 4.5 MB request limit), are downscaled client-side first, and only the storage **path** is saved in Postgres. Storage policies only allow uploads into `{your id}/{a hike you own}/…`.

## 8. Run locally

```bash
npm run dev          # http://localhost:3000
npm run lint
npm run build
npm run test:db      # RLS + security tests (see below)
```

Without `.env.local` the app shows a `/setup` page instead of crashing.

## 9. Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo. Framework preset: **Next.js** (auto-detected). No build settings to change.
3. Add the environment variables (next step), then **Deploy**.
4. In Supabase → Authentication → URL Configuration, set **Site URL** to `https://<your-app>.vercel.app` and add `https://<your-app>.vercel.app/auth/confirm` to Redirect URLs.

## 10. Add environment variables to Vercel

Vercel → Project → **Settings → Environment Variables**, for Production (and Preview if you use it):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` *(optional; leave "Sensitive" on)*

Redeploy after adding or changing variables — `NEXT_PUBLIC_*` values are inlined at build time.

---

## How it works

### Personal kill lists

- `mountains` is a **shared catalogue**. Any signed-in hiker can add a mountain (`/mountains/new`); only its creator can edit it, and only while nobody else lists or has hiked it can they delete it. Seeded mountains (`created_by` null) are curated by you in the Supabase dashboard.
- `user_mountains` is each hiker's **own list**: which mountains, their order, and one **final objective**. New accounts start with the starter list (catalogue rows with `is_starter = true`).
- Manage it at `/mountains/manage` (reorder, flag final objective, remove) and `/mountains/add` (search the catalogue). Removing a mountain never deletes logged hikes.
- Progress ("5 / 20") counts your list. The Final Objective achievement follows whichever mountain you flag.

### Mountain photos

- Anyone can add a cover photo to a mountain that has none; the creator can replace theirs. Covers live in the public `mountain-images` bucket.
- With `OPENAI_API_KEY` set, a **Generate with AI** button creates a cover (server-side; files are prefixed `ai-` and labelled "AI-generated image" in the UI). Hike photos are always your own uploads.

### Security model

- **Identity comes from the session, never the browser.** Server actions call `supabase.auth.getUser()` and use that id; `user_id` columns also default to `auth.uid()`.
- **RLS on every table.** You can read yourself and anyone with `is_public = true`; you can only write your own rows. Private profiles expose only name/avatar/follow counts via the `get_profile_card` RPC.
- **Activity and achievements are written by database triggers** (`SECURITY DEFINER`), so clients have no insert rights on those tables and can't fake a summit.
- `proxy.ts` (Next 16's replacement for `middleware.ts`) refreshes the session cookie and redirects signed-out visitors to `/login`. `/profile/[username]` is public so profiles can be shared.

### Security tests

`npm run test:db` runs every migration and seed in an embedded Postgres (PGlite) with Supabase's `auth`/`storage` schemas stubbed, then acts as real `anon`/`authenticated` users to verify:

- users can't create, edit or delete another user's hikes, or reassign a hike
- users can't write activity/achievements or call internal functions
- private profiles, hikes, activity, achievements and photos are hidden from others
- only you can update your profile; you can't follow as someone else or follow yourself
- photos can only be attached/uploaded to your own hikes under your own folder
- achievements are awarded automatically and revoked when hikes are deleted

### Achievements

Defined in the `achievements` table (`requirement_type` + `requirement_value`). After any hike insert/update/delete, `sync_user_achievements()` recomputes and awards/revokes. New unlocks are shown with an animation after you log a hike.

### Statistics

All stats are computed from the user's hikes in [`lib/calculations`](lib/calculations): distance and elevation count every logged hike (including turned-back attempts); conquered count and highest summit count completed summits only. The Everest equivalent divides total elevation gained by Mount Everest's 8,849 m — just for fun, a comparison rather than altitude reached.

### Map

`components/map/MountainMap.tsx` is a lightweight SVG plot + list with Google Maps links. Its props (`mountains`, `conquered`) are the contract — replace the body with Leaflet/Mapbox without touching callers.

## Project structure

```
app/
  (auth)/login, register, forgot-password, reset-password
  (app)/page.tsx (dashboard), mountains/, hikes/, activity/, people/,
        stats/, achievements/, profile/
  auth/confirm/route.ts     email + OAuth callback
  setup/                    shown until Supabase is configured
components/  achievements · activity · auth · dashboard · hikes · map ·
             mountains · navigation · profile · stats · ui
lib/
  supabase/     client.ts · server.ts · proxy.ts · admin.ts · env.ts
  queries/      read-side data access
  actions/      server actions (auth, hikes, profile, follows)
  calculations/ stats + monthly totals
  achievements/ progress bars
  validation/   zod schemas shared by client & server
supabase/
  migrations/ · seed/ · tests/
types/
proxy.ts
```

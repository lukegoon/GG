# RecruitIQ — Performance Dashboard

A full-stack recruiting performance dashboard that syncs weekly rep stats from Convoso (dialer) and Google Sheets (hire confirmations), runs a behavioral coaching insight engine, and provides role-based views for managers and reps.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TanStack Query, React Router, Tailwind CSS |
| Backend | Node.js (ESM), Express, Prisma ORM |
| Database | PostgreSQL 15 |
| Realtime | WebSockets (`ws`) |
| Scheduler | `node-cron` |
| Data sources | Convoso API, Google Sheets API |

---

## Quick Start

### 1. Clone and configure environment

```bash
git clone <repo>
cd GG

# Server env
cp server/.env.example server/.env
# Edit server/.env and fill in:
#   JWT_SECRET       — any long random string
#   CONVOSO_API_KEY  — from your Convoso account
#   GOOGLE_*         — from your Google service account (see below)
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Express server** on port 4000
- **Vite dev server** on port 5173 (proxies /api to server)

### 3. Run database migration and seed

```bash
# In a new terminal (after containers are running):
docker exec -it gg-server-1 npx prisma migrate dev --name init
docker exec -it gg-server-1 node prisma/seed.js
```

The seed creates:
- Admin user: `admin@recruitiq.com` / `Admin1234!`
- Default app settings

Rep data populates automatically when you run a sync (see Admin page).

### 4. Open the app

Navigate to **http://localhost:5173** and log in with the admin credentials.

---

## Connecting Data Sources

### Convoso API

1. Get your API key from your Convoso account settings
2. Add to `server/.env`:
   ```
   CONVOSO_API_KEY=your_key_here
   CONVOSO_BASE_URL=https://api.convoso.com
   ```
3. Trigger a manual sync from Admin → Manual Sync
4. Check server logs for `[Convoso] Raw agent report sample:` — this shows the actual field names
5. If field names don't match, update `mapAgentRow()` in `server/services/convosoService.js`

See `server/docs/convoso-api-notes.md` for detailed integration notes.

### Google Sheets

1. Create a Google Cloud service account with Sheets API access
2. Share your spreadsheet with the service account email
3. Add to `server/.env`:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY\n-----END RSA PRIVATE KEY-----\n"
   GOOGLE_SPREADSHEET_ID=your_sheet_id_from_url
   ```
   > **Critical**: The private key must have literal `\n` in the .env string (not real newlines). The server handles conversion automatically.

4. Configure sheet tab names in Admin → Settings (defaults: Hires, Goals, Notes, Overrides)

**Expected sheet structure:**

| Tab | Required columns |
|-----|-----------------|
| Hires | agent_id (Convoso agent ID), week (YYYY-MM-DD) |
| Goals | agent_id, week, metric, target |
| Notes | agent_id, week, note |
| Overrides | agent_id, week, + any stat field to override |

---

## Sync Schedule

Default cron: `*/15 7-20 * * 1-5` (every 15 min, 7am–8pm weekdays)

Change in Admin → Settings → Sync Cron Schedule, then restart the server container for the new schedule to take effect.

**Manual sync**: Admin → Manual Sync → Run Sync Now

Live sync progress broadcasts via WebSocket — the header shows a spinning indicator while running.

---

## User Management

### Add a rep user

1. After a sync, the rep appears in Admin → Reps
2. Go to Admin → Users → create a user with the rep's email
3. Link the user to the rep record (or link via `userId` on the Rep model)

Rep users can:
- See their own stats (anonymized leaderboard)
- See their own insights and goals
- Read manager notes on their profile
- Access Efficiency, Trends, Metrics (own data only)

Manager users can:
- See all reps' data
- Add/edit notes and goals
- Manage users and settings
- Trigger syncs
- Access Admin and Clients pages

### Reset a password

Admin → Users → Reset PW (prompts for new password)

---

## Development

### Run server without Docker

```bash
cd server
npm install
# Set DATABASE_URL in .env to point to a local or Docker postgres
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

### Run client without Docker

```bash
cd client
npm install
# Update vite.config.js proxy target to http://localhost:4000 if server isn't in Docker
npm run dev
```

---

## Architecture Notes

- **Stats are computed at the API layer** — raw counts are stored, derived ratios (contact rate, sched%, etc.) are computed on every request. This means the insight engine always runs against source truth.
- **Composite score** uses percentile ranking across the current team — a score of 75 means this rep is in the 75th percentile, not that they hit 75% of some absolute target. This re-ranks automatically as the team improves.
- **Rep role anonymization** on the leaderboard is deterministic: reps are sorted by composite score and labeled Rep A, B, C... The logged-in rep always sees their real name highlighted.
- **WebSocket** connection shares the same port as HTTP — using `http.createServer(app)` pattern. The Vite proxy handles WS forwarding in dev.
- **Convoso field mapping** is isolated in `server/services/convosoService.js` `mapAgentRow()`. If the API response format changes, only this function needs updating.

---

## Metric Reference

See the in-app **Glossary** page (`/glossary`) for full metric definitions, formulas, and benchmarks.

Quick reference:

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Contact Rate | contacts / calls | ≥55% |
| Schedule Rate | sched / contacts | ≥22% |
| Sched / Hour | sched / loginHrs | Team avg |
| Hang-Up Rate | hu / contacts | ≤30% |
| NGF Rate | ngf / contacts | ≤45% |
| Pause % | pauseMin / totalMin | Low |
| EOD Yes Rate | eodYes / (eodYes+eodNo) | ≥35% |
| Composite Score | Weighted percentile rank | ≥70 = top tier |

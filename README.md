# Jaci — a private, cinematic birthday surprise ❤️

A complete, mobile-first, interactive birthday experience built for **Jacinta Abena Ammoanimaa**.
It is not a "birthday website" — it's a digital love story she physically interacts with:
a glowing heart, a bow-and-arrow she must actually draw and release, a secret lock, a story,
memories, a letter, a birthday reveal, and a final surprise.

Everything Jacinta sees is driven by a central configuration that you edit from a private
admin dashboard — no code changes required.

## Tech stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** + **Framer Motion**
- **Hono** API — runs on Node for local dev, and deploys as a **Cloudflare Worker**
- **Cloudflare D1** for the database (config, memories, media metadata, draft/published state)
- **Cloudflare Workers Assets** for the static site
- **Cloudinary** for photos / videos / audio (with a local-upload fallback)

```
src/            frontend (components, sections, admin, hooks, lib, types, context)
server/         framework-agnostic Hono API + storage/auth/Cloudinary + adapters
  app.ts          the API (routes + logic) — runtime-agnostic
  storage.ts      StorageAdapter interface (read/write of the whole config store)
  storageD1.ts    Cloudflare D1 adapter (production database)
  storageFile.ts  local JSON-file adapter (local Node dev / `npm start`)
  worker.ts       Cloudflare Workers entry (uses D1)
  nodeApp.ts      Node entry (dev plugin + `npm start`)
migrations/     D1 SQL migrations
data/           local store for the Node dev server (gitignored)
public/         static assets
wrangler.jsonc  Cloudflare Workers + Assets + D1 configuration
```

---

## 1. Install

```bash
npm install
```

Requires **Node 18+** (Node 20/22 recommended).

## 2. Run locally

```bash
npm run dev
```

Open http://localhost:5173 — the experience is at `/`, the admin dashboard at `/admin`.

`npm run dev` runs a single server: Vite serves the frontend and the Hono API is mounted
on the same port under `/api/*` and `/media/*`.

## 3. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | The password for the admin dashboard. **Required in production.** |
| `AUTH_SECRET` | Signs the admin session cookie. Use a long random string. |
| `STORAGE_PATH` | Where the config JSON is stored (default `data/config.json`). |
| `PORT` | Port for `npm start` (default 8787). |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional). |
| `CLOUDINARY_API_KEY` | Cloudinary API key (optional). |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret — **never exposed to the browser**. |
| `CLOUDINARY_FOLDER` | Base upload folder (default `jacinta-birthday`). |

For local development without a `.env`, a dev password `jacinta-admin` is used with a
warning in the console. In production, admin login is **disabled** unless `ADMIN_PASSWORD` is set.

> These `.env` variables apply to the **Node** dev server (`npm run dev` / `npm start`).
> On **Cloudflare**, the same values are set as Worker secrets via `wrangler secret put`
> (see §15).

## 4. Configure Cloudinary

1. Create an account at https://console.cloudinary.com and copy your **Cloud name**,
   **API key** and **API secret**.
2. Put them in `.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
3. Restart the server.

Uploads are **signed server-side**: the browser receives a one-shot signature and uploads
directly to Cloudinary. Your API secret never appears in frontend code.

If Cloudinary is **not** configured, the admin can still upload media — files are stored
locally on the server under `data/uploads/` and served from `/media/*`. (Local uploads are
Node-only; on Workers/Vercel use Cloudinary.)

## 5. Create the admin account

The admin account is a single password (no database of users):

1. Set `ADMIN_PASSWORD` in `.env`.
2. Visit `/admin` and sign in.

The session is an **httpOnly, signed cookie** (7 days). Log out from the dashboard.

## 6. Upload photos

Admin → **Cloudinary Media** → **Upload media**. Choose a destination folder
(`entrance/`, `memories/`, `gallery/`, `videos/`, `birthday/`, `final-surprise/`).
JPG, JPEG, PNG, WEBP (and more) are supported.

## 7. Upload videos

Same place as photos. MP4, WEBM and MOV (where supported) are accepted. Videos are
delivered with Cloudinary transformations (`q_auto,f_auto`) and lazy-loaded with a poster frame.

## 8. Add memories (the timeline)

Admin → **Our Story** → **+ Add a moment**. Each entry supports date, title, description,
location, caption, photos/videos (picked from the library), and show/hide + reorder.

## 9. Edit the secret question

Admin → **Secret Lock** → **Question**. The default question is:

> Which lecture theatre did we meet for the first time?

…but everything is editable.

## 10. Change the secret answer

Admin → **Secret Lock** → **Correct answer (secret)**. Then **Save Draft** and **Publish**.

The answer is **validated on the server only** (`POST /api/answer`) — it is never embedded
in the frontend JavaScript. You can also configure:

- max attempts (0 = unlimited)
- case sensitivity
- whitespace trimming
- the wrong-answer / correct-answer messages
- lock animation and unlock sound

## 11. Edit the birthday letter

Admin → **Birthday Letter**. Use the rich-text toolbar for **bold**, *italic*, underline,
bullet/numbered lists and line breaks. Rich text is sanitised before saving and rendering.

## 12. Change the final surprise

Admin → **Final Surprise**. Edit the tease lines, title, message, button, an optional
image/video, plus optional date/time, location and instructions.

## 13. Preview

From anywhere in the dashboard click **Preview as Jacinta**. This renders the **draft**
exactly as she will see it (entrance → arrow → lock → ready → story → memories → reveal →
letter → surprise → closing) with a stage-jumper, **without publishing**.

## 14. Publish

- **Save Draft** stores your changes without touching the live experience.
- **Publish** copies the draft to the published configuration that `/` serves.
- **Revert draft** restores the draft from the published version.
- **Reset all** restores the defaults.

The public site always reads the **published** configuration. The answer is checked
server-side, so drafts are safe.

## 15. Deploy to Cloudflare (recommended)

The production backend is a **Cloudflare Worker** (serverless API) and the database is
**Cloudflare D1**. One `wrangler.jsonc` deploys the static site (Workers Assets), the API,
and the D1 database together.

### 15a. What controls the backend & database

| Concern | Where it lives |
| --- | --- |
| API logic & routes | `server/app.ts` (runtime-agnostic Hono app) |
| Database access | `server/storageD1.ts` → Cloudflare **D1** (`env.DB` binding) |
| Storage interface | `server/storage.ts` (`read()` / `write()` of the whole config) |
| Worker entry | `server/worker.ts` |
| Local Node dev storage | `server/storageFile.ts` → `data/config.json` (only for `npm run dev` / `npm start`) |
| Database schema | `migrations/0001_init.sql` |

The whole experience is driven by one centralised `Store` document (draft + published
config + metadata), persisted as a single row in D1 (`config_store` table). Media files are
never stored in the database — only their Cloudinary public IDs / URLs are.

### 15b. Deploy steps

```bash
# 1. Log in to Cloudflare (once)
npx wrangler login

# 2. Create the D1 database and copy the returned database_id
npm run cf:db:create
#    → paste the id into wrangler.jsonc: "database_id": "<your-id>"

# 3. Apply the schema to the database
npm run cf:db:migrate

# 4. Set secrets (kept out of git and out of the dashboard UI)
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put AUTH_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET

# 5. Build + deploy (static assets + Worker + D1)
npm run cf:deploy
```

### 15c. Run the full Cloudflare stack locally

```bash
npm run build            # build the static site once
npm run cf:dev           # wrangler dev — local Worker + local D1 + assets
```

`wrangler dev` reads local secrets from `.dev.vars` (gitignored — see `.dev.vars` in this
repo) and uses a local D1 database under `.wrangler/state`.

> Note: the Node-only local media upload (`/media/*`) is unavailable on Workers — use
> Cloudinary for media in production. Secret-answer attempt limiting is per-isolate on
> Workers (fine for a private surprise; the limit is enforced per browser session).

### Alternatives

- **Vercel**: mount the same Hono app (`server/app.ts`) in an `api/[[...path]].ts`
  function, serve `dist/` as the static site, and use Vercel KV/Blob for storage +
  Cloudinary for media.
- **Any Node host**: `npm run build && npm start` — serves `dist/` + API + `/media/*` on
  `PORT` (default 8787), using the JSON-file store.

---

## How the experience flows

Countdown (optional) → Cinematic opening → Tiny glowing heart → **Bow & arrow**
(pull back, release, heart impact) → Secret lock & question → "Are you ready?" /
"Are you sure?" → Our Story → Memories gallery → Things I Don't Say Enough →
Second heart moment → Birthday reveal (confetti + fireworks) → Personal letter →
Final surprise → Closing.

## Security notes

- Admin password and Cloudinary secrets live **only** in server environment variables.
- Admin routes require a signed httpOnly session cookie.
- The secret answer is checked server-side with constant-time comparison; the answer is
  never sent to the browser.
- Rich text is sanitised (scripts, event handlers and `javascript:` URLs are stripped).
- Uploads are size-limited, and local uploads are type-checked via MIME.

## Reduced motion & accessibility

The whole experience respects `prefers-reduced-motion` (particles, confetti and animations
are minimised), uses semantic HTML, keyboard navigation, alt text and focus states.

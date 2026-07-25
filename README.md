# موقع مستر أنس أحمد — V1

Website for **مستر أنس أحمد (Mr. Anas Ahmed)** — البرمجة والذكاء الاصطناعي, Egyptian
Bacc programme, Engineering & Computer Science track.

**One job:** turn an interested visitor into a trusted lead.
YouTube teaches and builds first trust; this site verifies, deepens it, removes
hesitation, and captures the lead.

> Scope is **V1 only**, exactly as approved in `Website_Implementation_Roadmap.md`.
> Ideas outside that scope go to [`docs/future-improvements.md`](docs/future-improvements.md) — never into the code.

---

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel

Arabic-first (RTL), mobile-first, static-rendered, minimal client JS.

---

## Project structure

```
web/
├── public/
│   └── llms.txt                  # canonical facts for AI systems
├── supabase/
│   └── schema.sql                # run once in the Supabase SQL editor
├── docs/
│   └── future-improvements.md    # parking lot — not implemented
└── src/
    ├── app/
    │   ├── layout.tsx            # <html lang="ar" dir="rtl">, font, metadata
    │   ├── page.tsx              # home — the full persuasion arc, one scroll
    │   ├── parents/page.tsx      # the page a student sends home
    │   ├── links/page.tsx        # official accounts registry
    │   ├── privacy/page.tsx      # plain-Arabic privacy policy
    │   ├── not-found.tsx         # designed 404
    │   ├── opengraph-image.tsx   # WhatsApp/social share card
    │   ├── sitemap.ts · robots.ts
    │   ├── globals.css
    │   └── api/lead/route.ts     # the only API route
    ├── components/
    │   ├── sections/             # Hero, Numbers, System, Story, Practical,
    │   │                         # Transparency, ParentBridge, Capture
    │   ├── ui/                   # Container, Section, Button
    │   ├── LeadForm.tsx          # 3 required fields + optional referral
    │   ├── VideoFacade.tsx       # click-to-load YouTube (no eager iframe)
    │   ├── WhatsAppButton.tsx · SiteHeader.tsx · SiteFooter.tsx · JsonLd.tsx
    ├── content/                  # ← edit copy here, no code knowledge needed
    │   ├── copy.ts               # every Arabic string on the site
    │   ├── site.ts               # name, contacts, channels, open decisions
    │   └── assets.ts             # proof-asset registry (all slots start null)
    └── lib/
        ├── supabase.ts · validation.ts · schema-org.ts
        └── analytics.ts · utm.ts · utils.ts
```

### Editing content without a developer

Almost all copy lives in `src/content/copy.ts`. Edit it directly on GitHub
(pencil icon → commit) and Vercel redeploys automatically in ~2 minutes.

---

## Setup

```bash
cd web
npm install
cp .env.example .env.local     # fill in the values
npm run dev                    # http://localhost:3000
```

Useful scripts:

```bash
npm run build       # production build
npm run typecheck   # TypeScript, no emit
npm run lint        # ESLint (next/core-web-vitals)
```

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | after domain decision | Canonical URLs, sitemap, OG. Falls back to the Vercel URL |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server only.** Never expose; never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ | International format, digits only (e.g. `201039356737`) |
| `NEXT_PUBLIC_YOUTUBE_URL` etc. | recommended | Only filled channels appear on `/links` and in `sameAs` |
| `LEAD_WEBHOOK_URL` | recommended | n8n/Frappe endpoint that sends the WhatsApp confirmation |
| `LEAD_WEBHOOK_SECRET` | optional | Sent as `X-Webhook-Secret` for the receiver to verify |

If `LEAD_WEBHOOK_URL` is unset, leads are still saved — the site never loses a
lead because automation is down.

---

## Database

Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL Editor.

One table, `public.leads`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | pk |
| `created_at` | timestamptz | default `now()` |
| `name` | text | required |
| `whatsapp` | text | required, normalised to `01XXXXXXXXX` |
| `grade` | text | `first` \| `second` \| `other` |
| `referred_by` | text | optional — measures the referral engine |
| `intent` | text | `curriculum` \| `intro_session` \| `updates` \| `parent` |
| `note` | text | parents page only |
| `page_context`, `source`, `utm` | text/jsonb | attribution |
| `status` | text | `new` → `contacted` → `booked` → `enrolled` \| `closed` |

**Security:** RLS is enabled with **no policies**, so the public key can neither
read nor write. All writes go through `/api/lead` using the service role key.
Minors' data — collect the minimum, never share (Principle 31).

---

## Deploying to Vercel

1. Push this folder to `github.com/Anas18844/mr_anas_website` (see below).
2. Vercel → **Add New Project** → import the repo.
3. Framework preset: **Next.js**. Root directory: **`/`** (this folder is the repo root).
4. Add every environment variable from the table above (Production + Preview).
5. Deploy. `main` → production; every PR gets its own preview URL.
6. **After the domain decision:** add the domain in Vercel → Settings → Domains,
   set `NEXT_PUBLIC_SITE_URL` to it, redeploy, then submit `/sitemap.xml` in
   Google Search Console.

### First push

```bash
cd web
git init
git add .
git commit -m "V1: capture core"
git branch -M main
git remote add origin https://github.com/Anas18844/mr_anas_website.git
git push -u origin main
```

> The repo root is `web/`, so the internal strategy documents in the parent
> folder stay out of the repository.

---

## Working agreement

- Branch off `dev`, open a PR, review the preview **on a real budget Android
  phone**, then merge to `main`.
- Before merging: `npm run build`, Lighthouse mobile, check for broken links,
  and proofread any changed Arabic copy.
- Performance budget (roadmap §3.4): Lighthouse mobile ≥ 95, LCP ≤ 2.0s,
  CLS < 0.05, JS ≤ 120KB gzipped, zero external requests on first load.

---

## Adding proof assets later

Every proof slot is reserved in `src/content/assets.ts` and starts as `null`.
While a slot is empty **nothing renders** — never a placeholder, never a
"coming soon". To add one: drop the file into `public/images/` (or note the
YouTube id) and fill the slot. Nothing else changes.

Priority order when assets arrive (Doc 04): weekly report sample → teaching
sample → platform demo → founder portrait → session photo.

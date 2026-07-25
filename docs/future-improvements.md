# Future Improvements — Parking Lot

Ideas that surfaced during V1 implementation. **None of these are implemented.**
They are recorded here so they are not lost and not built.

Nothing on this list may be started before V1 is live and stable, and before the
owner explicitly approves it against the approved roadmap (V2/V3 scope).

---

## Deferred to V2 (already in the approved roadmap — listed for continuity)

- Bacc Knowledge Hub (3 complete reference pieces, MDX-based).
- Ministerial-update publishing template with visible dates.
- Deeper entity layer: `Article`/`Author` schema per reference piece.
- Expanded FAQ built from questions that actually arrive on WhatsApp.
- Google Business Profile + cross-channel bio alignment.
- Short centres brief (currently only a footer contact link).

---

## Technical ideas (not approved, not scheduled)

| Idea | Why it was tempting | Why it is not in V1 |
|---|---|---|
| Admin dashboard for leads | Nicer than reading Supabase's table view | Supabase's built-in table editor is enough for one person; a dashboard is a whole product |
| Rate limiting via Upstash/Redis | Stronger abuse protection | Honeypot + timing check + 10-minute dedupe covers realistic abuse at this traffic; adds a paid dependency |
| Server Actions instead of a route handler | Slightly less code | The route handler is explicit, easy to test with curl, and easy for another dev to reason about |
| A/B testing framework | Optimising the form | First-season traffic cannot reach significance; Doc 05 §8 prescribes the qualitative question instead |
| Motion/animation library | Premium feel | Contradicts Principle 24 (quiet is the differentiator) and costs performance budget |
| CMS (Sanity/Payload/Contentlayer) | Easier content editing | Content is small and rarely changes; GitHub web UI editing already satisfies "no developer needed" |
| Self-hosted video | Full control over the player | Enormous bandwidth cost; the YouTube facade is faster and the channel is where video belongs |
| i18n / English version | Wider reach | Explicitly rejected in the approved strategy |
| PWA / offline support | Feels advanced | No user need identified; adds a service worker to maintain |
| Dark/light theme toggle | Common feature | The brand is a single dark identity; a toggle would fracture it |

---

## Content/design ideas (not approved)

- A "seasonal mode" switch that changes the hero's priority automatically — V3 in
  the roadmap, and even then it should be a manual switch, not a rules engine.
- Interactive "try the code editor" demo on the site — explicitly rejected in
  Strategy §4.6 (blurs the site/platform boundary).
- Live counters (students, sessions) — only permissible with real numbers, and
  only once they are worth showing (Doc 03, type 6).
- Comparison content against named competitors — permanently forbidden
  (Principle 19).

---

## Operational ideas worth raising with the owner (decisions, not code)

- A weekly 10-minute review of new leads by source — cheap, and it is the only
  way the "which content brings students" question ever gets answered.
- Recording one real teaching sample and one platform walkthrough as a single
  filming session — unblocks the two highest-impact proof assets at once.
- Producing one genuine weekly-report screenshot (real structure, dummy data,
  clearly labelled) if real consented data is not available before launch.

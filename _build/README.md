# _build — site generators & content sources

Everything in this folder builds or transforms the site. Nothing here is served
publicly (`/_build/*` is blocked with a 404 in `_redirects`). All scripts resolve
the repo root relative to this folder, so they run from any checkout:

```
cd _build
node <script>.js
```

## Active pipeline

| Script | What it does | Run when |
|---|---|---|
| `build-articles.js <content.json> <repoRoot>` | Emits `/resources/<slug>` article pages + sitemap entries from a structured content JSON | New article batch |
| `build-resources.js` | Rebuilds `/resources` landing + the `/resources/articles` gallery by scanning articles on disk | After any article batch, always before build-related |
| `build-related.js` | Converts each article's end-of-page CTA into a same-category "Related reading" bridge | After build-resources |
| `build-automations.js` | Emits `/automations` hub + 15 build guides + `/automations/setup` from `automations-content.json`; sweeps nav labels | Automations content changes |
| `build-builders.js` | Emits `/builders` (founder + open roles), Dave's profile page, homepage builders band | Roles/founder changes (edit the ROLES array in the script) |
| `build-templates.js` | Emits `/resources/templates` hub + 7 template detail pages (fill-in fields, copy/download) from `templates-content.json` | Template content changes |
| `build-glossary.js` / `build-glossary-full.js` / `link-glossary.js` | Glossary page build + in-article glossary term linking | Glossary changes |

**Article batch order:** `build-articles.js` → `build-resources.js` → `build-related.js`, then link-check.

Content JSONs consumed by the pipeline sit next to the scripts
(`automations-content.json`, `templates-content.json`, `builders-content.json`).

## content/

The structured content sources for published article batches (Pillar 1,
vendors, comparisons, head-to-heads, connecting-systems, build-vs-buy…).
Kept for regeneration and provenance.

## archive/

One-time sweeps that have already been applied to the tree (GTM install,
consent wiring, mega-menu rollout, mobile-nav fix, offering renames, /learn
retirement, audience pages) plus intermediate artifacts. Kept for reference —
**do not re-run** without reading them first; most are idempotent but assume
the pre-sweep state of the site.

## Conventions the generators must preserve

- Every emitted page carries: GTM + consent-default snippets in `<head>`,
  the noscript iframe after `<body>`, the mega nav + footer read from
  `index.html` at build time, `/js/consent.js` and `/js/main.js` includes.
- One solid-lime `.btn-primary` per page (the funnel action).
- End-of-page: no CTA that duplicates the footer banner — use a
  `.tf-explore` related-content bridge instead.
- "Sprint" = engagement language; "Automations" = the library.
- No pricing/free-paid claims for the Audit; no invented metrics anywhere.

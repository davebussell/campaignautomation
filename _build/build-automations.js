// Repositions the sprint catalog as the Automations library:
//  1) sweeps nav/footer/menu labels + sitewide links (Automation Sprints -> Automations),
//  2) emits /automations (hub), /automations/setup, /automations/<slug> x15 build guides
//     from automations-content.json (workflow output),
//  3) retires /solutions/automation-sprints + /solutions/sprints/* with 301 redirects,
//  4) updates sitemap. "Sprint" stays as engagement language (audit/training/builders).
// Run: node build-automations.js
const fs = require('fs'), path = require('path');
const ROOT = require('path').resolve(__dirname, '..'); // repo root (scripts live in <repo>/_build)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');

const CONTENT = JSON.parse(fs.readFileSync(path.join(__dirname, 'automations-content.json'), 'utf8'));
const GUIDES = CONTENT.guides, HUB = CONTENT.hub;
if (!GUIDES || GUIDES.length !== 15 || !HUB) throw new Error('automations-content.json incomplete');

// slug -> proposal-form sprint id (request-proposals SPRINT_META_PAGE keys)
const PROPOSAL_ID = {
  'data-access-dashboards': 'found-data-access', 'data-pipeline-integration': 'found-data-pipeline',
  'measurement-repair': 'found-measurement', 'campaign-structure-naming': 'found-structure',
  'automation-governance': 'found-governance', 'ai-brief-machine': 'ai-brief',
  'search-term-intelligence': 'search-term-intel', 'competitive-intelligence': 'competitive-intel',
  'content-atomization': 'content-atomization', 'content-brief': 'content-brief',
  'campaign-launch-kit': 'launch-kit', 'ppc-intelligence': 'ppc-intelligence',
  'seo-ppc-opportunity': 'seo-ppc', 'event-followup': 'event-followup', 'lead-reactivation': 'lead-reactivation',
};
const CAT = {
  'data-access-dashboards': 'Foundation', 'data-pipeline-integration': 'Foundation', 'measurement-repair': 'Foundation',
  'campaign-structure-naming': 'Foundation', 'automation-governance': 'Foundation',
  'ai-brief-machine': 'Content', 'content-atomization': 'Content', 'content-brief': 'Content',
  'search-term-intelligence': 'Paid media', 'campaign-launch-kit': 'Paid media', 'ppc-intelligence': 'Paid media', 'seo-ppc-opportunity': 'Paid media',
  'competitive-intelligence': 'Research', 'event-followup': 'RevOps', 'lead-reactivation': 'RevOps',
};
// guides where an automated AuditDemand audit is the natural first step
const AUDITDEMAND_SLUGS = new Set(['ppc-intelligence', 'search-term-intelligence', 'seo-ppc-opportunity', 'measurement-repair']);
// old detail-page path -> new slug (for link sweep + redirects)
const OLD_DETAIL = {
  '/solutions/sprints/content-brief': 'content-brief', '/solutions/sprints/campaign-launch': 'campaign-launch-kit',
  '/solutions/sprints/ppc-intelligence': 'ppc-intelligence', '/solutions/sprints/seo-ppc': 'seo-ppc-opportunity',
  '/solutions/sprints/event-followup': 'event-followup', '/solutions/sprints/lead-reactivation': 'lead-reactivation',
};

// NOTE: '_build' is excluded so the sweep can never rewrite these scripts' own
// source strings (that self-sweep happened once, 2026-07-03, after the move into
// the repo — the historical from-strings below were restored by hand).
function walk(d) { let o = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['node_modules', '.git', '_build'].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) o = o.concat(walk(p)); else if (/\.(html|js)$/.test(e.name)) o.push(p); } return o; }

/* ── 1) SITEWIDE SWEEP (labels + links; historical migration — already applied
       to the whole tree on 2026-07-02; harmless no-op on the current tree) ── */
let swept = 0;
for (const f of walk(ROOT)) {
  let s = fs.readFileSync(f, 'utf8'); const b = s;
  // mega nav offering
  s = s.split('<a href="/solutions/automation-sprints"><span class="mega-t">Automation Sprints</span><span class="mega-d">Build one governed workflow in 2–4 weeks</span></a>')
       .join('<a href="/automations"><span class="mega-t">Automations</span><span class="mega-d">Build guides — stand each one up yourself or with us</span></a>');
  // mobile menu + footer plain links
  s = s.split('<a href="/solutions/automation-sprints">Automation Sprints</a>').join('<a href="/automations">Automations</a>');
  // old detail pages -> new guides (before the generic catalog rewrite)
  for (const [oldP, slug] of Object.entries(OLD_DETAIL)) s = s.split(oldP).join('/automations/' + slug);
  // remaining catalog references (hrefs + JS strings, incl. main.js/scorecard/get-started)
  s = s.split('/solutions/automation-sprints').join('/automations');
  if (s !== b) { fs.writeFileSync(f, s, 'utf8'); swept++; }
}
console.log('Link/label sweep touched ' + swept + ' files');

/* ── 1.5) CONTENT LABEL FIXES (homepage cards + proposals empty-state) ── */
{
  const f = path.join(ROOT, 'index.html');
  let s = fs.readFileSync(f, 'utf8'); const b = s;
  s = s.split('<span class="label-signal">Automation Sprints</span>').join('<span class="label-signal">Automations</span>');
  s = s.split('class="btn-ghost">Explore Automation Sprints →</a>').join('class="btn-ghost">Explore the Automations →</a>');
  s = s.split('Each sprint is a 2–4 week engagement. One workflow fully automated, handed over with guardrail config, prompt packs, and AGENTS.md.')
       .join('Each automation ships with a full build guide — stand it up yourself on manual data extracts or through MCP integrations, or have us build it as a governed sprint.');
  s = s.split("we'll point you to the right sprint.").join("we'll point you to the right automation.");
  // card titles: drop the " Sprint" suffix; meta lines: guide framing instead of service pricing
  s = s.split('<h4>PPC Intelligence Sprint</h4>').join('<h4>PPC Intelligence</h4>');
  s = s.split('<h4>Campaign Launch Kit Sprint</h4>').join('<h4>Campaign Launch Kit</h4>');
  s = s.split('<h4>SEO/PPC Opportunity Sprint</h4>').join('<h4>SEO/PPC Opportunity</h4>');
  s = s.split('<h4>Lead Reactivation Sprint</h4>').join('<h4>Lead Reactivation</h4>');
  s = s.split('<h4>Event Follow-Up Sprint</h4>').join('<h4>Event Follow-Up</h4>');
  s = s.split('<h4>Content Brief Sprint</h4>').join('<h4>Content Brief</h4>');
  s = s.replace(/<div class="url" aria-hidden="true">[^<]*\$[^<]*<\/div>/g, '<div class="url" aria-hidden="true">Build guide · Manual or MCP</div>');
  if (s !== b) fs.writeFileSync(f, s, 'utf8');
  console.log('Homepage automation-card labels updated: ' + (s !== b));
}
{
  const f = path.join(ROOT, 'request-proposals/index.html');
  let s = fs.readFileSync(f, 'utf8'); const b = s;
  s = s.split('browse the catalog →').join('browse the automations →');
  if (s !== b) fs.writeFileSync(f, s, 'utf8');
  console.log('Proposals empty-state label updated: ' + (s !== b));
}

// main.js label nudges (engagement wording -> library wording for the catalog stage)
{
  const f = path.join(ROOT, 'js/main.js');
  let s = fs.readFileSync(f, 'utf8'); const b = s;
  s = s.split("label:'Browse Sprints →'").join("label:'Browse Automations →'");
  s = s.split("next:'automation-sprints'").join("next:'automations'");
  s = s.split("v.includes('automation-sprints')").join("v.includes('automations')");
  s = s.split("'Plan your sprints →'").join("'Browse Automations →'");
  if (s !== b) fs.writeFileSync(f, s, 'utf8');
  console.log('main.js funnel labels updated: ' + (s !== b));
}

/* ── 2) CHROME (post-sweep) ── */
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const NAV = idx.slice(idx.indexOf('<a href="#main-content"'), idx.indexOf('<div class="page-wrap">')).trimEnd();
const FOOTER = idx.slice(idx.indexOf('<footer class="site-footer"'), idx.indexOf('</footer>') + '</footer>'.length);
const navCur = NAV.replace('<a href="/automations"><span class="mega-t">Automations</span>', '<a href="/automations" aria-current="page"><span class="mega-t">Automations</span>');

const GTMHEAD = `<meta charset="UTF-8">
<!-- Google consent mode v2 default (denied until the visitor chooses) -->
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TD5GPWN5');</script>
<!-- End Google Tag Manager -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">`;
const GTMNS = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TD5GPWN5"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const AUTO_CSS = `  .au-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
  .au-chip{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--mist2);border:1px solid var(--border);border-radius:4px;padding:5px 10px}
  .au-chip.sig{color:var(--signal);border-color:var(--signal-dim)}
  .au-outcome{border-left:4px solid var(--signal);border-top:1px solid var(--border);border-right:1px solid var(--border);border-bottom:1px solid var(--border);padding:16px 20px;max-width:720px;margin-top:22px;font-size:15px;color:var(--mist2);line-height:1.6}
  .au-steps{list-style:none;padding:0;margin:26px 0 0;counter-reset:au}
  .au-steps li{position:relative;padding:18px 0 18px 64px;border-bottom:1px solid var(--border);counter-increment:au}
  .au-steps li:last-child{border-bottom:none}
  .au-steps li::before{content:"0" counter(au);position:absolute;left:0;top:20px;font-family:var(--f-display);font-size:26px;font-weight:800;color:var(--slate2);letter-spacing:-.02em}
  .au-steps h3{font-family:var(--f-display);font-size:16.5px;font-weight:700;color:var(--bone);margin:0 0 6px;letter-spacing:-.01em}
  .au-steps p{font-size:14px;color:var(--mist2);line-height:1.65;margin:0;max-width:680px}
  .section.bone .au-steps li{border-color:var(--border-bone,#ddd8cc)}
  .section.bone .au-steps h3{color:var(--ink)}
  .section.bone .au-steps p{color:#444}
  .section.bone .au-steps li::before{color:#d8d4c8}
  .au-note{font-family:var(--f-mono);font-size:12px;color:var(--mist);letter-spacing:.03em;margin-top:18px}
  .section.bone .au-note{color:#666}
  .au-kv{border:1px solid var(--border);border-radius:6px;overflow:hidden;margin-top:22px;max-width:760px}
  .au-kv .kw-row{padding:13px 18px}
  .au-guard{border:1px solid var(--signal-dim);background:rgba(200,241,53,.04);border-radius:8px;padding:22px 24px;max-width:760px;margin-top:22px}
  .au-guard ul{list-style:none;padding:0;margin:0;display:grid;gap:10px}
  .au-guard li{position:relative;padding-left:24px;color:var(--mist2);font-size:14px;line-height:1.6}
  .au-guard li::before{content:'\\2713';position:absolute;left:0;color:var(--signal)}
  .au-setup-box{border:1px solid var(--border);border-left:4px solid var(--signal);padding:18px 22px;max-width:760px;margin-top:26px;font-size:14px;color:var(--mist2);line-height:1.65}
  .au-setup-box a{color:var(--signal)}
  .au-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
  .au-card{border:1px solid var(--border);border-radius:10px;padding:24px;background:var(--slate);display:flex;flex-direction:column;gap:12px;min-width:0;text-decoration:none;transition:border-color .15s,transform .15s}
  .au-card:hover{border-color:var(--signal-dim);transform:translateY(-2px)}
  .au-card h3{font-family:var(--f-display);font-size:17px;font-weight:700;color:var(--bone);margin:0;line-height:1.25;letter-spacing:-.01em}
  .au-card p{font-size:13.5px;color:var(--mist2);line-height:1.6;margin:0;flex:1}
  .au-card .au-go{font-family:var(--f-mono);font-size:12px;color:var(--signal);letter-spacing:.03em}
  .au-bar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 16px}
  .au-chips{display:flex;gap:8px;flex-wrap:wrap}
  .au-fchip{font-family:var(--f-mono);font-size:11px;letter-spacing:.04em;background:transparent;color:var(--mist2);border:1px solid var(--border);padding:8px 12px;cursor:pointer;transition:all .13s;border-radius:3px;white-space:nowrap}
  .au-fchip:hover{border-color:var(--mist2);color:var(--bone)}
  .au-fchip.on{background:var(--signal);color:var(--ink);border-color:var(--signal);font-weight:600}
  .au-count{font-family:var(--f-mono);font-size:12px;color:var(--mist);letter-spacing:.04em;margin:0 0 18px}
  .au-count b{color:var(--signal)}
  .au-paths{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px;max-width:760px}
  .au-path{border:1px solid var(--border);border-radius:8px;padding:18px 20px}
  .au-path b{display:block;font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--signal);margin-bottom:8px}
  .au-path p{font-size:13.5px;color:var(--mist2);line-height:1.6;margin:0}
  @media(max-width:760px){.au-paths{grid-template-columns:1fr}}
  .au-gate{border:2px solid var(--signal);border-radius:10px;padding:34px 32px;max-width:760px;margin-top:22px;box-shadow:0 0 60px rgba(200,241,53,.07)}
  .au-gate h2{font-family:var(--f-display);font-size:clamp(22px,3vw,30px);font-weight:800;letter-spacing:-.01em;color:var(--bone);margin:0 0 10px}
  .au-gate-sub{font-size:14.5px;color:var(--mist2);line-height:1.65;margin:0 0 8px;max-width:640px}
  .au-gate-list{list-style:none;padding:0;margin:14px 0 22px;display:grid;gap:8px}
  .au-gate-list li{position:relative;padding-left:24px;color:var(--mist2);font-size:14px;line-height:1.55}
  .au-gate-list li::before{content:'\\2713';position:absolute;left:0;color:var(--signal)}
  .au-gate-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
  .au-gate-fields label{display:block;font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mist)}
  .au-gate-fields input{width:100%;margin-top:6px;background:var(--slate2);border:1px solid var(--border);color:var(--bone);font-family:var(--f-body);font-size:14.5px;padding:11px 12px;border-radius:4px;outline:none;transition:border-color .15s;box-sizing:border-box}
  .au-gate-fields input:focus{border-color:var(--signal)}
  .au-gate-consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--mist2);line-height:1.55;margin:0 0 16px;cursor:pointer;max-width:640px}
  .au-gate-consent input{margin-top:3px;accent-color:var(--signal);flex-shrink:0}
  .au-gate-captcha{margin:0 0 16px}
  .au-gate-fine{font-family:var(--f-mono);font-size:11px;color:var(--mist);letter-spacing:.03em;line-height:1.6;margin:14px 0 0}
  .au-gate-fine a{color:var(--mist2)}
  .au-gated{display:none}
  .au-unlocked-note{display:none;border:1px solid var(--signal-dim);background:rgba(200,241,53,.05);border-radius:6px;padding:14px 18px;max-width:760px;margin-top:22px;font-family:var(--f-mono);font-size:12px;color:var(--signal);letter-spacing:.04em}
  html.au-open .au-gated{display:block}
  html.au-open .au-gate{display:none}
  html.au-open .au-unlocked-note{display:block}
  @media(max-width:560px){.au-gate-fields{grid-template-columns:1fr}.au-gate{padding:26px 20px}}`;

function head(o) {
  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
${GTMHEAD}
<title>${o.title}</title>
<meta name="description" content="${escAttr(o.desc)}">
<link rel="canonical" href="https://campaignautomation.ai${o.path}">
<link rel="alternate" hreflang="en-CA" href="https://campaignautomation.ai${o.path}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>
${AUTO_CSS}
</style>
<script type="application/ld+json">
${o.ld}
</script>
<script defer src="/js/consent.js"></script>
${o.extraHead || ''}</head>
<body>
${GTMNS}
${navCur}

<div class="page-wrap">
<main id="main-content">`;
}
const tail = `</main>

${FOOTER}
</div>
<script src="/js/main.js"></script>`;

const crumb = items => '<nav class="breadcrumb" aria-label="Breadcrumb">' + items.map((it, i) => it[1] ? '<a href="' + it[1] + '">' + it[0] + '</a>' : '<span class="current">' + it[0] + '</span>').join('<span aria-hidden="true">/</span>') + '</nav>';
const ld = (name, desc, url, extra) => JSON.stringify({ '@context': 'https://schema.org', '@graph': [Object.assign({ '@type': 'WebPage', name, description: desc, url: 'https://campaignautomation.ai' + url, isPartOf: { '@type': 'WebSite', name: 'Campaign Automation AI', url: 'https://campaignautomation.ai' } }, extra || {}), { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://campaignautomation.ai/' }, { '@type': 'ListItem', position: 2, name: 'Automations', item: 'https://campaignautomation.ai/automations' }, { '@type': 'ListItem', position: 3, name, item: 'https://campaignautomation.ai' + url }].slice(0, url === '/automations' ? 2 : 3) }] });

/* ── 3) GUIDE PAGES ── */
const steps = arr => '<ol class="au-steps">' + arr.map(s => '<li><h3>' + esc(s.title) + '</h3><p>' + esc(s.body) + '</p></li>').join('') + '</ol>';
const kwRows = arr => '<div class="au-kv">' + arr.map(x => '<div class="kw-row"><div class="kw-term">' + esc(x) + '</div><div class="kw-vol">&#10003;</div></div>').join('') + '</div>';

/* Lead gate: build content is free but requires name+email+consent once
   (Netlify form `guide-access` with built-in reCAPTCHA). Unlock is stored in
   localStorage `ca_guides_unlocked` and opens every guide. The head script
   runs before first paint so unlocked visitors never see the gate flash;
   noscript users (and crawlers without JS) get the open content — the gated
   part is declared via paywall markup (isAccessibleForFree:false + hasPart). */
const UNLOCK_HEAD = `<script>(function(){function u(){try{if(localStorage.getItem('ca_guides_unlocked'))document.documentElement.classList.add('au-open')}catch(e){}}u();window.addEventListener('pageshow',function(e){if(e.persisted)u()})})();</script>
<noscript><style>.au-gated{display:block}.au-gate{display:none}.reveal{opacity:1;transform:none}</style></noscript>
`;

let nPages = 0;
for (const g of GUIDES) {
  const cat = CAT[g.slug] || 'Automation';
  const rel = GUIDES.filter(x => x.slug !== g.slug && CAT[x.slug] === cat).slice(0, 2)
    .concat(GUIDES.filter(x => x.slug !== g.slug && CAT[x.slug] !== cat).slice(0, 1)).slice(0, 3);
  const pid = PROPOSAL_ID[g.slug];
  const page = head({
    title: esc(g.name) + ' — Build Guide (Manual or MCP) | Campaign Automation AI',
    desc: g.metaDescription, path: '/automations/' + g.slug,
    ld: ld(g.name, g.metaDescription, '/automations/' + g.slug, { '@type': 'HowTo', name: 'How to build ' + g.name, isAccessibleForFree: false, hasPart: { '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.au-gated' } }),
    extraHead: UNLOCK_HEAD
  }) + `
  ${crumb([['Home', '/'], ['Automations', '/automations'], [esc(g.name), null]])}

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>${esc(cat)} &middot; build guide</p>
    <h1>${esc(g.name)}</h1>
    <p>${esc(g.tagline)}</p>
    <div class="au-meta">
      <span class="au-chip sig">Path A &middot; Manual extracts</span>
      <span class="au-chip sig">Path B &middot; MCP integration</span>
      <span class="au-chip">Guardrail-first</span>
    </div>
  </div>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">What it does</span></p>
    ${g.what.split(/\n\n+/).map(p => '<p class="lead" style="max-width:720px;margin-bottom:14px">' + esc(p) + '</p>').join('\n    ')}
    <div class="au-outcome"><strong style="color:var(--bone)">What it moves:</strong> ${esc(g.outcome)}</div>
    <div class="au-paths">
      <div class="au-path"><b>Path A &middot; Manual</b><p>${esc(g.manualPath.overview)}</p></div>
      <div class="au-path"><b>Path B &middot; Integrated</b><p>${esc(g.mcpPath.overview)}</p></div>
    </div>
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Before you start</span></p>
    <h2 class="display" style="margin-bottom:8px">Prerequisites.</h2>
    ${kwRows(g.prereqs)}
    <div class="au-setup-box">New to the stack? Set up your environment first — data access, workspace, integration platforms, and the agent layer are covered once in <a href="/automations/setup">Environments &amp; tooling</a>.${AUDITDEMAND_SLUGS.has(g.slug) ? ' Not sure where the waste is yet? An automated <a href="https://auditdemand.com/?utm_source=campaignautomation.ai&amp;utm_medium=referral&amp;utm_campaign=build-guide" target="_blank" rel="noopener">AuditDemand audit&nbsp;&#8599;</a> quantifies it before you build.' : ''}</div>
  </section>

  <section class="section reveal" id="unlock">
    <p class="section-label"><span class="label-signal">The build guide</span></p>
    <div class="au-unlocked-note">&#10003; Unlocked — every build guide on the site is open on this device.</div>
    <div class="au-gate">
      <h2>The full build guide is free — unlock it once.</h2>
      <p class="au-gate-sub">Tell us who's building and every guide in the library opens up, this one included:</p>
      <ul class="au-gate-list">
        <li>Path A &middot; build it with manual data extracts (${g.manualPath.steps.length} steps)</li>
        <li>Path B &middot; integrate it through MCP connections (${g.mcpPath.steps.length} steps)</li>
        <li>The tools-and-guardrails checklist to run it safely</li>
      </ul>
      <form name="guide-access" method="POST" action="/automations/unlocked" data-netlify="true" data-netlify-recaptcha="true" data-netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="guide-access">
        <input type="hidden" name="guide" value="${g.slug}">
        <p style="display:none" aria-hidden="true"><label>Leave this empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <div class="au-gate-fields">
          <label>Name<input type="text" name="name" required autocomplete="name" placeholder="Your name"></label>
          <label>Work email<input type="email" name="email" required autocomplete="email" placeholder="you@company.com"></label>
        </div>
        <label class="au-gate-consent"><input type="checkbox" name="marketing-consent" value="yes" required>Email me occasional, practical automation content from Campaign Automation AI — including when new build guides ship. Opting in is part of the unlock; unsubscribe anytime, one click.</label>
        <div class="au-gate-captcha" data-netlify-recaptcha="true"></div>
        <button type="submit" class="btn-primary">Unlock all ${GUIDES.length} build guides &rarr;</button>
        <p class="au-gate-fine">One unlock opens every guide on this device. We only email when there's something worth building — every email has a one-click unsubscribe, and you can withdraw consent anytime. Consent requested by Campaign Automation AI, Caledon, Ontario &middot; <a href="mailto:hello@campaignautomation.ai">hello@campaignautomation.ai</a>.</p>
      </form>
    </div>
  </section>

  <div class="au-gated">
  <section class="section bone reveal">
    <p class="section-label"><span class="label-signal">Path A</span></p>
    <h2 class="display" style="color:var(--ink);margin-bottom:8px">Build it with manual data extracts.</h2>
    <p class="lead" style="max-width:720px">${esc(g.manualPath.overview)}</p>
    ${steps(g.manualPath.steps)}
    <p class="au-note">Cadence: ${esc(g.manualPath.cadence)}</p>
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Path B</span></p>
    <h2 class="display" style="margin-bottom:8px">Integrate it with MCP connections.</h2>
    <p class="lead" style="max-width:720px">${esc(g.mcpPath.overview)}</p>
    ${kwRows(g.mcpPath.connections)}
    ${steps(g.mcpPath.steps)}
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Tools &amp; guardrails</span></p>
    <h2 class="display" style="margin-bottom:8px">Run it safely.</h2>
    ${kwRows(g.tools)}
    <div class="au-guard"><ul>${g.guardrails.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>
  </section>
  </div>

  <section class="section reveal" style="text-align:center">
    <div style="border:2px solid var(--signal);border-radius:8px;padding:36px;max-width:680px;margin:0 auto">
      <h3 class="display" style="margin-bottom:12px">Prefer it built for you?</h3>
      <p style="max-width:520px;margin:0 auto 22px;color:var(--mist2)">We stand this automation up as a governed sprint on the stack you already run — scoped, built, and handed over with the guardrails configured. No new platform, no migration.</p>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <a href="/solutions/campaign-audit" class="btn-ghost">Start with the Audit &rarr;</a>
        <a href="/request-proposals?sprints=${pid}" class="btn-ghost">Request proposals &rarr;</a>
      </div>
    </div>
  </section>
  <script>(function(){var f=document.querySelector('form[name="guide-access"]');if(f)f.addEventListener('submit',function(){try{localStorage.setItem('ca_guide_return',location.pathname)}catch(e){}})})();</script>

  <div class="tagline-footer" style="text-align:center">
    <p>Build it once.<br><span>It runs every cycle.</span></p>
    <div class="tf-explore"><p class="tf-explore-label">Related automations</p><div class="tf-explore-grid">${rel.map(r => '<a class="tf-explore-card" href="/automations/' + r.slug + '"><span class="tf-x-cat">' + esc(CAT[r.slug]) + '</span><span class="tf-x-title">' + esc(r.name) + '</span></a>').join('')}</div><a class="tf-explore-all" href="/automations">All automations &rarr;</a></div>
  </div>
` + tail + `
</body>
</html>
`;
  fs.mkdirSync(path.join(ROOT, 'automations', g.slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'automations', g.slug, 'index.html'), page, 'utf8');
  nPages++;
}
console.log('Wrote ' + nPages + ' build guides');

/* ── 3b) UNLOCK SUCCESS PAGE (Netlify form `action` target; noindex) ── */
{
  const page = head({
    title: 'Unlocked — All Build Guides Open | Campaign Automation AI',
    desc: 'Access confirmed: every automation build guide on the site is now open on this device.',
    path: '/automations/unlocked',
    ld: ld('Build guides unlocked', 'Access confirmed: every automation build guide is now open on this device.', '/automations/unlocked'),
    extraHead: '<meta name="robots" content="noindex,nofollow">\n'
  }) + `
  ${crumb([['Home', '/'], ['Automations', '/automations'], ['Unlocked', null]])}

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>Access confirmed</p>
    <h1>You're in<span class="blink-dot" aria-hidden="true">.</span></h1>
    <p>All ${GUIDES.length} build guides are now open on this device — every Path A, every Path B, and every guardrail checklist. If you opted in, we'll email you when new automations join the library.</p>
    <div class="hero-actions" style="margin-top:28px">
      <a href="/automations" class="btn-primary" id="au-resume">Browse the automations &rarr;</a>
      <a href="/automations/setup" class="btn-ghost">Set up your environment &rarr;</a>
    </div>
  </div>
  <script>(function(){try{localStorage.setItem('ca_guides_unlocked',String(Date.now()));var r=localStorage.getItem('ca_guide_return');if(r&&/^\\/automations\\//.test(r)){var a=document.getElementById('au-resume');a.href=r;a.innerHTML='Back to your guide &rarr;';localStorage.removeItem('ca_guide_return');}}catch(e){}})();</script>
` + tail + `
</body>
</html>
`;
  fs.mkdirSync(path.join(ROOT, 'automations', 'unlocked'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'automations', 'unlocked', 'index.html'), page, 'utf8');
  console.log('Wrote unlock success page');
}

/* ── 4) SETUP HUB ── */
{
  const secs = HUB.sections.map(s => `
  <section class="section reveal" id="${escAttr(s.id)}">
    <p class="section-label"><span class="label-signal">${esc(s.title)}</span></p>
    <p class="lead" style="max-width:720px;margin-bottom:8px">${esc(s.body)}</p>
    <div class="au-kv">${s.items.map(it => '<div class="kw-row"><div class="kw-term"><strong style="color:var(--bone)">' + esc(it.name) + '</strong> &mdash; ' + esc(it.desc) + '</div></div>').join('')}</div>
  </section>`).join('\n');
  const page = head({
    title: 'Environments &amp; Tooling — Set Up Your Automation Stack | Campaign Automation AI',
    desc: HUB.metaDescription, path: '/automations/setup',
    ld: ld('Environments & tooling', HUB.metaDescription, '/automations/setup')
  }) + `
  ${crumb([['Home', '/'], ['Automations', '/automations'], ['Environments & tooling', null]])}

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>Setup &middot; read this first</p>
    <h1>Environments &amp; tooling.</h1>
    ${HUB.intro.split(/\n\n+/).map(p => '<p>' + esc(p) + '</p>').join('\n    ')}
    <p>Everything here assembles around the tools you already run — nothing below asks you to replace your stack.</p>
  </div>
${secs}

  <div class="tagline-footer" style="text-align:center">
    <p>Foundation first.<br><span>Then automate.</span></p>
    <a href="/automations" class="btn-primary" style="margin-top:24px">Browse the automations &rarr;</a>
  </div>
` + tail + `
</body>
</html>
`;
  fs.mkdirSync(path.join(ROOT, 'automations', 'setup'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'automations', 'setup', 'index.html'), page, 'utf8');
  console.log('Wrote setup hub');
}

/* ── 5) AUTOMATIONS HUB ── */
{
  const cats = ['All', 'Foundation', 'Paid media', 'Content', 'RevOps', 'Research'];
  const chips = cats.map((c, i) => '<button class="au-fchip' + (i === 0 ? ' on' : '') + '" data-k="' + c + '" type="button">' + c + '</button>').join('\n          ');
  const cards = GUIDES.map(g => '<a class="au-card" data-cat="' + CAT[g.slug] + '" href="/automations/' + g.slug + '"><span class="au-chip sig" style="align-self:flex-start">' + esc(CAT[g.slug]) + '</span><h3>' + esc(g.name) + '</h3><p>' + esc(g.tagline) + '</p><span class="au-go">View build guide &rarr;</span></a>').join('\n        ');
  const page = head({
    title: 'Automations — Build Guides for Governed Marketing Automation | Campaign Automation AI',
    desc: 'Fifteen marketing automations with full build guides: stand each up yourself with manual data extracts or MCP integrations — or have us build it as a governed sprint.',
    path: '/automations',
    ld: ld('Automations', 'Fifteen marketing automations with full build guides — manual extracts or MCP integration.', '/automations')
  }) + `
  ${crumb([['Home', '/'], ['Automations', null]])}

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>The automation library</p>
    <h1>Automations you can actually stand up.</h1>
    <p>Every automation below runs on the stack you already have — a manual path built on data extracts and spreadsheets, and an integrated path that connects your existing systems through MCP with guardrails on. No new platform, no migration: faster builds, less red tape, one less vendor to manage. Build it yourself, or have us build it with you. The guides are free to unlock — one name and email opens all ${GUIDES.length}. Stacked together, they are how we deliver <a href="/solutions/automated-campaign-optimization">automated campaign optimization</a> — our core service.</p>
    <div class="au-meta">
      <span class="au-chip sig">${GUIDES.length} automations</span>
      <span class="au-chip sig">Your existing stack</span>
      <span class="au-chip">2 build paths each</span>
      <span class="au-chip">100% guardrail-first</span>
    </div>
  </div>

  <section class="section reveal">
    <div class="au-setup-box" style="margin:0 0 26px"><strong style="color:var(--bone)">Start here:</strong> the shared environment — data access, workspace, integration platforms, and the agent layer — is covered once in <a href="/automations/setup">Environments &amp; tooling</a>. Every guide assumes it.</div>
    <div class="au-bar">
      <div class="au-chips" id="auchips">
          ${chips}
      </div>
    </div>
    <div class="au-count" id="aucount"></div>
    <div class="au-grid" id="au-grid">
        ${cards}
    </div>
  </section>

  <section class="section reveal" style="text-align:center">
    <div style="border:2px solid var(--signal);border-radius:8px;padding:36px;max-width:680px;margin:0 auto">
      <h3 class="display" style="margin-bottom:12px">Want them built for you?</h3>
      <p style="max-width:540px;margin:0 auto 22px;color:var(--mist2)">The Audit finds which of these pays back fastest in your account, then we build them as governed sprints — your team owns the result.</p>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <a href="/solutions/campaign-audit" class="btn-primary">Start with the Audit &rarr;</a>
        <a href="/request-proposals" class="btn-ghost">Request proposals &rarr;</a>
      </div>
    </div>
  </section>

  <div class="tagline-footer" style="text-align:center">
    <p>Pick one workflow.<br><span>Build it. Own it.</span></p>
    <div class="tf-explore"><p class="tf-explore-label">Keep exploring</p><div class="tf-explore-grid"><a class="tf-explore-card" href="/automations/setup"><span class="tf-x-cat">Setup</span><span class="tf-x-title">Environments &amp; tooling — set up the stack once</span></a><a class="tf-explore-card" href="/resources/ai-marketing-guardrails"><span class="tf-x-cat">Strategy &amp; bounded autonomy</span><span class="tf-x-title">AI Marketing Guardrails: What to Set Before You Automate</span></a><a class="tf-explore-card" href="/resources/connecting-your-marketing-stack"><span class="tf-x-cat">Workflow automation</span><span class="tf-x-title">Connecting Your Marketing Stack</span></a></div><a class="tf-explore-all" href="/resources/articles">Browse all articles &rarr;</a></div>
  </div>
` + tail + `
<script>
(function(){
  var chips=[].slice.call(document.querySelectorAll('.au-fchip'));
  var cards=[].slice.call(document.querySelectorAll('.au-card'));
  var count=document.getElementById('aucount');
  function apply(k){var n=0;cards.forEach(function(c){var ok=k==='All'||c.getAttribute('data-cat')===k;c.style.display=ok?'':'none';if(ok)n++;});count.innerHTML='<b>'+n+'</b> of '+cards.length+' automations';}
  chips.forEach(function(ch){ch.addEventListener('click',function(){chips.forEach(function(x){x.classList.remove('on');});ch.classList.add('on');apply(ch.getAttribute('data-k'));});});
  apply('All');
})();
</script>
</body>
</html>
`;
  fs.mkdirSync(path.join(ROOT, 'automations'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'automations', 'index.html'), page, 'utf8');
  console.log('Wrote automations hub');
}

/* ── 6) RETIRE OLD PAGES + REDIRECTS ── */
{
  const rd = path.join(ROOT, '_redirects');
  let r = fs.readFileSync(rd, 'utf8');
  if (!r.includes('/automations')) {
    r += `\n# Sprints repositioned as the Automations library (301)\n`;
    for (const [oldP, slug] of Object.entries(OLD_DETAIL)) r += `${oldP}      /automations/${slug}  301\n${oldP}/     /automations/${slug}  301\n`;
    r += `/solutions/sprints/*        /automations  301\n/solutions/automation-sprints        /automations  301\n/solutions/automation-sprints/*      /automations  301\n`;
    fs.writeFileSync(rd, r, 'utf8');
    console.log('_redirects updated');
  }
  const rm = ['solutions/automation-sprints', 'solutions/sprints/content-brief', 'solutions/sprints/campaign-launch', 'solutions/sprints/ppc-intelligence', 'solutions/sprints/seo-ppc', 'solutions/sprints/event-followup', 'solutions/sprints/lead-reactivation'];
  let removed = 0;
  for (const d of rm) {
    const f = path.join(ROOT, d, 'index.html');
    if (fs.existsSync(f)) { fs.unlinkSync(f); try { fs.rmdirSync(path.join(ROOT, d)); } catch (e) {} removed++; }
  }
  try { fs.rmdirSync(path.join(ROOT, 'solutions', 'sprints')); } catch (e) {}
  console.log('Retired ' + removed + ' old sprint pages');
}

/* ── 7) SITEMAP ── */
{
  const smPath = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smPath, 'utf8');
  // drop old entries
  sm = sm.replace(/\s*<url>\s*<loc>https:\/\/campaignautomation\.ai\/(?:solutions\/automation-sprints|solutions\/sprints\/[a-z-]+)\/?<\/loc>[\s\S]*?<\/url>/g, '');
  let added = 0;
  const urls = ['/automations/', '/automations/setup/'].concat(GUIDES.map(g => '/automations/' + g.slug + '/'));
  for (const u of urls) {
    const loc = 'https://campaignautomation.ai' + u;
    if (!sm.includes(loc)) { sm = sm.replace('</urlset>', '  <url>\n    <loc>' + loc + '</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>'); added++; }
  }
  fs.writeFileSync(smPath, sm, 'utf8');
  console.log('Sitemap: removed old sprint URLs, added ' + added + ' automation URLs');
}
console.log('DONE');

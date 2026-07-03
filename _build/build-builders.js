// Builds the Builders section (v3 — roles model): /builders shows the founding
// builder (Dave, real) plus a SHORT list of open ROLES (honest job cards, no
// fictional personas). Also: Dave's detail page, homepage band, redirects for
// the retired persona pages, sitemap. Run: node build-builders.js
const fs = require('fs'), path = require('path');
const ROOT = require('path').resolve(__dirname, '..'); // repo root (scripts live in <repo>/_build)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');

const DAVE = {
  n: 'Dave Bussell', slug: 'dave-bussell', r: 'Founder &amp; Founding Builder',
  loc: 'Ottawa region, Canada', linkedin: 'https://www.linkedin.com/in/davebussell/',
  grad: ['#0F766E', '#C8F135'],
  tags: ['Growth & RevOps strategy', 'Performance marketing', 'AI adoption', 'Guardrail-first automation'],
  bio: 'Founder of Campaign Automation AI. Building the governed, sprint-based automation he kept wishing agencies offered — AI that moves fast but stays accountable.',
  about: 'Dave Bussell founded Campaign Automation AI to build the kind of governed, sprint-based automation he kept wishing agencies offered: AI that moves fast but stays accountable.\n\nHis background spans digital marketing leadership, revenue operations, and performance marketing — the disciplines behind demand, pipeline, and measurable growth. Across those roles the throughline has been the same: adopt new technology aggressively, but never at the cost of the guardrails that make it safe to trust.\n\nThat principle — bounded autonomy — is the foundation of Campaign Automation AI, and the standard every builder in the network is measured against.',
  focus: ['Growth & RevOps strategy', 'Performance marketing', 'AI adoption & change', 'Guardrail-first automation', 'Building the builder network']
};

// The ideal next hires — honest open roles, mapped to the business model.
const ROLES = [
  {
    id: 'paid-media-architect',
    title: 'Senior Paid Media Automation Architect',
    specialty: 'Paid media automation',
    mission: 'Run the Audits and own the paid-media automations — the workflows every engagement starts with.',
    build: [
      ['PPC Intelligence &amp; Search Term Intelligence builds', '/automations/ppc-intelligence'],
      ['Budget-pacing and negative-keyword systems that hold CPA inside guardrails', '/automations/search-term-intelligence'],
      ['Campaign Launch Kit and SEO/PPC Opportunity automations', '/automations/campaign-launch-kit'],
    ],
    fit: [
      '8+ years hands-on in Google and Meta at real spend',
      'You would rather encode your playbook once than re-run it by hand every week',
      'Your findings hold up line-by-line in front of a CMO',
    ],
    tags: ['Google Ads', 'Meta Ads', 'GA4', 'Scripts &amp; APIs']
  },
  {
    id: 'ai-agent-engineer',
    title: 'AI Agent Engineer — Claude &amp; MCP',
    specialty: 'AI agents & MCP',
    mission: 'Build the integrated path of every guide: agent loops on read-scoped MCP connections, with approval gates and audit logs.',
    build: [
      ['MCP-path implementations across the automations library', '/automations'],
      ['AGENTS.md instruction sets, guardrail configs, and kill-switches', '/automations/automation-governance'],
      ['The connective plumbing — n8n/Make schedules, warehouse writes, run logs', '/automations/setup'],
    ],
    fit: [
      'You have shipped agentic workflows on Claude (or similar) beyond the demo stage',
      'You treat guardrails as the product, not overhead',
      '"Blaming the model" is not in your vocabulary',
    ],
    tags: ['Claude / MCP', 'n8n &middot; Make', 'BigQuery', 'AGENTS.md']
  },
  {
    id: 'data-measurement-engineer',
    title: 'Marketing Data &amp; Measurement Engineer',
    specialty: 'Data & measurement',
    mission: 'Fix the layer the Readiness Score weights most heavily — the data access, pipelines, and measurement every automation reads from.',
    build: [
      ['Data Access &amp; Dashboards — live self-serve reporting on a governed layer', '/automations/data-access-dashboards'],
      ['Data Pipeline &amp; Integration with freshness and reconciliation checks', '/automations/data-pipeline-integration'],
      ['Measurement Repair — attribution a client can defend in a board meeting', '/automations/measurement-repair'],
    ],
    fit: [
      'Fluent in GA4, BigQuery, and the Sheets-to-warehouse growth path',
      'Read-only scopes and audit logs are your defaults, not an afterthought',
      'Broken tracking offends you personally',
    ],
    tags: ['GA4', 'BigQuery', 'dbt', 'Server-side GTM']
  }
];

// retired persona slugs (v2 pages) -> redirect to /builders
const RETIRED = ['priya-raghunathan','tomas-rivera','aisha-okonkwo','sofia-mendes','hassan-mahmoud','marcus-adeyemi','kwame-mensah','mei-ling-chen','omar-haddad','diego-fuentes','elena-petrova','yuki-tanaka','rahul-verma','fatima-al-rashid','grace-nguyen'];

function avatar(name, idNum, size, prefix, grad) {
  size = size || 60; prefix = prefix || 'bg';
  const parts = name.replace(/&amp;/g, '&').split(' ');
  const ini = ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase();
  const g = grad || ['#0F766E', '#C8F135'];
  const id = prefix + idNum;
  return '<svg class="bld-av" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" role="img" aria-label="' + escAttr(name) + '">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + g[0] + '"/><stop offset="1" stop-color="' + g[1] + '"/></linearGradient></defs>' +
    '<rect width="100" height="100" rx="24" fill="url(#' + id + ')"/>' +
    '<text x="50" y="50" dy=".34em" text-anchor="middle" font-family="Geist, system-ui, sans-serif" font-size="38" font-weight="600" fill="#fff" fill-opacity=".96">' + esc(ini) + '</text></svg>';
}

/* ── shared chrome (current nav/footer from homepage) ── */
const idx0 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let NAV = idx0.slice(idx0.indexOf('<a href="#main-content"'), idx0.indexOf('<div class="page-wrap">')).trimEnd();
let FOOTER = idx0.slice(idx0.indexOf('<footer class="site-footer"'), idx0.indexOf('</footer>') + '</footer>'.length);
const navCur = NAV.replace(/<a href="\/builders"[^>]*>Builders<\/a>/, '<a href="/builders" aria-current="page">Builders</a>');

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

const CSS = `  .bld-av{border-radius:16px;flex:0 0 auto}
  .bld-tag{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.02em;color:var(--mist2);border:1px solid var(--border);border-radius:4px;padding:4px 8px;white-space:nowrap}
  .bld-tag.sig{color:var(--signal);border-color:var(--signal-dim)}
  .bld-badge{display:inline-block;font-family:var(--f-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--signal);border:1px solid var(--signal-dim);border-radius:3px;padding:3px 8px;align-self:flex-start}
  .bld-badge.founder{color:var(--ink);background:var(--signal);border-color:var(--signal)}
  .bld-card{border:1px solid var(--border);border-radius:10px;padding:24px;background:var(--slate);display:flex;flex-direction:column;gap:14px;min-width:0}
  .bld-founder{border-color:var(--signal-dim);background:linear-gradient(180deg,rgba(200,241,53,.04),transparent)}
  .bld-founder-wrap{max-width:560px}
  .bld-head{display:flex;gap:14px;align-items:center}
  .bld-id{min-width:0}
  .bld-name{font-family:var(--f-display);font-size:17px;font-weight:700;margin:0;line-height:1.2;letter-spacing:-.01em}
  .bld-name a{color:var(--bone);text-decoration:none}
  .bld-name a:hover{color:var(--signal)}
  .bld-role{font-size:13px;color:var(--signal);font-weight:500;margin-top:3px;line-height:1.3}
  .bld-meta{font-family:var(--f-mono);font-size:11px;color:var(--mist);letter-spacing:.02em;margin-top:5px}
  .bld-bio{font-size:13.5px;color:var(--mist2);line-height:1.6;margin:0;flex:1}
  .bld-tags{display:flex;flex-wrap:wrap;gap:6px}
  .bld-cta{display:flex;gap:16px;align-items:center;margin-top:2px;padding-top:14px;border-top:1px solid var(--border)}
  .bld-cta a{font-family:var(--f-mono);font-size:12px;letter-spacing:.02em;text-decoration:none}
  .bld-view{color:var(--mist2)}
  .bld-view:hover{color:var(--bone)}
  .bld-apply{color:var(--signal)!important;margin-left:auto;font-weight:600}
  /* role cards */
  .role-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}
  .role-card{border:1px solid var(--border);border-radius:10px;padding:28px;background:var(--slate);display:flex;flex-direction:column;gap:16px;min-width:0}
  .role-card:hover{border-color:var(--signal-dim)}
  .role-card h3{font-family:var(--f-display);font-size:19px;font-weight:700;color:var(--bone);margin:0;line-height:1.25;letter-spacing:-.01em}
  .role-mission{font-size:14px;color:var(--mist2);line-height:1.6;margin:0}
  .role-list b{display:block;font-family:var(--f-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--signal);margin-bottom:8px}
  .role-list ul{list-style:none;padding:0;margin:0;display:grid;gap:7px}
  .role-list li{position:relative;padding-left:20px;color:var(--mist2);font-size:13.5px;line-height:1.55}
  .role-list li::before{content:'\\2192';position:absolute;left:0;color:var(--signal)}
  .role-list a{color:var(--bone);text-decoration:none;border-bottom:1px dotted var(--border)}
  .role-list a:hover{color:var(--signal)}
  .bld-join-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}
  .bld-lists{display:grid;gap:26px}
  .bld-list h4{font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--signal);margin:0 0 12px}
  .bld-list ul{list-style:none;padding:0;margin:0;display:grid;gap:10px}
  .bld-list li{position:relative;padding-left:24px;color:var(--mist2);font-size:14px;line-height:1.55}
  .bld-list li::before{content:'\\2192';position:absolute;left:0;top:0;color:var(--signal)}
  .bld-form{border:1px solid var(--border);border-radius:10px;padding:28px;background:var(--slate)}
  .bld-form .bld-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
  .bld-form label{font-family:var(--f-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mist)}
  .bld-form input,.bld-form select,.bld-form textarea{background:var(--slate2);border:1px solid var(--border);border-radius:6px;color:var(--bone);font-family:var(--f-body);font-size:14px;padding:11px 13px;outline:none;transition:border-color .15s;width:100%;box-sizing:border-box}
  .bld-form input:focus,.bld-form select:focus,.bld-form textarea:focus{border-color:var(--signal)}
  .bld-form .btn-primary{margin-top:4px}
  .bld-thanks{border:1px solid var(--signal-dim);background:rgba(200,241,53,.05);border-radius:8px;padding:28px}
  .bld-thanks b{font-family:var(--f-display);font-size:18px;color:var(--bone);display:block;margin-bottom:8px}
  .bld-thanks p{color:var(--mist2);font-size:14px;line-height:1.6;margin:0}
  @media(max-width:900px){.bld-join-grid{grid-template-columns:1fr;gap:30px}.role-card:hover,.bld-card:hover{border-color:var(--border)}.bld-founder:hover{border-color:var(--signal-dim)}}`;

const DETAIL_CSS = `  .bld-av{border-radius:16px;flex:0 0 auto}
  .bld-tag{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.02em;color:var(--mist2);border:1px solid var(--border);border-radius:4px;padding:4px 8px;white-space:nowrap}
  .bld-tag.sig{color:var(--signal);border-color:var(--signal-dim)}
  .bld-badge{display:inline-block;font-family:var(--f-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--ink);background:var(--signal);border-radius:3px;padding:3px 8px}
  .bd-back{font-family:var(--f-mono);font-size:12px;color:var(--mist);text-decoration:none;letter-spacing:.03em}
  .bd-back:hover{color:var(--signal)}
  .bd-hero{display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin-top:18px}
  .bd-h1{font-family:var(--f-display);font-size:clamp(30px,4vw,46px);font-weight:800;letter-spacing:-.02em;color:var(--bone);margin:0;line-height:1.04}
  .bd-role{color:var(--signal);font-size:16px;font-weight:500;margin-top:7px}
  .bd-meta{font-family:var(--f-mono);font-size:12px;color:var(--mist);margin-top:9px;letter-spacing:.03em}
  .bd-about p{color:var(--mist2);line-height:1.75;font-size:15px;margin:0 0 16px;max-width:720px}
  .bd-about p:last-child{margin-bottom:0}
  .bd-focus{display:flex;flex-wrap:wrap;gap:8px}
  .bd-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:18px}
  .bd-links a{font-family:var(--f-mono);font-size:13px;color:var(--signal);text-decoration:none}`;

function head(o) {
  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
${GTMHEAD}
<title>${o.title}</title>
<meta name="description" content="${escAttr(o.desc)}">
<link rel="canonical" href="https://campaignautomation.ai${o.canonical}">
<link rel="alternate" hreflang="en-CA" href="https://campaignautomation.ai${o.canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>
${o.style}
</style>
<script type="application/ld+json">
${o.jsonld}
</script>
<script defer src="/js/consent.js"></script>
</head>
<body>
${GTMNS}
${navCur}

<div class="page-wrap">
<main id="main-content">`;
}
const tail = s => `</main>

${FOOTER}
</div>
${s}
</body>
</html>
`;

/* ── founder card + role cards ── */
function founderCard(d) {
  const tags = d.tags.map(t => '<span class="bld-tag sig">' + esc(t) + '</span>').join('');
  return '<div class="bld-founder-wrap"><div class="bld-card bld-founder">' +
    '<span class="bld-badge founder">Founding builder</span>' +
    '<div class="bld-head">' + avatar(d.n, 0, 64, 'fb', d.grad) +
    '<div class="bld-id"><h3 class="bld-name"><a href="/builders/' + d.slug + '">' + d.n + '</a></h3>' +
    '<div class="bld-role">' + d.r + '</div>' +
    '<div class="bld-meta">' + esc(d.loc) + '</div></div></div>' +
    '<p class="bld-bio">' + d.bio + '</p>' +
    '<div class="bld-tags">' + tags + '</div>' +
    '<div class="bld-cta"><a class="bld-view" href="/builders/' + d.slug + '">Full profile &rarr;</a>' +
    '<a class="bld-apply" href="' + d.linkedin + '" target="_blank" rel="noopener">LinkedIn &#8599;</a></div>' +
    '</div></div>';
}
function roleCard(r) {
  return `<article class="role-card">
        <span class="bld-badge">Open role</span>
        <h3>${r.title}</h3>
        <p class="role-mission">${r.mission}</p>
        <div class="role-list"><b>What you&rsquo;ll build</b><ul>${r.build.map(x => '<li><a href="' + x[1] + '">' + x[0] + '</a></li>').join('')}</ul></div>
        <div class="role-list"><b>You&rsquo;re a fit if</b><ul>${r.fit.map(x => '<li>' + x + '</li>').join('')}</ul></div>
        <div class="bld-tags">${r.tags.map((t, k) => '<span class="bld-tag' + (k === 0 ? ' sig' : '') + '">' + t + '</span>').join('')}</div>
        <div class="bld-cta"><a class="bld-apply" href="#join" data-spec="${escAttr(r.specialty)}" style="margin-left:0">Apply for this role &rarr;</a></div>
      </article>`;
}

const specOpts = ROLES.map(r => '<option value="' + r.specialty.replace(/&amp;/g, '&') + '">' + r.title + '</option>').join('') + '<option value="Other">Something else — general application</option>';

const dirLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
  { '@type': 'CollectionPage', name: 'Builders — Campaign Automation AI', description: 'The Campaign Automation builder network: our founding builder plus the open roles we are hiring next.', url: 'https://campaignautomation.ai/builders', isPartOf: { '@type': 'WebSite', name: 'Campaign Automation AI', url: 'https://campaignautomation.ai' } },
  { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://campaignautomation.ai/' }, { '@type': 'ListItem', position: 2, name: 'Builders', item: 'https://campaignautomation.ai/builders' } ] }
] });

const PAGE = head({
  title: 'Builders &amp; Open Roles | Campaign Automation AI',
  desc: 'Meet founding builder Dave Bussell — and the ' + ROLES.length + ' roles we are hiring next: paid media automation, Claude/MCP agent engineering, and marketing data. If one is you, apply.',
  canonical: '/builders', style: CSS, jsonld: dirLd
}) + `
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span class="current">Builders</span></nav>

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>The builder network</p>
    <h1>The builders behind your sprints<span class="blink-dot" aria-hidden="true">.</span></h1>
    <p>Campaign Automation is led by its founding builder — and hiring deliberately. Below are the ${ROLES.length} roles we want next: the people who will run the Audits, build the MCP integrations, and own the data layer every automation reads from. If one of them describes you, it takes two minutes to apply.</p>
    <div class="hero-metrics">
      <div class="metric">
        <div class="metric-n" aria-label="${ROLES.length} open roles">${ROLES.length}</div>
        <div class="metric-l">Open roles</div>
      </div>
      <div class="metric" style="padding-left:40px">
        <div class="metric-n" aria-label="2 to 4 week sprint cycles">2&ndash;4<span aria-hidden="true"> wk</span></div>
        <div class="metric-l">Sprint cycles</div>
      </div>
      <div class="metric" style="padding-left:40px">
        <div class="metric-n" aria-label="100 percent guardrail-first">100<span aria-hidden="true">%</span></div>
        <div class="metric-l">Guardrail-first</div>
      </div>
    </div>
  </div>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Founding builder</span></p>
    ${founderCard(DAVE)}
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Open roles</span></p>
    <h2 class="display" style="margin-bottom:14px">The next three builders.</h2>
    <p class="lead" style="margin-bottom:32px">Not fifteen job ads — three deliberate hires, each mapped to how we work: governed sprints, build guides with a manual and an MCP path, and a data layer clients can trust.</p>
    <div class="role-grid">
      ${ROLES.map(roleCard).join('\n      ')}
    </div>
  </section>

  <section class="section reveal" id="join">
    <p class="section-label"><span class="label-signal">Apply</span></p>
    <div class="bld-join-grid">
      <div>
        <h2 class="display" style="margin-bottom:16px">If one of these is you, apply.</h2>
        <p class="lead">We match vetted specialists to client sprints — no agency overhead, no endless pitching. Tell us what you build and which role fits; we review every application.</p>
        <div class="bld-lists" style="margin-top:28px">
          <div class="bld-list">
            <h4>What we look for</h4>
            <ul>
              <li>5+ years deep in your area — paid media, agent engineering, or marketing data</li>
              <li>Hands-on with the platforms in the role card, not adjacent to them</li>
              <li>You build with guardrails — approvals, logging, reversibility — not black boxes</li>
              <li>Comfortable scoping and shipping inside a 2&ndash;4 week sprint</li>
            </ul>
          </div>
          <div class="bld-list">
            <h4>What you get</h4>
            <ul>
              <li>Sprint-based work matched to your skills, with clear scopes and transparent rates</li>
              <li>Clients who already understand governed automation — less educating, more building</li>
              <li>A small, senior bench to collaborate with across disciplines</li>
              <li>We handle sales and account management; you focus on the build</li>
            </ul>
          </div>
        </div>
      </div>
      <div>
        <form name="builder-application" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="bld-form">
          <input type="hidden" name="form-name" value="builder-application">
          <p hidden><label>Leave this empty: <input name="bot-field"></label></p>
          <div class="bld-field"><label for="bf-name">Name</label><input id="bf-name" name="name" type="text" autocomplete="name" required></div>
          <div class="bld-field"><label for="bf-email">Email</label><input id="bf-email" name="email" type="email" autocomplete="email" required></div>
          <div class="bld-field"><label for="bf-spec">Role you fit</label><select id="bf-spec" name="specialty"><option value="">Choose one…</option>${specOpts}</select></div>
          <div class="bld-field"><label for="bf-link">Portfolio or LinkedIn</label><input id="bf-link" name="portfolio" type="url" placeholder="https://"></div>
          <div class="bld-field"><label for="bf-msg">What do you build? (one or two lines)</label><textarea id="bf-msg" name="pitch" rows="3"></textarea></div>
          <button class="btn-primary" type="submit">Apply to join &rarr;</button>
        </form>
      </div>
    </div>
  </section>

  <div class="tagline-footer" style="text-align:center">
    <p>The build is the proof.<br><span>Come build with us.</span></p>
    <div class="tf-explore"><p class="tf-explore-label">Keep exploring</p><div class="tf-explore-grid"><a class="tf-explore-card" href="/resources/what-is-bounded-autonomy"><span class="tf-x-cat">Strategy &amp; bounded autonomy</span><span class="tf-x-title">What Is Bounded Autonomy in Marketing AI?</span></a><a class="tf-explore-card" href="/resources/ai-marketing-guardrails"><span class="tf-x-cat">Strategy &amp; bounded autonomy</span><span class="tf-x-title">AI Marketing Guardrails: What to Set Before You Automate</span></a><a class="tf-explore-card" href="/resources/ai-marketing-automation-governance-checklist"><span class="tf-x-cat">Buyer guides</span><span class="tf-x-title">An AI Marketing Automation Governance Checklist</span></a></div><a class="tf-explore-all" href="/resources/articles">Browse all articles &rarr;</a></div>
  </div>
` + tail(`<script src="/js/main.js"></script>
<script>
(function(){
  var sel=document.getElementById('bf-spec');
  function setSpec(v){ if(!sel||!v)return; for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===v){ sel.value=v; break; } } }
  var qp=new URLSearchParams(location.search).get('specialty'); if(qp) setSpec(qp);
  document.querySelectorAll('.bld-apply[data-spec]').forEach(function(a){a.addEventListener('click',function(){ setSpec(this.getAttribute('data-spec')); });});
  var form=document.querySelector('.bld-form');
  if(form){form.addEventListener('submit',function(e){
    e.preventDefault();
    var body=new URLSearchParams(new FormData(form)).toString();
    fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body})
      .then(function(){form.innerHTML='<div class="bld-thanks"><b>Application received.</b><p>Thanks for your interest in the Builder network. We review every application and reply within a few business days.</p></div>';})
      .catch(function(){form.submit();});
  });}
})();
</script>`);

fs.mkdirSync(path.join(ROOT, 'builders'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'builders', 'index.html'), PAGE, 'utf8');
console.log('Wrote /builders (founder + ' + ROLES.length + ' roles)');

/* ── Dave's detail page (unchanged content, regenerated with current chrome) ── */
function founderDetail(d) {
  const aboutParas = d.about.split(/\n\n+/).map(p => '<p>' + esc(p) + '</p>').join('\n        ');
  const focus = d.focus.map(f => '<span class="bld-tag sig">' + esc(f) + '</span>').join('');
  const desc = 'Dave Bussell is the founder and founding builder of Campaign Automation AI, bringing growth, RevOps, and performance-marketing leadership to governed, guardrail-first AI automation.';
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'ProfilePage', url: 'https://campaignautomation.ai/builders/dave-bussell', mainEntity: { '@type': 'Person', name: 'Dave Bussell', jobTitle: 'Founder', worksFor: { '@type': 'Organization', name: 'Campaign Automation AI', url: 'https://campaignautomation.ai' }, sameAs: ['https://www.linkedin.com/in/davebussell/'] } },
    { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://campaignautomation.ai/' }, { '@type': 'ListItem', position: 2, name: 'Builders', item: 'https://campaignautomation.ai/builders' }, { '@type': 'ListItem', position: 3, name: 'Dave Bussell', item: 'https://campaignautomation.ai/builders/dave-bussell' } ] }
  ] });
  return head({ title: 'Dave Bussell &mdash; Founder &amp; Founding Builder | Campaign Automation AI', desc, canonical: '/builders/dave-bussell', style: DETAIL_CSS, jsonld: ld }) + `
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/builders">Builders</a><span aria-hidden="true">/</span><span class="current">Dave Bussell</span></nav>

  <div class="page-hero">
    <a class="bd-back" href="/builders">&larr; All builders</a>
    <div style="margin:14px 0 0"><span class="bld-badge">Founding builder</span></div>
    <div class="bd-hero">${avatar(d.n, 0, 96, 'fbd', d.grad)}<div><h1 class="bd-h1">${d.n}</h1><div class="bd-role">${d.r}</div><div class="bd-meta">${esc(d.loc)}</div>
      <div class="bd-links"><a href="${d.linkedin}" target="_blank" rel="noopener">LinkedIn &#8599;</a></div></div></div>
  </div>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">About</span></p>
    <div class="bd-about">
        ${aboutParas}
    </div>
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Focus areas</span></p>
    <div class="bd-focus">${focus}</div>
  </section>

  <div class="tagline-footer" style="text-align:center">
    <p>Bring the network<br><span>onto your next sprint.</span></p>
    <a href="/request-proposals" class="btn-primary" style="margin-top:24px">Request a sprint &rarr;</a>
    <div style="margin-top:18px"><a class="bd-back" href="/builders">&larr; Meet the builders</a></div>
  </div>
` + tail('<script src="/js/main.js"></script>');
}
fs.mkdirSync(path.join(ROOT, 'builders', DAVE.slug), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'builders', DAVE.slug, 'index.html'), founderDetail(DAVE), 'utf8');
console.log('Wrote Dave detail page');

/* ── retire persona pages + redirects + sitemap ── */
let removed = 0;
for (const sl of RETIRED) {
  const f = path.join(ROOT, 'builders', sl, 'index.html');
  if (fs.existsSync(f)) { fs.unlinkSync(f); try { fs.rmdirSync(path.join(ROOT, 'builders', sl)); } catch (e) {} removed++; }
}
console.log('Retired ' + removed + ' persona pages');

{
  const rd = path.join(ROOT, '_redirects');
  let r = fs.readFileSync(rd, 'utf8');
  if (!r.includes('# Builder persona pages retired')) {
    r += `\n# Builder persona pages retired — roles model (301)\n`;
    for (const sl of RETIRED) r += `/builders/${sl}      /builders  301\n/builders/${sl}/     /builders  301\n`;
    fs.writeFileSync(rd, r, 'utf8');
    console.log('_redirects updated (+' + RETIRED.length * 2 + ' rules)');
  }
}

{
  const smPath = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smPath, 'utf8');
  let cut = 0;
  for (const sl of RETIRED) {
    const re = new RegExp('\\s*<url>\\s*<loc>https://campaignautomation\\.ai/builders/' + sl + '/?</loc>[\\s\\S]*?</url>', 'g');
    const b = sm; sm = sm.replace(re, ''); if (sm !== b) cut++;
  }
  fs.writeFileSync(smPath, sm, 'utf8');
  console.log('Sitemap: removed ' + cut + ' persona URLs');
}

/* ── homepage band: roles version ── */
{
  const roleRows = ROLES.map(r => '<a href="/builders" style="display:block;border:1px solid var(--border);border-radius:8px;padding:14px 18px;text-decoration:none;transition:border-color .15s" onmouseover="this.style.borderColor=\'var(--signal-dim)\'" onmouseout="this.style.borderColor=\'var(--border)\'"><span style="display:block;font-family:var(--f-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--signal);margin-bottom:4px">Open role</span><span style="display:block;font-family:var(--f-display);font-size:14.5px;font-weight:600;color:var(--bone);line-height:1.3">' + r.title + '</span></a>').join('\n        ');
  const BAND = `  <!-- builders-band -->
  <section class="section snap-sec" aria-labelledby="builders-heading">
    <div class="section-label reveal"><span class="label-signal">The builder network</span></div>
    <div class="grid-2 reveal" style="align-items:center">
      <div>
        <h2 class="display" id="builders-heading" style="margin-bottom:16px">Real people, real roles.<br>Hiring deliberately.</h2>
        <p class="lead">Campaign Automation is led by founding builder Dave Bussell — and hiring the next three builders: paid media automation, Claude/MCP agent engineering, and marketing data. No fifteen-person facade; three roles we actually need.</p>
        <a href="/builders" class="btn-ghost" style="margin-top:24px">Meet the builders &amp; open roles &rarr;</a>
      </div>
      <div style="display:grid;gap:12px;max-width:380px;margin:0 auto;width:100%">
        ${roleRows}
      </div>
    </div>
  </section>
  <!-- /builders-band -->`;
  let home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const bandRe = /[ \t]*<!-- builders-band -->[\s\S]*?<!-- \/builders-band -->/;
  if (bandRe.test(home)) home = home.replace(bandRe, BAND);
  else home = home.replace('  <!-- GUARDRAIL TERMINAL -->', BAND + '\n\n  <!-- GUARDRAIL TERMINAL -->');
  fs.writeFileSync(path.join(ROOT, 'index.html'), home, 'utf8');
  console.log('Homepage builders band updated (roles version)');
}
console.log('DONE');

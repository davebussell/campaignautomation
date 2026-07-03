// Builds the three "Who we help" audience pages, sweeps the nav sitewide to the new
// two-group Solutions menu, rewires the homepage buyer cards, and updates the sitemap.
// Run: node build-audience.js
const fs = require('fs');
const path = require('path');
const ROOT = 'C:/Users/dave/Desktop/Campaign Automation';

// ---- new Solutions dropdown (desktop) ----
const oldDropdown = `      <div class="dropdown" role="group"><span class="dropdown-label">Offers</span>
        <a href="/solutions/campaign-audit">Campaign Automation Audit</a>
        <a href="/solutions/automation-sprints">Automation Sprints</a>
        <a href="/platform">Campaign Strategy Portal</a>
      </div>`;
const newDropdown = `      <div class="dropdown" role="group"><span class="dropdown-label">Offerings</span>
        <a href="/solutions/automation-sprints">Automation Sprints</a>
        <a href="/solutions/campaign-audit">Campaign Audit</a>
        <a href="/training">Training</a>
        <span class="dropdown-label" style="margin-top:12px;display:block">Who we help</span>
        <a href="/who-we-help/agencies">Agencies</a>
        <a href="/who-we-help/in-house">In-house teams</a>
        <a href="/who-we-help/executives">Executives</a>
      </div>`;
// remove the redundant top-level Training (desktop), now inside Solutions
const oldTop = `    <a href="/training">Training</a>
    <a href="/results">Results</a>
    <a href="/results/trigger-action-impact">Framework</a>`;
const newTop = `    <a href="/results">Results</a>
    <a href="/results/trigger-action-impact">Framework</a>`;
// mobile Solutions section
const oldMobileSol = `    <a href="/solutions/campaign-audit">Campaign Automation Audit</a>
    <a href="/solutions/automation-sprints">Automation Sprints</a>
    <a href="/platform">Campaign Strategy Portal</a>`;
const newMobileSol = `    <a href="/solutions/automation-sprints">Automation Sprints</a>
    <a href="/solutions/campaign-audit">Campaign Audit</a>
    <a href="/training">Training</a>
    <a href="/who-we-help/agencies">Agencies</a>
    <a href="/who-we-help/in-house">In-house teams</a>
    <a href="/who-we-help/executives">Executives</a>`;

function applyNav(html){
  return html.split(oldDropdown).join(newDropdown).split(oldTop).join(newTop).split(oldMobileSol).join(newMobileSol);
}

// ---- chrome from an existing page (campaign-audit: no page-wrap) ----
const src = fs.readFileSync(path.join(ROOT,'solutions','campaign-audit','index.html'),'utf8');
let NAV = src.slice(src.indexOf('<a href="#main-content"'), src.indexOf('<main id="main-content">')).trimEnd();
NAV = applyNav(NAV);
const FOOTER = src.slice(src.indexOf('<footer class="site-footer"'), src.indexOf('</footer>')+'</footer>'.length);

// ---- audience page bodies ----
const PAGES = [
  {
    slug:'agencies', crumb:'For agencies', eyebrow:'Who we help · Agencies',
    title:'For Agencies — Add an AI Automation Practice Without Adding Headcount',
    desc:'White-label our automation sprints and guardrail platform. Scale account capacity, ship the AI workflows clients are asking for, and protect your margin — we work behind your brand.',
    h1:'Add an AI automation practice — without adding headcount.',
    lead:'White-label our sprints and guardrail platform. Scale account capacity, ship the AI workflows your clients keep asking for, and protect your margin. We build behind your brand; you keep the relationship.',
    cta1:{href:'/request-proposals', label:'Talk partnerships →'}, cta2:{href:'/paid-advertising-automation/agency-automation', label:'See agency automation →'},
    pains:['Every new client means more hours you can\'t hire fast enough to cover.','Clients are asking for "AI" you don\'t have the engineers to build.','Margins get squeezed as delivery scales but rates don\'t.','You manage dozens of accounts with no repeatable, governed system underneath.'],
    work:[
      ['White-label delivery','We build the automation; it ships under your brand, in your reporting. Your clients see your agency — the AI works underneath.'],
      ['Per-client guardrails','Every account gets its own isolated guardrail config and audit log. No spend cap, exclusion, or change crosses between clients.'],
      ['Productized sprints','Turn one workflow — PPC waste, lead reactivation, launch kits — into a repeatable sprint you sell across your whole book.'],
      ['You own the relationship','We stay invisible. You keep the client, the margin, and the renewal. We\'re the capacity behind the curtain.'],
    ],
    get:['A new, high-margin AI service line you can sell next quarter','Account capacity that scales without new salaries','Per-client audit trails you can show a nervous client','Faster, higher-quality client wins from repeatable workflows'],
    proofLink:{href:'/ai-strategy/guardrail-driven-automation', label:'How the guardrails work →'},
    closeH:'Let\'s scope a white-label partnership.', closeP:'Tell us about your book of business and the workflows your clients want. We\'ll map a partnership that protects your brand and your margin.',
    closeCta:{href:'/request-proposals', label:'Talk partnerships →'},
  },
  {
    slug:'in-house', crumb:'For in-house teams', eyebrow:'Who we help · In-house teams',
    title:'For In-house Marketing Teams — Automate the Workflow That\'s Burning You',
    desc:'Pick the one process eating the most hours. We build it into a governed automation in 2–4 weeks and hand it over — configured, documented, and yours to run without us.',
    h1:'Automate the workflow that\'s burning your team — and own it.',
    lead:'Pick the one process eating the most hours. We build it into a governed automation in 2–4 weeks and hand it over — configured, documented, and trained — so your team runs it without us.',
    cta1:{href:'/tools/readiness-score', label:'Get your free Readiness Score →'}, cta2:{href:'/solutions/automation-sprints', label:'See the sprint catalog →'},
    pains:['Your best people spend their best hours on repetitive, manual work.','Your stack is a pile of tools that don\'t talk to each other.','You have no engineering resources to build automation yourself.','Leadership wants "AI" but nobody has handed you a plan you trust.'],
    work:[
      ['Start with the binding constraint','The free Readiness Score finds the one thing most limiting your ability to automate safely — so we fix the right thing first, not the loudest thing.'],
      ['One workflow at a time','No rip-and-replace, no 12-month platform migration. We automate the single highest-leverage workflow, prove it, then move to the next.'],
      ['Built on the stack you run','HubSpot, Salesforce, Google, Meta — we layer governed automation on what you already use. Nothing new for your team to learn.'],
      ['You own it when we\'re done','Every sprint hands over the guardrail config, prompt packs, an AGENTS.md, and a training session. You run it; we don\'t hold the keys.'],
    ],
    get:['Hours back, on the workflow that was costing you the most','A system your team controls, not a black box you rent','No new platform to learn or migrate to','Governance and an audit trail built in from day one'],
    proofLink:{href:'/results/trigger-action-impact', label:'How we measure the impact →'},
    closeH:'Find your fastest win in four minutes.', closeP:'The free Readiness Score asks 13 questions, then tells you your score, your binding constraint, and the workflow to automate first.',
    closeCta:{href:'/tools/readiness-score', label:'Get your free Readiness Score →'},
  },
  {
    slug:'executives', crumb:'For executives', eyebrow:'Who we help · Executives',
    title:'For Marketing Executives — Adopt AI Without Betting on a Black Box',
    desc:'Every automation we build is auditable, bounded, and tied to a number — so you can show the board what AI did, what it cost, and what it returned. Start with a free assessment, not a procurement cycle.',
    h1:'Adopt AI in marketing without betting the budget on a black box.',
    lead:'Every automation we build is auditable, bounded, and tied to a number — so you can show the board what AI did, what it cost, and what it returned. Start with a free readiness assessment, not a procurement cycle.',
    cta1:{href:'/tools/readiness-score', label:'Get your free Readiness Score →'}, cta2:{href:'/results/trigger-action-impact', label:'How we measure impact →'},
    pains:['Pressure to "have an AI strategy" — without a plan you\'d stake your name on.','Real risk in handing budget to a tool that can\'t explain or undo what it did.','ROI you can defend to a CFO and a board, not a vanity dashboard.','Vendor hype everywhere; few outcomes you can actually verify.'],
    work:[
      ['A de-risked entry','Start with the free Readiness Score, then a paid Audit that scopes the whole engagement against your real numbers. No big-bang commitment.'],
      ['Bounded autonomy, CFO-safe','Every automated action runs inside guardrails you approve, is logged, and is reversible. "The AI did it" is never the answer — you can see exactly what happened.'],
      ['Measured in Trigger / Action / Impact','Every workflow ships with a target tied to your baseline. We write the number down before we build, and track it after launch.'],
      ['Prove ROI before you scale','One workflow at a time. Each one earns its place with a measured result before the next is built — so spend follows proof.'],
    ],
    get:['An AI roadmap you can defend to the board','Governance and audit trails that satisfy finance and legal','ROI tied to your numbers, tracked after launch','No black-box risk on regulated or brand-sensitive spend'],
    proofLink:{href:'/results', label:'See the outcomes →'},
    closeH:'See where AI can help — before you commit a dollar.', closeP:'The free Readiness Score gives you a clear, board-ready picture of where AI reduces cost and time across your marketing in under five minutes.',
    closeCta:{href:'/tools/readiness-score', label:'Get your free Readiness Score →'},
  },
];

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escA = s => esc(s).replace(/"/g,'&quot;');

function page(p){
  const url='https://campaignautomation.ai/who-we-help/'+p.slug;
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":p.title,"description":p.desc,"url":url,"isPartOf":{"@type":"WebSite","name":"Campaign Automation AI","url":"https://campaignautomation.ai"}},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://campaignautomation.ai/"},
      {"@type":"ListItem","position":2,"name":p.crumb,"item":url}
    ]}
  ]};
  const pains=p.pains.map(x=>`        <li>${esc(x)}</li>`).join('\n');
  const work=p.work.map(w=>`      <div class="card"><strong>${esc(w[0])}</strong><p>${esc(w[1])}</p></div>`).join('\n');
  const get=p.get.map(x=>`      <div class="kw-row"><div class="kw-term">${esc(x)}</div><div class="kw-vol" aria-hidden="true">✦</div></div>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)} | Campaign Automation AI</title>
<meta name="description" content="${escA(p.desc)}">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escA(p.title)}">
<meta property="og:description" content="${escA(p.desc)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escA(p.title)}">
<meta name="twitter:description" content="${escA(p.desc)}">
<link rel="stylesheet" href="/css/style.css">
<style>
  .aud-pains{list-style:none;padding:0;margin:18px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:12px 28px}
  .aud-pains li{position:relative;padding-left:26px;color:var(--mist2);font-size:15px;line-height:1.55}
  .aud-pains li::before{content:'\\2715';position:absolute;left:0;top:1px;color:var(--signal);font-size:13px}
  @media(max-width:640px){.aud-pains{grid-template-columns:1fr}}
</style>
<script type="application/ld+json">
${JSON.stringify(ld,null,0)}
</script>
</head>
<body>
${NAV}

<main id="main-content">
  <div class="breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-hidden="true">Who we help</span><span aria-hidden="true">›</span><span aria-current="page">${esc(p.crumb)}</span></div>

  <section class="page-hero reveal">
    <div class="eyebrow"><span class="dot" aria-hidden="true"></span>${esc(p.eyebrow)}</div>
    <h1>${esc(p.h1)}</h1>
    <p class="hero-sub">${esc(p.lead)}</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:28px">
      <a href="${p.cta1.href}" class="btn-primary">${esc(p.cta1.label)}</a>
      <a href="${p.cta2.href}" class="btn-ghost">${esc(p.cta2.label)}</a>
    </div>
  </section>

  <section class="section reveal">
    <h2>Sound familiar?</h2>
    <ul class="aud-pains">
${pains}
    </ul>
  </section>

  <section class="section bone reveal">
    <h2>How we work with you</h2>
    <div class="grid-2" style="margin-top:24px">
${work}
    </div>
  </section>

  <section class="section reveal">
    <h2>What you get</h2>
    <div class="terminal" style="margin-top:20px" role="region" aria-label="What you get">
${get}
    </div>
    <p style="margin-top:18px"><a href="${p.proofLink.href}" style="color:var(--signal);text-decoration:none">${esc(p.proofLink.label)}</a></p>
  </section>

  <section class="section bone reveal" style="text-align:center">
    <div style="border:2px solid var(--signal);border-radius:8px;padding:36px;max-width:680px;margin:0 auto">
      <h2 style="margin-bottom:12px">${esc(p.closeH)}</h2>
      <p style="max-width:560px;margin:0 auto 22px">${esc(p.closeP)}</p>
      <a href="${p.closeCta.href}" class="btn-primary">${esc(p.closeCta.label)}</a>
    </div>
  </section>
</main>

${FOOTER}
<script src="/js/main.js"></script>
</body>
</html>
`;
}

// 1) write the three audience pages
for(const p of PAGES){
  const dir=path.join(ROOT,'who-we-help',p.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'), page(p), 'utf8');
}
console.log('Wrote 3 audience pages: '+PAGES.map(p=>p.slug).join(', '));

// 2) sweep the nav sitewide
function allHtml(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const pp=path.join(d,e.name);if(e.isDirectory())o=o.concat(allHtml(pp));else if(e.name.endsWith('.html'))o.push(pp);}return o;}
let swept=0;
for(const f of allHtml(ROOT)){
  let s=fs.readFileSync(f,'utf8'); const before=s; s=applyNav(s);
  if(s!==before){fs.writeFileSync(f,s,'utf8');swept++;}
}
console.log('Nav sweep: '+swept+' files updated');

// 3) rewire homepage buyer cards
{
  const f=path.join(ROOT,'index.html'); let s=fs.readFileSync(f,'utf8'); const before=s;
  s=s.replace('<a class="buyer-card" href="/tools/readiness-score">\n        <div class="buyer-tag">Executive</div>','<a class="buyer-card" href="/who-we-help/executives">\n        <div class="buyer-tag">Executive</div>');
  s=s.replace('<a class="buyer-card" href="/paid-advertising-automation/agency-automation">\n        <div class="buyer-tag">Agency</div>','<a class="buyer-card" href="/who-we-help/agencies">\n        <div class="buyer-tag">Agency</div>');
  s=s.replace('<a class="buyer-card" href="/solutions/automation-sprints">\n        <div class="buyer-tag">In-house</div>','<a class="buyer-card" href="/who-we-help/in-house">\n        <div class="buyer-tag">In-house</div>');
  fs.writeFileSync(f,s,'utf8'); console.log('Homepage buyer cards rewired: '+(s!==before));
}

// 4) sitemap
{
  const f=path.join(ROOT,'sitemap.xml'); let s=fs.readFileSync(f,'utf8'); let added=0;
  for(const p of PAGES){const loc='https://campaignautomation.ai/who-we-help/'+p.slug+'/';
    if(!s.includes(loc)){s=s.replace('</urlset>',`  <url>\n    <loc>${loc}</loc>\n    <lastmod>2026-06-27</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`);added++;}}
  fs.writeFileSync(f,s,'utf8'); console.log('Sitemap: +'+added+' audience pages');
}

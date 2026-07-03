// Builds the Templates & Prompt Packs library: /resources/templates hub
// (categorized, open/browsable, optional email capture via the existing
// Netlify "templates" form) + a detail page per artifact with copy-to-clipboard.
// Content from templates-content.json (workflow output).
// Run: node build-templates.js
const fs = require('fs'), path = require('path');
const ROOT = require('path').resolve(__dirname, '..'); // repo root (scripts live in <repo>/_build)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');

const CONTENT = JSON.parse(fs.readFileSync(path.join(__dirname, 'templates-content.json'), 'utf8'));
const ITEMS = CONTENT.items;
if (!ITEMS || ITEMS.length !== 7) throw new Error('templates-content.json incomplete');

const CATS = ['Agent configs', 'Prompt packs', 'Playbooks'];

// download filename per template
const FILENAME = {
  'campaign-agents-md': 'AGENTS.md', 'campaign-claude-md': 'CLAUDE.md',
  'guardrail-config': 'guardrail-config.md', 'ppc-audit-prompt-pack': 'ppc-audit-prompts.md',
  'seo-brief-prompt-pack': 'seo-brief-prompts.md', 'landing-page-prompt-pack': 'landing-page-prompts.md',
  'campaign-launch-kit': 'campaign-launch-kit.md',
};

// extract unique {{TOKEN}} fields in order of first appearance, with first-use parenthetical hint
function extractFields(artifact) {
  const seen = new Map();
  const re = /\{\{([A-Z0-9_]+)\}\}(?:\s*\(([^)]{3,180})\))?/g; let m;
  while ((m = re.exec(artifact))) { if (!seen.has(m[1])) seen.set(m[1], (m[2] || '').trim()); }
  return [...seen].map(([token, hint]) => ({ token, hint }));
}
const humanize = t => t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ');
const AUTOMATION_REL = {
  'campaign-agents-md': ['/automations/automation-governance', 'Automation Governance build guide'],
  'campaign-claude-md': ['/automations/ai-brief-machine', 'AI Brief Machine build guide'],
  'guardrail-config': ['/automations/automation-governance', 'Automation Governance build guide'],
  'ppc-audit-prompt-pack': ['/automations/ppc-intelligence', 'PPC Intelligence build guide'],
  'seo-brief-prompt-pack': ['/automations/content-brief', 'Content Brief build guide'],
  'landing-page-prompt-pack': ['/automations/seo-ppc-opportunity', 'SEO/PPC Opportunity build guide'],
  'campaign-launch-kit': ['/automations/campaign-launch-kit', 'Campaign Launch Kit build guide'],
};

/* chrome */
const idx0 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const NAV = idx0.slice(idx0.indexOf('<a href="#main-content"'), idx0.indexOf('<div class="page-wrap">')).trimEnd();
const FOOTER = idx0.slice(idx0.indexOf('<footer class="site-footer"'), idx0.indexOf('</footer>') + '</footer>'.length);

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

const CSS = `  .tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
  .tpl-card{border:1px solid var(--border);border-radius:10px;padding:24px;background:var(--slate);display:flex;flex-direction:column;gap:12px;min-width:0;text-decoration:none;transition:border-color .15s,transform .15s}
  .tpl-card:hover{border-color:var(--signal-dim);transform:translateY(-2px)}
  .tpl-card h3{font-family:var(--f-display);font-size:17px;font-weight:700;color:var(--bone);margin:0;line-height:1.25;letter-spacing:-.01em}
  .tpl-card p{font-size:13.5px;color:var(--mist2);line-height:1.6;margin:0;flex:1}
  .tpl-card .tpl-go{font-family:var(--f-mono);font-size:12px;color:var(--signal);letter-spacing:.03em}
  .tpl-chip{font-family:var(--f-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--signal);border:1px solid var(--signal-dim);border-radius:3px;padding:3px 8px;align-self:flex-start}
  .tpl-kv{border:1px solid var(--border);border-radius:6px;overflow:hidden;margin-top:22px;max-width:760px}
  .tpl-kv .kw-row{padding:13px 18px}
  .tpl-artifact{border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:26px;background:var(--slate2)}
  .tpl-artifact-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border);background:var(--slate)}
  .tpl-artifact-bar b{font-family:var(--f-mono);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mist2);font-weight:500}
  .tpl-copy{font-family:var(--f-mono);font-size:11.5px;letter-spacing:.04em;background:var(--signal);color:var(--ink);border:none;border-radius:4px;padding:8px 14px;cursor:pointer;font-weight:600}
  .tpl-copy:hover{filter:brightness(1.07)}
  .tpl-artifact pre{margin:0;padding:20px 22px;max-height:620px;overflow:auto;font-family:var(--f-mono);font-size:12.5px;line-height:1.62;color:var(--mist2);white-space:pre-wrap;overflow-wrap:break-word}
  .tpl-steps{list-style:none;padding:0;margin:26px 0 0;counter-reset:tp}
  .tpl-steps li{position:relative;padding:16px 0 16px 58px;border-bottom:1px solid var(--border);counter-increment:tp;color:var(--mist2);font-size:14.5px;line-height:1.6}
  .tpl-steps li:last-child{border-bottom:none}
  .tpl-steps li::before{content:"0" counter(tp);position:absolute;left:0;top:18px;font-family:var(--f-display);font-size:24px;font-weight:800;color:var(--slate2)}
  .tpl-steps li strong{color:var(--bone)}
  .tpl-fields-panel{border:1px solid var(--signal-dim);border-radius:10px;background:rgba(200,241,53,.03);overflow:hidden;margin-top:22px}
  .tpl-fields-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:16px 20px;border-bottom:1px solid var(--border)}
  .tpl-fields-head b{font-family:var(--f-mono);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--signal);font-weight:600}
  .tpl-fields-meta{display:flex;align-items:center;gap:16px}
  #tpl-fill-count{font-family:var(--f-mono);font-size:11.5px;color:var(--mist);letter-spacing:.03em}
  .tpl-reset{background:none;border:none;font-family:var(--f-mono);font-size:11.5px;color:var(--mist);cursor:pointer;text-decoration:underline;padding:0}
  .tpl-reset:hover{color:var(--bone)}
  .tpl-fields{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px 18px;padding:18px 20px;max-height:420px;overflow-y:auto}
  .tpl-field label{display:block;font-family:var(--f-mono);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--mist2);margin-bottom:5px}
  .tpl-field input{width:100%;box-sizing:border-box;background:var(--slate2);border:1px solid var(--border);border-radius:5px;color:var(--bone);font-family:var(--f-body);font-size:13.5px;padding:9px 11px;outline:none;transition:border-color .15s}
  .tpl-field input:focus{border-color:var(--signal)}
  .tpl-field input.filled{border-color:var(--signal-dim)}
  .tpl-dl{font-family:var(--f-mono);font-size:11.5px;letter-spacing:.04em;background:transparent;color:var(--bone);border:1px solid var(--border);border-radius:4px;padding:8px 14px;cursor:pointer;font-weight:600}
  .tpl-dl:hover{border-color:var(--signal)}`;

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
${CSS}
</style>
<script type="application/ld+json">
${o.ld}
</script>
<script defer src="/js/consent.js"></script>
</head>
<body>
${GTMNS}
${NAV}

<div class="page-wrap">
<main id="main-content">`;
}
const tail = s => `</main>

${FOOTER}
</div>
<script src="/js/main.js"></script>
${s || ''}
</body>
</html>
`;
const ld = (name, desc, url) => JSON.stringify({ '@context': 'https://schema.org', '@graph': [
  { '@type': 'WebPage', name, description: desc, url: 'https://campaignautomation.ai' + url, isPartOf: { '@type': 'WebSite', name: 'Campaign Automation AI', url: 'https://campaignautomation.ai' } },
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://campaignautomation.ai/' },
    { '@type': 'ListItem', position: 2, name: 'Templates & Prompt Packs', item: 'https://campaignautomation.ai/resources/templates' },
    { '@type': 'ListItem', position: 3, name, item: 'https://campaignautomation.ai' + url }
  ].slice(0, url === '/resources/templates' ? 2 : 3) }
] });

/* ── detail pages ── */
for (const it of ITEMS) {
  const rel = ITEMS.filter(x => x.slug !== it.slug && x.category === it.category).slice(0, 2)
    .concat(ITEMS.filter(x => x.slug !== it.slug && x.category !== it.category).slice(0, 1)).slice(0, 3);
  const auto = AUTOMATION_REL[it.slug];
  const lines = it.artifact.split('\n').length;
  const fields = extractFields(it.artifact);
  const fieldInputs = fields.map(f =>
    '<div class="tpl-field"><label for="tf-' + f.token + '">' + esc(humanize(f.token)) + '</label><input id="tf-' + f.token + '" type="text" data-token="' + f.token + '" placeholder="' + escAttr(f.hint ? f.hint.slice(0, 90) : '{{' + f.token + '}}') + '" autocomplete="off" spellcheck="false"></div>').join('\n        ');
  const fname = FILENAME[it.slug] || (it.slug + '.md');
  const page = head({
    title: esc(it.name) + ' — Free Template | Campaign Automation AI',
    desc: it.metaDescription, path: '/resources/templates/' + it.slug,
    ld: ld(it.name, it.metaDescription, '/resources/templates/' + it.slug)
  }) + `
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/resources/templates">Templates</a><span aria-hidden="true">/</span><span class="current">${esc(it.name)}</span></nav>

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>${esc(it.category)} &middot; free template</p>
    <h1>${esc(it.name)}<span class="blink-dot" aria-hidden="true">.</span></h1>
    <p>${esc(it.tagline)}</p>
  </div>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Make it yours</span></p>
    <h2 class="display" style="margin-bottom:8px">Fill in your values.</h2>
    <p class="lead" style="max-width:720px">Everything you enter below is substituted live into the template — copy or download it and the file is already yours. Skip anything you're not sure of; unfilled fields stay as <code style="font-family:var(--f-mono);font-size:14px;color:var(--signal)">{{PLACEHOLDER}}</code> markers. Values save in your browser and carry across every template in the library.</p>
    <div class="tpl-fields-panel">
      <div class="tpl-fields-head"><b>Your values &middot; ${fields.length} fields</b><div class="tpl-fields-meta"><span id="tpl-fill-count" role="status"></span><button type="button" class="tpl-reset" id="tpl-reset">Clear all</button></div></div>
      <div class="tpl-fields">
        ${fieldInputs}
      </div>
    </div>
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">The template</span></p>
    <h2 class="display" style="margin-bottom:8px">Your copy, ready to run.</h2>
    <p class="lead" style="max-width:720px">The preview below updates as you type. Copy it to your clipboard or download it as <code style="font-family:var(--f-mono);font-size:14px;color:var(--signal)">${esc(fname)}</code>.</p>
    <div class="tpl-artifact">
      <div class="tpl-artifact-bar"><b>${esc(it.name)} &middot; ${lines} lines</b><div style="display:flex;gap:10px"><button type="button" class="tpl-dl" data-download>Download ${esc(fname)}</button><button type="button" class="tpl-copy" data-copy>Copy template</button></div></div>
      <pre><code id="tpl-src">${esc(it.artifact)}</code></pre>
    </div>
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">What it is</span></p>
    ${it.what.split(/\n\n+/).map(p => '<p class="lead" style="max-width:720px;margin-bottom:14px">' + esc(p) + '</p>').join('\n    ')}
    <div class="tpl-kv">${it.whenToUse.map(w => '<div class="kw-row"><div class="kw-term">' + esc(w) + '</div><div class="kw-vol">&#10003;</div></div>').join('')}</div>
  </section>

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">Make it yours</span></p>
    <div class="tpl-kv" style="margin-top:0">${it.customize.map(c => '<div class="kw-row"><div class="kw-term">' + esc(c) + '</div><div class="kw-vol">&rarr;</div></div>').join('')}</div>
    <div style="border:1px solid var(--border);border-left:4px solid var(--signal);padding:18px 22px;max-width:760px;margin-top:26px;font-size:14px;color:var(--mist2);line-height:1.65">Used in practice by the <a href="${auto[0]}" style="color:var(--signal)">${auto[1]}</a> — the step-by-step build this template plugs into.</div>
  </section>

  <div class="tagline-footer" style="text-align:center">
    <p>Copy it once.<br><span>Own it forever.</span></p>
    <div class="tf-explore"><p class="tf-explore-label">More templates</p><div class="tf-explore-grid">${rel.map(r => '<a class="tf-explore-card" href="/resources/templates/' + r.slug + '"><span class="tf-x-cat">' + esc(r.category) + '</span><span class="tf-x-title">' + esc(r.name) + '</span></a>').join('')}</div><a class="tf-explore-all" href="/resources/templates">All templates &rarr;</a></div>
  </div>
` + tail(`<script>
(function(){
  var src=document.getElementById('tpl-src');
  if(!src)return;
  var PRISTINE=src.textContent;
  var FNAME=${JSON.stringify(fname)};
  var LSKEY='ca_tpl_fields';
  var inputs=[].slice.call(document.querySelectorAll('.tpl-field input[data-token]'));
  var countEl=document.getElementById('tpl-fill-count');

  function loadVals(){try{return JSON.parse(localStorage.getItem(LSKEY)||'{}')||{};}catch(e){return {};}}
  function saveVals(v){try{localStorage.setItem(LSKEY,JSON.stringify(v));}catch(e){}}

  /* substitute saved values into the preview; unfilled tokens stay visible */
  function apply(){
    var v=loadVals(), t=PRISTINE, filled=0;
    inputs.forEach(function(inp){
      var tok=inp.getAttribute('data-token');
      var val=(v[tok]||'').trim();
      inp.classList.toggle('filled',!!val);
      if(val){filled++;t=t.split('{{'+tok+'}}').join(val);}
    });
    src.textContent=t;
    if(countEl)countEl.textContent=filled+' of '+inputs.length+' filled';
  }

  /* prefill from localStorage (values carry across every template) */
  (function(){var v=loadVals();inputs.forEach(function(inp){var tok=inp.getAttribute('data-token');if(v[tok])inp.value=v[tok];});})();
  inputs.forEach(function(inp){
    inp.addEventListener('input',function(){
      var v=loadVals();
      var val=inp.value.trim();
      if(val)v[inp.getAttribute('data-token')]=val; else delete v[inp.getAttribute('data-token')];
      saveVals(v);apply();
    });
  });
  var reset=document.getElementById('tpl-reset');
  if(reset)reset.addEventListener('click',function(){
    var v=loadVals();
    inputs.forEach(function(inp){delete v[inp.getAttribute('data-token')];inp.value='';});
    saveVals(v);apply();
  });
  apply();

  var copyBtn=document.querySelector('[data-copy]');
  if(copyBtn)copyBtn.addEventListener('click',function(){
    var t=src.textContent;
    function done(ok){copyBtn.textContent=ok?'Copied \\u2713':'Select & copy manually';setTimeout(function(){copyBtn.textContent='Copy template';},2200);}
    function fallback(){try{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);done(true);}catch(e){done(false);}}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){done(true);},function(){fallback();});}
    else fallback();
  });

  var dlBtn=document.querySelector('[data-download]');
  if(dlBtn)dlBtn.addEventListener('click',function(){
    var blob=new Blob([src.textContent],{type:'text/markdown;charset=utf-8'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=FNAME;
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},300);
    var orig=dlBtn.textContent;
    dlBtn.textContent='Downloaded \\u2713';
    setTimeout(function(){dlBtn.textContent=orig;},2200);
  });
})();
</script>`);
  fs.mkdirSync(path.join(ROOT, 'resources', 'templates', it.slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'resources', 'templates', it.slug, 'index.html'), page, 'utf8');
}
console.log('Wrote ' + ITEMS.length + ' template detail pages');

/* ── hub ── */
{
  const catSections = CATS.map(c => {
    const cards = ITEMS.filter(i => i.category === c).map(i =>
      '<a class="tpl-card" href="/resources/templates/' + i.slug + '"><span class="tpl-chip">' + esc(c) + '</span><h3>' + esc(i.name) + '</h3><p>' + esc(i.tagline) + '</p><span class="tpl-go">View &amp; copy &rarr;</span></a>').join('\n      ');
    return `
  <section class="section reveal">
    <p class="section-label"><span class="label-signal">${esc(c)}</span></p>
    <div class="tpl-grid">
      ${cards}
    </div>
  </section>`;
  }).join('\n');

  const page = head({
    title: 'Templates &amp; Prompt Packs — Free, Browsable, Guardrail-First | Campaign Automation AI',
    desc: 'Seven free templates and prompt packs — AGENTS.md, CLAUDE.md, guardrail configs, PPC audit, SEO brief, landing page, and launch kit. Browse, copy, and run them in Claude or Cursor.',
    path: '/resources/templates',
    ld: ld('Templates & Prompt Packs', 'Seven free templates and prompt packs for governed AI marketing automation.', '/resources/templates')
  }) + `
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/resources">Resources</a><span aria-hidden="true">/</span><span class="current">Templates</span></nav>

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>Free &middot; no gate</p>
    <h1>The templates we use<span class="blink-dot" aria-hidden="true">.</span></h1>
    <p>Every template and prompt pack behind our sprints — free to browse, copy, and run in Claude or Cursor. Each one ships guardrail-first: approval thresholds, caps, and a change log are part of the template, not an afterthought.</p>
    <div class="hero-metrics">
      <div class="metric">
        <div class="metric-n" aria-label="${ITEMS.length} templates">${ITEMS.length}</div>
        <div class="metric-l">Templates &amp; prompt packs</div>
      </div>
      <div class="metric" style="padding-left:40px">
        <div class="metric-n" aria-label="${CATS.length} categories">${CATS.length}</div>
        <div class="metric-l">Categories</div>
      </div>
      <div class="metric" style="padding-left:40px">
        <div class="metric-n" aria-label="100 percent guardrail-first">100<span aria-hidden="true">%</span></div>
        <div class="metric-l">Guardrail-first</div>
      </div>
    </div>
  </div>
${catSections}

  <section class="section reveal">
    <p class="section-label"><span class="label-signal">How to use them</span></p>
    <h2 class="display" style="margin-bottom:8px">Three files, one working setup.</h2>
    <ol class="tpl-steps" style="max-width:760px">
      <li><strong>Drop AGENTS.md into your project root.</strong> It defines what the agent may touch, the guardrails it works inside, and how every action gets logged.</li>
      <li><strong>Customize CLAUDE.md with your brand, audience, and goals.</strong> This is the context that makes output specific to your business instead of generic.</li>
      <li><strong>Run Claude or Cursor with the prompt pack for the job.</strong> Each prompt names its inputs and output format — paste your exports and go.</li>
    </ol>
    <div style="border:1px solid var(--border);border-left:4px solid var(--signal);padding:18px 22px;max-width:760px;margin-top:26px;font-size:14px;color:var(--mist2);line-height:1.65">Setting up the environment first? The <a href="/automations/setup" style="color:var(--signal)">Environments &amp; tooling guide</a> covers data access, MCP servers, and the agent layer once — every template assumes it.</div>
  </section>

  <section class="section reveal" style="background:var(--slate)">
    <div class="grid-2" style="align-items:center;gap:64px">
      <div>
        <div class="signal-badge" style="margin-bottom:20px"><span class="dot" aria-hidden="true"></span>Optional</div>
        <h2 class="display" style="margin-bottom:10px">Want them as files?</h2>
        <p class="lead" style="margin-bottom:24px">Everything above is free to copy right off the page. If you&rsquo;d rather have the full pack as ready-to-use files in your inbox — plus updates when new packs ship — leave an email.</p>
        <form name="templates" method="POST" data-netlify="true" netlify-honeypot="bot-field" id="templates-form" style="display:flex;gap:12px;flex-wrap:wrap;max-width:480px">
          <input type="hidden" name="form-name" value="templates">
          <p hidden><label>Don't fill this out if you're human: <input name="bot-field"></label></p>
          <label for="email-capture" class="visually-hidden">Email address</label>
          <input id="email-capture" type="email" name="email" placeholder="you@company.com" required autocomplete="email" style="flex:1;min-width:220px;padding:12px 16px;border:1px solid #333;background:var(--slate2);color:var(--bone);font-family:var(--f-body);font-size:15px;border-radius:4px">
          <button type="submit" class="btn-primary">Send me the pack &rarr;</button>
        </form>
        <p id="templates-form-msg" role="status" aria-live="polite" style="margin-top:14px;font-size:14px;display:none"></p>
      </div>
      <div class="reveal">
        <div style="border:1px solid var(--border);padding:32px">
          <div style="font-family:var(--f-mono);font-size:11px;color:var(--mist);text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px">In the pack</div>
          ${ITEMS.map((i, k) => '<div class="kw-row" style="padding:11px 0' + (k === ITEMS.length - 1 ? ';border-bottom:none' : '') + '"><div class="kw-term">' + esc(i.name) + '</div><div class="kw-vol">&#10022;</div></div>').join('')}
        </div>
      </div>
    </div>
  </section>

  <div class="tagline-footer" style="text-align:center">
    <p>Copy the system.<br><span>Keep the guardrails.</span></p>
    <div class="tf-explore"><p class="tf-explore-label">Keep exploring</p><div class="tf-explore-grid"><a class="tf-explore-card" href="/automations"><span class="tf-x-cat">Build guides</span><span class="tf-x-title">The Automations library — stand each one up yourself</span></a><a class="tf-explore-card" href="/resources/ai-marketing-guardrails"><span class="tf-x-cat">Strategy &amp; bounded autonomy</span><span class="tf-x-title">AI Marketing Guardrails: What to Set Before You Automate</span></a><a class="tf-explore-card" href="/resources/what-is-bounded-autonomy"><span class="tf-x-cat">Strategy &amp; bounded autonomy</span><span class="tf-x-title">What Is Bounded Autonomy in Marketing AI?</span></a></div><a class="tf-explore-all" href="/resources/articles">Browse all articles &rarr;</a></div>
  </div>
` + tail(`<script>
/* Netlify Forms — AJAX submit with inline success + graceful mailto fallback */
(function(){
  var form = document.getElementById('templates-form');
  if (!form) return;
  var msg = document.getElementById('templates-form-msg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var body = new URLSearchParams(new FormData(form)).toString();
    fetch('/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:body })
      .then(function(r){ if(!r.ok) throw new Error('status '+r.status);
        form.style.display='none';
        msg.style.display='block';
        msg.style.color='var(--signal)';
        msg.textContent='\\u2713 Check your inbox \\u2014 the template pack is on its way. If it doesn\\u2019t arrive in a few minutes, email hello@campaignautomation.ai.';
      })
      .catch(function(){
        msg.style.display='block';
        msg.style.color='#FFE200';
        msg.textContent='Something went wrong \\u2014 email hello@campaignautomation.ai and we\\u2019ll send the pack directly.';
      });
  });
})();
</script>`);
  fs.writeFileSync(path.join(ROOT, 'resources', 'templates', 'index.html'), page, 'utf8');
  console.log('Wrote templates hub');
}

/* ── sitemap ── */
{
  const smPath = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smPath, 'utf8');
  let added = 0;
  for (const it of ITEMS) {
    const loc = 'https://campaignautomation.ai/resources/templates/' + it.slug + '/';
    if (!sm.includes(loc)) { sm = sm.replace('</urlset>', '  <url>\n    <loc>' + loc + '</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>'); added++; }
  }
  fs.writeFileSync(smPath, sm, 'utf8');
  console.log('Sitemap: +' + added + ' template URLs');
}
console.log('DONE');

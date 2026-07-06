// Rebuilds the Resources landing page (/resources) + the searchable Articles page
// (/resources/articles) from the article files on disk. Idempotent; re-run after any batch.
// Run: node build-resources.js
const fs = require('fs');
const path = require('path');
const ROOT = require('path').resolve(__dirname, '..'); // repo root (scripts live in <repo>/_build)
const RES = path.join(ROOT, 'resources');

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr = s => esc(s).replace(/"/g,'&quot;');
const decode = s => String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&rsquo;/g,"'").replace(/&middot;/g,'·');

// ---- 1) Sitewide: repoint the "Articles" nav/breadcrumb link to /resources/articles ----
function allHtml(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())o=o.concat(allHtml(p));else if(e.name.endsWith('.html'))o.push(p);}return o;}
let navFixed=0, ldFixed=0;
for(const f of allHtml(ROOT)){
  let s=fs.readFileSync(f,'utf8'); const before=s;
  s=s.split('<a href="/resources">Articles</a>').join('<a href="/resources/articles">Articles</a>');
  // JSON-LD breadcrumb "Articles" item (only the bare /resources, in resources article files)
  if(f.replace(/\\/g,'/').includes('/resources/')){
    s=s.split('"name": "Articles", "item": "https://campaignautomation.ai/resources"').join('"name": "Articles", "item": "https://campaignautomation.ai/resources/articles"');
    s=s.split('"item": "https://campaignautomation.ai/resources"\n').join('"item": "https://campaignautomation.ai/resources/articles"\n');
  }
  if(s!==before){fs.writeFileSync(f,s,'utf8');navFixed++;}
}
console.log('Sitewide Articles-link update: '+navFixed+' files touched');

// ---- 2) Extract shared NAV + FOOTER chrome from a known article (post nav-fix) ----
const srcFile = path.join(RES,'what-is-bounded-autonomy','index.html');
const src = fs.readFileSync(srcFile,'utf8');
const NAV = src.slice(src.indexOf('<a href="#main-content"'), src.indexOf('<div class="page-wrap">')).trimEnd();
const FOOTER = src.slice(src.indexOf('<footer class="site-footer"'), src.indexOf('</footer>')+'</footer>'.length);

// ---- 3) Scan + classify articles ----
const EXCLUDE = new Set(['articles','templates','glossary','ai-automation-pricing','sprint-prep']);
const EXPLICIT = {
  // Strategy & bounded autonomy
  'bounded-autonomy-buyers-guide':'strategy','what-is-bounded-autonomy':'strategy','execution-depth-spectrum':'strategy',
  'predictive-vs-agentic-ai-marketing':'strategy','rule-based-vs-autonomous-ppc':'strategy','black-box-ai-marketing-risks':'strategy',
  'ai-marketing-guardrails':'strategy','human-in-the-loop-marketing-automation':'strategy','reversible-ai-marketing-changes':'strategy',
  'ai-account-access-marketing-tools':'strategy','ai-marketing-approval-thresholds':'strategy','ai-marketing-audit-trail':'strategy',
  'ai-spend-caps-budget-guardrails':'strategy','ai-agents-in-your-crm':'strategy',
  'autonomous-optimization-company':'strategy',
  // Buyer guides
  'evaluate-ai-marketing-automation-platforms':'guides','how-to-evaluate-autonomous-marketing-ai':'guides','ai-marketing-automation-guide':'guides',
  'ai-marketing-automation-governance-checklist':'guides','ai-marketing-automation-glossary-terms':'guides','ai-marketing-automation-roi':'guides',
  'ai-marketing-automation-cost':'guides','ai-marketing-automation-mistakes':'guides','is-your-marketing-ready-for-ai-automation':'guides',
  'ai-marketing-automation-for-small-teams':'guides','first-90-days-ai-marketing-automation':'guides','add-ai-to-your-martech-stack':'guides',
  'ai-marketing-automation-data-security':'guides','credit-based-ai-pricing':'guides',
  // Readiness foundations
  'democratization':'foundations','instrumentation':'foundations','standardization':'foundations','governance':'foundations','team-tooling':'foundations',
};
function catOf(slug){
  if(EXPLICIT[slug]) return EXPLICIT[slug];
  if(/-ai-features$/.test(slug)) return 'vendor';
  if(/(alternatives|compared|competitors|-vs-|vs-governed|campaignautomation-vs|showdown|autonomous-ad-optimization|bid-budget|-map$)/.test(slug)) return 'comparisons';
  return 'guides';
}
const CATS = [
  ['strategy','Strategy & bounded autonomy'],
  ['guides','Buyer guides'],
  ['vendor','Vendor AI features'],
  ['comparisons','Comparisons & alternatives'],
  ['paid','Paid media'],
  ['workflow','Workflow automation'],
  ['revops','Revenue operations'],
  ['foundations','Readiness foundations'],
];
const CATMAP = Object.fromEntries(CATS);

function metaOf(idx){
  const html = fs.readFileSync(idx,'utf8');
  const tm = html.match(/<title>([^<]*)<\/title>/);
  const dm = html.match(/<meta name="description" content="([^"]*)"/);
  if(!tm) return null;
  let title = decode(tm[1].replace(/\s*\|\s*(Campaign Automation AI|CA\.AI)\s*$/,'').trim());
  let desc = dm ? decode(dm[1]).trim() : '';
  if(desc.length>150){ desc=desc.slice(0,148); desc=desc.slice(0,desc.lastIndexOf(' '))+'…'; }
  return {title,desc};
}

const entries = [];
// /resources articles
for(const e of fs.readdirSync(RES,{withFileTypes:true})){
  if(!e.isDirectory() || EXCLUDE.has(e.name)) continue;
  const idx = path.join(RES,e.name,'index.html');
  if(!fs.existsSync(idx)) continue;
  const m = metaOf(idx); if(!m) continue;
  const cat = catOf(e.name);
  const tags = (e.name.replace(/-/g,' ')+' '+m.title+' '+CATMAP[cat]).toLowerCase();
  entries.push({t:m.title,d:m.desc,c:cat,href:'/resources/'+e.name,tags});
}
// pillar cluster articles (the old "Learn" content, now findable in the gallery)
const PILLARS = [['paid-advertising-automation','paid'],['ai-strategy','strategy'],['workflow-automation','workflow'],['revenue-operations','revops']];
for(const [pdir,pcat] of PILLARS){
  const base = path.join(ROOT,pdir);
  if(!fs.existsSync(base)) continue;
  for(const e of fs.readdirSync(base,{withFileTypes:true})){
    if(!e.isDirectory()) continue; // subdirs only (the pillar index.html is the hub, not an article)
    const idx = path.join(base,e.name,'index.html');
    if(!fs.existsSync(idx)) continue;
    const m = metaOf(idx); if(!m) continue;
    const title = m.title.split(/\s+[—–]\s+/)[0].trim(); // drop the "— subtitle" tail for a clean card title
    const tags = (e.name.replace(/-/g,' ')+' '+m.title+' '+CATMAP[pcat]+' '+pdir.replace(/-/g,' ')).toLowerCase();
    entries.push({t:title,d:m.desc,c:pcat,href:'/'+pdir+'/'+e.name,tags});
  }
}
entries.sort((a,b)=>a.t.localeCompare(b.t));
const counts = Object.fromEntries(CATS.map(([k])=>[k,entries.filter(e=>e.c===k).length]));
console.log('Articles indexed: '+entries.length+' ('+CATS.map(([k,l])=>l+': '+counts[k]).join(' · ')+')');

// ---- 4) Build /resources/articles/index.html ----
const artLd = {"@context":"https://schema.org","@graph":[
  {"@type":"CollectionPage","name":"Articles & guides","description":"Browse "+entries.length+" articles on AI marketing automation: strategy, buyer guides, vendor AI features, and competitor comparisons. Filter by topic and search.","url":"https://campaignautomation.ai/resources/articles","isPartOf":{"@type":"WebSite","name":"Campaign Automation AI","url":"https://campaignautomation.ai"}},
  {"@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"https://campaignautomation.ai/"},
    {"@type":"ListItem","position":2,"name":"Resources","item":"https://campaignautomation.ai/resources"},
    {"@type":"ListItem","position":3,"name":"Articles","item":"https://campaignautomation.ai/resources/articles"}
  ]}
]};
// ---- featured "start here" picks ----
const byslug = Object.fromEntries(entries.filter(function(e){return e.href.indexOf('/resources/')===0;}).map(function(e){return [e.href.replace('/resources/',''),e];}));
const FEATURED = [
  {slug:'what-is-bounded-autonomy', why:'New here? Start with the idea the whole approach is built on.'},
  {slug:'execution-depth-spectrum', why:'The lens for judging how much any AI tool should be allowed to do.'},
  {slug:'ai-marketing-automation-guide', why:'The full buyer overview — what it is, and how to choose.'},
  {slug:'bounded-autonomy-buyers-guide', why:'Burned by a black box? The buyer lens that prevents it.'},
];
const catIndex = Object.fromEntries(CATS.map(function(c,i){return [c[0],i];}));
function short(s){ s=String(s); if(s.length<=104) return s; var t=s.slice(0,102); return t.slice(0,t.lastIndexOf(' '))+'…'; }
const featuredCards = FEATURED.map(function(f){
  var e=byslug[f.slug]; if(!e) return '';
  return '<a class="pillar-card" href="'+e.href+'"><span class="rec-badge" style="margin:0 8px 12px 0">Start here</span><div class="pillar-tag signal">'+esc(CATMAP[e.c])+'</div><h3>'+esc(e.t)+'</h3><p>'+esc(f.why)+'</p></a>';
}).filter(Boolean).join('\n        ');
const chipsStatic = ['<button class="art-chip on" data-k="all" type="button">All ('+entries.length+')</button>'].concat(
  CATS.filter(function(c){return counts[c[0]];}).map(function(c){return '<button class="art-chip" data-k="'+c[0]+'" type="button">'+esc(c[1])+' ('+counts[c[0]]+')</button>';})
).join('\n          ');
const gallerySorted = entries.slice().sort(function(a,b){var ci=catIndex[a.c]-catIndex[b.c]; return ci!==0?ci:a.t.localeCompare(b.t);});
const galleryCards = gallerySorted.map(function(e){
  var dt=(e.tags+' '+e.d).toLowerCase();
  return '<a class="pillar-card" data-cat="'+e.c+'" data-text="'+escAttr(dt)+'" href="'+e.href+'"><div class="pillar-tag'+(e.c==='ca'?' signal':'')+'">'+esc(CATMAP[e.c])+'</div><h3>'+esc(e.t)+'</h3><p>'+esc(short(e.d))+'</p></a>';
}).join('\n        ');

const chipCss = `<style>
  .art-section-label{font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mist);margin:36px 0 14px;display:flex;align-items:center;gap:12px}
  .art-section-label::after{content:'';flex:1;height:1px;background:var(--border)}
  .art-feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
  .art-bar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 14px}
  .art-chips{display:flex;gap:8px;flex-wrap:wrap}
  .art-chip{font-family:var(--f-mono);font-size:11px;letter-spacing:.04em;background:transparent;color:var(--mist2);border:1px solid var(--border);padding:8px 12px;cursor:pointer;transition:all .13s;border-radius:3px;white-space:nowrap}
  .art-chip:hover{border-color:var(--mist2);color:var(--bone)}
  .art-chip.on{background:var(--signal);color:var(--ink);border-color:var(--signal);font-weight:600}
  .art-search{position:relative;flex:0 0 210px}
  #artq{width:100%;background:var(--slate2);border:1px solid var(--border);color:var(--bone);font-family:var(--f-mono);font-size:13px;padding:9px 12px;outline:none;transition:border-color .15s;box-sizing:border-box;border-radius:4px}
  #artq:focus{border-color:var(--signal)}
  #artq::placeholder{color:var(--mist)}
  .art-count{font-family:var(--f-mono);font-size:12px;color:var(--mist);letter-spacing:.04em;margin:0 0 18px}
  .art-count b{color:var(--signal)}
  .art-feat-grid .pillar-card h3,.art-gallery .pillar-card h3{font-family:var(--f-display);font-size:16px;line-height:1.3;color:var(--bone);margin:0 0 6px;letter-spacing:-.01em}
  .art-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
  .art-empty{font-family:var(--f-mono);color:var(--mist);font-size:13px;padding:50px 0;text-align:center}
  @media(max-width:560px){.art-bar{flex-direction:column;align-items:stretch}.art-search{flex:1 1 auto}}
</style>`;
const articlesPage = `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<!-- Google consent mode v2 default (denied until the visitor chooses) -->
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TD5GPWN5');</script>
<!-- End Google Tag Manager -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Marketing Automation Articles &amp; Guides | Campaign Automation AI</title>
<meta name="description" content="Browse ${entries.length} articles on AI marketing automation — strategy, buyer guides, vendor AI features, and competitor comparisons. Start with a recommended pick or filter the library.">
<link rel="canonical" href="https://campaignautomation.ai/resources/articles">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
${chipCss}
<script type="application/ld+json">
${JSON.stringify(artLd,null,0)}
</script>
<script defer src="/js/consent.js"></script>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TD5GPWN5"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
${NAV}

<div class="page-wrap">
<main id="main-content">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/resources">Resources</a><span aria-hidden="true">/</span><span class="current">Articles</span></nav>

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>Resources &middot; The library</p>
    <h1>Articles &amp; guides<span class="blink-dot" aria-hidden="true">.</span></h1>
    <p>${entries.length} guides on governed AI marketing automation. Start with a recommended pick, then browse or filter the full library.</p>
    <div class="hero-metrics">
      <div class="metric">
        <div class="metric-n" aria-label="${entries.length} articles">${entries.length}</div>
        <div class="metric-l">Articles, filterable &amp; searchable</div>
      </div>
      <div class="metric" style="padding-left:40px">
        <div class="metric-n" aria-label="${CATS.length} topics">${CATS.length}</div>
        <div class="metric-l">Topic filters</div>
      </div>
      <div class="metric" style="padding-left:40px">
        <div class="metric-n" aria-label="355 glossary terms">355</div>
        <div class="metric-l">Terms defined in the glossary</div>
      </div>
    </div>
  </div>

  <section class="section" style="background:var(--slate)">
    <h2 class="art-section-label" style="margin-top:0;font-weight:400"><span class="label-signal">Start here</span> · recommended</h2>
    <div class="art-feat-grid reveal">
        ${featuredCards}
    </div>
  </section>

  <section class="section">
    <h2 class="art-section-label" style="margin-top:0;font-weight:400">Browse all</h2>
    <div class="art-bar reveal">
      <div class="art-chips" id="artchips">
          ${chipsStatic}
      </div>
      <div class="art-search"><input id="artq" type="search" placeholder="Filter by keyword…" autocomplete="off" spellcheck="false" aria-label="Filter articles"></div>
    </div>
    <div class="art-count" id="artcount" role="status"></div>
    <div class="art-gallery" id="art-gallery">
        ${galleryCards}
    </div>
    <div class="art-empty" id="art-empty" hidden>No articles match. Try a broader word or clear the filter.</div>
  </section>

  <div class="tagline-footer" style="text-align:center">
    <p>Know the terms.<br>Build the system.<br><span>Start with the score.</span></p>
    <div class="tf-explore"><p class="tf-explore-label">Keep exploring</p><div class="tf-explore-grid"><a class="tf-explore-card" href="/resources/glossary"><span class="tf-x-cat">Reference</span><span class="tf-x-title">Glossary &mdash; 355 automation &amp; AI terms defined</span></a><a class="tf-explore-card" href="/resources/templates"><span class="tf-x-cat">Downloads</span><span class="tf-x-title">Templates &amp; Prompt Packs</span></a><a class="tf-explore-card" href="/resources/ai-automation-pricing"><span class="tf-x-cat">Buyer guides</span><span class="tf-x-title">AI Automation Pricing Guide</span></a></div><a class="tf-explore-all" href="/resources">All resources &rarr;</a></div>
  </div>
</main>

${FOOTER}
</div>
<script>
(function(){
  var chips=[].slice.call(document.querySelectorAll('.art-chip'));
  var cards=[].slice.call(document.querySelectorAll('#art-gallery .pillar-card'));
  var q=document.getElementById('artq'), countEl=document.getElementById('artcount'), empty=document.getElementById('art-empty');
  var total=cards.length, active='all', query='';
  function apply(){
    var ql=query.trim().toLowerCase(), shown=0;
    cards.forEach(function(c){
      var ok=(active==='all'||c.getAttribute('data-cat')===active)&&(!ql||c.getAttribute('data-text').indexOf(ql)>=0);
      c.style.display=ok?'':'none'; if(ok)shown++;
    });
    countEl.innerHTML='<b>'+shown+'</b> / '+total+' articles';
    empty.hidden=shown>0;
  }
  chips.forEach(function(b){b.addEventListener('click',function(){active=b.getAttribute('data-k');chips.forEach(function(x){x.classList.toggle('on',x===b);});apply();});});
  var t;q.addEventListener('input',function(e){query=e.target.value;clearTimeout(t);t=setTimeout(apply,80);});
  apply();
})();
</script>
<script src="/js/main.js"></script>
</body>
</html>
`;
fs.mkdirSync(path.join(RES,'articles'),{recursive:true});
fs.writeFileSync(path.join(RES,'articles','index.html'), articlesPage, 'utf8');
console.log('Wrote /resources/articles/index.html');

// ---- 5) Build /resources/index.html landing page ----
const options = [
  {href:'/resources/articles', tag:'Browse', h:'Articles & guides', p:entries.length+' guides on strategy, buyer decisions, vendor AI features, and competitor comparisons — filterable and instantly searchable.'},
  {href:'/tools/readiness-score', tag:'Free tool', h:'Readiness Score', p:'13 questions, 4 minutes, no login. Get your score, tier, binding constraint, guardrail set, and a prioritised roadmap.'},
  {href:'/resources/templates', tag:'Downloads', h:'Templates & Prompt Packs', p:'AGENTS.md, prompt packs, and Claude instruction templates you can copy into your own stack.'},
  {href:'/resources/glossary', tag:'Reference', h:'Glossary', p:'The operator vocabulary of AI marketing automation — bounded autonomy, trigger/action/impact, and the platform, workflow, and process terms that matter.'},
  {href:'/resources/ai-automation-pricing', tag:'Reference', h:'Pricing guide', p:'What AI campaign automation actually costs — audits, sprints, and portals — and how to read opaque vendor pricing.'},
];
const optionCards = options.map(function(o,i){
  return `      <a class="pillar-card reveal${i%3?' reveal-delay-'+(i%3):''}" href="${o.href}">
        <div class="pillar-tag">${esc(o.tag)}</div>
        <h3>${esc(o.h)}</h3>
        <p>${esc(o.p)}</p>
      </a>`;
}).join('\n');
const TOPICS = [
  {href:'/paid-advertising-automation', h:'Paid Advertising Automation', p:'AI-managed Google, Meta &amp; paid search — budget, bids, and creative inside guardrails you set.'},
  {href:'/ai-strategy', h:'AI Strategy &amp; Agentic Intelligence', p:'Bounded autonomy, agentic marketing, and how to measure AI ROI before you buy a tool.'},
  {href:'/workflow-automation', h:'Workflow Automation', p:'Design and automate campaign workflows — briefs, content, governance — one at a time.'},
  {href:'/revenue-operations', h:'Revenue Operations', p:'AI across the revenue stack: lead scoring, routing, ABM, and pipeline forecasting.'},
];
const topicCards = TOPICS.map(function(o,i){
  return `      <a class="pillar-card reveal${i%3?' reveal-delay-'+(i%3):''}" href="${o.href}">
        <div class="pillar-tag signal">Topic</div>
        <h3>${o.h}</h3>
        <p>${o.p}</p>
      </a>`;
}).join('\n');
const landLd = {"@context":"https://schema.org","@graph":[
  {"@type":"CollectionPage","name":"Resources","description":"Tools, articles, templates, glossary, and pricing guides for building governed AI marketing automation.","url":"https://campaignautomation.ai/resources","isPartOf":{"@type":"WebSite","name":"Campaign Automation AI","url":"https://campaignautomation.ai"}},
  {"@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"https://campaignautomation.ai/"},
    {"@type":"ListItem","position":2,"name":"Resources","item":"https://campaignautomation.ai/resources"}
  ]}
]};
const landing = `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<!-- Google consent mode v2 default (denied until the visitor chooses) -->
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TD5GPWN5');</script>
<!-- End Google Tag Manager -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resources — Tools, Articles, Templates &amp; Glossary | Campaign Automation AI</title>
<meta name="description" content="Everything you need to build governed AI marketing automation: the free Readiness Score, ${entries.length}+ articles, templates and prompt packs, a glossary, and a pricing guide.">
<link rel="canonical" href="https://campaignautomation.ai/resources">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json">
${JSON.stringify(landLd,null,0)}
</script>
<script defer src="/js/consent.js"></script>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TD5GPWN5"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
${NAV}

<div class="page-wrap">
<main id="main-content">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span class="current">Resources</span></nav>

  <div class="page-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>Resources</p>
    <h1>Everything you need to build governed automation<span class="blink-dot" aria-hidden="true">.</span></h1>
    <p>Start with the free score, go deep in the articles, or grab the templates.</p>
    <div class="page-meta"><span>${entries.length} articles</span><span>355 glossary terms</span><span>Free 4-min score</span><span>Templates &amp; prompt packs</span></div>
  </div>

  <section class="section" aria-labelledby="library-heading">
    <div class="section-label reveal"><span class="label-signal">The library</span></div>
    <h2 class="display reveal" id="library-heading">Pick where you want to begin.</h2>
    <p class="lead reveal reveal-delay-1" style="margin-bottom:40px">Four ways in: browse the guides, copy the templates, look up a term, or read the buyer's guide first.</p>
    <div class="grid-2">
      <a class="pillar-card reveal" href="/resources/articles">
        <div class="pillar-tag">Browse</div>
        <h3>Articles &amp; guides</h3>
        <p>${entries.length} guides on strategy, buyer decisions, vendor AI features, and competitor comparisons — filterable and instantly searchable.</p>
        <div class="url">${entries.length} guides →</div>
      </a>
      <a class="pillar-card reveal reveal-delay-1" href="/resources/templates">
        <div class="pillar-tag">Downloads</div>
        <h3>Templates &amp; Prompt Packs</h3>
        <p>AGENTS.md, prompt packs, and Claude instruction templates you can copy into your own stack.</p>
        <div class="url">Free downloads</div>
      </a>
      <a class="pillar-card reveal reveal-delay-2" href="/resources/glossary">
        <div class="pillar-tag">Reference</div>
        <h3>Glossary</h3>
        <p>The operator vocabulary of AI marketing automation — bounded autonomy, trigger/action/impact, and the platform, workflow, and process terms that matter.</p>
        <div class="url">355 terms</div>
      </a>
      <a class="pillar-card reveal reveal-delay-3" href="/resources/ai-automation-pricing">
        <div class="pillar-tag">Reference</div>
        <h3>Pricing guide</h3>
        <p>What AI campaign automation actually costs — audits, sprints, and portals — and how to read opaque vendor pricing.</p>
        <div class="url">Buyer's guide →</div>
      </a>
    </div>
  </section>

  <section class="section" style="background:var(--slate)" aria-labelledby="tool-heading">
    <div class="grid-2" style="align-items:center;gap:64px">
      <div class="reveal">
        <div class="signal-badge" style="margin-bottom:24px"><span class="dot" aria-hidden="true"></span>Free tool</div>
        <h2 class="display" id="tool-heading">How ready is your team to automate?</h2>
        <p class="lead" style="margin-bottom:32px">13 questions, 4 minutes, no login. The Readiness Score gives you a score, your tier, your binding constraint, and a prioritised roadmap.</p>
        <a href="/tools/readiness-score" class="btn-primary">Get your free Readiness Score →</a>
        <p style="font-family:var(--f-mono);font-size:12px;color:var(--mist);margin-top:14px">4 min · no login</p>
      </div>
      <div class="reveal reveal-delay-2">
        <div style="border:1px solid var(--border);padding:32px">
          <div style="font-family:var(--f-mono);font-size:11px;color:var(--mist);text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px">What you'll learn</div>
          <div class="kw-row" style="padding:12px 0"><div class="kw-term">Your automation readiness score (0–100)</div><div class="kw-vol">✦</div></div>
          <div class="kw-row" style="padding:12px 0"><div class="kw-term">Your tier and binding constraint</div><div class="kw-vol">✦</div></div>
          <div class="kw-row" style="padding:12px 0"><div class="kw-term">The guardrail set to start with</div><div class="kw-vol">✦</div></div>
          <div class="kw-row" style="padding:12px 0;border-bottom:none"><div class="kw-term">A prioritised roadmap for what to automate first</div><div class="kw-vol">✦</div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section bone" aria-label="Browse by topic">
    <div class="section-label reveal"><span class="label-signal">Browse by topic</span></div>
    <div class="grid-4" data-stagger style="margin-top:8px">
      <a class="card-link" href="/paid-advertising-automation">
        <div class="card bone-card" style="height:100%">
          <div class="card-tag">Topic</div>
          <h4>Paid Advertising Automation</h4>
          <p>AI-managed Google, Meta &amp; paid search — budget, bids, and creative inside guardrails you set.</p>
          <span class="card-arrow" aria-hidden="true">→</span>
        </div>
      </a>
      <a class="card-link" href="/ai-strategy">
        <div class="card bone-card" style="height:100%">
          <div class="card-tag">Topic</div>
          <h4>AI Strategy &amp; Agentic Intelligence</h4>
          <p>Bounded autonomy, agentic marketing, and how to measure AI ROI before you buy a tool.</p>
          <span class="card-arrow" aria-hidden="true">→</span>
        </div>
      </a>
      <a class="card-link" href="/workflow-automation">
        <div class="card bone-card" style="height:100%">
          <div class="card-tag">Topic</div>
          <h4>Workflow Automation</h4>
          <p>Design and automate campaign workflows — briefs, content, governance — one at a time.</p>
          <span class="card-arrow" aria-hidden="true">→</span>
        </div>
      </a>
      <a class="card-link" href="/revenue-operations">
        <div class="card bone-card" style="height:100%">
          <div class="card-tag">Topic</div>
          <h4>Revenue Operations</h4>
          <p>AI across the revenue stack: lead scoring, routing, ABM, and pipeline forecasting.</p>
          <span class="card-arrow" aria-hidden="true">→</span>
        </div>
      </a>
    </div>
  </section>

  <div class="tagline-footer" style="text-align:center">
    <p>Move quickly.<br><span>Do big things.</span></p>
    <div class="tf-explore"><p class="tf-explore-label">Keep exploring</p><div class="tf-explore-grid"><a class="tf-explore-card" href="/resources/what-is-bounded-autonomy"><span class="tf-x-cat">Strategy &amp; bounded autonomy</span><span class="tf-x-title">What Is Bounded Autonomy in Marketing AI?</span></a><a class="tf-explore-card" href="/resources/ai-marketing-automation-guide"><span class="tf-x-cat">Buyer guides</span><span class="tf-x-title">AI Marketing Automation in 2026: Tools, Platforms &amp; the Buyer's Guide</span></a><a class="tf-explore-card" href="/resources/bounded-autonomy-buyers-guide"><span class="tf-x-cat">Strategy &amp; bounded autonomy</span><span class="tf-x-title">Why "Autonomous" Marketing Tools Still Need Guardrails: A Buyer's Guide to Bounded Autonomy</span></a></div><a class="tf-explore-all" href="/resources/articles">Browse all articles &rarr;</a></div>
  </div>
</main>

${FOOTER}
</div>
<script src="/js/main.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(RES,'index.html'), landing, 'utf8');
console.log('Wrote /resources/index.html (landing)');

// ---- 6) Sitemap: ensure /resources/articles is present ----
const smPath = path.join(ROOT,'sitemap.xml');
let sm = fs.readFileSync(smPath,'utf8');
if(!sm.includes('https://campaignautomation.ai/resources/articles/')){
  const entry = `  <url>\n    <loc>https://campaignautomation.ai/resources/articles/</loc>\n    <lastmod>2026-06-27</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  sm = sm.replace('</urlset>', entry+'</urlset>');
  fs.writeFileSync(smPath, sm, 'utf8');
  console.log('Sitemap: added /resources/articles');
} else console.log('Sitemap: /resources/articles already present');

// Deterministic assembler for Pillar-1 article batch.
// Usage: node build-articles.js <articles.json> <repoRoot>
// PIPELINE NOTE: after any article batch, run build-resources.js (rebuilds the
// hub gallery) and then build-related.js (converts each article's duplicate
// end-of-page Readiness CTA into a same-category "Related reading" bridge).
// Reads the workflow's `articles` array and emits resources/<slug>/index.html,
// splices hub cards into resources/index.html, and sitemap entries into sitemap.xml.
const fs = require('fs');
const path = require('path');

const jsonPath = process.argv[2];
const ROOT = process.argv[3];
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const articles = data.articles || data; // accept {articles:[...]} or [...]

const escText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => escText(s).replace(/"/g, '&quot;');

const NAV = `<a href="#main-content" class="skip-nav">Skip to main content</a>
<nav aria-label="Main navigation">
  <a class="nav-logo" href="/" aria-label="Campaign Automation AI — home">CA<span>.</span>AI</a>
  <div class="nav-links">
    <div class="nav-item">
      <a href="/solutions">Solutions</a>
      <div class="dropdown mega" role="group" aria-label="Solutions">
        <div class="mega-grid cols-2">
          <div class="mega-col">
            <span class="dropdown-label">Offerings</span>
            <a href="/solutions/automated-campaign-optimization"><span class="mega-t">Automated Campaign Optimization</span><span class="mega-d">Our core service — always-on optimization loops</span></a>
            <a href="/solutions/campaign-audit"><span class="mega-t">Automation Audit</span><span class="mega-d">The first sprint — find the waste and the plan</span></a>
            <a href="/automations"><span class="mega-t">Automations</span><span class="mega-d">Build guides — stand each one up yourself or with us</span></a>
            <a href="/training"><span class="mega-t">Automation Training</span><span class="mega-d">Upskill your team to run AI workflows</span></a>
          </div>
          <div class="mega-col">
            <span class="dropdown-label">Who we help</span>
            <a href="/who-we-help/agencies"><span class="mega-t">Agencies</span><span class="mega-d">White-label, per-client guardrails</span></a>
            <a href="/who-we-help/in-house"><span class="mega-t">In-house teams</span><span class="mega-d">Automate one workflow, own it</span></a>
            <a href="/who-we-help/executives"><span class="mega-t">Executives</span><span class="mega-d">Board-ready, auditable AI adoption</span></a>
          </div>
        </div>
      </div>
    </div>
    <a href="/results">Results</a>
    <a href="/results/trigger-action-impact">Framework</a>
    <a href="/builders">Builders</a>
    <div class="nav-item">
      <a href="/resources">Resources</a>
      <div class="dropdown mega mega-right" role="group" aria-label="Resources">
        <div class="mega-grid cols-3">
          <div class="mega-col">
            <span class="dropdown-label">Browse</span>
            <a href="/resources/articles"><span class="mega-t">Articles</span><span class="mega-d">100+ guides, filterable &amp; searchable</span></a>
            <a href="/resources/glossary"><span class="mega-t">Glossary</span><span class="mega-d">355 automation &amp; AI terms defined</span></a>
          </div>
          <div class="mega-col">
            <span class="dropdown-label">Topics</span>
            <a href="/paid-advertising-automation"><span class="mega-t">Paid Advertising</span></a>
            <a href="/ai-strategy"><span class="mega-t">AI Strategy</span></a>
            <a href="/workflow-automation"><span class="mega-t">Workflow Automation</span></a>
            <a href="/revenue-operations"><span class="mega-t">Revenue Operations</span></a>
          </div>
          <div class="mega-col">
            <span class="dropdown-label">Tools &amp; downloads</span>
            <a href="/tools/readiness-score"><span class="mega-t">Readiness Score ✦ Free</span><span class="mega-d">Your score in 4 minutes, no login</span></a>
            <a href="/resources/templates"><span class="mega-t">Templates &amp; Prompt Packs</span></a>
            <a href="/resources/ai-automation-pricing"><span class="mega-t">Pricing guide</span></a>
          </div>
        </div>
      </div>
    </div>
    <a href="/tools/readiness-score" class="nav-cta">Get your free score →</a>
  </div>
  <button class="hamburger" id="hamburger" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobileMenu" type="button">
    <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
  </button>
</nav>
<nav class="mobile-menu" id="mobileMenu" aria-label="Mobile navigation" hidden>
  <div class="mobile-section">
    <h2 style="font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mist);margin-bottom:8px">Solutions</h2>
    <a href="/solutions/automated-campaign-optimization">Automated Campaign Optimization</a>
    <a href="/solutions/campaign-audit">Automation Audit</a>
    <a href="/automations">Automations</a>
    <a href="/training">Automation Training</a>
    <a href="/who-we-help/agencies">Agencies</a>
    <a href="/who-we-help/in-house">In-house teams</a>
    <a href="/who-we-help/executives">Executives</a>
  </div>
  <div class="mobile-section">
    <h2 style="font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mist);margin-bottom:8px">Resources</h2>
    <a href="/resources/articles">Articles</a>
    <a href="/resources/glossary">Glossary</a>
    <a href="/resources/templates">Templates &amp; Prompt Packs</a>
    <a href="/resources/ai-automation-pricing">Pricing guide</a>
  </div>
  <div class="mobile-section">
    <h2 style="font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mist);margin-bottom:8px">Topics</h2>
    <a href="/paid-advertising-automation">Paid Advertising Automation</a>
    <a href="/ai-strategy">AI Strategy &amp; Agentic Intelligence</a>
    <a href="/workflow-automation">Workflow Automation</a>
    <a href="/revenue-operations">Revenue Operations</a>
  </div>
  <div class="mobile-section">
    <h2 style="font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mist);margin-bottom:8px">Company</h2>
    <a href="/results">Results</a>
    <a href="/results/trigger-action-impact">Framework</a>
    <a href="/builders">Builders</a>
    <a href="/about">About</a>
  </div>
  <a href="/tools/readiness-score" class="mobile-cta">Get your free Readiness Score →</a>
</nav>`;

const FOOTER = `<footer class="site-footer" role="contentinfo" aria-label="Site footer">
  <div class="footer-watermark" aria-hidden="true">CA<span>.</span>AI</div>
  <div class="footer-inner">
    <div class="footer-cta">
      <div class="footer-cta-text">
        <div class="footer-cta-eyebrow">Start here</div>
        <h2 class="footer-cta-h">Find your fastest win in four minutes.</h2>
      </div>
      <div class="footer-cta-actions">
        <a href="/tools/readiness-score" class="footer-cta-btn">Get your free Readiness Score &rarr;</a>
        <a href="/solutions/campaign-audit" class="footer-cta-link">or start with the Audit &rarr;</a>
      </div>
    </div>
    <div class="footer-grid">
      <div class="footer-brand-col">
        <a href="/" class="footer-brand" aria-label="Campaign Automation AI — home">Campaign Automation<span>.</span>AI</a>
        <p class="footer-desc">AI-powered campaign automation for teams that need strategy, assets, workflows, and measurable execution — built on the stack you already run. One workflow at a time.</p>
        <a href="mailto:hello@campaignautomation.ai" class="footer-contact">hello@campaignautomation.ai</a>
      </div>
      <nav class="footer-col" aria-label="Solutions links">
        <h3>Solutions</h3>
        <a href="/solutions/automated-campaign-optimization">Automated Campaign Optimization</a>
        <a href="/solutions/campaign-audit">Campaign Automation Audit</a>
        <a href="/automations">Automations</a>
        <a href="/platform">Campaign Strategy Portal</a>
        <a href="/request-proposals">Request proposals</a>
      </nav>
      <nav class="footer-col" aria-label="Learn links">
        <h3>Topics</h3>
        <a href="/paid-advertising-automation">Paid Advertising</a>
        <a href="/ai-strategy">AI Strategy</a>
        <a href="/workflow-automation">Workflow Automation</a>
        <a href="/revenue-operations">Revenue Operations</a>
      </nav>
      <nav class="footer-col" aria-label="Resources links">
        <h3>Resources</h3>
        <a href="/tools/readiness-score">Readiness Score</a>
        <a href="/results/trigger-action-impact">TAI Framework</a>
        <a href="/resources/templates">Templates &amp; Prompts</a>
        <a href="/resources/ai-automation-pricing">Pricing guide</a>
      </nav>
      <nav class="footer-col" aria-label="Company links">
        <h3>Company</h3>
        <a href="/builders">Builders</a>
        <a href="/results">Results</a>
        <a href="/training">Training</a>
        <a href="/resources/glossary">Glossary</a>
        <a href="/about">About</a>
        <a href="https://auditdemand.com/?utm_source=campaignautomation.ai&utm_medium=referral&utm_campaign=footer" target="_blank" rel="noopener">AuditDemand &#8599;</a>
      </nav>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">&copy; 2026 campaignautomation.ai &middot; Ottawa &middot; Toronto &middot; Victoria &middot; New Jersey &middot; San Jose</div>
      <div class="footer-tagline">Move quickly. Do big things<span class="blink-dot" aria-hidden="true">.</span></div>
      <button class="footer-top" type="button" aria-label="Back to top" onclick="window.scrollTo({top:0,behavior:'smooth'})">&uarr; Top</button>
    </div>
  </div>
</footer>`;

function pageHtml(a) {
  const url = `https://campaignautomation.ai/resources/${a.slug}`;
  const fullTitle = `${a.title} | Campaign Automation AI`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": a.title,
        "description": a.metaDescription,
        "url": url,
        "mainEntityOfPage": { "@type": "WebPage", "@id": url },
        "author": { "@type": "Organization", "name": "Campaign Automation AI", "url": "https://campaignautomation.ai" },
        "publisher": { "@type": "Organization", "name": "Campaign Automation AI", "url": "https://campaignautomation.ai" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://campaignautomation.ai/" },
          { "@type": "ListItem", "position": 2, "name": "Articles", "item": "https://campaignautomation.ai/resources/articles" },
          { "@type": "ListItem", "position": 3, "name": a.breadcrumbShort, "item": url }
        ]
      }
    ]
  };
  return `<!DOCTYPE html>
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
<title>${escText(fullTitle)}</title>
<meta name="description" content="${escAttr(a.metaDescription)}">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escAttr(a.ogTitle)}">
<meta property="og:description" content="${escAttr(a.ogDescription)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(a.ogTitle)}">
<meta name="twitter:description" content="${escAttr(a.ogDescription)}">
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<script defer src="/js/consent.js"></script>
<!-- ca-prelaunch gate -->
<script>(function(){try{var d=document.documentElement;if(localStorage.getItem('ca_preview')==='1'){d.className+=' site-unlocked';return;}d.className+=' site-locked';var p=location.pathname||'/';if(p.slice(-10)==='index.html')p=p.slice(0,-10);while(p.length>1&&p.charAt(p.length-1)==='/')p=p.slice(0,-1);if(!p)p='/';var EX=['/tools/readiness-score','/resources/ai-automation-pricing','/results'];var PRE=['/solutions','/automations','/who-we-help','/builders','/request-proposals','/training','/platform','/get-started'];var g=EX.indexOf(p)>-1;if(!g){for(var i=0;i<PRE.length;i++){if(p===PRE[i]||p.indexOf(PRE[i]+'/')===0){g=true;break;}}}if(g)d.className+=' site-gated-page';}catch(e){}})();</script>
<noscript><style>html.site-gated-page body{visibility:visible!important}</style></noscript>
<script defer src="/js/prelaunch.js"></script>
<!-- /ca-prelaunch -->
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TD5GPWN5"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
${NAV}

<div class="page-wrap">
<main id="main-content">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/">Home</a><span aria-hidden="true">/</span>
    <a href="/resources/articles">Articles</a><span aria-hidden="true">/</span>
    <span class="current">${escText(a.breadcrumbShort)}</span>
  </nav>

  <div style="max-width:800px;margin:0 auto;padding:8px 24px 0">
    <div class="page-hero" style="padding:24px 0 36px">
      <div class="eyebrow"><span class="dot" aria-hidden="true"></span>${escText(a.eyebrow)}</div>
      <h1>${escText(a.h1)}</h1>
      <p>${escText(a.heroLede)}</p>
    </div>

    <article class="article-wrap">
${a.bodyHtml}
    </article>
  </div>

  <div class="tagline-footer" style="text-align:center">
    <p>Move quickly.<br><span>Do big things.</span></p>
    <a href="/tools/readiness-score" class="btn-primary" style="margin-top:24px">Get your free Readiness Score →</a>
  </div>
</main>

${FOOTER}
</div>
<script src="/js/main.js"></script>
</body>
</html>
`;
}

// 1) Write article files
let written = [];
let warnings = [];
for (const a of articles) {
  if (!a || !a.slug) continue;
  const dir = path.join(ROOT, 'resources', a.slug);
  fs.mkdirSync(dir, { recursive: true });
  const html = pageHtml(a);
  if (!/border:2px solid var\(--signal\)/.test(a.bodyHtml)) warnings.push(`${a.slug}: missing sprint-callout`);
  if (!/Keep reading/i.test(a.bodyHtml)) warnings.push(`${a.slug}: missing keep-reading`);
  if (!/\/tools\/readiness-score/.test(a.bodyHtml)) warnings.push(`${a.slug}: missing primary CTA link`);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  written.push(a.slug);
}

// 2) Article cards now live on /resources/articles (built by build-resources.js from the
//    filesystem). No grid insertion here.

// 3) Sitemap entries
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
let entries = '';
for (const a of articles) {
  if (!a || !a.slug) continue;
  const loc = `https://campaignautomation.ai/resources/${a.slug}/`;
  if (sm.includes(loc)) continue; // idempotent
  entries += `  <url>
    <loc>${loc}</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${a.priority || 0.7}</priority>
  </url>
`;
}
if (entries) {
  sm = sm.replace('</urlset>', entries + '</urlset>');
  fs.writeFileSync(smPath, sm, 'utf8');
}

console.log('WRITTEN ARTICLES (' + written.length + '): ' + written.join(', '));
console.log(warnings.length ? 'WARNINGS:\n' + warnings.join('\n') : 'No warnings.');

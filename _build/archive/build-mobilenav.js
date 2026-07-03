// Rebuild the mobile menu sitewide so it mirrors the desktop nav — adds a
// Resources section (Articles, Glossary, Templates, Pricing guide) that was
// entirely missing on mobile. Idempotent (replaces the whole .mobile-menu nav).
// Run: node build-mobilenav.js
const fs = require('fs'), path = require('path');
const ROOT = 'C:/Users/dave/Desktop/Campaign Automation';
const H = 'style="font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mist);margin-bottom:8px"';

const MOBILE = `<nav class="mobile-menu" id="mobileMenu" aria-label="Mobile navigation" hidden>
  <div class="mobile-section">
    <h2 ${H}>Solutions</h2>
    <a href="/solutions/campaign-audit">Automation Audit</a>
    <a href="/solutions/automation-sprints">Automation Sprints</a>
    <a href="/training">Automation Training</a>
    <a href="/who-we-help/agencies">Agencies</a>
    <a href="/who-we-help/in-house">In-house teams</a>
    <a href="/who-we-help/executives">Executives</a>
  </div>
  <div class="mobile-section">
    <h2 ${H}>Resources</h2>
    <a href="/resources/articles">Articles</a>
    <a href="/resources/glossary">Glossary</a>
    <a href="/resources/templates">Templates &amp; Prompt Packs</a>
    <a href="/resources/ai-automation-pricing">Pricing guide</a>
  </div>
  <div class="mobile-section">
    <h2 ${H}>Topics</h2>
    <a href="/paid-advertising-automation">Paid Advertising Automation</a>
    <a href="/ai-strategy">AI Strategy &amp; Agentic Intelligence</a>
    <a href="/workflow-automation">Workflow Automation</a>
    <a href="/revenue-operations">Revenue Operations</a>
  </div>
  <div class="mobile-section">
    <h2 ${H}>Company</h2>
    <a href="/results">Results</a>
    <a href="/results/trigger-action-impact">Framework</a>
    <a href="/about">About</a>
  </div>
  <a href="/tools/readiness-score" class="mobile-cta">Get your free Readiness Score &rarr;</a>
</nav>`;

const re = /<nav class="mobile-menu"[\s\S]*?<\/nav>/;

function walk(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())o=o.concat(walk(p));else if(e.name.endsWith('.html'))o.push(p);}return o;}

let n=0, noMenu=0, withResources=0;
for(const f of walk(ROOT)){
  let s=fs.readFileSync(f,'utf8'); const b=s;
  if(re.test(s)){ s=s.replace(re, MOBILE); }
  else { noMenu++; }
  if(s!==b){ fs.writeFileSync(f,s,'utf8'); n++; }
  if(/mobile-section[\s\S]{0,120}?>Resources</.test(fs.readFileSync(f,'utf8'))) withResources++;
}
console.log('Mobile menu rebuilt in '+n+' files. Pages with no .mobile-menu: '+noMenu+'. Pages now showing a Resources mobile section: '+withResources);

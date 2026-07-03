// Replace the Solutions and Resources nav dropdowns sitewide with mega-menu panels.
// Matches every current variant (incl. stale ones) via a generic dropdown regex.
// Run: node build-mega.js
const fs=require('fs'), path=require('path');
const ROOT='C:/Users/dave/Desktop/Campaign Automation';

const SOLUTIONS=`<div class="dropdown mega" role="group" aria-label="Solutions">
        <div class="mega-grid cols-2">
          <div class="mega-col">
            <span class="dropdown-label">Offerings</span>
            <a href="/solutions/campaign-audit"><span class="mega-t">Automation Audit</span><span class="mega-d">The first sprint — find the waste and the plan</span></a>
            <a href="/solutions/automation-sprints"><span class="mega-t">Automation Sprints</span><span class="mega-d">Build one governed workflow in 2–4 weeks</span></a>
            <a href="/training"><span class="mega-t">Automation Training</span><span class="mega-d">Upskill your team to run AI workflows</span></a>
          </div>
          <div class="mega-col">
            <span class="dropdown-label">Who we help</span>
            <a href="/who-we-help/agencies"><span class="mega-t">Agencies</span><span class="mega-d">White-label, per-client guardrails</span></a>
            <a href="/who-we-help/in-house"><span class="mega-t">In-house teams</span><span class="mega-d">Automate one workflow, own it</span></a>
            <a href="/who-we-help/executives"><span class="mega-t">Executives</span><span class="mega-d">Board-ready, auditable AI adoption</span></a>
          </div>
        </div>
      </div>`;

const RESOURCES=`<div class="dropdown mega mega-right" role="group" aria-label="Resources">
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
      </div>`;

// generic dropdown matcher: the current single-column dropdowns contain no nested <div>,
// so [\s\S]*?</div> stops at the dropdown's own close. class="dropdown" (quote right after)
// will not match the new class="dropdown mega", so this is idempotent.
// [^>]* tolerates attributes on the link (e.g. aria-current="page" on self-referential pages).
const solRe=/(<a href="\/solutions"[^>]*>Solutions<\/a>\s*)<div class="dropdown"[\s\S]*?<\/div>/;
const resRe=/(<a href="\/resources"[^>]*>Resources<\/a>\s*)<div class="dropdown"[\s\S]*?<\/div>/;

function walk(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())o=o.concat(walk(p));else if(e.name.endsWith('.html'))o.push(p);}return o;}
let nSol=0,nRes=0,files=0;
for(const f of walk(ROOT)){
  let s=fs.readFileSync(f,'utf8'); const b=s;
  if(solRe.test(s)){ s=s.replace(solRe,'$1'+SOLUTIONS); nSol++; }
  if(resRe.test(s)){ s=s.replace(resRe,'$1'+RESOURCES); nRes++; }
  if(s!==b){ fs.writeFileSync(f,s,'utf8'); files++; }
}
console.log('Mega menus applied: Solutions in '+nSol+' files, Resources in '+nRes+' files ('+files+' files written)');
// sanity: any remaining non-mega Solutions/Resources dropdowns?
let staleSol=0,staleRes=0;
for(const f of walk(ROOT)){const s=fs.readFileSync(f,'utf8');
  if(/<a href="\/solutions"[^>]*>Solutions<\/a>\s*<div class="dropdown"[^m]/.test(s)) staleSol++;
}
console.log('Stale Solutions dropdowns left: '+staleSol);

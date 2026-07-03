// Remove the "Learn" nav dropdown sitewide and fold the topics into Resources.
// Run: node remove-learn.js
const fs=require('fs'), path=require('path');
const ROOT='C:/Users/dave/Desktop/Campaign Automation';

const learnStd=`    <div class="nav-item">
      <a href="/learn">Learn</a>
      <div class="dropdown" role="group"><span class="dropdown-label">Knowledge pillars</span>
        <a href="/paid-advertising-automation">Paid Advertising Automation</a>
        <a href="/ai-strategy">AI Strategy &amp; Agentic Intelligence</a>
        <a href="/workflow-automation">Workflow Automation</a>
        <a href="/revenue-operations">Revenue Operations</a>
      </div>
    </div>
`;
const learnHome=`    <div class="nav-item">
      <a href="/learn">Learn</a>
      <div class="dropdown" role="group" aria-label="Learn">
        <span class="dropdown-label" role="presentation">Knowledge pillars</span>
        <a href="/paid-advertising-automation">Paid Advertising Automation</a>
        <a href="/ai-strategy">AI Strategy &amp; Agentic Intelligence</a>
        <a href="/workflow-automation">Workflow Automation</a>
        <a href="/revenue-operations">Revenue Operations</a>
      </div>
    </div>
`;
const resOld=`        <a href="/resources/ai-automation-pricing">Pricing guide</a>
      </div>`;
const resNew=`        <a href="/resources/ai-automation-pricing">Pricing guide</a>
        <span class="dropdown-label" style="margin-top:12px;display:block">Topics</span>
        <a href="/paid-advertising-automation">Paid Advertising</a>
        <a href="/ai-strategy">AI Strategy</a>
        <a href="/workflow-automation">Workflow Automation</a>
        <a href="/revenue-operations">Revenue Operations</a>
      </div>`;

function sweep(s){
  return s.split(learnStd).join('')
          .split(learnHome).join('')
          .split(resOld).join(resNew)
          .split('>Learn</h2>').join('>Topics</h2>')   // mobile section heading
          .split('<h3>Learn</h3>').join('<h3>Topics</h3>'); // footer column heading
}
function walk(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())o=o.concat(walk(p));else if(e.name.endsWith('.html'))o.push(p);}return o;}
let n=0, learnLeft=0, topicsAdded=0;
for(const f of walk(ROOT)){
  let s=fs.readFileSync(f,'utf8'); const b=s; s=sweep(s);
  if(s!==b){fs.writeFileSync(f,s,'utf8');n++;}
  if(/<a href="\/learn">Learn<\/a>/.test(s)) learnLeft++;
  if(/dropdown-label[^>]*>Topics</.test(s)) topicsAdded++;
}
console.log('Swept '+n+' files. Pages still showing a Learn nav link: '+learnLeft+'. Pages with Topics group in Resources: '+topicsAdded);

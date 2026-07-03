// Rename the Solutions "Offerings" links sitewide to Automation Audit / Automation Sprints
// / Automation Training (and reorder audit-first). Run: node rename-offerings.js
const fs=require('fs'), path=require('path');
const ROOT='C:/Users/dave/Desktop/Campaign Automation';
const desktopOld=`        <a href="/solutions/automation-sprints">Automation Sprints</a>
        <a href="/solutions/campaign-audit">Campaign Audit</a>
        <a href="/training">Training</a>`;
const desktopNew=`        <a href="/solutions/campaign-audit">Automation Audit</a>
        <a href="/solutions/automation-sprints">Automation Sprints</a>
        <a href="/training">Automation Training</a>`;
const mobileOld=`    <a href="/solutions/automation-sprints">Automation Sprints</a>
    <a href="/solutions/campaign-audit">Campaign Audit</a>
    <a href="/training">Training</a>`;
const mobileNew=`    <a href="/solutions/campaign-audit">Automation Audit</a>
    <a href="/solutions/automation-sprints">Automation Sprints</a>
    <a href="/training">Automation Training</a>`;
function walk(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())o=o.concat(walk(p));else if(e.name.endsWith('.html'))o.push(p);}return o;}
let n=0;
for(const f of walk(ROOT)){let s=fs.readFileSync(f,'utf8');const b=s;s=s.split(desktopOld).join(desktopNew).split(mobileOld).join(mobileNew);if(s!==b){fs.writeFileSync(f,s,'utf8');n++;}}
console.log('Offerings renamed in '+n+' files');

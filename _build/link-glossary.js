// Auto-links the first occurrence of key glossary terms inside each /resources article
// to its glossary anchor. Safe: only inside <article class="article-wrap">, before the
// sprint callout, never inside headings or existing <a>. Idempotent. Run: node link-glossary.js
const fs = require('fs');
const path = require('path');
const ROOT = require('path').resolve(__dirname, '..'); // repo root (scripts live in <repo>/_build)
const RES = path.join(ROOT, 'resources');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

// [term, mode] — mode 'ci' (case-insensitive phrase) or 'cs' (case-sensitive acronym)
const TERMS = [
  ["bounded autonomy","ci"],["predictive lead scoring","ci"],["lead scoring","ci"],
  ["journey orchestration","ci"],["send-time optimization","ci"],["intent data","ci"],
  ["conversation intelligence","ci"],["win probability","ci"],["waterfall enrichment","ci"],
  ["identity resolution","ci"],["multi-touch attribution","ci"],["attribution window","ci"],
  ["marketing mix modeling","ci"],["incrementality testing","ci"],["Performance Max","ci"],
  ["Advantage+","ci"],["Smart Bidding","ci"],["autonomous bidding","ci"],["budget pacing","ci"],
  ["dynamic creative optimization","ci"],["sender reputation","ci"],["list hygiene","ci"],
  ["vector database","ci"],["prompt injection","ci"],["AI governance","ci"],["AI Overviews","ci"],
  ["zero-party data","ci"],["human-in-the-loop","ci"],["lifecycle stage","ci"],["intent signals","ci"],
  ["RevOps","cs"],["ICP","cs"],["MQL","cs"],["PQL","cs"],["CDP","cs"],["MCP","cs"],["RAG","cs"],
  ["AEO","cs"],["GEO","cs"],["tROAS","cs"],["DMARC","cs"],["SPF","cs"],["DKIM","cs"],["CPQ","cs"],["MER","cs"],
];
// longest first so phrases win over their sub-words
TERMS.sort((a,b)=>b[0].length-a[0].length);
const reFor = (term,mode)=>{const e=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?<![A-Za-z0-9])('+e+')(?![A-Za-z0-9])', mode==='cs'?'':'i');};

function linkRegion(html, file){
  // tokenize into tags vs text; skip inside <a> and <h1..h3>
  const toks = html.split(/(<[^>]+>)/);
  let aDepth=0, hDepth=0, added=0;
  const used = new Set();
  for(let i=0;i<toks.length;i++){
    const tk=toks[i];
    if(tk.startsWith('<')){
      const m=tk.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)/);
      if(m){const close=m[1]==='/';const tag=m[2].toLowerCase();
        if(tag==='a'){aDepth=Math.max(0,aDepth+(close?-1:1));}
        else if(/^h[1-3]$/.test(tag)){hDepth=Math.max(0,hDepth+(close?-1:1));}
      }
      continue;
    }
    if(aDepth>0||hDepth>0||!tk.trim()) continue;
    let text=tk;
    for(const [term,mode] of TERMS){
      const s=slug(term);
      if(used.has(s)) continue;
      if(file.includes('href="/resources/glossary#'+s+'"')) { used.add(s); continue; } // already linked in this file
      const re=reFor(term,mode);
      if(re.test(text)){
        text=text.replace(re,'<a href="/resources/glossary#'+s+'" class="gloss-link" title="Glossary: '+term+'">$1</a>');
        used.add(s); added++;
      }
    }
    toks[i]=text;
  }
  return {html:toks.join(''), added};
}

const EXCLUDE=new Set(['articles','glossary','templates','ai-automation-pricing','sprint-prep']);
let totalLinks=0, filesTouched=0;
for(const e of fs.readdirSync(RES,{withFileTypes:true})){
  if(!e.isDirectory()||EXCLUDE.has(e.name)) continue;
  const f=path.join(RES,e.name,'index.html');
  if(!fs.existsSync(f)) continue;
  let html=fs.readFileSync(f,'utf8');
  const aw=html.indexOf('<article class="article-wrap">');
  if(aw<0) continue; // only templated articles
  const start=aw+'<article class="article-wrap">'.length;
  // region ends at the sprint callout (green border) or </article>
  let end=html.indexOf('border:2px solid var(--signal)', start);
  if(end<0) end=html.indexOf('</article>', start);
  if(end<0) continue;
  // back up to the start of the section that contains the callout marker
  const secOpen=html.lastIndexOf('<section', end);
  if(secOpen>start) end=secOpen;
  const region=html.slice(start,end);
  const {html:linked, added}=linkRegion(region, html);
  if(added>0){
    html=html.slice(0,start)+linked+html.slice(end);
    fs.writeFileSync(f,html,'utf8');
    totalLinks+=added; filesTouched++;
  }
}
console.log('Glossary links added: '+totalLinks+' across '+filesTouched+' articles');

// ensure .gloss-link style exists
const cssPath=path.join(ROOT,'css','style.css');
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('.gloss-link{')){
  css+='\n/* glossary cross-links inside articles */\n.gloss-link{color:inherit;text-decoration:none;border-bottom:1px dotted var(--mist);transition:border-color .15s,color .15s}\n.gloss-link:hover{color:var(--signal);border-bottom-color:var(--signal)}\n';
  fs.writeFileSync(cssPath,css,'utf8');
  console.log('Appended .gloss-link style to style.css');
} else console.log('.gloss-link style already present');

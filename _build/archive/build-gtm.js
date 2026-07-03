// Install Google Tag Manager (GTM-TD5GPWN5) on every page: the script right after
// <meta charset> (as high in <head> as possible, charset stays first) and the
// noscript right after <body>. Idempotent — skips files that already have GTM.
// Run: node build-gtm.js
const fs = require('fs'), path = require('path');
const ROOT = 'C:/Users/dave/Desktop/Campaign Automation';
const ID = 'GTM-TD5GPWN5';

const HEAD = `<meta charset="UTF-8">
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${ID}');</script>
<!-- End Google Tag Manager -->`;

const BODY = `<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

function walk(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())o=o.concat(walk(p));else if(e.name.endsWith('.html'))o.push(p);}return o;}

let added=0, skipped=0, missHead=0, missBody=0;
for(const f of walk(ROOT)){
  let s=fs.readFileSync(f,'utf8');
  if(s.includes(ID)){ skipped++; continue; }
  if(!s.includes('<meta charset="UTF-8">')){ missHead++; continue; }
  if(!s.includes('<body>')){ missBody++; continue; }
  s = s.replace('<meta charset="UTF-8">', HEAD);   // first occurrence only
  s = s.replace('<body>', BODY);                    // first occurrence only
  fs.writeFileSync(f, s, 'utf8');
  added++;
}
console.log('GTM installed: '+added+' files | already had it: '+skipped+' | missing head anchor: '+missHead+' | missing body anchor: '+missBody);

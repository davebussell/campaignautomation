// Wire Google Consent Mode v2 sitewide: set the default (denied) inline in <head>
// BEFORE the GTM snippet, and load the banner script (/js/consent.js) before </head>.
// Idempotent. Run: node build-consent.js
const fs = require('fs'), path = require('path');
const ROOT = 'C:/Users/dave/Desktop/Campaign Automation';

const DEFAULT = `<!-- Google consent mode v2 default (denied until the visitor chooses) -->
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);</script>
<!-- Google Tag Manager -->`;

const LOADER = `<script defer src="/js/consent.js"></script>
</head>`;

function walk(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())o=o.concat(walk(p));else if(e.name.endsWith('.html'))o.push(p);}return o;}

let dflt=0, loader=0;
for(const f of walk(ROOT)){
  let s=fs.readFileSync(f,'utf8'); const b=s;
  // 1) consent default immediately before the GTM head snippet
  if(!s.includes("'consent','default'") && s.includes('<!-- Google Tag Manager -->')){
    s=s.replace('<!-- Google Tag Manager -->', DEFAULT); dflt++;
  }
  // 2) consent.js loader just before </head>
  if(!s.includes('/js/consent.js') && s.includes('</head>')){
    s=s.replace('</head>', LOADER); loader++;
  }
  if(s!==b) fs.writeFileSync(f,s,'utf8');
}
console.log('Consent default added: '+dflt+' files | consent.js loader added: '+loader+' files');

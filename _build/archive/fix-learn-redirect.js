// Retire /learn: 301 -> /resources, delete the orphan page, drop it from the
// sitemap, and normalize the 3 connecting-systems articles' stale nav (they
// still carried the old Learn dropdown + standalone Training link + old mobile
// menu because they were generated after remove-learn.js ran).
// Run: node fix-learn-redirect.js
const fs = require('fs'), path = require('path');
const ROOT = 'C:/Users/dave/Desktop/Campaign Automation';
const BUILD = 'C:/Users/dave/Desktop/_ca_build/build-articles.js';

// 1 — pull the canonical NAV (single source of truth) out of build-articles.js
const src = fs.readFileSync(BUILD, 'utf8');
const m = src.match(/const NAV = `([\s\S]*?)`;/);
if (!m) throw new Error('Could not extract NAV from build-articles.js');
// strip the leading skip-nav line; the article pages already have it
const CANON = m[1].replace(/^<a href="#main-content"[^\n]*\n/, '');

// regex spanning the desktop nav through the close of the mobile menu
const navBlockRe = /<nav aria-label="Main navigation">[\s\S]*?<\/nav>\s*<nav class="mobile-menu"[\s\S]*?<\/nav>/;

const ARTICLES = [
  'resources/connecting-your-marketing-stack/index.html',
  'resources/microsoft-for-marketing-and-sales/index.html',
  'resources/google-for-marketing-and-sales/index.html',
];
let fixed = 0;
for (const rel of ARTICLES) {
  const f = path.join(ROOT, rel);
  let s = fs.readFileSync(f, 'utf8');
  if (!navBlockRe.test(s)) { console.log('  ! nav block not matched:', rel); continue; }
  s = s.replace(navBlockRe, CANON);
  fs.writeFileSync(f, s, 'utf8');
  const leftover = (s.match(/\/learn\b/g) || []).length;
  console.log('  fixed', rel, '— /learn refs remaining:', leftover);
  fixed++;
}

// 2 — _redirects (Netlify): cover bare, trailing-slash, and any subpath
fs.writeFileSync(path.join(ROOT, '_redirects'),
`# Retired /learn hub -> Resources (301)
/learn      /resources  301
/learn/     /resources  301
/learn/*    /resources  301
`, 'utf8');
console.log('Wrote _redirects');

// 3 — delete the orphan page (so the redirect isn't shadowed by a real file)
const learnFile = path.join(ROOT, 'learn/index.html');
if (fs.existsSync(learnFile)) {
  fs.unlinkSync(learnFile);
  try { fs.rmdirSync(path.join(ROOT, 'learn')); } catch (e) {}
  console.log('Deleted learn/index.html');
}

// 4 — strip the /learn <url> entry from sitemap.xml
let sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
sm = sm.replace(/\s*<url>\s*<loc>https:\/\/campaignautomation\.ai\/learn\/<\/loc>[\s\S]*?<\/url>/, '');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm, 'utf8');
console.log('Removed /learn from sitemap.xml. Articles normalized:', fixed);

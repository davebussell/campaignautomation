// Fix the duplicate end-of-page CTA: the block above the footer pushed the same
// "Get your free Readiness Score" as the footer banner right below it. This
// converts that second-from-last CTA into a "Keep exploring" bridge of related
// top-of-funnel content (3 relevant articles + a browse-all link).
// Idempotent; rerun after new article batches so new articles get related links.
// Run: node build-related.js
const fs = require('fs'), path = require('path');
const ROOT = require('path').resolve(__dirname, '..'); // repo root (scripts live in <repo>/_build)

// ---- master article list from the articles hub gallery (single source of truth) ----
const hub = fs.readFileSync(path.join(ROOT, 'resources/articles/index.html'), 'utf8');
const cardRe = /<a class="pillar-card[^"]*" data-cat="([^"]+)" data-text="[^"]*" href="([^"]+)"><div class="pillar-tag[^"]*">([^<]+)<\/div><h3>([\s\S]*?)<\/h3>/g;
const ART = []; let m;
while ((m = cardRe.exec(hub))) ART.push({ cat: m[1], href: m[2], label: m[3], title: m[4] });
if (ART.length < 50) throw new Error('Gallery parse failed — only ' + ART.length + ' articles found');
const byHref = Object.fromEntries(ART.map(a => [a.href, a]));
const bySlug = h => byHref['/resources/' + h] || byHref[h];

function explore(label, items, allHref, allText) {
  return '<div class="tf-explore"><p class="tf-explore-label">' + label + '</p><div class="tf-explore-grid">' +
    items.map(it => '<a class="tf-explore-card" href="' + it.href + '"><span class="tf-x-cat">' + it.cat + '</span><span class="tf-x-title">' + it.title + '</span></a>').join('') +
    '</div><a class="tf-explore-all" href="' + allHref + '">' + allText + ' &rarr;</a></div>';
}
const pick = slugs => slugs.map(s => { const a = bySlug(s); if (!a) throw new Error('Unknown article slug: ' + s); return { href: a.href, cat: a.label, title: a.title }; });

// regex: the readiness-score button inside a tagline-footer block
const tfRe = /(<(?:div|section) class="tagline-footer[^"]*"[^>]*>[\s\S]*?)<a href="\/tools\/readiness-score"[^>]*class="[^"]*btn-primary[^"]*"[^>]*>[^<]*<\/a>/;

function swapTagline(file, items, allHref, allText, label) {
  const f = path.join(ROOT, file);
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('tf-explore')) return 'skip(done)';
  if (!tfRe.test(s)) return 'MISS(no tagline btn)';
  s = s.replace(tfRe, '$1' + explore(label || 'Keep exploring', items, allHref || '/resources/articles', allText || 'Browse all articles'));
  fs.writeFileSync(f, s, 'utf8');
  return 'ok';
}

const log = (f, r) => console.log('  ' + r.padEnd(18) + f);

// ---- 1) core pages with tagline-footer duplicates ----
log('index.html', swapTagline('index.html', pick(['what-is-bounded-autonomy', 'ai-marketing-automation-guide', 'ai-marketing-automation-roi'])));
log('solutions/index.html', swapTagline('solutions/index.html', pick(['ai-automation-vs-marketing-agency', 'ai-marketing-automation-cost', 'evaluate-ai-marketing-automation-platforms'])));
log('results/index.html', swapTagline('results/index.html', pick(['ai-marketing-automation-roi', 'ai-marketing-audit-trail', 'human-in-the-loop-marketing-automation'])));
log('results/trigger-action-impact/index.html', swapTagline('results/trigger-action-impact/index.html', pick(['what-is-bounded-autonomy', 'execution-depth-spectrum', 'reversible-ai-marketing-changes'])));
log('training/index.html', swapTagline('training/index.html', pick(['first-90-days-ai-marketing-automation', 'ai-marketing-automation-for-small-teams', 'ai-marketing-automation-governance-checklist'])));
log('builders/index.html', swapTagline('builders/index.html', pick(['what-is-bounded-autonomy', 'ai-marketing-guardrails', 'ai-marketing-automation-governance-checklist'])));
log('resources/index.html', swapTagline('resources/index.html', pick(['what-is-bounded-autonomy', 'ai-marketing-automation-guide', 'bounded-autonomy-buyers-guide'])));
// articles hub: bridge to the OTHER tofu resources (it already is the article library)
log('resources/articles/index.html', swapTagline('resources/articles/index.html', [
  { href: '/resources/glossary', cat: 'Reference', title: 'Glossary &mdash; 355 automation &amp; AI terms defined' },
  { href: '/resources/templates', cat: 'Downloads', title: 'Templates &amp; Prompt Packs' },
  { href: '/resources/ai-automation-pricing', cat: 'Buyer guides', title: 'AI Automation Pricing Guide' }
], '/resources', 'All resources'));

// ---- 2) who-we-help closing boxes that duplicate the footer CTA ----
const boxRe = /<section class="section bone reveal" style="text-align:center">\s*<div style="border:2px solid var\(--signal\)[\s\S]*?<\/section>/;
function swapBox(file, items) {
  const f = path.join(ROOT, file);
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('tf-explore')) return 'skip(done)';
  if (!boxRe.test(s)) return 'MISS(no closing box)';
  s = s.replace(boxRe, '<section class="section reveal">\n    <div class="tf-explore" style="margin:0 auto">' +
    explore('Keep exploring', items, '/resources/articles', 'Browse all articles').replace('<div class="tf-explore">', '').replace(/<\/div>$/, '') + '</div>\n  </section>');
  fs.writeFileSync(f, s, 'utf8');
  return 'ok';
}
log('who-we-help/in-house/index.html', swapBox('who-we-help/in-house/index.html', pick(['ai-marketing-automation-for-small-teams', 'first-90-days-ai-marketing-automation', 'ai-marketing-automation-cost'])));
log('who-we-help/executives/index.html', swapBox('who-we-help/executives/index.html', pick(['black-box-ai-marketing-risks', 'ai-marketing-automation-roi', 'ai-marketing-automation-data-security'])));

// ---- 3) audit page: retarget the secondary ghost (kept primary Request CTA) ----
(function () {
  const f = path.join(ROOT, 'solutions/campaign-audit/index.html');
  let s = fs.readFileSync(f, 'utf8');
  const old = '<a href="/tools/readiness-score" class="btn-ghost">Not scored yet? Take the free Readiness Score</a>';
  if (s.includes(old)) {
    s = s.replace(old, '<a href="/resources/ai-marketing-automation-guide" class="btn-ghost">New to automation? Read the buyer&rsquo;s guide</a>');
    fs.writeFileSync(f, s, 'utf8');
    log('solutions/campaign-audit (ghost retarget)', 'ok');
  } else log('solutions/campaign-audit (ghost retarget)', s.includes('Read the buyer') ? 'skip(done)' : 'MISS');
})();

// ---- 4) every article page: same-category "Related reading" ----
const byCat = {};
ART.forEach(a => { (byCat[a.cat] = byCat[a.cat] || []).push(a); });
let ok = 0, skip = 0, miss = 0;
for (const a of ART) {
  const rel = a.href.replace(/^\//, '') + '/index.html';
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) { miss++; continue; }
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('tf-explore')) { skip++; continue; }
  if (!tfRe.test(s)) { miss++; continue; }
  const sibs = byCat[a.cat].filter(x => x.href !== a.href);
  const i = byCat[a.cat].indexOf(a);
  const three = [0, 1, 2].map(k => sibs[(i + k) % sibs.length]).filter((v, idx, arr) => v && arr.indexOf(v) === idx)
    .map(x => ({ href: x.href, cat: x.label, title: x.title }));
  if (three.length < 2) { skip++; continue; }
  s = s.replace(tfRe, '$1' + explore('Related reading', three, '/resources/articles', 'Browse all articles'));
  fs.writeFileSync(f, s, 'utf8'); ok++;
}
console.log('Articles: related-reading added to ' + ok + ' | already done: ' + skip + ' | no tagline btn: ' + miss + ' (of ' + ART.length + ')');

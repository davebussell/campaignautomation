/* ── NAV SCROLL BLUR ─────────────────────────────────────── */
const nav = document.querySelector('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ── MOBILE MENU (with ARIA) ─────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  const toggleMenu = (open) => {
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (open) {
      mobileMenu.removeAttribute('hidden');
      const firstLink = mobileMenu.querySelector('a');
      if (firstLink) firstLink.focus();
    } else {
      setTimeout(() => { if (!mobileMenu.classList.contains('open')) mobileMenu.setAttribute('hidden', ''); }, 200);
    }
  };

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    toggleMenu(!isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      toggleMenu(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMenu(false);
      hamburger.focus();
    }
  });
}

/* ── REDUCED MOTION CHECK ────────────────────────────────── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── PAGE ENTER ANIMATION ────────────────────────────────── */
if (!prefersReducedMotion) {
  document.body.classList.add('page-entering');
  setTimeout(() => document.body.classList.remove('page-entering'), 220);
}

/* ── PAGE EXIT TRANSITIONS ───────────────────────────────── */
if (!prefersReducedMotion) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    document.body.style.animation = 'page-exit-anim 180ms ease forwards';
    setTimeout(() => { window.location.href = href; }, 180);
  });
}

/* ── WORD-BY-WORD HERO REVEAL ────────────────────────────── */
const heroWords = document.querySelectorAll('.hero-word');
if (heroWords.length) {
  if (prefersReducedMotion) {
    heroWords.forEach(w => w.classList.add('revealed'));
  } else {
    heroWords.forEach((word, i) => {
      setTimeout(() => word.classList.add('revealed'), 100 + i * 70);
    });
  }
}

/* ── SCROLL REVEAL ───────────────────────────────────────── */
if (prefersReducedMotion) {
  document.querySelectorAll('.reveal, .reveal-left').forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left').forEach(el => revealObserver.observe(el));
}

/* ── COUNTER ANIMATION (restarts on every re-entry) ─────── */
function animateCounter(el) {
  const raw = el.dataset.original || el.textContent.trim();
  el.dataset.original = raw; // cache so we always re-read the true value
  const prefix = raw.match(/^[^\d]*/)?.[0] ?? '';
  const suffix = raw.match(/[^\d.]*$/)?.[0] ?? '';
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (isNaN(num) || prefersReducedMotion) return;

  const duration = 1200;
  const start = performance.now();
  const isDecimal = String(num).includes('.');
  el.setAttribute('aria-label', raw);

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = num * ease;
    el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = raw;
  };
  requestAnimationFrame(tick);
}

/* Counter observer fires every entry — no unobserve so it restarts on re-entry */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.metric-n, .result-n').forEach(animateCounter);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.hero-metrics, .result-card').forEach(el => counterObserver.observe(el));

/* ── TERMINAL TYPING (screen-reader safe) ────────────────── */
function initTerminalTyping(terminal) {
  if (prefersReducedMotion) return;

  const lines = Array.from(terminal.querySelectorAll('[data-type]'));
  if (!lines.length) return;

  lines.forEach(l => {
    l.dataset.full = l.textContent;
    l.setAttribute('aria-hidden', 'true');
    l.style.visibility = 'hidden';
    l.style.height = '0';
    l.style.overflow = 'hidden';
    l.style.margin = '0';
    l.style.padding = '0';
  });

  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'false');
  liveRegion.className = 'sr-only';
  terminal.appendChild(liveRegion);

  let lineIndex = 0;
  let charIndex = 0;

  function typeLine() {
    if (lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const full = line.dataset.full;

    if (charIndex === 0) {
      line.style.visibility = '';
      line.style.height = '';
      line.style.overflow = '';
      line.style.margin = '';
      line.style.padding = '';
    }

    if (charIndex < full.length) {
      line.textContent = full.slice(0, charIndex + 1);
      charIndex++;
      setTimeout(typeLine, 18 + Math.random() * 20);
    } else {
      liveRegion.textContent = full;
      lineIndex++;
      charIndex = 0;
      setTimeout(typeLine, 180);
    }
  }

  const termObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      termObserver.disconnect();
      setTimeout(typeLine, 600);
    }
  }, { threshold: 0.3 });
  termObserver.observe(terminal);
}

document.querySelectorAll('.terminal[data-animate]').forEach(initTerminalTyping);

/* ── TIER COPY ───────────────────────────────────────────── */
const TIER_COPY = {
  siloed: {
    name: 'Siloed',
    heroSub: 'Break business data and intelligence silos — build connections faster and remove organizational barriers with expert consulting, training, and hands-on project management.',
    heroCta: 'Break the Silos Holding You Back →',
    heroCtaHref: '/tools/readiness-score?ref=audit',
    chipTagline: 'Your data silos are the constraint',
    sprintInsert: 'Disconnected data and fragmented teams are your binding constraint. Start with the Campaign Automation Audit to map exactly where the barriers are — before you build anything.',
  },
  emerging: {
    name: 'Emerging',
    heroSub: 'You have the foundation — now systematize it. Connect your campaign data, eliminate manual handoffs, and build automation that compounds across every channel.',
    heroCta: 'Build on Your Foundation →',
    heroCtaHref: '/solutions/automation-sprints',
    chipTagline: 'Ready to systematize',
    sprintInsert: 'Foundation sprints are available for your score. The Audit will confirm which workflow delivers the fastest ROI and prevent you from building on a shaky base.',
  },
  operational: {
    name: 'Operational',
    heroSub: 'You\'re running well. The next layer is optimization — close the gaps between your tools, reduce manual overhead, and compound your automation advantages across every campaign.',
    heroCta: 'Unlock the Next Level →',
    heroCtaHref: '/solutions/automation-sprints',
    chipTagline: 'Optimize for compounding leverage',
    sprintInsert: 'All sprints are unlocked for your score. Recommended options are highlighted based on your industry profile.',
  },
  agentic: {
    name: 'Agentic',
    heroSub: 'You\'re ahead of the curve. The next layer is intelligence — agentic systems that plan, adjust, and report without manual intervention. Let\'s build the infrastructure.',
    heroCta: 'Go Fully Agentic →',
    heroCtaHref: '/platform',
    chipTagline: 'Build agentic intelligence',
    sprintInsert: 'Full sprint catalogue available. The Campaign Strategy Portal gives you ongoing AI-generated intelligence that runs ahead of your campaigns — not behind them.',
  },
};

function getTierKey(score) {
  return score >= 85 ? 'agentic' : score >= 70 ? 'operational' : score >= 50 ? 'emerging' : 'siloed';
}

function clearReadinessScore() {
  RSCORE.clear();
  try { localStorage.removeItem('ca_funnel'); } catch(e) {}
  try { localStorage.removeItem('ca_plan'); } catch(e) {}
  window.location.reload();
}

/* ── READINESS SCORE PERSISTENCE + CHIP ─────────────── */
const RSCORE = {
  KEY: 'ca_readiness',
  save(data) { try { localStorage.setItem(this.KEY, JSON.stringify({...data, savedAt: Date.now()})); } catch(e){} },
  load() { try { const d = localStorage.getItem(this.KEY); return d ? JSON.parse(d) : null; } catch(e){ return null; } },
  clear() { try { localStorage.removeItem(this.KEY); } catch(e){} }
};

/* ── FUNNEL TRACKER ──────────────────────────────────── */
const FUNNEL = {
  KEY: 'ca_funnel',
  load()  { try { return JSON.parse(localStorage.getItem(this.KEY) || 'null') || {visited:[]}; } catch(e){ return {visited:[]}; } },
  save(d) { try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch(e){} },
  track(slug) {
    const d = this.load();
    if (!d.visited.includes(slug)) { d.visited.push(slug); this.save(d); }
  },
  setFlag(flag, val=true) { const d=this.load(); d[flag]=val; this.save(d); },
  /* Determine stage name based on score + visit history */
  stage() {
    const score = RSCORE.load();
    const d = this.load();
    const v = d.visited || [];
    if (!score || score.score === undefined) return 'audit';
    const tier = getTierKey(score.score);
    if (d.proposalSubmitted)                              return 'contractor';
    if (v.includes('request-proposals')||d.sprintsSelected) return 'proposals';
    if (v.includes('automation-sprints'))                 return 'proposals';
    if (v.includes('sprint-prep')||v.includes('training')) return 'sprints';
    if (tier==='siloed')                                  return 'training';
    return 'prep';
  },
  /* CTA config per stage, optionally influenced by score tier */
  cta(stg, tier) {
    const map = {
      audit:       { label:'Get Audit →',               href:'/tools/readiness-score',        next:null },
      training:    { label:'Explore Training →',         href:'/training',                     next:'training' },
      prep:        { label:'Build Sprint Foundation →',  href:'/resources/sprint-prep',        next:'sprint-prep' },
      sprints:     { label:'Browse Sprints →',           href:'/solutions/automation-sprints', next:'automation-sprints' },
      proposals:   { label:'Get Proposals →',            href:'/request-proposals',            next:'request-proposals' },
      contractor:  { label:'Track Proposals →',          href:'/request-proposals',            next:null },
    };
    // Siloed tier gets training before sprint-prep
    if (stg==='prep' && tier==='siloed') return map.training;
    // Agentic/Operational can skip straight to proposals
    if (stg==='training' && (tier==='agentic'||tier==='operational')) return map.prep;
    return map[stg] || map.audit;
  }
};

/* Track current page slug on load */
(function trackCurrentPage(){
  const slug = window.location.pathname.replace(/^\/|\/$/g,'').split('/').pop() || 'home';
  FUNNEL.track(slug);
})();

/* Floating score chip — injects on every page if score exists */
(function injectScoreChip() {
  const data = RSCORE.load();
  if (!data || data.score === undefined) return;
  const tk = getTierKey(data.score);
  const copy = TIER_COPY[tk];

  const chip = document.createElement('a');
  chip.href = '/tools/readiness-score';
  chip.className = 'score-chip';
  chip.setAttribute('aria-label', `Your readiness score: ${data.score} out of 100, ${copy.name}. Click to view results.`);
  chip.innerHTML = `
    <div style="display:flex;align-items:baseline;gap:2px">
      <span class="score-chip-num">${data.score}</span>
      <span class="score-chip-denom">/100</span>
    </div>
    <div class="score-chip-meta">
      <span class="score-chip-tier">${copy.name}</span>
      <span class="score-chip-label">${copy.chipTagline}</span>
    </div>
    <span class="score-chip-retake">View results →</span>
  `;
  document.body.appendChild(chip);
})();

/* Nav — score badge + funnel-aware CTA + next-step highlight */
(function updateNavFunnel() {
  const scoreData = RSCORE.load();
  const hasScore  = scoreData && scoreData.score !== undefined;
  const tier      = hasScore ? getTierKey(scoreData.score) : 'siloed';
  const stg       = FUNNEL.stage();
  const ctaCfg    = FUNNEL.cta(stg, tier);

  /* 1 — Replace .nav-cta with score badge+dropdown (if scored) or updated CTA text */
  document.querySelectorAll('a.nav-cta').forEach(el => {
    if (hasScore) {
      const score = scoreData.score;
      const tierName  = score>=85?'Agentic':score>=70?'Operational':score>=50?'Emerging':'Siloed';
      const wrapper = document.createElement('div');
      wrapper.className = 'nav-item nav-score-item';
      wrapper.setAttribute('role','listitem');
      wrapper.innerHTML = `
        <a href="/tools/readiness-score" class="nav-score nav-score--${tier}"
          aria-label="Your Readiness Score: ${score} — ${tierName}">
          <span class="nav-score-num">${score}</span>
          <span class="nav-score-label">${tierName}</span>
        </a>
        <div class="dropdown nav-score-dd" role="menu" aria-label="Score actions">
          <span class="dropdown-label">Score ${score}/100 — ${tierName}</span>
          <a href="/tools/readiness-score" role="menuitem">View full scorecard →</a>
          <a href="/get-started" role="menuitem">Plan your next steps →</a>
          <button class="nav-score-reset" role="menuitem" type="button" onclick="clearReadinessScore()">Reset assessment</button>
        </div>`;
      el.replaceWith(wrapper);
    } else if (stg !== 'audit') {
      el.href = ctaCfg.href;
      el.textContent = ctaCfg.label;
    }
  });

  /* 2 — Update mobile CTA */
  document.querySelectorAll('a.mobile-cta').forEach(el => {
    el.href = ctaCfg.href;
    el.textContent = ctaCfg.label;
  });

  /* 3 — Highlight recommended next nav link */
  if (ctaCfg.next) {
    document.querySelectorAll('nav[aria-label="Main navigation"] a, nav.mobile-menu a').forEach(a => {
      const path = (a.getAttribute('href') || '').replace(/^\/|\/$/g,'');
      if (path === ctaCfg.next || path.endsWith('/'+ctaCfg.next)) {
        a.classList.add('nav-next-step');
      }
    });
  }
})();

/* Apply score gating to any page with [data-min-score] elements */
function applyScoreGating() {
  const cards = document.querySelectorAll('[data-min-score]');
  if (!cards.length) return;
  const data = RSCORE.load();
  const score = data ? data.score : -1;
  const industry = data ? (data.industry || '') : '';

  // Industry → recommended sprint IDs
  const industryMap = {
    ecom:    ['ppc-intelligence','event-followup','lead-reactivation'],
    b2b_saas:['lead-reactivation','content-brief','seo-ppc'],
    b2b_svc: ['lead-reactivation','event-followup','launch-kit'],
    agency:  ['content-brief','launch-kit','seo-ppc'],
    local:   ['ppc-intelligence','launch-kit','event-followup'],
    other:   ['content-brief','launch-kit']
  };
  const recommended = industryMap[industry] || [];

  cards.forEach(card => {
    const minScore = parseInt(card.dataset.minScore, 10);
    const sprintId = card.dataset.sprintId || '';
    const isRec = recommended.includes(sprintId);

    card.classList.remove('locked','available','recommended');

    if (score < 0) {
      // No score taken yet — show low-complexity as teaser, lock the rest
      if (minScore <= 45) {
        card.classList.add('available');
      } else {
        card.classList.add('locked');
        injectLockOverlay(card, minScore, 'Take the free Readiness Score to unlock');
      }
    } else if (score >= minScore) {
      card.classList.add(isRec ? 'recommended' : 'available');
      if (isRec) injectRecBadge(card);
    } else {
      card.classList.add('locked');
      const msg = score < 50
        ? `Complete the Audit to unlock (score ${minScore}+ required)`
        : `Score ${minScore}+ required — your score: ${score}`;
      injectLockOverlay(card, minScore, msg);
    }
  });

  // Score-personalised hero insert
  if (score >= 0) injectScoreHeroInsert(score, data);
  else injectNoScoreBanner();
}

function injectLockOverlay(card, minScore, msg) {
  if (card.querySelector('.sprint-lock-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'sprint-lock-overlay';
  overlay.innerHTML = `
    <span class="lock-icon" aria-hidden="true">🔒</span>
    <span class="lock-msg">${msg}</span>
    <a href="/tools/readiness-score">Take the Readiness Score →</a>
  `;
  card.style.position = 'relative';
  card.appendChild(overlay);
  card.style.filter = '';
  card.style.opacity = '.45';
  card.style.pointerEvents = 'none';
  overlay.style.pointerEvents = 'all';
  overlay.querySelectorAll('a').forEach(a => { a.style.pointerEvents = 'all'; });
}

function injectRecBadge(card) {
  if (card.querySelector('.rec-badge')) return;
  const badge = document.createElement('span');
  badge.className = 'rec-badge';
  badge.textContent = '★ Best match';
  const badgeRow = card.querySelector('.sprint-badge');
  if (badgeRow) badgeRow.prepend(badge);
  else card.prepend(badge);
}

function injectScoreHeroInsert(score, data) {
  const target = document.getElementById('sprint-hero-insert-target');
  if (!target) return;
  const tk = getTierKey(score);
  const copy = TIER_COPY[tk];
  const industryLabels = {ecom:'E-commerce/DTC',b2b_saas:'B2B SaaS',b2b_svc:'B2B Services',agency:'Agency',local:'Local/Regional',other:'Other'};
  const indLabel = data.industry ? ` · ${industryLabels[data.industry]||''}` : '';
  const insert = document.createElement('div');
  insert.className = 'score-hero-insert';
  insert.innerHTML = `
    <div class="shi-score">${score}</div>
    <div class="shi-body">
      <strong>Your score: ${copy.name}${indLabel}</strong>
      <p>${copy.sprintInsert}</p>
      <a href="/resources/sprint-prep" style="display:inline-block;margin-top:10px;font-family:var(--f-mono);font-size:11px;color:var(--signal);letter-spacing:.06em;text-decoration:none">Build your sprint foundation →</a>
    </div>
  `;
  target.parentNode.insertBefore(insert, target);
}

function injectNoScoreBanner() {
  const target = document.getElementById('sprint-hero-insert-target');
  if (!target) return;
  const banner = document.createElement('div');
  banner.className = 'score-gate-banner';
  banner.innerHTML = `
    <div class="sgb-text">
      <strong>Your sprint options depend on your Readiness Score</strong>
      <p>Some sprints are locked until you hit a minimum score threshold. The score takes 4 minutes and is free.</p>
    </div>
    <a href="/tools/readiness-score" class="sgb-btn">Take the free Readiness Score →</a>
  `;
  target.parentNode.insertBefore(banner, target);
}

/* Swap hero language based on tier — runs on any page with .hero-sub */
(function injectTierLanguage() {
  const data = RSCORE.load();
  if (!data || data.score === undefined) return;
  const copy = TIER_COPY[getTierKey(data.score)];

  // Homepage / landing hero subtext
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    heroSub.textContent = copy.heroSub;
    heroSub.setAttribute('data-tier-personalized', 'true');
  }

  // Primary hero CTA button — only swap if it still points to default destinations
  const defaultHrefs = ['/solutions/campaign-audit', '/get-started'];
  const heroCta = document.querySelector('.hero-actions .btn-primary');
  if (heroCta && defaultHrefs.some(h => heroCta.getAttribute('href') === h)) {
    heroCta.textContent = copy.heroCta;
    heroCta.href = copy.heroCtaHref;
  }
})();

/* Run gating on pages that have sprint/offering cards */
if (document.querySelector('[data-min-score]')) {
  applyScoreGating();
}

/* ── SPRINT PROPOSAL MULTI-SELECT + TRAY ────────────────── */
const SPRINT_META = {
  'ai-brief':          { name: 'AI Brief Machine',              type: 'Leapfrog', price: '$4k–$6k' },
  'search-term-intel': { name: 'Search Term Intelligence',      type: 'Leapfrog', price: '$4k–$6k' },
  'competitive-intel': { name: 'Competitive Intelligence Engine', type: 'Leapfrog', price: '$5k–$8k' },
  'content-atomization':{ name: 'Content Atomization System',   type: 'Leapfrog', price: '$5k–$8k' },
  'content-brief':     { name: 'Content Brief',                 type: 'Integration', price: '$5k–$8k' },
  'launch-kit':        { name: 'Campaign Launch Kit',           type: 'Integration', price: '$5k–$10k' },
  'ppc-intelligence':  { name: 'PPC Intelligence',              type: 'Integration', price: '$5k–$10k' },
  'seo-ppc':           { name: 'SEO/PPC Opportunity',           type: 'Integration', price: '$5k–$10k' },
  'event-followup':    { name: 'Event Follow-Up',               type: 'Integration', price: '$5k–$10k' },
  'lead-reactivation': { name: 'Lead Reactivation',             type: 'Integration', price: '$8k–$15k' },
};

(function initProposalSelect() {
  const cards = document.querySelectorAll('.sprint-card[data-sprint-id]');
  if (!cards.length) return;

  const selected = new Set();

  // Inject select button into each eligible card
  cards.forEach(card => {
    const id = card.dataset.sprintId;
    if (!id || id === 'audit-first') return; // skip audit card
    if (card.classList.contains('locked')) return;

    const btn = document.createElement('button');
    btn.className = 'sprint-select-btn';
    btn.setAttribute('aria-label', 'Add to proposal request');
    btn.setAttribute('title', 'Add to proposal request');
    btn.innerHTML = '+';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (selected.has(id)) {
        selected.delete(id);
        card.classList.remove('card-selected');
        btn.innerHTML = '+';
        btn.setAttribute('aria-label', 'Add to proposal request');
      } else {
        selected.add(id);
        card.classList.add('card-selected');
        btn.innerHTML = '✓';
        btn.setAttribute('aria-label', 'Remove from proposal request');
      }
      updateTray();
    });
    card.appendChild(btn);

    // Update direct CTA link
    const cta = card.querySelector('.sprint-cta');
    if (cta) {
      cta.textContent = 'Get Proposals →';
      cta.href = `/request-proposals/?sprints=${id}`;
    }
  });

  // Create the tray
  const tray = document.createElement('div');
  tray.id = 'proposal-tray';
  tray.className = 'proposal-tray';
  tray.setAttribute('role', 'region');
  tray.setAttribute('aria-label', 'Proposal request summary');
  tray.innerHTML = `
    <div class="pt-summary">
      <div class="pt-count">0</div>
      <div class="pt-label">sprints selected</div>
      <div class="pt-names"></div>
    </div>
    <button class="pt-clear" aria-label="Clear selection">Clear</button>
    <a href="/request-proposals/" class="pt-cta">Request Proposals →</a>
  `;
  document.body.appendChild(tray);

  tray.querySelector('.pt-clear').addEventListener('click', () => {
    selected.clear();
    cards.forEach(card => {
      card.classList.remove('card-selected');
      const btn = card.querySelector('.sprint-select-btn');
      if (btn) { btn.innerHTML = '+'; btn.setAttribute('aria-label', 'Add to proposal request'); }
    });
    updateTray();
  });

  function updateTray() {
    const count = selected.size;
    tray.classList.toggle('visible', count > 0);
    tray.querySelector('.pt-count').textContent = count;
    tray.querySelector('.pt-label').textContent = count === 1 ? 'sprint selected' : 'sprints selected';
    const names = Array.from(selected).map(id => SPRINT_META[id]?.name || id).join(', ');
    tray.querySelector('.pt-names').textContent = names;
    const ids = Array.from(selected).join(',');
    tray.querySelector('.pt-cta').href = `/request-proposals/?sprints=${ids}`;
    if (count > 0) FUNNEL.setFlag('sprintsSelected', true);
  }
})();

/* ── SPRINT FILTER TABS ──────────────────────────────────── */
(function initSprintFilter() {
  const tabs = document.querySelectorAll('.sprint-filter-tab');
  if (!tabs.length) return;

  function filterSprints(filter) {
    document.querySelectorAll('.sprint-card[data-stage]').forEach(card => {
      if (filter === 'all') {
        card.style.display = '';
      } else if (filter === 'leapfrog') {
        card.style.display = card.dataset.sprintType === 'leapfrog' ? '' : 'none';
      } else {
        const stages = (card.dataset.stage || '').split(' ');
        card.style.display = stages.includes(filter) ? '' : 'none';
      }
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterSprints(tab.dataset.filter);
    });
  });

  // Auto-select tab based on saved stage
  const data = RSCORE.load();
  if (data && data.stage) {
    const stageMap = { pre: 'early', early: 'early', growth: 'growth', scale: 'scale' };
    const autoFilter = stageMap[data.stage];
    if (autoFilter) {
      const matchTab = document.querySelector(`.sprint-filter-tab[data-filter="${autoFilter}"]`);
      if (matchTab) {
        tabs.forEach(t => t.classList.remove('active'));
        matchTab.classList.add('active');
        filterSprints(autoFilter);
      }
    }
  }
})();

/* ── PARALLAX — hero only, desktop only ──────────────────── */
const heroSection = document.querySelector('.hero');
if (heroSection && !prefersReducedMotion) {
  const limeOrb = heroSection.querySelector('.orb-lime');
  const boneOrb = heroSection.querySelector('.orb-bone');
  const heroMetrics = heroSection.querySelector('.hero-metrics');

  const onParallaxScroll = () => {
    if (window.innerWidth < 900) return;
    const scrollY = window.scrollY;
    if (scrollY > window.innerHeight) return;
    if (limeOrb) limeOrb.style.transform = `translate(0,${scrollY * 0.06}px)`;
    if (boneOrb) boneOrb.style.transform = `translate(0,${scrollY * 0.04}px)`;
    if (heroMetrics) heroMetrics.style.transform = `translateY(${scrollY * 0.03}px)`;
  };

  window.addEventListener('scroll', onParallaxScroll, { passive: true });
}

/* ── SCROLL SNAP INDICATOR ───────────────────────────────── */
if (window.innerWidth >= 900) {
  const snapSections = document.querySelectorAll('.snap-sec');
  if (snapSections.length > 1) {
    const indicator = document.createElement('nav');
    indicator.className = 'snap-indicator';
    indicator.setAttribute('aria-label', 'Page sections');

    snapSections.forEach((section, i) => {
      const dot = document.createElement('button');
      dot.className = 'snap-dot';
      dot.setAttribute('aria-label', `Go to section ${i + 1}`);
      dot.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth' }));
      indicator.appendChild(dot);
    });

    document.body.appendChild(indicator);

    const dots = Array.from(indicator.querySelectorAll('.snap-dot'));
    const dotObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(snapSections).indexOf(entry.target);
          dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
      });
    }, { threshold: 0.5 });

    snapSections.forEach(s => dotObserver.observe(s));
    if (dots[0]) dots[0].classList.add('active');
  }
}

/* ── PILLAR NAV ACTIVE STATE ─────────────────────────────── */
const pillarLinks = document.querySelectorAll('.pillar-nav a[href^="#"]');
if (pillarLinks.length) {
  pillarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      pillarLinks.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
      this.classList.add('active');
      this.setAttribute('aria-current', 'location');
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        pillarLinks.forEach(l => {
          const match = l.getAttribute('href') === '#' + id;
          l.classList.toggle('active', match);
          if (match) l.setAttribute('aria-current', 'location');
          else l.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  document.querySelectorAll('.article-section[id]').forEach(s => observer.observe(s));
}

/* ── STAGGER GRID CHILDREN ───────────────────────────────── */
if (!prefersReducedMotion) {
  document.querySelectorAll('.grid-3[data-stagger], .grid-4[data-stagger], .buyer-router[data-stagger]').forEach(grid => {
    const children = Array.from(grid.children);
    children.forEach((child, i) => {
      child.classList.add('reveal');
      child.classList.add(`reveal-delay-${Math.min(i + 1, 5)}`);
    });
    children.forEach(child => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.08 });
      obs.observe(child);
    });
  });
}

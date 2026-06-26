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

/* Pause the hero Sankey's SMIL flow under reduced motion (CSS can't stop SMIL) */
if (prefersReducedMotion) {
  const skSvg = document.querySelector('.hero-sankey__svg');
  if (skSvg && skSvg.pauseAnimations) skSvg.pauseAnimations();
}

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
  // NOTE: ca_plan (proposal cart) is intentionally preserved — it's an
  // independent shopping action, not part of the score/funnel state.
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
      audit:       { label:'Get your free score →',     href:'/tools/readiness-score',        next:null },
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

  /* 1 — Single, state-aware nav CTA:
         no score  → "Get your free score →"  (Readiness Score — the free hook)
         has score → "Plan your sprints →"    (Automation Sprints — the next step) */
  const navCta = hasScore
    ? { href: '/solutions/automation-sprints', text: 'Plan your sprints →' }
    : { href: '/tools/readiness-score',        text: 'Get your free score →' };

  document.querySelectorAll('a.nav-cta, a.nav-cta-yellow').forEach(el => {
    el.href = navCta.href;
    el.textContent = navCta.text;
    el.className = 'nav-cta-yellow';
    el.removeAttribute('role');
  });
  // Remove any second button injected by the previous two-CTA model (idempotent)
  document.querySelectorAll('a.nav-cta-audit').forEach(el => el.remove());

  /* 2 — Mobile CTA mirrors desktop (single button) */
  const mobileCtaText = hasScore ? 'Plan your sprints →' : 'Get your free Readiness Score →';
  document.querySelectorAll('a.mobile-cta').forEach(el => {
    if (el.classList.contains('mobile-cta-audit')) return; // legacy injected — removed below
    el.href = navCta.href;
    el.textContent = mobileCtaText;
    el.classList.add('mobile-cta-yellow');
  });
  document.querySelectorAll('a.mobile-cta-audit').forEach(el => el.remove());

  /* 3 — Personalize Solutions dropdown based on tier/stage */
  (function() {
    const solutionsLink = document.querySelector('.nav-links a[href="/solutions"]');
    if (!solutionsLink) return;
    const dropdown = solutionsLink.closest('.nav-item')?.querySelector('.dropdown');
    if (!dropdown) return;

    function lnk(text, href, tag) {
      return `<a href="${href}" role="menuitem">${text}${tag?`<span class="dd-tag">${tag}</span>`:''}</a>`;
    }

    const scoreLabel = hasScore ? ` — Score ${scoreData.score}/100` : '';
    let html = '';

    if (!hasScore || tier === 'siloed') {
      html =
        `<span class="dropdown-label">Start here — free</span>`+
        lnk('Readiness Score','/tools/readiness-score','FREE')+
        `<span class="dropdown-label">First sprint</span>`+
        lnk('Campaign Automation Audit','/solutions/campaign-audit','START HERE')+
        `<span class="dropdown-label">Build sprints</span>`+
        lnk('AI Brief Machine','/solutions/automation-sprints','WEB · PPC')+
        lnk('Search Term Intelligence','/solutions/automation-sprints','PPC · SEO')+
        lnk('Content Atomization System','/solutions/automation-sprints','WEB · SEO')+
        `<span class="dropdown-label">Programs</span>`+
        lnk('AI Marketing Training','/training')+
        lnk('Campaign Strategy Portal','/platform')+
        `<div class="dropdown-divider"></div>`+
        lnk('Browse full catalog →','/solutions/automation-sprints');
    } else if (tier === 'emerging') {
      html =
        `<span class="dropdown-label">Recommended${scoreLabel}</span>`+
        lnk('PPC Intelligence Sprint','/solutions/sprints/ppc-intelligence','PPC')+
        lnk('Content Brief Sprint','/solutions/sprints/content-brief','SEO · WEB')+
        lnk('Campaign Launch Kit','/solutions/sprints/campaign-launch','WEB · PPC')+
        `<span class="dropdown-label">More</span>`+
        lnk('Campaign Automation Audit','/solutions/campaign-audit','first sprint')+
        lnk('AI Marketing Training','/training')+
        lnk('Campaign Strategy Portal','/platform')+
        `<div class="dropdown-divider"></div>`+
        lnk('Browse full catalog →','/solutions/automation-sprints');
    } else if (tier === 'operational') {
      html =
        `<span class="dropdown-label">Recommended${scoreLabel}</span>`+
        lnk('SEO/PPC Opportunity Sprint','/solutions/sprints/seo-ppc','SEO · PPC')+
        lnk('Lead Reactivation Sprint','/solutions/sprints/lead-reactivation','ABM')+
        lnk('PPC Intelligence Sprint','/solutions/sprints/ppc-intelligence','PPC')+
        `<span class="dropdown-label">Intelligence</span>`+
        lnk('Campaign Strategy Portal','/platform')+
        lnk('Campaign Automation Audit','/solutions/campaign-audit','first sprint')+
        `<div class="dropdown-divider"></div>`+
        lnk('Browse full catalog →','/solutions/automation-sprints');
    } else {
      html =
        `<span class="dropdown-label">Intelligence${scoreLabel}</span>`+
        lnk('Campaign Strategy Portal','/platform')+
        `<span class="dropdown-label">Advanced Sprints</span>`+
        lnk('Event Follow-Up Sprint','/solutions/sprints/event-followup','ABM · LOCAL')+
        lnk('Lead Reactivation Sprint','/solutions/sprints/lead-reactivation','ABM')+
        lnk('Campaign Automation Audit','/solutions/campaign-audit','first sprint')+
        `<div class="dropdown-divider"></div>`+
        lnk('Browse full catalog →','/solutions/automation-sprints');
    }

    dropdown.innerHTML = html;
    dropdown.style.minWidth = '300px';
  })();

  /* 4 — Highlight recommended next nav link */
  if (ctaCfg.next) {
    document.querySelectorAll('nav[aria-label="Main navigation"] a, nav.mobile-menu a').forEach(a => {
      const path = (a.getAttribute('href') || '').replace(/^\/|\/$/g,'');
      if (path === ctaCfg.next || path.endsWith('/'+ctaCfg.next)) {
        a.classList.add('nav-next-step');
      }
    });
  }
})();

/* (Removed legacy score-gating + lock-overlay/hero-insert code that targeted the
   old [data-min-score] / #sprint-hero-insert-target sprint cards. The current
   unified catalog uses application filters instead — no markup uses those hooks.) */

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
  const defaultHrefs = ['/solutions/campaign-audit', '/get-started', '/tools/readiness-score'];
  const heroCta = document.querySelector('.hero-actions .btn-primary');
  if (heroCta && defaultHrefs.some(h => heroCta.getAttribute('href') === h)) {
    heroCta.textContent = copy.heroCta;
    heroCta.href = copy.heroCtaHref;
  }
})();

/* (Removed legacy .sprint-card proposal multi-select + stage-filter IIFEs and
   their SPRINT_META map. The unified catalog at /solutions/automation-sprints
   ships its own inline application filter and ca_plan proposal tray.) */

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

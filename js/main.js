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
      // Delay hiding so close animation can play
      setTimeout(() => { if (!mobileMenu.classList.contains('open')) mobileMenu.setAttribute('hidden', ''); }, 200);
    }
  };

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    toggleMenu(!isOpen);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMenu(false);
      hamburger.focus();
    }
  });
}

/* ── SCROLL REVEAL ───────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Skip animations — make everything visible immediately
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

/* ── COUNTER ANIMATION ───────────────────────────────────── */
function animateCounter(el) {
  const raw = el.textContent.trim();
  const prefix = raw.match(/^[^\d]*/)?.[0] ?? '';
  const suffix = raw.match(/[^\d.]*$/)?.[0] ?? '';
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (isNaN(num) || prefersReducedMotion) return;

  const duration = 1200;
  const start = performance.now();
  const isDecimal = String(num).includes('.');
  // Store original for aria-label
  el.setAttribute('aria-label', raw);

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = num * ease;
    el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = raw; // restore exact original
  };
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.metric-n, .result-n').forEach(animateCounter);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.hero-metrics, .result-card').forEach(el => counterObserver.observe(el));

/* ── TERMINAL TYPING (screen-reader safe) ────────────────── */
function initTerminalTyping(terminal) {
  if (prefersReducedMotion) return;

  const lines = Array.from(terminal.querySelectorAll('[data-type]'));
  if (!lines.length) return;

  // Store full text and hide visually but keep accessible
  lines.forEach(l => {
    l.dataset.full = l.textContent;
    l.setAttribute('aria-hidden', 'true'); // screen reader uses aria-live region instead
    l.style.visibility = 'hidden';
    l.style.height = '0';
    l.style.overflow = 'hidden';
    l.style.margin = '0';
    l.style.padding = '0';
  });

  // Live region for screen readers
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
      liveRegion.textContent = full; // announce completed line to screen reader
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

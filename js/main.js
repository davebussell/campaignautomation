/* ── NAV SCROLL BLUR ─────────────────────────────────────── */
const nav = document.querySelector('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ── MOBILE MENU ─────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

/* ── SCROLL REVEAL ───────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left').forEach(el => revealObserver.observe(el));

/* ── COUNTER ANIMATION ───────────────────────────────────── */
function animateCounter(el) {
  const raw = el.textContent.trim();
  const prefix = raw.match(/^[^\d]*/)?.[0] ?? '';
  const suffix = raw.match(/[^\d]*$/)?.[0] ?? '';
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return;

  const duration = 1200;
  const start = performance.now();
  const isDecimal = String(num).includes('.');

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = num * ease;
    el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
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

/* ── TERMINAL TYPING EFFECT ──────────────────────────────── */
function initTerminalTyping(terminal) {
  const lines = Array.from(terminal.querySelectorAll('[data-type]'));
  if (!lines.length) return;

  lines.forEach(l => { l.dataset.full = l.textContent; l.textContent = ''; l.style.display = 'none'; });

  let lineIndex = 0;
  let charIndex = 0;

  function typeLine() {
    if (lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const full = line.dataset.full;

    if (charIndex === 0) { line.style.display = ''; }

    if (charIndex < full.length) {
      line.textContent = full.slice(0, charIndex + 1);
      charIndex++;
      setTimeout(typeLine, 18 + Math.random() * 20);
    } else {
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
      pillarLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        pillarLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  document.querySelectorAll('.article-section[id]').forEach(s => observer.observe(s));
}

/* ── STAGGER GRID CHILDREN ───────────────────────────────── */
document.querySelectorAll('.grid-3[data-stagger], .grid-4[data-stagger], .buyer-router[data-stagger]').forEach(grid => {
  const children = Array.from(grid.children);
  children.forEach((child, i) => {
    child.classList.add('reveal');
    child.classList.add(`reveal-delay-${Math.min(i + 1, 5)}`);
  });
  children.forEach(child => revealObserver.observe(child));
});

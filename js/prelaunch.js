/* ═══════════════════════════════════════════════════════════
   PRE-LAUNCH GATE (soft, client-side)
   The site is in pre-launch. Until the preview password is
   entered, commercial surfaces (pricing, offerings, inquiry,
   next-step CTAs) are hidden and whole commercial PAGES show a
   "coming soon" overlay. Public preview pages (brand, articles,
   glossary, framework) stay browsable with their CTAs hidden.

   NOTE: this is a soft gate. A JS password on a static site is
   not real security — the gated markup and this password remain
   readable in page source / the public repo. It signals
   "not open for business yet"; it does not defend against a
   determined viewer. (Owner accepted this trade-off.)

   The pre-paint <html> classes (site-locked / site-unlocked /
   site-gated-page) are set by a tiny inline <head> snippet so
   commercial content never flashes before this script runs.
   Unlock state lives in localStorage 'ca_preview' ('1' = unlocked).
   Console helpers: caPreview.unlock('SunnyDays'), caPreview.lock().
   ═══════════════════════════════════════════════════════════ */
(function () {
  var KEY = 'ca_preview';
  var PW = 'SunnyDays';
  var root = document.documentElement;

  function isUnlocked() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }

  // Public console API (handy for testing / re-locking).
  window.caPreview = {
    unlock: function (pw) {
      if ((pw || '') === PW) { try { localStorage.setItem(KEY, '1'); } catch (e) {} location.reload(); return true; }
      return false;
    },
    lock: function () { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }
  };

  if (isUnlocked()) return; // full site — nothing to gate

  var gated = root.classList.contains('site-gated-page');
  var path = (location.pathname || '/').replace(/index\.html$/, '');
  var isBuilders = /^\/builders(\/|$)/.test(path);

  function unlock(val, errEl, inputEl) {
    if ((val || '').trim() === PW) {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      location.reload();
    } else if (errEl) {
      errEl.hidden = false;
      if (inputEl) { inputEl.value = ''; try { inputEl.focus({ preventScroll: true }); } catch (e) { inputEl.focus(); } }
    }
  }

  function buildOverlay() {
    var wrap = document.createElement('div');
    wrap.className = 'ca-coming';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Pre-launch preview');
    var title = isBuilders ? 'Our builders — coming soon' : 'Launching soon';
    var sub = isBuilders
      ? 'The people building Campaign Automation AI will be introduced at launch.'
      : 'Campaign Automation AI is in pre-launch. This page opens to everyone when we go live.';
    wrap.innerHTML =
      '<div class="ca-coming-card">' +
        '<div class="ca-coming-logo" aria-hidden="true">CA<span>.</span>AI</div>' +
        '<div class="ca-coming-eyebrow">Pre-launch preview</div>' +
        '<h1 class="ca-coming-title">' + title + '</h1>' +
        '<p class="ca-coming-sub">' + sub + '</p>' +
        '<form class="ca-coming-form" autocomplete="off" novalidate>' +
          '<input type="password" class="ca-coming-input" placeholder="Preview password" aria-label="Preview password" autocomplete="off" spellcheck="false">' +
          '<button type="submit" class="ca-coming-btn">Unlock preview</button>' +
        '</form>' +
        '<p class="ca-coming-err" role="alert" hidden>That password didn’t match. Try again.</p>' +
        '<a class="ca-coming-home" href="/">← Back to the preview home</a>' +
      '</div>';
    (document.body || root).appendChild(wrap);
    var form = wrap.querySelector('.ca-coming-form');
    var input = wrap.querySelector('.ca-coming-input');
    var err = wrap.querySelector('.ca-coming-err');
    form.addEventListener('submit', function (e) { e.preventDefault(); unlock(input.value, err, input); });
    return wrap;
  }

  function buildPill(overlay) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ca-preview-pill';
    b.innerHTML = '🔒 Pre-launch preview';
    b.setAttribute('aria-label', 'Pre-launch preview — enter the password to unlock the full site');
    b.addEventListener('click', function () {
      overlay.style.display = 'flex';
      var i = overlay.querySelector('.ca-coming-input');
      if (i) { try { i.focus({ preventScroll: true }); } catch (e) { i.focus(); } }
    });
    document.body.appendChild(b);
  }

  function run() {
    var overlay = buildOverlay();
    if (gated) {
      overlay.style.display = 'flex'; // covers the (hidden) commercial page
      var i = overlay.querySelector('.ca-coming-input');
      if (i) { try { i.focus({ preventScroll: true }); } catch (e) {} }
    } else {
      overlay.style.display = 'none'; // public preview: overlay only on demand
      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.style.display = 'none'; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') overlay.style.display = 'none'; });
      buildPill(overlay);
    }
  }

  if (document.body) run();
  else document.addEventListener('DOMContentLoaded', run);
})();

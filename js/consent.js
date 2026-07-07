/* Cookie consent banner wired to Google Consent Mode v2.
   The default (denied) is set inline in <head> before GTM loads; this script
   collects the visitor's choice, calls gtag('consent','update', …), persists it,
   and re-applies it on return visits. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var DL = window.dataLayer = window.dataLayer || [];
  function gtag() { DL.push(arguments); }
  var KEY = 'ca_consent_v1';

  function read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function write(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }

  function apply(c) {
    gtag('consent', 'update', {
      ad_storage: c.ads ? 'granted' : 'denied',
      ad_user_data: c.ads ? 'granted' : 'denied',
      ad_personalization: c.ads ? 'granted' : 'denied',
      analytics_storage: c.analytics ? 'granted' : 'denied'
    });
    DL.push({ event: 'cookie_consent_update', analytics_consent: !!c.analytics, ads_consent: !!c.ads });
  }

  function decide(analytics, ads) {
    var rec = { analytics: !!analytics, ads: !!ads, v: 1, ts: new Date().toISOString() };
    write(rec);
    apply(rec);
    hide();
  }

  // Re-apply a previously saved choice on every load (so GTM honours it).
  var saved = read();
  if (saved && typeof saved.analytics !== 'undefined') apply(saved);

  var CSS = [
    '.cac-banner{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:var(--slate,#161616);border-top:2px solid var(--signal,#C8F135);box-shadow:0 -8px 40px rgba(0,0,0,.5);font-family:var(--f-body,system-ui,-apple-system,sans-serif);color:var(--mist2,#cfcfca)}',
    '.cac-inner{max-width:1120px;margin:0 auto;padding:18px 24px;display:flex;gap:22px;align-items:center;flex-wrap:wrap}',
    '.cac-text{flex:1 1 380px;font-size:13.5px;line-height:1.55}',
    '.cac-text b.cac-h{color:var(--bone,#f5f5f0);font-family:var(--f-display,inherit);font-weight:600;display:block;margin-bottom:4px;font-size:14.5px}',
    '.cac-text a{color:var(--signal,#C8F135)}',
    '.cac-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}',
    '.cac-btn{font-family:var(--f-mono,ui-monospace,monospace);font-size:12.5px;font-weight:600;letter-spacing:.02em;padding:11px 18px;border-radius:6px;border:1px solid var(--border,#333);background:transparent;color:var(--bone,#f5f5f0);cursor:pointer;transition:border-color .15s,filter .15s;white-space:nowrap}',
    '.cac-btn:hover{border-color:var(--mist2,#aaa)}',
    '.cac-btn.cac-accept{background:var(--signal,#C8F135);color:#0d0d0d;border-color:var(--signal,#C8F135)}',
    '.cac-btn.cac-accept:hover{filter:brightness(1.06)}',
    '.cac-btn.cac-link{border:none;background:none;text-decoration:underline;padding:11px 6px;color:var(--mist2,#cfcfca)}',
    '.cac-panel{flex-basis:100%;display:none;border-top:1px solid var(--border,#333);margin-top:4px;padding-top:12px}',
    '.cac-banner.cac-show-panel .cac-panel{display:block}',
    '.cac-row{display:flex;align-items:flex-start;gap:12px;padding:8px 0}',
    '.cac-row label{flex:1;font-size:13px;line-height:1.5;cursor:pointer}',
    '.cac-row label b{display:block;color:var(--bone,#f5f5f0);font-size:13px;margin-bottom:2px}',
    '.cac-row input{margin-top:2px;width:17px;height:17px;accent-color:var(--signal,#C8F135);cursor:pointer;flex:0 0 auto}',
    '.cac-row input:disabled{opacity:.5;cursor:not-allowed}',
    '.cac-footer-link{background:none;border:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;padding:0;opacity:.85}',
    '.cac-footer-link:hover{opacity:1;color:var(--signal,#C8F135)}',
    '@media(max-width:680px){.cac-inner{padding:16px;gap:14px}.cac-actions{width:100%}.cac-btn{flex:1 1 auto;text-align:center}.cac-btn.cac-link{flex-basis:100%;order:3}}'
  ].join('');

  var banner, elAnalytics, elAds;

  function build() {
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);

    banner = document.createElement('div');
    banner.className = 'cac-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<div class="cac-inner">' +
        '<div class="cac-text"><b class="cac-h">We value your privacy</b>' +
        'We use cookies for analytics and, optionally, to measure advertising — so we can improve the site. ' +
        'Strictly necessary cookies are always on. Accept all, reject non-essential, or choose what to allow.</div>' +
        '<div class="cac-actions">' +
          '<button type="button" class="cac-btn cac-link" data-act="customize">Customize</button>' +
          '<button type="button" class="cac-btn" data-act="reject">Reject non-essential</button>' +
          '<button type="button" class="cac-btn cac-accept" data-act="accept">Accept all</button>' +
        '</div>' +
        '<div class="cac-panel">' +
          '<div class="cac-row"><input type="checkbox" id="cac-nec" checked disabled>' +
            '<label for="cac-nec"><b>Strictly necessary</b>Required for the site to work (security, your preferences). Always active.</label></div>' +
          '<div class="cac-row"><input type="checkbox" id="cac-analytics">' +
            '<label for="cac-analytics"><b>Analytics</b>Helps us understand how the site is used so we can improve it.</label></div>' +
          '<div class="cac-row"><input type="checkbox" id="cac-ads">' +
            '<label for="cac-ads"><b>Advertising</b>Measures ad performance and personalization.</label></div>' +
          '<div class="cac-actions" style="margin-top:8px;justify-content:flex-end">' +
            '<button type="button" class="cac-btn cac-accept" data-act="save">Save choices</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    elAnalytics = banner.querySelector('#cac-analytics');
    elAds = banner.querySelector('#cac-ads');

    banner.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (!act) return;
      if (act === 'accept') decide(true, true);
      else if (act === 'reject') decide(false, false);
      else if (act === 'customize') banner.classList.toggle('cac-show-panel');
      else if (act === 'save') decide(elAnalytics.checked, elAds.checked);
    });
  }

  function show(openPanel, focusFirst) {
    if (!banner) build();
    var cur = read();
    elAnalytics.checked = cur ? !!cur.analytics : false;
    elAds.checked = cur ? !!cur.ads : false;
    banner.style.display = '';
    banner.classList.toggle('cac-show-panel', !!openPanel);
    // Focus only on user-initiated opens — autofocusing the auto-shown banner
    // during page load made browsers scroll to the bottom of the document
    // (the banner sits at the end of the DOM) and steals focus from the page.
    if (focusFirst) {
      var f = banner.querySelector('.cac-accept');
      if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
    }
  }
  function hide() { if (banner) banner.style.display = 'none'; }

  // Public API for the footer "Cookie settings" link.
  window.caConsent = { open: function () { show(true, true); }, reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} } };

  function injectFooterLink() {
    if (document.querySelector('.cac-footer-link')) return;
    var host = document.querySelector('.footer-copy') || document.querySelector('.footer-bottom') || document.querySelector('.site-footer .footer-inner');
    if (!host) return;
    var sep = document.createTextNode(' · ');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cac-footer-link';
    btn.textContent = 'Cookie settings';
    btn.addEventListener('click', function () { show(true, true); });
    host.appendChild(sep);
    host.appendChild(btn);
  }

  function init() {
    injectFooterLink();
    if (!saved || typeof saved.analytics === 'undefined') show(false); // first visit → banner
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

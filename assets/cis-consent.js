(function () {
  'use strict';

  var STORAGE_KEY = 'cis_cookie_consent_v1';
  var GA_ID = 'G-BPRSKDJ26';

  function readConsent() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function writeConsent(level) {
    var value = {
      level: level,
      version: 'CIS-COOKIES-2026-07-30-v1',
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {}
    updateStatus();
    if (level === 'analytics') loadAnalytics();
    hideBanner();
  }

  function loadAnalytics() {
    if (window.__cisAnalyticsLoaded) return;
    window.__cisAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
  }

  function updateStatus() {
    var status = document.getElementById('consent-status');
    if (!status) return;
    var consent = readConsent();
    if (!consent) {
      status.textContent = 'No hay una elección guardada.';
      return;
    }
    status.textContent = consent.level === 'analytics'
      ? 'Analítica aceptada. Puedes cambiar esta elección en cualquier momento.'
      : 'Solo cookies necesarias. La analítica permanece desactivada.';
  }

  function hideBanner() {
    var banner = document.getElementById('cis-cookie-banner');
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    if (document.getElementById('cis-cookie-banner')) return;

    var banner = document.createElement('section');
    banner.id = 'cis-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Preferencias de cookies');
    banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:720px;margin:auto;background:#071a2e;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:18px;box-shadow:0 22px 70px rgba(0,0,0,.35);font:14px/1.5 Inter,system-ui,sans-serif';
    banner.innerHTML =
      '<strong style="display:block;font-size:17px;margin-bottom:6px">Tu privacidad primero</strong>' +
      '<p style="margin:0 0 13px;color:#dce8f2">Usamos funciones necesarias para operar el sitio. La analítica se activa solo con tu autorización y no es necesaria para reservar o pagar. <a href="/cookies.html" style="color:#f0c56b;font-weight:700">Conoce más</a>.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button type="button" data-cis-consent="necessary" style="border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer">Solo necesarias</button>' +
      '<button type="button" data-cis-consent="analytics" style="border:0;background:#e4b64f;color:#17202b;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer">Aceptar analítica</button>' +
      '</div>';
    document.body.appendChild(banner);
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-cis-consent]');
    if (!button) return;
    var action = button.getAttribute('data-cis-consent');
    if (action === 'reset') {
      try { localStorage.removeItem(STORAGE_KEY); } catch (error) {}
      window.__cisAnalyticsLoaded = false;
      updateStatus();
      showBanner();
      return;
    }
    if (action === 'analytics' || action === 'necessary') writeConsent(action);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var consent = readConsent();
    if (consent && consent.level === 'analytics') loadAnalytics();
    if (!consent) showBanner();
    updateStatus();
  });
})();

/*
 * Climatización HD · tracking.js
 * Va en la raíz del sitio (/tracking.js) y se carga con defer ANTES de app.js.
 *
 * Hace tres cosas:
 *  1. Guarda el gclid y los UTM de la URL durante 90 días.
 *  2. Se los pasa al formulario de GHL (iframe), para que el lead quede
 *     asociado al clic de Google Ads.
 *  3. Manda a GA4 el evento BL_GA4.Click_Whatsapp en cada clic a WhatsApp.
 *
 * Los nombres de los eventos son los mismos que usaba la web anterior.
 * No hay que cambiarlos: Google Ads los importa con esos nombres exactos.
 */
(function () {
  var EV_WHATSAPP = 'BL_GA4.Click_Whatsapp';
  var PARAMS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var KEY = 'hd_attr';
  var DIAS = 90;
 
  // 1. Guardar gclid / UTM
  var attr = {};
  try { attr = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  if (attr._ts && Date.now() - attr._ts > DIAS * 864e5) attr = {};
 
  var qs = new URLSearchParams(location.search);
  var nuevos = PARAMS.filter(function (k) { return qs.get(k); });
  if (nuevos.length) {
    attr = { _ts: Date.now() };
    nuevos.forEach(function (k) { attr[k] = qs.get(k); });
    try { localStorage.setItem(KEY, JSON.stringify(attr)); } catch (e) {}
  }
 
  // 2. Agregarlos a la URL del formulario de GHL
  function conAtribucion(url) {
    try {
      var u = new URL(url, location.href);
      PARAMS.forEach(function (k) {
        if (attr[k] && !u.searchParams.has(k)) u.searchParams.set(k, attr[k]);
      });
      return u.toString();
    } catch (e) { return url; }
  }
 
  function prepararFormularios() {
    var sel = 'iframe[data-form-id], iframe[data-src*="leadconnectorhq.com/widget/form"], iframe[src*="leadconnectorhq.com/widget/form"]';
    document.querySelectorAll(sel).forEach(function (f) {
      var ds = f.getAttribute('data-src');
      if (ds) f.setAttribute('data-src', conAtribucion(ds));
      var s = f.getAttribute('src');
      if (s && s.indexOf('leadconnectorhq.com') > -1) {
        var n = conAtribucion(s);
        if (n !== s) f.setAttribute('src', n);
      }
    });
  }
  prepararFormularios();
  document.addEventListener('DOMContentLoaded', prepararFormularios);
 
  // 3. Clic a WhatsApp
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href^="whatsapp:"]');
    if (!a || typeof window.gtag !== 'function') return;
    window.gtag('event', EV_WHATSAPP, {
      link_url: a.href.split('?')[0],
      link_text: (a.innerText || '').trim().slice(0, 100),
      transport_type: 'beacon'
    });
  }, true);
})();

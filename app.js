/* Climatización HD · web */
(() => {
const WA = '5491135070888'; // número del CRM (único para todos los puntos de entrada, reunión 09-10)
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const waUrl = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

/* ---------- WhatsApp ---------- */
function wireWa(root = document) {
  $$('.wa-link', root).forEach(a => { a.href = waUrl(a.dataset.msg || 'Hola'); a.target = '_blank'; a.rel = 'noopener'; });
}
wireWa();

/* ---------- Barra superior y dock ---------- */
const top = $('#top'), dock = $('#dock'), hero = $('#inicio'), formSec = $('#presupuesto');
let formVisible = false;
new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; onScroll(); }, { threshold: .15 }).observe(formSec);
function onScroll() {
  const y = scrollY;
  top.classList.toggle('solid', y > 40);
  dock.classList.toggle('show', y > hero.offsetHeight * .7 && !formVisible);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* Menú desplegable en celular */
const burger = $('#burger');
const setMenu = open => { top.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Cerrar el menú' : 'Abrir el menú'); };
burger.addEventListener('click', () => setMenu(!top.classList.contains('open')));
$$('#topNav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ---------- Plano interactivo ---------- */
const sys = $('#sysLayer'), heat = $('#heatLayer'), tags = $('#tags');
const tempVal = $('#tempVal'), tempLbl = $('#tempLbl'), tempBox = $('.plano-temp'), foot = $('#planoFoot');
const ROOMS = {
  dorm1: [28, 50, 212, 142], living: [228, 50, 392, 122], cocina: [28, 180, 212, 272],
  dorm2: [228, 160, 392, 194], dorm2b: [228, 204, 294, 272], bano: [306, 228, 392, 272]
};
const COLECTOR = [196, 146];
const FOOT = {
  piso: 'Cada circuito sale de un balance térmico hecho sobre tu plano: separación de la serpentina, potencia de la caldera y ubicación de los colectores.',
  rad: 'Cada ambiente con sus radiadores según balance térmico y diseño.',
  aire: 'Dejamos la pre-instalación hecha durante la obra: cañerías, desagües y ubicación de unidades interiores y exteriores.'
};
let tempTimer, cycleTimer, userPicked = false, current = 'piso';

// Espiral doble (ida y vuelta) como en el plano de HD: entra por el borde, gira hasta el centro y sale entre medio.
function spiralPts([l, t, r, b], d) {
  const p = [[l, t]];
  while (r - l > d && b - t > d) {
    p.push([r, t], [r, b], [l, b], [l, t + d]);
    t += d; l += d; r -= d; b -= d;
  }
  return p;
}
function spiral([x0, y0, x1, y1], g) {
  const a = spiralPts([x0, y0, x1, y1], g * 2), b = spiralPts([x0 + g, y0 + g, x1 - g, y1 - g], g * 2).reverse();
  return 'M' + a.concat(b).map(q => q.join(' ')).join(' L');
}
function animateTemp(from, to, ms, color, label) {
  clearInterval(tempTimer);
  tempLbl.textContent = label; tempBox.style.color = color;
  if (RM) { tempVal.textContent = to; return; }
  let t0 = performance.now();
  tempVal.textContent = from;
  tempTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    tempVal.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k >= 1) clearInterval(tempTimer);
  }, 60);
}
function tag(x, y, text, delay = 0) {
  const g = el('g', { opacity: RM ? 1 : 0, style: `transition:opacity .5s ${delay}ms` }, tags);
  const w = text.length * 5.1 + 16;
  el('rect', { x: x, y: y - 10, width: w, height: 17, rx: 8.5, class: 'tag-bg' }, g);
  el('text', { x: x + 8, y: y + 2, class: 'tag-tx' }, g).textContent = text;
  requestAnimationFrame(() => requestAnimationFrame(() => g.setAttribute('opacity', 1)));
}
function drawPath(d, stroke, width, delay, dur = 1100) {
  const p = el('path', { d, class: 'pipe', stroke, 'stroke-width': width }, sys);
  if (RM) return p;
  const L = p.getTotalLength();
  p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
  p.getBoundingClientRect();
  p.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.6,.1,.3,1) ${delay}ms`;
  p.style.strokeDashoffset = 0;
  return p;
}
function glow(cx, cy, rx, ry, fill, delay) {
  const e = el('ellipse', { cx, cy, rx, ry, fill, opacity: RM ? .9 : 0, style: `transition:opacity 1.6s ease ${delay}ms` }, heat);
  requestAnimationFrame(() => requestAnimationFrame(() => e.setAttribute('opacity', .9)));
}
function clearPlano() { sys.replaceChildren(); heat.replaceChildren(); tags.replaceChildren(); }

const CIRC = { dorm1: ['#ff6b6b', 20], cocina: ['#6b8cff', 15], living: ['#7ee081', 15], dorm2: ['#e06bdc', 20], dorm2b: ['#5fd6e6', 20], bano: ['#f5c542', 10] };
function renderPiso() {
  const order = ['dorm1', 'cocina', 'living', 'dorm2', 'dorm2b', 'bano'];
  el('rect', { x: COLECTOR[0] - 8, y: COLECTOR[1] - 6, width: 16, height: 12, rx: 2, fill: '#89bc6f' }, sys);
  el('rect', { x: 36, y: 248, width: 18, height: 22, rx: 3, fill: '#e8eef8' }, sys);
  order.forEach((k, i) => {
    const r = ROOMS[k], delay = 250 + i * 380;
    const [col, sep] = CIRC[k];
    const start = k === 'bano' ? `M${COLECTOR[0]} ${COLECTOR[1]} H300 V${r[1]} H${r[0]}` : `M${COLECTOR[0]} ${COLECTOR[1]} H${r[0]} V${r[1]}`;
    drawPath(start, col, 1.2, delay, 500);
    const p = drawPath(spiral(r, sep / 3.4), col, 1.3, delay + 300, 1800);
    const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2, lb = `${i + 1} · c/${sep}`, w = lb.length * 4.9 + 10;
    const g = el('g', { opacity: RM ? 1 : 0, style: `transition:opacity .5s ${delay + 1500}ms` }, tags);
    el('rect', { x: cx - w / 2, y: cy - 7, width: w, height: 13, rx: 3, class: 'circ-bg', stroke: col, 'stroke-width': 1 }, g);
    el('text', { x: cx, y: cy + 2.5, 'text-anchor': 'middle', class: 'circ-tx' }, g).textContent = lb;
    requestAnimationFrame(() => requestAnimationFrame(() => g.setAttribute('opacity', 1)));
    if (!RM) setTimeout(() => { const f = p.cloneNode(); f.removeAttribute('style'); f.setAttribute('stroke', 'rgba(255,255,255,.55)'); f.setAttribute('stroke-width', 1.2); f.classList.add('flow'); sys.appendChild(f); }, delay + 1900);
    glow((r[0] + r[2]) / 2, (r[1] + r[3]) / 2, (r[2] - r[0]) / 1.6, (r[3] - r[1]) / 1.4, 'url(#gWarm)', delay + 900);
  });
  tag(150, 128, 'Colector', 300);
  tag(58, 262, 'Caldera bajo consumo', 900);
  animateTemp(12, 22, 3600, '#ffb27a', 'piso radiante');
}
function renderRad() {
  const R = [[72, 54, 50, 6], [268, 54, 70, 6], [34, 64, 6, 42, 'v'], [80, 266, 70, 6], [382, 56, 6, 40, 'v'], [240, 154, 44, 6], [336, 266, 34, 6, 't']];
  el('rect', { x: 36, y: 248, width: 18, height: 22, rx: 3, fill: '#e8eef8' }, sys);
  drawPath('M45 248 V200 H215 V150 H225 V60 M215 150 V58 H120 M45 200 V110 M150 200 V266 M225 150 H300 V266 M300 150 H385 V96', 'rgba(255,140,80,.55)', 1.6, 200, 1800);
  R.forEach(([x, y, w, h, t], i) => {
    const delay = 800 + i * 220;
    const r = el('rect', { x, y, width: w, height: h, rx: 1.5, fill: '#fff', opacity: RM ? 1 : 0, style: `transition:opacity .4s ${delay}ms` }, sys);
    requestAnimationFrame(() => requestAnimationFrame(() => r.setAttribute('opacity', 1)));
    for (let j = 0; j < (t === 'v' ? 3 : Math.max(2, Math.round(w / 20))); j++) {
      const cx = t === 'v' ? (x < 100 ? x + 16 : x - 10) : x + 8 + j * ((w - 16) / Math.max(1, Math.round(w / 20) - 1));
      const cy = t === 'v' ? y + 8 + j * 14 : (y < 100 ? y + 18 : y - 8);
      const wv = el('path', { d: t === 'v' ? `M${cx} ${cy} q4 -4 0 -8 q-4 -4 0 -8` : `M${cx} ${cy} q-4 -4 0 -8 q4 -4 0 -8`, fill: 'none', stroke: '#ffb27a', 'stroke-width': 1.4, 'stroke-linecap': 'round', class: RM ? '' : 'wave', style: `animation-delay:${delay + j * 300}ms` }, sys);
      if (y < 100 && t !== 'v') wv.setAttribute('transform', `rotate(180 ${cx} ${cy})`);
    }
    glow(x + w / 2, y + h / 2, Math.max(w, 30) * .9, 34, 'url(#gWarm)', delay + 200);
  });
  tag(58, 262, 'Caldera Eco Nova', 600);
  tag(236, 112, 'Termostato WiFi', 2000);
  tag(300, 250, 'Toallero', 2300);
  animateTemp(12, 21, 3000, '#ffb27a', 'radiadores');
}
function renderAire() {
  const U = [[84, 30, 52], [282, 30, 60], [238, 138, 46], [40, 160, 50]];
  drawPath('M110 26 V20 M312 26 V20 M261 136 V130 M65 158 V150', 'rgba(127,211,255,.6)', 1.6, 100, 600);
  U.forEach(([x, y, w], i) => {
    const delay = 300 + i * 350;
    const u = el('rect', { x, y, width: w, height: 9, rx: 4, fill: '#fff', opacity: RM ? 1 : 0, style: `transition:opacity .4s ${delay}ms` }, sys);
    requestAnimationFrame(() => requestAnimationFrame(() => u.setAttribute('opacity', 1)));
    if (!RM) for (let j = 0; j < 7; j++) {
      const c = el('circle', { cx: x + 6 + Math.random() * (w - 12), cy: y + 12, r: 1.6 + Math.random() * 1.4, fill: '#7fd3ff', class: 'breeze', style: `--dx:${(Math.random() - .5) * 40}px;--dy:${40 + Math.random() * 40}px;animation-delay:${delay + j * 300}ms;animation-duration:${2 + Math.random()}s` }, sys);
    }
    glow(x + w / 2, y + 40, w * 1.3, 52, 'url(#gCool)', delay + 300);
  });
  tag(150, 76, 'Inverter frío / calor', 900);
  tag(230, 112, 'Pre-instalación en obra', 1500);
  animateTemp(31, 24, 3000, '#9fdcff', 'aire acondicionado');
}
function render(s) {
  current = s;
  $$('.plano-tabs button').forEach(b => { const on = b.dataset.sys === s; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  clearPlano(); foot.textContent = FOOT[s];
  ({ piso: renderPiso, rad: renderRad, aire: renderAire })[s]();
}
$$('.plano-tabs button').forEach(b => b.addEventListener('click', () => { userPicked = true; clearInterval(cycleTimer); render(b.dataset.sys); }));
let planoStarted = false;
new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !planoStarted) {
    planoStarted = true; render('piso');
    if (!RM) cycleTimer = setInterval(() => { if (userPicked) return; const n = { piso: 'rad', rad: 'aire', aire: 'piso' }[current]; render(n); }, 8000);
  }
}, { threshold: .3 }).observe($('#plano'));

/* ---------- Perfiles ---------- */
$$('.perfil-btn').forEach(b => b.addEventListener('click', () => {
  $$('.perfil-btn').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
  $$('.perfil-panel').forEach(p => p.classList.toggle('on', p.dataset.perfil === b.dataset.perfil));
}));

/* ---------- Pasos ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { threshold: .5, rootMargin: '0px 0px -10% 0px' });
$$('.pasos li').forEach((li, i) => { li.style.transitionDelay = `${(i % 3) * 120}ms`; io.observe(li); });

/* ---------- Sistemas (el contenido está en el HTML; acá sólo las pestañas) ---------- */
const sisTabs = $('#sisTabs');
$$('button', sisTabs).forEach(b => b.addEventListener('click', () => {
  $$('button', sisTabs).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
  $$('.sis-panel').forEach(p => {
    const on = p.dataset.id === b.dataset.id;
    p.classList.toggle('on', on);
    if (on && !RM) { p.classList.remove('anim'); void p.offsetWidth; p.classList.add('anim'); }
  });
}));

/* ---------- Barrios (la lista está en el HTML; acá el buscador y los filtros) ---------- */
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
const nube = $('#nube'), res = $('#barrioRes'), input = $('#barrioInput'), zt = $('#zonaTabs');
const chips = $$('span', nube);
const zBtns = $$('button', zt);
zBtns.forEach(b => b.addEventListener('click', () => {
  const z = b.dataset.z;
  zBtns.forEach(x => x.classList.toggle('on', x === b)); input.value = ''; res.replaceChildren(); nube.classList.toggle('filtra', z !== 'Todas');
  chips.forEach(c => { c.classList.remove('hot'); c.classList.toggle('dim', z !== 'Todas' && c.dataset.z !== z); if (z !== 'Todas' && c.dataset.z === z) c.classList.add('hot'); c.style.order = c.classList.contains('hot') ? -1 : ''; });
}));
function resCard(ok, text, msg) {
  const card = document.createElement('div'); card.className = 'res-card' + (ok ? '' : ' no');
  const p = document.createElement('p');
  if (ok) { p.append('Sí, tenemos obras en '); const b = document.createElement('b'); b.textContent = text.name; p.append(b, `${text.more}. Pedinos referencias de trabajos cerca tuyo.`); }
  else p.textContent = 'Todavía no tenemos una obra cargada ahí, pero cubrimos GBA, CABA, Costa e interior.';
  const a = document.createElement('a'); a.className = 'btn btn-wa btn-sm wa-link'; a.dataset.msg = msg; a.href = '#';
  const ico = document.createElementNS(NS, 'svg'); ico.setAttribute('class', 'ico'); ico.setAttribute('aria-hidden', 'true');
  el('use', { href: '#i-wa' }, ico); a.append(ico, 'Consultar');
  card.append(p, a);
  if (ok && text.hits) card.append(...lotesDe(text.hits));
  res.replaceChildren(card); wireWa(res);
}
/* Lotes con obra de cada barrio: data-l="Sector=1, 2|=3" (sector vacío = lotes sin sector). Nunca nombres de clientes. */
function lotesDe(hits) {
  const conLotes = hits.filter(c => c.dataset.l).slice(0, 3);
  return conLotes.map(c => {
    const box = document.createElement('div'); box.className = 'res-lotes';
    if (hits.length > 1) { const h = document.createElement('b'); h.textContent = c.textContent; box.append(h); }
    const ul = document.createElement('ul');
    c.dataset.l.split('|').forEach(g => {
      const [sec, ls] = g.split('='), li = document.createElement('li');
      const pal = ls.includes(',') || ls.includes(' y ') ? 'Lotes ' : 'Lote ';
      if (sec) { const s = document.createElement('span'); s.textContent = sec; li.append(s, ': ' + pal.toLowerCase() + ls); }
      else li.textContent = pal + ls;
      ul.append(li);
    });
    box.append(ul); return box;
  });
}
function search() {
  const q = norm(input.value);
  zBtns.forEach((x, i) => x.classList.toggle('on', i === 0));
  nube.classList.toggle('filtra', q.length >= 3);
  if (q.length < 3) { res.replaceChildren(); chips.forEach(c => { c.classList.remove('hot', 'dim'); c.style.order = ''; }); return; }
  const hits = chips.filter(c => c.dataset.n.includes(q));
  chips.forEach(c => { const h = hits.includes(c); c.classList.toggle('hot', h); c.classList.toggle('dim', !h); c.style.order = h ? -1 : ''; });
  if (hits.length) {
    const name = hits[0].textContent, more = hits.length > 1 ? ` y ${hits.length - 1} más` : '';
    resCard(true, { name, more, hits }, `Hola, tengo una obra en ${name} y quiero cotizar la climatización.`);
  } else {
    resCard(false, null, `Hola, tengo una obra en ${input.value.trim()} y quiero cotizar la climatización.`);
  }
}
input.addEventListener('input', search);
if (!RM) setInterval(() => {
  if (input.value || !zBtns[0].classList.contains('on')) return;
  const c = chips[Math.floor(Math.random() * chips.length)];
  c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
}, 650);

/* Obras y productos: ahora están en el HTML (SEO, 20-10). */

/* ---------- Galería: al tocar una foto se ve en grande ---------- */
const visor = $('#visor'), vImg = $('img', visor), vCap = $('figcaption', visor), obras = $$('#obrasGrid .obra');
let vi = 0, lastFocus;
function verFoto(i) {
  vi = (i + obras.length) % obras.length;
  const img = $('img', obras[vi]), cap = $('figcaption', obras[vi]);
  vImg.src = img.currentSrc || img.src; vImg.alt = img.alt;
  vCap.textContent = cap ? [...cap.childNodes].map(n => n.textContent.trim()).filter(Boolean).join(' · ') : img.alt;
}
function abrirVisor(i) { lastFocus = document.activeElement; verFoto(i); visor.hidden = false; document.body.style.overflow = 'hidden'; $('.visor-x', visor).focus(); }
function cerrarVisor() { visor.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
obras.forEach((o, i) => { o.tabIndex = 0; o.setAttribute('role', 'button'); o.addEventListener('click', () => abrirVisor(i)); o.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirVisor(i); } }); });
$('.visor-x', visor).addEventListener('click', cerrarVisor);
$('.visor-prev', visor).addEventListener('click', () => verFoto(vi - 1));
$('.visor-next', visor).addEventListener('click', () => verFoto(vi + 1));
visor.addEventListener('click', e => { if (e.target === visor) cerrarVisor(); });
addEventListener('keydown', e => { if (visor.hidden) return; if (e.key === 'Escape') cerrarVisor(); if (e.key === 'ArrowLeft') verFoto(vi - 1); if (e.key === 'ArrowRight') verFoto(vi + 1); });
let tx = null;
visor.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
visor.addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) verFoto(vi + (dx < 0 ? 1 : -1)); tx = null; });

/* ---------- Formulario de GHL: se carga cuando el usuario se acerca (pesa ~3,5 MB) ---------- */
const ghl = $('iframe[data-src]');
if (ghl) {
  const cargar = () => {
    if (ghl.src) return;
    ghl.src = ghl.dataset.src;
    const sc = document.createElement('script'); sc.src = 'https://link.msgsndr.com/js/form_embed.js'; document.body.appendChild(sc);
  };
  if ('IntersectionObserver' in window) {
    const fio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { cargar(); fio.disconnect(); } }, { rootMargin: '1200px 0px' });
    fio.observe(formSec);
  } else cargar();
  if (location.hash === '#presupuesto') cargar();
}

/* ---------- Formulario ----------
   V0 (19-10): el formulario es el de GHL embebido en index.html (HD · Pedí tu presupuesto),
   así cada consulta entra al CRM con su tipo y arranca HD 03. El viejo armaba un WhatsApp. */
})();

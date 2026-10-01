'use strict';
const $ = s => document.querySelector(s);
const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let titles = [], tab = 'home', msg = 'El servicio de Xuper aún no está conectado.';
let fav = new Set(ls('fav', [])), prog = ls('prog', {}), url = ls('catalogURL', '');
const TABS = [['home', 'Inicio'], ['movie', 'Películas'], ['series', 'Series'], ['live', 'TV'], ['fav', 'Favoritos'], ['set', 'Ajustes']];
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
function trusted(t) {
  try { const u = new URL(t); return u.protocol === 'https:' && !u.username && !u.password && u.host ? u : null; } catch { return null; }
}
async function load() {
  const u = trusted((url || '').trim());
  if (!u) { msg = 'Introduce la URL HTTPS de un catálogo con acceso documentado.'; return render(); }
  url = u.href; sv('catalogURL', url); msg = 'Conectando…'; render();
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw 1;
    const t = await r.text();
    if (t.length > 1048576) throw 1;
    const c = JSON.parse(t);
    if (c.schemaVersion !== 1 || !Array.isArray(c.titles) || c.titles.length > 5000 ||
        new Set(c.titles.map(x => x.id)).size !== c.titles.length ||
        !c.titles.every(x => x.id && x.title && ['movie', 'series', 'live'].includes(x.kind))) throw 2;
    titles = c.titles; msg = titles.length ? '' : 'El proveedor no devolvió títulos.';
  } catch { msg = 'No se pudo cargar el catálogo. Comprueba la dirección y el acceso al servicio (el servidor debe permitir CORS).'; }
  render();
}
function render() {
  $('#tabs').innerHTML = TABS.map(([k, l]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('');
  const m = $('#main');
  if (tab === 'set') {
    m.innerHTML = `<p class="msg">URL HTTPS de un catálogo JSON (schemaVersion 1) que tengas autorizado a usar. La app no incluye contenido.</p><input id="cu" type="url" value="${esc(url)}" placeholder="https://…"><div class="row"><button id="go">Cargar</button></div><p class="msg">${esc(msg)}</p>`;
    $('#go').onclick = () => { url = $('#cu').value; load(); };
    return;
  }
  const q = $('#q').value.trim().toLowerCase();
  const l = titles.filter(t => (tab === 'home' || tab === 'fav' || t.kind === tab) && (tab !== 'fav' || fav.has(t.id)) && (!q || t.title.toLowerCase().includes(q)));
  m.innerHTML = l.length
    ? `<div class="grid">${l.map(t => `<div class="card" data-id="${esc(t.id)}">${esc(t.title)}<small>${esc(t.year || '')} ${fav.has(t.id) ? '★' : ''}</small></div>`).join('')}</div>`
    : `<p class="msg">${esc(tab === 'fav' ? 'Sin favoritos.' : msg || 'Sin resultados.')}</p>`;
}
function play(id, title, srcs) {
  const p = $('#player'), v = $('#v');
  p.hidden = false; $('#ptitle').textContent = title;
  $('#srcs').innerHTML = srcs.map((s, i) => `<button class="g" data-i="${i}">${esc(s.label)}</button> `).join('');
  const set = i => {
    const u = trusted(srcs[i].url); if (!u) return;
    v.src = u.href;
    v.onloadedmetadata = () => { const s = prog[id]; if (s > 1 && s < v.duration - 5) v.currentTime = s; };
    v.play().catch(() => {});
  };
  $('#srcs').onclick = e => { const i = e.target.dataset.i; if (i != null) set(+i); };
  v.ontimeupdate = () => { prog[id] = v.currentTime; sv('prog', prog); };
  if (srcs.length) set(0);
}
function detail(t) {
  const m = $('#main'), eps = t.episodes || [];
  m.innerHTML = `<div class="row"><button class="g" id="b" aria-label="Volver">‹ Volver</button><button class="g" id="f">${fav.has(t.id) ? '★ Quitar' : '☆ Favorito'}</button></div><h2>${esc(t.title)}</h2><p class="msg">${esc(t.synopsis || '')}</p>` +
    (t.sources && t.sources.length ? '<div class="row"><button id="p">Reproducir</button></div>' : '') +
    eps.map((e, i) => `<div class="card" data-e="${i}" style="margin:8px 0">T${e.season}·E${e.number} ${esc(e.title)}</div>`).join('');
  $('#b').onclick = render;
  $('#f').onclick = () => { fav.has(t.id) ? fav.delete(t.id) : fav.add(t.id); sv('fav', [...fav]); detail(t); };
  if ($('#p')) $('#p').onclick = () => play(t.id, t.title, t.sources);
  m.querySelectorAll('[data-e]').forEach(c => c.onclick = () => { const e = eps[c.dataset.e]; play(t.id + '/' + e.id, e.title, e.sources || []); });
}
$('#tabs').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; render(); scrollTo(0, 0); } };
$('#q').oninput = render;
$('#q').onkeydown = e => { if (e.key === 'Enter') e.target.blur(); };
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#player').hidden) $('#close').click(); });
$('#main').onclick = e => { const c = e.target.closest('[data-id]'); if (c) detail(titles.find(t => t.id === c.dataset.id)); };
$('#close').onclick = () => { $('#v').pause(); $('#v').removeAttribute('src'); $('#player').hidden = true; };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render(); if (url) load();

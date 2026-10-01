'use strict';
const $ = s => document.querySelector(s);
const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let titles = [], tab = 'home', sub = 'fav', msg = 'El servicio de Xuper aún no está conectado.', openList = null;
let fav = new Set(ls('fav', [])), prog = ls('prog', {}), url = ls('catalogURL', '');
let hist = ls('hist', []), lists = ls('lists', []); // hist: {id,tid,title,at,pos,dur}; lists: {id,name,ids[]}
const TABS = [['home', 'Inicio'], ['movie', 'Películas'], ['series', 'Series'], ['live', 'TV'], ['mine', 'Mi lista'], ['set', 'Ajustes']];
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const byId = id => titles.find(t => t.id === id);
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
const card = t => `<div class="card" data-id="${esc(t.id)}">${esc(t.title)}<small>${esc(t.year || '')} ${fav.has(t.id) ? '★' : ''}</small></div>`;
const grid = l => `<div class="grid">${l.map(card).join('')}</div>`;
const none = t => `<p class="msg">${esc(t)}</p>`;
const pct = h => h.dur > 0 ? Math.min(100, Math.round(h.pos / h.dur * 100)) : 0;
const histCard = h => `<div class="card" data-h="${esc(h.id)}">${esc(h.title)}<small>${new Date(h.at).toLocaleDateString('es')} · ${pct(h)}%</small><div class="bar"><i style="width:${pct(h)}%"></i></div></div>`;
const save = () => { sv('fav', [...fav]); sv('hist', hist); sv('lists', lists); };

function render() {
  $('#tabs').innerHTML = TABS.map(([k, l]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('');
  const m = $('#main'), q = $('#q').value.trim().toLowerCase();
  if (tab === 'set') return settings(m);
  if (tab === 'mine' && !q) return mine(m);
  if (q) {
    const l = titles.filter(t => t.title.toLowerCase().includes(q));
    return m.innerHTML = l.length ? grid(l) : none('Sin resultados.');
  }
  if (tab === 'home') {
    const cont = hist.filter(h => pct(h) > 1 && pct(h) < 95).slice(0, 10);
    m.innerHTML = (cont.length ? `<h2>Continuar viendo</h2><div class="hrow">${cont.map(histCard).join('')}</div>` : '') +
      (titles.length ? `<h2>Todo el catálogo</h2>${grid(titles)}` : (cont.length ? '' : none(msg)));
    return;
  }
  const l = titles.filter(t => t.kind === tab);
  m.innerHTML = l.length ? grid(l) : none(msg || 'Sin resultados.');
}
function mine(m) {
  const seg = [['fav', 'Favoritos'], ['hist', 'Historial'], ['lists', 'Listas']];
  let body = '';
  if (sub === 'fav') { const l = titles.filter(t => fav.has(t.id)); body = l.length ? grid(l) : none('Sin favoritos. Márcalos desde la ficha de un título.'); }
  if (sub === 'hist') body = hist.length ? `<div class="grid">${hist.map(histCard).join('')}</div><div class="row"><button class="g" id="ch">Borrar historial</button></div>` : none('Aún no has reproducido nada.');
  if (sub === 'lists') {
    if (openList) {
      const L = lists.find(x => x.id === openList), l = L ? L.ids.map(byId).filter(Boolean) : [];
      body = `<div class="row"><button class="g" id="lb">‹ Listas</button><button class="g" id="ld">Eliminar lista</button></div><h2>${esc(L ? L.name : '')}</h2>` + (l.length ? grid(l) : none('Lista vacía. Añade títulos desde su ficha.'));
    } else body = (lists.length ? lists.map(x => `<button class="row g" data-l="${esc(x.id)}"><span>${esc(x.name)}</span><span>${x.ids.length} ›</span></button>`).join('') : none('Sin listas.')) +
      `<div class="row"><input id="ln" placeholder="Nombre de la nueva lista" maxlength="60" aria-label="Nombre de lista"><button id="lc">Crear</button></div>`;
  }
  m.innerHTML = `<div class="seg">${seg.map(([k, l]) => `<button data-s="${k}" class="${k === sub ? 'on' : ''}">${l}</button>`).join('')}</div>` + body;
  m.querySelectorAll('[data-s]').forEach(b => b.onclick = e => { e.stopPropagation(); sub = b.dataset.s; openList = null; render(); });
  m.querySelectorAll('[data-l]').forEach(b => b.onclick = e => { e.stopPropagation(); openList = b.dataset.l; render(); });
  const on = (id, f) => { const e = $(id); if (e) e.onclick = ev => { ev.stopPropagation(); f(); }; };
  on('#ch', () => { hist = []; save(); render(); });
  on('#lb', () => { openList = null; render(); });
  on('#ld', () => { lists = lists.filter(x => x.id !== openList); openList = null; save(); render(); });
  on('#lc', () => { const n = $('#ln').value.trim(); if (n) { lists.push({ id: 'l' + Date.now(), name: n, ids: [] }); save(); render(); } });
}
function settings(m) {
  m.innerHTML = `<p class="msg">URL HTTPS de un catálogo JSON (schemaVersion 1) que tengas autorizado a usar. La app no incluye contenido.</p><input id="cu" type="url" value="${esc(url)}" placeholder="https://…" aria-label="URL del catálogo"><div class="row"><button id="go">Cargar</button></div><p class="msg">${esc(msg)}</p>
<h2>Copia de seguridad</h2><p class="msg">Favoritos, historial, listas y progreso. Se guardan solo en este dispositivo.</p><div class="row"><button class="g" id="ex">Exportar</button><button class="g" id="im">Importar</button></div>`;
  $('#go').onclick = () => { url = $('#cu').value; load(); };
  $('#ex').onclick = () => {
    const b = new Blob([JSON.stringify({ v: 1, fav: [...fav], hist, lists, prog })], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = 'xuper-copia.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $('#im').onclick = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.onchange = async () => {
      try {
        const f = i.files[0]; if (!f || f.size > 5e6) return; const d = JSON.parse(await f.text());
        if (d.v !== 1) throw 1;
        fav = new Set((d.fav || []).map(String)); hist = (d.hist || []).slice(0, 200); lists = d.lists || []; prog = d.prog || {}; sv('prog', prog); save(); msg = 'Copia importada.'; render();
      } catch { msg = 'Archivo de copia no válido.'; render(); }
    };
    i.click();
  };
}
function play(id, tid, title, srcs) {
  const rec = () => hist.find(h => h.id === id);
  Player.open(title, srcs, {
    resume: prog[id] || 0,
    onTime: (t, d) => {
      prog[id] = t; let h = rec();
      if (!h) { h = { id, tid, title, at: 0, pos: 0, dur: 0 }; hist.unshift(h); hist = hist.slice(0, 200); }
      h.pos = t; h.dur = d || h.dur; h.at = Date.now();
      if (!play.t) play.t = setTimeout(() => { play.t = 0; sv('prog', prog); sv('hist', hist); }, 3000);
    }
  });
}
function detail(t) {
  const m = $('#main'), eps = t.episodes || [];
  m.innerHTML = `<div class="row"><button class="g" id="b" aria-label="Volver">‹ Volver</button><button class="g" id="f">${fav.has(t.id) ? '★ Quitar' : '☆ Favorito'}</button>${lists.length ? '<button class="g" id="al">＋ Lista</button>' : ''}</div><h2>${esc(t.title)}</h2><p class="msg">${esc([t.year, t.kind === 'movie' ? 'Película' : t.kind === 'series' ? 'Serie' : 'TV en vivo'].filter(Boolean).join(' · '))}<br>${esc(t.synopsis || '')}</p>` +
    (t.sources && t.sources.length ? `<div class="row"><button id="p">${prog[t.id] > 5 ? 'Continuar' : 'Reproducir'}</button></div>` : '') +
    eps.map((e, i) => `<div class="card" data-e="${i}" style="margin:8px 0">T${e.season}·E${e.number} ${esc(e.title)}${prog[t.id + '/' + e.id] > 5 ? ' ▸' : ''}</div>`).join('');
  $('#b').onclick = render;
  $('#f').onclick = () => { fav.has(t.id) ? fav.delete(t.id) : fav.add(t.id); save(); detail(t); };
  if ($('#al')) $('#al').onclick = () => {
    $('#al').outerHTML = lists.map(x => `<button class="g" data-ad="${esc(x.id)}">${x.ids.includes(t.id) ? '✓ ' : ''}${esc(x.name)}</button>`).join('');
    m.querySelectorAll('[data-ad]').forEach(b => b.onclick = () => { const L = lists.find(x => x.id === b.dataset.ad); L.ids = L.ids.includes(t.id) ? L.ids.filter(i => i !== t.id) : [...L.ids, t.id]; save(); detail(t); });
  };
  if ($('#p')) $('#p').onclick = () => play(t.id, t.id, t.title, t.sources);
  m.querySelectorAll('[data-e]').forEach(c => c.onclick = () => { const e = eps[c.dataset.e]; play(t.id + '/' + e.id, t.id, t.title + ' · ' + e.title, e.sources || []); });
}
function resume(hid) {
  const h = hist.find(x => x.id === hid), t = h && byId(h.tid); if (!t) return;
  if (hid === t.id) return play(t.id, t.id, t.title, t.sources || []);
  const e = (t.episodes || []).find(x => t.id + '/' + x.id === hid); if (e) play(hid, t.id, t.title + ' · ' + e.title, e.sources || []);
}
$('#tabs').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; render(); scrollTo(0, 0); } };
$('#q').oninput = render;
$('#q').onkeydown = e => { if (e.key === 'Enter') e.target.blur(); };
$('#main').onclick = e => {
  const h = e.target.closest('[data-h]'); if (h) return resume(h.dataset.h);
  const c = e.target.closest('[data-id]'); if (c) { const t = byId(c.dataset.id); if (t) detail(t); }
};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render(); if (url) load();

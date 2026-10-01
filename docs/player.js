'use strict';
// Reproductor propio: calidad, audio, subtítulos, velocidad, PiP, AirPlay y maximizar (iPhone).
const Player = (() => {
  const $ = s => document.querySelector(s);
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
  const https = t => { try { const u = new URL(t); return u.protocol === 'https:' && !u.username && !u.password && u.host ? u.href : null; } catch { return null; } };
  const fmt = s => { if (!isFinite(s)) return '0:00'; s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  let v, hls, srcs = [], cur = 0, opts = {}, hideT, scrub = false, extTracks = [], page = 'main', max = false, speed = 1, lastTap = 0;

  function build() {
    $('#player').innerHTML = `<video id="v" playsinline webkit-playsinline preload="metadata"></video><div id="spin" hidden></div><div id="perr" hidden></div>
<div id="ctl"><div class="top"><button id="close" aria-label="Cerrar">✕</button><div id="ptitle"></div><button id="pip" class="ic" aria-label="Imagen en imagen" hidden>⧉</button><button id="air" class="ic" aria-label="AirPlay" hidden>⎙</button></div>
<div class="mid"><button id="b10" class="big" aria-label="Retroceder 10 s">⟲10</button><button id="pp" class="big" aria-label="Reproducir o pausar">▶</button><button id="f10" class="big" aria-label="Avanzar 10 s">10⟳</button></div>
<div class="bot"><div class="sk"><span id="tc">0:00</span><input id="seek" type="range" min="0" max="1000" value="0" aria-label="Posición"><span id="td">0:00</span></div>
<div class="bt"><button id="gear" class="ic" aria-label="Ajustes">⚙ Ajustes</button><button id="fs" class="ic" aria-label="Maximizar">⛶</button></div></div></div><div id="menu" hidden></div>`;
    v = $('#v');
    const wake = () => { $('#ctl').classList.add('on'); clearTimeout(hideT); if (!v.paused && $('#menu').hidden) hideT = setTimeout(() => $('#ctl').classList.remove('on'), 3500); };
    $('#player').addEventListener('pointerdown', e => {
      if (e.target.closest('button,input,#menu')) { wake(); return; }
      const now = Date.now(), r = $('#player').getBoundingClientRect(), left = e.clientX < r.left + r.width / 2;
      if (now - lastTap < 300) { v.currentTime = Math.max(0, v.currentTime + (left ? -10 : 10)); lastTap = 0; flash(left ? '−10 s' : '+10 s'); return; }
      lastTap = now;
      if ($('#menu').hidden === false) { $('#menu').hidden = true; return; }
      $('#ctl').classList.contains('on') ? $('#ctl').classList.remove('on') : wake();
    });
    $('#pp').onclick = () => v.paused ? v.play().catch(() => {}) : v.pause();
    $('#b10').onclick = () => { v.currentTime = Math.max(0, v.currentTime - 10); };
    $('#f10').onclick = () => { v.currentTime = Math.min(v.duration || 1e9, v.currentTime + 10); };
    $('#close').onclick = close;
    $('#gear').onclick = () => { page = 'main'; menu(); };
    $('#fs').onclick = toggleMax;
    $('#pip').onclick = () => { try { v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture'); } catch {} };
    $('#air').onclick = () => { try { v.webkitShowPlaybackTargetPicker(); } catch {} };
    if (v.webkitSetPresentationMode && v.webkitSupportsPresentationMode && v.webkitSupportsPresentationMode('picture-in-picture')) $('#pip').hidden = false;
    if (window.WebKitPlaybackTargetAvailabilityEvent) $('#air').hidden = false;
    v.addEventListener('play', () => { $('#pp').textContent = '❚❚'; wake(); });
    v.addEventListener('pause', () => { $('#pp').textContent = '▶'; $('#ctl').classList.add('on'); });
    v.addEventListener('waiting', () => { $('#spin').hidden = false; });
    v.addEventListener('playing', () => { $('#spin').hidden = true; $('#perr').hidden = true; });
    v.addEventListener('canplay', () => { $('#spin').hidden = true; });
    v.addEventListener('error', () => fail('No se pudo reproducir esta fuente. Prueba otra calidad o fuente en Ajustes.'));
    v.addEventListener('loadedmetadata', () => { $('#td').textContent = fmt(v.duration); refreshTracks(); });
    v.addEventListener('timeupdate', () => {
      if (!scrub && v.duration) $('#seek').value = Math.round(v.currentTime / v.duration * 1000);
      $('#tc').textContent = fmt(v.currentTime);
      if (opts.onTime) opts.onTime(v.currentTime, v.duration);
    });
    const seek = $('#seek');
    seek.addEventListener('input', () => { scrub = true; if (v.duration) $('#tc').textContent = fmt(seek.value / 1000 * v.duration); });
    seek.addEventListener('change', () => { if (v.duration) v.currentTime = seek.value / 1000 * v.duration; scrub = false; });
    v.addEventListener('webkitplaybacktargetavailabilitychanged', e => { $('#air').hidden = e.availability !== 'available'; });
    v.addEventListener('webkitendfullscreen', () => wake());
    document.addEventListener('keydown', e => {
      if ($('#player').hidden) return;
      if (e.key === 'Escape') close(); else if (e.key === ' ') { e.preventDefault(); $('#pp').click(); }
      else if (e.key === 'ArrowLeft') $('#b10').click(); else if (e.key === 'ArrowRight') $('#f10').click();
    });
    window.addEventListener('orientationchange', () => setTimeout(wake, 300));
  }

  function flash(t) { const p = $('#perr'); p.textContent = t; p.hidden = false; p.className = 'flash'; clearTimeout(flash.t); flash.t = setTimeout(() => { p.hidden = true; p.className = ''; }, 700); }
  function fail(t) { $('#spin').hidden = true; const p = $('#perr'); p.textContent = t; p.className = ''; p.hidden = false; }

  function toggleMax() {
    max = !max;
    $('#player').classList.toggle('max', max);
    $('#fs').textContent = max ? '⤡' : '⛶';
    try { max ? screen.orientation.lock('landscape').catch(() => {}) : screen.orientation.unlock(); } catch {}
    // Pantalla completa nativa del sistema (iPhone solo la admite sobre el elemento video).
    if (max && v.webkitEnterFullscreen && !document.fullscreenEnabled && opts.native) { try { v.webkitEnterFullscreen(); } catch {} }
    if (document.fullscreenEnabled) { try { max ? $('#player').requestFullscreen().catch(() => {}) : document.fullscreenElement && document.exitFullscreen(); } catch {} }
  }

  function load(i, keepTime) {
    cur = i; const s = srcs[i], url = https(s.url), t = keepTime ? v.currentTime : (opts.resume || 0);
    const wasPlaying = keepTime ? !v.paused : true;
    if (hls) { hls.destroy(); hls = null; }
    v.querySelectorAll('track').forEach(x => x.remove());
    extTracks = [];
    $('#perr').hidden = true;
    if (!url) return fail('Fuente no válida: solo se admiten enlaces HTTPS.');
    $('#spin').hidden = false;
    for (const sub of (s.subtitles || [])) { const u = https(sub.url); if (u) addTrack(sub.label || sub.lang || 'Subtítulos', sub.lang || '', u); }
    const isHls = /\.m3u8(\?|$)/i.test(url) || s.type === 'hls';
    const start = () => { if (t > 1) v.currentTime = t; v.playbackRate = speed; if (wasPlaying) v.play().catch(() => {}); };
    if (isHls && window.Hls && Hls.isSupported()) {
      hls = new Hls({ startPosition: t > 1 ? t : -1, enableWebVTT: true, capLevelToPlayerSize: true });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) fail('Error de red o formato al reproducir. Comprueba la fuente (¿admite CORS?).'); });
      hls.on(Hls.Events.MANIFEST_PARSED, () => { v.playbackRate = speed; if (wasPlaying) v.play().catch(() => {}); refreshTracks(); });
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, refreshTracks);
      hls.loadSource(url); hls.attachMedia(v);
    } else {
      opts.native = true; v.src = url;
      v.addEventListener('loadedmetadata', start, { once: true });
    }
  }
  function addTrack(label, lang, url) {
    const el = document.createElement('track');
    el.kind = 'subtitles'; el.label = label; el.srclang = lang || 'und'; el.src = url; el.crossOrigin = 'anonymous';
    v.appendChild(el); el.track.mode = 'disabled'; extTracks.push(el.track);
  }
  function srtToVtt(t) { return 'WEBVTT\n\n' + t.replace(/\r/g, '').replace(/(\d+:\d\d:\d\d),(\d{3})/g, '$1.$2'); }

  // ---- Menú ----
  function subList() { return extTracks.map(t => ({ label: t.label, lang: t.language, on: t.mode === 'showing', set: () => { extTracks.forEach(x => x.mode = x === t ? 'showing' : 'disabled'); if (hls) hls.subtitleTrack = -1; } }))
    .concat(hls ? hls.subtitleTracks.map((t, i) => ({ label: t.name || t.lang || 'Pista ' + (i + 1), lang: t.lang || '', on: hls.subtitleTrack === i && !extTracks.some(x => x.mode === 'showing'), set: () => { extTracks.forEach(x => x.mode = 'disabled'); hls.subtitleTrack = i; hls.subtitleDisplay = true; } })) : []); }
  function audioList() {
    if (hls) return hls.audioTracks.map((t, i) => ({ label: t.name || t.lang || 'Audio ' + (i + 1), on: hls.audioTrack === i, set: () => { hls.audioTrack = i; } }));
    const a = v.audioTracks; if (!a || a.length < 2) return [];
    return [...a].map((t, i) => ({ label: t.label || t.language || 'Audio ' + (i + 1), on: t.enabled, set: () => { [...a].forEach((x, j) => { x.enabled = j === i; }); } }));
  }
  function qualityList() {
    if (!hls || hls.levels.length < 2) return [];
    const L = hls.levels.map((l, i) => ({ label: (l.height ? l.height + 'p' : Math.round(l.bitrate / 1000) + ' kbps'), i })).sort((a, b) => hls.levels[b.i].bitrate - hls.levels[a.i].bitrate);
    return [{ label: 'Auto', on: hls.autoLevelEnabled, set: () => { hls.currentLevel = -1; } }].concat(L.map(x => ({ label: x.label, on: !hls.autoLevelEnabled && hls.currentLevel === x.i, set: () => { hls.currentLevel = x.i; } })));
  }
  function menu() {
    const m = $('#menu'), rows = [], sub = subList(), aud = audioList(), q = qualityList();
    const cur_ = l => (l.find(x => x.on) || {}).label || '';
    if (page === 'main') {
      if (srcs.length > 1) rows.push(['Fuente', srcs[cur].label, 'src']);
      if (q.length) rows.push(['Calidad', cur_(q), 'q']);
      rows.push(['Subtítulos', cur_(sub) || 'Desactivados', 'sub']);
      if (aud.length) rows.push(['Idioma de audio', cur_(aud), 'aud']);
      rows.push(['Velocidad', speed === 1 ? 'Normal' : speed + '×', 'spd']);
      m.innerHTML = `<h3>Ajustes</h3>` + rows.map(r => `<button class="row g" data-p="${r[2]}"><span>${esc(r[0])}</span><span>${esc(r[1])} ›</span></button>`).join('');
    } else {
      let items = [], extra = '';
      if (page === 'src') items = srcs.map((s, i) => ({ label: s.label, on: i === cur, set: () => load(i, true) }));
      if (page === 'q') items = q;
      if (page === 'aud') items = aud;
      if (page === 'spd') items = SPEEDS.map(s => ({ label: s === 1 ? 'Normal' : s + '×', on: s === speed, set: () => { speed = s; v.playbackRate = s; } }));
      if (page === 'sub') {
        items = [{ label: 'Desactivados', on: !sub.some(x => x.on), set: () => { extTracks.forEach(x => x.mode = 'disabled'); if (hls) hls.subtitleTrack = -1; } }].concat(sub);
        extra = `<button class="row g" id="subfile"><span>Cargar archivo SRT/VTT…</span><span>＋</span></button>`;
      }
      m.innerHTML = `<h3><button class="g" data-p="main" aria-label="Atrás">‹</button> ${{ src: 'Fuente', q: 'Calidad', aud: 'Idioma de audio', spd: 'Velocidad', sub: 'Subtítulos' }[page]}</h3>` +
        items.map((x, i) => `<button class="row ${x.on ? '' : 'g'}" data-i="${i}"><span>${esc(x.label)}</span><span>${x.on ? '✓' : ''}</span></button>`).join('') + extra;
      m.querySelectorAll('[data-i]').forEach(b => b.onclick = e => { e.stopPropagation(); items[+b.dataset.i].set(); page === 'src' ? (m.hidden = true) : menu(); });
      const f = $('#subfile'); if (f) f.onclick = e => { e.stopPropagation(); pickFile(); };
    }
    m.querySelectorAll('[data-p]').forEach(b => b.onclick = e => { e.stopPropagation(); page = b.dataset.p; menu(); });
    m.hidden = false;
  }
  function pickFile() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.srt,.vtt,text/vtt';
    i.onchange = async () => {
      const f = i.files[0]; if (!f || f.size > 2e6) return;
      let t = await f.text(); if (!/^\s*WEBVTT/.test(t)) t = srtToVtt(t);
      addTrack(f.name, '', URL.createObjectURL(new Blob([t], { type: 'text/vtt' })));
      extTracks.forEach((x, k) => x.mode = k === extTracks.length - 1 ? 'showing' : 'disabled'); if (hls) hls.subtitleTrack = -1; menu();
    };
    i.click();
  }
  function refreshTracks() {
    // Subtítulos en español por defecto si existen y el usuario no eligió otro.
    if (extTracks.length && !extTracks.some(x => x.mode === 'showing')) { const es = extTracks.find(x => /^es/i.test(x.language)); if (es) es.mode = 'showing'; }
    if (hls && hls.subtitleTrack < 0 && !extTracks.some(x => x.mode === 'showing')) { const i = hls.subtitleTracks.findIndex(t => /^es/i.test(t.lang || '')); if (i >= 0) hls.subtitleTrack = i; }
    if (hls && hls.audioTracks.length > 1) { const i = hls.audioTracks.findIndex(t => /^es/i.test(t.lang || '')); if (i >= 0 && hls.audioTrack !== i && !refreshTracks.done) { hls.audioTrack = i; refreshTracks.done = 1; } }
  }

  function open(title, sources, o) {
    if (!v) build();
    srcs = sources || []; opts = o || {}; speed = 1; page = 'main'; refreshTracks.done = 0;
    $('#player').hidden = false; $('#ptitle').textContent = title; $('#menu').hidden = true; $('#ctl').classList.add('on');
    document.body.style.overflow = 'hidden';
    if (!srcs.length) return fail('Este título no tiene fuentes.');
    load(0, false);
  }
  function close() {
    try { v.pause(); } catch {}
    if (hls) { hls.destroy(); hls = null; }
    v.removeAttribute('src'); v.load(); v.querySelectorAll('track').forEach(x => x.remove());
    if (max) toggleMax();
    $('#player').hidden = true; document.body.style.overflow = '';
  }
  return { open, close };
})();

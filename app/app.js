/* 芝碼 SesameCode — 前端 UI
 * 依賴 ../src/sesame-core.js（window.Sesame）與 ./i18n.js（window.SesameI18N）
 * 第 8 版：hash 路由、完全掃描器、連結防護、快速配色（含漸層）、收合式進階選項
 */
(function () {
  'use strict';
  const S = window.Sesame;
  const I18N = window.SesameI18N;
  const t = (k, p) => I18N.t(k, p);
  if (!S || !I18N) { alert('缺少 sesame-core.js 或 i18n.js'); return; }

  const $ = (id) => document.getElementById(id);
  const enc = new TextEncoder();
  const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgb2hex = (c) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------------------------------------------- Toast 通知 */
  const TOAST_ICON = {
    ok: 'M5 13l4 4L19 7', err: 'M6 6l12 12M18 6L6 18',
    warn: 'M12 8v5m0 3h.01M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    info: 'M12 8h.01M11 12.5h1V17h1'
  };
  function toast(msg, kind, title) {
    const box = $('toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info');
    const d = TOAST_ICON[kind] || TOAST_ICON.info;
    el.innerHTML = `<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`
      + `<span class="tt">${title ? '<b>' + escapeHtml(title) + '</b><br>' : ''}${escapeHtml(String(msg))}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 3400);
  }
  const setBusy = (on, text) => {
    const el = $('stage-load'); if (!el) return;
    el.classList.toggle('on', !!on);
    if (text) el.querySelector('.txt').textContent = text;
  };

  /* ---------------------------------------------------- 自訂下拉選單
   * 保留原生 <select>（隱藏）作為資料來源與事件來源，畫面由 .sel 呈現。 */
  function initSel(node) {
    const src = document.getElementById(node.dataset.for);
    if (!src) return;
    node.innerHTML = '<button type="button" class="sel-btn" aria-haspopup="listbox" aria-expanded="false">'
      + '<span class="sel-val"></span><i class="arw"></i></button><ul class="sel-list" role="listbox"></ul>';
    const btn = node.querySelector('.sel-btn'), list = node.querySelector('.sel-list'), val = node.querySelector('.sel-val');
    const refresh = () => {
      const opts = Array.from(src.options);
      list.innerHTML = opts.map((o, i) =>
        `<li role="option" data-i="${i}" aria-selected="${o.selected}">${escapeHtml(o.textContent)}</li>`).join('');
      const cur = opts[src.selectedIndex] || opts[0];
      val.textContent = cur ? cur.textContent : '';
    };
    node._refresh = refresh;
    refresh();
    const close = () => { node.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    const pick = (i) => {
      if (i < 0 || i >= src.options.length) return;
      src.selectedIndex = i;
      src.dispatchEvent(new Event('change', { bubbles: true }));
      close();
      btn.focus();
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !node.classList.contains('open');
      document.querySelectorAll('.sel.open').forEach(x => x.classList.remove('open'));
      node.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        pick(src.selectedIndex + (e.key === 'ArrowDown' ? 1 : -1));
      } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.classList.toggle('open'); }
      else if (e.key === 'Escape') close();
    });
    list.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) pick(+li.dataset.i); });
    document.addEventListener('click', close);
    src.addEventListener('change', refresh);
  }
  const refreshSelects = () => document.querySelectorAll('.sel').forEach(n => n._refresh && n._refresh());

  /* ---------------------------------------------------- 語言 + 主題 */
  (function initLang() {
    const sel = $('lang');
    I18N.LANGS.forEach(l => {
      const o = document.createElement('option');
      o.value = l.code; o.textContent = l.label; sel.appendChild(o);
    });
    sel.value = I18N.setLang(I18N.detect());
    document.documentElement.setAttribute('lang', I18N.lang);
    sel.addEventListener('change', () => {
      I18N.setLang(sel.value); fillBands(); buildRingOptions(); renderExamples();
      if (lastGeom) generate(); else updateCapacity();
    });
  })();

  const THEME_KEY = 'sesame.theme';
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
  }
  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));   // 未指定時跟隨系統
    $('btn-theme').addEventListener('click', () => {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  })();

  /* ------------------------------------------------ 色帶 / 背景散佈字
   * 色帶依容器寬度靜態重複至填滿（不做跑馬燈動畫）；背景是三個獨立的單字，各自擺放。 */
  let bandResizeObserver = null;
  function fillBands() {
    const line = String(t('band')).replace(/\s+/g, ' ').trim() + ' ';
    document.querySelectorAll('.band-in').forEach(band => {
      const el = band.querySelector('span');
      if (!el) return;
      el.textContent = line;
      const style = window.getComputedStyle(band);
      const availableWidth = Math.max(0, band.clientWidth
        - (parseFloat(style.paddingLeft) || 0)
        - (parseFloat(style.paddingRight) || 0));
      const lineWidth = el.getBoundingClientRect().width;
      const copies = lineWidth > 0 ? Math.max(1, Math.ceil((availableWidth + 1) / lineWidth)) : 1;
      el.textContent = line.repeat(copies);
    });
    const words = String(t('wm.words')).split('|');
    document.querySelectorAll('.fx .wm').forEach((el, i) => {
      el.textContent = words[i % words.length];
    });
  }
  function observeBandWidths() {
    if (typeof ResizeObserver === 'function') {
      bandResizeObserver = new ResizeObserver(fillBands);
      document.querySelectorAll('.band-in').forEach(band => bandResizeObserver.observe(band));
    } else {
      window.addEventListener('resize', fillBands, { passive: true });
    }
  }

  /* ---------------------------------------------------- 路由（#） */
  const TABS = ['gen', 'scan', 'spec'];
  let curTab = 'gen';
  function setTab(id, scroll) {
    if (!TABS.includes(id)) id = 'gen';
    curTab = id;
    document.querySelectorAll('.tabs .tab').forEach(b => {
      const on = b.dataset.tab === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + id));
    if (id !== 'scan') { stopMainCam(); closeFull(); }
    if (scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'spec') markTocFromHash();
  }
  function parseHash() {
    const raw = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    if (!raw) return { tab: 'gen' };
    if (raw === 'full') return { tab: 'scan', full: true };
    const parts = raw.split('/');
    if (TABS.includes(parts[0])) return { tab: parts[0], sub: parts[1] };
    return { tab: 'gen' };
  }
  function applyHash() {
    const r = parseHash();
    const changed = r.tab !== curTab;
    setTab(r.tab, changed);          // 切換分頁時回到頂端；上一頁／下一頁保留捲動位置
    if (r.full) openFull(); else closeFull();
    if (r.tab === 'spec' && r.sub) {
      const el = $('sec-' + r.sub);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }
  function go(hash) {
    if (location.hash === hash) { applyHash(); return; }
    location.hash = hash;      // 觸發 hashchange，瀏覽器上一頁／下一頁都能用
  }
  document.querySelectorAll('.tabs .tab').forEach(tab =>
    tab.addEventListener('click', () => go('#' + tab.dataset.tab)));
  document.querySelectorAll('[data-tab-link]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); go('#' + a.dataset.tabLink); }));
  window.addEventListener('hashchange', applyHash);

  /* 鍵盤：1/2/3 切換分頁、⌘/Ctrl+↵ 產生、Esc 關閉全螢幕 */
  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag);
    if (e.key === 'Escape' && $('fullscreen').classList.contains('on')) { go('#scan'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generate(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const map = { '1': 'gen', '2': 'scan', '3': 'spec' };
    if (map[e.key]) { e.preventDefault(); go('#' + map[e.key]); }
  });

  /* ---------------------------------------------------- 圈數選單 */
  function buildRingOptions() {
    const sel = $('version');
    const keep = sel.value || '0';
    sel.innerHTML = '<option value="0">' + escapeHtml(t('gen.rings.auto')) + '</option>';
    for (let v = S.GEO.MIN_VERSION; v <= S.GEO.MAX_VERSION; v++) {
      const o = document.createElement('option');
      o.value = String(v);
      o.textContent = t('gen.ringsOpt', { v, cells: S.totalCells(v) });
      sel.appendChild(o);
    }
    sel.value = keep;
    if (!sel.value) sel.value = '0';
    refreshSelects();
  }

  /* ---------------------------------------------------- 配色
   * 快速配色＝固體組合 ＋ 漸層範例（不是另一個控制項）。 */
  const PRESETS = [
    { id: 'classic', ink: '#111111', bg: '#ffffff' },
    { id: 'nte', ink: '#3ea8ff', bg: '#0a0c10' },
    { id: 'alert', ink: '#e2474a', bg: '#140f12' },
    { id: 'sesame', ink: '#6b3b14', bg: '#f7efdd' },
    { id: 'matcha', ink: '#1d4034', bg: '#e3efdc' },
    { id: 'midnight', ink: '#e6b25c', bg: '#16223c' },
    { id: 'blueprint', ink: '#ffffff', bg: '#1d4e89' },
    { id: 'rose', ink: '#7a1f3d', bg: '#fbe8ea' },
    { id: 'g.ntecity', grad: 'ink', from: '#31e1e6', to: '#6c5ce7', angle: 45, bg: '#0a0c10' },
    { id: 'g.neon', grad: 'ink', from: '#ff3f86', to: '#7b2ff7', angle: 35, bg: '#0f0a16' },
    { id: 'g.alert', grad: 'ink', from: '#ffc73f', to: '#ff6a00', angle: 20, bg: '#160f08' },
    { id: 'g.mint', grad: 'ink', from: '#42e8a4', to: '#12b0c9', angle: 60, bg: '#07120f' },
    { id: 'g.ice', grad: 'ink', from: '#9be8ff', to: '#2f7fe0', angle: 75, bg: '#f7fbff' },
    { id: 'g.rose', grad: 'ink', from: '#ffb3c8', to: '#c2185b', angle: 300, bg: '#fff5f7' },
    { id: 'g.deepcity', grad: 'bg', ink: '#f2f4f6', from: '#0b1220', to: '#1b2a44', angle: 90 },
    { id: 'g.mist', grad: 'bg', ink: '#0b2a3a', from: '#eaf4f9', to: '#cfe6f2', angle: 90 },
    { id: 'g.neonfog', grad: 'bg', ink: '#31e1e6', from: '#12203a', to: '#2a1140', angle: 120 },
    { id: 'g.paper', grad: 'bg', ink: '#3a2a1a', from: '#ffffff', to: '#f0e6d2', angle: 90 }
  ];
  const presetLabel = (id) => t(id.indexOf('g.') === 0 ? 'grad.' + id.slice(2) : 'preset.' + id);
  const presetGradient = (p, kind) => {
    if (p.grad === kind) return `linear-gradient(${90 + p.angle}deg,${p.from},${p.to})`;
    return kind === 'ink' ? p.ink : p.bg;
  };

  function styleState() {
    return {
      inkGrad: $('ink-grad').checked,
      ink: $('ink-color').value,
      ink2: $('ink-color2').value,
      inkAngle: +$('ink-angle').value,
      inkAlpha: +$('ink-alpha').value / 100,
      inkCutout: $('ink-cutout').checked,
      bgGrad: $('bg-grad').checked,
      bg: $('bg-color').value,
      bg2: $('bg-color2').value,
      bgAngle: +$('bg-angle').value,
      bgAlpha: +$('bg-alpha').value / 100,
      margin: $('margin') ? +$('margin').value : 2,          // 預設留白 2u
      shape: $('shape').value
    };
  }

  /** 組出 renderCode / toSVG 的樣式參數 */
  function styleOpts(st) {
    st = st || styleState();
    const inkSpec = st.inkGrad
      ? { from: hex2rgb(st.ink), to: hex2rgb(st.ink2), angle: st.inkAngle, alpha: st.inkAlpha, cutout: st.inkCutout }
      : { from: hex2rgb(st.ink), alpha: st.inkAlpha, cutout: st.inkCutout };
    const bgSpec = st.bgGrad
      ? { from: hex2rgb(st.bg), to: hex2rgb(st.bg2), angle: st.bgAngle, alpha: st.bgAlpha }
      : { from: hex2rgb(st.bg), alpha: st.bgAlpha };
    const o = { inkStyle: inkSpec, bgStyle: bgSpec, marginU: st.margin, shape: st.shape };
    if (st.shape === 'label') o.ringText = 'NTE · BAGEL';   // 固定字樣，不隨語系變動
    return o;
  }

  function renderPresets() {
    const box = $('presets');
    box.innerHTML = PRESETS.map(p =>
      `<button class="preset" data-preset="${p.id}" title="${escapeHtml(presetLabel(p.id))}">`
      + `<span class="sw"><i style="background:${presetGradient(p, 'bg')}"></i><i style="background:${presetGradient(p, 'ink')}"></i></span>`
      + `${escapeHtml(presetLabel(p.id))}</button>`).join('');
    box.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
    syncPresetState();
  }
  function syncPresetState() {
    const cur = presetMatch();
    document.querySelectorAll('.preset').forEach(b => b.classList.toggle('active', b.dataset.preset === cur));
  }
  function presetMatch() {
    const st = styleState();
    const p = PRESETS.find(x => {
      if (x.grad === 'ink') return st.inkGrad && !st.bgGrad && st.ink.toLowerCase() === x.from && st.ink2.toLowerCase() === x.to && st.bg.toLowerCase() === x.bg;
      if (x.grad === 'bg') return st.bgGrad && !st.inkGrad && st.bg.toLowerCase() === x.from && st.bg2.toLowerCase() === x.to && st.ink.toLowerCase() === x.ink;
      return !st.inkGrad && !st.bgGrad && st.ink.toLowerCase() === x.ink && st.bg.toLowerCase() === x.bg;
    });
    return p ? p.id : '';
  }

  function applyPreset(id) {
    const p = PRESETS.find(x => x.id === id);
    if (!p) return;
    $('ink-cutout').checked = false;
    $('ink-alpha').value = 100; $('bg-alpha').value = 100;
    if (p.grad === 'ink') {
      $('ink-grad').checked = true; $('bg-grad').checked = false;
      $('ink-color').value = p.from; $('ink-color2').value = p.to; $('ink-angle').value = String(p.angle);
      $('bg-color').value = p.bg; $('bg-color2').value = p.from;
    } else if (p.grad === 'bg') {
      $('bg-grad').checked = true; $('ink-grad').checked = false;
      $('bg-color').value = p.from; $('bg-color2').value = p.to; $('bg-angle').value = String(p.angle);
      $('ink-color').value = p.ink; $('ink-color2').value = p.to;
    } else {
      $('ink-grad').checked = false; $('bg-grad').checked = false;
      $('ink-color').value = p.ink; $('ink-color2').value = p.bg;
      $('bg-color').value = p.bg; $('bg-color2').value = p.ink;
    }
    syncStyleUI(); renderContrast(); generate();
  }

  function syncStyleUI() {
    const inkG = $('ink-grad').checked, bgG = $('bg-grad').checked;
    $('ink-color2-wrap').classList.toggle('hidden', !inkG);
    $('ink-angle-row').classList.toggle('hidden', !inkG);
    $('bg-color2-wrap').classList.toggle('hidden', !bgG);
    $('bg-angle-row').classList.toggle('hidden', !bgG);
    document.querySelectorAll('#ink-grad-seg .segbtn').forEach(b => b.classList.toggle('active', (b.dataset.on === '1') === inkG));
    document.querySelectorAll('#bg-grad-seg .segbtn').forEach(b => b.classList.toggle('active', (b.dataset.on === '1') === bgG));
    $('ink-angle-val').textContent = $('ink-angle').value + '°';
    $('bg-angle-val').textContent = $('bg-angle').value + '°';
    $('ink-alpha-val').textContent = $('ink-alpha').value + '%';
    $('bg-alpha-val').textContent = $('bg-alpha').value + '%';
    if ($('margin-val')) $('margin-val').textContent = (+$('margin').value).toFixed(1).replace(/\.0$/, '') + 'u';
    const shape = $('shape').value;
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.toggle('active', b.dataset.shape === shape));
    syncPresetState();
  }

  /** 對比度提示（標籤用實心底＋深字，確保可讀） */
  function renderContrast() {
    const st = styleState();
    const { inkStyle, bgStyle } = styleOpts(st);
    const c = S.styleContrast(inkStyle, bgStyle);
    const box = $('contrast');
    const inkSw = st.inkGrad ? `linear-gradient(${90 + st.inkAngle}deg, ${st.ink}, ${st.ink2})` : st.ink;
    const bgSw = st.bgGrad ? `linear-gradient(${90 + st.bgAngle}deg, ${st.bg}, ${st.bg2})` : st.bg;
    const ratio = c.ratio >= 20 ? c.ratio.toFixed(1) : c.ratio.toFixed(2);
    let kind = 'ok', msg = t('contrast.ok');
    if (c.cutout) { kind = 'weak'; msg = t('contrast.cutout'); }
    else if (st.bgAlpha === 0) { kind = 'weak'; msg = t('contrast.transparentBg'); }
    else if (st.inkAlpha === 0) { kind = 'bad'; msg = t('contrast.transparentInk'); }
    else if (c.ratio < 1.2) { kind = 'bad'; msg = t('contrast.sameColors'); }
    else if (c.bad) { kind = 'bad'; msg = t('contrast.bad', { ratio }); }
    else if (c.weak) { kind = 'weak'; msg = t('contrast.weak', { ratio }); }
    const transparent = st.bgAlpha < 1;
    box.className = 'contrast ' + kind;
    box.innerHTML =
      `<div class="head"><span class="swatch" style="background:${inkSw}"></span>`
      + `<span class="swatch" style="background:${transparent ? 'transparent' : bgSw};${transparent ? 'background-image:linear-gradient(45deg,#bbb 25%,transparent 25%,transparent 75%,#bbb 75%),linear-gradient(45deg,#bbb 25%,transparent 25%,transparent 75%,#bbb 75%);background-size:10px 10px;background-position:0 0,5px 5px;border-color:var(--line-2)' : ''}"></span>`
      + `<span class="tag">${escapeHtml(t('contrast.label'))} ${ratio}:1</span></div>`
      + `<div class="note">${escapeHtml(msg)}</div>`;
  }

  /* ---------------------------------------------------- 產生器 */
  let lastGeom = null;

  function hexToBytes(str) {
    const clean = str.replace(/0x/gi, '').replace(/[\s,;:_-]/g, '');
    if (clean.length % 2) throw new Error(t('msg.hexEven'));
    if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error(t('msg.hexBad'));
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
    return out;
  }
  function bytesToHex(b) {
    let s = ''; for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0') + (i % 2 ? ' ' : '');
    return s.trim();
  }
  const modeValue = () => (document.querySelector('input[name=mode]:checked') || { value: 'text' }).value;
  function payloadBytes() {
    const raw = $('payload').value;
    return modeValue() === 'hex' ? hexToBytes(raw) : enc.encode(raw);
  }

  function updateCapacity() {
    const ec = +$('ec').value;
    try {
      const bytes = payloadBytes();
      const vSel = +$('version').value;
      const maxR = S.GEO.MAX_VERSION;
      let vAuto = vSel;
      if (!vAuto) {
        vAuto = 0;
        for (let v = S.GEO.MIN_VERSION; v <= maxR; v++) if (S.ecPlan(v, ec).data >= bytes.length) { vAuto = v; break; }
      }
      if (!vAuto) {
        const capMax = S.ecPlan(maxR, ec).data;
        $('cap-info').textContent = t('cap.over', { cap: capMax });
        $('cap-info').className = 'cap bad';
        if ($('adv-info')) { $('adv-info').textContent = t('msg.overCapacity', { bytes: bytes.length, max: maxR, cap: capMax }); $('adv-info').className = 'cap bad'; }
        return;
      }
      const plan = S.ecPlan(vAuto, ec);
      $('cap-info').className = 'cap';
      $('cap-info').textContent = t('cap.compact', { bytes: bytes.length, cap: plan.data });
      if ($('adv-info')) {
        $('adv-info').className = 'cap';
        $('adv-info').textContent = t('msg.capInfo', {
          bytes: bytes.length, rings: vAuto, data: plan.data,
          ec: plan.key, ecBytes: plan.ec, cap: plan.cap, fix: plan.t, cells: S.totalCells(vAuto)
        });
      }
    } catch (e) {
      $('cap-info').textContent = e.message;
      if ($('adv-info')) $('adv-info').textContent = '';
    }
  }

  /* 最近產生（payload × 圈數 × 糾錯），存 localStorage */
  const RECENT_KEY = 'sesame.recent';
  let recent = [];
  try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); if (Array.isArray(r)) recent = r.slice(0, 12); } catch (e) {}
  function pushRecent(g) {
    const key = g.bytes.length + ':' + Array.from(g.bytes.slice(0, 24)).join(',');
    recent = recent.filter(x => x.key !== key);
    recent.unshift({ key, payload: $('payload').value, mode: modeValue(), rings: g.rings, ec: g.ecKey, size: g.bytes.length });
    recent = recent.slice(0, 12);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (e) {}
    renderRecent();
  }
  function renderRecent() {
    const box = $('recent'); if (!box) return;
    if (!recent.length) { box.innerHTML = `<span class="rchip" style="border-style:dashed;color:var(--dim)">${escapeHtml(t('gen.recentEmpty'))}</span>`; return; }
    box.innerHTML = recent.map((x, i) => {
      let label = String(x.payload).replace(/\s+/g, ' ');
      if (label.length > 22) label = label.slice(0, 22) + '…';
      return `<button class="rchip" data-ri="${i}" title="${escapeHtml(x.payload)}">${escapeHtml(label)}<small>${x.rings}R·${x.ec}</small></button>`;
    }).join('');
    box.querySelectorAll('[data-ri]').forEach(b => b.addEventListener('click', () => {
      const x = recent[+b.dataset.ri];
      if (!x) return;
      setMode(x.mode === 'hex' ? 'hex' : 'text');
      $('payload').value = x.payload;
      generate();
      toast(t('toast.recent', { rings: x.rings }), 'info', t('gen.recent'));
    }));
  }

  /** 讀數列：圈數 / 資料 / 容錯 / 尺寸 / 列印 / 掃描難易（人話，不用報像素） */
  function renderReadout(g, st) {
    const px = +$('size').value || +$('size-custom').value;
    const outerU = 2 * S.frameOuter(g.rings);
    const ppu = px / outerU;
    const cm = px * 2.54 / 300;
    const moduleMm = S.GEO.RING_PITCH * ppu * 25.4 / 300;
    const stats = [
      { k: 'readout.rings', v: g.rings, t: t('readout.rings.t') },
      { k: 'readout.payload', v: g.bytes.length + ' B', t: t('readout.payload.t', { data: g.dataBytes, ec: g.ecBytes }) },
      { k: 'readout.ec', v: g.ecKey, t: t('readout.ec.t', { n: g.ecBytes, fix: g.ecBytes }) },
      { k: 'readout.diameter', v: px + ' px', t: t('readout.diameter.t') },
      { k: 'readout.print', v: cm.toFixed(1) + ' cm', cls: moduleMm < 0.3 ? 'warn' : '', t: t('readout.print.t', { mm: moduleMm.toFixed(2) }) },
      { k: 'readout.shape', v: t('style.' + st.shape), t: t('readout.shape.t') }
    ];
    $('readout').innerHTML = stats.map(s2 =>
      `<div class="stat ${s2.cls || ''}" title="${escapeHtml(s2.t)}"><span>${escapeHtml(t(s2.k))}</span><b>${escapeHtml(String(s2.v))}</b></div>`).join('');
    const dense = g.rings >= 12 && ppu < 8;
    const hint = $('dense-hint');
    if (hint) {
      hint.textContent = dense ? t('cap.denseHint', { rings: g.rings }) : '';
      hint.classList.toggle('hidden', !dense);
    }
  }

  function renderToCanvas(geom, st) {
    const target = +$('size').value || +$('size-custom').value;   // 芝碼本身的直徑（不含留白）
    const o = styleOpts(st);
    const ppu = target / (2 * S.frameOuter(geom.rings));
    const img = S.renderCode(geom, Object.assign({ pxPerUnit: ppu }, o));
    const cv = $('canvas');
    cv.width = img.width; cv.height = img.height;
    cv.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
    return img;
  }

  function generate() {
    $('gen-msg').textContent = ''; $('self-msg').textContent = '';
    let bytes;
    try { bytes = payloadBytes(); }
    catch (e) { $('gen-msg').className = 'msg err'; $('gen-msg').textContent = e.message; return; }
    const ec = +$('ec').value, v = +$('version').value;
    const g = S.encode(bytes, { ecLevel: ec, version: v || 0 });
    if (!g.ok) {
      $('gen-msg').className = 'msg err';
      $('gen-msg').textContent = g.error;
      setBusy(false);
      return;
    }
    lastGeom = g;
    const st = styleState();
    renderToCanvas(g, st);
    renderReadout(g, st);
    syncStyleUI();
    renderContrast();
    $('gen-msg').className = 'msg ok';
    $('gen-msg').textContent = t('msg.generated', { rings: g.rings, ec: g.ecKey });
    const L = (k) => t('msg.' + k);
    if ($('geo-info')) $('geo-info').textContent =
      `${L('labelVersion')} ${g.rings}　${L('labelEc')} ${g.ecKey}（${g.ecBytes} bytes）　${L('labelFormat')} ${g.format}\n` +
      `${L('labelDataCap')} ${g.dataBytes} bytes　${L('labelUsed')} ${g.bytes.length} bytes　${L('labelCells')} ${g.totalCells}\n` +
      `${L('labelCode')} [${g.meta.widths.join(' ')}]（${S.GEO.HEADER_DEG / S.GEO.META_MODULES}° × ${S.GEO.META_MODULES} = ${S.GEO.HEADER_DEG}°）　${L('labelIndex')} ${g.meta.index}\n` +
      `${L('labelOuter')} ${S.frameOuter(g.rings).toFixed(1)}u　${L('labelInner')} ${S.GEO.RI}u（${L('labelHole')} ${S.GEO.INNER_RI}u）　${L('labelRatio')} ${(S.frameInner(g.rings) / S.frameOuter(g.rings)).toFixed(3)}\n` +
      `${L('labelRings')} ${Array.from({ length: g.rings }, (_, k) => 'r' + S.ringRadius(k).toFixed(1) + 'u:' + S.ringCells(k)).join('　')}`;
    updateCapacity();
  }

  /* 觸發檔案下載：一定用 Blob URL（不要用 data:）。
   * Chrome / 預覽 iframe 會忽略 <a download> 配上過長的 data: URL，
   * 接著又禁止導向 data:，結果「導出 PNG」看起來完全沒反應。 */
  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  function dataUrlToBlob(dataUrl) {
    const i = dataUrl.indexOf(',');
    if (i < 0) throw new Error('data-url');
    const mime = (dataUrl.slice(0, i).match(/data:([^;,]+)/) || [, 'application/octet-stream'])[1];
    const bin = atob(dataUrl.slice(i + 1));
    const u8 = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) u8[j] = bin.charCodeAt(j);
    return new Blob([u8], { type: mime });
  }
  function pngBlobFromRgba(rgba, w, h) {
    try {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      if (ctx && w > 0 && h > 0) {
        let id;
        try { id = new ImageData(rgba, w, h); }
        catch (e) { id = ctx.createImageData(w, h); id.data.set(rgba); }
        ctx.putImageData(id, 0, 0);
        const du = cv.toDataURL('image/png');
        if (du && du.indexOf('base64,') > 0 && du.length > 64) return dataUrlToBlob(du);
      }
    } catch (e) { /* canvas 路徑失敗就改走純 JS 編碼 */ }
    return new Blob([S.encodePNG(rgba, w, h)], { type: 'image/png' });
  }

  function download(kind) {
    if (!lastGeom) { $('gen-msg').className = 'msg err'; $('gen-msg').textContent = t('gen.needGenerate'); return; }
    const st = styleState();
    const o = styleOpts(st);
    const name = `sesamecode-${lastGeom.rings}r-${lastGeom.ecKey}-${st.shape}`;
    const target = +$('size').value || +$('size-custom').value;
    try {
      if (kind === 'svg') {
        const svg = S.toSVG(lastGeom, Object.assign({ px: target }, o));
        saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), name + '.svg');
      } else {
        const img = S.renderCode(lastGeom, Object.assign({ pxPerUnit: target / (2 * S.frameOuter(lastGeom.rings)) }, o));
        saveBlob(pngBlobFromRgba(img.data, img.width, img.height), name + '.png');
      }
      $('gen-msg').className = 'msg ok';
      $('gen-msg').textContent = t('msg.downloaded', { fmt: kind.toUpperCase() });
      toast(t('toast.saved', { fmt: kind.toUpperCase(), name: name + '.' + kind }), 'ok', t('gen.preview'));
    } catch (err) {
      const msg = t('msg.downloadFail', { err: (err && err.message) ? err.message : String(err) });
      $('gen-msg').className = 'msg err';
      $('gen-msg').textContent = msg;
      toast(msg, 'err', t('gen.output'));
    }
  }

  /* 範例 payload */
  const EXAMPLES = [
    { k: 'ex.greeting', v: '嗨！異環' },
    { k: 'ex.id', v: 'BSG-2026-0417-A' },
    { k: 'ex.url', v: 'https://beiguo.example/p/BSG-2026' },
    { k: 'ex.json', v: '{"唄主":"異象獵人","圈":4}' },
    { k: 'ex.binary', v: '00 ff 12 8a 3c 7d e1 4b', hex: true }
  ];
  function renderExamples() {
    $('examples').innerHTML = EXAMPLES.map((x, i) =>
      `<button class="exbtn" data-ex="${i}">${escapeHtml(t(x.k))}</button>`).join('');
    $('examples').querySelectorAll('.exbtn').forEach(b => b.addEventListener('click', () => {
      const x = EXAMPLES[+b.dataset.ex];
      const wantHex = !!x.hex;
      if (wantHex !== (modeValue() === 'hex')) setMode(wantHex ? 'hex' : 'text');
      $('payload').value = x.v;
      generate();
    }));
  }
  function setMode(mode) {
    document.querySelectorAll('input[name=mode]').forEach(r => { r.checked = r.value === mode; });
    document.querySelectorAll('#mode-seg .segbtn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    $('payload').placeholder = t(mode === 'hex' ? 'gen.placeholderHex' : 'gen.placeholder');
    if (mode === 'hex' && !/^[0-9a-fA-F\s]*$/.test($('payload').value)) $('payload').value = bytesToHex(enc.encode($('payload').value));
    updateCapacity();
  }

  /* ---------------- 表單事件 ---------------- */
  document.querySelectorAll('#mode-seg .segbtn').forEach(b =>
    b.addEventListener('click', () => { setMode(b.dataset.mode); generate(); }));
  $('btn-gen').addEventListener('click', generate);
  $('btn-png').addEventListener('click', () => download('png'));
  $('btn-svg').addEventListener('click', () => download('svg'));
  let autoGen = null;
  $('payload').addEventListener('input', () => {
    updateCapacity();
    clearTimeout(autoGen);
    autoGen = setTimeout(generate, 420);
  });
  ['ec', 'version'].forEach(id => $(id).addEventListener('change', () => { updateCapacity(); if (lastGeom) generate(); }));
  $('size').addEventListener('change', () => {
    $('size-custom-row').classList.toggle('hidden', $('size').value !== 'custom');
    if (lastGeom) generate();
  });
  $('size-custom').addEventListener('input', () => {
    $('size-custom-val').textContent = $('size-custom').value;
    if (lastGeom) generate();
  });

  /* 造型 */
  document.querySelectorAll('.shape-btn').forEach(b => b.addEventListener('click', () => {
    $('shape').value = b.dataset.shape;
    $('shape').dispatchEvent(new Event('change'));
  }));
  $('shape').addEventListener('change', () => { syncStyleUI(); if (lastGeom) generate(); });

  /* 顏色 / 漸層 */
  ['ink-color', 'ink-color2', 'bg-color', 'bg-color2'].forEach(id =>
    $(id).addEventListener('input', () => { syncStyleUI(); renderContrast(); if (lastGeom) generate(); }));
  ['ink-angle', 'bg-angle', 'ink-alpha', 'bg-alpha', 'margin'].forEach(id => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => { syncStyleUI(); renderContrast(); if (lastGeom) generate(); });
  });
  ['ink-grad', 'bg-grad', 'ink-cutout'].forEach(id =>
    $(id).addEventListener('change', () => { syncStyleUI(); renderContrast(); if (lastGeom) generate(); }));
  document.querySelectorAll('#ink-grad-seg .segbtn, #bg-grad-seg .segbtn').forEach(b =>
    b.addEventListener('click', () => {
      const on = b.dataset.on === '1';
      if (b.dataset.grad === 'ink') $('ink-grad').checked = on; else $('bg-grad').checked = on;
      syncStyleUI(); renderContrast(); if (lastGeom) generate();
    }));
  $('btn-swap').addEventListener('click', () => {
    const a = $('ink-color').value, a2 = $('ink-color2').value;
    $('ink-color').value = $('bg-color').value; $('ink-color2').value = $('bg-color2').value;
    $('bg-color').value = a; $('bg-color2').value = a2;
    syncStyleUI(); renderContrast(); generate();
  });
  $('btn-invert').addEventListener('click', () => {
    const inv = (hex) => rgb2hex(hex2rgb(hex).map(v => 255 - v));
    ['ink-color', 'ink-color2', 'bg-color', 'bg-color2'].forEach(id => { $(id).value = inv($(id).value); });
    syncStyleUI(); renderContrast(); generate();
  });
  $('btn-reset-style').addEventListener('click', () => applyPreset('classic'));

  /* 讀回測試（用畫布上的實際像素解碼，包含透明度與漸層） */
  $('btn-self').addEventListener('click', () => {
    setBusy(true, t('stage.decoding'));
    setTimeout(runSelfTest, 30);
  });
  function runSelfTest() {
    if (!lastGeom) { setBusy(false); $('self-msg').className = 'msg err'; $('self-msg').textContent = t('gen.needGenerate'); return; }
    const cv = $('canvas');
    const img = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
    const st = styleState();
    let data = img.data, width = cv.width, height = cv.height;
    const composited = st.bgAlpha < 1 || st.inkCutout || st.shape !== 'square';
    if (composited) {   // 透光區域：先模擬疊在「淺色底材」上再解碼
      const out = new Uint8ClampedArray(data.length), sub = [238, 233, 224];
      for (let i = 0; i < width * height; i++) {
        const a = data[i * 4 + 3] / 255;
        for (let k = 0; k < 3; k++) out[i * 4 + k] = data[i * 4 + k] * a + sub[k] * (1 - a);
        out[i * 4 + 3] = 255;
      }
      data = out;
    }
    const t0 = performance.now();
    const r = S.decodeImage({ data, width, height }, { ladder: true, timeBudget: 6000 });
    const dt = (performance.now() - t0).toFixed(0);
    setBusy(false);
    if (r.ok) {
      const txt = r.text != null ? r.text : '';
      toast(t('toast.readbackOk', { ms: dt, rings: r.rings }), 'ok', t('gen.self'));
      $('self-msg').className = 'msg ok';
      $('self-msg').textContent = t('msg.readbackOk', {
        ms: dt, rings: r.rings, ec: r.ecKey, fixed: r.correctedBytes,
        widths: r.meta.measured.join(' '), conf: (r.quality.meanConfidence * 100).toFixed(0)
      }) + (composited ? t('msg.readbackSubstrate') : '');
    } else {
      toast(t('toast.readbackFail', { ms: dt }), 'err', t('gen.self'));
      $('self-msg').className = 'msg err';
      $('self-msg').textContent = t('msg.readbackFail', { ms: dt, err: r.error });
    }
  }

  /* ---------------------------------------------------- 連結防護 */
  /** 只放行 http/https；javascript:、data:、file: 一律不當連結 */
  function safeUrl(str) {
    const s = String(str || '').trim();
    if (!/^https?:\/\//i.test(s)) return null;
    try {
      const u = new URL(s);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------- 掃描：共用 */
  const work = document.createElement('canvas');
  const workCtx = work.getContext('2d', { willReadFrequently: true });

  function grab(videoEl, maxDim) {
    const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
    if (!vw || !vh) return null;
    const k = Math.min(1, maxDim / Math.max(vw, vh));
    const w = Math.max(16, Math.round(vw * k)), h = Math.max(16, Math.round(vh * k));
    work.width = w; work.height = h;
    workCtx.drawImage(videoEl, 0, 0, w, h);
    return { frame: workCtx.getImageData(0, 0, w, h), w, h };
  }

  function resultHtml(r, dt) {
    const text = r.text != null ? r.text : '';
    let html = text
      ? escapeHtml(text)
      : `<span style="color:var(--muted)">${escapeHtml(t('scan.binary'))}</span>\n${escapeHtml(bytesToHex(r.bytes))}`;
    const metaList = [
      t('result.rings', { n: r.rings }),
      t('result.ec', { key: r.ecKey, bytes: r.ecBytes }),
      t('result.corrected', { n: r.correctedBytes }),
      t('result.total', { n: r.bytes.length }),
      r.mirror ? t('result.mirror') : t('result.normal'),
      `${dt.toFixed(0)} ms` + (r.stats && r.stats.attempt > 1 ? ` · ${t('scan.pass', { n: r.stats.attempt })}` : '')
    ];
    html += `<span class="meta">${metaList.map(m => `<span class="tag">${escapeHtml(m)}</span>`).join('')}</span>`;
    return html;
  }

  async function copyText(txt) {
    try { await navigator.clipboard.writeText(txt); toast(t('toast.copied'), 'ok'); return true; }
    catch (e) { toast(t('scan.copyFail'), 'err'); return false; }
  }
  async function shareText(txt) {
    if (navigator.share) { try { await navigator.share({ text: txt }); } catch (e) {} }
    else copyText(txt);
  }

  /* ---------------------------------------------------- 主掃描器 */
  const video = $('video'), flash = $('flash');
  let stream = null, camOn = false, busy = false, scanTimer = null, hist = [];

  async function listCams() {
    try {
      const devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
      const sel = $('cam-dev');
      if (!sel) return;
      sel.innerHTML = devs.map((d, i) => `<option value="${d.deviceId}">${escapeHtml(d.label || t('scan.cam.n', { n: i + 1 }))}</option>`).join('');
      $('cam-dev-wrap').classList.toggle('hidden', devs.length < 2);
      refreshSelects();
    } catch (e) {}
  }
  function setProgress(on, indet) {
    const pr = $('scan-progress');
    if (!pr) return;
    pr.classList.toggle('on', !!on);
    pr.classList.toggle('indet', !!indet);
    if (on && !indet) pr.firstElementChild.style.width = '';
  }
  async function startMainCam(deviceId) {
    try {
      setProgress(true, true);
      const v = { width: { ideal: 1920 }, height: { ideal: 1080 } };
      if (deviceId) v.deviceId = { exact: deviceId };
      else v.facingMode = { ideal: 'environment' };
      stream = await navigator.mediaDevices.getUserMedia({ video: v, audio: false });
      video.srcObject = stream;
      await video.play();
      camOn = true;
      setProgress(false, false);
      $('hud').classList.remove('hidden');
      $('cam-idle').classList.add('hidden');
      $('cam-wrap').classList.remove('idle');
      $('btn-cam').classList.add('hidden');
      $('btn-stop').disabled = false; $('btn-stop').classList.remove('hidden');
      $('hud-res').textContent = video.videoWidth ? `${video.videoWidth}×${video.videoHeight}` : '—';
      listCams();
      loop();
    } catch (e) {
      setProgress(false, false);
      $('scan-msg').className = 'msg err';
      $('scan-msg').textContent = t('scan.camErr', { err: e.message });
      toast(t('scan.camErr', { err: e.message }), 'err', t('scan.title'));
    }
  }
  function stopMainCam() {
    if (!camOn && !stream) return;
    camOn = false;
    if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
    if (stream) { stream.getTracks().forEach(x => x.stop()); stream = null; }
    if (video) video.srcObject = null;
    $('hud-lock').textContent = '';
    $('hud-fps').textContent = '—';
    $('btn-cam').disabled = false; $('btn-cam').classList.remove('hidden');
    $('btn-stop').disabled = true; $('btn-stop').classList.add('hidden');
    $('hud').classList.add('hidden');
    $('cam-idle').classList.remove('hidden');
    $('cam-wrap').classList.add('idle');
  }
  function loop() {
    if (!camOn) return;
    const t0 = performance.now();
    if (!busy) {
      const g = grab(video, +$('maxdim').value);
      if (g) {
        busy = true;
        const r = S.decodeImage({ data: g.frame.data, width: g.w, height: g.h },
          { thresholdC: +$('thr').value, maxDim: +$('maxdim').value, ladder: false, timeBudget: 1200 });
        busy = false;
        if (r.ok) {
          $('hud-lock').textContent = t('hud.locked', { rings: r.rings });
          flash.classList.add('on');
          setTimeout(() => flash.classList.remove('on'), 120);
          showResult(r, performance.now() - t0);
          $('scan-msg').className = 'msg ok';
          $('scan-msg').textContent = t('scan.ok', { ms: (performance.now() - t0).toFixed(0) });
          if (navigator.vibrate) navigator.vibrate(25);
          scanTimer = setTimeout(loop, 900);
          return;
        }
        $('hud-lock').textContent = '';
        $('scan-msg').className = 'msg';
        $('scan-msg').textContent = t('scan.searching');
      }
    }
    $('hud-fps').textContent = Math.round(1000 / Math.max(120, performance.now() - t0)) + ' fps';
    scanTimer = setTimeout(loop, 220);
  }
  function handleScan(r, dt, live) {
    showResult(r, dt);
    const el = $('scan-msg');
    if (r.ok) {
      el.className = 'msg ok';
      el.textContent = t('scan.ok', { ms: dt.toFixed(0) });
      if (live) { busy = true; setTimeout(() => { busy = false; }, 700); }
    } else {
      el.className = 'msg';
      el.textContent = t('scan.fail', { ms: dt.toFixed(0), err: r.error || '' });
    }
  }
  function showResult(r, dt) {
    const box = $('result');
    box.classList.remove('empty');
    box.innerHTML = resultHtml(r, dt);
    const text = r.text != null ? r.text : '';
    const payload = text || bytesToHex(r.bytes);
    $('btn-copy').disabled = false;
    $('btn-copy').dataset.text = payload;
    const url = safeUrl(text);
    $('btn-open').classList.toggle('hidden', !url);
    if (url) $('btn-open').dataset.url = url;
    $('btn-share').classList.toggle('hidden', !navigator.share);
    $('dbg').textContent = JSON.stringify({
      rings: r.rings, ec: r.ecKey, bytes: r.bytes.length, meta: r.meta,
      corrected: r.correctedBytes, mirror: r.mirror, refined: r.refined || null,
      geometry: r.geometry, quality: r.quality, ms: Math.round(dt)
    }, null, 2);
    hist.unshift({
      t: Date.now(), payload, text: !!text,
      rings: r.rings, ec: r.ecKey, bytes: r.bytes.length, ms: Math.round(dt)
    });
    if (hist.length > 24) hist.pop();
    saveHist(); renderHistory();
  }

  $('btn-cam').addEventListener('click', () => startMainCam());
  $('btn-stop').addEventListener('click', stopMainCam);
  $('cam-dev').addEventListener('change', () => {
    const id = $('cam-dev').value;
    stopMainCam();
    setTimeout(() => startMainCam(id), 120);
  });
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setTimeout(() => {
      $('scan-msg').className = 'msg';
      $('scan-msg').textContent = t('scan.noCam');
    }, 400);
  } else {
    $('btn-cam').classList.remove('hidden');   // 有攝影機 API 才顯示「開啟攝影機」
  }
  $('btn-copy').addEventListener('click', () => copyText($('btn-copy').dataset.text || ''));
  $('btn-open').addEventListener('click', () => {
    const u = safeUrl($('btn-open').dataset.url);
    if (u) window.open(u, '_blank', 'noopener');
  });
  $('btn-share').addEventListener('click', () => shareText($('btn-copy').dataset.text || ''));
  $('btn-clear').addEventListener('click', () => {
    hist = []; saveHist(); renderHistory();
    $('result').className = 'result empty'; $('result').textContent = t('scan.empty');
    $('btn-copy').disabled = true;
    $('btn-open').classList.add('hidden');
    $('btn-share').classList.add('hidden');
  });

  const HIST_KEY = 'sesame.history';
  function saveHist() {
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(hist.map(h => ({
        t: h.t, payload: h.payload, text: h.text, rings: h.rings, ec: h.ec, bytes: h.bytes, ms: h.ms
      }))));
    } catch (e) {}
  }
  (function loadHist() {
    try {
      const raw = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
      if (Array.isArray(raw)) hist = raw.slice(0, 24);
    } catch (e) {}
  })();
  function renderHistory() {
    const box = $('history');
    if (!hist.length) { box.innerHTML = `<li class="empty">${escapeHtml(t('scan.histEmpty'))}</li>`; return; }
    box.innerHTML = hist.map((h, i) =>
      `<li><span class="hmeta">${h.rings}R·${escapeHtml(h.ec)}</span>`
      + `<span class="hpay" title="${escapeHtml(String(h.payload))}">${escapeHtml(String(h.payload).slice(0, 72))}</span>`
      + `<button data-ci="${i}" title="${escapeHtml(t('scan.copy'))}">⧉</button>`
      + `<button data-di="${i}" title="${escapeHtml(t('scan.del'))}">✕</button></li>`).join('');
    box.querySelectorAll('[data-ci]').forEach(b => b.addEventListener('click', () => copyText(hist[+b.dataset.ci].payload)));
    box.querySelectorAll('[data-di]').forEach(b => b.addEventListener('click', () => {
      hist.splice(+b.dataset.di, 1); saveHist(); renderHistory();
    }));
  }

  /* 圖片檔案 / 拖放 / 貼上 */
  function decodeBlob(blob, hook) {
    const img = new Image();
    img.onload = () => {
      const maxDim = +$('maxdim').value;
      const k = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(16, Math.round(img.width * k)), h = Math.max(16, Math.round(img.height * k));
      work.width = w; work.height = h;
      workCtx.drawImage(img, 0, 0, w, h);
      const frame = workCtx.getImageData(0, 0, w, h);
      setProgress(true, true);
      $('scan-msg').className = 'msg';
      $('scan-msg').textContent = t('scan.reading');
      setTimeout(() => {
        const t0 = performance.now();
        const r = S.decodeImage({ data: frame.data, width: w, height: h },
          { thresholdC: +$('thr').value, maxDim, ladder: true, timeBudget: 6000 });
        const dt = performance.now() - t0;
        setProgress(false, false);
        if (hook) hook(r, dt); else handleScan(r, dt, false);
      }, 20);
    };
    img.onerror = () => { $('scan-msg').className = 'msg err'; $('scan-msg').textContent = t('scan.imgErr'); };
    const url = URL.createObjectURL(blob);
    img.src = url;
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
  $('file').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) decodeBlob(f); });
  const drop = $('drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('hover'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('hover')));
  document.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && /^image\//.test(f.type)) decodeBlob(f);
  });
  document.addEventListener('dragover', e => e.preventDefault());
  $('btn-paste').addEventListener('click', async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find(x => x.startsWith('image/'));
        if (type) { decodeBlob(await it.getType(type)); return; }
      }
      $('scan-msg').className = 'msg err'; $('scan-msg').textContent = t('scan.clipNone');
    } catch (e) {
      $('scan-msg').className = 'msg err'; $('scan-msg').textContent = t('scan.clipErr', { err: e.message });
    }
  });
  $('thr').addEventListener('input', () => { $('thr-val').textContent = $('thr').value; });

  /* ---------------------------------------------------- 完全掃描器（#full） */
  const fsSection = $('fullscreen');
  const fsVideo = $('fs-video');
  let fsStream = null, fsTimer = null, fsBusy = false, fsLocked = false, fsFacing = 'environment';

  function fsStatus(txt) { $('fs-status').textContent = txt; }
  async function startFsCam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      fsStatus(t('fs.camOff'));
      return;
    }
    try {
      fsStatus(t('fs.status'));
      fsStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: { ideal: fsFacing } }, audio: false
      });
      fsVideo.srcObject = fsStream;
      await fsVideo.play();
      fsStatus(t('fs.status'));
      fsLoop();
    } catch (e) { fsStatus(t('fs.camOff')); }
  }
  function stopFsCam() {
    if (fsTimer) { clearTimeout(fsTimer); fsTimer = null; }
    if (fsStream) { fsStream.getTracks().forEach(x => x.stop()); fsStream = null; }
    if (fsVideo) fsVideo.srcObject = null;
    fsLocked = false;
  }
  function fsLoop() {
    if (!fsSection.classList.contains('on') || !fsStream) return;
    if (!fsLocked && !fsBusy) {
      const g = grab(fsVideo, 1280);
      if (g) {
        fsBusy = true;
        const r = S.decodeImage({ data: g.frame.data, width: g.w, height: g.h },
          { thresholdC: 13, maxDim: 1280, ladder: false, timeBudget: 900 });
        fsBusy = false;
        if (r.ok) { fsHit(r); return; }
      }
    }
    fsTimer = setTimeout(fsLoop, 240);
  }
  function fsHit(r) {
    fsLocked = true;
    $('fs-flash').classList.add('on');
    setTimeout(() => $('fs-flash').classList.remove('on'), 140);
    if (navigator.vibrate) navigator.vibrate(30);
    const text = r.text != null ? r.text : '';
    const payload = text || bytesToHex(r.bytes);
    $('fs-result').hidden = false;
    $('fs-payload').textContent = payload;
    const url = safeUrl(text);
    $('fs-open').classList.toggle('hidden', !url);
    if (url) $('fs-open').dataset.url = url;
    $('fs-share').classList.toggle('hidden', !navigator.share);
    $('fs-copy').dataset.text = payload;
    fsStatus(t('fs.locked', { rings: r.rings }));
    showResult(r, 0);   // 同步寫進掃描器的紀錄
  }
  function openFull() {
    if (fsSection.classList.contains('on')) return;
    fsSection.classList.add('on');
    fsSection.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('fs-result').hidden = true;
    fillBands();
    startFsCam();
  }
  function closeFull() {
    if (!fsSection.classList.contains('on')) return;
    fsSection.classList.remove('on');
    fsSection.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopFsCam();
    $('fs-result').hidden = true;
  }
  document.querySelectorAll('[data-fullscreen]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); go('#full'); }));
  $('fs-close').addEventListener('click', () => go('#scan'));
  $('fs-again').addEventListener('click', () => {
    $('fs-result').hidden = true;
    fsLocked = false;
    if (fsStream) fsLoop(); else startFsCam();
  });
  $('fs-copy').addEventListener('click', () => copyText($('fs-copy').dataset.text || ''));
  $('fs-open').addEventListener('click', () => {
    const u = safeUrl($('fs-open').dataset.url);
    if (u) window.open(u, '_blank', 'noopener');
  });
  $('fs-share').addEventListener('click', () => shareText($('fs-copy').dataset.text || ''));
  $('fs-cam-toggle').addEventListener('click', async () => {
    fsFacing = fsFacing === 'environment' ? 'user' : 'environment';
    stopFsCam();
    await startFsCam();
  });
  $('fs-file').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      const w = Math.max(16, Math.round(img.width * k)), h = Math.max(16, Math.round(img.height * k));
      work.width = w; work.height = h;
      workCtx.drawImage(img, 0, 0, w, h);
      const frame = workCtx.getImageData(0, 0, w, h);
      fsStatus(t('scan.reading'));
      setTimeout(() => {
        const r = S.decodeImage({ data: frame.data, width: w, height: h }, { thresholdC: 13, maxDim: 1600, ladder: true, timeBudget: 6000 });
        if (r.ok) fsHit(r);
        else fsStatus(t('scan.fail', { ms: '0', err: r.error || '' }));
      }, 20);
    };
    img.onerror = () => fsStatus(t('scan.imgErr'));
    const url = URL.createObjectURL(f);
    img.src = url;
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  });

  /* ---------------------------------------------------- 規格頁 */
  function buildSpec() {
    $('spec-body').innerHTML = t('spec.intro') + t('spec.html');
    const cols = t('spec.cols');
    let html = '<table><thead><tr>' + cols.map(c => `<th>${escapeHtml(c)}</th>`).join('') + '</tr></thead><tbody>';
    for (let v = S.GEO.MIN_VERSION; v <= S.GEO.MAX_VERSION; v++) {
      const caps = [0, 1, 2, 3].map(i => S.ecPlan(v, i).data);
      const kArr = Array.from({ length: v }, (_, k) => S.ringCells(k)).join('/');
      html += `<tr><td>${v}</td><td>${kArr}</td><td>${S.totalCells(v)}</td>`
        + `<td>${(S.frameInner(v) / S.frameOuter(v)).toFixed(3)}</td>`
        + caps.map(c => `<td>${c}</td>`).join('')
        + `<td>${S.frameOuter(v).toFixed(1)}</td></tr>`;
    }
    html += '</tbody></table><p class="mini">' + escapeHtml(t('spec.note')) + '</p>';
    $('spec-table').innerHTML = html;
    /* 目錄：依小節標題自動生成 */
    const heads = Array.from($('spec-body').querySelectorAll('h3'));
    heads.forEach((h, i) => { h.id = 'sec-' + (i + 1); });
    const toc = $('toc-list');
    toc.innerHTML = heads.map((h, i) =>
      `<li><a href="#spec/${i + 1}" data-no="${String(i + 1).padStart(2, '0')}" data-sec="${i + 1}">${escapeHtml(h.textContent)}</a></li>`).join('');
    toc.querySelectorAll('a').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      go('#spec/' + a.dataset.sec);
    }));
    markTocFromHash();
  }
  function markTocFromHash() {
    const r = parseHash();
    document.querySelectorAll('#toc-list a').forEach(a =>
      a.classList.toggle('on', !!r.sub && a.dataset.sec === r.sub));
  }

  /* ---------------------------------------------------- 語言切換後重建 */
  I18N.onChange(() => {
    document.documentElement.setAttribute('lang', I18N.lang);
    buildSpec();
    renderPresets();
    renderExamples();
    renderContrast();
    syncStyleUI();
    renderHistory();
    renderRecent();
    buildRingOptions();
    setMode(modeValue());
    fillBands();
    document.querySelectorAll('.sel').forEach(n => n._refresh && n._refresh());
    if (lastGeom) generate();
  });

  /* ---------------------------------------------------- 初始化 */
  document.querySelectorAll('.sel').forEach(initSel);
  I18N.apply();
  fillBands();
  observeBandWidths();
  buildRingOptions();
  refreshSelects();
  renderPresets();
  renderExamples();
  syncStyleUI();
  buildSpec();
  updateCapacity();
  renderHistory();
  renderRecent();
  $('thr-val').textContent = $('thr').value;
  setMode('text');
  $('hud-fps').textContent = '—';
  $('hud-res').textContent = '—';
  $('hud-lock').textContent = '';
  $('cam-wrap').classList.add('idle');
  (function kbdHint() {
    const k = $('btn-gen').querySelector('kbd');
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    if (k) k.textContent = mac ? '⌘↵' : 'Ctrl+↵';
  })();
  generate();
  applyHash();
  window.addEventListener('beforeunload', () => { stopMainCam(); stopFsCam(); });
})();

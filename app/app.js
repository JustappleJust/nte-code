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
  function closeAllSel() {
    document.querySelectorAll('.sel.open').forEach(x => {
      x.classList.remove('open', 'open-up');
      const b = x.querySelector('.sel-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.has-open-sel').forEach(el => el.classList.remove('has-open-sel'));
  }

  function markSelAncestors(node) {
    let p = node.parentElement;
    while (p && p !== document.body) {
      if (p.classList.contains('box') || p.classList.contains('stage') ||
          p.classList.contains('fields') || p.tagName === 'LABEL' ||
          p.classList.contains('srow') || p.classList.contains('scan-actions') ||
          p.classList.contains('top') || p.classList.contains('app')) {
        p.classList.add('has-open-sel');
      }
      p = p.parentElement;
    }
  }

  function positionSelList(node, btn, list) {
    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const listHeight = Math.min(260, Math.max(120, (list.children.length || 4) * 36));
    if (spaceBelow < Math.min(listHeight + 16, 220) && spaceAbove > spaceBelow) {
      node.classList.add('open-up');
    } else {
      node.classList.remove('open-up');
    }
  }

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

    const pick = (i) => {
      if (i < 0 || i >= src.options.length) return;
      src.selectedIndex = i;
      src.dispatchEvent(new Event('change', { bubbles: true }));
      closeAllSel();
      btn.focus();
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isAlreadyOpen = node.classList.contains('open');
      closeAllSel();
      if (!isAlreadyOpen) {
        positionSelList(node, btn, list);
        node.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        markSelAncestors(node);
        const selLi = list.querySelector('[aria-selected="true"]');
        if (selLi) selLi.scrollIntoView({ block: 'nearest' });
      }
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        pick(src.selectedIndex + (e.key === 'ArrowDown' ? 1 : -1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      } else if (e.key === 'Escape') {
        closeAllSel();
      }
    });

    list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) pick(+li.dataset.i);
    });

    src.addEventListener('change', refresh);
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sel')) closeAllSel();
  });
  window.addEventListener('resize', closeAllSel, { passive: true });
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
        if (r.ok) { fsHit(r, { data: g.frame.data, w: g.w, h: g.h, kind: 'cam' }); return; }
      }
    }
    fsTimer = setTimeout(fsLoop, 240);
  }
  /* ---------------------------------------------------- 完全掃描器：掃描效果
   * 掃到成功時依序播放：亮度掃過內外環一圈 → 芝麻以波浪放大縮小 →
   * 把掃到的圓形區域重新生成乾淨版本（顏色與角度形變對上原圖，像從圖片
   * 複製出來）→ 往下飛行、圓形變幻成結果面板（芝麻變文字、圓環變按鈕）。
   * 可由 fs-foot 的開關關閉；prefers-reduced-motion 時自動停用。 */
  const FX_KEY = 'sesame.fsfx';
  let fsFxOn = true;
  try { const v = localStorage.getItem(FX_KEY); if (v != null) fsFxOn = v !== '0'; } catch (e) {}
  let fxRAF = 0;
  function fxReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function syncFsFxToggle() {
    const b = $('fs-fx-toggle');
    if (b) b.setAttribute('aria-checked', fsFxOn ? 'true' : 'false');
  }
  function fxStop(revealNow) {
    if (fxRAF) { cancelAnimationFrame(fxRAF); fxRAF = 0; }
    fsThawCam();   // 中斷動畫也要把畫面漸變回 live 畫面
    const cv = $('fs-fx');
    if (cv) {
      const c = cv.getContext('2d');
      if (c) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); }
      cv.style.opacity = '1';
    }
    const res = $('fs-result');
    if (res) {
      res.classList.remove('fx-pending');
      if (revealNow && !res.hidden) {
        res.classList.remove('show');
        void res.offsetWidth;
        res.classList.add('show');
      }
    }
  }
  /** 來源影像 → 離屏 canvas（圖片掃描時當作場景背景鋪在 fs-bg） */
  function fxMakeHitCanvas(hit) {
    if (hit._cv) return hit._cv;
    const cv = document.createElement('canvas');
    cv.width = hit.w; cv.height = hit.h;
    const c = cv.getContext('2d');
    const im = c.createImageData(hit.w, hit.h);
    im.data.set(hit.data);
    c.putImageData(im, 0, 0);
    hit._cv = cv;
    return cv;
  }
  function fsPaintBg(hitCv) {
    const b = $('fs-bg'), camEl = fsSection.querySelector('.fs-cam');
    if (!b || !camEl || !hitCv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = camEl.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
    if (b.width !== w || b.height !== h) { b.width = w; b.height = h; }
    const c = b.getContext('2d');
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, w, h);
    const cover = Math.max(rect.width / hitCv.width, rect.height / hitCv.height);
    const ox = (rect.width - hitCv.width * cover) / 2, oy = (rect.height - hitCv.height * cover) / 2;
    c.setTransform(cover * dpr, 0, 0, cover * dpr, ox * dpr, oy * dpr);
    c.drawImage(hitCv, 0, 0);
  }
  function fsClearBg() {
    const camEl = fsSection.querySelector('.fs-cam');
    if (camEl) camEl.classList.remove('bg-frozen', 'bg-still');
    const b = $('fs-bg');
    if (b) {
      const c = b.getContext('2d');
      if (c) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, b.width, b.height); }
    }
  }
  /** 相機掃到碼：把剛剛解碼的那一格鋪滿畫面（立即生效），蓋住 live 畫面 */
  function fsFreezeCam(hitCv) {
    const camEl = fsSection.querySelector('.fs-cam');
    if (!camEl) return;
    fsPaintBg(hitCv);
    camEl.classList.remove('bg-still');
    camEl.classList.add('bg-frozen');
  }
  /** 圖片掃描：來源影像一直留在場景上（不淡出） */
  function fsHoldStill(hitCv) {
    const camEl = fsSection.querySelector('.fs-cam');
    if (!camEl) return;
    fsPaintBg(hitCv);
    camEl.classList.remove('bg-frozen');
    camEl.classList.add('bg-still');
  }
  /** 解除凍結：移除 class 後由 CSS 漸變回 live 畫面（不用按「再掃一次」） */
  function fsThawCam() {
    const camEl = fsSection.querySelector('.fs-cam');
    if (camEl) camEl.classList.remove('bg-frozen');
  }
  /** 從掃描影像取樣芝麻色／底色（含漸層方向），讓複製品的顏色對上原圖 */
  function fxSampleColors(hit, geo, R6u, bRad, mir) {
    const out = { inkRGB: [30, 30, 32], bgRGB: [244, 244, 246] };
    try {
      const { data, w, h } = hit;
      const mapper = S._internal.makeMapper(geo.cx, geo.cy, geo.A, geo.B, geo.phi || 0);
      const samples = [];
      const stride = Math.max(1, Math.floor(Math.max(w, h) / 180));
      const c1 = Math.cos(bRad), s1 = Math.sin(bRad);
      for (let y = 0; y < h; y += stride) {
        for (let x = 0; x < w; x += stride) {
          const q = mapper.fromImage(x + 0.5, y + 0.5);
          const rho = Math.hypot(q.u, q.v);
          if (rho > 0.9 || rho < 0.14) continue;
          const i = (y * w + x) * 4;
          const rr = data[i], gg = data[i + 1], bb = data[i + 2];
          const lum = 0.299 * rr + 0.587 * gg + 0.114 * bb;
          // 模型座標 → 設計座標（與 renderCode 的方向一致，漸層角可直接沿用）
          const du = (q.u * c1 + q.v * s1) * R6u;
          const dv = mir ? (q.u * s1 - q.v * c1) * R6u : (-q.u * s1 + q.v * c1) * R6u;
          samples.push({ lum, rr, gg, bb, du, dv });
        }
      }
      if (samples.length < 50) return out;
      samples.sort((a, b) => a.lum - b.lum);
      const n = samples.length;
      const meanRGB = (arr, s, e) => {
        let r = 0, g = 0, b = 0;
        for (let i = s; i < e; i++) { r += arr[i].rr; g += arr[i].gg; b += arr[i].bb; }
        const k = Math.max(1, e - s);
        return [Math.round(r / k), Math.round(g / k), Math.round(b / k)];
      };
      out.inkRGB = meanRGB(samples, 0, Math.max(1, Math.floor(n * 0.14)));
      const bgS = Math.floor(n * 0.62);
      out.bgRGB = meanRGB(samples, bgS, n);
      // 底色漸層：對亮部樣本做「亮度 ~ 設計座標」線性回歸，找出變亮方向
      const bg = samples.slice(bgS);
      if (bg.length >= 60) {
        let cnt = 0, su = 0, sv = 0, sl = 0, suu = 0, svv = 0, suv = 0, sul = 0, svl = 0;
        for (const s of bg) {
          cnt++; su += s.du; sv += s.dv; sl += s.lum;
          suu += s.du * s.du; svv += s.dv * s.dv; suv += s.du * s.dv;
          sul += s.du * s.lum; svl += s.dv * s.lum;
        }
        const mu = su / cnt, mv = sv / cnt, ml = sl / cnt;
        const a11 = suu - cnt * mu * mu, a12 = suv - cnt * mu * mv, a22 = svv - cnt * mv * mv;
        const rhs1 = sul - cnt * mu * ml, rhs2 = svl - cnt * mv * ml;
        const det = a11 * a22 - a12 * a12;
        if (Math.abs(det) > 1e-6) {
          const gx = (rhs1 * a22 - rhs2 * a12) / det;
          const gy = (a11 * rhs2 - a12 * rhs1) / det;
          const proj = bg.map(s => gx * (s.du - mu) + gy * (s.dv - mv));
          const sorted = proj.slice().sort((p, q) => p - q);
          const lo = sorted[Math.floor(sorted.length * 0.08)];
          const hi = sorted[Math.floor(sorted.length * 0.92)];
          if (hi - lo > 7) {
            let r0 = 0, g0 = 0, b0 = 0, k0 = 0, r1 = 0, g1 = 0, b1 = 0, k1 = 0;
            const band = (hi - lo) * 0.18;
            for (let i = 0; i < bg.length; i++) {
              const p = proj[i];
              if (p <= lo + band) { r0 += bg[i].rr; g0 += bg[i].gg; b0 += bg[i].bb; k0++; }
              else if (p >= hi - band) { r1 += bg[i].rr; g1 += bg[i].gg; b1 += bg[i].bb; k1++; }
            }
            if (k0 >= 8 && k1 >= 8) {
              out.bgStyle = {
                from: [Math.round(r0 / k0), Math.round(g0 / k0), Math.round(b0 / k0)],
                to: [Math.round(r1 / k1), Math.round(g1 / k1), Math.round(b1 / k1)],
                angle: Math.atan2(gy, gx) * 180 / Math.PI
              };
              delete out.bgRGB;
            }
          }
        }
      }
    } catch (e) { /* 取樣失敗就用預設色 */ }
    return out;
  }
  /** 播放掃描效果；成功啟動回傳 true（結果面板由動畫結尾變換出來） */
  function fxPlay(hit, r) {
    const geo = r.geometry;
    if (!geo || !(geo.A > 0) || !(geo.B > 0)) return false;
    let g2 = null;
    try { g2 = S.encode(r.bytes, { version: r.version, ecLevel: r.ecLevel }); } catch (e) { g2 = null; }
    if (!g2 || !g2.ok) return false;
    const cv = $('fs-fx'), camEl = fsSection.querySelector('.fs-cam'), resEl = $('fs-result');
    if (!cv || !camEl || !resEl) return false;
    const ctx = cv.getContext('2d');
    if (!ctx) return false;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const R6u = S.frameOuter(r.version);
    const bRad = (geo.baseDeg || 0) * Math.PI / 180;
    const mir = !!geo.mirror;
    const plateU = R6u + 0.5;

    /* 乾淨版本：重新編碼，取樣原圖顏色；角度形變在繪製時用仿射對上 */
    const cols = fxSampleColors(hit, geo, R6u, bRad, mir);
    let clean = null;
    try {
      clean = S.renderCode(g2, Object.assign({
        shape: 'circle', pxPerUnit: 9, rotDeg: 0, marginU: 0.5
      }, cols));
    } catch (e) { clean = null; }
    if (!clean) return false;
    const cleanCv = document.createElement('canvas');
    cleanCv.width = clean.width; cleanCv.height = clean.height;
    {
      const c2 = cleanCv.getContext('2d');
      const im = c2.createImageData(clean.width, clean.height);
      im.data.set(clean.data);
      c2.putImageData(im, 0, 0);
    }
    const halfU = clean.width / 2 / clean.pxPerUnit;

    /* 掃描效果期間凍結畫面：相機用剛抓到的那一格，圖片用來源影像；
       動畫結束（finish）或中斷（fxStop）時移除 class，以 CSS 漸變回 live 畫面。 */
    const hitCv = fxMakeHitCanvas(hit);
    if (hit.kind === 'file') fsHoldStill(hitCv);
    else fsFreezeCam(hitCv);

    /* 結果面板先佔位量測（不可見），飛行動畫以此為目標 */
    resEl.hidden = false;
    resEl.classList.remove('show');
    resEl.classList.add('fx-pending');
    const camR0 = camEl.getBoundingClientRect();
    const rr = resEl.getBoundingClientRect();
    const actEl = resEl.querySelector('.fs-actions');
    const payEl = $('fs-payload');
    const actR = actEl ? actEl.getBoundingClientRect() : rr;
    const payR = payEl ? payEl.getBoundingClientRect() : rr;
    const target = {
      x: rr.left - camR0.left, y: rr.top - camR0.top, w: Math.max(40, rr.width), h: Math.max(30, rr.height),
      ax: actR.left - camR0.left, ay: actR.top - camR0.top + actR.height / 2,
      aw: Math.max(60, actR.width),
      px: payR.left - camR0.left, py: payR.top - camR0.top + Math.min(payR.height / 2, 16),
      pw: Math.max(40, payR.width)
    };
    let panelFill = 'rgba(16,20,25,.72)';
    try {
      const s = getComputedStyle(resEl).backgroundColor;
      if (s && s !== 'rgba(0, 0, 0, 0)') panelFill = s;
    } catch (e) { /* keep default */ }

    /* 時序（ms） */
    const T_SWEEP = 80, SWEEP_LEN = 820, T_SWEEP2 = 190;
    const T_WAVE = 330, WAVE_SPAN = 720, POP = 380;
    const T_REVEAL = 1260, REVEAL_LEN = 620;
    const T_LIFT = 1900, LIFT_LEN = 220;
    const T_FLY = 2120, FLY_LEN = 880;
    const T_TOTAL = T_FLY + FLY_LEN + 180;

    /* 芝麻波浪：由內往外、帶一點角度起伏的觸發順序 */
    const bodyOut = S.bodyOuter(r.version), r0 = S.ringRadius(0);
    const pops = [];
    for (const cell of g2.cells) {
      if (!cell.state) continue;
      const norm = Math.max(0, Math.min(1, (cell.r - r0) / Math.max(1e-6, bodyOut - r0)));
      const wob = Math.sin(cell.deg * 3 * Math.PI / 180) * 0.5 + 0.5;
      pops.push({
        x: cell.r * Math.cos(cell.deg * Math.PI / 180),
        y: cell.r * Math.sin(cell.deg * Math.PI / 180),
        ang: (cell.deg + (cell.state - 1) * 45) * Math.PI / 180,
        t0: T_WAVE + norm * WAVE_SPAN + wob * 90
      });
    }
    /* 芝麻 → 文字：飛行時散開成小點落進文字列 */
    const dots = [];
    for (let i = 0; i < 8 && pops.length; i++) dots.push(pops[(i * 37 + 11) % pops.length]);

    const easeOut = p => 1 - Math.pow(1 - p, 3);
    const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (a, b, v) => { const t2 = clamp01((v - a) / (b - a)); return t2 * t2 * (3 - 2 * t2); };
    const roundRectPath = (c, x, y, w, h, rad) => {
      const rr2 = Math.max(0, Math.min(rad, w / 2, h / 2));
      c.moveTo(x + rr2, y);
      c.arcTo(x + w, y, x + w, y + h, rr2);
      c.arcTo(x + w, y + h, x, y + h, rr2);
      c.arcTo(x, y + h, x, y, rr2);
      c.arcTo(x, y, x + w, y, rr2);
      c.closePath();
    };

    const resize = () => {
      const rect = camEl.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w; cv.height = h;
        if (hitCv) fsPaintBg(hitCv);
      }
    };
    /* 設計座標（u）→ 螢幕（css px）的仿射 */
    function xfNow() {
      const rect = camEl.getBoundingClientRect();
      const cover = Math.max(rect.width / hit.w, rect.height / hit.h);
      const ox = (rect.width - hit.w * cover) / 2, oy = (rect.height - hit.h * cover) / 2;
      const k = 1 / R6u;
      const c1 = Math.cos(bRad), s1 = Math.sin(bRad);
      const phi = geo.phi || 0, cp = Math.cos(phi), sp = Math.sin(phi);
      const A = geo.A, B = geo.B;
      let d00, d01, d10, d11;
      if (!mir) {
        d00 = (cp * A * c1 - sp * B * s1) * k; d01 = (-cp * A * s1 - sp * B * c1) * k;
        d10 = (sp * A * c1 + cp * B * s1) * k; d11 = (-sp * A * s1 + cp * B * c1) * k;
      } else {
        d00 = (cp * A * c1 - sp * B * s1) * k; d01 = (cp * A * s1 + sp * B * c1) * k;
        d10 = (sp * A * c1 + cp * B * s1) * k; d11 = (sp * A * s1 - cp * B * c1) * k;
      }
      return {
        m00: d00 * cover, m01: d01 * cover, m10: d10 * cover, m11: d11 * cover,
        e: ox + cover * geo.cx, f: oy + cover * geo.cy, cover, ox, oy
      };
    }
    const setD = (m) => ctx.setTransform(m.m00 * dpr, m.m10 * dpr, m.m01 * dpr, m.m11 * dpr, m.e * dpr, m.f * dpr);
    const setR = (a, b, c, d, e, f) => ctx.setTransform(a * dpr, b * dpr, c * dpr, d * dpr, e * dpr, f * dpr);
    /* renderCode 畫布像素 → 螢幕（canvas setTransform 參數序） */
    const rxf = (m) => ({
      a: m.m00 / clean.pxPerUnit, b: m.m10 / clean.pxPerUnit,
      c: m.m01 / clean.pxPerUnit, d: m.m11 / clean.pxPerUnit,
      e: m.e - (m.m00 + m.m01) * halfU, f: m.f - (m.m10 + m.m11) * halfU
    });

    let shown = false;
    const t0 = performance.now();
    try { window.__fxT0 = Date.now(); } catch (e) { /* 測試用時間錨點 */ }
    function finish() {
      if (fxRAF) { cancelAnimationFrame(fxRAF); fxRAF = 0; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      cv.style.opacity = '1';
      fsThawCam();   // 動畫播完：凍結畫面淡出，live 畫面漸變回來
      resEl.classList.remove('fx-pending');
      if (!shown) {
        shown = true;
        resEl.classList.remove('show');
        void resEl.offsetWidth;
        resEl.classList.add('show');
      }
    }
    function frame(now) {
      const t = now - t0;
      if (t >= T_TOTAL) { finish(); return; }
      resize();
      const x = xfNow();
      const plateHx = plateU * Math.hypot(x.m00, x.m01);
      const plateHy = plateU * Math.hypot(x.m10, x.m11);
      const plateAng = Math.atan2(x.m10, x.m00);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);

      /* ── ① 亮度環過內外環一圈 ── */
      const ringSweep = (t0s, rMid, lwU) => {
        const p = clamp01((t - t0s) / SWEEP_LEN);
        const post = clamp01((t - t0s - SWEEP_LEN) / 360);
        if (t < t0s || post >= 1) return;
        const fade = 1 - post * post;
        const head = (60 + 360 * easeOut(p)) * Math.PI / 180;
        setD(x);
        ctx.globalCompositeOperation = 'lighter';
        const seg = 12, tail = 150 * Math.PI / 180;
        for (let i = 0; i < seg; i++) {
          const q = i / seg;
          const a1 = head - tail * q;
          const a0 = head - tail * (q + 1 / seg) - 0.012;
          const al = (1 - q) * (1 - q) * fade;
          ctx.strokeStyle = 'rgba(190,225,255,' + (0.1 + 0.55 * al).toFixed(3) + ')';
          ctx.lineWidth = lwU;
          ctx.beginPath();
          ctx.arc(0, 0, rMid, a0, a1);
          ctx.stroke();
        }
        if (p < 1) {
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * fade).toFixed(3) + ')';
          ctx.lineWidth = lwU * 0.5;
          ctx.beginPath();
          ctx.arc(0, 0, rMid, head - 0.2, head + 0.04);
          ctx.stroke();
        } else {
          const q2 = 1 - post;
          ctx.strokeStyle = 'rgba(210,235,255,' + (0.4 * q2 * q2).toFixed(3) + ')';
          ctx.lineWidth = lwU * 0.9;
          ctx.beginPath();
          ctx.arc(0, 0, rMid, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      };
      ringSweep(T_SWEEP, S.metaMid(r.version), S.GEO.FRAME_T * 0.62);
      ringSweep(T_SWEEP2, (S.GEO.INNER_RI + S.GEO.RI) / 2, S.GEO.INNER_T * 0.62);

      /* ── ② 芝麻波浪：每顆芝麻放大再縮小 ── */
      if (t > T_WAVE - 30 && t < T_WAVE + WAVE_SPAN + POP + 120) {
        setD(x);
        ctx.globalCompositeOperation = 'lighter';
        const wq = clamp01((t - T_WAVE) / (WAVE_SPAN + POP));
        if (wq > 0 && wq < 1) {
          const wr = lerp(r0 * 0.72, bodyOut + 1.4, easeOut(wq));
          ctx.strokeStyle = 'rgba(160,210,255,' + (0.06 + 0.34 * (1 - wq) * (1 - wq)).toFixed(3) + ')';
          ctx.lineWidth = 0.34;
          ctx.beginPath();
          ctx.arc(0, 0, wr, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (const c of pops) {
          const p = (t - c.t0) / POP;
          if (p <= 0 || p >= 1) continue;
          const s = 1 + 0.85 * Math.sin(Math.PI * p);
          const al = 1 - p * p;
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.ang);
          ctx.strokeStyle = 'rgba(190,225,255,' + (0.8 * al).toFixed(3) + ')';
          ctx.lineWidth = 0.22;
          ctx.beginPath();
          ctx.ellipse(0, 0, S.GEO.SA * s * 1.06, S.GEO.SB * s * 1.06, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,' + (0.32 * al * al).toFixed(3) + ')';
          ctx.beginPath();
          ctx.ellipse(0, 0, S.GEO.SA * s * 0.92, S.GEO.SB * s * 0.92, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      /* 場景壓暗，讓複製品與結果區浮出來 */
      const vign = smooth(T_REVEAL, T_REVEAL + REVEAL_LEN * 0.8, t) * 0.2
        * (1 - smooth(T_FLY + FLY_LEN * 0.8, T_TOTAL - 120, t));
      if (vign > 0.002) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = 'rgba(4,7,12,' + vign.toFixed(3) + ')';
        ctx.fillRect(0, 0, cv.width / dpr, cv.height / dpr);
      }

      /* ── ③ 乾淨複製：掃描線自上而下顯影（顏色／形變對上原圖；起飛後交棒給 ④）── */
      const revealP = clamp01((t - T_REVEAL) / REVEAL_LEN);
      if (revealP > 0 && t < T_FLY) {
        const rv = easeInOut(revealP);
        const lift = (t >= T_LIFT && t < T_LIFT + LIFT_LEN)
          ? Math.sin(Math.PI * (t - T_LIFT) / LIFT_LEN) * 0.03 : 0;
        const xl = {
          m00: x.m00 * (1 + lift), m01: x.m01 * (1 + lift),
          m10: x.m10 * (1 + lift), m11: x.m11 * (1 + lift), e: x.e, f: x.f
        };
        const bx = x.e - plateHx, by = x.f - plateHy, bw = plateHx * 2, bh = plateHy * 2;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        ctx.rect(bx, by, bw, Math.max(1, bh * rv));
        ctx.clip();
        ctx.beginPath();
        ctx.ellipse(x.e, x.f, plateHx, plateHy, plateAng, 0, Math.PI * 2);
        ctx.clip();
        const q = rxf(xl);
        setR(q.a, q.b, q.c, q.d, q.e, q.f);
        ctx.drawImage(cleanCv, 0, 0);
        ctx.restore();
        if (rv < 1) {
          const ly = by + bh * rv;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.beginPath();
          ctx.ellipse(x.e, x.f, plateHx, plateHy, plateAng, 0, Math.PI * 2);
          ctx.clip();
          const band = ctx.createLinearGradient(0, ly - 15, 0, ly + 3);
          band.addColorStop(0, 'rgba(160,210,255,0)');
          band.addColorStop(0.72, 'rgba(190,225,255,0.45)');
          band.addColorStop(1, 'rgba(255,255,255,0.92)');
          ctx.fillStyle = band;
          ctx.fillRect(bx, ly - 15, bw, 18);
          ctx.restore();
        }
      }

      /* ── ④ 往下飛行：圓形芝碼變幻成結果面板 ── */
      const fp = clamp01((t - T_FLY) / FLY_LEN);
      if (fp > 0) {
        const pe = easeInOut(fp);
        const sx0 = x.e - plateHx, sy0 = x.f - plateHy, sw0 = plateHx * 2, sh0 = plateHy * 2;
        const rx = lerp(sx0, target.x, pe), ry = lerp(sy0, target.y, pe);
        const rw = lerp(sw0, target.w, pe), rh = lerp(sh0, target.h, pe);
        const rad = lerp(Math.min(sw0, sh0) / 2, 0, pe);
        const cxr = rx + rw / 2, cyr = ry + rh / 2;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        roundRectPath(ctx, rx, ry, rw, rh, rad);
        ctx.clip();
        ctx.globalAlpha = Math.min(1, pe * 1.7) * 0.92;
        ctx.fillStyle = panelFill;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.globalAlpha = 1;
        /* 芝碼縮影隨飛行攤平（形變 → 正圓），最後淡出 */
        const aCode = (1 - smooth(0.55, 0.96, fp)) * (1 - 0.22 * pe);
        if (aCode > 0.01) {
          const sc = (Math.min(rw, rh) * 0.5 * (1 - 0.35 * pe)) / plateU;
          const mix = {
            m00: lerp(x.m00, sc, pe), m01: lerp(x.m01, 0, pe),
            m10: lerp(x.m10, 0, pe), m11: lerp(x.m11, sc, pe),
            e: lerp(x.e, cxr, pe), f: lerp(x.f, cyr, pe)
          };
          const q = rxf(mix);
          ctx.globalAlpha = aCode;
          setR(q.a, q.b, q.c, q.d, q.e, q.f);
          ctx.drawImage(cleanCv, 0, 0);
          ctx.globalAlpha = 1;
        }
        ctx.restore();

        /* 圓環 → 按鈕：下緣弧攤平成按鈕列 */
        const bq = smooth(0.16, 0.55, fp) * (1 - smooth(0.84, 1, fp));
        if (bq > 0.01) {
          const p0x = lerp(x.e - plateHx * 0.8, target.ax + 4, pe);
          const p0y = lerp(x.f + plateHy * 0.72, target.ay, pe);
          const p1x = lerp(x.e + plateHx * 0.8, target.ax + target.aw - 4, pe);
          const p1y = lerp(x.f + plateHy * 0.72, target.ay, pe);
          const cxq = (p0x + p1x) / 2, cyq = (p0y + p1y) / 2 + (1 - pe) * Math.max(plateHx, 30) * 0.85;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.strokeStyle = 'rgba(190,225,255,' + (0.7 * bq).toFixed(3) + ')';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.quadraticCurveTo(cxq, cyq, p1x, p1y);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * bq).toFixed(3) + ')';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.quadraticCurveTo(cxq, cyq, p1x, p1y);
          ctx.stroke();
        }

        /* 芝麻 → 文字：小點散開落進文字列 */
        const dA = smooth(0.18, 0.38, fp) * (1 - smooth(0.78, 0.98, fp));
        if (dA > 0.01) {
          for (let i = 0; i < dots.length; i++) {
            const d = dots[i];
            const qd = clamp01((fp - 0.18 - i * 0.035) / 0.5);
            if (qd <= 0 || qd >= 1) continue;
            const qe = easeInOut(qd);
            const sx = x.m00 * d.x + x.m01 * d.y + x.e;
            const sy = x.m10 * d.x + x.m11 * d.y + x.f;
            const tx = target.px + 10 + (dots.length > 1 ? i / (dots.length - 1) : 0.5) * Math.max(20, target.pw - 20);
            const ty = target.py;
            const px2 = lerp(sx, tx, qe), py2 = lerp(sy, ty, qe);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = 'rgba(220,240,255,' + (dA * Math.sin(Math.PI * qd)).toFixed(3) + ')';
            const sz = lerp(3.2, 1.8, qe);
            ctx.fillRect(px2 - sz / 2, py2 - sz / 2, sz, sz);
          }
        }

        /* 結果面板現身（文字模糊浮現、按鈕依序彈入） */
        if (!shown && fp >= 0.72) {
          shown = true;
          resEl.classList.remove('fx-pending', 'show');
          void resEl.offsetWidth;
          resEl.classList.add('show');
        }
      }

      cv.style.opacity = String(1 - smooth(T_FLY + FLY_LEN * 0.86, T_TOTAL - 100, t));
      fxRAF = requestAnimationFrame(frame);
    }
    fxRAF = requestAnimationFrame(frame);
    return true;
  }
  if ($('fs-fx-toggle')) {
    $('fs-fx-toggle').addEventListener('click', () => {
      fsFxOn = !fsFxOn;
      try { localStorage.setItem(FX_KEY, fsFxOn ? '1' : '0'); } catch (e) {}
      syncFsFxToggle();
      if (!fsFxOn) fxStop(true);
    });
    syncFsFxToggle();
  }

  function fsHit(r, hit) {
    if (fxRAF) fxStop(false);   // 舊動畫還在跑就中止，避免兩個迴圈搶同一顆 canvas
    fsLocked = true;
    $('fs-flash').classList.add('on');
    setTimeout(() => $('fs-flash').classList.remove('on'), 140);
    if (navigator.vibrate) navigator.vibrate(30);
    const text = r.text != null ? r.text : '';
    const payload = text || bytesToHex(r.bytes);
    $('fs-result').hidden = false;
    $('fs-result').classList.remove('fx-pending', 'show');
    $('fs-payload').textContent = payload;
    const url = safeUrl(text);
    $('fs-open').classList.toggle('hidden', !url);
    if (url) $('fs-open').dataset.url = url;
    $('fs-share').classList.toggle('hidden', !navigator.share);
    $('fs-copy').dataset.text = payload;
    fsStatus(t('fs.locked', { rings: r.rings }));
    $('fs-hint').hidden = true;
    showResult(r, 0);   // 同步寫進掃描器的紀錄
    /* 圖片掃描：把來源影像留在場景上（相機模式的凍結由 fxPlay 開啟） */
    if (hit && hit.kind === 'file') fsHoldStill(fxMakeHitCanvas(hit));
    /* 掃描效果：亮度環繞 → 芝麻波浪 → 乾淨複製 → 飛進結果區 */
    if (fsFxOn && hit && !fxReduced()) {
      if (fxPlay(hit, r)) return;      // 動畫結尾才把結果面板變換出來
    }
    $('fs-result').classList.remove('fx-pending');
  }
  function openFull() {
    if (fsSection.classList.contains('on')) return;
    fsSection.classList.add('on');
    fsSection.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('fs-result').hidden = true;
    $('fs-result').classList.remove('fx-pending', 'show');
    $('fs-hint').hidden = false;
    fxStop(false);
    fsClearBg();
    fillBands();
    startFsCam();
  }
  function closeFull() {
    if (!fsSection.classList.contains('on')) return;
    fsSection.classList.remove('on');
    fsSection.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopFsCam();
    fxStop(false);
    fsClearBg();
    $('fs-result').hidden = true;
    $('fs-result').classList.remove('fx-pending', 'show');
  }
  document.querySelectorAll('[data-fullscreen]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); go('#full'); }));
  $('fs-close').addEventListener('click', () => go('#scan'));
  $('fs-again').addEventListener('click', () => {
    fxStop(false);
    fsClearBg();
    $('fs-result').hidden = true;
    $('fs-result').classList.remove('fx-pending', 'show');
    $('fs-hint').hidden = false;
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
        if (r.ok) fsHit(r, { data: frame.data, w, h, kind: 'file' });
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

  /* ---------------------------------------------------- 建置標記
   * 頁面的 data-build 與各資源的 ?v= 一起更新（見 app/index.html）。
   * 用途：合併後若還看到舊畫面，看頁尾這行就能判斷瀏覽器是不是還在跑舊檔；
   * 舊分頁會把 JS 留在記憶體裡，必須重新整理（Pages 對 HTML/JS 另有 10 分鐘快取）。 */
  const BUILD = document.documentElement.getAttribute('data-build') || '';
  if (BUILD) {
    const bn = $('build-note');
    if (bn) bn.textContent = 'build ' + BUILD;
    if (window.console && console.info) console.info('[SesameCode] build ' + BUILD);
  }

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
  window.addEventListener('beforeunload', () => { stopMainCam(); stopFsCam(); fxStop(false); });
})();

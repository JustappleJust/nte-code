/* 芝碼 核心測試：編碼 → 光柵化 → 解碼（各種姿態/雜訊/解析度） */
const S = require('../src/sesame-core.js');
const { encodePNG } = require('./png.js');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const SAVE = args.includes('--save');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + name + (extra ? '  ' + extra : '')); }
  else { fail++; failures.push(name); console.log('  \x1b[31m✗\x1b[0m ' + name + (extra ? '  ' + extra : '')); }
}

function roundTrip(text, opts, render) {
  const enc = S.encode(text, opts);
  if (!enc.ok) return { enc };
  const img = S.renderCode(enc, render);
  const t0 = Date.now();
  const dec = S.decodeImage(img, {});
  dec.ms = Date.now() - t0;
  return { enc, img, dec };
}

console.log('\n=== 1. 基本往返（無失真、正立） ===');
for (const text of ['嗨！異環', 'BSG-2026', 'A', '唄果・芝碼 SesameCode v1', 'x'.repeat(40)]) {
  const { enc, dec, img } = roundTrip(text, { ecLevel: 1 }, { pxPerUnit: 12 });
  const ok = dec.ok && dec.bytes.length >= enc.bytes.length &&
    enc.bytes.every((b, i) => dec.bytes[i] === b) && dec.text === text;
  check(`"${text.slice(0, 18)}"${text.length > 18 ? '…' : ''} → V${enc.version}/H${enc.ecKey} ${enc.dataBytes}B`, ok,
    dec.ok ? `解出 ${dec.bytes.length}B / 修正 ${dec.correctedBytes}/${enc.corrected} / ${dec.stats.ms0 || ''}` : 'error=' + dec.error);
  if (SAVE && img) fs.writeFileSync(`${OUT}/basic_${enc.version}_${text.length}.png`, encodePNG(img.data, img.width, img.height));
}

console.log('\n=== 2. 圈數 / 容量表（格數由內外環比例決定） ===');
for (let v = S.GEO.MIN_VERSION; v <= S.GEO.MAX_VERSION; v++) {
  const caps = S.EC_LEVELS.map((l, i) => S.ecPlan(v, i).data);
  console.log(`  ${String(v).padStart(2)} 圈: 格數 ${String(S.totalCells(v)).padStart(4)}  內外比 ${(S.frameInner(v) / S.frameOuter(v)).toFixed(4)}  外框半徑 ${S.frameOuter(v).toFixed(1)}u  →  L:${caps[0]} M:${caps[1]} Q:${caps[2]} H:${caps[3]} bytes`);
}

console.log('\n=== 3. 各種旋轉 ===');
const data = 'rot-test-資料';
for (const rot of [0, 7, 33, 90, 137, 180, 233, 270, 350]) {
  const { enc, dec } = roundTrip(data, { ecLevel: 1 }, { pxPerUnit: 9, rotDeg: rot });
  check(`旋轉 ${rot}°`, dec.ok && dec.text === data, dec.ok ? '' : dec.error);
}

console.log('\n=== 4. 解析度掃描（px / 單位） ===');
for (const ppu of [16, 12, 9, 7, 6, 5, 4.5, 4, 3.5, 3, 2.5, 2]) {
  const { enc, dec } = roundTrip('解析度測試 res', { ecLevel: 1 }, { pxPerUnit: ppu, rotDeg: 17 });
  check(`${ppu} px/unit (芝麻長邊 ${(ppu * 2).toFixed(1)}px)`, dec.ok, dec.ok ? '' : dec.error);
}

console.log('\n=== 5. 拍照劣化（模糊/雜訊/光照/縮圖） ===');
const cases = [
  ['僅模糊 σ=1.2', { blur: 1.2 }],
  ['模糊 σ=2.0', { blur: 2.0 }],
  ['模糊 σ=3.0 + 雜訊', { blur: 3.0, noise: 12 }],
  ['雜訊 σ=20', { noise: 20 }],
  ['光照漸層', { lightGradient: 0.35 }],
  ['暗角', { vignette: 0.3 }],
  ['漸層+雜訊+模糊', { lightGradient: 0.3, noise: 10, blur: 1.5 }],
  ['低解析+模糊', { pxPerUnit: 5, blur: 1.4, noise: 8 }]
];
for (const [name, r] of cases) {
  const { enc, dec } = roundTrip('拍照情境 camera test 🎥', { ecLevel: 2 }, Object.assign({ pxPerUnit: 10, rotDeg: 21 }, r));
  check(name, dec.ok, dec.ok ? `修 ${dec.correctedBytes}/${enc.corrected} bytes` : dec.error);
  if (SAVE) { const im = S.renderCode(enc, Object.assign({ pxPerUnit: 10, rotDeg: 21 }, r)); fs.writeFileSync(`${OUT}/degrade_${name.replace(/[^\w]/g, '_')}.png`, encodePNG(im.data, im.width, im.height)); }
}

console.log('\n=== 6. 二值化極性反轉（白線黑底） ===');
{
  const { enc, img } = roundTrip('inverted', { ecLevel: 1 }, { pxPerUnit: 9 });
  // 反轉
  for (let i = 0; i < img.data.length; i += 4) { img.data[i] = 255 - img.data[i]; img.data[i + 1] = 255 - img.data[i + 1]; img.data[i + 2] = 255 - img.data[i + 2]; }
  const dec = S.decodeImage(img, {});
  check('白線黑底', dec.ok && dec.text === 'inverted', dec.ok ? '' : dec.error);
}

console.log('\n=== 7. 鏡像 / 錯誤資料 ===');
{
  const { enc, img } = roundTrip('mirror-me', { ecLevel: 1 }, { pxPerUnit: 9 });
  const m = { data: new Uint8ClampedArray(img.data.length), width: img.width, height: img.height };
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const si = (y * img.width + x) * 4, di = (y * img.width + (img.width - 1 - x)) * 4;
    m.data[di] = img.data[si]; m.data[di + 1] = img.data[si + 1]; m.data[di + 2] = img.data[si + 2]; m.data[di + 3] = 255;
  }
  const dec = S.decodeImage(m, {});
  check('鏡像影像', dec.ok && dec.text === 'mirror-me', dec.ok ? (dec.mirror ? '偵測為鏡像' : '') : dec.error);
  fs.writeFileSync(`${OUT}/mirror.png`, encodePNG(m.data, m.width, m.height));
}

console.log('\n=== 8. 二進位資料 ===');
{
  const bytes = new Uint8Array(64);
  for (let i = 0; i < 64; i++) bytes[i] = (i * 37 + 11) & 0xff;
  const enc = S.encode(bytes, { ecLevel: 0 });
  const img = S.renderCode(enc, { pxPerUnit: 10 });
  const dec = S.decodeImage(img, {});
  const same = dec.ok && dec.bytes.length >= 64 && bytes.every((b, i) => dec.bytes[i] === b);
  check('64 bytes 隨機二進位（含 0x00/0xFF）', same, dec.ok ? '' : dec.error);
  console.log('  文字欄位（非 UTF-8 應為 null）:', dec.ok ? String(dec.text) : '-');
  fs.writeFileSync(`${OUT}/binary.png`, encodePNG(img.data, img.width, img.height));
}

console.log('\n=== 8b. 最大容量（高密度芝碼） ===');
{
  const capL = S.ecPlan(S.GEO.MAX_VERSION, 0).data;
  const payload = new Uint8Array(capL).fill(0).map((_, i) => (i * 37 + 11) & 255);
  const enc = S.encode(payload, { ecLevel: 0 });
  check(`滿載 ${capL} bytes（L 級）可編碼`, enc.ok && enc.rings === S.GEO.MAX_VERSION, enc.ok ? `${enc.rings} 圈 / ${enc.totalCells} 格` : enc.error);
  const img = S.renderCode(enc, { pxPerUnit: 6, marginU: 2 });
  const dec = S.decodeImage(img, {});
  check('滿載芝碼可解碼且內容一致', dec.ok && dec.bytes.length === payload.length && dec.bytes.every((b, i) => b === payload[i]),
    dec.ok ? `${img.width}px @6px/u` : dec.error);
  // 自動圈數選擇：200 bytes 應該落在 15–16 圈
  const auto = S.encode(new Uint8Array(200).fill(9), { ecLevel: 0 });
  check('200 bytes 自動選到 15 圈以上', auto.ok && auto.rings >= 15, auto.ok ? auto.rings + ' 圈' : auto.error);
  // 超出容量要明確報錯（且訊息帶正確上限）
  const tooBig = S.encode(new Uint8Array(S.ecPlan(S.GEO.MAX_VERSION, 0).data + 1).fill(1), { ecLevel: 0 });
  check('超過上限會明確拒絕', !tooBig.ok && /容量/.test(tooBig.error), tooBig.error || '（未拒絕）');
}

console.log('\n=== 9. 各種圈數（自動） ===');
for (const n of [16, 30, 45, 60, 80]) {
  const txt = '內容'.repeat(1) + 'x'.repeat(n);
  const { enc, dec } = roundTrip(txt, { ecLevel: 1 }, { pxPerUnit: 8 });
  check(`${enc.version} 圈（內容 ${enc.bytes.length}B）`, dec.ok && dec.text === txt,
    dec.ok ? `外框半徑 ${S.frameOuter(enc.version).toFixed(1)}u` : dec.error);
}

console.log('\n=== 9b. 切口長度碼（4 段 × 長度 2~4 格 = 19 種組合） ===');
{
  let all = true, worst = '';
  for (let fmt = 0; fmt < 4; fmt++) {
    for (let ec = 0; ec < 4; ec++) {
      const h = S.headerEncode(fmt, ec);
      if (!h) { all = false; worst = 'encode-fail ' + fmt + '/' + ec; continue; }
      const sum = h.widths.reduce((a, b) => a + b, 0);
      if (sum !== S.GEO.META_MODULES) { all = false; worst = 'sum=' + sum; }
    }
  }
  check('16 種 (格式版本, 糾錯) 皆有對應的長度組合且總和 = 12 格', all, worst);
  console.log('  組合總數（含 3 組保留）:', S.META_PATTERNS.length);
  // 容錯：量測值加入「總和守恆」的交替偏移（模擬端帽修正後的殘差）仍應還原
  const errs = [0, 0.2, -0.2, 0.4, -0.4];
  let okAll = true, bad = '';
  for (let fmt = 0; fmt < 4; fmt++) for (let ec = 0; ec < 4; ec++) {
    const h = S.headerEncode(fmt, ec);
    for (const e of errs) {
      const w = h.widths.map((x, i) => x + e * (i % 2 ? -1 : 1));
      const d = S.headerDecode(w);
      if (!d.ok || d.fmt !== fmt || d.ecIdx !== ec) { okAll = false; bad = `${fmt}/${ec} e=${e} → ${JSON.stringify(d)}`; }
    }
  }
  check('每段量測誤差 ±0.4 格（總和守恆）內仍可正確還原', okAll, bad);
  // 管道另有 exact 檢查：單段誤差須 ≤ 0.45 格（= 2.25°）
  const probe = S.headerDecode([3.4, 2.6, 3.4, 2.6]);       // [3,3,3,3] = 索引 9 = (格式 2, 糾錯 1)
  check('單段誤差 0.4 格仍判定為 exact（管道接受）', probe.ok && probe.exact && probe.fmt === 2 && probe.ecIdx === 1);
  const over = S.headerDecode([3.45, 2.55, 3.45, 2.55]);    // 距最近組合 0.45 格以上
  check('單段誤差超過 0.45 格會被 exact 檢查擋下（避免誤判）', over.ok && !over.exact);
}

console.log('\n=== 10. 暴力：隨機旋轉 + 劣化 100 次 ===');
{
  let ok = 0, total = 0;
  const rnd = (() => { let a = 7; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
  const t0 = Date.now();
  for (let i = 0; i < 100; i++) {
    const len = 4 + Math.floor(rnd() * 40);
    let t = ''; for (let k = 0; k < len; k++) t += String.fromCharCode(0x20 + Math.floor(rnd() * 90));
    const enc = S.encode(t, { ecLevel: 1 + (i % 3) });
    if (!enc.ok) continue;
    const img = S.renderCode(enc, {
      pxPerUnit: 5 + rnd() * 8, rotDeg: rnd() * 360,
      blur: rnd() * 2, noise: rnd() * 10, lightGradient: rnd() * 0.25, vignette: rnd() * 0.2
    });
    const dec = S.decodeImage(img, {});
    total++;
    if (dec.ok && dec.text === t) ok++;
    else if (i < 5 || ok / total < 0.9) console.log(`    miss#${i}: ppu=${img.pxPerUnit} ${dec.error || ('text mismatch ' + JSON.stringify(dec.text))}`);
  }
  console.log(`  成功率 ${ok}/${total} = ${(100 * ok / total).toFixed(1)}%  平均耗時 ${((Date.now() - t0) / total).toFixed(1)} ms`);
  check('隨機姿態成功率 ≥ 95%', ok / total >= 0.95);
}

console.log(`\n=== 結果：${pass} 通過 / ${fail} 失敗 ===`);
if (fail) { console.log('失敗項目:'); failures.forEach(f => console.log(' - ' + f)); process.exit(1); }

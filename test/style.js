/* 芝碼：外觀樣式測試（顏色 / 漸層 / 透明 / 留白 / 對比度 / SVG）
 * 用法： node test/style.js [--save]
 */
const S = require('../src/sesame-core.js');
const { encodePNG } = require('./png.js');
const fs = require('fs');
const path = require('path');

const SAVE = process.argv.includes('--save');
const OUT = path.join(__dirname, 'out');
if (SAVE) fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + name + (extra ? '  ' + extra : '')); }
  else { fail++; failures.push(name); console.log('  \x1b[31m✗\x1b[0m ' + name + (extra ? '  ' + extra : '')); }
}

const TEXT = '嗨！異環・芝碼 BSG-2026';
const geom = S.encode(TEXT, { ecLevel: 2 });
const PPU = 10;

/** 把 RGBA 疊在不透明底色上（模擬紙張 / 深色底材） */
function composite(img, bg) {
  const out = new Uint8ClampedArray(img.data.length);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3] / 255;
    for (let k = 0; k < 3; k++) out[i * 4 + k] = img.data[i * 4 + k] * a + bg[k] * (1 - a);
    out[i * 4 + 3] = 255;
  }
  return { data: out, width: img.width, height: img.height };
}
const px = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

console.log('\n=== 1. 顏色 ===');
{
  const img = S.renderCode(geom, { pxPerUnit: PPU, inkRGB: [60, 30, 10], bgRGB: [250, 244, 230] });
  const corner = px(img, 2, 2), center = px(img, (img.width / 2) | 0, (img.height / 2) | 0);
  check('背景色套用（角落 = 指定底色）', corner[0] === 250 && corner[1] === 244 && corner[2] === 230 && corner[3] === 255, JSON.stringify(corner));
  check('不透明（alpha = 255）', center[3] === 255);
  const dec = S.decodeImage(img, {});
  check('棕墨 + 米底可解碼', dec.ok && dec.text === TEXT, dec.ok ? `${dec.rings} 圈` : dec.error);
  if (SAVE) fs.writeFileSync(`${OUT}/style_solid.png`, encodePNG(img.data, img.width, img.height));
}

console.log('\n=== 2. 漸層 ===');
{
  const img = S.renderCode(geom, {
    pxPerUnit: PPU,
    inkStyle: { from: [24, 34, 92], to: [122, 22, 96], angle: 45 },
    bgStyle: { from: [255, 255, 250], to: [214, 236, 214], angle: 90 }
  });
  const tl = px(img, 6, 6), br = px(img, img.width - 6, img.height - 6);
  check('背景漸層沿著角度變化', Math.abs(tl[0] - br[0]) + Math.abs(tl[1] - br[1]) + Math.abs(tl[2] - br[2]) > 12,
    `${JSON.stringify(tl)} → ${JSON.stringify(br)}`);
  const dec = S.decodeImage(img, {});
  check('雙漸層（墨 + 底）可解碼', dec.ok && dec.text === TEXT, dec.ok ? `${dec.rings} 圈` : dec.error);
  if (SAVE) fs.writeFileSync(`${OUT}/style_gradient.png`, encodePNG(img.data, img.width, img.height));
}

console.log('\n=== 3. 透明 ===');
{
  const img = S.renderCode(geom, { pxPerUnit: PPU, inkStyle: { from: [36, 26, 20], to: [92, 40, 30], angle: 90 }, bgStyle: { from: [255, 255, 255], alpha: 0 } });
  check('背景透明（alpha = 0）', px(img, 2, 2)[3] === 0, 'alpha=' + px(img, 2, 2)[3]);
  const dOverLight = S.decodeImage(composite(img, [236, 232, 222]), {});
  check('疊在淺色底材上可解碼', dOverLight.ok && dOverLight.text === TEXT, dOverLight.ok ? '' : dOverLight.error);
  const lightInk = S.renderCode(geom, { pxPerUnit: PPU, inkRGB: [255, 248, 240], bgStyle: { from: [255, 255, 255], alpha: 0 } });
  const dOverDark = S.decodeImage(composite(lightInk, [38, 42, 50]), {});
  check('淺墨 + 透明底疊在深色底材（反相）也可解碼', dOverDark.ok && dOverDark.text === TEXT, dOverDark.ok ? '' : dOverDark.error);
  // 挖空：墨 = 透明洞（把背景挖掉），實際對比取決於底材
  const cut = S.renderCode(geom, { pxPerUnit: PPU, inkStyle: { from: [0, 0, 0], cutout: true }, bgRGB: [64, 66, 74] });
  const dCut = S.decodeImage(composite(cut, [236, 230, 220]), {});
  check('挖空（墨為透明洞）+ 淺色底材可解碼', dCut.ok && dCut.text === TEXT, dCut.ok ? '' : dCut.error);
  const semi = S.renderCode(geom, { pxPerUnit: PPU, inkStyle: { from: [30, 30, 30], alpha: 0.6 }, bgRGB: [248, 246, 240] });
  const dSemi = S.decodeImage(semi, {});
  check('半透明墨（60%）可解碼', dSemi.ok && dSemi.text === TEXT, dSemi.ok ? '' : dSemi.error);
  if (SAVE) fs.writeFileSync(`${OUT}/style_transparent.png`, encodePNG(img.data, img.width, img.height));
}

console.log('\n=== 4. 留白（圖形留白範圍） ===');
{
  const sizes = [];
  for (const m of [0.5, 2, 6]) {
    const img = S.renderCode(geom, { pxPerUnit: PPU, marginU: m, inkRGB: [30, 30, 30], bgRGB: [248, 248, 245] });
    sizes.push(img.width);
    const dec = S.decodeImage(img, {});
    check(`留白 ${m}u 可解碼（${img.width}px）`, dec.ok && dec.text === TEXT, dec.ok ? '' : dec.error);
  }
  check('留白越大畫布越大', sizes[0] < sizes[1] && sizes[1] < sizes[2], sizes.join(' < '));
  const expect = Math.ceil(2 * (S.frameOuter(geom.rings) + 6) * PPU);
  check('畫布尺寸 = 2 ×（外框半徑 + 留白）× ppu', sizes[2] === expect, `${sizes[2]} vs ${expect}`);
}

console.log('\n=== 4b. 圓形底盤（外形 = circle） ===');
{
  const img = S.renderCode(geom, { pxPerUnit: PPU, marginU: 3, shape: 'circle', inkRGB: [24, 30, 60], bgRGB: [247, 244, 236] });
  const W = img.width;
  const corner = px(img, 1, 1), midEdge = px(img, (W / 2) | 0, 1), inside = px(img, (W / 2) | 0, Math.round(W * 0.2));
  check('圓外透明（四角 alpha = 0）', corner[3] === 0, 'alpha=' + corner[3]);
  check('上下邊中點也在圓外（正圓而非橢圓）', midEdge[3] === 0, 'alpha=' + midEdge[3]);
  check('圓盤內不透明', inside[3] === 255);
  const plateR = (S.frameOuter(geom.rings) + 3) * PPU;
  const probe = (r) => px(img, Math.round(W / 2 + r), Math.round(W / 2))[3];
  check('底盤半徑 = 外框 + 留白（外圍另留 0.5u 透明）',
    probe(Math.round(plateR) - 3) === 255 && probe(Math.round(plateR) + 4) === 0 && probe(Math.round(W / 2) - 2) === 0,
    `r=${plateR.toFixed(0)}px、畫布半寬 ${(W / 2).toFixed(0)}px：底盤內 ${probe(Math.round(plateR) - 3)}、底盤外 ${probe(Math.round(plateR) + 4)}、畫布邊 ${probe(Math.round(W / 2) - 2)}`);
  const dec = S.decodeImage(img, {});
  check('圓形芝碼可直接解碼（alpha 視為暗色）', dec.ok && dec.text === TEXT, dec.ok ? '' : dec.error);
  // 貼在淺色 / 深色底材上
  const dLight = S.decodeImage(composite(img, [238, 233, 224]), {});
  check('貼在淺色底材可解碼', dLight.ok && dLight.text === TEXT, dLight.ok ? '' : dLight.error);
  const dDark = S.decodeImage(composite(img, [38, 42, 52]), {});
  check('貼在深色底材可解碼', dDark.ok && dDark.text === TEXT, dDark.ok ? '' : dDark.error);
  if (SAVE) fs.writeFileSync(`${OUT}/style_circle.png`, encodePNG(img.data, img.width, img.height));
}
{
  const sq = S.toSVG(geom, { px: 256 });
  const ci = S.toSVG(geom, { px: 256, shape: 'circle', bgRGB: [240, 240, 235], marginU: 3 });
  check('SVG 方形不含 clipPath、圓形含圓形 clipPath',
    !/clipPath/.test(sq) && /<clipPath id="plate"><circle/.test(ci) && /clip-path="url\(#plate\)"/.test(ci));
  const m = ci.match(/<clipPath id="plate"><circle[^>]*r="([\d.]+)"/);
  check('SVG 底盤半徑正確', m && Math.abs(+m[1] - (S.frameOuter(geom.rings) + 3) * 64) < 0.01, m && m[1]);
}

console.log('\n=== 5. 對比度檢查（WCAG） ===');
{
  check('黑白 = 21:1', Math.abs(S.contrastRatio([0, 0, 0], [255, 255, 255]) - 21) < 0.01);
  check('同色 = 1:1', Math.abs(S.contrastRatio([128, 128, 128], [128, 128, 128]) - 1) < 1e-6);
  const good = S.styleContrast({ from: [30, 30, 30] }, { from: [245, 245, 240] });
  check('深墨 + 亮底 → 通過（≥ 4.5:1）', good.ok && !good.weak && good.ratio > 10, good.ratio.toFixed(1) + ':1');
  const weak = S.styleContrast({ from: [120, 120, 120] }, { from: [190, 190, 190] });
  check('灰墨 + 灰底 → 警示（1.5–3:1）', weak.bad || weak.weak, weak.ratio.toFixed(2) + ':1');
  const grad = S.styleContrast({ from: [20, 20, 90], to: [40, 60, 150] }, { from: [250, 250, 250], to: [200, 205, 215] });
  const pairs = [
    [20, 20, 90, 250, 250, 250], [20, 20, 90, 200, 205, 215],
    [40, 60, 150, 250, 250, 250], [40, 60, 150, 200, 205, 215]
  ].map(p => S.contrastRatio([p[0], p[1], p[2]], [p[3], p[4], p[5]]));
  check('漸層 → 取最差配對', Math.abs(grad.ratio - Math.min(...pairs)) < 1e-9, grad.ratio.toFixed(2) + ':1');
  const tr = S.styleContrast({ from: [30, 30, 30] }, { from: [255, 255, 255], alpha: 0 });
  check('背景透明 → 標記 transparent 且視為未通過', tr.transparent && tr.bgAlpha === 0);
}

console.log('\n=== 6. SVG 輸出 ===');
{
  const plain = S.toSVG(geom, { px: 256 });
  check('純色：無 <defs>、含預設墨色與白底', !/<defs>/.test(plain) && /#111111/.test(plain) && /fill="#ffffff"/.test(plain));
  const grad = S.toSVG(geom, { px: 256, inkStyle: { from: [20, 30, 80], to: [120, 20, 90], angle: 45 }, bgStyle: { from: [250, 250, 240], to: [220, 235, 220] } });
  check('漸層：產生 2 個 linearGradient 且被 fill 引用', (grad.match(/<linearGradient/g) || []).length === 2 && /fill="url\(#inkg\d\)"/.test(grad) && /fill="url\(#bgg\d\)"/.test(grad));
  const trans = S.toSVG(geom, { px: 256, inkRGB: [200, 10, 10], bgStyle: { from: [255, 255, 255], alpha: 0 } });
  check('透明背景：不輸出背景矩形、墨色正確', !/<rect/.test(trans) && /#c80a0a/.test(trans));
  const half = S.toSVG(geom, { px: 256, inkStyle: { from: [0, 0, 0], alpha: 0.5 } });
  check('墨半透明：輸出 fill-opacity', /fill-opacity="0.500"/.test(half));
  const cut = S.toSVG(geom, { px: 256, inkStyle: { from: [0, 0, 0], cutout: true }, bgRGB: [120, 60, 30] });
  check('挖空：以 <mask> 挖掉紋樣、背景仍有顏色', /<mask id="cutm"/.test(cut) && /mask="url\(#cutm\)"/.test(cut) && /#783c1e/.test(cut));
  check('viewBox 隨留白改變', S.toSVG(geom, { px: 100, marginU: 0.5 }) !== S.toSVG(geom, { px: 100, marginU: 6 }));
  if (SAVE) fs.writeFileSync(`${OUT}/style_gradient.svg`, grad);
}

console.log('\n=== 7. 預設外觀不受影響 ===');
{
  const img = S.renderCode(geom, { pxPerUnit: PPU });
  const c = px(img, 2, 2), d = px(img, (img.width / 2) | 0, (img.height / 2) | 0);
  check('預設仍是灰階（r = g = b）且底 246 / 墨 28',
    c[0] === c[1] && c[1] === c[2] && c[0] === 246 && d[0] === d[1] && d[1] === d[2], `${JSON.stringify(c)} ${JSON.stringify(d)}`);
  check('預設 alpha 全為 255', c[3] === 255 && d[3] === 255);
}

console.log('\n=== 8. encodePNG（導出用 RGBA） ===');
{
  const w = 3, h = 2;
  const rgba = new Uint8ClampedArray([
    255, 0, 0, 255,  0, 255, 0, 128,  0, 0, 255, 0,
    10, 20, 30, 40,  50, 60, 70, 80,  90, 100, 110, 120
  ]);
  const png = S.encodePNG(rgba, w, h);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  check('PNG 檔頭', sig.every((b, i) => png[i] === b), `len=${png.length}`);
  const ihdrLen = (png[8] << 24) | (png[9] << 16) | (png[10] << 8) | png[11];
  const ihdrType = String.fromCharCode(png[12], png[13], png[14], png[15]);
  const ihdrW = (png[16] << 24) | (png[17] << 16) | (png[18] << 8) | png[19];
  const ihdrH = (png[20] << 24) | (png[21] << 16) | (png[22] << 8) | png[23];
  check('IHDR RGBA 8-bit', ihdrLen === 13 && ihdrType === 'IHDR' && ihdrW === w && ihdrH === h && png[24] === 8 && png[25] === 6);
  let threw = false;
  try { S.encodePNG(rgba, 0, 1); } catch (e) { threw = true; }
  check('拒絕無效尺寸', threw);
  const img = S.renderCode(geom, { pxPerUnit: 4, shape: 'circle', bgStyle: { from: [255, 255, 255], alpha: 0 }, inkRGB: [20, 20, 20] });
  const out = S.encodePNG(img.data, img.width, img.height);
  check('圓形透明芝碼可編碼', out.length > 100 && out[0] === 0x89 && out[out.length - 8] === 'I'.charCodeAt(0));
  if (SAVE) fs.writeFileSync(`${OUT}/style_encodepng.png`, Buffer.from(out));
}

console.log(`\n=== 結果：${pass} 通過 / ${fail} 失敗 ===`);
if (failures.length) { console.log('失敗項目:'); failures.forEach(f => console.log(' - ' + f)); }
process.exit(fail ? 1 : 0);

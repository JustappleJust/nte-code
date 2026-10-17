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

console.log('\n=== 6b. SVG 尺寸換算（巨大留白回歸）===');
/* toSVG 把 viewBox 定为每 u = UPX 個單位；幾何座標必須同步乘上 UPX，
   否則圖形停在 u 尺度 → 成品只有畫布的 1/64，四周全是空白。 */
const UPX = 64;
/** 解析 SVG 實際畫出的圖形，回傳離原点的最大半徑（viewBox 單位） */
function svgInkRadius(svg) {
  let max = 0;
  for (const m of svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)) {
    const t = m[1].match(/[MLAZ]|-?\d*\.?\d+/g) || [];
    for (let i = 0; i < t.length; i++) {
      if (t[i] === 'M' || t[i] === 'L') max = Math.max(max, Math.hypot(+t[i + 1], +t[i + 2]));
      else if (t[i] === 'A') {                       // A rx ry rot large sweep x y
        max = Math.max(max, +t[i + 1], Math.hypot(+t[i + 6], +t[i + 7]));
        i += 7;
      }
    }
  }
  for (const m of svg.matchAll(/<ellipse[^>]*\/>/g)) {
    const at = {};
    for (const a of m[0].matchAll(/(\w+)="(-?[\d.]+)"/g)) at[a[1]] = +a[2];
    max = Math.max(max, Math.hypot(at.cx, at.cy) + Math.max(at.rx, at.ry));
  }
  return max;
}
const vbOf = svg => /viewBox="([^"]+)"/.exec(svg)[1].split(' ').map(Number);
{
  const R6 = S.frameOuter(geom.rings), marginU = 2, PAD = { square: 0, circle: 0.5, label: 4.9 };
  for (const [shape, padU] of Object.entries(PAD)) {
    const o = { px: 512, shape, marginU };
    if (shape === 'label') o.ringText = 'NTE · BAGEL';
    const svg = S.toSVG(geom, o);
    const [minx, miny, side] = vbOf(svg);
    const halfU = R6 + marginU + padU;                 // 內容半寬（u），與 renderCode 的 halfU 同義
    check(`${shape}：viewBox 邊長 = 2·(外框+留白+外邊)·${UPX}`, Math.abs(side - 2 * halfU * UPX) < 0.01,
      `實得 ${side.toFixed(1)}／預期 ${(2 * halfU * UPX).toFixed(1)}`);
    check(`${shape}：viewBox 以原點為中心`, Math.abs(minx + side / 2) < 0.01 && Math.abs(miny + side / 2) < 0.01);
    const ink = svgInkRadius(svg), ratio = ink / (side / 2);
    // 與 renderCode 完全相同的構圖比例：內容半徑 / 畫布半寬 = R6 / halfU
    const expect = R6 / halfU;
    if (shape === 'label') {
      check('label：標示文字超出外框但不超出畫布', ink > R6 * UPX && ink <= side / 2 + 0.01,
        `文字外緣 ${(ink / UPX).toFixed(2)}u、外框 ${R6}u、邊界 ${halfU}u`);
      check('label：內容仍占滿半寬（無巨大留白）', ratio > 0.85, `占 ${(ratio * 100).toFixed(1)}%`);
    } else {
      check(`${shape}：外框最外緣 =  viewBox 座標（R6·${UPX}）`, Math.abs(ink - R6 * UPX) < 0.05,
        `實得 ${ink.toFixed(1)}／預期 ${(R6 * UPX).toFixed(1)}`);
      check(`${shape}：留白比例與 PNG 相同`, Math.abs(ratio - expect) < 1e-6,
        `占半寬 ${(ratio * 100).toFixed(2)}%（PNG ${(expect * 100).toFixed(2)}%；未換算時只有 ${(expect / 32 * 100).toFixed(1)}%）`);
    }
    // 背景矩形必須恰好鋪滿 viewBox（多出來的就是空白邊）
    const bg = /<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg);
    check(`${shape}：背景矩形鋪滿 viewBox`, !!bg && Math.abs(+bg[1] + side / 2) < 0.01 && Math.abs(+bg[3] - side) < 0.01);
    // 輸出尺寸：px 直接是畫布邊長
    check(`${shape}：width/height 與 viewBox 同步縮放`, /width="512" height="512"/.test(svg));
  }
  // 圓形底盤：clip 半徑必須小於畫布半寬，否則四角裁不掉（與 PNG 不一致）
  const ci = S.toSVG(geom, { px: 512, shape: 'circle', marginU: 2 });
  const m = /<clipPath id="plate"><circle[^>]*r="([\d.]+)"/.exec(ci);
  check('圓形底盤 clip 有效：半徑 = (R6+留白)·64 且小於畫布半寬',
    !!m && +m[1] < vbOf(ci)[2] / 2 && Math.abs(+m[1] - (R6 + marginU) * UPX) < 0.01,
    m ? `底盤 ${(m[1] / UPX).toFixed(2)}u／畫布半寬 ${(vbOf(ci)[2] / 2 / UPX).toFixed(2)}u（外邊 0.5u）` : '缺少 clipPath');
  // 漸層跨度以 viewBox 為基準（角度 135° → 跨度 = 邊長）
  const gd = S.toSVG(geom, { px: 512, marginU: 2, inkStyle: { from: [0, 0, 0], to: [255, 255, 255], angle: 135 } });
  const gm = /<linearGradient[^>]*x1="(-?[\d.]+)"[^>]*y1="(-?[\d.]+)"[^>]*x2="(-?[\d.]+)"[^>]*y2="(-?[\d.]+)"/.exec(gd);
  check('漸層跨度 = viewBox 邊長（不被縮放錯誤拉偏）',
    !!gm && Math.abs(Math.abs(+gm[3] - +gm[1]) - vbOf(gd)[2]) < 0.02, gm && `span ${Math.abs(gm[3] - gm[1]).toFixed(1)}`);
  /* 芝麻橢圓的另外兩個地雷：旋轉角必須留在「角度」尺度（nu() 只能給座標），
     旋轉中心與半徑則必須是 viewBox 尺度。只量外接半徑抓不到這兩種錯。 */
  const sqSvg = S.toSVG(geom, { px: 512, marginU: 2 });
  const halfSq = vbOf(sqSvg)[2] / 2;
  const ellRe = /<ellipse cx="(-?[\d.]+)" cy="(-?[\d.]+)" rx="([\d.]+)" ry="([\d.]+)"[^>]*transform="rotate\((-?[\d.]+) (-?[\d.]+) (-?[\d.]+)\)"/g;
  const litCells = geom.cells.filter(c => c.state).length;
  let nEll = 0, badAng = 0, badCtr = 0, badSize = 0, maxAng = 0;
  for (const em of sqSvg.matchAll(ellRe)) {
    nEll++;
    const cx = +em[1], cy = +em[2], rx = +em[3], ry = +em[4];
    const ang = +em[5], tcx = +em[6], tcy = +em[7];
    maxAng = Math.max(maxAng, ang);
    if (!(ang >= 0 && ang < 720)) badAng++;              // 誤用 nu() 會變成數千度
    if (Math.abs(tcx - cx) > 0.01 || Math.abs(tcy - cy) > 0.01) badCtr++;
    if (Math.abs(rx - S.GEO.SA * UPX) > 0.01 || Math.abs(ry - S.GEO.SB * UPX) > 0.01
      || Math.hypot(cx, cy) + Math.max(rx, ry) > halfSq + 0.01) badSize++;
  }
  check('芝麻旋轉角維持角度尺度（未被 64 倍化）',
    nEll === litCells && badAng === 0,
    `${nEll}/${litCells} 顆，最大 ${maxAng.toFixed(1)}°（若 ×64 會是 ${(maxAng * 64).toFixed(0)}°）`);
  check('芝麻旋轉中心 = 橢圓中心（皆為 viewBox 尺度）', badCtr === 0, badCtr ? `${badCtr} 顆不一致` : '');
  check('芝麻半徑 = SA/SB·64 且落在畫布內', badSize === 0, badSize ? `${badSize} 顆超出` : '');
  // fill-opacity 也是「不能被 UPX 乘到」的數值（錯的話會變成 64.000 → 全部不透明）
  const ops = [...S.toSVG(geom, { px: 512, inkStyle: { from: [0, 0, 0], alpha: 0.5 }, bgStyle: { from: [255, 255, 255], alpha: 0.35 } })
    .matchAll(/fill-opacity="([\d.]+)"/g)].map(m => +m[1]);
  check('fill-opacity 為 0–1 的比例值（未被倍率污染成 64.000）',
    ops.length >= 2 && ops.every(v => v >= 0 && v <= 1), [...new Set(ops)].join(' / '));
  // 留白為 0 時內容正好滿版
  const tight = S.toSVG(geom, { px: 512, marginU: 0 });
  check('marginU = 0 時內容滿版（無殘留空白）',
    Math.abs(svgInkRadius(tight) * 2 - vbOf(tight)[2]) < 0.05,
    `半徑 ${(svgInkRadius(tight) / UPX).toFixed(2)}u／邊界 ${(vbOf(tight)[2] / 2 / UPX).toFixed(2)}u`);
  // 大圖數值精度：3 位小數在放大後仍遠小於一個畫素
  const big = S.toSVG(geom, { px: 4096 });
  const step = vbOf(big)[2] / 4096;                       // 1 畫素 = ? viewBox 單位
  check('座標解析度遠高於輸出尺寸（放大列印不鋸齒）', 0.01 < step / 8,
    `4096px 時 1 畫素 = ${step.toFixed(4)} 單位 > 字形 0.01／路徑 0.001`);
  if (SAVE) fs.writeFileSync(`${OUT}/style_fixed.svg`, big);
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

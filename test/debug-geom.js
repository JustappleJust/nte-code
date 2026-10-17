/* 診斷：印出外框候選、幾何擬合與各假設失敗原因 */
const S = require('../src/sesame-core.js');
const { encodePNG } = require('./png.js');
const fs = require('fs');

const text = process.argv[2] || '嗨！異環';
const ppu = +(process.argv[3] || 10);
const rot = +(process.argv[4] || 0);

const enc = S.encode(text, { ecLevel: 1 });
console.log('encode:', enc.ok ? `V${enc.version} ${enc.ecKey} data=${enc.dataBytes} ec=${enc.ecBytes} cells=${enc.totalCells}` : enc.error);
const img = S.renderCode(enc, { pxPerUnit: ppu, rotDeg: rot });
console.log('image:', img.width + 'x' + img.height, 'rot', rot, 'pxPerUnit', img.pxPerUnit);
fs.mkdirSync(require('path').join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(require('path').join(__dirname, 'out', 'dbg.png'), encodePNG(img.data, img.width, img.height));

// 手動跑管線
const I = S._internal;
let src = I.toGray(img);
console.log('gray', src.w, src.h);
src = I.downscale(src, 1280);
console.log('downscaled', src.w, src.h);
const mask = I.binarize(src, 0, 13);
let dark = 0; for (let i = 0; i < mask.length; i++) dark += mask[i];
console.log('dark pixels:', dark, (100 * dark / mask.length).toFixed(1) + '%');
const cc = I.labelComponents(mask, src.w, src.h, 300000);
console.log('components:', cc.count);
for (let l = 0; l < Math.min(cc.count, 12); l++) {
  const s = cc.stats[l];
  const bw = s.maxx - s.minx + 1, bh = s.maxy - s.miny + 1;
  console.log(`  #${l} area=${s.area} bbox=${bw}x${bh} fill=${(s.area / (bw * bh)).toFixed(3)} c=(${(s.sx / s.area).toFixed(0)},${(s.sy / s.area).toFixed(0)})`);
}
const cands = I.pickCandidates(cc, src.w, src.h);
console.log('candidates:', cands.map(c => c.label + ':' + c.score.toFixed(0)).join(' '));

// 對最佳候選做幾何診斷
if (cands.length) {
  const label = cands[0].label;
  const px = I.collectPixels(cc, src.w, src.h, label);
  console.log('pixels:', px.length);
  const s = cc.stats[label];
  let cx = (s.minx + s.maxx) / 2, cy = (s.miny + s.maxy) / 2;
  for (let it = 0; it < 4; it++) {
    const pts = I.envelope(px, src.w, 720, cx, cy);
    const rs = pts.map(p => p.r).sort((a, b) => a - b);
    const med = rs[rs.length >> 1];
    const keep = pts.filter(p => p.r > med * 0.86 && p.r < med * 1.45);
    let sx = 0, sy = 0; for (const p of keep) { sx += p.x; sy += p.y; }
    cx = sx / keep.length; cy = sy / keep.length;
    const fit = I.fitRing(keep,false); cxOf(pts)
    console.log(`  iter${it}: pts=${pts.length} keep=${keep.length} medR=${med.toFixed(1)} c=(${cx.toFixed(1)},${cy.toFixed(1)})`,
      fit ? `A=${fit.A.toFixed(2)} B=${fit.B.toFixed(2)} phi=${(fit.phi * 180 / Math.PI).toFixed(2)}` : 'fit=null');
  }
  // 內緣 & 內框
  const minR = new Float64Array(720).fill(Infinity);
  for (let i = 0; i < px.length; i++) {
    const p = px[i], x = p % src.w, y = (p / src.w) | 0;
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI * 2;
    const b = Math.min(719, (a / (Math.PI * 2) * 720) | 0);
    if (r < minR[b]) minR[b] = r;
  }
  const tmp = []; for (let b = 0; b < 720; b++) if (isFinite(minR[b])) tmp.push(minR[b]);
  tmp.sort((a, b) => a - b);
  console.log('  inner edge quartiles:', [0.1, 0.25, 0.5].map(q => tmp[Math.floor(tmp.length * q)].toFixed(1)).join(', '));
  const disc = cc.stats.findIndex((st, l) => l !== label && s.area > 30 && Math.hypot(st.sx / st.area - cx, st.sy / st.area - cy) < 50 && Math.sqrt(st.area / Math.PI) < 200);
  for (let l = 0; l < cc.count; l++) {
    if (l === label) continue;
    const st = cc.stats[l];
    const rr = Math.sqrt(st.area / Math.PI);
    const fill = st.area / ((st.maxx - st.minx + 1) * (st.maxy - st.miny + 1));
    if (rr > 8) console.log(`  other blob #${l}: r=${rr.toFixed(1)} fill=${fill.toFixed(2)} dist=${Math.hypot(st.sx / st.area - cx, st.sy / st.area - cy).toFixed(1)}`);
  }
  // 期望：外框外緣 / 內緣 / 內框
  const R6 = S.frameOuter(enc.version);
  console.log(`  理論: 外緣 ${R6}u, 內緣 ${S.frameInner(enc.version)}u, 內框 ${S.GEO.RI}u → 以 ppu=${ppu} 計 px: ${(R6 * ppu).toFixed(0)}, ${(S.frameInner(enc.version) * ppu).toFixed(0)}, ${(S.GEO.RI * ppu).toFixed(0)}`);
}

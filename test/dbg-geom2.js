const S = require('../src/sesame-core.js');
const C = require('./photo.js');

const text = 'BSG-2026';
const tilt = +(process.argv[2] || 0.7);
const W = 1200, H = 900, size = 900, SRC = 1400;
const enc = S.encode(text, { ecLevel: 1 });
const R6 = S.frameOuter(enc.version);
const ppu = (SRC / 2 - 10) / R6;
const img = S.renderCode(enc, { pxPerUnit: ppu, blur: 0.6, noise: 2 });
const quad = C.tiltedQuad(img.width, W, H, size, 1.234, tilt, 0);
const photo = C.shootPhoto(img.data, img.width, img.height, W, H, quad, { noise: 6, bg: [225, 214, 200], seed: 3 });
const I = S._internal;

// 真值：來源 → 照片
const Hsp = C.homography([[0, 0], [img.width, 0], [img.width, img.height], [0, img.height]], quad);
const Happly = (h, x, y) => { const d = h[6] * x + h[7] * y + 1; return { x: (h[0] * x + h[1] * y + h[2]) / d, y: (h[3] * x + h[4] * y + h[5]) / d }; };
const ctr = img.width / 2;
const truePt = (u, v) => Happly(Hsp, ctr + u * ppu, ctr + v * ppu);
const TAU = Math.PI * 2;

// 真值量測
const tc = truePt(0, 0);
let rsum = 0, rmin = 1e9, rmax = 0;
for (let a = 0; a < 360; a += 2) {
  const p = truePt(R6 * Math.cos(a * Math.PI / 180), R6 * Math.sin(a * Math.PI / 180));
  const r = Math.hypot(p.x - tc.x, p.y - tc.y);
  rsum += r; rmin = Math.min(rmin, r); rmax = Math.max(rmax, r);
}
console.log(`真值：中心 (${tc.x.toFixed(1)},${tc.y.toFixed(1)})  外緣平均半徑 ${(rsum / 180).toFixed(1)}  範圍 ${rmin.toFixed(1)}..${rmax.toFixed(1)}  (ratio ${(rmax / rmin).toFixed(3)})`);
console.log(`真值 px/unit ≈ ${(rsum / 180 / R6).toFixed(2)}`);

const src = I.downscale(I.toGray(photo), 1280);
const mask = I.binarize(src, 0, 13);
const cc = I.labelComponents(mask, src.w, src.h, 300000);
const cands = I.pickCandidates(cc, src.w, src.h);
console.log('candidates:', cands.slice(0, 5).map(c => c.label + ':' + c.score.toFixed(0)).join(' '));
const label = cands[0].label, st = cc.stats[label];
const px = I.collectPixels(cc, src.w, src.h, label);
console.log('blob area', st.area, 'bbox', st.maxx - st.minx + 1, 'x', st.maxy - st.miny + 1);
let cx = (st.minx + st.maxx) / 2, cy = (st.miny + st.maxy) / 2, fit = null, keep = null;
for (let it = 0; it < 6; it++) {
  const pts = I.envelope(px, src.w, 720, cx, cy);
  const rs = pts.map(p => p.r).sort((a, b) => a - b);
  const med = rs[rs.length >> 1];
  keep = pts.filter(p => p.r > med * 0.9 && p.r < med * 1.25);
  fit = I.fitRing(keep, false);
  if (!fit) break;
  cx += fit.a1; cy += fit.b1;
}
console.log(`擬合：中心 (${cx.toFixed(1)},${cy.toFixed(1)})  c0=${fit.c0.toFixed(1)} A=${fit.A.toFixed(1)} B=${fit.B.toFixed(1)} phi=${(fit.phi * 180 / Math.PI).toFixed(1)} resid=${fit.resid.toFixed(2)}`);
console.log(`→ 中心誤差 ${Math.hypot(cx - tc.x, cy - tc.y).toFixed(1)}px, 平均半徑誤差 ${(fit.c0 - rsum / 180).toFixed(1)}px`);

// 內框
let discR = null, dCx = 0, dCy = 0;
for (let l = 0; l < cc.count; l++) {
  if (l === label) continue; const s2 = cc.stats[l];
  const rr = Math.sqrt(s2.area / Math.PI), fx = s2.sx / s2.area, fy = s2.sy / s2.area;
  if (rr > 15 && Math.hypot(fx - cx, fy - cy) < fit.c0 * 0.4 && rr > (discR || 0)) { discR = rr; dCx = fx; dCy = fy; }
}
console.log(`內框：r=${discR && discR.toFixed(1)} 中心 (${dCx.toFixed(1)},${dCy.toFixed(1)}) 誤差 ${Math.hypot(dCx - tc.x, dCy - tc.y).toFixed(1)}px`);

// 模型精度：橢圓 vs 真值（外框層、頭部區）
const mapFit = I.makeMapper(dCx, dCy, fit.A, fit.B, fit.phi);
const scaleFactor = (dCx || cx) / tc.x;   // 差不多同尺度
function compare(map, name) {
  let maxErr = 0, sum = 0, n = 0, maxAt = 0;
  for (let a = 0; a < 360; a += 3) {
    const t = a * Math.PI / 180;
    const pt = truePt(R6 * Math.cos(t), R6 * Math.sin(t));
    const pf = map.toImageUV(Math.cos(t), Math.sin(t));
    const e = Math.hypot(pf.x - pt.x, pf.y - pt.y);
    if (e > maxErr) { maxErr = e; maxAt = a; }
    sum += e; n++;
  }
  console.log(`  ${name}: 外緣取樣誤差 平均 ${(sum / n).toFixed(2)}px 最大 ${maxErr.toFixed(2)}px (在 ${maxAt}°)`);
  return maxErr;
}
compare(mapFit, '橢圓模型');
// 單應精修
{
  const profFrame = I.boundaryProfiles(px, src.w, 720, dCx, dCy);
  const sets = [{ profile: profFrame, which: 'max', radius: S.frameOuter(enc.version), bins: 720 },
                { profile: profFrame, which: 'min', radius: S.frameInner(enc.version), bins: 720 }];
  let discPx = null;
  for (let l = 0; l < cc.count; l++) { if (l !== label) { const s2 = cc.stats[l]; if (Math.sqrt(s2.area/Math.PI) > 15 && Math.hypot(s2.sx/s2.area-dCx, s2.sy/s2.area-dCy) < fit.c0*0.4 && Math.abs(Math.sqrt(s2.area/Math.PI) - discR) < 1) discPx = I.collectPixels(cc, src.w, src.h, l); } }
  if (discPx) sets.push({ profile: I.boundaryProfiles(discPx, src.w, 720, dCx, dCy), which: 'max', radius: S.GEO.RI, bins: 720 });
  const h0 = [fit.A*Math.cos(fit.phi), -fit.B*Math.sin(fit.phi), dCx, fit.A*Math.sin(fit.phi), fit.B*Math.cos(fit.phi), dCy, 0, 0, 1];
  const fh = I.fitHomographyFromProfiles(sets, h0, 4);
  console.log('  單應擬合 resid', fh && fh.resid.toFixed(3), 'H=', fh && fh.H.map(v=>v.toFixed(3)).join(','));
  if (fh) { const mh = I.makeHomographyMapper(fh.H); if (mh) compare(mh, '單應精修'); else console.log('  mapper null'); }
}
const am = I.refineAffine(px, src.w, 720, dCx, dCy, mapFit, keep);
if (am) {
  const mapA = I.makeAffineMapper(am.M, am.t);
  console.log('  仿射矩陣', am.M.map(v => v.toFixed(2)).join(','), 't', am.t.map(v => v.toFixed(1)).join(','));
  compare(mapA, '仿射精修');
}

// ---- 用單應模型實際解碼 ----
{
  const profFrame = I.boundaryProfiles(px, src.w, 720, dCx, dCy);
  const sets = [{ profile: profFrame, which: 'max', radius: S.frameOuter(enc.version), bins: 720 },
                { profile: profFrame, which: 'min', radius: S.frameInner(enc.version), bins: 720 }];
  let discPx = null;
  for (let l = 0; l < cc.count; l++) {
    if (l === label) continue;
    const s2 = cc.stats[l];
    const rr = Math.sqrt(s2.area / Math.PI);
    if (rr > 15 && Math.hypot(s2.sx / s2.area - dCx, s2.sy / s2.area - dCy) < fit.c0 * 0.4 && Math.abs(rr - discR) < 2) discPx = I.collectPixels(cc, src.w, src.h, l);
  }
  if (discPx) sets.push({ profile: I.boundaryProfiles(discPx, src.w, 720, dCx, dCy), which: 'max', radius: S.GEO.RI, bins: 720 });
  const h0 = [fit.A * Math.cos(fit.phi), -fit.B * Math.sin(fit.phi), dCx, fit.A * Math.sin(fit.phi), fit.B * Math.cos(fit.phi), dCy, 0, 0, 1];
  const fh = I.fitHomographyFromProfiles(sets, h0, 15);
  console.log('單應：relResid', fh.resid.toExponential(2), 'pxResid', fh.pxResid.toFixed(2), 'iters done');
  const mapH = I.makeHomographyMapper(fh.H);
  // 用真值中心比較
  const pc = mapH.toImageUV(0, 0);
  console.log('  單應中心', pc.x.toFixed(1), pc.y.toFixed(1), '真值中心', tc.x.toFixed(1), tc.y.toFixed(1));
  const maskFull = I.binarize(I.toGray(photo), 0, 13);
  const dbgInfo = { discR, rMean: fit.c0, A: fit.A, B: fit.B, phi: fit.phi, cx: dCx, cy: dCy, label, pol: 0, uScale: fit.c0 / S.frameOuter(enc.version), v0: enc.version, rimRatio: S.frameInner(enc.version) / S.frameOuter(enc.version) };
  const o = Object.assign({}, S.PARAM, { _dbg: [], _dbgLast: {} });
  for (const dg of [0, -0.9, 0.9, -1.8, 1.8, -2.7, 2.7]) {
    const r = I.tryHypothesis(maskFull, I.toGray(photo), mapH, pc.x, pc.y, dg, false, enc.version, o, dbgInfo, 1);
    if (r.ok) { console.log('  單應解碼成功 dg=' + dg, JSON.stringify(r.text)); break; }
    if (dg === 0) console.log('  單應解碼 dg=0 失敗：', r.reason);
  }
  // 印出讀到的 header bits
  const r0 = I.tryHypothesis(maskFull, I.toGray(photo), mapH, pc.x, pc.y, 0, false, enc.version, o, dbgInfo, 1);
  console.log('  期望 headerBits', enc.headerBits.join(''));
}

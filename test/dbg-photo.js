const S = require('../src/sesame-core.js');
const C = require('./photo.js');
const { encodePNG } = require('./png.js');
const fs = require('fs');

const text = process.argv[2] || 'BSG-2026';
const tilt = +(process.argv[3] || 0.7);
const rot = +(process.argv[4] || 1.234);
const W = 1200, H = 900, size = 900;

const enc = S.encode(text, { ecLevel: 1 });
const SRC = 1400;
const img = S.renderCode(enc, { pxPerUnit: (SRC / 2 - 10) / S.frameOuter(enc.version), blur: 0.6, noise: 2 });
const quad = C.tiltedQuad(img.width, W, H, size, rot, tilt, 0);
const photo = C.shootPhoto(img.data, img.width, img.height, W, H, quad, { noise: 6, bg: [225, 214, 200], seed: 3 });
fs.writeFileSync(__dirname + '/out/photo_dbg.png', encodePNG(photo.data, photo.width, photo.height));
const d = S.decodeImage(photo, { debug: true });
console.log('version', enc.version, 'expected', JSON.stringify(text));
console.log('decode:', d.ok ? 'OK ' + JSON.stringify(d.text) + ' mirror=' + d.mirror + ' refined=' + d.refined : d.error);
if (!d.ok) {
  const g = {};
  for (const r of d.reasons) { const k = r.reason || ('pol' + r.pol); g[k] = (g[k] || 0) + 1; }
  console.log(g);
  // 檢查橢圓擬合品質
  const I = S._internal;
  const src = I.downscale(I.toGray(photo), 1280);
  for (let pol = 0; pol < 2; pol++) {
    const mask = I.binarize(src, pol, 13);
    const cc = I.labelComponents(mask, src.w, src.h, 300000);
    const cands = I.pickCandidates(cc, src.w, src.h);
    console.log('pol', pol, 'components', cc.count, 'cands', cands.map(c => c.label + ':' + c.score.toFixed(0)).join(','));
    if (!cands.length) continue;
    const label = cands[0].label, st = cc.stats[label];
    const px = I.collectPixels(cc, src.w, src.h, label);
    let cx = (st.minx + st.maxx) / 2, cy = (st.miny + st.maxy) / 2, fit = null;
    for (let it = 0; it < 6; it++) {
      const pts = I.envelope(px, src.w, 720, cx, cy);
      const rs = pts.map(p => p.r).sort((a, b) => a - b);
      const med = rs[rs.length >> 1];
      const keep = pts.filter(p => p.r > med * 0.9 && p.r < med * 1.25);
      fit = I.fitRing(keep, false);
      if (!fit) break;
      cx += fit.a1; cy += fit.b1;
      if (Math.hypot(fit.a1, fit.b1) < 0.25) break;
    }
    console.log('  blob area', st.area, 'bbox', (st.maxx - st.minx), 'x', (st.maxy - st.miny));
    console.log('  fit A/B', fit ? fit.A.toFixed(1) + '/' + fit.B.toFixed(1) + ' ratio ' + (fit.A / fit.B).toFixed(3) + ' phi ' + (fit.phi * 180 / Math.PI).toFixed(1) + ' center ' + cx.toFixed(1) + ',' + cy.toFixed(1) : 'null');
    if (fit) {
      const R6 = S.frameOuter(enc.version), ppu = (fit.A + fit.B) / 2 / R6;
      console.log('  implied px/unit', ppu.toFixed(2), '→ 芝麻長邊', (ppu * 2).toFixed(1), 'px');
      // 內框
      for (let l = 0; l < cc.count; l++) {
        if (l === label) continue;
        const s2 = cc.stats[l];
        const rr = Math.sqrt(s2.area / Math.PI);
        const fx = s2.sx / s2.area, fy = s2.sy / s2.area;
        if (rr > 15 && Math.hypot(fx - cx, fy - cy) < fit.A * 0.35) console.log('   blob#' + l, 'r=' + rr.toFixed(1), 'fill=' + (s2.area / ((s2.maxx - s2.minx + 1) * (s2.maxy - s2.miny + 1))).toFixed(2), 'dist=' + Math.hypot(fx - cx, fy - cy).toFixed(1));
      }
    }
  }
}

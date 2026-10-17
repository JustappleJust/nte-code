/* 模擬「用手機拍芝碼」：透視變形 + 背景 + 縮圖 + 模糊 + 雜訊 + 光照 */
const S = require('../src/sesame-core.js');
const { encodePNG } = require('./png.js');
const fs = require('fs');
const OUT = __dirname + '/out';
fs.mkdirSync(OUT, { recursive: true });

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** 求 homography：from → to（四點對應） */
function homography(fromPts, toPts) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = fromPts[i], [u, v] = toPts[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  return S._internal.solveN(A, b);
}

/**
 * 把來源影像以四邊形 quad（依序對應來源四角）貼到 W×H 照片中，
 * 同時產生背景、雜訊與光照。
 */
function shootPhoto(src, sw, sh, W, H, quad, opt) {
  opt = opt || {};
  const h = homography(quad, [[0, 0], [sw, 0], [sw, sh], [0, sh]]);   // 照片 → 來源
  if (!h) throw new Error('homography fail');
  const out = new Uint8ClampedArray(W * H * 4);
  const rnd = mulberry32(opt.seed || 1);
  const bg = opt.bg || [236, 232, 226];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = h[6] * x + h[7] * y + 1;
      const u = (h[0] * x + h[1] * y + h[2]) / d;
      const v = (h[3] * x + h[4] * y + h[5]) / d;
      let val;
      if (u < 0 || v < 0 || u >= sw - 1 || v >= sh - 1) {
        const n = 0.5 + 0.5 * Math.sin(v * 0.35) * Math.sin(u * 0.21);
        val = bg[0] - n * 20;
      } else {
        const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0;
        const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
        val = src[i00] * (1 - fx) * (1 - fy) + src[i10] * fx * (1 - fy) + src[i01] * (1 - fx) * fy + src[i11] * fx * fy;
      }
      if (opt.light) val += opt.light * (0.5 - (x / W - 0.5) * 0.6 - (y / H - 0.5) * 0.4) * 120;
      if (opt.noise) val += (rnd() * 2 - 1) * opt.noise;
      const i = (y * W + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = val; out[i + 3] = 255;
    }
  }
  return { data: out, width: W, height: H };
}

function boxBlur(img, radius) {
  const { width: w, height: h, data } = img;
  const tmp = new Float32Array(w * h);
  const out = new Uint8ClampedArray(w * h * 4);
  const r = radius;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, c = 0;
    for (let k = -r; k <= r; k++) { const xx = Math.min(w - 1, Math.max(0, x + k)); s += data[(y * w + xx) * 4]; c++; }
    tmp[y * w + x] = s / c;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, c = 0;
    for (let k = -r; k <= r; k++) { const yy = Math.min(h - 1, Math.max(0, y + k)); s += tmp[yy * w + x]; c++; }
    const v = s / c, i = (y * w + x) * 4;
    out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = 255;
  }
  return { data: out, width: w, height: h };
}

/** 以「3D 傾斜相機」模型產生四邊形（來源座標 0..srcW） */
function tiltedQuad(srcW, W, H, size, phi, tiltX, tiltY) {
  const c = srcW / 2;
  const proj = (u, v) => {
    let x = (u - c) / srcW * size, y = (v - c) / srcW * size, z = 0;
    const cX = Math.cos(tiltX), sX = Math.sin(tiltX), cY = Math.cos(tiltY), sY = Math.sin(tiltY);
    const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
    const y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
    const f = size * 2.2;
    const k = f / (f + z2);
    const X = x1 * k, Y = y1 * k;
    const cp = Math.cos(phi), sp = Math.sin(phi);
    return [W / 2 + X * cp - Y * sp, H / 2 + X * sp + Y * cp];
  };
  return [proj(0, 0), proj(srcW, 0), proj(srcW, srcW), proj(0, srcW)];
}


function runTests() {
  let pass = 0, fail = 0;
  function check(name, ok, extra) {
    if (ok) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + name + (extra ? '  ' + extra : '')); }
    else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (extra ? '  ' + extra : '')); }
  }

  const texts = ['嗨！異環', 'BSG-2026', '唄果 is a sesame bagel', '芝麻開門 open sesame'];

  console.log('\n=== 拍照模擬：透視 + 背景 + 縮圖 ===');

  const scenarios = [
    { name: '正對拍攝 1200px', size: 900, tilt: 0.0, W: 1200, H: 900, blur: 1, noise: 6 },
    { name: '斜角 20° 透視 1200px', size: 900, tilt: 0.35, W: 1200, H: 900, blur: 1, noise: 6 },
    { name: '斜角 40° 透視 1200px', size: 900, tilt: 0.7, W: 1200, H: 900, blur: 1, noise: 6 },
    { name: '斜角 40° + 模糊 2px', size: 900, tilt: 0.7, W: 1200, H: 900, blur: 2, noise: 8 },
    { name: '雙軸傾斜 (0.5, 0.5)', size: 900, tilt: 0.5, tiltY: 0.5, W: 1200, H: 900, blur: 1, noise: 6 },
    { name: '小尺寸 640px 斜角 30°', size: 520, tilt: 0.5, W: 640, H: 480, blur: 1, noise: 6 },
    { name: '小尺寸 480px 斜角 30°', size: 400, tilt: 0.5, W: 480, H: 360, blur: 1, noise: 5 },
    { name: '遠距 360px 斜角 20°', size: 300, tilt: 0.35, W: 360, H: 270, blur: 1, noise: 4 },
    { name: '傾斜+模糊+雜訊+光照', size: 700, tilt: 0.6, W: 900, H: 700, blur: 2, noise: 10, light: 0.5 },
    { name: '高密度 12 圈 正對 1600px', size: 1150, tilt: 0.0, W: 1600, H: 1200, blur: 1, noise: 6, dense: 12 },
    { name: '高密度 16 圈 斜角 20° 1600px', size: 1150, tilt: 0.35, W: 1600, H: 1200, blur: 1, noise: 7, dense: 16 }
  ];

  const rnd = mulberry32(99);
  for (const sc of scenarios) {
    let ok = 0;
    const t0 = Date.now();
    let firstErr = '';
    for (let i = 0; i < 4; i++) {
      const text = texts[i];
      // dense：改用高圈數芝碼（大 payload），驗證高密度下的拍攝解碼
      // dense：改用高圈數芝碼（接近滿載的 ASCII payload），驗證高密度下的拍攝解碼
      const dCap = sc.dense ? S.ecPlan(sc.dense, 1).data : 0;
      const enc = sc.dense
        ? S.encode('D' + i + '-' + 'x'.repeat(Math.max(0, dCap - 3)), { ecLevel: 1, version: sc.dense })
        : S.encode(text, { ecLevel: 1 });
      const SRC = sc.dense ? 1900 : 1400;
      const img = S.renderCode(enc, { pxPerUnit: (SRC / 2 - 10) / S.frameOuter(enc.version), blur: 0.6, noise: 2 });
      const phi = rnd() * Math.PI * 2;
      const quad = tiltedQuad(img.width, sc.W, sc.H, sc.size, phi, sc.tilt || 0, sc.tiltY || 0);
      let photo = shootPhoto(img.data, img.width, img.height, sc.W, sc.H, quad, { noise: sc.noise, bg: [225, 214, 200], light: sc.light, seed: i + 3 });
      if (sc.blur) photo = boxBlur(photo, sc.blur);
      const want = sc.dense ? Buffer.from(enc.bytes).toString('utf8') : text;
      const dec = S.decodeImage(photo, { maxDim: sc.dense ? 1600 : 1280 });
      if (dec.ok && dec.text === want) ok++;
      else if (!firstErr) firstErr = dec.error || ('text mismatch ' + JSON.stringify(dec.text));
      if (i === 0) fs.writeFileSync(`${OUT}/photo_${sc.name.replace(/[^\w]/g, '_')}.png`, encodePNG(photo.data, photo.width, photo.height));
    }
    check(sc.name, ok === 4, `${ok}/4  ${((Date.now() - t0) / 4) | 0}ms/張` + (firstErr ? '  [' + firstErr + ']' : ''));
  }

  console.log('\n=== 多目標：照片中有兩個芝碼 ===');
  {
    const enc1 = S.encode('第一個芝碼', { ecLevel: 1 });
    const enc2 = S.encode('SECOND CODE 第二個', { ecLevel: 1 });
    const W = 1400, H = 900;
    const canvas = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) { canvas[i * 4] = 235; canvas[i * 4 + 1] = 231; canvas[i * 4 + 2] = 225; canvas[i * 4 + 3] = 255; }
    const paste = (enc, cx, cy, size) => {
      const im = S.renderCode(enc, { pxPerUnit: size / 2 / S.frameOuter(enc.version) });
      for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
        const X = cx + x - im.width / 2 | 0, Y = cy + y - im.height / 2 | 0;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const si = (y * im.width + x) * 4, di = (Y * W + X) * 4;
        canvas[di] = canvas[di + 1] = canvas[di + 2] = im.data[si];
      }
    };
    paste(enc1, 350, 430, 380);
    paste(enc2, 1030, 470, 460);
    const dec = S.decodeImage({ data: canvas, width: W, height: H }, {});
    check('大圖中偵測其中一個芝碼', dec.ok && (dec.text === '第一個芝碼' || dec.text === 'SECOND CODE 第二個'),
      dec.ok ? JSON.stringify(dec.text) : dec.error);
  }

  console.log('\n=== 抗旋轉（相機對齊任意方向） ===');
  {
    let ok = 0;
    for (let a = 0; a < 360; a += 30) {
      const enc = S.encode('angle-' + a, { ecLevel: 1 });
      const img = S.renderCode(enc, { pxPerUnit: 9, rotDeg: a, blur: 1.2, noise: 8 });
      const d = S.decodeImage(img, {});
      if (d.ok && d.text === 'angle-' + a) ok++; else console.log('      miss', a, d.error);
    }
    check('每 30° 全數通過', ok === 12, ok + '/12');
  }

  console.log(`\n=== 結果：${pass} 通過 / ${fail} 失敗 ===`);
  process.exit(fail ? 1 : 0);
}

if (require.main === module) runTests();
module.exports = { homography, shootPhoto, tiltedQuad, boxBlur, mulberry32, runTests };

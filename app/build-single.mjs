/* 把 index.html + style.css + sesame-core.js + app.js 合成單一 HTML 檔案
 * （方便離線使用、以 file:// 開啟，或在沙箱預覽中顯示）
 * 用法： node app/build-single.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const APP = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(APP, '..');

let html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(APP, 'style.css'), 'utf8');
const core = fs.readFileSync(path.join(ROOT, 'src', 'sesame-core.js'), 'utf8');
const i18n = fs.readFileSync(path.join(APP, 'i18n.js'), 'utf8');
const app = fs.readFileSync(path.join(APP, 'app.js'), 'utf8');

/* 資源標籤帶有 `?v=<build>`（快取破除）。這裡用 regex 吃掉查詢字串，
   避免改了 index.html 的版本號就讓單檔打包靜默失效。 */
const swap = (re, replacement, label) => {
  if (!re.test(html)) throw new Error(`build-single: 找不到 ${label} 的標籤，請同步更新 build-single.mjs`);
  html = html.replace(re, replacement);
};
swap(/<link rel="stylesheet" href="\.\/style\.css(?:\?v=[^"]*)?">/, `<style>\n${css}\n</style>`, 'style.css');
swap(/<script src="\.\/i18n\.js(?:\?v=[^"]*)?"><\/script>/, `<script>\n${i18n}\n</script>`, 'i18n.js');
swap(/<script src="\.\.\/src\/sesame-core\.js(?:\?v=[^"]*)?"><\/script>/, `<script>\n${core}\n</script>`, 'sesame-core.js');
swap(/<script src="\.\/app\.js(?:\?v=[^"]*)?"><\/script>/, `<script>\n${app}\n</script>`, 'app.js');
html = html.replace('<title>芝碼 SesameCode</title>',
  '<title>芝碼 SesameCode</title>\n<!-- 由 app/build-single.mjs 產生：請勿直接編輯 -->');
// 內嵌 favicon（避免 file:// 開啟時 404）
const icon = path.join(APP, 'icon.svg');
if (fs.existsSync(icon)) {
  const svg = 'data:image/svg+xml;base64,' + fs.readFileSync(icon).toString('base64');
  html = html.replace('href="./icon.svg"', 'href="' + svg + '"');
}

const out = path.join(APP, 'sesamecode-standalone.html');
fs.writeFileSync(out, html);
console.log(`已寫出 ${out}（${(html.length / 1024).toFixed(1)} KB）`);

/* 芝碼 靜態伺服器（開發用）：node app/server.mjs [port]
 * 提供專案根目錄的靜態檔案，綁定 0.0.0.0 以便預覽代理連線。 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8123);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function resolve(p) {
  // 讓 http://host/ 直接是網頁，同時 <link href="./style.css"> 這類相對路徑也找得到
  const clean = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  const tries = [];
  if (p === '/' || p === '' || p === '/index.html') {
    tries.push(path.join(ROOT, 'app', 'index.html'));
  } else {
    tries.push(path.join(ROOT, clean));        // 專案根目錄（src/… 、test/out/…）
    tries.push(path.join(ROOT, 'app', clean)); // app/ 內的資產（style.css、app.js…）
  }
  for (const f of tries) if (f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  return null;
}

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const file = resolve(p);
  if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(`not found: ${p}（試過 ${path.basename(p)}）`); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`芝碼 伺服器啟動： http://0.0.0.0:${PORT}/  （攝影機需 https 或 localhost）`);
});

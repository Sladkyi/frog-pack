const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp':'image/webp' };
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    const versioned=pathname.startsWith('/assets/optimized/')&&new URL(req.url,'http://localhost').searchParams.has('v');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': versioned?'public, max-age=31536000, immutable':'no-cache' }); res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`PACK / RUN: http://127.0.0.1:${port}`));

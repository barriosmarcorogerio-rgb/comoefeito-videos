// uso: node shot.mjs <icon|banner> saida.png
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const [,, mode, out] = process.argv; const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, q.url.split('?')[0].split('#')[0]); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 2560, height: 1440 } });
pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html#${mode}`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
const d = await pg.evaluate(() => document.getElementById('c').toDataURL('image/png'));
fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); await b.close(); srv.close(); console.log(out);

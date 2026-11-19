// uso: node render.mjs <pasta_saida> <quadros: "a-b" ou "1,2,3" ou "all"> [passo] [qualidade]
// RESUME=1 pula quadros que já existem (renderizar em blocos / continuar depois de interrupção).
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [,, outdir, spec = 'all', step = '1', qual = '0.93'] = process.argv;
fs.mkdirSync(outdir, { recursive: true });
const root = process.env.WEB || path.resolve('web');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.otf': 'font/otf' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('console', m => console.log('PAGE', m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
if (await pg.evaluate(() => window.err)) { console.log('page error'); process.exit(1); }
const total = await pg.evaluate(() => window.TOTAL);
let frames = [];
for (const part of (spec === 'all' ? `0-${total - 1}` : spec).split(',')) { if (part.includes('-')) { const [a, c] = part.split('-').map(Number); for (let f = a; f <= Math.min(c, total - 1); f += +step) frames.push(f); } else frames.push(+part); }
const t0 = Date.now(); let n = 0;
for (const f of frames) {
  const out = path.join(outdir, `f${String(f).padStart(4, '0')}.jpg`);
  if (process.env.RESUME && fs.existsSync(out)) continue;
  const d = await pg.evaluate(([f, q]) => { window.renderFrame(f); return document.getElementById('f').toDataURL('image/jpeg', q); }, [f, +qual]);
  fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); n++;
}
console.log(`done ${n} frames (total ${total}), ${n ? ((Date.now() - t0) / n / 1000).toFixed(2) : 0} s/frame`);
await b.close(); srv.close();

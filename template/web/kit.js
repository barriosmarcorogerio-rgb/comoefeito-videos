// Kit de construção 3D "brinquedo" do canal Aprenda Como É Feito.
// Tudo que o story.js precisa: ambiente, materiais, peças (tijolos, vigas, lajes, telhas...), mascote, setas,
// trincas, gotas, e a camada 2D (etiquetas, nome técnico, CTA). Unidades em metros, y para cima.
import * as THREE from './lib/three.module.js';
export { THREE };

// ---------- util de tempo ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const backOut = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const prog = (t, t0, dur) => clamp((t - t0) / Math.max(dur, 1e-6));
export const between = (t, a, b) => t >= a && t < b;
const V = (a) => new THREE.Vector3(...a);

// ---------- materiais ----------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
export const M = {
  brick: std('#c9583a'), brick2: std('#b84d33'), mortar: std('#eadcbf'), concrete: std('#b9b6ae'), concreteNew: std('#d2cfc6'),
  steel: std('#7f8a96', { metalness: 0.45, roughness: 0.45 }), rebar: std('#8a4b2c', { metalness: 0.3, roughness: 0.6 }),
  wood: std('#b07a45'), woodDark: std('#8a5a30'), tile: std('#d0603a'), tileDark: std('#b24f2e'),
  glass: std('#9fd3f0', { roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.55 }), white: std('#f4f2ec'), wallPaint: std('#f1ece0'),
  grass: std('#78c25a'), dirt: std('#9b7653'), sand: std('#e2cf9a'), gravel: std('#9a958c'), water: std('#4aa3df', { roughness: 0.15, transparent: true, opacity: 0.85 }),
  road: std('#5d6168'), red: std('#e23b3b'), green: std('#2fb36a'), blue: std('#2f80ed'), orange: std('#f28a1c'), yellow: std('#f6c22c'),
  dark: std('#2b2f36'), skin: std('#f2c7a0'), teal: std('#1f7a8c'), jeans: std('#3b5f99'), shoe: std('#3a2f2a'), leaf: std('#5cb85c'), leaf2: std('#4aa84f'), trunk: std('#8a5a3a'),
};
export const mat = std;

// ---------- concreto reconhecível: cinza com pedrinhas (brita) e poros, diferente da argamassa bege ----------
const concreteCanvas = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const r = rng(21);
  g.fillStyle = '#a7a7a2'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const v = 120 + r() * 90 | 0; g.fillStyle = `rgba(${v},${v},${v - 4},.5)`; g.fillRect(r() * 512, r() * 512, 2, 2); }
  for (let i = 0; i < 420; i++) { const v = 95 + r() * 110 | 0; g.fillStyle = `rgb(${v},${v - 6},${v - 12})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 7, 2 + r() * 5, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(40,40,40,.55)'; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 2, 0, 7); g.fill(); }
  return c; })();
/** caixa de concreto com textura na escala certa (1 repetição ≈ 0,5 m) */
export function concreteBox(parent, size, pos, o = {}) {
  const t = new THREE.CanvasTexture(concreteCanvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.BoxGeometry(...size), uv = g.attributes.uv, [w, h, d] = size, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 0.5, uv.getY(i) * dims[f][1] / 0.5); }
  return add(parent, g, std(o.color ?? '#ffffff', { map: t, roughness: 0.95 }), pos, o);
}
/** destaca uma peça nova: brilho pulsante (a = 0..1). Use quando a peça entra e enquanto a narração fala dela. */
export function highlight(mesh, a, color = '#ffd23f') {
  mesh.traverse((m) => { if (!m.material || !m.material.emissive) return; if (!m.userData._hl) { m.material = m.material.clone(); m.userData._hl = 1; }
    m.material.emissive.set(color); m.material.emissiveIntensity = clamp(a) * (0.25 + 0.2 * Math.sin(performance.now() * 0 + a * 20)); });
}

// ---------- cena base ----------
export function setup(canvas, W = 1080, H = 1920) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 2000);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(vec3(.78,.90,1.), vec3(.30,.62,.98), pow(h,.6)); gl_FragColor = vec4(c,1.); }`,
  }));
  scene.add(sky);
  scene.add(new THREE.HemisphereLight('#ffffff', '#8fae6a', 1.25));
  const sun = new THREE.DirectionalLight('#fff6e6', 2.4); sun.position.set(18, 30, 22); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 120 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3; scene.add(sun); scene.add(sun.target);
  scene.fog = new THREE.Fog('#cfe6ff', 60, 260);
  return { renderer, scene, camera, sun };
}

export const add = (parent, geo, material, pos = [0, 0, 0], o = {}) => {
  const m = new THREE.Mesh(geo, material); m.position.set(...pos); m.castShadow = o.cast ?? true; m.receiveShadow = true;
  if (o.rot) m.rotation.set(...o.rot); parent.add(m); return m;
};
export const box = (parent, size, material, pos, o) => add(parent, new THREE.BoxGeometry(...size), material, pos, o);
export const cyl = (parent, r, h, material, pos, o = {}) => add(parent, new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg ?? 20), material, pos, o);
export const group = (parent, pos = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; };
/** barra entre dois pontos */
export const rod = (parent, a, b, r, material, seg = 8) => {
  const A = V(a), B = V(b); const m = add(parent, new THREE.CylinderGeometry(r, r, A.distanceTo(B), seg), material);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
};

// ---------- ambiente de bairro ----------
export function neighborhood(scene, o = {}) {
  // o.site = {x0,x1,z0,z1}: área livre da obra (terra batida, sem grama alta nem árvores). o.roadZ: posição da rua (z).
  const g = group(scene); const r = rng(o.seed ?? 3); const roadZ = o.roadZ ?? 9;
  const site = o.site ?? { x0: -4, x1: 4, z0: -2.5, z1: 3 };
  // chão com textura de grama (manchas, fiozinhos) — nunca liso
  const gc = document.createElement('canvas'); gc.width = gc.height = 512; const gx = gc.getContext('2d');
  gx.fillStyle = '#74bd55'; gx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { gx.fillStyle = r() < 0.5 ? 'rgba(140,205,95,.35)' : 'rgba(80,150,60,.3)'; gx.beginPath(); gx.ellipse(r() * 512, r() * 512, 30 + r() * 60, 20 + r() * 40, r() * 3, 0, 7); gx.fill(); }
  for (let i = 0; i < 14000; i++) { const l = 30 + r() * 35; gx.strokeStyle = `hsl(${95 + r() * 20},${45 + r() * 20}%,${l}%)`; gx.lineWidth = 1 + r(); const x = r() * 512, y = r() * 512; gx.beginPath(); gx.moveTo(x, y); gx.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); gx.stroke(); }
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(160, 160); gt.colorSpace = THREE.SRGBColorSpace; gt.anisotropy = 8;
  const ground = add(g, new THREE.PlaneGeometry(600, 600), mat('#ffffff', { map: gt, roughness: 1 }), [0, 0, 0], { cast: false }); ground.rotation.x = -Math.PI / 2;
  // terra batida da obra
  const dc = document.createElement('canvas'); dc.width = dc.height = 256; const dx = dc.getContext('2d'); dx.fillStyle = '#a5815c'; dx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) { const v = r(); dx.fillStyle = v < 0.5 ? 'rgba(120,90,60,.5)' : 'rgba(190,160,120,.5)'; dx.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3); }
  const dt = new THREE.CanvasTexture(dc); dt.wrapS = dt.wrapT = THREE.RepeatWrapping; dt.repeat.set((site.x1 - site.x0) / 2, (site.z1 - site.z0) / 2); dt.colorSpace = THREE.SRGBColorSpace;
  if (o.dirt !== false) { const dp = add(g, new THREE.CircleGeometry(1, 40), mat('#ffffff', { map: dt, roughness: 1 }), [(site.x0 + site.x1) / 2, 0.006, (site.z0 + site.z1) / 2], { cast: false }); dp.rotation.x = -Math.PI / 2; dp.scale.set((site.x1 - site.x0) / 2 + 0.8, (site.z1 - site.z0) / 2 + 0.8, 1); }
  // rua, calçada e meio-fio
  if (o.road !== false) {
    const rd = add(g, new THREE.PlaneGeometry(600, 6), M.road, [0, 0.01, roadZ], { cast: false }); rd.rotation.x = -Math.PI / 2;
    for (let x = -80; x < 80; x += 4) { const st = add(g, new THREE.PlaneGeometry(1.8, 0.16), M.white, [x, 0.02, roadZ], { cast: false }); st.rotation.x = -Math.PI / 2; }
    for (const sz of [-1, 1]) { box(g, [600, 0.14, 0.18], mat('#cfcac0'), [0, 0.07, roadZ + sz * 3.09], { cast: false }); const sw = add(g, new THREE.PlaneGeometry(600, 1.6), mat('#d9d4ca'), [0, 0.012, roadZ + sz * 3.98], { cast: false }); sw.rotation.x = -Math.PI / 2; }
  }
  // casas de fundo (enfileiradas, sem sobrepor) e árvores que respeitam as casas
  const blocked = [{ x0: site.x0 - 1, x1: site.x1 + 1, z0: site.z0 - 1, z1: site.z1 + 1 }, { x0: -1e3, x1: 1e3, z0: roadZ - 4.8, z1: roadZ + 4.8 }];
  const free = (x, z, m = 0) => !blocked.some((b) => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m);
  const cols = ['#f6e7c8', '#f2d4cf', '#d8e8f4', '#f4f1e8', '#e2efd4', '#f7dcb4'];
  let hx = -60; const hz = o.housesZ ?? -24; let i = 0;
  while (hx < 60 && i < (o.houses ?? 12)) {
    const w = 6 + r() * 3, d = 6 + r() * 2, floors = r() < 0.3 ? 2 : 1, z = hz - r() * 6;
    if (free(hx + w / 2, z, 3)) { house(g, [hx + w / 2, 0, z], { w, d, floors, color: cols[i % cols.length], seed: i + 1 }); blocked.push({ x0: hx - 1, x1: hx + w + 1, z0: z - d / 2 - 1, z1: z + d / 2 + 1.2 }); i++; }
    hx += w + 3 + r() * 4;
  }
  const trees = [];
  for (let k = 0, tries = 0; k < (o.trees ?? 22) && tries < 600; tries++) {
    const x = (r() - 0.5) * 110, z = -6 - r() * 40, sc = 0.8 + r() * 0.7;
    if (!free(x, z, 2.2 * sc) || trees.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 3.5)) continue;
    trees.push([x, z]); tree(g, [x, 0, z], sc); k++;
  }
  // tufos de grama, flores e pedrinhas perto da câmera (instanciados)
  const tuftG = new THREE.ConeGeometry(0.035, 0.22, 4); tuftG.translate(0, 0.11, 0);
  const tufts = new THREE.InstancedMesh(tuftG, mat('#5fae45'), 2400); const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 5), mat('#ffffff'), 260);
  const pb = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.06, 0), mat('#9d988f'), 160); const dm = new THREE.Object3D(), cc = new THREE.Color();
  let n = 0, nf = 0, np = 0;
  for (let t = 0; t < 9000 && (n < 2400 || nf < 260 || np < 160); t++) {
    const x = (r() - 0.5) * 30, z = -12 + r() * 15; if (!free(x, z, 0.2)) continue;
    const kind = r();
    if (kind < 0.8 && n < 2400) { for (let j = 0; j < 1 && n < 2400; j++) { dm.position.set(x, 0, z); dm.rotation.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); dm.scale.set(1, 0.6 + r() * 0.9, 1); dm.updateMatrix(); tufts.setMatrixAt(n, dm.matrix); cc.setHSL(0.27 + r() * 0.05, 0.5, 0.38 + r() * 0.15); tufts.setColorAt(n++, cc); } }
    else if (kind < 0.92 && nf < 260) { dm.position.set(x, 0.1, z); dm.rotation.set(0, 0, 0); dm.scale.setScalar(0.8 + r() * 0.6); dm.updateMatrix(); fl.setMatrixAt(nf, dm.matrix); cc.set(['#ffffff', '#ffe066', '#ff8fab', '#c8a2ff'][Math.floor(r() * 4)]); fl.setColorAt(nf++, cc); }
    else if (np < 160) { dm.position.set(x, 0.02, z); dm.rotation.set(r() * 3, r() * 3, r() * 3); dm.scale.set(1 + r(), 0.5 + r() * 0.4, 1 + r()); dm.updateMatrix(); pb.setMatrixAt(np++, dm.matrix); }
  }
  tufts.count = n; fl.count = nf; pb.count = np; for (const im of [tufts, fl, pb]) { im.receiveShadow = true; g.add(im); }
  for (let k = 0; k < 7; k++) cloud(g, [-70 + k * 24 + r() * 8, 34 + r() * 10, -100 - r() * 40], 2.5 + r() * 2);
  return g;
}
/** casa de fundo: paredes, telhado de duas águas com beiral, janelas com moldura, porta, chaminé, degrau, arbustos */
export function house(parent, pos, o = {}) {
  const r = rng(o.seed ?? 1); const w = o.w ?? 7, d = o.d ?? 6, fl = o.floors ?? 1, hf = 2.8, h = hf * fl + 0.3;
  const hg = group(parent, pos); if (o.rotY) hg.rotation.y = o.rotY; const wall = mat(o.color ?? '#f4efe4'), trim = M.white;
  box(hg, [w + 0.2, 0.3, d + 0.2], mat('#bdb6aa'), [0, 0.15, 0]);
  box(hg, [w, h - 0.3, d], wall, [0, 0.3 + (h - 0.3) / 2, 0]);
  const rise = d * 0.36, ov = 0.45, sh = new THREE.Shape(); sh.moveTo(-d / 2 - ov, 0); sh.lineTo(d / 2 + ov, 0); sh.lineTo(0, rise + ov * 0.7); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: w + ov * 2, bevelEnabled: false }); rg.translate(0, 0, -(w + ov * 2) / 2);
  const roof = add(hg, rg, r() < 0.5 ? M.tile : mat('#9c4a3a'), [0, h - 0.12, 0]); roof.rotation.y = Math.PI / 2;
  const gs = new THREE.Shape(); gs.moveTo(-d / 2, 0); gs.lineTo(d / 2, 0); gs.lineTo(0, rise); gs.closePath();
  const gg = new THREE.ExtrudeGeometry(gs, { depth: w - 0.02, bevelEnabled: false }); gg.translate(0, 0, -(w - 0.02) / 2); const gb = add(hg, gg, wall, [0, h, 0]); gb.rotation.y = Math.PI / 2;
  box(hg, [0.6, 1.4, 0.6], mat('#a8553f'), [w * 0.25, h + rise * 0.55, -d * 0.15]);
  const win = (x, y) => { box(hg, [1.0, 1.0, 0.05], M.glass, [x, y, d / 2 + 0.02], { cast: false });
    for (const [bw, bh, bx, by] of [[1.16, 0.09, 0, 0.54], [1.16, 0.12, 0, -0.55], [0.09, 1.1, -0.54, 0], [0.09, 1.1, 0.54, 0], [1.0, 0.05, 0, 0], [0.05, 1.0, 0, 0]]) box(hg, [bw, bh, 0.08], trim, [x + bx, y + by, d / 2 + 0.04], { cast: false }); };
  for (let f = 0; f < fl; f++) { const y = 0.3 + f * hf + 1.55; if (f === 0) { win(-w * 0.28, y); win(w * 0.28, y); } else { win(-w * 0.28, y); win(0, y); win(w * 0.28, y); } }
  box(hg, [1.0, 2.0, 0.06], mat(['#6b4226', '#2f6f8f', '#a33b3b'][Math.floor(r() * 3)]), [0, 1.3, d / 2 + 0.03]);
  for (const [bw, bh, bx, by] of [[1.18, 0.1, 0, 2.33], [0.09, 2.1, -0.55, 1.3], [0.09, 2.1, 0.55, 1.3]]) box(hg, [bw, bh, 0.08], trim, [bx, by, d / 2 + 0.04]);
  add(hg, new THREE.SphereGeometry(0.05, 8, 6), mat('#e0b84a', { metalness: 0.6 }), [0.32, 1.25, d / 2 + 0.08], { cast: false });
  box(hg, [1.6, 0.15, 0.7], mat('#bdb6aa'), [0, 0.08, d / 2 + 0.35]);
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) add(hg, new THREE.IcosahedronGeometry(0.45 + r() * 0.2, 1), r() < 0.5 ? M.leaf : M.leaf2, [sx * (w * 0.28 + (k - 0.5) * 0.8), 0.35, d / 2 + 0.6]).material.flatShading = true;
  return hg;
}
export function tree(parent, pos, s = 1) {
  const g = group(parent, pos); const r = rng(Math.floor(pos[0] * 7 + pos[2] * 13) & 1023);
  cyl(g, 0.17 * s, 1.7 * s, M.trunk, [0, 0.85 * s, 0], { r2: 0.12 * s, seg: 8 });
  const leafM = [mat('#5cb85c', { flatShading: true }), mat('#4aa84f', { flatShading: true }), mat('#6cc46a', { flatShading: true })];
  for (const [x, y, z, rr] of [[0, 2.3, 0, 1.05], [0.55, 2.7, 0.2, 0.75], [-0.5, 2.6, -0.15, 0.7], [0.1, 3.15, -0.1, 0.65]]) add(g, new THREE.IcosahedronGeometry(rr * s * (0.9 + r() * 0.2), 1), leafM[Math.floor(r() * 3)], [x * s, y * s, z * s]);
  return g;
}
export function cloud(parent, pos, s = 3) {
  const g = group(parent, pos); const m = mat('#ffffff', { roughness: 1 });
  for (const [x, y, r] of [[0, 0, 1], [1.1, -0.2, 0.75], [-1.1, -0.25, 0.7], [0.4, 0.5, 0.7]]) add(g, new THREE.SphereGeometry(r * s, 14, 10), m, [x * s, y * s, 0], { cast: false });
  return g;
}
export function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

// ---------- parede de tijolos (instanciada, com aberturas e animação por tijolo) ----------
// openings: [{x0,x1,y0,y1}] em metros no plano da parede (x a partir do centro, y a partir do chão)
export function brickWall(parent, o) {
  const L = o.brick?.[0] ?? 0.29, Hb = o.brick?.[1] ?? 0.14, D = o.thick ?? 0.14, gap = 0.012;
  const rows = Math.round(o.h / Hb), cols = Math.ceil(o.w / L) + 1;
  const g = group(parent, o.pos ?? [0, 0, 0]); if (o.rotY) g.rotation.y = o.rotY;
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * L / 2;
    for (let c = 0; c < cols; c++) {
      let x0 = -o.w / 2 + c * L - off, x1 = x0 + L; x0 = Math.max(x0, -o.w / 2); x1 = Math.min(x1, o.w / 2); if (x1 - x0 < 0.04) continue;
      const y0 = r * Hb, y1 = y0 + Hb, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const hole = (o.openings || []).some((h) => cx > h.x0 && cx < h.x1 && cy > h.y0 && cy < h.y1);
      if (hole) continue;
      bricks.push({ row: r, col: c, x: cx, y: cy, w: x1 - x0 - gap, h: Hb - gap, tag: o.tag ? o.tag(cx, cy, r) : null });
    }
  }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#ffffff'), bricks.length); im.castShadow = im.receiveShadow = true; g.add(im);
  const col = new THREE.Color(); const r2 = rng(5);
  bricks.forEach((b, i) => { col.set(o.colors ? o.colors[Math.floor(r2() * o.colors.length)] : (r2() < 0.5 ? '#e0703f' : (r2() < 0.5 ? '#d4643a' : '#ea8050'))); im.setColorAt(i, col); });
  // argamassa: placa com furos nas aberturas (e em o.mortarHoles), um pouco mais fina que o tijolo
  const sh = new THREE.Shape(); sh.moveTo(-o.w / 2 + 0.01, 0); sh.lineTo(o.w / 2 - 0.01, 0); sh.lineTo(o.w / 2 - 0.01, o.h - 0.01); sh.lineTo(-o.w / 2 + 0.01, o.h - 0.01); sh.closePath();
  for (const h of [...(o.openings || []), ...(o.mortarHoles || [])]) { const p = new THREE.Path(); p.moveTo(h.x0, h.y0); p.lineTo(h.x0, h.y1); p.lineTo(h.x1, h.y1); p.lineTo(h.x1, h.y0); p.closePath(); sh.holes.push(p); }
  const mg = new THREE.ExtrudeGeometry(sh, { depth: D * 0.7, bevelEnabled: false }); mg.translate(0, 0, -D * 0.35);
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e4); const mm = M.mortar.clone(); mm.clippingPlanes = [clip];
  const mortar = add(g, mg, mm, [0, 0, 0], { cast: false }); mortar.visible = o.mortar !== false;
  /** argamassa só até a altura y (em metros, local da parede) — acompanha a subida das fiadas */
  const setMortarHeight = (y) => { g.updateMatrixWorld(); const wy = new THREE.Vector3(0, y, 0).applyMatrix4(g.matrixWorld).y; clip.constant = wy; };
  const dummy = new THREE.Object3D();
  // state(b,i) -> {s: escala 0..1, dy: deslocamento vertical, dx, show}
  const update = (state) => {
    let mortarVisible = true;
    bricks.forEach((b, i) => {
      const st = state ? state(b, i) : null; const s = st?.s ?? 1;
      dummy.position.set(b.x + (st?.dx ?? 0), b.y + (st?.dy ?? 0), (st?.dz ?? 0)); dummy.rotation.set(0, 0, st?.rz ?? 0);
      dummy.scale.set(b.w * Math.max(s, 1e-4), b.h * Math.max(s, 1e-4), D * Math.max(s, 1e-4)); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  };
  update(null);
  return { g, im, bricks, rows, Hb, L, D, update, mortar, setMortarHeight };
}

// ---------- mascote (capacete laranja, camisa azul-petróleo) ----------
export function mascot(parent, pos = [0, 0, 0], s = 1) {
  // "Mestre" do canal (marca registrada): cabeça grande, capacete laranja com "A", olhos grandes, sobrancelhas, bigode e costeletas,
  // colete amarelo-limão ABERTO com faixas refletivas e bolsos sobre camisa azul-petróleo de gola, luvas laranja com polegar,
  // cinto de ferramentas com martelo e trena, calça jeans, botas marrons com sola.
  const root = group(parent, pos); root.scale.setScalar(s);
  const body = group(root, [0, 0, 0]);
  const vest = mat('#c6e83a', { roughness: 0.6, side: THREE.DoubleSide }), vestD = mat('#a9c92c'), refl = mat('#eef2f5', { roughness: 0.2, metalness: 0.5, emissive: '#ffffff', emissiveIntensity: 0.18, side: THREE.DoubleSide });
  const glove = mat('#f28a1c'), boot = mat('#7a4a28'), sole = mat('#2e2621'), belt = mat('#5a3a22'), hair = mat('#3b2a20'), white = mat('#ffffff', { roughness: 0.3 }), eyeM = mat('#1d1d1f', { roughness: 0.3 });
  const lathe = (pts, m, y = 0, o2 = {}) => { const gl = new THREE.LatheGeometry(pts.map(([r_, y_]) => new THREE.Vector2(r_, y_)), 28, o2.phiStart ?? 0, o2.phiLength ?? Math.PI * 2); const me = add(body, gl, m, [0, y, 0]); me.scale.z = 0.8; return me; };
  // pernas (calça afunilada) + botas com sola
  const legs = []; for (const x of [-0.12, 0.12]) { const lg = group(body, [x, 0.66, 0]);
    add(lg, new THREE.CylinderGeometry(0.1, 0.085, 0.52, 12), M.jeans, [0, -0.26, 0]);
    const bt = add(lg, new THREE.CapsuleGeometry(0.095, 0.12, 4, 10), boot, [0, -0.57, 0.05], { rot: [Math.PI / 2, 0, 0] }); bt.scale.x = 1.05;
    box(lg, [0.2, 0.04, 0.33], sole, [0, -0.645, 0.05]); legs.push(lg); }
  // tronco: camisa (lathe: cintura fina, peito largo) + gola + pescoço
  lathe([[0.001, 0.66], [0.2, 0.68], [0.215, 0.76], [0.255, 0.92], [0.27, 1.06], [0.25, 1.17], [0.16, 1.24], [0.001, 1.26]], M.teal);
  cyl(body, 0.075, 0.12, M.skin, [0, 1.3, 0], { seg: 12 });
  const col = add(body, new THREE.TorusGeometry(0.1, 0.03, 8, 20), M.teal, [0, 1.25, 0.01], { rot: [Math.PI / 2, 0, 0] }); col.scale.y = 0.85;
  // colete aberto na frente (lathe sem o setor da frente), faixas refletivas e bolsos
  const gap = 0.55, vo = { phiStart: gap / 2, phiLength: Math.PI * 2 - gap };
  lathe([[0.222, 0.72], [0.265, 0.9], [0.282, 1.06], [0.262, 1.16], [0.18, 1.235]], vest, 0, vo);
  for (const y of [0.88, 1.02]) lathe([[0.27 + (y > 0.95 ? 0.014 : 0.004), y - 0.022], [0.272 + (y > 0.95 ? 0.014 : 0.006), y + 0.022]], refl, 0, vo);
  for (const sx of [-1, 1]) { const pk = box(body, [0.11, 0.09, 0.03], vestD, [sx * 0.13, 0.8, 0.185]); pk.rotation.y = sx * 0.45; }
  // cinto, fivela, martelo e trena
  lathe([[0.215, 0.7], [0.222, 0.76]], belt);
  box(body, [0.08, 0.065, 0.03], mat('#d9b44a', { metalness: 0.6, roughness: 0.3 }), [0, 0.73, 0.18]);
  const ham = group(body, [0.25, 0.64, 0.05]); cyl(ham, 0.018, 0.26, M.wood, [0, 0, 0], { seg: 6 }); box(ham, [0.12, 0.05, 0.05], M.steel, [0, 0.13, 0]);
  box(body, [0.09, 0.09, 0.05], mat('#f6c22c'), [-0.235, 0.7, 0.05]);
  // braços: manga, luva laranja com polegar
  const arms = []; for (const sx of [-1, 1]) { const a = group(body, [sx * 0.29, 1.15, 0]);
    add(a, new THREE.SphereGeometry(0.088, 12, 10), vest, [0, 0, 0]); add(a, new THREE.CapsuleGeometry(0.07, 0.28, 4, 10), M.teal, [0, -0.19, 0]);
    add(a, new THREE.CylinderGeometry(0.085, 0.08, 0.06, 12), glove, [0, -0.35, 0]);
    const hand = add(a, new THREE.SphereGeometry(0.09, 14, 12), glove, [0, -0.42, 0]); hand.scale.set(0.95, 1.05, 0.8);
    add(a, new THREE.CapsuleGeometry(0.03, 0.05, 4, 8), glove, [-sx * 0.02, -0.39, 0.075], { rot: [0.6, 0, 0] }); arms.push(a); }
  // cabeça grande
  const head = group(body, [0, 1.52, 0]);
  add(head, new THREE.SphereGeometry(0.27, 28, 20), M.skin, [0, 0, 0]);
  for (const sx of [-1, 1]) { add(head, new THREE.SphereGeometry(0.058, 10, 8), M.skin, [sx * 0.265, -0.01, 0]);
    const sb = box(head, [0.04, 0.12, 0.08], mat('#5a3d2b'), [sx * 0.255, 0.05, 0.05]); sb.rotation.z = sx * 0.12; }
  const hairM = mat('#5a3d2b', { roughness: 0.9 });   // cabelo castanho em tufos na nuca (abaixo do capacete)
  for (let k = 0; k < 9; k++) { const ang = Math.PI * (1.1 + k * 0.1); const hs = add(head, new THREE.SphereGeometry(0.075, 12, 10), hairM, [Math.cos(ang) * 0.232, 0.035 - Math.abs(k - 4) * 0.006, Math.sin(ang) * 0.232], { cast: false }); hs.scale.set(1, 0.85, 0.75); }
  for (const sx of [-1, 1]) {
    const e = add(head, new THREE.SphereGeometry(0.062, 16, 12), white, [sx * 0.095, 0.035, 0.222], { cast: false }); e.scale.z = 0.6;
    add(head, new THREE.SphereGeometry(0.034, 12, 10), eyeM, [sx * 0.092, 0.028, 0.26], { cast: false });
    add(head, new THREE.SphereGeometry(0.012, 8, 6), white, [sx * 0.081, 0.044, 0.288], { cast: false });
    const lid = add(head, new THREE.SphereGeometry(0.066, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.32), M.skin, [sx * 0.095, 0.037, 0.221], { cast: false }); lid.scale.z = 0.62; lid.rotation.x = 0.25;
    const bw = box(head, [0.1, 0.028, 0.03], hair, [sx * 0.095, 0.12, 0.236], { cast: false }); bw.rotation.z = -sx * 0.14;
    const ck = add(head, new THREE.SphereGeometry(0.046, 10, 8), mat('#f39a8c'), [sx * 0.165, -0.06, 0.2], { cast: false }); ck.scale.z = 0.4;
    const mu = add(head, new THREE.SphereGeometry(0.072, 14, 10), hair, [sx * 0.056, -0.087, 0.236], { cast: false }); mu.scale.set(1.12, 0.46, 0.55); mu.rotation.z = sx * 0.28;
  }
  add(head, new THREE.SphereGeometry(0.042, 12, 10), mat('#eab28c'), [0, -0.02, 0.272], { cast: false });
  const smile = add(head, new THREE.TorusGeometry(0.055, 0.013, 6, 14, Math.PI), eyeM, [0, -0.152, 0.226], { cast: false }); smile.rotation.z = Math.PI;
  add(head, new THREE.SphereGeometry(0.03, 8, 6), mat('#e0857a'), [0, -0.178, 0.226], { cast: false }).scale.set(1.2, 0.5, 0.5);
  // capacete laranja: casco, faixa da base, aba, crista e emblema "A"
  add(head, new THREE.SphereGeometry(0.295, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.orange, [0, 0.11, 0]);
  const band = add(head, new THREE.TorusGeometry(0.293, 0.018, 6, 32), mat('#d9741a'), [0, 0.125, 0], { rot: [Math.PI / 2, 0, 0] });
  const brim = add(head, new THREE.CylinderGeometry(0.34, 0.345, 0.035, 32), M.orange, [0, 0.125, 0.05]); brim.scale.z = 1.05;
  add(head, new THREE.TorusGeometry(0.297, 0.028, 8, 28, Math.PI * 0.62), M.orange, [0, 0.11, 0], { rot: [0, Math.PI / 2, 0] });
  const bc = document.createElement('canvas'); bc.width = bc.height = 128; const bg = bc.getContext('2d');
  bg.fillStyle = '#ffffff'; bg.beginPath(); bg.arc(64, 64, 60, 0, 7); bg.fill(); bg.fillStyle = '#1f7a8c'; bg.font = '900 92px Inter, Arial Black, sans-serif'; bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.fillText('A', 64, 70);
  const bt2 = new THREE.CanvasTexture(bc); bt2.colorSpace = THREE.SRGBColorSpace;
  const badge = add(head, new THREE.CircleGeometry(0.07, 24), new THREE.MeshStandardMaterial({ map: bt2, roughness: 0.5 }), [0, 0.245, 0.268], { cast: false }); badge.rotation.x = -0.47;
  const props = {};
  // poses: idle, point (braço direito para frente), wave, up (comemora), shrug, think, umbrella, hot (abanando)
  const pose = (name, t) => {
    const b = Math.sin(t * 3.2) * 0.012; body.position.y = b; head.rotation.set(0, 0, 0); legs.forEach((l) => l.rotation.set(0, 0, 0));
    const [L, R] = arms; L.rotation.set(0, 0, 0.12); R.rotation.set(0, 0, -0.12);
    if (name === 'point') { R.rotation.set(-1.45, 0, -0.15); head.rotation.y = -0.15; }
    if (name === 'pointUp') { R.rotation.set(-2.6, 0, -0.1); head.rotation.x = -0.2; }
    if (name === 'wave') { R.rotation.set(0, 0, -2.5 + Math.sin(t * 10) * 0.35); }
    if (name === 'up') { L.rotation.set(0, 0, 2.6 + Math.sin(t * 9) * 0.15); R.rotation.set(0, 0, -2.6 - Math.sin(t * 9) * 0.15); body.position.y = Math.abs(Math.sin(t * 6)) * 0.12; }
    if (name === 'shrug') { L.rotation.set(0, 0, 0.9); R.rotation.set(0, 0, -0.9); head.rotation.z = 0.12; }
    if (name === 'scared') { L.rotation.set(-0.3, 0, 2.2); R.rotation.set(-0.3, 0, -2.2); body.position.y = Math.abs(Math.sin(t * 20)) * 0.03; }
    if (name === 'think') { R.rotation.set(-2.3, 0, 0.5); head.rotation.z = 0.15; }
    if (name === 'thumb') { R.rotation.set(-1.0, 0, -0.6); }
    if (name === 'walk') { const w = Math.sin(t * 8); legs[0].rotation.x = w * 0.5; legs[1].rotation.x = -w * 0.5; L.rotation.x = -w * 0.4; R.rotation.x = w * 0.4; }
  };
  return { root, body, head, arms, legs, pose, props };
}

// ---------- seta 3D (peso, empurrão, água) ----------
export function arrow(parent, from, to, color = '#e23b3b', r = 0.06) {
  const g = group(parent); const m = mat(color, { roughness: 0.5, emissive: color, emissiveIntensity: 0.25 });
  const A = V(from), B = V(to), dir = B.clone().sub(A), L = dir.length(); dir.normalize();
  const shaft = add(g, new THREE.CylinderGeometry(r, r, L * 0.72, 10), m, [0, 0, 0], { cast: false }); shaft.position.copy(A).addScaledVector(dir, L * 0.36);
  const head = add(g, new THREE.ConeGeometry(r * 2.6, L * 0.28, 14), m, [0, 0, 0], { cast: false }); head.position.copy(A).addScaledVector(dir, L * 0.86);
  for (const o of [shaft, head]) o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.userData = { A, dir, L }; return g;
}

// ---------- trinca desenhada sobre uma face (linha em zigue-zague que cresce) ----------
export function crack(parent, pts, o = {}) {
  const g = group(parent); const m = mat(o.color ?? '#2a1f1a', { roughness: 1 }); const segs = [];
  for (let i = 0; i < pts.length - 1; i++) { const s = rod(g, pts[i], pts[i + 1], o.r ?? 0.012, m, 5); s.castShadow = false; segs.push(s); }
  const set = (p) => { const n = p * segs.length; segs.forEach((s, i) => { const k = clamp(n - i); s.visible = k > 0; s.scale.set(1, Math.max(k, 1e-3), 1); }); };
  set(0); return { g, set };
}
/** gera pontos de trinca entre a e b com zigue-zague */
export function crackPath(a, b, n = 7, amp = 0.05, seed = 2) {
  const r = rng(seed), pts = []; for (let i = 0; i <= n; i++) { const t = i / n; const p = a.map((v, k) => lerp(v, b[k], t)); if (i > 0 && i < n) { p[0] += (r() - 0.5) * amp * 2; p[1] += (r() - 0.5) * amp * 2; } pts.push(p); } return pts;
}

// ---------- partículas (gotas azuis, bolinhas de calor) ----------
export function particles(parent, n, color = '#3fa2ff', size = 0.05) {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 10, 8), mat(color, { roughness: 0.2, emissive: color, emissiveIntensity: 0.2 }), n); im.castShadow = false; parent.add(im);
  const dummy = new THREE.Object3D();
  const set = (fn) => { for (let i = 0; i < n; i++) { const p = fn(i); dummy.position.set(...(p || [0, -99, 0])); dummy.scale.setScalar(p ? (p[3] ?? 1) : 0.0001); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); } im.instanceMatrix.needsUpdate = true; };
  set(() => null); return { im, set };
}

// ---------- câmera por quadros-chave ----------
// keys: [{t, pos:[x,y,z], look:[x,y,z], fov}]
export function camAt(keys, t) {
  let i = 0; while (i < keys.length - 1 && t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)]; const k = a === b ? 0 : ease((t - a.t) / (b.t - a.t));
  return { pos: a.pos.map((v, j) => lerp(v, b.pos[j], k)), look: a.look.map((v, j) => lerp(v, b.look[j], k)), fov: lerp(a.fov ?? 40, b.fov ?? 40, k) };
}

// ---------- camada 2D: etiquetas, nome técnico, CTA, confete ----------
export function overlay(ctx, camera, W, H) {
  const F = 'Inter, "Inter Black", Arial Black, sans-serif';
  const proj = (p) => { const v = V(p).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; };
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  return {
    clear() { ctx.clearRect(0, 0, W, H); },
    /** pílula branca com ponto colorido presa a um ponto 3D. a = 0..1 (aparecimento) */
    label(p3, text, a = 1, dot = '#e23b3b', size = 56) {
      if (a <= 0) return; const [x, y, z] = proj(p3); if (z > 1) return;
      ctx.save(); ctx.globalAlpha = clamp(a); ctx.font = `900 ${size}px ${F}`; const tw = ctx.measureText(text).width; const w = tw + size * 1.7, h = size * 1.45;
      const s = 0.6 + 0.4 * backOut(a); ctx.translate(clamp(x, w / 2 + 24, W - w / 2 - 24), clamp(y, h, H - h)); ctx.scale(s, s);
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; ctx.fillStyle = '#ffffff'; rr(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.lineWidth = 4; ctx.strokeStyle = '#1d2330'; ctx.stroke();
      ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(-w / 2 + size * 0.62, 0, size * 0.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#1d2330'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, -w / 2 + size * 1.0, size * 0.04); ctx.restore();
    },
    /** nome técnico grande amarelo, inclinado, no terço de cima. a = 0..1 */
    name(text, a = 1, y = 0.25) {
      if (a <= 0) return; ctx.save(); const s = backOut(clamp(a * 1.6)); ctx.translate(W / 2, H * y); ctx.rotate(-0.07); ctx.scale(s, s);
      let size = 150; ctx.font = `900 ${size}px ${F}`; while (ctx.measureText(text).width > W * 0.86 && size > 60) { size -= 6; ctx.font = `900 ${size}px ${F}`; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#1b1f2a'; ctx.strokeText(text, 0, size * 0.06);
      ctx.fillStyle = '#ffd23f'; ctx.fillText(text, 0, 0); ctx.restore();
    },
    /** texto de CTA no alto */
    cta(text, a = 1) {
      if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a * 2); const s = backOut(a); ctx.translate(W / 2, H * 0.17); ctx.scale(s, s);
      ctx.font = `900 96px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 22; ctx.strokeStyle = '#1b1f2a'; ctx.strokeText(text, 0, 0); ctx.fillStyle = '#ffffff'; ctx.fillText(text, 0, 0); ctx.restore();
    },
    confetti(t, a = 1) {
      if (a <= 0) return; const r = rng(9); const cols = ['#ffd23f', '#ef476f', '#06d6a0', '#118ab2', '#f28a1c'];
      for (let i = 0; i < 160; i++) { const x = r() * W, sp = 300 + r() * 500, y = ((r() * H + t * sp) % (H + 100)) - 50, rot = t * (2 + r() * 4) + r() * 6;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x + Math.sin(t * 2 + i) * 30, y); ctx.rotate(rot); ctx.fillStyle = cols[i % 5]; ctx.fillRect(-10, -5, 20, 10); ctx.restore(); }
    },
    proj,
  };
}

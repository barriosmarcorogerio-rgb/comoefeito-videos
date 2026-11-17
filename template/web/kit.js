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
  const g = group(scene); const r = rng(o.seed ?? 3);
  const ground = add(g, new THREE.PlaneGeometry(600, 600), M.grass, [0, 0, 0], { cast: false }); ground.rotation.x = -Math.PI / 2;
  if (o.road !== false) { const rd = add(g, new THREE.PlaneGeometry(600, 6), M.road, [0, 0.01, o.roadZ ?? 9], { cast: false }); rd.rotation.x = -Math.PI / 2;
    for (let x = -60; x < 60; x += 4) { const s = add(g, new THREE.PlaneGeometry(1.8, 0.18), M.white, [x, 0.02, o.roadZ ?? 9], { cast: false }); s.rotation.x = -Math.PI / 2; } }
  // casas de fundo
  const cols = ['#f3e3c3', '#e8d0d0', '#d6e6f2', '#f1f0e8', '#e3efd6'];
  for (let i = 0; i < (o.houses ?? 9); i++) {
    const x = -48 + i * 12 + r() * 4, z = -30 - r() * 14, w = 6 + r() * 3, h = 3 + r() * 1.5;
    const hg = group(g, [x, 0, z]); box(hg, [w, h, 6], mat(cols[i % cols.length]), [0, h / 2, 0]);
    const roof = add(hg, new THREE.ConeGeometry(w * 0.75, 2.2, 4), M.tile, [0, h + 1.1, 0]); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.85;
    box(hg, [1, 1.9, 0.1], M.woodDark, [0, 0.95, 3.02]); box(hg, [1.1, 1, 0.1], M.glass, [w / 3, h * 0.6, 3.02]);
  }
  for (let i = 0; i < (o.trees ?? 16); i++) { const a = r() * Math.PI * 2, d = 14 + r() * 30; tree(g, [Math.cos(a) * d, 0, -Math.abs(Math.sin(a) * d) - 6], 0.8 + r() * 0.7); }
  for (let i = 0; i < 6; i++) cloud(g, [-60 + i * 24 + r() * 8, 34 + r() * 10, -90 - r() * 40], 2.5 + r() * 2);
  return g;
}
export function tree(parent, pos, s = 1) {
  const g = group(parent, pos); cyl(g, 0.18 * s, 1.6 * s, M.trunk, [0, 0.8 * s, 0], { r2: 0.14 * s, seg: 7 });
  add(g, new THREE.IcosahedronGeometry(1.1 * s, 0), M.leaf, [0, 2.2 * s, 0]); add(g, new THREE.IcosahedronGeometry(0.8 * s, 0), M.leaf2, [0.5 * s, 2.8 * s, 0.2 * s]); return g;
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
  // "Mestre" do canal: cabeça grande, capacete laranja com o "A" do canal, olhos grandes, sobrancelhas e bigode,
  // colete amarelo-limão com faixas refletivas sobre camisa azul-petróleo, luvas laranja, cinto de ferramentas com martelo, botas marrons.
  const root = group(parent, pos); root.scale.setScalar(s);
  const body = group(root, [0, 0, 0]);
  const vest = mat('#c6e83a', { roughness: 0.6 }), refl = mat('#e9eef2', { roughness: 0.2, metalness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.15 });
  const glove = mat('#f28a1c'), boot = mat('#6b4426'), belt = mat('#5a3a22'), brow = mat('#3b2a20'), white = mat('#ffffff', { roughness: 0.3 }), eyeM = mat('#1d1d1f', { roughness: 0.3 });
  const legs = []; for (const x of [-0.13, 0.13]) { const lg = group(body, [x, 0.66, 0]); cyl(lg, 0.095, 0.56, M.jeans, [0, -0.28, 0], { seg: 12 });
    add(lg, new THREE.CapsuleGeometry(0.1, 0.12, 4, 10), boot, [0, -0.6, 0.06], { rot: [Math.PI / 2, 0, 0] }); legs.push(lg); }
  const torso = add(body, new THREE.CapsuleGeometry(0.26, 0.3, 6, 18), M.teal, [0, 0.98, 0]); torso.scale.z = 0.78;
  const vestM = add(body, new THREE.CapsuleGeometry(0.272, 0.24, 6, 18), vest, [0, 0.99, -0.004]); vestM.scale.z = 0.8;
  box(body, [0.12, 0.5, 0.05], M.teal, [0, 1.0, 0.205]);
  for (const y of [0.9, 1.06]) { const r = add(body, new THREE.TorusGeometry(0.276, 0.018, 6, 28), refl, [0, y, 0], { rot: [Math.PI / 2, 0, 0], cast: false }); r.scale.y = 0.8; }
  const bt = add(body, new THREE.TorusGeometry(0.262, 0.035, 6, 28), belt, [0, 0.74, 0], { rot: [Math.PI / 2, 0, 0] }); bt.scale.y = 0.8;
  box(body, [0.09, 0.07, 0.03], mat('#d9b44a', { metalness: 0.6, roughness: 0.3 }), [0, 0.74, 0.215]);
  const ham = group(body, [0.27, 0.66, 0.06]); cyl(ham, 0.02, 0.26, M.wood, [0, 0, 0], { seg: 6 }); box(ham, [0.12, 0.05, 0.05], M.steel, [0, 0.13, 0]);
  const arms = []; for (const sx of [-1, 1]) { const a = group(body, [sx * 0.31, 1.18, 0]);
    add(a, new THREE.SphereGeometry(0.09, 10, 8), vest, [0, 0, 0]); add(a, new THREE.CapsuleGeometry(0.075, 0.3, 4, 8), M.teal, [0, -0.2, 0]);
    add(a, new THREE.SphereGeometry(0.095, 12, 10), glove, [0, -0.42, 0]); arms.push(a); }
  const head = group(body, [0, 1.52, 0]);
  add(head, new THREE.SphereGeometry(0.27, 24, 18), M.skin, [0, 0, 0]);
  for (const sx of [-1, 1]) add(head, new THREE.SphereGeometry(0.06, 10, 8), M.skin, [sx * 0.265, -0.01, 0]);
  for (const sx of [-1, 1]) {
    const e = add(head, new THREE.SphereGeometry(0.06, 14, 10), white, [sx * 0.095, 0.035, 0.225], { cast: false }); e.scale.z = 0.6;
    add(head, new THREE.SphereGeometry(0.033, 12, 10), eyeM, [sx * 0.092, 0.03, 0.262], { cast: false });
    add(head, new THREE.SphereGeometry(0.011, 8, 6), white, [sx * 0.082, 0.045, 0.29], { cast: false });
    const bw = box(head, [0.1, 0.026, 0.03], brow, [sx * 0.095, 0.115, 0.235], { cast: false }); bw.rotation.z = -sx * 0.12;
    const ck = add(head, new THREE.SphereGeometry(0.045, 10, 8), mat('#f39a8c'), [sx * 0.16, -0.06, 0.2], { cast: false }); ck.scale.z = 0.4;
    const mu = add(head, new THREE.SphereGeometry(0.07, 12, 10), brow, [sx * 0.055, -0.085, 0.235], { cast: false }); mu.scale.set(1.1, 0.45, 0.55); mu.rotation.z = sx * 0.25;
  }
  add(head, new THREE.SphereGeometry(0.04, 12, 10), mat('#eab28c'), [0, -0.02, 0.27], { cast: false });
  const smile = add(head, new THREE.TorusGeometry(0.055, 0.012, 6, 14, Math.PI), eyeM, [0, -0.15, 0.225], { cast: false }); smile.rotation.z = Math.PI;
  add(head, new THREE.SphereGeometry(0.295, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.orange, [0, 0.11, 0]);
  const brim = add(head, new THREE.CylinderGeometry(0.34, 0.34, 0.035, 28), M.orange, [0, 0.125, 0.05]); brim.scale.z = 1.05;
  const crest = add(head, new THREE.TorusGeometry(0.297, 0.028, 8, 28, Math.PI * 0.62), M.orange, [0, 0.11, 0], { rot: [0, Math.PI / 2, 0] });
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

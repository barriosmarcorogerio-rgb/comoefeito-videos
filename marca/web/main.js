// Cena de marca v2: ponte estaiada em construção ao fim da tarde, com reflexo na água.
// Modos (hash): #banner (2560x1440), #iconB (1000x1000, cinematográfico), #iconA (1000x1000, emblema em fundo laranja).
import * as THREE from './lib/three.module.js';
const MODE = (location.hash || '#banner').slice(1);
const [W, H] = MODE === 'banner' ? [2560, 1440] : [1000, 1000];
const EMBLEM = MODE === 'iconA';
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = EMBLEM ? 1.0 : 1.1;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 1, 6000);
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const texOf = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- luz e céu ----------
const SUN = new THREE.Vector3(-0.55, 0.30, 0.78).normalize();
const env = new THREE.Group(); scene.add(env);
if (EMBLEM) {
  scene.background = new THREE.Color('#f28a1c');
} else {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: SUN } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 sunDir; varying vec3 vP;
      void main(){ float h = clamp(vP.y,0.,1.);
        vec3 top = vec3(.13,.29,.55), mid = vec3(.45,.62,.84), hor = vec3(1.,.80,.60);
        vec3 c = mix(hor, mid, smoothstep(0.,.18,h)); c = mix(c, top, smoothstep(.15,.75,h));
        float s = max(dot(normalize(vP), sunDir), 0.); c += vec3(1.,.62,.30)*(.55*pow(s,6.) + .35*pow(s,40.));
        gl_FragColor = vec4(c,1.); }`,
  }));
  env.add(sky);
  scene.fog = new THREE.Fog('#f2c9a2', 700, 3200);
}
scene.add(new THREE.HemisphereLight(EMBLEM ? '#fff1e0' : '#bcd0f5', EMBLEM ? '#c2611a' : '#7a5a44', EMBLEM ? 1.4 : 0.95));
const sun = new THREE.DirectionalLight('#ffd9a8', EMBLEM ? 2.2 : 3.4); sun.position.copy(SUN).multiplyScalar(900); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -450, right: 450, top: 450, bottom: -450, near: 100, far: 2200 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.6; scene.add(sun);
if (EMBLEM) { const fill = new THREE.DirectionalLight('#ffe6c8', 0.8); fill.position.set(400, 200, 300); scene.add(fill); }

// ---------- materiais ----------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...o });
const concTex = texOf(cv(512, 512, (g, w, h) => { g.fillStyle = '#d4d0c8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = 180 + rnd() * 50 | 0; g.fillStyle = `rgba(${v},${v - 3},${v - 10},.35)`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); } for (let y = 0; y < h; y += 64) { g.fillStyle = 'rgba(90,85,80,.18)'; g.fillRect(0, y, w, 2); } }));
const conc = EMBLEM ? std('#fff6ea') : std('#ffffff', { map: concTex });
const concNew = EMBLEM ? std('#ffffff') : std('#f1ece2');
const asphTex = texOf(cv(512, 256, (g, w, h) => { g.fillStyle = '#3a3c41'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.fillStyle = '#f2c230'; g.fillRect(0, h / 2 - 5, w, 4); g.fillRect(0, h / 2 + 2, w, 4);
  g.fillStyle = '#eeeeee'; for (const y of [h * 0.25, h * 0.75]) for (let x = 0; x < w; x += 128) g.fillRect(x, y - 2, 64, 4); g.fillRect(0, 10, w, 4); g.fillRect(0, h - 14, w, 4); }));
const asph = std('#ffffff', { map: asphTex, roughness: 0.9 });
const white = std('#f4f4f2'), cableM = std('#f3f5f8', { metalness: 0.5, roughness: 0.3 });
const orange = std('#f28a1c', { roughness: 0.55 }), yellow = std('#f6b51e', { roughness: 0.5, metalness: 0.2 }), dark = std('#2a2d33');
const rebar = std('#8e4e2c', { roughness: 0.6, metalness: 0.3 });
const add = (geo, mat, x = 0, y = 0, z = 0, p = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const rod = (a, b, r, mat, p = scene, seg = 6) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const m = add(new THREE.CylinderGeometry(r, r, A.distanceTo(B), seg), mat, 0, 0, 0, p); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m; };

// ---------- ponte (grupo refletível) ----------
const bridge = new THREE.Group(); scene.add(bridge);
const DECK = 45, TOP = 178, PX = [-120, 120], SEG = 12;
// seção caixão trapezoidal, extrudada ao longo de +x a partir de x0
const GD = EMBLEM ? 2.2 : 1; const girderGeo = (L) => { const s = new THREE.Shape(); s.moveTo(-15, 0); s.lineTo(15, 0); s.lineTo(15, -1.2 * GD); s.lineTo(8, -4.2 * GD); s.lineTo(-8, -4.2 * GD); s.lineTo(-15, -1.2 * GD); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: L - 0.25, bevelEnabled: false }); g.rotateY(Math.PI / 2); return g; };
const segment = (x0, finished, mat = conc) => {
  add(girderGeo(SEG), mat, x0, DECK, 0, bridge);
  if (finished) {
    add(box(SEG, 0.12, 26), asph, x0 + SEG / 2, DECK + 0.06, 0, bridge);
    for (const z of [-14.4, 14.4]) add(box(SEG, 1.1, 0.6), white, x0 + SEG / 2, DECK + 0.6, z, bridge);
    add(box(SEG, 0.9, 1.0), white, x0 + SEG / 2, DECK + 0.45, 0, bridge);
  }
};
const cableTo = (px, k, x) => { const hy = TOP - 46 + k * 4.4; rod([px, hy, 0], [x, DECK + 1.0, 0], EMBLEM ? 0.9 : 0.32, cableM, bridge); };
const NIN = { [-120]: 8, [120]: 7 };
for (const px of PX) {
  const inward = px < 0 ? 1 : -1;
  add(new THREE.CylinderGeometry(20, 22, 7, 32), conc, px, 1.5, 0, bridge);
  for (const s of [-1, 1]) rod([px, 2, s * 17], [px, DECK - 4, s * 3.2], EMBLEM ? 4 : 2.6, conc, bridge, 8);
  add(box(5, 4, 34), conc, px, DECK - 5.5, 0, bridge);
  const mast = add(new THREE.CylinderGeometry(EMBLEM ? 3.6 : 2.2, EMBLEM ? 5.5 : 3.6, TOP - DECK + 4, 4), conc, px, (TOP + DECK) / 2 - 2, 0, bridge); mast.rotation.y = Math.PI / 4;
  add(new THREE.ConeGeometry(EMBLEM ? 3.6 : 2.2, EMBLEM ? 7 : 4, 4), conc, px, TOP + 2, 0, bridge).rotation.y = Math.PI / 4;
  // lado de fora: completo até a margem
  for (let i = 0; i < 19; i++) segment(inward > 0 ? px - (i + 1) * SEG : px + i * SEG, true);
  // lado do vão central: em balanço, últimos 3 segmentos ainda sem asfalto
  const nIn = NIN[px];
  for (let i = 0; i < nIn; i++) segment(inward > 0 ? px + i * SEG : px - (i + 1) * SEG, i < nIn - 3, i === nIn - 1 ? concNew : conc);
  for (let k = 1; k <= 10; k++) { const d = k * 11 + 8; cableTo(px, k, px - inward * d); if (d < nIn * SEG - 4) cableTo(px, k, px + inward * d); }
  // ponta: armadura saindo + carro de avanço laranja
  const tip = px + inward * nIn * SEG;
  for (let z = -13; z <= 13; z += 2) rod([tip, DECK - 0.6, z], [tip + inward * 2.6, DECK - 0.6, z], 0.16, rebar, bridge, 4);
  const f = (x) => tip + inward * x;
  for (const z of [-13, 13]) { rod([f(3), DECK + 1, z], [f(-13), DECK + 9, z], 0.45, orange, bridge); rod([f(3), DECK + 9, z], [f(-13), DECK + 9, z], 0.45, orange, bridge); rod([f(3), DECK - 5, z], [f(3), DECK + 9, z], 0.45, orange, bridge); rod([f(3), DECK - 5, z], [f(-6), DECK - 5, z], 0.45, orange, bridge); }
  rod([f(3), DECK + 9, -13], [f(3), DECK + 9, 13], 0.45, orange, bridge); rod([f(3), DECK - 5, -13], [f(3), DECK - 5, 13], 0.45, orange, bridge);
}
if (!EMBLEM) for (let x = -340; x <= 340; x += 24) { if (x > -70 && x < 75) continue; rod([x, DECK + 0.9, 0], [x, DECK + 9, 0], 0.18, white, bridge, 5); add(box(3.2, 0.3, 0.6), white, x, DECK + 9, 0, bridge); }

// guindaste de torre atrás da torre esquerda, içando o próximo segmento
if (!EMBLEM) {
  const crane = new THREE.Group(); bridge.add(crane);
  const CX = -165, CZ = -48, CH = 215; add(new THREE.CylinderGeometry(9, 10, 6, 20), conc, CX, 1, CZ, crane);
  for (let y = 0; y < CH; y += 7) {
    for (const [dx, dz] of [[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]) rod([CX + dx, y, CZ + dz], [CX + dx, y + 7, CZ + dz], 0.3, yellow, crane, 5);
    for (const [a, b] of [[[-2.2, -2.2], [2.2, -2.2]], [[2.2, -2.2], [2.2, 2.2]], [[2.2, 2.2], [-2.2, 2.2]], [[-2.2, 2.2], [-2.2, -2.2]]]) rod([CX + a[0], y, CZ + a[1]], [CX + b[0], y + 7, CZ + b[1]], 0.16, yellow, crane, 4);
  }
  add(box(7, 6, 7), dark, CX, CH + 3, CZ, crane); add(box(3, 2.5, 3.2), std('#dfe6ee', { roughness: 0.2 }), CX + 4.5, CH + 2, CZ, crane);
  const tgt = new THREE.Vector3(-30, 0, 0); const dir = new THREE.Vector3(tgt.x - CX, 0, tgt.z - CZ); const HD = dir.length(), JL = HD + 14; const ang = Math.atan2(-dir.z, dir.x);
  const jib = new THREE.Group(); jib.position.set(CX, CH + 7, CZ); jib.rotation.y = ang; crane.add(jib);
  for (let x = 0; x < JL; x += 6) { for (const z of [-1.4, 1.4]) rod([x, 0, z], [x + 6, 0, z], 0.22, yellow, jib, 4); rod([x, 2.6, 0], [x + 6, 2.6, 0], 0.22, yellow, jib, 4); for (const z of [-1.4, 1.4]) rod([x, 0, z], [x + 6, 2.6, 0], 0.13, yellow, jib, 4); }
  for (let x = -40; x < 0; x += 6) for (const z of [-1.4, 1.4]) rod([x, 0, z], [x + 6, 0, z], 0.3, yellow, jib, 4);
  add(box(10, 6, 6), conc, -36, -2, 0, jib); rod([0, 0, 0], [0, 16, 0], 0.5, yellow, jib); rod([0, 16, 0], [JL * 0.7, 2.6, 0], 0.12, dark, jib, 4); rod([0, 16, 0], [-36, 1, 0], 0.12, dark, jib, 4);
  const HY = DECK + 24; rod([HD, 0, 0], [HD, HY + 6.5 - (CH + 7), 0], 0.14, dark, jib, 4);
  const piece = new THREE.Group(); piece.position.set(HD, HY - (CH + 7), 0); jib.add(piece); piece.rotation.y = -ang;
  add(box(14, 0.6, 1), orange, 0, 6.5, 0, piece); for (const s of [-1, 1]) for (const t of [-1, 1]) rod([0, 6.5, 0], [s * 5, 0, t * 12], 0.1, dark, piece, 4);
  add(girderGeo(SEG), concNew, -SEG / 2, 0, 0, piece);
}

// ---------- ambiente (margens, morros, cidade, barcos, água) ----------
if (!EMBLEM) {
  const grass = std('#7d8f5a'), rock = std('#a69780'), hillM = std('#6f8a6a'), hillFar = std('#8fa3a3');
  for (const s of [-1, 1]) {
    add(box(700, 30, 900), grass, s * 700, 0, -100, bridge);
    add(box(40, 50, 40), conc, s * 347, DECK - 25, 0, bridge);
  }
  for (let i = 0; i < 18; i++) { const r = 160 + rnd() * 160; const m = add(new THREE.SphereGeometry(r, 24, 12), i % 2 ? hillM : hillFar, -1800 + i * 220 + rnd() * 80, -r * 0.35, -1500 - rnd() * 500, env); m.scale.y = 0.45 + rnd() * 0.2; m.castShadow = false; }
  for (let i = 0; i < 70; i++) { const h = 25 + rnd() * rnd() * 140; const w = 18 + rnd() * 18; add(box(w, h, w), std(['#e9e3d8', '#cfd6de', '#f1e4cf', '#bfc8d2'][i % 4]), -800 + i * 23 + rnd() * 8, h / 2, -1500 - rnd() * 200, env).castShadow = false; }
  for (const [x, z, r] of [[250, 210, 0.3], [-60, 330, -0.4], [560, -260, 1.2]]) { const b = new THREE.Group(); b.position.set(x, 0.8, z); b.rotation.y = r; bridge.add(b); add(box(16, 2.2, 5), white, 0, 0, 0, b); add(box(6, 3, 4), std('#2c5d8a'), -2, 2.6, 0, b); }
  const mirror = bridge.clone(true); mirror.scale.y = -1; mirror.traverse((o) => { o.castShadow = false; o.receiveShadow = false; }); scene.add(mirror);
  const ripple = texOf(cv(1024, 1024, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(20,60,95,${rnd() * 0.18})`; g.fillRect(rnd() * w, rnd() * h, 30 + rnd() * 160, 1 + rnd() * 2); } }), 30, 60);
  const water = add(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: '#2f6b8f', map: ripple, roughness: 0.35, metalness: 0.15, transparent: true, opacity: 0.72 }), 0, 0, 0, env);
  water.rotation.x = -Math.PI / 2; water.castShadow = false; water.receiveShadow = false;
}

// ---------- câmeras ----------
if (MODE === 'banner') { camera.fov = 33; camera.position.set(70, 30, 420); camera.lookAt(8, 110, 0); }
else if (MODE === 'sq1') { camera.fov = 40; camera.position.set(165, 40, 270); camera.lookAt(120, 106, 0); }
else if (MODE === 'sq2') { camera.fov = 46; camera.position.set(22, 62, 125); camera.lookAt(-6, 60, 0); }
else if (MODE === 'sq3') { camera.fov = 52; camera.position.set(-70, 18, 190); camera.lookAt(-135, 125, 0); }
else { camera.fov = 19; camera.position.set(-112, 70, 620); camera.lookAt(-114, 96, 0); }
camera.aspect = W / H; camera.updateProjectionMatrix();
renderer.render(scene, camera);
window.ready = true;

// Cena de marca: ponte estaiada em construção (balanço sucessivo) + guindaste. Modo pelo hash: #icon ou #banner.
import * as THREE from './lib/three.module.js';
const MODE = (location.hash || '#icon').slice(1);
const SIZES = { icon: [1000, 1000], banner: [2560, 1440] };
const [W, H] = SIZES[MODE] || SIZES.icon;
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.5, 4000);

// céu em degradê
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+.05,0.,1.); vec3 c = mix(vec3(.80,.88,.96), vec3(.17,.42,.78), pow(h,.7)); gl_FragColor = vec4(c,1.); }`,
}));
scene.add(sky);
scene.add(new THREE.HemisphereLight('#dfeaff', '#7a7466', 1.1));
const sun = new THREE.DirectionalLight('#fff3df', 2.6); sun.position.set(-120, 220, 160); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -220, right: 220, top: 220, bottom: -220, near: 10, far: 800 });
sun.shadow.bias = -0.0004; scene.add(sun);
scene.fog = new THREE.Fog('#c9dbef', 500, 1800);

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
const concrete = std('#c9c6bf'), concreteNew = std('#dcd8cf'), steel = std('#7d8794', { metalness: 0.4, roughness: 0.5 });
const orange = std('#f28a1c', { roughness: 0.6 }), dark = std('#2b2f36'), cableM = std('#e9edf2', { metalness: 0.3, roughness: 0.4 });
const rebar = std('#9a5a32', { roughness: 0.7 }), water = std('#2f6f9a', { roughness: 0.25, metalness: 0.1 });
const add = (geo, mat, x = 0, y = 0, z = 0, p = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const edges = (m, color = '#3a3f47') => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 })); m.add(e); return m; };
const rod = (a, b, r, mat) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const L = A.distanceTo(B); const m = add(new THREE.CylinderGeometry(r, r, L, 6), mat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m; };

// água e margens
const sea = add(new THREE.PlaneGeometry(6000, 6000), water, 0, 0, 0); sea.rotation.x = -Math.PI / 2;
const bank = std('#8a9a6a');
add(box(400, 12, 300), bank, -520, 4, 0); add(box(400, 12, 300), bank, 520, 4, 0);

// ponte: eixo x, tabuleiro a 40 m, pilares (torres) em x = ±110, vão central com fresta no meio
const DECK = 40, PY = [-110, 110], TOP = 150;
const deckSeg = (x0, x1, mat = concrete) => edges(add(box(x1 - x0, 3.2, 26), mat, (x0 + x1) / 2, DECK, 0));
for (const px of PY) {
  // torre em A (duas pernas que se juntam), com fundação
  add(new THREE.CylinderGeometry(14, 16, 8, 24), concrete, px, 2, 0);
  for (const s of [-1, 1]) {
    const leg = rod([px, 4, s * 16], [px, TOP, s * 2.2], 3.0, concrete); edges(leg);
  }
  edges(add(box(6, 26, 6), concrete, px, TOP - 6, 0));
  add(box(4, 3, 30), concrete, px, DECK - 3, 0); // travessa sob o tabuleiro
  // tabuleiro em balanço: lado de fora completo, lado do vão central incompleto
  const inward = px < 0 ? 1 : -1;
  deckSeg(Math.min(px - 190 * inward, px), Math.max(px - 190 * inward, px));
  const reach = px < 0 ? 92 : 82; // fresta assimétrica no meio
  const a = px, b = px + inward * reach; deckSeg(Math.min(a, b), Math.max(a, b));
  // último segmento recém-concretado (mais claro) e armadura saindo
  const e = px + inward * reach; const seg = edges(add(box(10, 3.2, 26), concreteNew, e + inward * 5, DECK, 0));
  for (let z = -11; z <= 11; z += 2.2) rod([e + inward * 10, DECK + 0.6, z], [e + inward * 12.5, DECK + 0.6, z], 0.18, rebar);
  // carro de avanço (treliça laranja) na ponta
  const tx = e + inward * 10;
  for (const z of [-12, 12]) { rod([tx, DECK + 1.6, z], [tx - inward * 14, DECK + 9, z], 0.5, orange); rod([tx, DECK + 9, z], [tx - inward * 14, DECK + 9, z], 0.5, orange); rod([tx, DECK + 1.6, z], [tx, DECK + 9, z], 0.5, orange); }
  rod([tx, DECK + 9, -12], [tx, DECK + 9, 12], 0.5, orange);
  // estais em leque (dos dois lados, ambos os planos)
  for (let i = 1; i <= 9; i++) {
    const hy = TOP - 22 + i * 1.6;
    for (const side of [-1, 1]) {
      const dx = side * i * 19; if (side === inward && i * 19 > reach) continue;
      for (const z of [-12.5, 12.5]) rod([px, hy, z * 0.12], [px + dx, DECK + 1.6, z], 0.35, cableM);
    }
  }
}
// guindaste de torre ao lado da torre esquerda
const CX = -75, CZ = -30;
edges(add(new THREE.CylinderGeometry(7, 8, 6, 16), concrete, CX, 2, CZ));
for (let y = 0; y < 182; y += 6) {
  for (const [dx, dz] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) rod([CX + dx, y, CZ + dz], [CX + dx, y + 6, CZ + dz], 0.25, orange);
  rod([CX - 2, y, CZ - 2], [CX + 2, y + 6, CZ - 2], 0.15, orange); rod([CX - 2, y, CZ + 2], [CX + 2, y + 6, CZ + 2], 0.15, orange);
  rod([CX - 2, y, CZ - 2], [CX - 2, y + 6, CZ + 2], 0.15, orange); rod([CX + 2, y, CZ - 2], [CX + 2, y + 6, CZ + 2], 0.15, orange);
}
edges(add(box(6, 5, 6), dark, CX, 184, CZ));
const JIB = 95, ang = -0.457; const jib = new THREE.Group(); jib.position.set(CX, 188, CZ); jib.rotation.y = ang; scene.add(jib);
const jadd = (geo, mat, x, y, z) => add(geo, mat, x, y, z, jib);
jadd(box(JIB, 1.4, 2.4), orange, JIB / 2 - 4, 0, 0); jadd(box(28, 1.4, 2.4), orange, -16, 0, 0);
edges(jadd(box(8, 5, 5), concrete, -26, -1.5, 0)); jadd(box(2, 14, 2), orange, 0, 7, 0);
// cabo + segmento pré-moldado pendurado
const hx = 68, hy = DECK + 26; jadd(new THREE.CylinderGeometry(0.15, 0.15, 188 - hy - 4, 5), dark, hx, -(188 - hy) / 2 + 2, 0);
const piece = new THREE.Group(); piece.position.set(hx, hy - 188, 0); jib.add(piece);
edges(add(box(10, 3.2, 14), orange, 0, -3, 0, piece), '#7a3f00');
for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.12, 0.12, 6, 4), dark, 0, 0, s * 3, piece);

// margem do fundo: morros e cidade
const hill = std('#7f9a74'); for (let i = 0; i < 14; i++) { const m = add(new THREE.SphereGeometry(140 + (i * 37) % 90, 20, 10), hill, -1100 + i * 170, -60, -900 - (i * 53) % 120); m.scale.y = 0.55; }
for (let i = 0; i < 40; i++) { const h = 20 + ((i * 71) % 60); edges(add(box(24, h, 24), std(['#d9dde3', '#b8c2cc', '#e8e2d6'][i % 3]), -600 + i * 31, h / 2, -760 - (i * 29) % 60), '#6b7480'); }
// câmeras
if (MODE === 'icon') {
  camera.fov = 42; camera.aspect = 1; camera.position.set(60, 95, 300); camera.lookAt(-55, 100, 0);
} else {
  camera.fov = 30; camera.aspect = W / H; camera.position.set(170, 110, 520); camera.lookAt(0, 88, 0);
}
camera.updateProjectionMatrix();
renderer.render(scene, camera);
window.ready = true;

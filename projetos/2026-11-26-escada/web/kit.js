// Kit de construção 3D "brinquedo" do canal Aprenda Como É Feito.
// Tudo que o story.js precisa: ambiente, materiais, peças (tijolos, vigas, lajes, telhas...), mascote, setas,
// trincas, gotas, e a camada 2D (etiquetas, nome técnico, CTA). Unidades em metros, y para cima.
import * as THREE from './lib/three.module.js';
import { EffectComposer } from './lib/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './lib/addons/postprocessing/RenderPass.js';
import { GTAOPass } from './lib/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from './lib/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from './lib/addons/postprocessing/ShaderPass.js';
import { OutputPass } from './lib/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from './lib/addons/geometries/RoundedBoxGeometry.js';
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
/** desfoca um canvas de textura (tira detalhe fino que pisca/treme quando a câmera anda) */
function soften(cv, px) { const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; const g = t.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(cv, 0, 0); const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(t, 0, 0); }

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
// NUNCA piscar (parece defeito — feedback do dono): usar a = K.glow(t, inicio, fim) que acende e apaga devagar.
export function highlight(mesh, a, color = '#ffd23f') {
  mesh.traverse((m) => { if (!m.material || !m.material.emissive) return; if (!m.userData._hl) { m.material = m.material.clone(); m.userData._hl = 1; }
    m.material.emissive.set(color); m.material.emissiveIntensity = 0.42 * ease(clamp(a)); });
}
/** envelope suave para destaque: sobe em 0,35 s a partir de t0, fica, e desce em 0,5 s até t1 */
export const glow = (t, t0, t1) => clamp(Math.min((t - t0) / 0.35, (t1 - t) / 0.5));
/** coisas que se mexem sozinhas em todo quadro (nuvens, pássaros): o motor chama TICK.forEach(f => f(t)) */
export const TICK = [];

// ---------- cena base ----------
export const ENV = { map: null };
export function setup(canvas, W = 1080, H = 1920) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  const SS = window.SS ?? 1.25;   // supersampling: desenha maior e reduz (bordas lisas, sem serrilhado/tremor)
  renderer.setPixelRatio(SS); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 2000);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: new THREE.Vector3(0.45, 0.42, -0.79).normalize() } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 sunDir; varying vec3 vP; void main(){ float h = clamp(vP.y,0.,1.);
      vec3 c = mix(vec3(.86,.93,1.), vec3(.42,.68,.98), smoothstep(0.,.35,h)); c = mix(c, vec3(.22,.5,.92), smoothstep(.35,1.,h));
      float s = max(dot(normalize(vP), sunDir), 0.); c += vec3(1.,.92,.7)*(.35*pow(s,8.) + 1.2*smoothstep(.9985,.9992,s));
      c = pow(c, vec3(2.2)) * 0.82; gl_FragColor = vec4(c,1.); }`,   // céu em cor linear (o pós-processamento converte e aplica o tom)
  }));
  scene.add(sky);
  // mapa de reflexo do céu (para vidros espelhados): só materiais que pedirem usam
  { const es = new THREE.Scene(); es.add(sky.clone()); const pm = new THREE.PMREMGenerator(renderer); ENV.map = pm.fromScene(es, 0.02).texture; }
  scene.add(new THREE.HemisphereLight('#ffffff', '#8fae6a', 1.25));
  const sun = new THREE.DirectionalLight('#fff6e6', 2.4); sun.position.set(18, 30, 22); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 120 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3; scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55); fill.position.set(-20, 12, -14); scene.add(fill);   // luz de preenchimento fria (sombras não ficam pretas)
  scene.fog = new THREE.Fog('#cfe6ff', 60, 260);
  // ---- pós-processamento: oclusão de ambiente (cantos e encostos escurecem), brilho suave, cor e vinheta
  const composer = new EffectComposer(renderer); composer.setPixelRatio(SS); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, W * SS, H * SS); ao.blendIntensity = window.AO ?? 0.85;
  ao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.2, thickness: 1.5, scale: 1.0, samples: 4, distanceFallOff: 1.0, screenSpaceRadius: false });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 4 });
  { const r0 = ao.render.bind(ao); ao.render = (...x) => { sky.visible = false; r0(...x); sky.visible = true; }; }   // céu não recebe AO
  if (window.AO !== 0) composer.addPass(ao);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W * SS / 2, H * SS / 2), 0.16, 0.5, 0.92));
  composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(.2126,.7152,.0722)); c.rgb = mix(vec3(l), c.rgb, 1.12);            // cor um pouco mais viva
      c.rgb *= vec3(1.02, 1.0, .97);                                                               // leve calor
      vec2 d = vUv - .5; d.x *= .5625; c.rgb *= 1. - .35 * smoothstep(.25, .75, length(d) * 1.25); // vinheta suave
      gl_FragColor = c; }` }));
  composer.addPass(new OutputPass());
  return { renderer, scene, camera, sun, composer, SS };
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
  for (let i = 0; i < 9000; i++) { const l = 36 + r() * 22; gx.strokeStyle = `hsl(${95 + r() * 20},${45 + r() * 20}%,${l}%)`; gx.lineWidth = 1 + r(); const x = r() * 512, y = r() * 512; gx.beginPath(); gx.moveTo(x, y); gx.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); gx.stroke(); }
  soften(gc, 0.7);
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(160, 160); gt.colorSpace = THREE.SRGBColorSpace; gt.anisotropy = 8;
  const ground = add(g, new THREE.PlaneGeometry(600, 600), mat('#ffffff', { map: gt, roughness: 1 }), [0, 0, 0], { cast: false }); ground.rotation.x = -Math.PI / 2;
  // terra batida da obra
  const dc = document.createElement('canvas'); dc.width = dc.height = 256; const dx = dc.getContext('2d'); dx.fillStyle = '#a5815c'; dx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) { const v = r(); dx.fillStyle = v < 0.5 ? 'rgba(120,90,60,.5)' : 'rgba(190,160,120,.5)'; dx.globalAlpha = 0.45; dx.beginPath(); dx.ellipse(r() * 256, r() * 256, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, 7); dx.fill(); dx.globalAlpha = 1; } soften(dc, 1.5);
  const dt = new THREE.CanvasTexture(dc); dt.wrapS = dt.wrapT = THREE.RepeatWrapping; dt.repeat.set((site.x1 - site.x0) / 2, (site.z1 - site.z0) / 2); dt.colorSpace = THREE.SRGBColorSpace; dt.anisotropy = 8;
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
  sky(g, r);
  return g;
}
/** casa de fundo: paredes, telhado de duas águas com beiral, janelas com moldura, porta, chaminé, degrau, arbustos */
/** céu cheio: nuvens em 3 distâncias, morros azulados no horizonte, pássaros */
export function sky(g, r = rng(5), o = {}) {
  for (let k = 0; k < 9; k++) cloud(g, [-110 + k * 27 + r() * 10, 40 + r() * 16, -150 - r() * 50], 3 + r() * 2.5);
  for (let k = 0; k < 7; k++) cloud(g, [-55 + k * 17 + r() * 6, 22 + r() * 7, -70 - r() * 20], 1.8 + r() * 1.4);
  for (let k = 0; k < 4; k++) cloud(g, [-26 + k * 15 + r() * 6, 13 + r() * 4, -38 - r() * 8], 1.1 + r() * 0.7);
  if (o.hills !== false) { const hm = [mat('#8fbf8a'), mat('#9cc6a6'), mat('#a9cbb8')];
    for (let k = 0; k < 16; k++) { const rr = 25 + r() * 30; const hh = add(g, new THREE.SphereGeometry(rr, 20, 10), hm[k % 3], [-220 + k * 30 + r() * 10, -rr * 0.55, -190 - r() * 40], { cast: false }); hh.scale.y = 0.5 + r() * 0.3; } }
  const bm = mat('#2d2f36'); const bird = (x, y, z, sc) => { const bg = group(g, [x, y, z]); const wings = []; const ph = r() * 6;
    for (const sx of [-1, 1]) { const piv = group(bg, [0, 0, 0]); add(piv, new THREE.BoxGeometry(0.5 * sc, 0.06 * sc, 0.12 * sc), bm, [sx * 0.25 * sc, 0, 0], { cast: false }); wings.push([piv, sx]); }
    TICK.push((t) => { const f = Math.sin(t * 9 + ph); wings.forEach(([p, sx]) => { p.rotation.z = sx * (0.15 + 0.55 * f); }); bg.position.set(x + t * 1.6, y + Math.sin(t * 0.8 + ph) * 0.4, z); }); };
  for (let k = 0; k < 6; k++) bird(-8 + k * 1.3 + r(), 14 + r() * 2.5, -30 - r() * 4, 1 + r() * 0.3);
}
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
  const x0 = pos[0], sp = 0.25 + 0.6 * clamp(1 - (-pos[2] - 30) / 150);   // perto anda mais rápido
  TICK.push((t) => { g.position.x = x0 + t * sp; });
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
  const im = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.09), mat('#ffffff', { roughness: 0.8 }), bricks.length); im.castShadow = im.receiveShadow = true; g.add(im);
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
export const MASCOTS = [];
export function mascot(parent, pos = [0, 0, 0], s = 1) {
  // "Mestre" do canal (marca registrada): cabeça grande, capacete laranja com "A", olhos grandes, sobrancelhas, bigode e costeletas,
  // colete amarelo-limão ABERTO com faixas refletivas e bolsos sobre camisa azul-petróleo de gola, luvas laranja com polegar,
  // cinto de ferramentas com martelo e trena, calça jeans, botas marrons com sola.
  const root = group(parent, pos); root.scale.setScalar(s);
  const body = group(root, [0, 0, 0]);
  // ---- materiais (v2: tecido com trama suave, capacete de plástico brilhante, pele acetinada)
  const clothTex = (base, dark, lines) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 256); const r = rng(lines);
    for (let i = 0; i < 256; i += 3) { g.fillStyle = `rgba(0,0,0,${0.035 + r() * 0.03})`; g.fillRect(0, i, 256, 1); g.fillStyle = `rgba(255,255,255,${0.025 + r() * 0.02})`; g.fillRect(i, 0, 1, 256); }
    for (let i = 0; i < 600; i++) { g.fillStyle = r() < 0.5 ? dark : 'rgba(255,255,255,.05)'; g.fillRect(r() * 256, r() * 256, 2, 2); }
    soften(c, 0.6); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const jeans = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: clothTex('#3b5f99', 'rgba(20,30,60,.12)', 3), roughness: 0.9, sheen: 0.4, sheenColor: new THREE.Color('#8fb0e6') });
  const jeansD = mat('#2f4e82', { roughness: 0.9 });
  const shirt = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: clothTex('#1f7a8c', 'rgba(0,40,50,.12)', 5), roughness: 0.85, sheen: 0.3, sheenColor: new THREE.Color('#9fe0ea') });
  const skin = new THREE.MeshPhysicalMaterial({ color: '#f2c7a0', roughness: 0.55, sheen: 0.25, sheenColor: new THREE.Color('#ffd9c2') });
  const vest = new THREE.MeshPhysicalMaterial({ color: '#c6e83a', roughness: 0.6, side: THREE.DoubleSide, sheen: 0.3, sheenColor: new THREE.Color('#f4ff9a') }), vestD = mat('#a9c92c', { roughness: 0.65 });
  const refl = mat('#eef2f5', { roughness: 0.25, metalness: 0.5, emissive: '#ffffff', emissiveIntensity: 0.2, side: THREE.DoubleSide });
  const helmetM = new THREE.MeshPhysicalMaterial({ color: '#f28a1c', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2 }), helmetD = new THREE.MeshPhysicalMaterial({ color: '#e07a14', roughness: 0.4, clearcoat: 0.8 });
  const glove = mat('#f28a1c', { roughness: 0.7 }), gloveD = mat('#d9761a', { roughness: 0.75 }), boot = mat('#7a4a28', { roughness: 0.7 }), bootD = mat('#5e381e', { roughness: 0.75 }), sole = mat('#3a2e27', { roughness: 0.9 });
  const belt = mat('#5a3a22', { roughness: 0.7 }), hair = mat('#3b2a20', { roughness: 0.8 }), hairM = mat('#5a3d2b', { roughness: 0.85 });
  const white = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, clearcoat: 1 }), eyeM = new THREE.MeshPhysicalMaterial({ color: '#1d1d1f', roughness: 0.15, clearcoat: 1 });
  const lathe = (pts, m, y = 0, o2 = {}, par = body, sz = 0.8) => { const gl = new THREE.LatheGeometry(pts.map(([r_, y_]) => new THREE.Vector2(r_, y_)), 48, o2.phiStart ?? 0, o2.phiLength ?? Math.PI * 2); const me = add(par, gl, m, [0, y, 0]); me.scale.z = sz; return me; };
  const smoothPts = (pts, n = 6) => new THREE.SplineCurve(pts.map(([a, b]) => new THREE.Vector2(a, b))).getPoints(pts.length * n).map((v) => [Math.max(v.x, 0.001), v.y]);
  const tube = (par, pts, r, m) => add(par, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 24, r, 8, false), m, [0, 0, 0]);
  const rbox = (par, size, m, p, rad = 0.012) => add(par, new RoundedBoxGeometry(...size, 3, rad), m, p);
  // ---- pernas: calça com joelho e barra dobrada; bota de cano curto com bico, cadarço e sola com salto
  const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const blobs = [-0.115, 0.115].map((x) => { const m = add(root, new THREE.PlaneGeometry(0.34, 0.5), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }), [x, 0.004, 0.06], { cast: false }); m.rotation.x = -Math.PI / 2; m.receiveShadow = false; m.renderOrder = 1; return m; });
  const legs = []; for (const x of [-0.115, 0.115]) { const lg = group(body, [x, 0.66, 0]);
    const leg = add(lg, new THREE.LatheGeometry(smoothPts([[0.108, 0.02], [0.104, -0.08], [0.094, -0.24], [0.09, -0.3], [0.086, -0.42], [0.094, -0.5]]).map(([a, b]) => new THREE.Vector2(a, b)), 32), jeans, [0, 0, 0]); leg.scale.z = 0.95;
    add(lg, new THREE.TorusGeometry(0.093, 0.014, 8, 32), jeansD, [0, -0.49, 0], { rot: [Math.PI / 2, 0, 0] });
    { const o = Math.sign(x); tube(lg, [[o * 0.106, -0.02, 0], [o * 0.094, -0.25, 0], [o * 0.087, -0.47, 0]], 0.004, mat('#d9b44a')); }   // costura lateral
    // bota: cano com colarinho acolchoado, gáspea arredondada, bico reforçado, lingueta, cadarço, vira clara e sola grossa com salto e ranhuras (apoiada no chão: base em y = -0.66)
    add(lg, new THREE.CylinderGeometry(0.084, 0.092, 0.12, 28), boot, [0, -0.535, 0]);
    add(lg, new THREE.TorusGeometry(0.086, 0.016, 10, 28), bootD, [0, -0.475, 0], { rot: [Math.PI / 2, 0, 0] });
    const vamp = add(lg, new THREE.SphereGeometry(0.104, 36, 22, 0, Math.PI * 2, 0, Math.PI * 0.55), boot, [0, -0.622, 0.055]); vamp.scale.set(1.0, 0.78, 1.6);
    const toe = add(lg, new THREE.SphereGeometry(0.072, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), bootD, [0, -0.622, 0.15]); toe.scale.set(1.3, 0.62, 1.0);
    const tongueB = add(lg, new THREE.CapsuleGeometry(0.035, 0.07, 6, 12), bootD, [0, -0.53, 0.075]); tongueB.rotation.x = -0.35; tongueB.scale.z = 0.45;
    for (let k = 0; k < 3; k++) add(lg, new THREE.TorusGeometry(0.032, 0.006, 6, 14, Math.PI), mat('#f0e6d2'), [0, -0.515 - k * 0.026, 0.087 + k * 0.014], { rot: [-0.35, 0, 0], cast: false });
    // sola com contorno de sapato (bico redondo e calcanhar arredondado, não um retângulo) + vira escura por cima
    const soleGeo = (w, l, h, bev) => { const sh = new THREE.Shape(), rt = w / 2, rh = w * 0.42, zt = l / 2 - rt, zh = -l / 2 + rh;
      sh.moveTo(-w / 2, zh); sh.lineTo(-w / 2, zt); sh.absarc(0, zt, rt, Math.PI, 0, true); sh.lineTo(w / 2, zh); sh.absellipse(0, zh, w / 2, rh, 0, -Math.PI, true);
      const g = new THREE.ExtrudeGeometry(sh, { depth: h - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 20 }); g.rotateX(Math.PI / 2); g.translate(0, h / 2 - bev, 0); return g; };
    add(lg, soleGeo(0.2, 0.345, 0.014, 0.004), mat('#5e3d24', { roughness: 0.8 }), [0, -0.618, 0.06]);   // vira
    add(lg, soleGeo(0.198, 0.342, 0.03, 0.008), sole, [0, -0.641, 0.06]);                               // sola grossa
    add(lg, soleGeo(0.19, 0.12, 0.012, 0.004), mat('#2a221d', { roughness: 0.95 }), [0, -0.656, -0.05]); // salto (marca embaixo)
    legs.push(lg); }
  // ---- tronco: camisa (barriga redonda, peito largo), gola com pontas, pescoço
  lathe(smoothPts([[0.001, 0.66], [0.198, 0.675], [0.218, 0.76], [0.25, 0.9], [0.268, 1.04], [0.255, 1.15], [0.19, 1.225], [0.001, 1.255]]), shirt);
  add(body, new THREE.CylinderGeometry(0.072, 0.08, 0.13, 24), skin, [0, 1.3, 0]);
  const col = add(body, new THREE.TorusGeometry(0.098, 0.026, 12, 32), shirt, [0, 1.245, 0.005], { rot: [Math.PI / 2, 0, 0] }); col.scale.y = 0.85;
  for (const y of [0.86, 0.98, 1.1]) add(body, new THREE.SphereGeometry(0.014, 12, 8), white, [0, y, 0.217 - (y > 1.05 ? 0.008 : 0)], { cast: false });
  // ---- colete aberto: corpo, debrum arredondado nas bordas da abertura e cavas, faixas refletivas, bolsos com lapela
  const gap = 0.55, vo = { phiStart: gap / 2, phiLength: Math.PI * 2 - gap };
  const vprof = smoothPts([[0.222, 0.72], [0.262, 0.88], [0.281, 1.04], [0.262, 1.16], [0.185, 1.232]]);
  lathe(vprof, vest, 0, vo);
  const rAt = (y) => { let best = vprof[0]; for (const p of vprof) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p; return best[0]; };
  for (const sgn of [-1, 1]) { const ph = sgn * gap / 2; const pts = []; for (let y = 0.72; y <= 1.231; y += 0.04) { const r = rAt(y) + 0.004; pts.push([Math.sin(ph) * r, y, Math.cos(ph) * r * 0.8]); }
    tube(body, pts, 0.013, vestD); }
  add(body, new THREE.TorusGeometry(0.255, 0.012, 8, 48, Math.PI * 2 - gap), vestD, [0, 0.72, 0], { rot: [Math.PI / 2, 0, Math.PI / 2 + gap / 2] }).scale.y = 0.8;
  for (const y of [0.88, 1.02]) lathe([[rAt(y) + 0.005, y - 0.022], [rAt(y) + 0.006, y + 0.022]], refl, 0, vo);
  for (const sx of [-1, 1]) { const ph = sx * 0.62, r = rAt(0.8) + 0.012; const pk = group(body, [Math.sin(ph) * r, 0.8, Math.cos(ph) * r * 0.8]); pk.rotation.y = ph * 0.85;
    rbox(pk, [0.105, 0.085, 0.022], vestD, [0, 0, 0], 0.009); rbox(pk, [0.112, 0.03, 0.026], vest, [0, 0.042, 0.004], 0.009); }
  // ---- cinto com fivela, martelo (cabo de madeira + cabeça de aço) e trena
  lathe([[0.217, 0.7], [0.224, 0.712], [0.224, 0.75], [0.217, 0.762]], belt);
  rbox(body, [0.085, 0.066, 0.025], mat('#d9b44a', { metalness: 0.7, roughness: 0.3 }), [0, 0.73, 0.18], 0.01); rbox(body, [0.05, 0.035, 0.03], belt, [0, 0.73, 0.183], 0.008);
  const ham = group(body, [0.17, 0.62, -0.16]); ham.rotation.z = 0.15; add(ham, new THREE.CylinderGeometry(0.016, 0.019, 0.26, 12), M.wood, [0, 0, 0]);
  rbox(ham, [0.05, 0.05, 0.13], mat('#8a96a3', { metalness: 0.7, roughness: 0.35 }), [0, 0.13, 0], 0.012);
  const tape = group(body, [-0.16, 0.68, -0.16]); rbox(tape, [0.09, 0.09, 0.05], mat('#f6c22c', { roughness: 0.45 }), [0, 0, 0], 0.02); add(tape, new THREE.CylinderGeometry(0.025, 0.025, 0.052, 16), mat('#3a3a3a'), [0, 0, 0], { rot: [Math.PI / 2, 0, 0] });
  // ---- braços: ombro, manga com cotovelo, punho, luva com dedos e polegar
  const arms = []; for (const sx of [-1, 1]) { const a = group(body, [sx * 0.29, 1.15, 0]);
    add(a, new THREE.SphereGeometry(0.09, 24, 18), shirt, [0, 0, 0]); add(a, new THREE.CapsuleGeometry(0.072, 0.13, 8, 20), shirt, [0, -0.1, 0]);
    const el = group(a, [0, -0.2, 0]); add(el, new THREE.SphereGeometry(0.069, 20, 14), shirt, [0, 0, 0]); add(el, new THREE.CapsuleGeometry(0.066, 0.1, 8, 20), shirt, [0, -0.08, 0]);
    add(el, new THREE.LatheGeometry(smoothPts([[0.07, -0.12], [0.084, -0.15], [0.09, -0.19]]).map(([u, v]) => new THREE.Vector2(u, v)), 24), gloveD, [0, 0, 0]);
    const hg = group(el, [0, -0.25, 0]); const hand = add(hg, new THREE.SphereGeometry(0.085, 24, 18), glove, [0, 0, 0]); hand.scale.set(1.0, 1.0, 0.78);
    for (let k = 0; k < 3; k++) { const fg = add(hg, new THREE.CapsuleGeometry(0.024, 0.05, 6, 10), glove, [(k - 1) * 0.04, -0.075, 0.012]); fg.scale.z = 0.9; }
    const thumb = add(hg, new THREE.CapsuleGeometry(0.03, 0.055, 6, 12), glove, [-sx * 0.02, 0.03, 0.072], { rot: [0.6, 0, 0] });
    const index = add(hg, new THREE.CapsuleGeometry(0.026, 0.09, 6, 12), glove, [0, -0.11, 0.02]); index.visible = false;   // dedo indicador (só ao apontar)
    a.userData = { elbow: el, hand: hg, thumb, index, sx }; arms.push(a); }
  // ---- cabeça esculpida (v3): uma superfície só, com bochechas, queixo, testa e covinhas dos olhos; rosado pintado na pele
  const head = group(body, [0, 1.52, 0]); const brows = [];
  const R0 = 0.27, g2 = (d, c, w) => Math.exp(-((d.x - c[0]) ** 2 + (d.y - c[1]) ** 2 + (d.z - c[2]) ** 2) / w);
  const sculptR = (d) => { const lower = clamp(-d.y / 0.85), front = clamp(d.z);
    let r = R0 * (1 + 0.09 * lower * front * (1 - 0.45 * lower));                                   // queixo/maxilar cheio na frente
    r += 0.016 * (g2(d, [0.5, -0.32, 0.78], 0.05) + g2(d, [-0.5, -0.32, 0.78], 0.05));              // bochechas
    r += 0.006 * Math.exp(-((d.y - 0.32) ** 2) / 0.012) * front;                                     // testa/sobrancelha
    r -= 0.008 * (g2(d, [0.34, 0.14, 0.92], 0.012) + g2(d, [-0.34, 0.14, 0.92], 0.012));            // covinha dos olhos
    return r; };
  const surf = (dx, dy, dz, off = 0) => { const d = new THREE.Vector3(dx, dy, dz).normalize(); return d.multiplyScalar(sculptR(d) * (1 - 0.1 * clamp(-d.y / 0.85) ** 2 * 0) + off); };
  const hg0 = new THREE.SphereGeometry(1, 72, 54), hp = hg0.attributes.position, dv = new THREE.Vector3();
  for (let i = 0; i < hp.count; i++) { dv.fromBufferAttribute(hp, i).normalize(); const r = sculptR(dv), lower = clamp(-dv.y / 0.85);
    hp.setXYZ(i, dv.x * r * (1 - 0.1 * lower * lower), dv.y * r * 0.98, dv.z * r * 0.97); }
  hg0.computeVertexNormals();
  const skinC = document.createElement('canvas'); skinC.width = 1024; skinC.height = 512; { const g = skinC.getContext('2d'); g.fillStyle = '#f2c7a0'; g.fillRect(0, 0, 1024, 512);
    const paint = (dx, dy, dz, rad, col) => { const th = Math.acos(clamp(dy, -1, 1)); let ph = Math.atan2(dz, -dx); if (ph < 0) ph += Math.PI * 2;
      const X = ph / (Math.PI * 2) * 1024, Y = th / Math.PI * 512, sx = 1 / Math.max(0.3, Math.sin(th)); g.save(); g.translate(X, Y); g.scale(sx, 1);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(240,150,140,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rad, 0, 7); g.fill(); g.restore(); };
    paint(0.52, -0.3, 0.8, 46, 'rgba(240,130,120,.55)'); paint(-0.52, -0.3, 0.8, 46, 'rgba(240,130,120,.55)');   // bochechas rosadas
    paint(0, -0.05, 1, 30, 'rgba(232,150,120,.35)');                                                              // ponta do nariz
    paint(0, -0.62, 0.78, 60, 'rgba(120,90,70,.10)'); }                                                           // sombra leve da barba
  const skinT = new THREE.CanvasTexture(skinC); skinT.colorSpace = THREE.SRGBColorSpace;
  const faceSkin = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: skinT, roughness: 0.55, sheen: 0.25, sheenColor: new THREE.Color('#ffd9c2') });
  add(head, hg0, faceSkin, [0, 0, 0]);
  const place = (m, p, out = 1) => { m.position.copy(p); const mx = new THREE.Matrix4().lookAt(p.clone().multiplyScalar(1 + out), p, new THREE.Vector3(0, 1, 0)); m.quaternion.setFromRotationMatrix(mx); return m; };   // +z da peça aponta para fora da cara (no espaço da cabeça)
  // orelhas, costeletas, cabelo em calota na nuca
  for (const sx of [-1, 1]) { const ear = add(head, new THREE.SphereGeometry(0.058, 24, 16), skin, [sx * 0.258, -0.01, -0.005]); ear.scale.set(0.5, 1, 0.8);
    const inn = add(head, new THREE.SphereGeometry(0.032, 16, 12), mat('#e2a98a'), [sx * 0.284, -0.01, 0.002], { cast: false }); inn.scale.set(0.35, 1, 0.7);
    const sb = add(head, new THREE.CapsuleGeometry(0.022, 0.08, 6, 12), hairM, [sx * 0.246, 0.04, 0.06]); sb.rotation.z = sx * 0.12; }
  const hairL = mat('#6b4a33', { roughness: 0.85 }); const nape = add(head, new THREE.SphereGeometry(0.26, 40, 28), hairL, [0, 0.0, -0.048]); nape.scale.set(1.06, 0.9, 0.95);
  // traço de pincel (afina nas pontas): sobrancelhas, bigode e bocas
  // forma entre duas bordas (u = -1..1 de ponta a ponta): top(u) e bot(u) em metros; extrusão fina com volume arredondado
  const edges = (w, top, bot, depth, bev, n = 28) => { const sh = new THREE.Shape(); for (let i = 0; i <= n; i++) { const u = -1 + 2 * i / n; const x = u * w / 2; i ? sh.lineTo(x, top(u)) : sh.moveTo(x, top(u)); }
    for (let i = n; i >= 0; i--) { const u = -1 + 2 * i / n; sh.lineTo(u * w / 2, bot(u)); }
    return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.35, bevelSegments: 5, curveSegments: 8 }); };
  const taper = (u, p = 0.7) => Math.pow(Math.max(0, 1 - u * u), p);
  // traço curvo que afina nas pontas: bend > 0 = arco para cima no meio; thick = espessura no meio
  const stroke = (w, thick, bend, depth, bev) => edges(w, (u) => bend * (1 - u * u) + thick / 2 * taper(u), (u) => bend * (1 - u * u) - thick / 2 * taper(u), depth, bev);
  // olhos: globo encaixado na covinha, íris castanha, pupila, 2 brilhos, pálpebra de pele (pisca)
  const lids = []; const irisC = document.createElement('canvas'); irisC.width = irisC.height = 128; { const g = irisC.getContext('2d'); const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    gr.addColorStop(0, '#2a1a10'); gr.addColorStop(0.35, '#7a4a28'); gr.addColorStop(0.85, '#5a3418'); gr.addColorStop(1, '#2a1a10'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const irisT = new THREE.CanvasTexture(irisC); irisT.colorSpace = THREE.SRGBColorSpace;
  for (const sx of [-1, 1]) { const c = surf(sx * 0.34, 0.14, 0.92, -0.03); const eg = group(head); eg.position.copy(c);
    const ball = add(eg, new THREE.SphereGeometry(0.06, 36, 24), white, [0, 0, 0], { cast: false }); ball.scale.set(0.92, 1.1, 0.9);
    const iris = add(eg, new THREE.SphereGeometry(0.0605, 36, 12, 0, Math.PI * 2, 0, 0.62), new THREE.MeshPhysicalMaterial({ map: irisT, roughness: 0.15, clearcoat: 1 }), [0, 0, 0], { cast: false, rot: [Math.PI / 2, 0, 0] }); iris.scale.set(0.92, 1.1, 0.9);
    const pup = add(eg, new THREE.SphereGeometry(0.061, 28, 8, 0, Math.PI * 2, 0, 0.3), eyeM, [0, 0, 0], { cast: false, rot: [Math.PI / 2, 0, 0] }); pup.scale.set(0.92, 1.1, 0.9);
    add(eg, new THREE.SphereGeometry(0.011, 12, 8), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }), [-0.012, 0.022, 0.052], { cast: false });
    add(eg, new THREE.SphereGeometry(0.005, 8, 6), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }), [0.012, -0.012, 0.054], { cast: false });
    const lid = add(eg, new THREE.SphereGeometry(0.064, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), faceSkin, [0, 0, 0], { cast: false }); lid.scale.set(0.95, 1.13, 0.94); lids.push(lid);
    const lash = add(eg, new THREE.TorusGeometry(0.06, 0.004, 6, 24, Math.PI * 0.7), eyeM, [0, 0, 0], { cast: false }); lash.rotation.set(-0.15, 0, Math.PI * 0.15); lash.scale.set(0.92, 1.12, 0.9); lid.userData.lash = lash;
    // sobrancelha: grupo preso na testa; o traço interno é o que a expressão mexe
    const bp = surf(sx * 0.34, 0.37, 0.86, 0.004); const bg = place(group(head), bp, 0.5); const bm = add(bg, edges(0.13, (u) => 0.018 * (1 - u * u) + 0.012 * taper(u, 0.6) + 0.004 * u * sx, (u) => 0.018 * (1 - u * u) - 0.01 * taper(u, 0.6) + 0.004 * u * sx, 0.008, 0.006), hair, [0, 0, 0], { cast: false });
    bm.position.set(-0.0, -0.01, 0); bg.userData = { sx, inner: bm }; brows.push(bg);
    // bigode: duas pinceladas cheias que sobem nas pontas
  }
  { const mg = place(group(head), surf(0, -0.2, 0.98, -0.004), 0.5);   // bigode cheio: lóbulos fofos no meio e pontas que sobem
    const top = (u) => 0.012 + 0.035 * Math.pow(Math.abs(u), 2.2) + 0.012 * Math.cos(u * Math.PI * 2.5) * taper(u, 1) * 0.5;
    const bot = (u) => -0.038 * taper(u, 0.8) + 0.032 * Math.pow(Math.abs(u), 2.4) - 0.006 * Math.cos(u * Math.PI * 3) * taper(u, 1);
    add(mg, edges(0.215, top, (u) => Math.min(bot(u), top(u) - 0.004), 0.012, 0.016, 40), hair, [0, 0, 0], { cast: false }); }
  const nose = add(head, new THREE.SphereGeometry(0.05, 32, 24), mat('#efb48f', { roughness: 0.5 }), [0, 0, 0], { cast: false }); nose.position.copy(surf(0, -0.03, 1, 0.012)); nose.scale.set(1.05, 0.9, 0.95);
  // bocas (uma por expressão), todas no mesmo lugar do rosto
  const mouthM = mat('#4a1519', { roughness: 0.6 }); const mpos = surf(0, -0.47, 0.88, 0.0);
  const mouthG = place(group(head), mpos, 0.5);
  const smile = add(mouthG, stroke(0.12, 0.013, -0.03, 0.004, 0.004), mouthM, [0, 0.012, 0], { cast: false });                                 // sorriso: arco com pontas para cima
  const grin = group(mouthG);                                                                                                                       // sorriso aberto em "D"
  add(grin, edges(0.14, (u) => 0.012 - 0.008 * (1 - u * u), (u) => 0.012 - 0.008 * (1 - u * u) - 0.055 * taper(u, 0.8), 0.004, 0.004), mouthM, [0, 0, 0], { cast: false });
  add(grin, edges(0.1, (u) => 0.006 - 0.006 * (1 - u * u), (u) => 0.006 - 0.006 * (1 - u * u) - 0.014 * taper(u, 0.5), 0.003, 0.003), mat('#ffffff', { roughness: 0.3 }), [0, 0, 0.006], { cast: false });   // dentes
  const tongue = add(grin, new THREE.SphereGeometry(0.03, 20, 12), mat('#e88a80'), [0, -0.036, 0.004], { cast: false }); tongue.scale.set(1.3, 0.55, 0.3);
  const mouthO = add(mouthG, new THREE.SphereGeometry(0.036, 28, 18), mouthM, [0, -0.012, 0], { cast: false }); mouthO.scale.set(0.82, 1.12, 0.3);    // "ó" de susto
  const frown = add(mouthG, stroke(0.1, 0.012, 0.022, 0.004, 0.004), mouthM, [0, -0.022, 0], { cast: false });                                       // boca preocupada
  grin.visible = mouthO.visible = frown.visible = false;
  const face = (e) => { smile.visible = e === 'smile'; grin.visible = e === 'grin'; mouthO.visible = e === 'o'; frown.visible = e === 'worried' || e === 'hmm';
    frown.scale.set(e === 'hmm' ? 0.7 : 1, e === 'hmm' ? 0.3 : 1, 1);
    brows.forEach((b) => { const sx = b.userData.sx, m = b.userData.inner; m.position.y = -0.01; m.rotation.z = 0;
      if (e === 'o') m.position.y = 0.014;
      if (e === 'worried') { m.position.y = 0.004; m.rotation.z = sx * 0.3; }
      if (e === 'grin') m.position.y = 0.004;
      if (e === 'hmm' && sx > 0) { m.position.y = 0.016; m.rotation.z = -0.15; } }); };
  // pálpebra: aberta = só a borda de cima aparece; piscada curta a cada ~3,7 s
  const blink = (t, e) => { const ph = (t + 1.3) % 3.7, closing = ph < 0.14 ? Math.sin(ph / 0.14 * Math.PI) : 0; const open = e === 'o' ? 0.0 : e === 'hmm' ? 0.35 : 0.14;
    lids.forEach((l) => { const a = -Math.PI / 2 + Math.PI * (open + (1 - open) * closing); l.rotation.x = a; l.userData.lash.rotation.x = a + Math.PI / 2 - 0.15; }); };
  // ---- capacete laranja brilhante: casco, nervuras, faixa, aba curvada com borda e emblema "A"
  const shell = add(head, new THREE.SphereGeometry(0.297, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), helmetM, [0, 0.135, 0]); shell.scale.set(1, 1.02, 1.02);
  add(head, new THREE.TorusGeometry(0.295, 0.016, 10, 48), helmetD, [0, 0.148, 0], { rot: [Math.PI / 2, 0, 0] });
  const brim = lathe(smoothPts([[0.27, 0.0], [0.33, -0.006], [0.352, -0.018], [0.356, -0.028], [0.34, -0.03], [0.27, -0.018]]), helmetM, 0.165, {}, head, 1.0); brim.scale.z = 1.1; brim.position.z = 0.03;
  { const rid = add(head, new THREE.TorusGeometry(0.296, 0.028, 12, 40, Math.PI * 0.48), helmetM, [0, 0.135, 0], { rot: [0, Math.PI / 2, 0] }); rid.rotation.z = Math.PI * 0.12; rid.scale.set(1, 1.02, 1.02); }
  const bc = document.createElement('canvas'); bc.width = bc.height = 256; const bg = bc.getContext('2d');
  bg.fillStyle = '#ffffff'; bg.beginPath(); bg.arc(128, 128, 122, 0, 7); bg.fill(); bg.lineWidth = 8; bg.strokeStyle = '#1f7a8c'; bg.beginPath(); bg.arc(128, 128, 108, 0, 7); bg.stroke();
  bg.fillStyle = '#1f7a8c'; bg.font = '900 170px Inter, Arial Black, sans-serif'; bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.fillText('A', 128, 140);
  const bt2 = new THREE.CanvasTexture(bc); bt2.colorSpace = THREE.SRGBColorSpace; bt2.anisotropy = 8;
  const badge = add(head, new THREE.CircleGeometry(0.07, 40), new THREE.MeshPhysicalMaterial({ map: bt2, roughness: 0.35, clearcoat: 1 }), [0, 0.283, 0.272], { cast: false }); badge.rotation.x = -0.52;
  const props = {};
  // poses: idle, point (braço direito para frente), wave, up (comemora), shrug, think, umbrella, hot (abanando)
  // poses: idle, point, pointUp, thumb, wave, up (comemora), shrug, scared (mãos no rosto), think (mão no queixo), walk
  // convenção: braço ESQUERDO (L, x<0) abre com rotação z NEGATIVA; DIREITO (R, x>0) abre com z POSITIVA
  const poseRaw = (name, t) => {
    const b = Math.sin(t * 3.2) * 0.012; body.position.y = b; head.rotation.set(0, 0, 0); legs.forEach((l) => l.rotation.set(0, 0, 0)); body.rotation.set(0, 0, 0);
    const [L, R] = arms, EL = L.userData.elbow, ER = R.userData.elbow;
    for (const a of arms) { a.userData.index.visible = false; a.userData.hand.rotation.set(0, 0, 0); a.userData.thumb.rotation.set(0.6, 0, 0); a.userData.thumb.position.set(-a.userData.sx * 0.02, 0.03, 0.075); }
    L.rotation.set(0.05, 0, -0.16); R.rotation.set(0.05, 0, 0.16); EL.rotation.set(-0.25, 0, 0); ER.rotation.set(-0.25, 0, 0); face('smile');
    if (name === 'point') { R.rotation.set(-0.45, 0, 1.25); ER.rotation.set(0, 0, 0); R.userData.index.visible = true; head.rotation.y = 0.35; }
    if (name === 'pointUp') { R.rotation.set(-0.2, 0, 2.7); ER.rotation.set(0, 0, 0); R.userData.index.visible = true; head.rotation.x = -0.25; }
    if (name === 'thumb') { R.rotation.set(-0.5, 0, 0.55); ER.rotation.set(-1.5, 0, 0); R.userData.hand.rotation.set(0, 0, 0); R.userData.thumb.position.set(-0.01, 0.0, 0.085); R.userData.thumb.rotation.set(-1.9, 0, 0); face('grin'); }
    if (name === 'wave') { R.rotation.set(-0.2, 0, 2.3); ER.rotation.set(0, 0, -0.3 + Math.sin(t * 10) * 0.35); face('grin'); }
    if (name === 'up') { L.rotation.set(-0.2, 0, -2.45 - Math.sin(t * 9) * 0.1); R.rotation.set(-0.2, 0, 2.45 + Math.sin(t * 9) * 0.1); EL.rotation.set(0, 0, 0); ER.rotation.set(0, 0, 0); body.position.y = Math.abs(Math.sin(t * 6)) * 0.025; face('grin'); }   // comemora sem pular (pés no chão)
    if (name === 'shrug') { L.rotation.set(0.1, 0, -0.75); R.rotation.set(0.1, 0, 0.75); EL.rotation.set(-1.0, 0.6, 0); ER.rotation.set(-1.0, -0.6, 0); head.rotation.z = 0.15; face('worried'); }
    if (name === 'scared') { L.rotation.set(-1.4, 0, -0.12); R.rotation.set(-1.4, 0, 0.12); EL.rotation.set(-1.95, 0, 0); ER.rotation.set(-1.95, 0, 0); body.position.y = Math.sin(t * 7) * 0.012; head.rotation.z = Math.sin(t * 5) * 0.04; face('o'); }
    if (name === 'think') { R.rotation.set(-0.9, 0, -0.55); ER.rotation.set(-2.35, 0, 0); head.rotation.set(0.05, 0, 0.12); face('hmm'); }
    if (name === 'walk') { const w = Math.sin(t * 8); legs[0].rotation.x = w * 0.5; legs[1].rotation.x = -w * 0.5; L.rotation.x = -w * 0.4; R.rotation.x = w * 0.4; }
  };
  // transição suave entre poses (~0,3 s): nada de pular de uma pose para outra
  const joints = () => [body.position, body.rotation, head.rotation, ...arms.flatMap((a) => [a.rotation, a.userData.elbow.rotation, a.userData.hand.rotation, a.userData.thumb.rotation]), ...legs.map((l) => l.rotation)];
  const read = () => joints().flatMap((v) => [v.x, v.y, v.z]);
  const write = (vals) => { let i = 0; for (const v of joints()) { v.x = vals[i++]; v.y = vals[i++]; v.z = vals[i++]; } };
  const st = { name: null, t0: 0, from: null, last: null, lt: -1 };
  // pés SEMPRE no chão (feedback do dono: "está voando"): nenhuma pose levanta as pernas; o balanço é só do tronco
  const ground = (name) => { const plant = true; legs.forEach((l) => { l.position.y = 0.66 - (plant ? body.position.y : 0); });
    const lift = Math.max(0, plant ? 0 : body.position.y); blobs.forEach((b) => { b.material.opacity = 1 - Math.min(1, lift * 6); b.scale.setScalar(1 + lift * 2); }); };
  const pose = (name, t) => {
    poseRaw(name, t); blink(t, { scared: 'o', think: 'hmm' }[name] || ''); const target = read();
    if (st.last === null || t < st.lt || t - st.lt > 0.5) { st.name = name; st.last = target; st.lt = t; ground(name); return; }   // quadro solto (prévia): sem transição
    if (name !== st.name) { st.name = name; st.t0 = t; st.from = st.last; }
    const k = st.from ? ease(clamp((t - st.t0) / 0.3)) : 1; const out = st.from ? target.map((v, i) => lerp(st.from[i], v, k)) : target;
    write(out); st.last = out; st.lt = t;
    ground(name);
  };
  /** fração do mascote dentro da tela (0..1) — o motor usa para avisar quando ele sai cortado */
  const visible = (camera) => { const pts = [[0, 0.05, 0], [0, 1.9, 0], [-0.4, 1.0, 0], [0.4, 1.0, 0]]; let n = 0;
    for (const p of pts) { const v = new THREE.Vector3(...p); root.localToWorld(v); v.project(camera); if (Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1) n++; } return n / pts.length; };
  const api = { root, body, head, arms, legs, pose, props, visible, lids }; MASCOTS.push(api); return api;
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
    /** sub = o que é, em palavras simples (≤ 5 palavras, branco embaixo do nome). Ex.: name('VERGA', a, 0.2, 'viga em cima da janela') */
    name(text, a = 1, y = 0.25, sub = '') {
      if (a <= 0) return; ctx.save(); const s = backOut(clamp(a * 1.6)); ctx.translate(W / 2, H * y); ctx.rotate(-0.07); ctx.scale(s, s);
      let size = 150; ctx.font = `900 ${size}px ${F}`; while (ctx.measureText(text).width > W * 0.86 && size > 60) { size -= 6; ctx.font = `900 ${size}px ${F}`; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#1b1f2a'; ctx.strokeText(text, 0, size * 0.06);
      ctx.fillStyle = '#ffd23f'; ctx.fillText(text, 0, 0);
      if (sub) { let ss = 62; ctx.font = `900 ${ss}px ${F}`; while (ctx.measureText(sub).width > W * 0.84 && ss > 36) { ss -= 3; ctx.font = `900 ${ss}px ${F}`; }
        const sy = size * 0.62 + ss * 0.7; ctx.lineWidth = ss * 0.24; ctx.strokeText(sub, 0, sy); ctx.fillStyle = '#ffffff'; ctx.fillText(sub, 0, sy); }
      ctx.restore();
    },
    /** GANCHO: a 1ª frase inteira escrita no alto da tela enquanto é falada (muita gente vê sem som).
     *  Palavras entre *asteriscos* ficam amarelas. a = 0..1 (aparecer/sumir). Quebra em linhas de ~14 letras. */
    hook(text, a = 1, y = 0.2) {
      if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a * 2); const s = 0.85 + 0.15 * backOut(clamp(a)); ctx.translate(W / 2, H * y); ctx.scale(s, s);
      const words = text.split(/\s+/), lines = [[]]; let n = 0;
      for (const w of words) { const L = w.replace(/\*/g, '').length; if (n && n + 1 + L > 14) { lines.push([]); n = 0; } lines[lines.length - 1].push(w); n += (n ? 1 : 0) + L; }
      let size = 104; ctx.font = `900 ${size}px ${F}`; const meas = (ln) => ctx.measureText(ln.join(' ').replace(/\*/g, '')).width + (ln.length - 1) * size * 0.12;
      while (Math.max(...lines.map(meas)) > W * 0.9 && size > 60) { size -= 4; ctx.font = `900 ${size}px ${F}`; }
      ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; const lh = size * 1.12, y0 = -(lines.length - 1) * lh / 2;
      lines.forEach((ln, i) => { let x = -meas(ln) / 2; const yy = y0 + i * lh;
        for (const w of ln) { const hi = /\*/.test(w), t = w.replace(/\*/g, '') + ' '; ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#1b1f2a'; ctx.strokeText(t, x, yy);
          ctx.fillStyle = hi ? '#ffd23f' : '#ffffff'; ctx.fillText(t, x, yy); x += ctx.measureText(t).width + size * 0.12; } });
      ctx.restore();
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

// ---------- cenário de CIDADE (v2): prédios variados com fachada detalhada, térreo com lojas, sacadas, vidro espelhado,
// telhados com caixa-d'água/antena/ar-condicionado, rua com faixas, bueiros, ponto de ônibus, bancos, lixeiras, hidrante, placas, carros ----------
const uvBox = (w, h, d, mw, mh) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / mw, uv.getY(i) * dims[f][1] / mh); } return g; };
function facadeTex(kind, base, r) {
  const tint = [['#9cc7e8', '#5b8db8', '#3c6a92'], ['#a8dcd2', '#5aa596', '#3a7a6e'], ['#e3cfae', '#b08a5a', '#7a5a38'], ['#c9d3e6', '#7f8fb3', '#4c5a7e']][Math.floor(r() * 4)];
  // 4 vãos x 4 andares por textura (12 m x 12 m) para não repetir demais
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.04})`; x.fillRect(r() * 512, r() * 512, 2, 2); }
  for (let fl = 0; fl < 4; fl++) for (let b = 0; b < 4; b++) {
    const X = b * 128, Y = fl * 128, lit = r() < 0.07, curtain = r() < 0.25;
    if (kind === 'office') {           // pele de vidro: painel inteiro com montantes
      const gr = x.createLinearGradient(0, Y, 0, Y + 128); gr.addColorStop(0, tint[0]); gr.addColorStop(0.55, tint[1]); gr.addColorStop(1, tint[2]); x.fillStyle = gr; x.fillRect(X, Y, 128, 128);
      if (lit) { x.fillStyle = 'rgba(255,236,170,.35)'; x.fillRect(X + 4, Y + 30, 120, 90); }
      x.fillStyle = '#d6dde3'; x.fillRect(X, Y, 128, 14); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(X, Y + 14, 128, 3); x.fillStyle = '#d6dde3'; x.fillRect(X, Y, 5, 128); x.fillRect(X + 62, Y, 4, 128);
      x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.moveTo(X + 10, Y + 120); x.lineTo(X + 50, Y + 10); x.lineTo(X + 70, Y + 10); x.lineTo(X + 30, Y + 120); x.fill();
    } else {                           // alvenaria/concreto com janela emoldurada, peitoril e laje marcada
      x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(X, Y + 118, 128, 10);
      const wx = X + 22, wy = Y + 26, ww = 84, wh = kind === 'old' ? 78 : 70;
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);
      x.fillStyle = kind === 'old' ? '#efe7d6' : '#f3f1ec'; x.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      const gr = x.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, lit ? '#ffe7a6' : '#a9cbe6'); gr.addColorStop(1, lit ? '#f2c66d' : '#4f7ea6'); x.fillStyle = gr; x.fillRect(wx, wy, ww, wh);
      if (curtain && !lit) { x.fillStyle = ['#e9d8c4', '#cfe0e8', '#e8c7c7'][Math.floor(r() * 3)]; x.fillRect(wx, wy, ww * 0.3, wh); }
      x.fillStyle = kind === 'old' ? '#efe7d6' : '#f3f1ec'; x.fillRect(wx + ww / 2 - 2, wy, 4, wh); x.fillRect(wx, wy + wh * 0.35, ww, 3);
      x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(wx + 4, wy + 4, ww * 0.35, 6);
      x.fillStyle = '#d9d4cb'; x.fillRect(wx - 9, wy + wh + 5, ww + 18, 7);
      if (kind === 'old') { x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(wx - 9, wy - 14, ww + 18, 8); }
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function iconTex(kind, bg) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 512, 96);
  x.fillStyle = '#ffffff'; x.strokeStyle = '#ffffff'; x.lineWidth = 8; const cx = 256, cy = 48;
  if (kind === 0) { x.fillRect(cx - 9, cy - 30, 18, 60); x.fillRect(cx - 30, cy - 9, 60, 18); }                          // farmácia
  if (kind === 1) { x.beginPath(); x.ellipse(cx, cy + 4, 46, 24, 0, 0, 7); x.fill(); x.strokeStyle = bg; x.lineWidth = 5; for (const dx of [-20, 0, 20]) { x.beginPath(); x.moveTo(cx + dx - 6, cy - 8); x.lineTo(cx + dx + 6, cy + 14); x.stroke(); } } // pão
  if (kind === 2) { x.fillRect(cx - 26, cy - 14, 44, 32); x.beginPath(); x.arc(cx + 22, cy + 2, 12, -1.5, 1.5); x.stroke(); x.fillRect(cx - 34, cy + 20, 62, 6); }                 // café
  if (kind === 3) { x.beginPath(); x.moveTo(cx - 40, cy - 22); x.lineTo(cx - 28, cy - 22); x.lineTo(cx - 18, cy + 12); x.lineTo(cx + 30, cy + 12); x.lineTo(cx + 38, cy - 12); x.lineTo(cx - 22, cy - 12); x.stroke(); x.beginPath(); x.arc(cx - 12, cy + 26, 6, 0, 7); x.arc(cx + 24, cy + 26, 6, 0, 7); x.fill(); } // mercado
  if (kind === 4) { x.beginPath(); x.moveTo(cx - 34, cy + 26); x.lineTo(cx, cy - 30); x.lineTo(cx + 34, cy + 26); x.closePath(); x.fill(); x.fillStyle = bg; x.beginPath(); x.arc(cx, cy + 4, 6, 0, 7); x.fill(); }   // pizza
  if (kind === 5) { x.beginPath(); x.arc(cx - 22, cy, 16, 0, 7); x.stroke(); x.beginPath(); x.arc(cx + 22, cy, 16, 0, 7); x.stroke(); x.fillRect(cx - 6, cy - 3, 12, 6); }      // ótica
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function signTex(text, bg, fg) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 512, 96);
  x.fillStyle = fg; x.font = '900 60px Inter, Arial Black, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function building(parent, pos, o, r = rng(1)) {
  const g = group(parent, pos); const { w, d, h } = o, kind = o.kind ?? 'res';
  const base = o.color ?? (kind === 'office' ? '#c9d2da' : kind === 'old' ? ['#e8c9a0', '#d9a99a', '#c7d3b5', '#e3d3b0'][Math.floor(r() * 4)] : ['#efe6d6', '#e6d3bf', '#d7dde3', '#f1e2cf', '#dcd2c6'][Math.floor(r() * 5)]);
  const gf = kind === 'old' ? 3.6 : 4.2;   // térreo
  // térreo: loja com vitrine, toldo e placa (frente +z)
  box(g, [w, gf, d], mat(kind === 'office' ? '#5b6670' : base), [0, gf / 2, 0]);
  const shops = Math.max(1, Math.round(w / 6)); const sw = w / shops;
  const awn = ['#e74c3c', '#2f80ed', '#27ae60', '#f39c12', '#8e44ad', '#16a085']; const icons = [0, 1, 2, 3, 4, 5].sort(() => r() - 0.5);
  if (o.shops === false) {   // sem lojas: térreo do prédio com portaria simples (usar atrás da obra, para não poluir a cena)
    box(g, [2.2, 2.6, 0.08], mat('#33414d', { roughness: 0.1, envMap: ENV.map, envMapIntensity: 0.8 }), [0, 1.4, d / 2 + 0.03], { cast: false }); box(g, [3.0, 0.15, 1.2], mat('#e8e4dc'), [0, 2.85, d / 2 + 0.6]);
  } else for (let k = 0; k < shops; k++) { const sx = -w / 2 + sw * (k + 0.5);
    box(g, [sw - 0.6, gf - 1.4, 0.08], mat('#22313d', { roughness: 0.08, metalness: 0.2, envMap: ENV.map, envMapIntensity: 0.9 }), [sx, (gf - 1.4) / 2 + 0.15, d / 2 + 0.03], { cast: false });
    box(g, [sw - 0.4, 0.12, 0.12], mat('#d8d8d8'), [sx, gf - 1.2, d / 2 + 0.06], { cast: false });
    const ac = awn[Math.floor(r() * awn.length)]; const aw = add(g, new THREE.BoxGeometry(sw - 0.5, 0.08, 1.2), mat(ac), [sx, gf - 0.95, d / 2 + 0.6]); aw.rotation.x = 0.28;
    box(g, [sw - 0.5, 0.3, 0.05], mat('#ffffff'), [sx, gf - 1.1, d / 2 + 1.18], { cast: false });
    const sg = add(g, new THREE.PlaneGeometry(Math.min(sw - 1, 4), 0.62), new THREE.MeshStandardMaterial({ map: iconTex(icons[k % icons.length], ac), roughness: 0.5 }), [sx, gf - 0.45, d / 2 + 0.07], { cast: false }); }
  // corpo com fachada
  const bodyH = h - gf; const tex = facadeTex(kind, base, r); tex.repeat.set(1, 1);
  const fm = kind === 'office' ? mat('#ffffff', { map: tex, roughness: 0.12, metalness: 0.35, envMap: ENV.map, envMapIntensity: 0.8 }) : mat('#ffffff', { map: tex, roughness: 0.85 });
  const bw = kind === 'res' ? w : w, bd = d;
  add(g, uvBox(bw, bodyH, bd, 12, 12), [fm, fm, mat(base), mat(base), fm, fm], [0, gf + bodyH / 2, 0]);
  // lajes salientes e sacadas (residencial), cornija (antigo), coroamento (escritório)
  if (kind === 'res') { const floors = Math.floor(bodyH / 3); const slab = mat('#f4f2ee'), glassR = mat('#a7d3ec', { transparent: true, opacity: 0.45, roughness: 0.1 });
    for (let f = 1; f <= floors; f++) { const y = gf + f * 3 - 0.05; box(g, [w + 0.12, 0.14, d + 0.12], slab, [0, y, 0], { cast: f % 2 === 0 });
      if (f < floors) for (let b = 0; b < Math.floor(w / 6); b++) { const bx = -w / 2 + 3 + b * 6; if (r() < 0.25) continue;
        box(g, [2.6, 0.12, 1.0], slab, [bx, y - 2.95 + 3, d / 2 + 0.5]); box(g, [2.6, 0.9, 0.04], glassR, [bx, y + 0.5, d / 2 + 0.98], { cast: false }); box(g, [2.6, 0.05, 0.06], mat('#9aa4ad'), [bx, y + 0.95, d / 2 + 0.98], { cast: false }); } } }
  if (kind === 'old') { box(g, [w + 0.5, 0.45, d + 0.5], mat('#f2ece0'), [0, h + 0.2, 0]); box(g, [w + 0.3, 0.2, d + 0.3], mat('#f2ece0'), [0, gf + 0.05, 0]); }
  else box(g, [w + 0.1, 0.9, d + 0.1], mat(kind === 'office' ? '#aab4bd' : '#ece8e0'), [0, h + 0.45, 0]);
  // telhado: caixa-d'água, ar-condicionado, antena, casa de máquinas
  const roofM = mat('#8f9499'); box(g, [w - 0.4, 0.1, d - 0.4], roofM, [0, h + 0.05, 0], { cast: false });
  if (kind !== 'old') { box(g, [3.2, 2.4, 3.2], mat(base), [-w * 0.2, h + 1.2, -d * 0.15]);
    const tk = group(g, [w * 0.22, h, d * 0.15]); for (const [lx, lz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) cyl(tk, 0.07, 1.4, mat('#5d6a74'), [lx, 0.7, lz], { seg: 6 }); cyl(tk, 1.1, 1.5, mat('#3f7fb0'), [0, 2.1, 0], { seg: 18 }); add(tk, new THREE.ConeGeometry(1.15, 0.5, 18), mat('#3f7fb0'), [0, 3.1, 0]);
    for (let k = 0; k < 3; k++) box(g, [1.0, 0.7, 0.8], mat('#cfd4d8'), [-w * 0.35 + k * 1.3, h + 0.45, d * 0.32]);
    if (h > 30) { cyl(g, 0.06, 6, mat('#c9ced3'), [w * 0.3, h + 3, -d * 0.3], { seg: 6 }); add(g, new THREE.SphereGeometry(0.15, 8, 6), mat('#ff4d4d', { emissive: '#ff4d4d', emissiveIntensity: 0.8 }), [w * 0.3, h + 6.1, -d * 0.3], { cast: false }); } }
  else { const rf = new THREE.Shape(); rf.moveTo(-d / 2 - 0.3, 0); rf.lineTo(d / 2 + 0.3, 0); rf.lineTo(0, 2.2); rf.closePath(); const rg = new THREE.ExtrudeGeometry(rf, { depth: w + 0.4, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.4) / 2); const ro = add(g, rg, M.tile, [0, h + 0.4, 0]); ro.rotation.y = Math.PI / 2; }
  return g;
}
/** hidrante de rua reconhecível: base com flange e parafusos, corpo com anéis, cúpula com porca, 2 saídas laterais e 1 frontal com tampas */
export function hydrant(parent, pos, rotY = 0, s = 1) {
  const g = group(parent, pos); g.rotation.y = rotY; g.scale.setScalar(s);
  const red = mat('#d32f2f', { roughness: 0.4, metalness: 0.2 }), redD = mat('#a82424', { roughness: 0.45, metalness: 0.2 }), cap = mat('#e9e4d8', { roughness: 0.35, metalness: 0.4 }), bolt = mat('#7d8790', { metalness: 0.7, roughness: 0.3 });
  cyl(g, 0.22, 0.06, redD, [0, 0.03, 0], { seg: 24 });
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; cyl(g, 0.022, 0.04, bolt, [Math.cos(a) * 0.18, 0.07, Math.sin(a) * 0.18], { seg: 8 }); }
  cyl(g, 0.15, 0.62, red, [0, 0.37, 0], { r2: 0.14, seg: 24 });
  for (const y of [0.16, 0.6]) add(g, new THREE.TorusGeometry(0.152, 0.022, 8, 24), redD, [0, y, 0], { rot: [Math.PI / 2, 0, 0] });
  cyl(g, 0.18, 0.05, redD, [0, 0.69, 0], { seg: 24 });
  add(g, new THREE.SphereGeometry(0.155, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), red, [0, 0.71, 0]);
  cyl(g, 0.045, 0.07, cap, [0, 0.89, 0], { seg: 5 });
  const outlet = (ang, r, len) => { const o = group(g, [0, 0.45, 0]); o.rotation.y = ang;
    add(o, new THREE.CylinderGeometry(r, r, len, 18), red, [0, 0, 0.13 + len / 2], { rot: [Math.PI / 2, 0, 0] });
    add(o, new THREE.CylinderGeometry(r * 1.18, r * 1.18, 0.05, 18), cap, [0, 0, 0.13 + len + 0.02], { rot: [Math.PI / 2, 0, 0] });
    add(o, new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.04, 5), cap, [0, 0, 0.13 + len + 0.06], { rot: [Math.PI / 2, 0, 0] }); };
  outlet(Math.PI / 2, 0.055, 0.08); outlet(-Math.PI / 2, 0.055, 0.08); outlet(0, 0.08, 0.1);
  return g;
}
export function carModel(parent, pos, col, rotY = 0) {
  const cg = group(parent, pos); cg.rotation.y = rotY; const cm = mat(col, { roughness: 0.25, metalness: 0.35, envMap: ENV.map, envMapIntensity: 0.6 });
  const sp = new THREE.Shape(); sp.moveTo(-2.1, 0.25); sp.lineTo(2.1, 0.25); sp.quadraticCurveTo(2.25, 0.3, 2.2, 0.75); sp.lineTo(1.9, 0.92); sp.lineTo(1.0, 1.0); sp.quadraticCurveTo(0.6, 1.55, 0.1, 1.55); sp.lineTo(-1.1, 1.55); sp.quadraticCurveTo(-1.6, 1.5, -1.9, 1.0); sp.lineTo(-2.15, 0.95); sp.quadraticCurveTo(-2.25, 0.6, -2.1, 0.25);
  const bg = new THREE.ExtrudeGeometry(sp, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 }); bg.translate(0, 0, -0.85); add(cg, bg, cm, [0, 0, 0]);
  const gm = mat('#1e2a35', { roughness: 0.05, metalness: 0.3, envMap: ENV.map, envMapIntensity: 1.0 });
  const wp = new THREE.Shape(); wp.moveTo(0.85, 1.05); wp.quadraticCurveTo(0.5, 1.45, 0.1, 1.47); wp.lineTo(-1.05, 1.47); wp.quadraticCurveTo(-1.45, 1.42, -1.7, 1.05); wp.closePath();
  const wg = new THREE.ExtrudeGeometry(wp, { depth: 1.86, bevelEnabled: false }); wg.translate(0, 0, -0.93); add(cg, wg, gm, [0, 0, 0], { cast: false });
  for (const [wx, wz] of [[-1.35, -0.9], [1.35, -0.9], [-1.35, 0.9], [1.35, 0.9]]) { add(cg, new THREE.CylinderGeometry(0.38, 0.38, 0.28, 20), mat('#1f2125', { roughness: 0.9 }), [wx, 0.38, wz], { rot: [Math.PI / 2, 0, 0] }); add(cg, new THREE.CylinderGeometry(0.2, 0.2, 0.3, 14), mat('#c9ced3', { metalness: 0.7, roughness: 0.3 }), [wx, 0.38, wz], { rot: [Math.PI / 2, 0, 0], cast: false }); }
  for (const sz of [-0.6, 0.6]) { add(cg, new THREE.SphereGeometry(0.12, 10, 8), mat('#fff8d8', { emissive: '#fff3c0', emissiveIntensity: 0.5 }), [2.22, 0.72, sz], { cast: false }); add(cg, new THREE.SphereGeometry(0.1, 8, 6), mat('#ff3b3b', { emissive: '#ff3b3b', emissiveIntensity: 0.5 }), [-2.22, 0.75, sz], { cast: false }); }
  box(cg, [0.12, 0.2, 1.9], mat('#2b2f36'), [2.27, 0.42, 0], { cast: false }); box(cg, [0.12, 0.2, 1.9], mat('#2b2f36'), [-2.27, 0.42, 0], { cast: false });
  return cg;
}
export function city(scene, o = {}) {
  const g = group(scene); const r = rng(o.seed ?? 11); const roadZ = o.roadZ ?? 8;
  const site = o.site ?? { x0: -5, x1: 5, z0: -3, z1: 3 };
  // calçada em placas
  const pc = document.createElement('canvas'); pc.width = pc.height = 256; const px = pc.getContext('2d'); px.fillStyle = '#d3cec5'; px.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) { px.fillStyle = `rgba(${r() < 0.5 ? '80,80,80' : '255,255,255'},.07)`; px.fillRect(r() * 256, r() * 256, 2, 2); }
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { px.fillStyle = `rgba(0,0,0,${r() * 0.05})`; px.fillRect(a * 64, b * 64, 64, 64); }
  px.strokeStyle = 'rgba(100,95,88,.55)'; px.lineWidth = 3; for (let k = 0; k <= 256; k += 64) { px.beginPath(); px.moveTo(k, 0); px.lineTo(k, 256); px.stroke(); px.beginPath(); px.moveTo(0, k); px.lineTo(256, k); px.stroke(); }
  const pt = new THREE.CanvasTexture(pc); pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(300, 300); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 8;
  const ground = add(g, new THREE.PlaneGeometry(600, 600), mat('#ffffff', { map: pt }), [0, 0, 0], { cast: false }); ground.rotation.x = -Math.PI / 2;
  // asfalto com remendos, faixas, bueiros
  const ac = document.createElement('canvas'); ac.width = ac.height = 512; const ax = ac.getContext('2d'); ax.fillStyle = '#4e5258'; ax.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16000; i++) { const v = 55 + r() * 55 | 0; ax.fillStyle = `rgb(${v},${v},${v + 4})`; ax.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 5; i++) { ax.fillStyle = 'rgba(30,30,32,.35)'; ax.fillRect(r() * 450, r() * 450, 40 + r() * 60, 30 + r() * 40); }
  const at = new THREE.CanvasTexture(ac); at.wrapS = at.wrapT = THREE.RepeatWrapping; at.repeat.set(60, 1); at.colorSpace = THREE.SRGBColorSpace; at.anisotropy = 8;
  const road = add(g, new THREE.PlaneGeometry(600, 9), mat('#ffffff', { map: at, roughness: 0.92 }), [0, 0.012, roadZ], { cast: false }); road.rotation.x = -Math.PI / 2;
  for (let x = -120; x < 120; x += 6) { const st = add(g, new THREE.PlaneGeometry(3, 0.15), mat('#f2c230'), [x, 0.02, roadZ], { cast: false }); st.rotation.x = -Math.PI / 2; }
  for (const sz of [-1, 1]) { const el = add(g, new THREE.PlaneGeometry(600, 0.12), M.white, [0, 0.02, roadZ + sz * 4.1], { cast: false }); el.rotation.x = -Math.PI / 2; }
  const cwX = o.crosswalkX ?? 10; for (let k = -3; k <= 3; k++) { const cw = add(g, new THREE.PlaneGeometry(0.6, 7.6), M.white, [cwX + k * 1.05, 0.022, roadZ], { cast: false }); cw.rotation.x = -Math.PI / 2; }
  for (let x = -30; x < 30; x += 15) { const mh = add(g, new THREE.CircleGeometry(0.4, 20), mat('#3a3d42', { metalness: 0.5, roughness: 0.6 }), [x + 3, 0.025, roadZ + 1.8], { cast: false }); mh.rotation.x = -Math.PI / 2; }
  for (const sz of [-1, 1]) box(g, [600, 0.16, 0.3], mat('#bdb8ae'), [0, 0.08, roadZ + sz * 4.6], { cast: false });
  // terreno da obra (terra) e tapume com faixa e placa
  const dc = document.createElement('canvas'); dc.width = dc.height = 256; const dx = dc.getContext('2d'); dx.fillStyle = '#a5815c'; dx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) { dx.fillStyle = r() < 0.5 ? 'rgba(120,90,60,.5)' : 'rgba(190,160,120,.5)'; dx.globalAlpha = 0.45; dx.beginPath(); dx.ellipse(r() * 256, r() * 256, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, 7); dx.fill(); dx.globalAlpha = 1; } soften(dc, 1.5);
  const dt = new THREE.CanvasTexture(dc); dt.wrapS = dt.wrapT = THREE.RepeatWrapping; dt.repeat.set((site.x1 - site.x0 + 2) / 2, (site.z1 - site.z0 + 2) / 2); dt.colorSpace = THREE.SRGBColorSpace; dt.anisotropy = 8;
  const dp = add(g, new THREE.PlaneGeometry(site.x1 - site.x0 + 2, site.z1 - site.z0 + 2), mat('#ffffff', { map: dt, roughness: 1 }), [(site.x0 + site.x1) / 2, 0.01, (site.z0 + site.z1) / 2], { cast: false }); dp.rotation.x = -Math.PI / 2;
  if (o.fence !== false) { const fz = site.z0 - 1.2;
    for (let x = site.x0 - 1; x < site.x1 + 1; x += 2) { box(g, [1.96, 2.2, 0.06], mat('#f4f4f0'), [x + 1, 1.1, fz]); box(g, [1.96, 0.3, 0.07], mat('#1f7a8c'), [x + 1, 1.95, fz]); box(g, [1.96, 0.1, 0.07], mat('#f28a1c'), [x + 1, 0.15, fz]); }
    add(g, new THREE.PlaneGeometry(3.2, 0.6), new THREE.MeshStandardMaterial({ map: signTex('OBRA', '#f28a1c', '#ffffff') }), [(site.x0 + site.x1) / 2, 1.25, fz + 0.05], { cast: false }); }
  // quadras de prédios atrás da obra (3 fileiras) e do outro lado da rua
  const kinds = ['res', 'res', 'res', 'office', 'old'];
  for (let row = 0; row < 3; row++) { let x = -75; const zf = site.z0 - 7 - row * 26;
    while (x < 75) { const kind = row === 0 ? (r() < 0.35 ? 'old' : 'res') : kinds[Math.floor(r() * 5)];
      const w = kind === 'old' ? 8 + r() * 4 : 12 + r() * 9, d = 10 + r() * 6, h = kind === 'old' ? 7.2 + Math.floor(r() * 3) * 3.6 : 4.2 + 3 * Math.floor((row === 0 ? 4 : 6) + r() * (row === 0 ? 6 : 14));
      const cx = x + w / 2, behind = row === 0 && Math.abs(cx - (site.x0 + site.x1) / 2) <= w / 2 + (site.x1 - site.x0) / 2 + 2;
      building(g, [cx, 0, zf - d / 2], behind ? { w, d, h: 7.2 + 3.6 * Math.floor(r() * 2), kind: 'old', shops: false } : { w, d, h, kind }, r); x += w + 2 + r() * 2.5; } }
  for (let x = -90; x < 90; ) { const kind = r() < 0.4 ? 'old' : 'res'; const w = 10 + r() * 6, h = kind === 'old' ? 7.2 + 3.6 * Math.floor(r() * 2) : 4.2 + 3 * Math.floor(3 + r() * 6); const b = building(g, [x + w / 2, 0, roadZ + 24], { w, d: 9, h, kind }, r); b.rotation.y = Math.PI; x += w + 2; }
  // skyline distante sumindo na névoa
  for (let k = 0; k < 40; k++) { const h = 30 + r() * 80, w = 10 + r() * 14; box(g, [w, h, w], mat(['#b9c6d3', '#c9d2dc', '#aebccb'][k % 3]), [-260 + k * 13 + r() * 6, h / 2, -150 - r() * 60], { cast: false }); }
  // mobiliário urbano no lado da obra: postes, árvores em canteiros, bancos, lixeiras, hidrante, ponto de ônibus, placa
  const poleM = mat('#4f555c', { metalness: 0.5, roughness: 0.45 }); const sideZ = Math.max(roadZ - 5.3, site.z1 + 1.2);
  const nearSite = (x, m) => x > site.x0 - m && x < site.x1 + m;
  for (let x = -42; x <= 42; x += 14) { if (nearSite(x, 3)) continue; cyl(g, 0.08, 6.5, poleM, [x, 3.25, sideZ], { seg: 10 }); const arm = rod(g, [x, 6.4, sideZ], [x, 6.6, sideZ + 1.3], 0.05, poleM); box(g, [0.35, 0.14, 0.7], mat('#3a3f45'), [x, 6.55, sideZ + 1.4]); box(g, [0.3, 0.04, 0.6], mat('#fff6d0', { emissive: '#fff2c0', emissiveIntensity: 0.4 }), [x, 6.47, sideZ + 1.4], { cast: false }); }
  { const tx = nearSite(cwX + 4.5, 2) ? site.x1 + 3 : cwX + 4.5; cyl(g, 0.09, 3.6, poleM, [tx, 1.8, sideZ], { seg: 10 }); box(g, [0.4, 1.1, 0.32], mat('#2b2f36'), [tx, 3.75, sideZ + 0.12]);
    for (const [cy, cc, on] of [[4.08, '#ff4d4d', 0], [3.75, '#ffc93c', 0], [3.42, '#3ddc84', 1]]) { add(g, new THREE.SphereGeometry(0.11, 12, 8), mat(cc, { emissive: cc, emissiveIntensity: on ? 1.2 : 0.08 }), [tx, cy, sideZ + 0.3], { cast: false }); box(g, [0.3, 0.05, 0.12], mat('#2b2f36'), [tx, cy + 0.13, sideZ + 0.33], { cast: false }); }
    const pl = add(g, new THREE.PlaneGeometry(1.4, 0.32), new THREE.MeshStandardMaterial({ map: signTex('R. DAS OBRAS', '#1f6f43', '#ffffff') }), [tx - 0.3, 2.9, sideZ + 0.1], { cast: false }); }
  for (let x = -36; x <= 36; x += 9) { if (x > site.x0 - 3 && x < site.x1 + 3) continue; const tz = sideZ - 0.4; box(g, [1.4, 0.35, 1.4], mat('#9a948a'), [x + 4, 0.17, tz]); box(g, [1.2, 0.05, 1.2], M.dirt, [x + 4, 0.36, tz], { cast: false }); tree(g, [x + 4, 0.35, tz], 0.85); }
  const bench = (x, z) => { const bg = group(g, [x, 0, z]); for (const bx of [-0.7, 0.7]) box(bg, [0.08, 0.45, 0.45], poleM, [bx, 0.22, 0]); box(bg, [1.7, 0.08, 0.45], M.wood, [0, 0.47, 0]); box(bg, [1.7, 0.4, 0.06], M.wood, [0, 0.75, -0.22]); };
  for (const bx of [-14, 22]) if (!nearSite(bx, 2)) bench(bx, sideZ - 0.2);
  for (const x of [-18, 16]) { if (nearSite(x, 2)) continue; cyl(g, 0.28, 0.8, mat('#2f7d4f'), [x, 0.4, sideZ], { seg: 14 }); cyl(g, 0.3, 0.06, mat('#245f3c'), [x, 0.82, sideZ], { seg: 14 }); }
  hydrant(g, [nearSite(-6.5, 1) ? site.x0 - 2.5 : -6.5, 0, sideZ + 0.35], -0.5);
  { const bx = -24, bs = group(g, [bx, 0, sideZ - 0.6]); for (const px2 of [-1.6, 1.6]) cyl(bs, 0.06, 2.6, poleM, [px2, 1.3, -0.5], { seg: 8 });
    box(bs, [3.8, 0.1, 1.6], mat('#e8ecef'), [0, 2.65, 0]); box(bs, [3.4, 1.9, 0.05], mat('#bfe3f5', { transparent: true, opacity: 0.4, roughness: 0.05 }), [0, 1.4, -0.55], { cast: false });
    box(bs, [1.0, 1.7, 0.08], mat('#ffffff', { map: signTex('ÔNIBUS', '#f28a1c', '#ffffff') }), [1.3, 1.4, -0.5], { cast: false }); box(bs, [2.4, 0.08, 0.4], M.wood, [-0.4, 0.5, -0.3]); }
  // carros (dos dois lados)
  const carCols = ['#e74c3c', '#2f80ed', '#f2c94c', '#f4f4f4', '#27ae60', '#9b59b6', '#34495e'];
  for (let k = 0; k < (o.cars ?? 7); k++) { const cx = -40 + k * 13 + r() * 3; if (nearSite(cx, 6)) continue; carModel(g, [cx, 0, roadZ + (k % 2 ? 2.1 : -2.1)], carCols[k % carCols.length], k % 2 ? Math.PI : 0); }
  sky(g, r, { hills: false });
  return g;
}

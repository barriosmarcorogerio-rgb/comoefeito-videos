// "Ponte Rio–Niterói" (~35 s), escala 1 unidade = 10 m: ponte baixa (navio bate) → meio sobe (60 m livres) → aviões limitam (72 m) → vão de ~300 m → aço: viga-caixão.
const WORDS = await (await fetch('words.json')).json();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export const cue = (w, n = 1, end = false) => { let k = 0; for (const x of WORDS) if (norm(x.w) === norm(w) && ++k === n) return end ? x.e : x.s; throw new Error('cue não achada: ' + w); };
const DUR = WORDS[WORDS.length - 1].e + 2.4;

const C = {};
const X0 = -40, NSEG = 80, BASE = 1.45, TOPC = 6.6, HALF = 15, DW = 2.6;   // deck de -40 a 40 (800 m), vão central ±15 (300 m)
const hump = (x) => (Math.abs(x) < 20 ? Math.cos(Math.PI * x / 40) ** 2 : 0);

export default {
  fps: 30, total: Math.ceil(DUR * 30),
  build(K, S) {
    const c = (k, w, n = 1) => (C[k] = cue(w, n));
    c('meio1', 'meio?'); c('baixa', 'baixa'); c('bate', 'bate.'); c('ergue', 'ergue'); c('alto', 'alto.'); c('sessenta', 'sessenta'); c('vao', 'vão');
    c('so', 'só'); c('avioes', 'aviões'); c('limite', 'limite'); c('setenta', 'setenta'); c('ai', 'aí'); c('pilares', 'pilares'); c('trezentos', 'trezentos');
    c('concreto', 'concreto'); c('aco', 'aço.'); c('viga', 'viga'); c('caixa', 'caixa'); c('oca', 'oca.'); c('isso', 'isso'); c('subida', 'subida...'); c('passa', 'passa.');
    const sc = S.scene; const world = K.group(sc); K.sky(world, K.rng(4));
    // baía: água grande, margem de areia/pedras em primeiro plano, morros nas pontas
    const wt = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#3d8fd1'; g.fillRect(0, 0, 256, 256); const r = K.rng(3);
      for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.1})`; g.lineWidth = 2; g.beginPath(); const x = r() * 256, y = r() * 256; g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 4, x + 22, y); g.stroke(); }
      const t = new K.THREE.CanvasTexture(cv); t.wrapS = t.wrapT = K.THREE.RepeatWrapping; t.repeat.set(60, 60); t.colorSpace = K.THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
    const water = K.add(world, new K.THREE.PlaneGeometry(600, 600), K.mat('#ffffff', { map: wt, roughness: 0.25, metalness: 0.1 }), [0, 0, 0], { cast: false }); water.rotation.x = -Math.PI / 2;
    const shore = K.box(world, [60, 0.4, 8], K.M.sand, [0, 0.12, 16]); for (let i = 0; i < 14; i++) { const rk = K.add(world, new K.THREE.DodecahedronGeometry(0.3 + (i % 3) * 0.15, 0), K.mat('#8d8a83'), [-14 + i * 2.1, 0.3, 12.3 + (i % 2) * 0.4]); rk.rotation.set(i, i * 2, 0); }
    const hillM = [K.mat('#6fae5a'), K.mat('#5f9e4c')];
    for (const [x, r] of [[-52, 14], [-44, 9], [50, 13], [43, 8]]) { const h = K.add(world, new K.THREE.SphereGeometry(r, 24, 14), hillM[r % 2], [x, -r * 0.45, -2], { cast: false }); h.scale.z = 0.8; }
    for (let i = 0; i < 10; i++) K.tree(world, [-48 + (i % 5) * 2.2, 3.5 + (i % 3), -4 + (i % 4) * 1.5], 2.2);
    // tabuleiro em segmentos (concreto; no vão central também a versão de aço)
    const segs = [], steelM = K.mat('#5f7f99', { metalness: 0.6, roughness: 0.35 });
    for (let i = 0; i < NSEG; i++) { const x = X0 + i + 0.5; const g = K.group(world, [x, BASE, 0]); const conc = K.concreteBox(g, [1.02, 0.35, DW], [0, 0, 0]);
      K.box(g, [1.02, 0.12, 0.12], K.mat('#d8d8d0'), [0, 0.235, DW / 2 - 0.06]); K.box(g, [1.02, 0.12, 0.12], K.mat('#d8d8d0'), [0, 0.235, -DW / 2 + 0.06]);
      let steel = null; if (Math.abs(x) < HALF) { steel = K.box(g, [1.02, 0.5, DW * 0.92], steelM, [0, -0.07, 0]); steel.visible = false; }
      if (i % 3 === 0) { K.cyl(g, 0.03, 0.55, K.mat('#9aa0a6'), [0, 0.45, DW / 2 - 0.1]); K.box(g, [0.25, 0.05, 0.1], K.mat('#fff6c8', { emissive: '#fff6c8', emissiveIntensity: 0.5 }), [0.1, 0.73, DW / 2 - 0.1]); }
      segs.push({ g, x, conc, steel }); }
    // pilares: duplos com travessa; os de dentro do vão central somem
    const piers = []; const pierXs = []; for (let x = -38; x <= 38; x += 8) pierXs.push(x); for (const x of [-15, 15]) if (!pierXs.includes(x)) pierXs.push(x);
    for (const x of pierXs) { const g = K.group(world, [x, 0, 0]); const cols = [-0.75, 0.75].map((z) => K.concreteBox(g, [0.55, 1, 0.55], [0, 0.5, z])); const cap = K.concreteBox(g, [0.7, 0.3, DW], [0, 1, 0]);
      piers.push({ g, x, cols, cap, inner: Math.abs(x) < HALF }); }
    // carros no tabuleiro
    const cars = [0, 1, 2, 3, 4, 5].map((i) => { const g = K.group(world); K.box(g, [0.45, 0.16, 0.24], K.mat(['#e23b3b', '#2f80ed', '#f6c22c', '#ffffff', '#2fb36a', '#f28a1c'][i]), [0, 0.08, 0]); K.box(g, [0.25, 0.1, 0.22], K.mat('#9fd3f0'), [-0.03, 0.2, 0]); return g; });
    // navio porta-contêineres (anda no eixo z, por baixo do meio)
    const ship = K.group(world); { const hull = K.mat('#2b3440'), red = K.mat('#b33a2e');
      K.box(ship, [1.9, 0.7, 7.0], hull, [0, 0.35, 0]); K.box(ship, [1.9, 0.25, 7.0], red, [0, 0.05, 0]); const bow = K.add(ship, new K.THREE.ConeGeometry(0.95, 1.6, 4), hull, [0, 0.35, 4.3], { rot: [Math.PI / 2, Math.PI / 4, 0] }); bow.scale.set(1, 1, 0.45);
      const cc = ['#e23b3b', '#2f80ed', '#f6c22c', '#2fb36a', '#f28a1c', '#ffffff']; let k = 0;
      for (let z = -1.6; z <= 3.0; z += 0.66) for (let y = 0; y < 3; y++) for (const x of [-0.45, 0.45]) K.box(ship, [0.85, 0.38, 0.6], K.mat(cc[k++ % 6]), [x, 0.9 + y * 0.4, z]);
      K.box(ship, [1.7, 2.6, 1.2], K.mat('#f4f2ec'), [0, 2.0, -2.8]); K.box(ship, [1.75, 0.25, 1.25], K.mat('#9fd3f0'), [0, 3.0, -2.8]); K.cyl(ship, 0.04, 1.6, K.mat('#9aa0a6'), [0, 4.1, -2.8]); }
    // avião (desce para o Santos Dumont), linha do limite de altura
    const plane = K.group(world); { const w = K.mat('#ffffff', { roughness: 0.4 }); K.add(plane, new K.THREE.CapsuleGeometry(0.22, 2.6, 6, 14), w, [0, 0, 0], { rot: [0, 0, Math.PI / 2] }); K.box(plane, [0.6, 0.05, 3.2], w, [0.1, -0.05, 0]); K.box(plane, [0.35, 0.7, 0.05], K.mat('#2f80ed'), [1.35, 0.35, 0]); K.box(plane, [0.3, 0.05, 1.1], w, [1.35, 0.05, 0]); }
    const limit = K.box(world, [70, 0.06, 0.06], K.mat('#e23b3b', { emissive: '#e23b3b', emissiveIntensity: 0.6 }), [0, 7.2, 0.6], { cast: false });
    const clear = K.arrow(world, [0, 0.1, 1.6], [0, 6.0, 1.6], '#2fb36a', 0.12);
    const reds = [-6, 0, 6].map((x) => K.arrow(world, [x, 9.6, 0.6], [x, 7.6, 0.6], '#e23b3b', 0.14));
    // corte da viga-caixão (peça de aço oca mostrada na frente do vão central)
    const box = K.group(world); { const sh = new K.THREE.Shape(); sh.moveTo(-1.3, 0.35); sh.lineTo(1.3, 0.35); sh.lineTo(0.9, -0.35); sh.lineTo(-0.9, -0.35); sh.closePath();
      const ho = new K.THREE.Path(); ho.moveTo(-1.05, 0.25); ho.lineTo(-0.75, -0.25); ho.lineTo(0.75, -0.25); ho.lineTo(1.05, 0.25); ho.closePath(); sh.holes.push(ho);
      const geo = new K.THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); K.add(box, geo, steelM, [0, 0, 0]); }
    const dust = K.particles(world, 50, '#d9d4c8', 0.18); dust.im.frustumCulled = false;
    const guy = K.mascot(sc, [5.2, 0.32, 14.2], 1.0); guy.root.rotation.y = -0.4;
    return { segs, piers, cars, ship, plane, limit, clear, reds, box, dust, guy };
  },
  camera(t, O, Kit) {
    const k = (t, pos, look, fov = 44) => ({ t, pos, look, fov });
    const keys = [
      k(0, [3.2, 2.7, 11.0], [0, 2.2, -5.0], 46), k(C.bate + 0.5, [2.6, 2.6, 9.5], [0, 2.2, -4.5], 46),
      k(C.bate + 0.55, [0, 4.2, 46], [0, 3.2, 0], 44), k(C.sessenta - 0.4, [0, 4.4, 44], [0, 3.4, 0], 44),
      k(C.sessenta - 0.35, [9.0, 2.6, 17.0], [0, 3.2, -1.0], 46), k(C.vao + 1.4, [8.0, 2.8, 16.0], [0, 3.4, -1.0], 46),
      k(C.so - 0.1, [6.0, 6.5, 30], [0, 7.0, -2], 50), k(C.setenta + 0.9, [5.0, 6.8, 28], [0, 7.0, -2], 50),
      k(C.ai, [-24, 7.0, 26], [2, 3.2, 0], 46), k(C.trezentos + 1.2, [-22, 7.4, 24], [2, 3.4, 0], 46),
      k(C.concreto - 0.1, [3.0, 4.6, 20], [0, 6.0, 0], 46), k(C.aco + 0.6, [2.6, 4.8, 18.5], [0, 6.1, 0], 46),
      k(C.viga - 0.4, [2.2, 6.0, 7.5], [0, 5.3, 2.4], 44), k(C.oca + 0.4, [1.6, 5.9, 6.8], [0, 5.2, 2.4], 44),
      k(C.isso - 0.2, [10.0, 3.6, 30], [0, 3.6, 0], 46), k(DUR, [8.0, 3.8, 32], [0, 3.6, 0], 46),
    ];
    return Kit.camAt(keys, t);
  },
  frame(t, O, K) {
    const { segs, piers, cars, ship, plane, limit, clear, reds, box, dust, guy } = O;
    // meio sobe (até 60 m livres e depois o topo em ~72 m)
    const hF = K.ease(K.prog(t, C.ergue - 0.1, 1.4)) * 0.9 + 0.1 * K.ease(K.prog(t, C.limite, 0.9));
    const sag = 0.9 * K.ease(K.prog(t, C.pesaria ?? C.concreto + 0.3, 0.8)) * (1 - K.ease(K.prog(t, C.aco, 0.8)));
    const steelOn = t > C.aco - 0.1;
    const deckY = (x) => BASE + (TOPC - BASE) * hF * hump(x) - (Math.abs(x) < HALF ? sag * Math.cos(Math.PI * x / (2 * HALF)) : 0);
    segs.forEach((s) => { const y = deckY(s.x), y2 = deckY(s.x + 0.05); s.g.position.y = y; s.g.rotation.z = Math.atan2(y2 - y, 0.05);
      if (s.steel) { s.steel.visible = steelOn; s.conc.visible = !steelOn; K.highlight(s.steel, 0.35 * K.glow(t, C.aco, C.oca + 1.0)); K.highlight(s.conc, 0.35 * K.glow(t, C.concreto, C.aco), '#e23b3b'); } });
    // pilares acompanham a altura do tabuleiro; os do vão central afundam em "pilares"
    const sink = K.ease(K.prog(t, C.pilares, 0.9));
    piers.forEach((p) => { const top = deckY(p.x) - 0.32; const h = Math.max(0.2, top); p.cols.forEach((c) => { c.scale.y = h; c.position.y = h / 2; }); p.cap.position.y = h;
      p.g.position.y = p.inner ? -sink * (h + 1.5) : 0; p.g.visible = !(p.inner && sink >= 1); });
    // carros andando no tabuleiro
    cars.forEach((cg, i) => { const dir = i % 2 ? -1 : 1; const x = ((t * 3.2 + i * 13.3) % 76) - 38; const xx = dir > 0 ? x : -x; cg.position.set(xx, deckY(xx) + 0.2, dir * 0.55); cg.rotation.y = dir > 0 ? 0 : Math.PI; });
    // navio: bate na ponte baixa; passa por baixo em "sessenta" e no final
    let sz, sv = true;
    if (t < C.ergue) { const hit = -1.3 - 3.0 - 0.3; const p = K.ease(K.prog(t, 0, C.bate)); sz = K.lerp(-16, hit, p) - (t > C.bate ? Math.sin(Math.min(1, (t - C.bate) * 3) * Math.PI) * 0.6 : 0); }
    else if (t < C.so) { sz = K.lerp(-18, 16, K.prog(t, C.alto - 0.3, C.so - C.alto + 0.6)); }
    else if (t > C.isso - 0.3) { sz = K.lerp(-20, 12, K.prog(t, C.isso - 0.3, DUR - C.isso)); } else sv = false;
    ship.visible = sv; ship.position.set(0, 0.0, sz ?? 0); ship.rotation.y = 0;
    const dp = K.prog(t, C.bate - 0.05, 1.0);
    dust.set((i) => (dp <= 0 || dp >= 1) ? null : [(i % 10 - 5) * 0.25, 2.0 + dp * (0.5 + (i % 4) * 0.3), -1.4 + Math.sin(i) * 0.4, 1.3 - dp]);
    // avião passando por cima (só na parte dos aviões), linha vermelha do limite
    const ap = K.prog(t, C.so - 0.2, 3.6); plane.visible = ap > 0 && ap < 1; plane.position.set(K.lerp(24, -24, ap), K.lerp(10.5, 8.4, ap), -4); plane.rotation.z = -0.04;
    limit.visible = t > C.limite - 0.2 && t < C.ai + 0.2; limit.material.opacity = 1;
    reds.forEach((a, i) => { a.visible = t > C.limite && t < C.ai; a.position.y = -((t * 1.5 + i * 0.3) % 1) * 0.3; });
    clear.visible = t > C.sessenta - 0.3 && t < C.so - 0.1; clear.scale.y = 1;
    // corte da viga-caixão sobe na frente do vão
    const bp = K.prog(t, C.viga - 0.5, 0.6); box.visible = bp > 0 && t < C.isso - 0.2; box.position.set(-0.6, deckY(0) - 0.9 - (1 - K.easeOut(bp)) * 2.0, 1.9); K.highlight(box, 0.4 * K.glow(t, C.viga, C.oca + 0.8));
    // mascote (na margem, em primeiro plano)
    const P = [[0, 'scared'], [C.bate + 0.5, 'shrug'], [C.ergue - 0.2, 'pointUp'], [C.vao - 0.3, 'thumb'], [C.so - 0.2, 'scared'], [C.limite, 'think'], [C.pilares - 0.2, 'point'],
      [C.concreto, 'shrug'], [C.aco - 0.3, 'thumb'], [C.isso, 'point'], [C.passa - 0.3, 'up']];
    let pose = 'idle'; for (const [tt, p] of P) if (t >= tt) pose = p; guy.pose(pose, t);
    guy.root.visible = !(t > C.concreto - 0.15 && t < C.isso - 0.2) && !(t > C.vao + 1.3 && t < C.so) && !(t > C.limite + 0.1 && t < C.concreto);
  },
  overlay(t, O, OV, K) {
    const w = (a, b) => (t >= a && t < b ? 1 : 0) * K.prog(t, a, 0.2);
    OV.hook('Por que a Ponte Rio-Niterói *SOBE* tanto no meio?', K.prog(t, 0, 0.15) * (1 - K.prog(t, C.meio1 + 0.3, 0.2)), 0.18);
    OV.label([0, 2.6, -1.0], 'PONTE BAIXA', w(C.baixa - 0.1, C.bate + 0.5), '#e23b3b');
    OV.label([0, 3.2, 1.6], '60 m LIVRES', w(C.sessenta - 0.1, C.so - 0.1), '#2fb36a');
    OV.label([0, 8.6, 0.6], 'LIMITE ~72 m', w(C.setenta - 0.3, C.ai + 0.2), '#e23b3b');
    OV.label([0, 1.2, 0.6], '~300 m SEM APOIO', w(C.trezentos - 0.3, C.concreto), '#2fb36a', 70);
    OV.label([0, 8.0, 0.6], 'PESADO DEMAIS', w(C.concreto + 0.2, C.aco), '#e23b3b');
    OV.label([-0.6, 4.6, 2.6], 'OCA POR DENTRO', w(C.caixa - 0.1, C.isso - 0.2), '#2f80ed', 64);
    OV.label([0, 2.0, 1.6], '13 km DE PONTE', w(C.isso + 0.2, DUR - 1.6), '#2fb36a');
    const nm = (txt, sub, a, b) => OV.name(txt, K.prog(t, a - 0.05, 0.35) * (1 - K.prog(t, b, 0.25)), 0.2, sub);
    nm('VÃO DE NAVEGAÇÃO', 'o portão dos navios', C.vao, C.vao + 2.0); nm('VIGA CAIXÃO', 'uma caixa de aço oca', C.viga, C.viga + 2.2);
    OV.confetti(t, K.prog(t, DUR - 1.6, 0.3));
    OV.cta('QUAL A PRÓXIMA? 👇', K.prog(t, DUR - 1.5, 0.35));
  },
};

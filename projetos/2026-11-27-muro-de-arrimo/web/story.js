// "Muro de arrimo" (~38 s), visto em CORTE: muro fino tomba → empuxo → sapata → chuva dobra o empurrão → brita + dreno → barbacãs.
const WORDS = await (await fetch('words.json')).json();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export const cue = (w, n = 1, end = false) => { let k = 0; for (const x of WORDS) if (norm(x.w) === norm(w) && ++k === n) return end ? x.e : x.s; throw new Error('cue não achada: ' + w); };
const DUR = WORDS[WORDS.length - 1].e + 1.5;

const C = {};
const HS = 1.6, ZL = 3.0;            // altura do barranco, comprimento do muro (z)
const SOIL = { x0: -3.2, x1: -0.70 }; // terra atrás do muro (a faixa -0.70..-0.08 é a 'cunha'/faixa que sai quando entra a brita)

export default {
  fps: 30, total: Math.ceil(DUR * 30),
  build(K, S) {
    const c = (k, w, n = 1) => (C[k] = cue(w, n));
    c('tomba', 'tomba'); c('chuva1', 'chuva?'); c('se', 'se'); c('barranco', 'barranco...'); c('deita', 'deita!'); c('empurra', 'empurra'); c('empuxo', 'empuxo:');
    c('engrossa', 'engrossa'); c('base', 'base,'); c('sapata', 'sapata:'); c('so', 'só'); c('encharca', 'encharca'); c('dobrar', 'dobrar!'); c('solucao', 'solução:');
    c('britada', 'britada'); c('cano', 'cano'); c('dreno', 'dreno:'); c('sai', 'sai?'); c('furinhos', 'furinhos'); c('barbacas', 'barbacãs:'); c('isso', 'isso'); c('tomba2', 'tomba.');
    const sc = S.scene; K.neighborhood(sc, { roadZ: 13, site: { x0: -1.2, x1: 3.0, z0: -1.8, z1: 3 } });
    const site = K.group(sc);
    // terra do barranco (corte com camadas e pedrinhas), grama em cima
    const sc2 = document.createElement('canvas'); sc2.width = sc2.height = 256; { const g = sc2.getContext('2d'); const r = K.rng(7);
      g.fillStyle = '#8a6440'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(120,85,55,.5)' : 'rgba(150,110,70,.45)'; g.fillRect(0, i * 43 + r() * 10, 256, 18 + r() * 12); }
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${90 + r() * 60 | 0},${80 + r() * 40 | 0},${60 + r() * 30 | 0},.9)`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 3 + r() * 5, 2 + r() * 4, r() * 3, 0, 7); g.fill(); } }
    const soilT = new K.THREE.CanvasTexture(sc2); soilT.wrapS = soilT.wrapT = K.THREE.RepeatWrapping; soilT.repeat.set(3, 1.6); soilT.colorSpace = K.THREE.SRGBColorSpace;
    const soilM = K.mat('#ffffff', { map: soilT, roughness: 1 });
    const soil = K.box(site, [SOIL.x1 - SOIL.x0, HS, ZL], soilM, [(SOIL.x0 + SOIL.x1) / 2, HS / 2, 0]);
    K.box(site, [SOIL.x1 - SOIL.x0 + 0.02, 0.05, ZL + 0.02], K.M.grass, [(SOIL.x0 + SOIL.x1) / 2, HS + 0.025, 0], { cast: false });
    // cunha de terra que vai junto quando o muro tomba (fase do muro fino) e faixa de terra atrás do muro bom (sai quando entra a brita)
    const wedge = K.group(site, [0.075, 0, 0]); K.box(wedge, [0.62, HS, ZL], soilM, [-0.465, HS / 2, 0]); K.box(wedge, [0.62, 0.05, ZL + 0.02], K.M.grass, [-0.465, HS + 0.025, 0], { cast: false });
    const strip = K.group(site); K.box(strip, [0.48, HS - 0.3, ZL], soilM, [-0.46, 0.3 + (HS - 0.3) / 2, 0]); K.box(strip, [0.48, 0.05, ZL + 0.02], K.M.grass, [-0.46, HS + 0.025, 0], { cast: false });
    // muro fino (gira pela quina da frente, em x = +0.075)
    const thin = K.group(site, [0.075, 0, 0]); K.concreteBox(thin, [0.15, HS + 0.1, ZL], [-0.075, (HS + 0.1) / 2, 0]);
    // muro de arrimo: haste grossa + sapata (base em L por baixo da terra)
    const good = K.group(site, [0, 0, 0]); const stem = K.concreteBox(good, [0.3, HS - 0.2, ZL + 0.03], [-0.07, 0.3 + (HS - 0.2) / 2, 0]);
    const foot = K.concreteBox(good, [1.6, 0.3, ZL + 0.03], [-0.45, 0.15, 0]);
    // brita (pedras cinza atrás do muro) + manta + tubo de dreno furado
    const grav = K.group(site); { const r = K.rng(12); const gm = [K.mat('#8f8a82'), K.mat('#a49e95'), K.mat('#77736c')];
      for (let i = 0; i < 260; i++) { const m = K.add(grav, new K.THREE.DodecahedronGeometry(0.045 + r() * 0.03, 0), gm[i % 3], [-0.27 - r() * 0.4, 0.34 + r() * 1.2, -ZL / 2 + 0.05 + r() * (ZL - 0.1)]); m.rotation.set(r() * 3, r() * 3, r() * 3); } }
    const pipe = K.group(site); const pm = K.mat('#e8762a', { roughness: 0.5 }); K.add(pipe, new K.THREE.CylinderGeometry(0.06, 0.06, ZL, 20, 1, true), pm, [-0.42, 0.38, 0], { rot: [Math.PI / 2, 0, 0] });
    for (let k = 0; k < 14; k++) K.add(pipe, new K.THREE.CircleGeometry(0.012, 8), K.mat('#2a2a2a'), [-0.42, 0.44, -ZL / 2 + 0.15 + k * 0.2], { rot: [-Math.PI / 2, 0, 0], cast: false });
    // água acumulada atrás do muro (corte azul) e barbacãs (canos curtos atravessando o muro)
    const water = K.box(site, [0.47, 1, 0.01], K.mat('#3fa2ff', { transparent: true, opacity: 0.6, depthWrite: false, emissive: '#3fa2ff', emissiveIntensity: 0.25 }), [-0.46, 0.5, ZL / 2 + 0.015], { cast: false });
    const barb = K.group(site); const bm = K.mat('#d9d9d9', { roughness: 0.4 });
    for (const y of [0.55, 1.05]) for (const z of [-1.0, 0, 1.0]) { K.add(barb, new K.THREE.CylinderGeometry(0.04, 0.04, 0.42, 16, 1, true), bm, [0.02, y, z], { rot: [0, 0, Math.PI / 2] }); }
    // partículas: chuva, jatos dos barbacãs, poeira do tombo
    const rain = K.particles(site, 160, '#3fa2ff', 0.035), jets = K.particles(site, 90, '#3fa2ff', 0.03), dust = K.particles(site, 60, '#cdbb9c', 0.07);
    for (const p of [rain, jets, dust]) p.im.frustumCulled = false;
    // setas do empuxo (vermelhas, horizontais) e do peso da terra na sapata (verdes, para baixo)
    const reds = [0.45, 0.9, 1.35].map((y) => K.arrow(site, [-0.75, y, ZL / 2 + 0.05], [-0.2, y, ZL / 2 + 0.05], '#e23b3b', 0.04));
    const greens = [-1.0, -0.7].map((x) => K.arrow(site, [x, 1.25, ZL / 2 + 0.05], [x, 0.4, ZL / 2 + 0.05], '#2fb36a', 0.035));
    const guy = K.mascot(sc, [1.6, 0, 0.25], 1.0); guy.root.rotation.y = -0.55;
    return { strip, soilM, wedge, thin, good, stem, foot, grav, pipe, water, barb, rain, jets, dust, reds, greens, guy };
  },
  camera(t, O, Kit) {
    const k = (t, pos, look, fov = 48) => ({ t, pos, look, fov });
    const W = (t) => k(t, [3.4, 1.5, 6.6], [0.75, 0.9, 0.4], 50), W2 = (t) => k(t, [3.2, 1.55, 6.3], [0.7, 0.92, 0.4], 50);
    const keys = [
      k(0, [1.0, 1.25, 3.4], [-0.25, 0.85, 1.0], 48), k(C.se - 0.1, [1.3, 1.3, 3.9], [-0.3, 0.85, 0.9], 48),
      W(C.se - 0.07), W2(C.empurra - 0.18),
      k(C.empurra - 0.15, [0.6, 1.1, 3.4], [-0.4, 0.85, 1.2], 46), k(C.engrossa - 0.18, [0.5, 1.05, 3.2], [-0.45, 0.85, 1.2], 46),
      W(C.engrossa - 0.15), W2(C.base + 0.2),
      k(C.base + 0.23, [1.2, 0.95, 3.6], [-0.4, 0.45, 1.2], 46), k(C.so - 0.18, [1.1, 0.9, 3.3], [-0.45, 0.42, 1.2], 46),
      k(C.so - 0.15, [3.2, 2.2, 6.6], [0.45, 1.0, 0.4], 50), k(C.solucao - 0.06, [3.0, 2.0, 6.2], [0.45, 0.95, 0.4], 50),
      k(C.solucao - 0.03, [0.5, 1.2, 3.2], [-0.45, 0.8, 1.1], 46), k(C.cano, [0.35, 0.75, 2.8], [-0.42, 0.45, 1.2], 44), k(C.sai - 0.43, [0.25, 0.72, 2.7], [-0.42, 0.42, 1.2], 44),
      W(C.sai - 0.4), k(C.barbacas + 0.6, [3.1, 1.25, 5.8], [0.75, 0.8, 0.3], 48), W2(DUR),
    ];
    return Kit.camAt(keys, t);
  },
  frame(t, O, K) {
    const { strip, soilM, wedge, thin, good, grav, pipe, water, barb, rain, jets, dust, reds, greens, guy } = O;
    // muro fino: começa inclinando (gancho), volta em pé em "Se", tomba de vez em "deita"
    const phaseThin = t < C.engrossa - 0.2; thin.visible = wedge.visible = phaseThin;
    const tilt0 = 0.22 * K.ease(K.prog(t, 0, C.chuva1 + 0.3)) * (1 - K.ease(K.prog(t, C.se - 0.2, 0.3)));
    const fall = K.ease(K.prog(t, C.deita - 0.15, 0.55)) * 0.78;   // para inclinado antes de chegar no mascote (nada atravessa nada)
    const ang = tilt0 + fall; thin.rotation.z = -ang; wedge.rotation.z = -ang * 0.55; wedge.position.x = 0.075 + Math.min(fall, 1) * 0.18;
    const dp = K.prog(t, C.deita + 0.25, 1.2);
    dust.set((i) => (dp <= 0 || dp >= 1) ? null : [0.6 + (i % 12) * 0.12 + Math.sin(i) * dp * 0.3, 0.05 + dp * (0.3 + (i % 5) * 0.12), -1.4 + (i * 0.047) % 2.8, 1.4 - dp]);
    // muro de arrimo novo: sapata entra primeiro, depois a haste
    const gp = K.prog(t, C.engrossa - 0.2, 0.5), sp = K.prog(t, C.base, 0.5); good.visible = gp > 0;
    O.stem.position.y = 0.3 + (1.6 - 0.2) / 2 + (1 - K.easeOut(gp)) * 2.2; O.foot.position.y = 0.15 + (1 - K.easeOut(sp)) * 1.0; O.foot.visible = sp > 0;
    K.highlight(O.foot, 0.45 * K.glow(t, C.base, C.sapata + 1.4)); K.highlight(O.stem, 0.3 * K.glow(t, C.engrossa, C.base));
    // chuva molha a terra, água sobe atrás do muro; brita+dreno baixa a água
    const wet = K.ease(K.prog(t, C.encharca - 0.3, 1.2)) * (1 - 0.6 * K.ease(K.prog(t, C.dreno, 1.5)));
    soilM.color.set('#ffffff').lerp(new K.THREE.Color('#7f8fa8'), wet * 0.7);
    const raining = t > C.so - 0.2 && t < C.solucao + 0.4;
    rain.set((i) => { if (!raining) return null; const ph = (t * 1.4 + i * 0.0617) % 1; return [-3.0 + ((i * 37) % 160) / 160 * 2.9, HS + 0.1 + (1 - ph) * 2.4, -1.4 + ((i * 71) % 160) / 160 * 2.8]; });
    const wl = K.ease(K.prog(t, C.encharca, 1.6)) * (1 - K.ease(K.prog(t, C.cano, 1.4)));
    water.visible = wl > 0.01; water.scale.y = Math.max(1e-3, wl * 1.25); water.position.y = 0.3 + wl * 1.25 / 2;
    // empurrão: setas vermelhas (dobram de tamanho com a água)
    const redOn = (t > C.chuva1 - 0.6 && t < C.engrossa - 0.2) || (t > C.encharca - 0.2 && t < C.solucao + 0.3);
    reds.forEach((a, i) => { a.visible = redOn; const s = 1 + K.ease(K.prog(t, C.empurrao2 ?? C.dobrar - 0.8, 0.6)) * (t > C.encharca ? 1 : 0) * (1 - K.ease(K.prog(t, C.cano, 1))); const s2 = 1 + (s - 1) * 0.6; a.scale.set(s2, s2, s2); a.position.x = ((t * 1.5 + i * 0.3) % 1) * 0.12 - (s2 - 1) * 0.5; a.position.y = 0; });
    greens.forEach((a, i) => { a.visible = t > C.base + 0.3 && t < C.so; a.position.y = -((t * 1.5 + i * 0.3) % 1) * 0.1; });
    // brita cai por trás do muro, tubo entra
    strip.visible = t >= C.engrossa - 0.2 && t < C.britada - 0.3; const bp = K.prog(t, C.britada - 0.3, 0.7); grav.visible = bp > 0; grav.position.y = (1 - K.easeOut(bp)) * 2.0; K.highlight(pipe, 0.45 * K.glow(t, C.cano, C.dreno + 1.2));
    const pp = K.prog(t, C.cano - 0.2, 0.5); pipe.visible = pp > 0; pipe.position.z = (1 - K.easeOut(pp)) * 3.5;
    // barbacãs entram atravessando o muro, e a água jorra para fora
    const ep = K.prog(t, C.furinhos - 0.2, 0.4); barb.visible = ep > 0; barb.scale.set(Math.max(ep, 1e-3), 1, 1); K.highlight(barb, 0.5 * K.glow(t, C.furinhos, C.barbacas + 1.4));
    const jOn = t > C.furinhos + 0.3; const ys = [0.55, 1.05], zs = [-1.0, 0, 1.0];
    jets.set((i) => { if (!jOn) return null; const h = i % 6, ph = (t * 1.6 + i * 0.137) % 1; const x = 0.24 + ph * 0.55, y = ys[h % 2] - ph * ph * 0.9 * (h % 2 ? 1.2 : 0.6); return y < 0.02 ? null : [x, y, zs[Math.floor(h / 2)] + Math.sin(i) * 0.03]; });
    // mascote
    const P = [[0, 'scared'], [C.se - 0.2, 'think'], [C.deita - 0.2, 'scared'], [C.empurra, 'point'], [C.empuxo - 0.3, 'shrug'], [C.engrossa - 0.2, 'point'], [C.sapata - 0.3, 'thumb'],
      [C.so - 0.2, 'scared'], [C.solucao - 0.2, 'point'], [C.dreno - 0.3, 'thumb'], [C.sai - 0.3, 'think'], [C.furinhos, 'point'], [C.barbacas - 0.3, 'thumb'], [C.isso, 'up']];
    let pose = 'idle'; for (const [tt, p] of P) if (t >= tt) pose = p; guy.pose(pose, t);
    guy.root.visible = (t >= C.se - 0.07 && t < C.empurra - 0.15) || (t >= C.engrossa - 0.15 && t < C.base + 0.23) || (t >= C.so - 0.15 && t < C.solucao - 0.03) || t >= C.sai - 0.4;
  },
  overlay(t, O, OV, K) {
    const w = (a, b) => (t >= a && t < b ? 1 : 0) * K.prog(t, a, 0.2);
    OV.hook('Por que esse muro *TOMBA* depois da chuva?', K.prog(t, 0, 0.15) * (1 - K.prog(t, C.chuva1 + 0.3, 0.2)), 0.18);
    OV.label([-1.3, HS + 0.25, ZL / 2], 'TERRA', w(C.barranco - 0.2, C.empuxo), '#8a6440');
    OV.label([-0.5, 1.75, ZL / 2], 'EMPURRÃO', w(C.empurra, C.engrossa - 0.2), '#e23b3b');
    OV.label([-0.45, -0.05, ZL / 2], 'BASE LARGA', w(C.base + 0.2, C.so - 0.2), '#2fb36a');
    OV.label([-0.6, 1.9, ZL / 2], 'ATÉ 2× MAIS FORÇA', w(C.dobrar - 0.3, C.solucao), '#e23b3b', 64);
    OV.label([-0.4, 1.4, ZL / 2], 'BRITA', w(C.britada - 0.1, C.cano + 0.2), '#8f8a82');
    OV.label([-0.42, 0.75, ZL / 2], 'CANO FURADO', w(C.cano + 0.1, C.dreno - 0.1), '#e8762a', 64);
    const nm = (txt, sub, a, b) => OV.name(txt, K.prog(t, a - 0.05, 0.35) * (1 - K.prog(t, b, 0.25)), 0.2, sub);
    nm('EMPUXO', 'o empurrão da terra', C.empuxo, C.empuxo + 1.8); nm('SAPATA', 'o pé do muro', C.sapata, C.sapata + 1.8);
    nm('DRENO', 'o caminho da água', C.dreno, C.dreno + 1.6); nm('BARBACÃS', 'as saídas da água', C.barbacas, C.barbacas + 1.8);
    OV.confetti(t, K.prog(t, DUR - 1.6, 0.3));
    OV.cta('QUAL A PRÓXIMA? 👇', K.prog(t, DUR - 1.5, 0.35));
  },
};

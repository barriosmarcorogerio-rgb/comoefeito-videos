// "Escada" (~46 s): gancho do degrau diferente → rampa escorrega → degraus → espelho 16–18 cm → piso ~28 cm → Blondel ~63 cm → corrimão → degraus iguais.
const WORDS = await (await fetch('words.json')).json();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export const cue = (w, n = 1, end = false) => { let k = 0; for (const x of WORDS) if (norm(x.w) === norm(w) && ++k === n) return end ? x.e : x.s; throw new Error('cue não achada: ' + w); };
const DUR = WORDS[WORDS.length - 1].e + 1.5;

const C = {};
const N = 8, E0 = 0.17, P0 = 0.28, X0 = -1.12, DZ = 1.0, ODD = 4;   // 8 degraus, espelho 17 cm, piso 28 cm
const LAND = 0.6;                                                    // patamar de cima

export default {
  fps: 30, total: Math.ceil(DUR * 30),
  build(K, S) {
    const c = (k, w, n = 1) => (C[k] = cue(w, n));
    c('mesmo', 'mesmo'); c('degrau1', 'degrau?'); c('sobe', 'sobe'); c('rampa', 'rampa'); c('escorrega', 'escorrega'); c('corta', 'corta'); c('degraus', 'degraus');
    c('alto', 'alto'); c('cansa', 'cansa'); c('altura', 'altura'); c('dezesseis', 'dezesseis'); c('espelho', 'espelho'); c('apoia', 'apoia'); c('fundo', 'fundo');
    c('vinte', 'vinte'); c('piso', 'piso'); c('truque', 'truque'); c('dois', 'dois'); c('sessenta', 'sessenta'); c('passo', 'passo'); c('formula', 'fórmula');
    c('subida', 'subida'); c('coloca', 'coloca'); c('corrimao', 'corrimão'); c('tropeco', 'tropeço?'); c('decora', 'decora'); c('diferente', 'diferente...');
    c('erra', 'erra'); c('iguais', 'iguais');
    const sc = S.scene; K.neighborhood(sc, { roadZ: 12, site: { x0: -3.5, x1: 2.8, z0: -1.6, z1: 2.4 } });
    const site = K.group(sc);
    // degraus de concreto (blocos maciços: degrau i tem altura (i+1)·E)
    const steps = []; for (let i = 0; i < N; i++) { const w = i === N - 1 ? LAND : P0; const m = K.concreteBox(site, [w, (i + 1) * E0, DZ], [0, 0, 0]); m.userData = { i, w }; steps.push(m); }
    // placas de destaque: espelho (frente do degrau 3) e piso (topo do degrau 3)
    const hiM = (col) => K.mat(col, { transparent: true, opacity: 0.55, emissive: col, emissiveIntensity: 0.5, depthWrite: false });
    const riser = K.box(site, [0.012, 1, DZ + 0.01], hiM('#ffd23f'), [0, 0, 0], { cast: false });
    const tread = K.box(site, [1, 0.012, DZ + 0.01], hiM('#2fb36a'), [0, 0, 0], { cast: false });
    // rampa lisa (aparece no começo e some quando vira degrau)
    const L = Math.hypot((N - 1) * P0 + LAND * 0, N * E0), ang = Math.atan2(N * E0, (N - 1) * P0);
    const ramp = K.concreteBox(site, [L, 0.08, DZ], [X0 + (N - 1) * P0 / 2, N * E0 / 2 - 0.04, 0]); ramp.rotation.z = ang;
    // corrimão de aço: postes + barra inclinada
    const rail = K.group(site); const steelM = K.mat('#9aa6b2', { metalness: 0.7, roughness: 0.3 });
    const postX = [0, 2, 4, 6].map((i) => X0 + i * P0 + P0 / 2);
    for (const x of postX) { const i = Math.round((x - X0 - P0 / 2) / P0); K.cyl(rail, 0.022, 0.9, steelM, [x, (i + 1) * E0 + 0.45, -0.42]); }
    K.rod(rail, [postX[0] - 0.2, E0 + 0.9 - 0.2 * Math.tan(ang), -0.42], [postX[3] + 0.3, 7 * E0 + 0.9 + 0.3 * Math.tan(ang), -0.42], 0.03, steelM);
    // pegadas no piso (o passo)
    const footM = K.mat('#4a3628', { roughness: 1 });
    const feet = [1, 2, 3, 4, 5, 6].map((i) => { const f = K.add(site, new K.THREE.CircleGeometry(0.06, 20), footM, [X0 + i * P0 + P0 / 2, (i + 1) * E0 + 0.004, i % 2 ? 0.14 : -0.12], { cast: false }); f.rotation.x = -Math.PI / 2; f.scale.set(0.9, 1.7, 1); return f; });
    // setas: espelho (vertical) e piso (horizontal), Blondel (2 espelhos + 1 piso)
    const gV = [3, 4].map((i) => K.arrow(site, [X0 + i * P0 - 0.03, i * E0 + 0.01, 0.56], [X0 + i * P0 - 0.03, (i + 1) * E0 - 0.005, 0.56], '#2fb36a', 0.014));
    const gH = K.arrow(site, [X0 + 4 * P0 + 0.01, 5 * E0 + 0.03, 0.56], [X0 + 5 * P0 - 0.01, 5 * E0 + 0.03, 0.56], '#2fb36a', 0.014);
    const guy = K.mascot(sc, [X0 - 0.35, 0, 1.3], 1.0); guy.root.rotation.y = 0.5;
    return { steps, riser, tread, ramp, rail, feet, gV, gH, guy };
  },
  camera(t, O, Kit) {
    const k = (t, pos, look, fov = 46) => ({ t, pos, look, fov });
    const keys = [
      k(0, [-2.0, 1.7, 3.6], [-0.35, 0.8, 0.25], 48), k(C.sobe - 0.25, [-1.9, 1.65, 3.4], [-0.35, 0.8, 0.25], 48),
      k(C.sobe - 0.22, [-0.2, 1.3, 5.6], [-0.3, 0.75, 0], 50), k(C.corta - 0.2, [-0.1, 1.3, 5.4], [-0.3, 0.8, 0], 50),
      k(C.corta + 0.3, [-2.0, 1.7, 6.2], [-0.3, 0.85, 0.5], 50), k(C.alto - 0.2, [-2.2, 1.9, 6.6], [-0.35, 1.05, 0.5], 50), k(C.cansa + 0.6, [-2.3, 2.1, 6.9], [-0.35, 1.3, 0.5], 52), k(C.altura + 0.17, [-2.3, 2.1, 6.9], [-0.35, 1.2, 0.5], 52),
      k(C.altura + 0.2, [-1.7, 1.05, 1.9], [-0.42, 0.62, 0.2], 44), k(C.espelho + 1.2, [-1.55, 1.0, 1.8], [-0.4, 0.6, 0.2], 44),
      k(C.apoia - 0.2, [-0.8, 2.1, 1.9], [-0.25, 0.7, 0.1], 44), k(C.piso + 1.4, [-0.6, 2.2, 1.8], [-0.2, 0.75, 0.1], 44),
      k(C.truque - 0.3, [-0.6, 1.8, 2.6], [0.2, 0.9, 0.2], 46), k(C.passo - 0.3, [-0.5, 1.85, 2.6], [0.25, 0.92, 0.2], 46),
      k(C.passo + 0.2, [-2.2, 1.8, 6.4], [-0.35, 0.95, 0.5], 50), k(C.subida - 0.3, [-2.1, 1.8, 6.2], [-0.35, 0.95, 0.5], 50),
      k(C.subida + 0.2, [1.9, 1.7, 3.7], [0, 0.95, 0], 46), k(C.corrimao + 1.4, [1.6, 1.6, 3.4], [0, 0.95, 0], 46),
      k(C.tropeco - 0.2, [-2.0, 1.7, 3.6], [-0.35, 0.8, 0.25], 48), k(C.erra + 0.3, [-1.9, 1.65, 3.4], [-0.35, 0.8, 0.25], 48),
      k(C.erra + 0.5, [-2.2, 1.8, 6.6], [-0.35, 0.95, 0.5], 50), k(DUR, [-2.0, 1.9, 6.9], [-0.3, 1.0, 0.5], 50),
    ];
    return Kit.camAt(keys, t);
  },
  frame(t, O, K) {
    const { steps, riser, tread, ramp, rail, feet, gV, gH, guy } = O;
    // altura do espelho E e profundidade do piso P ao longo do vídeo
    let E = E0, P = P0;
    E += (0.32 - E0) * K.ease(K.prog(t, C.alto - 0.1, 0.8)) * (1 - K.ease(K.prog(t, C.altura, 0.9)));      // degrau alto demais → volta
    P += (0.15 - P0) * K.ease(K.prog(t, C.apoia - 0.2, 0.5)) * (1 - K.ease(K.prog(t, C.fundo - 0.1, 1.0))); // piso curto → fundo
    const odd = 0.1 * (t < C.sobe - 0.25 ? 1 : 0) + 0.1 * K.ease(K.prog(t, C.tropeco, 0.5)) * (1 - K.ease(K.prog(t, C.iguais - 0.5, 0.7)));
    const stepsOn = t < C.sobe - 0.25 || t > C.corta - 0.1;
    steps.forEach((m, i) => { const w = i === N - 1 ? LAND : P; const rise = t < C.sobe ? 1 : K.easeOut(K.prog(t, C.corta - 0.1 + i * 0.12, 0.35));
      const h = ((i + 1) * E + (i === ODD ? odd : 0)) * Math.max(rise, 1e-3); m.visible = stepsOn;
      m.scale.set(w / m.userData.w, h / ((i + 1) * E0), 1); m.position.set(X0 + i * P + w / 2, h / 2, 0);
      K.highlight(m, i === ODD ? Math.max(t < C.sobe - 0.25 ? 0.9 : 0, 0.9 * K.glow(t, C.tropeco, C.iguais - 0.3)) : 0.35 * K.glow(t, C.iguais - 0.3, DUR), i === ODD && odd > 0.01 ? '#e23b3b' : '#2fb36a'); });
    // rampa
    const rp = K.prog(t, C.sobe - 0.25, 0.3) * (1 - K.prog(t, C.corta, 0.5)); ramp.visible = rp > 0; ramp.scale.set(1, Math.max(rp, 1e-3), 1);
    // destaques do espelho e do piso (degrau 3)
    const rA = K.glow(t, C.dezesseis - 0.3, C.espelho + 1.6); riser.visible = rA > 0.01; riser.material.opacity = 0.6 * rA; riser.scale.y = E; riser.position.set(X0 + 3 * P - 0.007, 3 * E + E / 2, 0);
    const tA = K.glow(t, C.vinte - 0.4, C.piso + 1.6); tread.visible = tA > 0.01; tread.material.opacity = 0.6 * tA; tread.scale.x = P; tread.position.set(X0 + 3 * P + P / 2, 4 * E + 0.007, 0);
    // setas do Blondel e pegadas
    const bA = t > C.dois - 0.2 && t < C.formula + 1.6; gV.forEach((a) => (a.visible = bA && t > C.dois - 0.2)); gH.visible = bA && t > C.dois + 0.6;
    feet.forEach((f, i) => { f.visible = t > C.passo - 0.6 + i * 0.22 && t < C.subida + 0.2; });
    // corrimão desce do alto
    const cp = K.prog(t, C.coloca, 0.7); rail.visible = cp > 0; rail.position.y = (1 - K.easeOut(cp)) * 1.6; K.highlight(rail, 0.4 * K.glow(t, C.coloca, C.corrimao + 1.3));
    // mascote: na rampa (sobe e escorrega) e depois ao pé da escada
    const onRamp = t > C.sobe - 0.25 && t < C.corta + 0.2;
    if (onRamp) { const up = K.ease(K.prog(t, C.sobe, C.escorrega - C.sobe - 0.2)), down = K.ease(K.prog(t, C.escorrega - 0.15, 0.45)); const s = 0.35 + 0.9 * up - 1.25 * down;
      const ang = Math.atan2(N * E0, (N - 1) * P0); const x = X0 + Math.max(s, -0.6) * Math.cos(ang); guy.root.position.set(x, Math.max(0, (x - X0) * Math.tan(ang)) + 0.04, 0.05); guy.root.rotation.y = Math.PI / 2; }
    else { guy.root.position.set(X0 - 0.35, 0, 1.3); guy.root.rotation.y = 0.5; }
    // fora dos closes (gancho, regra do passo, tropeço): mascote inteiro ou totalmente fora
    guy.root.visible = !(t < C.sobe - 0.25 || (t > C.truque - 0.35 && t < C.passo + 0.15) || (t > C.subida - 0.35 && t < C.erra + 0.45) || (t > C.altura + 0.18 && t < C.truque - 0.35));
    const Pz = [[0, 'scared'], [C.sobe - 0.25, 'walk'], [C.escorrega - 0.2, 'scared'], [C.corta + 0.2, 'point'], [C.alto, 'shrug'], [C.altura, 'think'], [C.espelho - 0.2, 'thumb'],
      [C.apoia - 0.2, 'think'], [C.piso - 0.2, 'thumb'], [C.truque - 0.2, 'point'], [C.formula - 0.2, 'thumb'], [C.subida - 0.2, 'shrug'], [C.coloca, 'pointUp'], [C.corrimao - 0.2, 'thumb'],
      [C.tropeco - 0.2, 'scared'], [C.decora, 'think'], [C.erra, 'shrug'], [C.iguais - 0.6, 'up']];
    let pose = 'idle'; for (const [tt, p] of Pz) if (t >= tt) pose = p; guy.pose(pose, t);
  },
  overlay(t, O, OV, K) {
    const w = (a, b, d = 0.3) => K.prog(t, a, d) * (1 - K.prog(t, b, 0.2));
    OV.hook('Por que todo mundo tropeça no *MESMO* degrau?', K.prog(t, 0, 0.15) * (1 - K.prog(t, C.degrau1 + 0.25, 0.2)), 0.18);
    OV.label([X0 + ODD * P0, 5 * E0 + 0.25, 0.3], 'DEGRAU DIFERENTE', w(C.mesmo - 0.6, C.sobe - 0.3) + w(C.diferente - 0.2, C.iguais - 0.4), '#e23b3b', 50);
    OV.label([-0.4, 1.05, 0.3], 'LISA = ESCORREGA', w(C.rampa, C.corta), '#e23b3b', 50);
    OV.label([-0.4, 2.3, 0.3], 'ALTO DEMAIS', w(C.alto, C.altura), '#e23b3b');
    OV.label([X0 + 3 * P0 - 0.1, 3.5 * E0, 0.6], '16 a 18 cm', w(C.dezesseis - 0.2, C.espelho + 1.6), '#ffd23f');
    OV.label([X0 + 3.5 * P0, 4 * E0 + 0.5, 0.3], 'CURTO DEMAIS', w(C.apoia, C.fundo), '#e23b3b', 48);
    OV.label([X0 + 3.5 * P0, 4 * E0 + 0.5, 0.3], 'UNS 28 cm', w(C.vinte - 0.3, C.piso + 1.6), '#2fb36a');
    OV.label([X0 + 4 * P0, 6 * E0 + 0.25, 0.5], '2 ESPELHOS + 1 PISO ≈ 63 cm', w(C.sessenta - 0.3, C.formula + 1.6), '#2fb36a', 44);
    OV.label([X0 + 2 * P0, 3 * E0, 0.6], '= 1 PASSO', w(C.passo - 0.1, C.formula + 1.6), '#2fb36a');
    OV.label([0.2, 1.75, 0.2], 'TODOS IGUAIS', w(C.iguais - 0.2, DUR), '#2fb36a');
    const nm = (txt, sub, a, b) => OV.name(txt, K.prog(t, a - 0.05, 0.35) * (1 - K.prog(t, b, 0.25)), 0.2, sub);
    nm('ESPELHO', 'a parte de pé do degrau', C.espelho, C.espelho + 1.6); nm('PISO', 'onde o pé pisa', C.piso, C.piso + 1.6);
    nm('FÓRMULA DE BLONDEL', '2 espelhos + 1 piso = 1 passo', C.formula, C.formula + 1.5); nm('CORRIMÃO', 'o apoio da mão', C.corrimao, C.corrimao + 1.6);
    OV.confetti(t, K.prog(t, DUR - 1.6, 0.3));
    OV.cta('QUAL A PRÓXIMA? 👇', K.prog(t, DUR - 1.5, 0.35));
  },
};

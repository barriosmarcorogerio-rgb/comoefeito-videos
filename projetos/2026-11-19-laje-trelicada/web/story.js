// "Laje treliçada" (~51 s): gancho (laje maciça sem escora desaba) → vigotas → enchimento EPS → capa 4 cm → escoras 1,30 m → cura.
const WORDS = await (await fetch('words.json')).json();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export const cue = (w, n = 1, end = false) => { let k = 0; for (const x of WORDS) if (norm(x.w) === norm(w) && ++k === n) return end ? x.e : x.s; throw new Error('cue não achada: ' + w); };
const DUR = WORDS[WORDS.length - 1].e + 1.5;

const C = {};
const YB = 2.64, L = 4.14, X0 = -2.07, NS = 8, SW = L / NS, ZD = 4.2;          // topo das paredes, vão da laje, segmentos
const VZ = Array.from({ length: 10 }, (_, i) => -1.89 + i * 0.42);            // eixos das vigotas
const sagShape = (x) => Math.sin(Math.PI * (x - X0) / L);

export default {
  fps: 30, total: Math.ceil(DUR * 30),
  build(K, S) {
    const c = (k, w, n = 1) => (C[k] = cue(w, n));
    c('sem', 'sem'); c('desaba', 'desaba'); c('ultimo', 'último'); c('agua', 'água'); c('laje1', 'laje', 2); c('pesa', 'pesa'); c('madeira', 'madeira');
    c('entao1', 'então'); c('vigas', 'vigas'); c('trelica', 'treliça'); c('vigotas', 'vigotas'); c('mas1', 'mas'); c('buraco', 'buraco');
    c('encaixa', 'encaixa'); c('isopor', 'isopor'); c('enchimento', 'enchimento'); c('mas2', 'mas', 2); c('soltas', 'soltas'); c('cobre', 'cobre');
    c('tela', 'tela'); c('quatro', 'quatro'); c('capa', 'capa'); c('mas3', 'mas', 3); c('pesa2', 'pesa', 2); c('enverga', 'enverga');
    c('coloca', 'coloca'); c('metro', 'metro'); c('escoras', 'escoras'); c('mas4', 'mas', 4); c('sol', 'sol'); c('trinca', 'trinca');
    c('molha', 'molha'); c('cura', 'cura'); c('agua2', 'água', 2);
    const sc = S.scene; K.neighborhood(sc, { roadZ: 14, site: { x0: -3.5, x1: 4.5, z0: -3, z1: 4 } });
    const site = K.group(sc);
    // casa: baldrame + 3 paredes (frente aberta para ver por dentro)
    const H = 2.52, y0 = 0.12;
    for (const [w, pos, rot] of [[ZD, [-2.0, 0, -0.03], Math.PI / 2], [ZD, [2.0, 0, -0.03], Math.PI / 2], [3.86, [0, 0, -2.06], 0]]) {
      const bw = rot ? 0.34 : w + 0.3, bd = rot ? w + 0.3 : 0.34; K.concreteBox(site, [bw, y0, bd], [pos[0], y0 / 2, pos[2]]);
      K.brickWall(site, { w, h: H, pos: [pos[0], y0, pos[2]], rotY: rot });
    }
    const floor = K.concreteBox(site, [3.86, 0.06, 4.0], [0, 0.03, 0.0]);
    // ---- gancho: laje maciça em fatias (enverga e cai)
    const solid = Array.from({ length: NS }, (_, s) => K.concreteBox(site, [SW - 0.004, 0.12, ZD], [X0 + (s + 0.5) * SW, YB + 0.06, -0.03]));
    const dust = K.particles(site, 90, '#cfc8bb', 0.07);
    // laje maciça intacta + forma de madeira ("gasta muita madeira")
    const slab2 = K.concreteBox(site, [L, 0.12, ZD], [0, YB + 0.06, -0.03]);
    const forma = K.group(site); K.box(forma, [3.84, 0.03, 3.96], K.M.wood, [0, YB - 0.015, -0.03]);
    for (let i = 0; i < 6; i++) K.box(forma, [3.84, 0.08, 0.06], K.M.woodDark, [0, YB - 0.07, -1.7 + i * 0.66]);
    for (const x of [-1.4, -0.47, 0.47, 1.4]) for (const z of [-1.6, -0.6, 0.4, 1.4]) K.box(forma, [0.075, YB - 0.11, 0.075], K.M.wood, [x, (YB - 0.11) / 2, z]);
    // ---- laje treliçada em segmentos (para envergar): vigotas, EPS, tela, capa
    const eps = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 260; i++) { g.strokeStyle = 'rgba(170,170,165,.45)'; g.beginPath(); g.arc(Math.random() * 128, Math.random() * 128, 3 + Math.random() * 3, 0, 7); g.stroke(); }
      const t = new K.THREE.CanvasTexture(cv); t.wrapS = t.wrapT = K.THREE.RepeatWrapping; t.repeat.set(2, 2); t.colorSpace = K.THREE.SRGBColorSpace; return K.mat('#ffffff', { map: t, roughness: 1 }); })();
    const segs = [], vig = VZ.map(() => []), blk = VZ.slice(1).map(() => []), tela = [], capa = [];
    for (let s = 0; s < NS; s++) {
      const g = K.group(site, [X0 + (s + 0.5) * SW, YB, 0]); segs.push(g);
      VZ.forEach((z, i) => { const v = K.group(g, [0, 0, z]); vig[i].push(v);
        K.concreteBox(v, [SW + 0.002, 0.04, 0.12], [0, 0.02, 0]);
        const h = 0.12, n = 3; K.rod(v, [-SW / 2, h, 0], [SW / 2, h, 0], 0.007, K.M.rebar);
        for (const zz of [-0.04, 0.04]) { K.rod(v, [-SW / 2, 0.05, zz], [SW / 2, 0.05, zz], 0.006, K.M.rebar);
          for (let k = 0; k < n; k++) { const xa = -SW / 2 + k * SW / n, xb = xa + SW / n / 2, xc = xa + SW / n; K.rod(v, [xa, 0.05, zz], [xb, h, 0], 0.004, K.M.rebar); K.rod(v, [xb, h, 0], [xc, 0.05, zz], 0.004, K.M.rebar); } } });
      VZ.slice(1).forEach((z, i) => { const b = K.group(g, [0, 0, z - 0.21]); blk[i].push(b); K.add(b, new K.THREE.BoxGeometry(SW - 0.01, 0.115, 0.296), eps, [0, 0.0575, 0]); });
      const tg = K.group(g, [0, 0, 0]); tela.push(tg);
      for (let z = -2.0; z <= 2.01; z += 0.25) K.rod(tg, [-SW / 2, 0.135, z], [SW / 2, 0.135, z], 0.004, K.M.rebar);
      for (const x of [-SW / 4, SW / 4]) K.rod(tg, [x, 0.14, -2.0], [x, 0.14, 2.0], 0.004, K.M.rebar);
      capa.push(K.concreteBox(g, [SW + 0.002, 0.04, ZD], [0, 0.14, -0.03]));
    }
    // ---- escoras: 2 linhas a 1,30 m (guia + pontaletes)
    const esc = [-0.65, 0.65].map((x) => { const g = K.group(site, [x, 0, 0]); K.box(g, [0.08, 0.12, 4.0], K.M.woodDark, [0, -0.06, -0.03]);
      for (const z of [-1.6, -0.8, 0, 0.8, 1.6]) K.box(g, [0.075, 2.5, 0.075], K.M.wood, [0, -0.12 - 1.25, z]); return g; });
    // ---- trincas na capa, calor, água
    const r = K.rng(4); const crk = [];
    for (let k = 0; k < 5; k++) { let x = -1.6 + r() * 3.2, z = -1.5 + r() * 3.0; const pts = [[x, YB + 0.165, z]];
      for (let j = 0; j < 7; j++) { x += (r() - 0.5) * 0.35; z += 0.12 + r() * 0.1; pts.push([x, YB + 0.165, z]); } crk.push(K.crack(site, pts, { r: 0.012 })); }
    const heat = K.particles(site, 60, '#ff9a3c', 0.05), water = K.particles(site, 140, '#3fa2ff', 0.065);
    for (const p of [dust, heat, water]) p.im.frustumCulled = false;
    const reds = [-1.2, -0.4, 0.4, 1.2].map((x) => K.arrow(site, [x, YB + 0.9, 0.6], [x, YB + 0.35, 0.6], '#e23b3b', 0.04));
    const guy = K.mascot(sc, [3.3, 0, 2.6], 1.0); guy.root.rotation.y = -0.55;
    return { solid, dust, slab2, forma, segs, vig, blk, tela, capa, esc, crk, heat, water, reds, guy };
  },
  camera(t, O, Kit) {
    const k = (t, pos, look, fov = 46) => ({ t, pos, look, fov });
    const keys = [
      k(0, [0.6, 3.5, 7.6], [0, 2.3, 0], 50), k(C.desaba - 0.2, [0.4, 3.1, 7.0], [0, 2.0, 0], 50), k(C.desaba + 0.8, [0.3, 2.6, 6.6], [0, 1.2, 0], 50),
      k(C.ultimo + 0.36, [0.2, 2.5, 6.4], [0, 1.1, 0], 50), k(C.ultimo + 0.4, [4.6, 1.5, 7.2], [3.2, 1.0, 2.5]), k(C.laje1 - 0.035, [4.3, 1.4, 6.6], [3.1, 1.0, 2.5]),
      k(C.laje1, [0.6, 3.4, 8.0], [0, 2.0, 0], 48), k(C.pesa + 0.4, [0.5, 3.2, 7.4], [0, 2.1, 0], 48), k(C.madeira - 0.3, [1.2, 1.1, 4.4], [0, 2.1, -0.4], 52),
      k(C.entao1, [0.9, 1.3, 4.8], [0, 2.2, -0.4], 52), k(C.vigas, [1.4, 4.6, 5.4], [0, 2.6, 0.1]), k(C.trelica - 0.6, [1.0, 3.3, 2.9], [0.2, 2.72, 1.0], 44),
      k(C.vigotas + 0.6, [0.6, 3.05, 2.5], [0, 2.72, 0.9], 44), k(C.mas1, [0.4, 5.4, 3.6], [0, 2.6, 0.2]), k(C.encaixa - 0.1, [0.3, 5.2, 3.4], [0, 2.6, 0.2]),
      k(C.isopor - 0.4, [0.9, 3.4, 2.8], [0.1, 2.72, 1.0], 44), k(C.mas2 - 0.035, [0.6, 3.2, 2.6], [0, 2.72, 1.0], 44),
      k(C.mas2, [5.0, 2.6, 10.4], [1.4, 1.7, 1.2], 48), k(C.cobre - 0.3, [4.8, 2.7, 10.0], [1.3, 1.8, 1.1], 48),
      k(C.cobre - 0.265, [1.6, 4.4, 5.6], [0, 2.75, 0]), k(C.quatro + 0.4, [0.8, 3.7, 4.6], [0, 2.78, 0.3]), k(C.quatro + 1.2, [3.0, 3.0, 3.4], [2.0, 2.76, 1.6], 44),
      k(C.capa + 0.6, [2.8, 3.1, 3.6], [1.8, 2.76, 1.4], 44), k(C.mas3, [0.2, 1.9, 7.4], [0, 2.1, 0], 48), k(C.coloca + 0.2, [0.4, 1.8, 7.2], [0, 1.9, 0], 48),
      k(C.metro + 0.4, [0.7, 1.7, 6.8], [0, 1.8, 0], 48), k(C.escoras, [1.7, 0.9, 3.8], [0, 1.8, -0.3], 52), k(C.mas4 - 0.1, [1.5, 1.0, 3.9], [0, 1.9, -0.3], 52),
      k(C.mas4 + 0.4, [0.8, 4.6, 5.2], [0, 2.8, 0]), k(C.trinca, [0.4, 4.0, 3.0], [0, 2.8, 0.6]), k(C.molha, [0.6, 4.2, 3.6], [0, 2.8, 0.4]),
      k(C.molha + 0.8, [1.0, 4.4, 6.2], [0, 2.7, 0]), k(C.cura - 0.035, [1.1, 4.3, 6.4], [0, 2.7, 0]), k(C.cura, [5.0, 2.6, 10.6], [1.4, 1.8, 1.1], 48),
      k(DUR, [4.2, 2.8, 11.0], [1.2, 1.8, 1.0], 48),
    ];
    return Kit.camAt(keys, t);
  },
  frame(t, O, K) {
    const { solid, dust, slab2, forma, segs, vig, blk, tela, capa, esc, crk, heat, water, reds, guy } = O;
    // ---- gancho: laje maciça enverga e desaba; peças somem em "laje" (2ª vez)
    const fall = Math.max(0, t - C.desaba + 0.1), sag0 = 0.22 * K.easeOut(K.prog(t, 0, C.desaba));
    solid.forEach((m, s) => { const xc = m.userData.x0 ?? (m.userData.x0 = m.position.x); m.visible = t < C.laje1 - 0.2;
      const dy = Math.min(fall * fall * 6, YB - 0.2 - s % 3 * 0.05); m.position.y = YB + 0.06 - sag0 * sagShape(xc) - dy;
      m.rotation.z = -sag0 * Math.PI / L * Math.cos(Math.PI * (xc - X0) / L) * 3 + (fall > 0 ? Math.min(fall * 2, 1) * (s % 2 ? 0.25 : -0.3) : 0); m.rotation.x = fall > 0 ? Math.min(fall * 2, 1) * (s % 3 - 1) * 0.12 : 0; });
    const dp = K.prog(t, C.desaba + 0.25, 1.4);
    dust.set((i) => (dp <= 0 || dp >= 1) ? null : [((i * 37) % 90) / 90 * 3.6 - 1.8 + Math.sin(i) * dp * 0.6, 0.2 + dp * (0.5 + (i % 7) * 0.15), ((i * 53) % 90) / 90 * 3.6 - 1.8, 1.3 - dp]);
    const s2 = K.prog(t, C.laje1 - 0.1, 0.5), s2out = K.prog(t, C.entao1, 0.5);
    slab2.visible = s2 > 0 && s2out < 1; slab2.position.y = YB + 0.06 + (1 - K.easeOut(s2)) * 1.5 + K.ease(s2out) * 2.5;
    forma.visible = t > C.pesa + 0.6 && s2out < 1; forma.scale.setScalar(forma.visible ? Math.max(1e-3, K.backOut(K.prog(t, C.pesa + 0.6, 0.5)) * (1 - K.ease(s2out))) : 1e-3);
    // ---- envergamento da laje treliçada (concreto mole) e volta com as escoras
    const sagUp = 0.2 * K.ease(K.prog(t, C.pesa2 - 0.3, 1.6)), sag = sagUp * (1 - K.ease(K.prog(t, C.coloca + 0.55, 0.9)));
    const loose = t > C.soltas - 0.6 && t < C.cobre ? 1 : 0;
    segs.forEach((g, s) => { const xc = g.position.x; g.position.y = YB - sag * sagShape(xc); g.rotation.z = -sag * Math.PI / L * Math.cos(Math.PI * (xc - X0) / L); });
    // vigotas caem uma a uma
    vig.forEach((list, i) => { const p = K.prog(t, C.vigas - 0.4 + i * 0.2, 0.35); const on = p > 0;
      list.forEach((v, s) => { v.visible = on; v.position.y = (1 - K.easeOut(p)) * 1.6 + loose * Math.abs(Math.sin(t * 18 + i + s)) * 0.02; });
      list.forEach((v) => K.highlight(v, 0.45 * K.glow(t, C.trelica - 0.4, C.vigotas + 1.2))); });
    blk.forEach((list, i) => list.forEach((b, s) => { const p = K.prog(t, C.encaixa - 0.1 + i * 0.12 + s * 0.03, 0.3); b.visible = p > 0;
      b.position.y = (1 - K.easeOut(p)) * 1.2 + loose * Math.abs(Math.sin(t * 15 + i * 2 + s)) * 0.03; K.highlight(b, 0.45 * K.glow(t, C.isopor - 0.3, C.enchimento + 1.2)); }));
    tela.forEach((g) => { const p = K.prog(t, C.tela - 0.3, 0.5); g.visible = p > 0; g.position.y = (1 - K.easeOut(p)) * 1.0; });
    const wet = K.ease(K.prog(t, C.molha + 0.2, 1.5));
    capa.forEach((m, s) => { const p = K.prog(t, C.quatro - 0.4 + s * 0.17, 0.35); m.visible = p > 0; m.scale.y = Math.max(1e-3, K.easeOut(p)); m.position.y = 0.12 + 0.02 * K.easeOut(p);
      m.material.color.set('#ffffff').lerp(new K.THREE.Color('#8f99a6'), wet); K.highlight(m, 0.45 * K.glow(t, C.quatro, C.capa + 1.2)); });
    // escoras sobem até encostar e empurram a laje de volta
    esc.forEach((g) => { const p = K.prog(t, C.coloca - 0.1, 0.6); g.visible = p > 0; const top = YB - sag * sagShape(g.position.x);
      g.position.y = K.lerp(0.4, top, K.easeOut(p)); K.highlight(g, 0.45 * K.glow(t, C.coloca, C.escoras + 1.2)); });
    reds.forEach((a, i) => { a.visible = t > C.pesa2 - 0.4 && t < C.coloca + 0.6; a.position.y = -((t * 1.6 + i * 0.3) % 1) * 0.12 - sag * sagShape(a.userData.A.x); });
    // trincas, calor e água
    const cp = K.prog(t, C.trinca - 0.3, 0.6), cOut = K.prog(t, C.molha + 0.6, 1.2);
    crk.forEach((c, i) => c.set(K.clamp(cp * 1.4 - i * 0.1) * (1 - cOut)));
    const hp = t > C.sol - 0.2 && t < C.molha;
    heat.set((i) => { if (!hp) return null; const ph = ((t * 0.7 + i * 0.137) % 1); return [-1.8 + ((i * 41) % 60) / 60 * 3.6, YB + 0.2 + ph * 1.4, -1.8 + ((i * 23) % 60) / 60 * 3.6, 1 - ph]; });
    const wOn = t > C.molha - 0.1;
    water.set((i) => { if (!wOn) return null; const ph = ((t * 1.3 + i * 0.071) % 1); return [-1.9 + ((i * 41) % 140) / 140 * 3.8, YB + 0.2 + (1 - ph) * 2.6, -1.9 + ((i * 67) % 140) / 140 * 3.8]; });
    const P = [[0, 'shrug'], [C.desaba - 0.2, 'scared'], [C.ultimo, 'think'], [C.agua - 0.2, 'pointUp'], [C.laje1, 'shrug'], [C.vigas - 0.6, 'point'], [C.vigotas - 0.3, 'thumb'],
      [C.mas1, 'shrug'], [C.encaixa - 0.3, 'point'], [C.enchimento - 0.3, 'thumb'], [C.mas2, 'shrug'], [C.cobre - 0.2, 'point'], [C.capa - 0.3, 'thumb'], [C.mas3, 'scared'],
      [C.coloca - 0.3, 'point'], [C.escoras - 0.3, 'thumb'], [C.mas4, 'shrug'], [C.trinca - 0.2, 'scared'], [C.molha - 0.2, 'point'], [C.cura - 0.3, 'thumb'], [C.agua2, 'up']];
    let pose = 'idle'; for (const [tt, p] of P) if (t >= tt) pose = p; guy.pose(pose, t);
  },
  overlay(t, O, OV, K) {
    const w = (a, b, d = 0.3) => K.prog(t, a, d) * (1 - K.prog(t, b, 0.2));
    OV.label([0, 3.3, 0], 'SEM NADA EMBAIXO', w(C.sem, C.desaba + 0.3), '#e23b3b');
    OV.label([0, 3.35, 0], 'MUITO PESO', w(C.pesa, C.entao1), '#e23b3b');
    OV.label([0.6, 2.25, 0.6], 'MUITA MADEIRA', w(C.madeira - 0.2, C.entao1 + 0.2), '#e23b3b', 50);
    OV.label([0.2, 2.95, 1.05], 'AÇO EM TRELIÇA', w(C.trelica - 0.3, C.vigotas - 0.3), '#2f80ed', 50);
    OV.label([0.1, 2.75, 0.75], 'VÃO', w(C.buraco - 0.2, C.encaixa), '#e23b3b');
    OV.label([0.1, 2.95, 1.1], 'ISOPOR (EPS)', w(C.isopor - 0.2, C.enchimento - 0.2), '#2f80ed', 50);
    OV.label([2.07, 3.0, 1.7], '4 cm', w(C.quatro + 1.0, C.capa + 1.4), '#2fb36a');
    OV.label([0, 3.75, 0.6], 'ENVERGA', w(C.enverga - 0.3, C.coloca + 0.4), '#e23b3b');
    OV.label([0, 2.25, 1.9], '1,30 m', w(C.metro - 0.2, C.escoras + 1.4), '#2fb36a');
    OV.label([0, 3.4, 0.6], 'SECOU RÁPIDO', w(C.trinca - 0.2, C.molha), '#e23b3b');
    const nm = (txt, a, b) => OV.name(txt, K.prog(t, a - 0.05, 0.35) * (1 - K.prog(t, b, 0.25)), 0.2);
    nm('VIGOTAS TRELIÇADAS', C.vigotas, C.vigotas + 1.4); nm('ENCHIMENTO', C.enchimento, C.enchimento + 1.1); nm('CAPA', C.capa, C.capa + 1.0);
    nm('ESCORAS', C.escoras, C.escoras + 1.2); nm('CURA', C.cura, C.cura + 1.6);
    OV.confetti(t, K.prog(t, DUR - 1.6, 0.3));
    OV.cta('QUAL A PRÓXIMA? 👇', K.prog(t, DUR - 1.5, 0.35));
  },
};

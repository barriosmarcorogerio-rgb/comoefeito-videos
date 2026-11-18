// "Parede com janela — amarração, verga, contraverga, transpasse e cinta" (~63 s). Tempos pela narração (words.json) via cue().
const WORDS = await (await fetch('words.json')).json();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export const cue = (w, n = 1, end = false) => { let k = 0; for (const x of WORDS) if (norm(x.w) === norm(w) && ++k === n) return end ? x.e : x.s; throw new Error('cue não achada: ' + w); };
const DUR = WORDS[WORDS.length - 1].e + 1.3;

const C = {};
const W = { w: 4.06, h: 2.8, y0: 0.12 };                       // 14 tijolos de 29 cm, 20 fiadas de 14 cm
const OPEN = { x0: -0.6, x1: 0.6, y0: 0.98, y1: 1.96 };
const VY = [1.96, 2.24], CY = [0.84, 0.98], SH = 0.6, LG = 0.9;  // verga/contraverga: curta = vão; longa = +30 cm de cada lado
const Y = (y) => W.y0 + y;

export default {
  fps: 30, total: Math.ceil(DUR * 30),
  build(K, S) {
    const c = (k, w, n = 1) => (C[k] = cue(w, n));
    c('empilha', 'empilha'); c('alinhado', 'alinhado'); c('meio', 'abre'); c('entao0', 'então'); c('desenc', 'desencontra'); c('amarr', 'amarração');
    c('mas1', 'mas'); c('buraco', 'buraco'); c('janela', 'janela'); c('racha1', 'racha'); c('diag', 'diagonal'); c('peso1', 'peso'); c('cantos', 'cantos');
    c('apoia', 'apoia'); c('concreto', 'concreto'); c('verga', 'verga'); c('embaixo', 'embaixo'); c('racha2', 'racha', 2); c('coloca', 'coloca'); c('contra', 'contraverga');
    c('termina', 'termina'); c('trinca1', 'trinca'); c('estica', 'estica'); c('trinta', '30'); c('transp', 'transpasse');
    c('mas5', 'mas', 4); c('telhado', 'telhado'); c('trincam', 'trincam'); c('corre', 'corre'); c('espalha', 'espalha'); c('cinta', 'cinta');
    c('isso', 'isso'); c('semverga', 'verga', 2); c('rebocar', 'rebocar'); c('pintar', 'pintar'); c('parabens', 'parabéns'); c('qual', 'qual');
    C.regions = [
      { x0: OPEN.x0, x1: OPEN.x1, y0: OPEN.y0, y1: OPEN.y1, t: C.buraco },
      { x0: -SH, x1: SH, y0: VY[0], y1: VY[1], t: C.apoia - 0.35 },
      { x0: -LG, x1: LG, y0: VY[0], y1: VY[1], t: C.estica },
      { x0: -SH, x1: SH, y0: CY[0], y1: CY[1], t: C.coloca - 0.35 },
      { x0: -LG, x1: LG, y0: CY[0], y1: CY[1], t: C.estica },
    ];
    const sc = S.scene; K.neighborhood(sc, { roadZ: 13, site: { x0: -3.5, x1: 4, z0: -2, z1: 3 } });
    const site = K.group(sc);
    K.concreteBox(site, [W.w + 0.3, W.y0, 0.34], [0, W.y0 / 2, 0]);                                  // baldrame
    // parede A: tijolo sobre tijolo (juntas alinhadas) — abre ao meio
    const wallA = K.brickWall(site, { w: W.w, h: W.h, pos: [0, W.y0, 0], stack: true });
    const crackA = K.crack(site, K.crackPath([0, Y(W.h), 0.075], [0, Y(0.05), 0.075], 14, 0.015, 7), { r: 0.024 });
    // parede B: amarrada, com mortar holes nas regiões que serão abertas
    const wall = K.brickWall(site, { w: W.w, h: W.h, pos: [0, W.y0, 0], mortarHoles: [OPEN, { x0: -LG, x1: LG, y0: VY[0] + 0.006, y1: VY[1] }, { x0: -LG, x1: LG, y0: CY[0], y1: CY[1] - 0.006 }] });
    const fill = (x0, x1, y0, y1) => K.box(site, [x1 - x0, y1 - y0, 0.1], K.M.mortar, [(x0 + x1) / 2, Y((y0 + y1) / 2), 0], { cast: false });
    const fills = { open: fill(OPEN.x0, OPEN.x1, OPEN.y0, OPEN.y1), vS: fill(-SH, SH, ...VY), vE: [fill(-LG, -SH, ...VY), fill(SH, LG, ...VY)], cS: fill(-SH, SH, ...CY), cE: [fill(-LG, -SH, ...CY), fill(SH, LG, ...CY)] };
    // janela
    const win = K.group(site, [0, Y((OPEN.y0 + OPEN.y1) / 2), 0]); const fw = OPEN.x1 - OPEN.x0 - 0.02, fh = OPEN.y1 - OPEN.y0 - 0.02;
    for (const [w, h, x, y] of [[fw, 0.06, 0, fh / 2 - 0.03], [fw, 0.06, 0, -fh / 2 + 0.03], [0.06, fh, -fw / 2 + 0.03, 0], [0.06, fh, fw / 2 - 0.03, 0], [0.04, fh, 0, 0]]) K.box(win, [w, h, 0.1], K.M.white, [x, y, 0]);
    K.box(win, [fw - 0.08, fh - 0.08, 0.02], K.M.glass, [0, 0, 0], { cast: false });
    // vergas (concreto com brita)
    const vh = VY[1] - VY[0] - 0.012, ch = CY[1] - CY[0] - 0.012;
    const vergaS = K.concreteBox(site, [2 * SH, vh, 0.14], [0, Y((VY[0] + VY[1]) / 2), 0]);
    const vergaL = K.concreteBox(site, [2 * LG, vh, 0.14], [0, Y((VY[0] + VY[1]) / 2), 0]);
    const contraS = K.concreteBox(site, [2 * SH, ch, 0.14], [0, Y((CY[0] + CY[1]) / 2), 0]);
    const contraL = K.concreteBox(site, [2 * LG, ch, 0.14], [0, Y((CY[0] + CY[1]) / 2), 0]);
    const cinta = K.concreteBox(site, [W.w, 0.2, 0.14], [0, Y(W.h + 0.1), 0]);
    // trincas
    const zf = 0.075, cp = (a, b, n, s) => K.crack(site, K.crackPath(a, b, n, 0.035, s), { r: 0.022 });
    const crUp = [cp([OPEN.x0, Y(OPEN.y1), zf], [OPEN.x0 - 0.7, Y(OPEN.y1) + 0.7, zf], 8, 3), cp([OPEN.x1, Y(OPEN.y1), zf], [OPEN.x1 + 0.7, Y(OPEN.y1) + 0.7, zf], 8, 4)];
    const crLo = [cp([OPEN.x0, Y(OPEN.y0), zf], [OPEN.x0 - 0.6, Y(OPEN.y0) - 0.6, zf], 7, 5), cp([OPEN.x1, Y(OPEN.y0), zf], [OPEN.x1 + 0.6, Y(OPEN.y0) - 0.6, zf], 7, 6)];
    const crEnd = [cp([-SH, Y(VY[1]), zf], [-SH - 0.5, Y(VY[1]) + 0.5, zf], 6, 8), cp([SH, Y(VY[1]), zf], [SH + 0.5, Y(VY[1]) + 0.5, zf], 6, 9),
      cp([-SH, Y(CY[0]), zf], [-SH - 0.45, Y(CY[0]) - 0.45, zf], 6, 10), cp([SH, Y(CY[0]), zf], [SH + 0.45, Y(CY[0]) - 0.45, zf], 6, 11)];
    const topX = [-1.3, 0, 1.3];
    const crTop = topX.map((x, i) => cp([x, Y(W.h), zf], [x + (i - 1) * 0.15, Y(W.h) - 0.5, zf], 6, 12 + i));
    // setas
    const redV = [-0.3, 0.3].map((x) => K.arrow(site, [x, Y(3.45), 0.2], [x, Y(3.0), 0.2], '#e23b3b', 0.035));
    const redT = topX.map((x) => K.arrow(site, [x, Y(3.65), 0.12], [x, Y(3.15), 0.12], '#e23b3b', 0.04));
    const greenT = [-1.75, -1.17, -0.58, 0, 0.58, 1.17, 1.75].map((x) => K.arrow(site, [x, Y(2.75), 0.2], [x, Y(2.4), 0.2], '#2fb36a', 0.025));
    const greenV = [-LG + 0.12, LG - 0.12].map((x) => K.arrow(site, [x, Y(1.92), 0.2], [x, Y(1.5), 0.2], '#2fb36a', 0.03));
    // reboco (4 faixas em volta do vão, sobe de baixo pra cima) e pintura
    const pm = K.mat('#cdc5b5', { roughness: 0.95 }); const HT = W.h + 0.2;
    const strips = [[-W.w / 2, OPEN.x0, 0, HT], [OPEN.x1, W.w / 2, 0, HT], [OPEN.x0, OPEN.x1, 0, OPEN.y0], [OPEN.x0, OPEN.x1, OPEN.y1, HT]]
      .map(([x0, x1, y0, y1]) => ({ y0, y1, m: K.box(site, [x1 - x0, 1, 0.02], pm, [(x0 + x1) / 2, 0, 0.083], { cast: false }) }));
    const guy = K.mascot(sc, [2.75, 0, 1.3], 1.0); guy.root.rotation.y = -0.35;
    return { wallA, crackA, wall, fills, win, vergaS, vergaL, contraS, contraL, cinta, crUp, crLo, crEnd, crTop, redV, redT, greenT, greenV, strips, pm, guy };
  },
  camera(t, O, Kit) {
    const k = (t, pos, look, fov = 44) => ({ t, pos, look, fov });
    const keys = [
      k(0, [1.0, 1.7, 10.6], [0.4, 1.45, 0], 46),
      k(C.meio - 0.3, [0.6, 1.9, 7.4], [0.1, 1.6, 0], 46),
      k(C.entao0, [0.3, 2.0, 5.2], [0, 1.7, 0]),
      k(C.desenc + 0.3, [0.9, 1.7, 10.6], [0.4, 1.45, 0], 46),
      k(C.amarr - 0.6, [1.8, 1.5, 4.8], [0, 1.35, 0]),
      k(C.mas1, [2.0, 1.4, 4.6], [0.2, 1.3, 0]),
      k(C.mas1 + 0.9, [3.7, 1.3, 5.6], [2.1, 1.05, 0.6]),
      k(C.buraco - 0.2, [3.4, 1.4, 6.4], [1.6, 1.2, 0.5]),
      k(C.buraco + 0.4, [0.4, 1.6, 6.0], [0, 1.5, 0]),
      k(C.racha1, [0.2, 1.8, 5.2], [-0.1, 1.7, 0]),
      k(C.racha1 + 0.7, [-0.4, 2.3, 3.4], [-0.75, 2.2, 0]),
      k(C.peso1 - 0.2, [-0.2, 2.3, 3.8], [-0.4, 2.3, 0]),
      k(C.peso1 + 0.6, [0.4, 2.4, 6.0], [0, 2.3, 0], 46),
      k(C.apoia - 0.2, [0.6, 2.3, 5.4], [0, 2.2, 0], 46),
      k(C.apoia + 0.5, [2.1, 2.3, 3.6], [0, 2.15, 0]),
      k(C.concreto, [0.9, 2.35, 2.2], [0, 2.2, 0]),
      k(C.verga - 0.4, [0.6, 2.3, 2.0], [0, 2.2, 0]),
      k(C.verga + 0.3, [0.5, 1.7, 5.8], [0, 1.6, 0]),
      k(C.embaixo, [0.0, 1.2, 4.6], [-0.2, 1.1, 0]),
      k(C.racha2, [-0.4, 0.9, 3.2], [-0.6, 1.0, 0]),
      k(C.coloca - 0.3, [0.4, 0.95, 3.6], [-0.1, 1.0, 0]),
      k(C.coloca + 0.6, [2.0, 0.9, 3.0], [0, 1.0, 0]),
      k(C.contra - 0.5, [0.8, 1.05, 2.2], [0, 1.0, 0]),
      k(C.contra + 0.3, [3.4, 1.4, 7.2], [1.3, 1.25, 0.3], 46),
      k(C.termina - 0.2, [3.2, 1.6, 6.6], [1.1, 1.5, 0.2], 46),
      k(C.termina + 0.6, [1.1, 2.4, 2.9], [0.7, 2.3, 0]),
      k(C.trinca1 + 0.8, [1.3, 2.25, 3.2], [0.8, 2.2, 0]),
      k(C.estica - 0.1, [0.6, 1.8, 6.0], [0, 1.6, 0]),
      k(C.trinta + 0.5, [0.3, 1.7, 6.2], [0, 1.6, 0]),
      k(C.transp, [1.8, 1.7, 5.4], [0, 1.6, 0]),
      k(C.mas5, [2.0, 2.4, 6.4], [0.3, 2.3, 0], 46),
      k(C.telhado, [0.6, 3.5, 6.6], [0, 3.0, 0], 46),
      k(C.trincam, [0.4, 3.3, 5.0], [0, 2.9, 0]),
      k(C.corre, [2.6, 3.5, 4.6], [0, 2.95, 0]),
      k(C.espalha, [0.6, 3.0, 5.4], [0, 2.7, 0], 46),
      k(C.cinta - 0.2, [1.0, 2.6, 7.4], [0.3, 2.2, 0], 46),
      k(C.cinta + 0.8, [3.6, 1.7, 8.8], [1.0, 1.6, 0.3], 46),
      k(C.isso, [3.4, 1.7, 8.4], [0.9, 1.6, 0.3], 46),
      k(C.semverga, [0.4, 1.8, 6.6], [0, 1.6, 0], 46),
      k(C.rebocar - 0.3, [0.5, 1.8, 7.4], [0, 1.6, 0], 46),
      k(C.pintar + 0.4, [0.9, 1.7, 10.4], [0.5, 1.5, 0], 46),
      k(C.parabens + 0.2, [3.3, 1.35, 6.4], [1.6, 1.3, 0.4], 46),
      k(DUR, [2.5, 1.45, 6.9], [1.3, 1.35, 0.4], 46),
    ];
    return Kit.camAt(keys, t);
  },
  frame(t, O, K) {
    const { wallA, crackA, wall, fills, win, vergaS, vergaL, contraS, contraL, cinta, crUp, crLo, crEnd, crTop, redV, redT, greenT, greenV, strips, pm, guy } = O;
    // ---- parede A (alinhada): sobe, abre ao meio, cai
    const aEnd = C.alinhado + 0.5, aDt = (aEnd - 0.2) / (wallA.rows + 1), split = K.easeOut(K.prog(t, C.meio - 0.1, 0.8)), fall = K.prog(t, C.entao0, 0.6);
    const aOn = t < C.entao0 + 0.7; wallA.g.visible = aOn;
    if (aOn) wallA.update((b) => { const p = K.prog(t, 0.2 + b.row * aDt, 0.3); const f = K.clamp(fall * 1.6 - (wallA.rows - b.row) / wallA.rows * 0.6);
      return { s: (p > 0 ? 1 : 0) * (1 - f), dy: (1 - K.easeOut(p)) * 0.6 - f * 0.8, dx: Math.sign(b.x) * split * 0.06 * (b.row + 1) / wallA.rows }; });
    wallA.setMortarHeight(K.clamp((t - 0.2) / (aEnd - 0.2)) * W.h); wallA.mortar.visible = t < C.entao0;
    crackA.set(t < C.entao0 ? K.prog(t, C.meio - 0.1, 0.6) : 0);
    // ---- parede B (amarrada): sobe fiada por fiada; regiões abrem (tijolos inteiros saem, tijolos na borda viram tijolo cortado)
    const b0 = C.desenc - 0.1, b1 = C.amarr - 0.3, bDt = (b1 - b0) / (wall.rows + 1);
    wall.g.visible = t > b0;
    const R = C.regions;
    wall.update((b) => {
      const p = K.prog(t, b0 + b.row * bDt, 0.3); let s = p > 0 ? 1 : 0, dy = (1 - K.easeOut(p)) * 0.6, dz = 0;
      let a = b.x - b.w / 2, e = b.x + b.w / 2, gone = null;
      for (const r of R) { if (t < r.t || b.y < r.y0 || b.y > r.y1) continue;
        if (a >= r.x0 - 0.01 && e <= r.x1 + 0.01) { gone = gone ?? r.t; continue; }
        if (a < r.x0 && e > r.x0) e = r.x0 - 0.006; else if (a < r.x1 && e > r.x1) a = r.x1 + 0.006; }
      if (gone !== null) { const q = K.prog(t, gone, 0.4); s *= 1 - K.ease(q); dz = K.easeOut(q) * 0.9; dy -= q * q * 0.4; return { s, dy, dz }; }
      return { s, dy, x: (a + e) / 2, w: e - a };
    });
    wall.setMortarHeight(t < b0 ? 0 : K.clamp((t - b0) / (b1 - b0)) * W.h);
    const built = t > b1;
    fills.open.visible = built && t < R[0].t; fills.vS.visible = built && t < R[1].t; fills.cS.visible = built && t < R[3].t;
    for (const f of [...fills.vE, ...fills.cE]) f.visible = built && t < C.estica;
    // ---- janela entra
    const wp = K.prog(t, C.janela - 0.15, 0.5); win.visible = wp > 0; win.position.z = (1 - K.easeOut(wp)) * 1.4;
    // ---- trincas
    const off = (on, off) => (t >= off ? 0 : K.prog(t, on, 0.7));
    crUp.forEach((c, i) => c.set(K.clamp(off(C.racha1 - 0.1, C.apoia) * 1.2 - i * 0.15)));
    crLo.forEach((c, i) => c.set(K.clamp(off(C.racha2 - 0.1, C.coloca) * 1.2 - i * 0.15)));
    crEnd.forEach((c, i) => c.set(K.clamp(off(C.trinca1 - 0.1, C.estica) * 1.2 - (i % 2) * 0.15)));
    crTop.forEach((c, i) => c.set(K.clamp(off(C.trincam - 0.2, C.corre) * 1.3 - i * 0.12)));
    // ---- verga / contraverga: curtas entram pela frente; no "estica" viram longas (crescem para os lados)
    const slide = (m, t0) => { const p = K.prog(t, t0, 0.8); m.visible = p > 0; m.position.z = (1 - K.easeOut(p)) * 1.8; };
    slide(vergaS, C.apoia); slide(contraS, C.coloca);
    const gp = K.prog(t, C.estica + 0.15, 0.7);
    if (gp > 0) { vergaS.visible = contraS.visible = false; for (const m of [vergaL, contraL]) { m.visible = true; m.position.z = 0; m.scale.x = K.lerp(SH / LG, 1, K.backOut(gp)); } }
    else vergaL.visible = contraL.visible = false;
    const pulse = 0.5 + 0.5 * Math.sin(t * 9), hl = (a, b) => (t > a && t < b ? pulse : 0);
    K.highlight(vergaS, hl(C.apoia, C.verga + 1.2)); K.highlight(contraS, hl(C.coloca, C.contra + 1.2));
    const isso = hl(C.semverga - 0.4, C.rebocar - 0.3);
    K.highlight(vergaL, Math.max(hl(C.estica, C.transp + 1.2), isso)); K.highlight(contraL, Math.max(hl(C.estica, C.transp + 1.2), isso));
    // ---- cinta desce no topo
    const cpr = K.prog(t, C.corre, 0.8); cinta.visible = cpr > 0; cinta.position.y = Y(W.h + 0.1) + (1 - K.easeOut(cpr)) * 2.0;
    K.highlight(cinta, hl(C.corre, C.cinta + 1.4));
    // ---- setas (descem em loop)
    const bob = (i) => -((t * 1.6 + i * 0.3) % 1) * 0.12;
    redV.forEach((a, i) => { a.visible = t > C.peso1 - 0.2 && t < C.apoia; a.position.y = bob(i); });
    greenV.forEach((a, i) => { a.visible = t > C.verga + 0.2 && t < C.embaixo; a.position.y = bob(i); });
    redT.forEach((a, i) => { a.visible = t > C.telhado - 0.2 && t < C.cinta + 1.2; a.position.y = bob(i) + (t > C.corre ? 0.2 : 0); });
    greenT.forEach((a, i) => { a.visible = t > C.espalha - 0.1 && t < C.cinta + 1.2; a.position.y = bob(i * 0.5); a.scale.setScalar(K.backOut(K.prog(t, C.espalha - 0.1 + i * 0.05, 0.3))); });
    // ---- reboco sobe e depois a pintura
    const rev = K.ease(K.prog(t, C.rebocar - 0.1, 1.2)) * (W.h + 0.2);
    for (const s of strips) { const h = K.clamp(rev - s.y0, 0, s.y1 - s.y0); s.m.visible = h > 0.01; s.m.scale.y = Math.max(h, 1e-3); s.m.position.y = Y(s.y0 + h / 2); }
    pm.color.set('#cdc5b5').lerp(new K.THREE.Color('#f4d58d'), K.ease(K.prog(t, C.pintar, 0.9)));
    // ---- mascote
    const P = [[0, 'idle'], [C.meio, 'scared'], [C.entao0, 'think'], [C.desenc, 'point'], [C.amarr - 0.8, 'thumb'], [C.mas1, 'think'], [C.buraco - 0.3, 'point'],
      [C.racha1, 'scared'], [C.peso1 - 0.4, 'shrug'], [C.apoia - 0.6, 'point'], [C.verga - 0.6, 'thumb'], [C.embaixo, 'shrug'], [C.racha2, 'scared'], [C.coloca - 0.5, 'point'],
      [C.contra - 0.8, 'thumb'], [C.termina - 0.4, 'think'], [C.trinca1, 'scared'], [C.estica - 0.4, 'point'], [C.transp - 0.5, 'thumb'], [C.mas5, 'shrug'],
      [C.trincam - 0.3, 'scared'], [C.corre - 0.4, 'pointUp'], [C.cinta - 0.6, 'thumb'], [C.isso - 0.2, 'think'], [C.semverga, 'point'], [C.rebocar - 0.4, 'idle'], [C.parabens - 0.1, 'up']];
    let pose = 'idle'; for (const [tt, p] of P) if (t >= tt) pose = p; guy.pose(pose, t);
  },
  overlay(t, O, OV, K) {
    const win = (a, b, d = 0.3) => K.prog(t, a, d) * (1 - K.prog(t, b, 0.2));
    OV.label([0, Y(3.2), 0.1], 'JUNTAS ALINHADAS', win(C.alinhado, C.entao0), '#e23b3b');
    OV.label([0, Y(3.2), 0.1], 'JUNTAS DESENCONTRADAS', win(C.desenc + 0.4, C.mas1), '#2fb36a', 48);
    OV.label([-1.0, Y(2.95), 0.1], 'TRINCA A 45°', win(C.diag - 0.6, C.apoia), '#e23b3b');
    OV.label([0, Y(3.6), 0.2], 'PESO', win(C.peso1, C.apoia), '#e23b3b');
    OV.label([0, Y(2.7), 0.1], 'VIGA DE CONCRETO', win(C.concreto, C.verga + 1.2), '#2f80ed');
    OV.label([-0.9, Y(0.55), 0.1], 'TRINCA', win(C.racha2, C.coloca), '#e23b3b');
    OV.label([0, Y(0.5), 0.1], 'VIGA DE CONCRETO', win(C.coloca + 0.6, C.contra + 1.2), '#2f80ed');
    OV.label([-0.75, Y(2.6), 0.1], '30 cm', win(C.trinta, C.transp + 1.3), '#2fb36a');
    OV.label([0.75, Y(2.6), 0.1], '30 cm', win(C.trinta + 0.1, C.transp + 1.3), '#2fb36a');
    OV.label([0, Y(3.95), 0.1], 'PESO DO TELHADO', win(C.telhado, C.corre), '#e23b3b');
    OV.label([0, Y(3.5), 0.1], 'PESO ESPALHADO', win(C.espalha + 0.2, C.cinta), '#2fb36a');
    const nm = (txt, a, b) => OV.name(txt, K.prog(t, a - 0.05, 0.35) * (1 - K.prog(t, b, 0.25)), 0.2);
    nm('AMARRAÇÃO', C.amarr, C.amarr + 1.5); nm('VERGA', C.verga, C.verga + 1.3); nm('CONTRAVERGA', C.contra, C.contra + 1.3);
    nm('TRANSPASSE', C.transp, C.transp + 1.4); nm('CINTA DE AMARRAÇÃO', C.cinta, C.cinta + 1.5);
    OV.confetti(t, K.prog(t, C.parabens, 0.4));
    OV.cta('QUAL A PRÓXIMA? 👇', K.prog(t, DUR - 2.1, 0.4));
  },
};

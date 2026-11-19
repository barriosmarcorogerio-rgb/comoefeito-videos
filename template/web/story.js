// TESTE: "Parede com janela — verga" (10–12 s). Tempos vêm da narração (web/words.json) via cue('palavra').
const WORDS = await (await fetch('words.json')).json();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export const cue = (w, n = 1, end = false) => { let k = 0; for (const x of WORDS) if (norm(x.w) === norm(w) && ++k === n) return end ? x.e : x.s; throw new Error('cue não achada: ' + w); };
const DUR = WORDS[WORDS.length - 1].e + 1.2;

const C = {}; // tempos
const WALL = { w: 4.2, h: 2.8, y0: 0.12 }, OPEN = { x0: -0.62, x1: 0.62, y0: 0.98, y1: 1.96 }, SLOT = { x0: -0.95, x1: 0.95, y0: 1.96, y1: 2.24 };
const ABOVE = { x0: -1.2, x1: 1.2, y0: 2.24, y1: 2.79 };   // tijolos que saem e voltam (argamassa própria)

export default {
  fps: 30, total: Math.ceil(DUR * 30),
  build(K, S) {
    Object.assign(C, { janela: cue('janela'), racha: cue('racha'), bem: cue('bem'), diag: cue('diagonal'), entao: cue('então'), viga: cue('viga'), vao: cue('vão'), essa: cue('essa'), verga: cue('verga'), fim: cue('verga', 1, true) });
    const sc = S.scene; K.neighborhood(sc, { roadZ: 13 });
    const site = K.group(sc);
    K.box(site, [WALL.w + 0.3, WALL.y0, 0.34], K.M.concrete, [0, WALL.y0 / 2, 0]);           // baldrame
    const wall = K.brickWall(site, { w: WALL.w, h: WALL.h, pos: [0, WALL.y0, 0], openings: [OPEN], mortarHoles: [SLOT, ABOVE],
      tag: (x, y) => (y > SLOT.y0 && y < SLOT.y1 && x > SLOT.x0 - 0.1 && x < SLOT.x1 + 0.1) ? 'slot' : (y > SLOT.y1 && Math.abs(x) < ABOVE.x1 ? 'above' : null) });
    const aboveMortar = K.box(site, [ABOVE.x1 - ABOVE.x0, ABOVE.y1 - ABOVE.y0, 0.1], K.M.mortar, [0, WALL.y0 + (ABOVE.y0 + ABOVE.y1) / 2, 0], { cast: false });
    // janela (caixilho + vidro) entra no vão
    const win = K.group(site, [0, WALL.y0 + (OPEN.y0 + OPEN.y1) / 2, 0]); const fw = OPEN.x1 - OPEN.x0 - 0.04, fh = OPEN.y1 - OPEN.y0 - 0.04;
    for (const [w, h, x, y] of [[fw, 0.06, 0, fh / 2 - 0.03], [fw, 0.06, 0, -fh / 2 + 0.03], [0.06, fh, -fw / 2 + 0.03, 0], [0.06, fh, fw / 2 - 0.03, 0], [0.04, fh, 0, 0]]) K.box(win, [w, h, 0.1], K.M.white, [x, y, 0]);
    K.box(win, [fw - 0.08, fh - 0.08, 0.02], K.M.glass, [0, 0, 0], { cast: false });
    // verga (concreto) e trincas
    const verga = K.concreteBox(site, [SLOT.x1 - SLOT.x0, SLOT.y1 - SLOT.y0 - 0.012, 0.14], [0, 0, 0]);
    const yb = (y) => WALL.y0 + y, zf = 0.075;
    const cracks = [
      K.crack(site, K.crackPath([OPEN.x0, yb(OPEN.y1), zf], [OPEN.x0 - 0.75, yb(OPEN.y1) + 0.75, zf], 8, 0.04, 3), { r: 0.022 }),
      K.crack(site, K.crackPath([OPEN.x1, yb(OPEN.y1), zf], [OPEN.x1 + 0.75, yb(OPEN.y1) + 0.75, zf], 8, 0.04, 4), { r: 0.022 }),
      K.crack(site, K.crackPath([OPEN.x0, yb(OPEN.y0), zf], [OPEN.x0 - 0.6, yb(OPEN.y0) - 0.6, zf], 7, 0.04, 5), { r: 0.018 }),
      K.crack(site, K.crackPath([OPEN.x1, yb(OPEN.y0), zf], [OPEN.x1 + 0.6, yb(OPEN.y0) - 0.6, zf], 7, 0.04, 6), { r: 0.018 }),
    ];
    // setas de peso (vermelhas) sobre o vão e setas verdes nas pontas da verga
    const red = [-0.3, 0.3].map((x) => K.arrow(site, [x, yb(3.3), 0.2], [x, yb(2.85), 0.2], '#e23b3b', 0.035));
    const green = [SLOT.x0 + 0.13, SLOT.x1 - 0.13].map((x) => K.arrow(site, [x, yb(1.9), 0.2], [x, yb(1.45), 0.2], '#2fb36a', 0.035));
    const guy = K.mascot(sc, [2.55, 0, 1.5], 1.0); guy.root.rotation.y = -0.35;
    return { wall, win, verga, cracks, red, green, guy, aboveMortar };
  },
  camera(t, O, Kit) {
    const K = [
      { t: 0, pos: [3.4, 1.4, 7.8], look: [1.2, 1.1, 0], fov: 44 },
      { t: C.janela, pos: [3.2, 1.6, 7.2], look: [1.1, 1.4, 0], fov: 44 },
      { t: C.racha, pos: [0.3, 2.0, 3.6], look: [-0.2, 1.9, 0], fov: 44 },
      { t: C.diag, pos: [0.9, 1.9, 3.8], look: [0.2, 1.8, 0], fov: 46 },
      { t: C.entao, pos: [2.0, 2.0, 5.0], look: [0.3, 1.9, 0], fov: 44 },
      { t: C.viga, pos: [0.7, 2.45, 2.3], look: [0.0, 2.25, 0], fov: 44 },
      { t: C.vao, pos: [0.9, 2.35, 2.6], look: [0.0, 2.15, 0], fov: 44 },
      { t: C.essa, pos: [3.2, 1.7, 7.0], look: [1.25, 1.5, 0], fov: 44 },
      { t: C.fim + 1.2, pos: [3.4, 1.7, 7.4], look: [1.3, 1.45, 0], fov: 44 },
    ];
    return Kit.camAt(K, t);
  },
  frame(t, O, K) {
    const { wall, win, verga, cracks, red, green, guy, aboveMortar } = O;
    // 1) parede sobe fiada por fiada até "janela"
    const buildEnd = C.janela - 0.2, rowDt = buildEnd / (wall.rows + 2);
    const out = K.prog(t, C.entao, 0.35);                          // tijolos sobre o vão saem
    wall.update((b) => {
      const p = K.prog(t, b.row * rowDt, 0.35); let s = p > 0 ? 1 : 0, dy = (1 - K.easeOut(p)) * 0.6;
      if (b.tag === 'slot') s *= 1 - K.ease(out);
      if (b.tag === 'above') { if (out < 1) s *= 1 - K.ease(out); else { const bp = K.prog(t, C.vao + 0.15 + (b.row - 16) * 0.08, 0.3); s = bp > 0 ? 1 : 0; dy = (1 - K.easeOut(bp)) * 0.8; } }
      return { s, dy };
    });
    const swapping = t >= C.entao && !(t > C.vao + 0.15 + 4 * 0.08 + 0.3);
    wall.setMortarHeight(swapping ? ABOVE.y0 - 0.002 : K.clamp(t / buildEnd) * WALL.h);
    aboveMortar.visible = t >= buildEnd && (t < C.entao || t > C.vao + 0.15 + 4 * 0.08 + 0.3);
    // 2) janela entra
    const wp = K.prog(t, C.janela - 0.1, 0.5); win.visible = wp > 0; win.position.z = (1 - K.easeOut(wp)) * 1.2;
    // 3) trincas crescem em "racha", somem em "então"
    const cp = K.prog(t, C.racha - 0.1, 0.7); const gone = t >= C.entao;
    cracks.forEach((c, i) => c.set(gone ? 0 : K.clamp(cp * 1.2 - i * 0.15)));
    // setas vermelhas descendo sobre o vão entre "racha" e "então"; voltam no fim
    const redOn = (t > C.racha - 0.3 && t < C.entao) || t > C.essa;
    red.forEach((a, i) => { a.visible = redOn; a.position.y = -((t * 1.6 + i * 0.3) % 1) * 0.12; });
    green.forEach((a) => { a.visible = t > C.essa + 0.2; a.position.y = -((t * 1.6) % 1) * 0.12; });
    // 4) verga desce de cima até o encaixe
    const vp = K.prog(t, C.viga - 0.1, Math.max(0.4, C.vao - C.viga)); verga.visible = vp > 0;
    verga.position.set(0, 0.12 + (SLOT.y0 + SLOT.y1) / 2 + (1 - K.easeOut(vp)) * 2.2, 0);
    K.highlight(verga, K.glow(t, C.viga - 0.1, C.essa + 1.2));   // brilho suave, nunca piscando
    // mascote
    const pose = t < C.racha ? 'idle' : t < C.entao ? 'scared' : t < C.essa ? 'point' : 'thumb';
    guy.pose(pose, t);
  },
  overlay(t, O, OV, K) {
    OV.hook('Por que a parede *racha* em cima da janela?', K.prog(t, 0, 0.2) * (1 - K.prog(t, C.racha + 0.6, 0.25)));   // GANCHO escrito = 1ª frase (exemplo)
    OV.label([-0.6, 2.95, 0.1], 'TRINCA A 45°', K.prog(t, C.bem, 0.3) * (t < C.entao ? 1 : 0), '#e23b3b');
    OV.label([0, 3.25, 0.1], 'VIGA DE CONCRETO', K.prog(t, C.viga, 0.3) * (t < C.essa ? 1 : 0), '#2f80ed');
    OV.name('VERGA', K.prog(t, C.verga - 0.05, 0.35), 0.2);
  },
};

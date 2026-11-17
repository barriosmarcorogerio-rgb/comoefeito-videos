// Motor: monta a cena do story.js, desenha 3D + camada 2D e junta no canvas final #f.
import * as K from './kit.js';
import story from './story.js';
const W = 1080, H = 1920;
const S = K.setup(document.getElementById('c'), W, H);
const octx = document.getElementById('o').getContext('2d');
const fctx = document.getElementById('f').getContext('2d');
const OV = K.overlay(octx, S.camera, W, H);
const objs = story.build(K, S);
window.TOTAL = story.total; window.FPS = story.fps || 30;
window.renderFrame = (f) => {
  const t = f / (story.fps || 30);
  const c = story.camera(t, objs, K);
  S.camera.position.set(...c.pos); S.camera.fov = c.fov ?? 40; S.camera.updateProjectionMatrix(); S.camera.lookAt(...c.look);
  story.frame(t, objs, K, S);
  const sh = c.shadowAt || c.look; S.sun.target.position.set(sh[0], 0, sh[2]); S.sun.position.set(sh[0] + 18, 30, sh[2] + 22);
  S.renderer.render(S.scene, S.camera);
  OV.clear(); story.overlay && story.overlay(t, objs, OV, K);
  fctx.drawImage(document.getElementById('c'), 0, 0); fctx.drawImage(document.getElementById('o'), 0, 0);
};
document.fonts.load('900 40px Inter').then(() => { window.ready = true; }, () => { window.ready = true; });

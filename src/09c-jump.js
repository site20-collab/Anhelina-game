// ---------- jumping across clouds ----------
const JUMP = { plats: [], N: 40, island: { x: CX, z: CZ + 22 } };
const jump = { state: 'off', t: 0, best: 0, reached: 0, checkpoint: -1, started: false };
function generateJump() {
  world.fill(0);
  biomeMap.fill(JUMPB);
  // sea everywhere, a sandy island to start from
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    for (let y = 0; y <= KH - 6; y++) world[I(x, y, z)] = SAND;
    for (let y = KH - 5; y <= KH - 2; y++) world[I(x, y, z)] = WATER;
  }
  const { x: ix, z: iz } = JUMP.island;
  for (let dz = -7; dz <= 7; dz++) for (let dx = -7; dx <= 7; dx++) {
    const r = Math.hypot(dx, dz);
    if (r > 7) continue;
    const top = r < 5.5 ? KH : KH - 1;
    fillBox(ix + dx, KH - 5, iz + dz, ix + dx, top, iz + dz, SAND);
    if (r < 5.5) setB(ix + dx, KH, iz + dz, GRASS);
    if (r < 5 && hash(dx, dz, 61) < 0.12) setB(ix + dx, KH + 1, iz + dz, FLOWERS[Math.floor(hash(dx, dz, 62) * FLOWERS.length)]);
  }
  treeOak(ix - 4, KH, iz + 2, 4, CANDY, PINKLEAVES);
  // a spiral of cloud platforms up into the sky; every eighth one is a golden checkpoint
  JUMP.plats = [];
  let a = Math.atan2(iz - CZ, ix - CX), y = KH + 1;
  const R = 15;
  for (let i = 0; i < JUMP.N; i++) {
    const rise = i % 3 !== 2;
    a -= (rise ? 4.5 : 5) / R;
    if (rise && i > 0) y++;
    const px = Math.round(CX + Math.cos(a) * R), pz = Math.round(CZ + Math.sin(a) * R);
    const last = i === JUMP.N - 1, gold = (i + 1) % 8 === 0;
    const half = last ? 2 : 1;
    const mat = last || gold ? GOLD : (i % 5 === 4 ? WOOLS[i % 7] : CLOUD);
    fillBox(px - half, y - 1, pz - half, px + half, y - 1, pz + half, mat);
    JUMP.plats.push({ x: px + .5, z: pz + .5, y, gold: gold || last });
  }
  // a rainbow over the last platform
  const L = JUMP.plats[JUMP.N - 1], cols = [W_RED, W_ORANGE, W_YELLOW, W_GREEN, W_BLUE, W_PURPLE];
  cols.forEach((c, k) => {
    const r = 6 - k * 0.6;
    for (let t = 0; t <= 40; t++) {
      const ang = t / 40 * Math.PI;
      setB(Math.round(L.x - .5 + Math.cos(ang) * r), Math.min(SY - 1, Math.round(L.y + Math.sin(ang) * Math.min(r, SY - 1 - L.y))), Math.round(L.z - .5), c);
    }
  });
  // a golden cup in the corner of the last cloud
  const cx = Math.floor(L.x) + 2, cz = Math.floor(L.z) - 2;
  setB(cx, L.y, cz, GOLD); setB(cx, L.y + 1, cz, LANTERN);
}
function jumpStart() { return { x: JUMP.island.x, z: JUMP.island.z + 3, face: Math.PI, yaw: 0, pitch: 0.35 }; }
function enterJump() {
  jump.state = 'run'; jump.t = 0; jump.reached = 0; jump.checkpoint = -1; jump.started = false;
  bigText('Стрибай!', 1200);
  toast('Перескакуй з хмаринки на хмаринку до веселки. Золоті хмаринки запам\'ятовують, де ти', 3500);
  updateJumpHud();
}
function leaveJump() { jump.state = 'off'; }
function updateJumpHud() {
  if (dim !== D_JUMP) return;
  setGameHud([`Хмаринка ${jump.reached} / ${JUMP.N}`, `Час ${fmtTime(jump.t)}`]);
}
let jumpHudT = 0;
function updateJump(dt) {
  if (jump.state === 'off') return;
  if (jump.state === 'run' && jump.started) jump.t += dt;
  // standing on a platform?
  if (pl.onGround) {
    JUMP.plats.forEach((p, i) => {
      if (Math.abs(pl.p.x - p.x) < 2.6 && Math.abs(pl.p.z - p.z) < 2.6 && Math.abs(pl.p.y - p.y) < 0.2) {
        jump.started = true;
        if (i + 1 > jump.reached) { jump.reached = i + 1; sfx.click(); }
        if (p.gold && i > jump.checkpoint) { jump.checkpoint = i; sfx.heart(); toast('Золота хмаринка! Тепер ти почнеш звідси', 1800); burst(p.x - .5, p.y, p.z - .5, '#ffd23f', 12); }
        if (i === JUMP.N - 1 && jump.state === 'run') finishJump();
      }
    });
  }
  if (pl.p.y < KH - 1.5) {
    sfx.brk(); toast('Плюх! Ще раз', 1200);
    const p = jump.checkpoint >= 0 ? JUMP.plats[jump.checkpoint] : null;
    if (p) pl.p.set(p.x, p.y + 0.01, p.z); else { const s = jumpStart(); pl.p.set(s.x + .5, KH + 1.01, s.z + .5); }
    pl.vel.set(0, 0, 0);
  }
  jumpHudT -= dt;
  if (jumpHudT <= 0) { jumpHudT = 0.25; updateJumpHud(); }
}
function finishJump() {
  jump.state = 'done';
  if (!jump.best || jump.t < jump.best) jump.best = jump.t;
  scheduleSave();
  sfx.win(); bigText('Веселка!', 1500);
  burst(pl.p.x - .5, pl.p.y + 1, pl.p.z - .5, '#fff', 30, ['#ff4f9a', '#ffd23f', '#7cc8ff', '#7be0a0', '#b388ff']);
  const stars = jump.t < 120 ? '★★★' : jump.t < 220 ? '★★☆' : '★☆☆';
  setTimeout(() => showResult(`До веселки! ${stars}`, `Ангеліна дострибала до веселки за ${fmtTime(jump.t)}. Найкращий час: ${fmtTime(jump.best)}.`, () => restartGameWorld(D_JUMP)), 1600);
}
// a new round of a game whose world needs rebuilding (a new maze, a fresh climb)
function restartGameWorld(d) {
  if (dim !== d) return;
  leaveGame(d);
  GEN[d]();
  const a = arrivalFor(d, D_CASTLE);
  pl.p.set(a.x + .5, surfaceY(a.x, a.z) + 0.01, a.z + .5); pl.vel.set(0, 0, 0);
  pl.facing = a.face; yaw = a.yaw;
  resetChunks(); refreshChunks(pl.p.x, pl.p.z, true); buildCount(9);
  enterGame(d);
}

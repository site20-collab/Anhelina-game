// ---------- sledding down a snowy mountain ----------
const SLOPE = { z0: CZ, z1: CZ + 240, top: SY - 6, hw: 13 };
const sled = { state: 'off', g: null, rider: null, x: 0, y: 0, z: 0, vz: 0, vx: 0, h: 0, t: 0, count: 0, lastCount: 0, gifts: [], got: 0, bump: 0, best: 0, bestGifts: 0, trees: [] };
function slopeH(z) {
  const k = clamp((z - SLOPE.z0) / (SLOPE.z1 - SLOPE.z0), 0, 1);
  return SLOPE.top - (SLOPE.top - KH) * k;
}
function generateSled() {
  world.fill(0);
  biomeMap.fill(SLEDB);
  for (let z = 0; z < SZ; z++) {
    const base = slopeH(z);
    for (let x = 0; x < SX; x++) {
      const dx = Math.abs(x + .5 - CX - .5);
      const ridge = dx > SLOPE.hw ? Math.min(7, (dx - SLOPE.hw) * 0.6 + hash(x, z, 71) * 1.2) : 0;
      const top = Math.min(SY - 2, Math.floor(base + ridge));
      for (let y = 0; y <= top; y++) world[I(x, y, z)] = y === top ? SNOW : y > top - 3 ? SNOWGRASS : STONE;
    }
  }
  // ice strips speed the sled up
  for (let z = SLOPE.z0 + 30; z < SLOPE.z1 - 10; z += 37) {
    const off = Math.round((hash(z, 3, 72) - 0.5) * 12);
    const y = Math.floor(slopeH(z));
    fillBox(CX + off - 2, y, z, CX + off + 2, y, z + 2, ICE);
  }
  // pines on the slope and thick forest on the ridges
  sled.trees = [];
  for (let z = SLOPE.z0 + 18; z < SLOPE.z1 - 6; z += 7) {
    const n = 1 + Math.floor(hash(z, 1, 73) * 2);
    for (let j = 0; j < n; j++) {
      const x = Math.round(CX + (hash(z, j, 74) - 0.5) * (SLOPE.hw * 2 - 4));
      const g = Math.floor(slopeH(z));
      if (get(x, g, z) === ICE) continue;
      treePine(x, g, z, 3 + Math.floor(hash(x, z, 75) * 2));
      sled.trees.push({ x: x + .5, z: z + .5 });
    }
  }
  for (let z = 4; z < SZ - 4; z++) for (let x = 4; x < SX - 4; x++) {
    const dx = Math.abs(x - CX);
    if (dx > SLOPE.hw + 3 && dx < 90 && hash(x, z, 76) < 0.03) treePine(x, surfaceY(x, z) - 1, z, 4 + Math.floor(hash(x, z, 77) * 3));
  }
  // start hut and finish arch
  const sy = Math.floor(slopeH(SLOPE.z0 - 8));
  fillBox(CX - 3, sy + 1, SLOPE.z0 - 12, CX + 3, sy + 1, SLOPE.z0 - 12, LOG);
  [-4, 4].forEach(dx => fillBox(CX + dx, sy + 1, SLOPE.z0 - 2, CX + dx, sy + 3, SLOPE.z0 - 2, LOG));
  fillBox(CX - 4, sy + 4, SLOPE.z0 - 2, CX + 4, sy + 4, SLOPE.z0 - 2, W_RED);
  const fz = SLOPE.z1 + 6;
  [-7, 7].forEach(dx => fillBox(CX + dx, KH + 1, fz, CX + dx, KH + 6, fz, CANDY));
  for (let x = CX - 7; x <= CX + 7; x++) setB(x, KH + 7, fz, (x - CX) % 2 ? W_WHITE : W_BLACK);
  setB(CX - 7, KH + 8, fz, LANTERN); setB(CX + 7, KH + 8, fz, LANTERN);
}
function giftModel() {
  const g = new THREE.Group();
  const c = ['#ff4f9a', '#3d9bff', '#5fd36a', '#9e61ff', '#ffb347'][Math.floor(Math.random() * 5)];
  box(0.7, 0.6, 0.7, c, 0, 0.3, 0, g);
  box(0.74, 0.62, 0.14, '#ffd23f', 0, 0.3, 0, g); box(0.14, 0.62, 0.74, '#ffd23f', 0, 0.3, 0, g);
  box(0.3, 0.16, 0.12, '#ffd23f', -0.12, 0.66, 0, g).rotation.z = 0.5; box(0.3, 0.16, 0.12, '#ffd23f', 0.12, 0.66, 0, g).rotation.z = -0.5;
  return g;
}
function buildSled() {
  const g = new THREE.Group();
  box(1.0, 0.12, 1.9, '#c0392b', 0, 0.32, 0, g);
  box(1.0, 0.36, 0.12, '#c0392b', 0, 0.48, -0.9, g);
  [-0.42, 0.42].forEach(x => {
    box(0.08, 0.08, 2.1, '#d9d9e0', x, 0.06, 0, g);
    box(0.08, 0.3, 0.08, '#d9d9e0', x, 0.18, 0.6, g); box(0.08, 0.3, 0.08, '#d9d9e0', x, 0.18, -0.6, g);
    box(0.08, 0.26, 0.08, '#d9d9e0', x, 0.18, 1.08, g).rotation.x = 0.7;
  });
  const { body, legs, arms } = buildAvatar(outfit, D_SLED);
  body.position.set(0, -0.12, -0.25);
  legs.forEach(l => { l.rotation.x = -1.45; });
  arms.forEach(a => { a.rotation.x = -0.9; });
  g.add(body);
  scene.add(g);
  return { g, body };
}
function enterSled() {
  leaveSled();
  const s = buildSled();
  sled.g = s.g; sled.rider = s.body;
  girl.visible = false; shadow.visible = false;
  Object.assign(sled, { state: 'count', x: CX + .5, z: SLOPE.z0 - 4, vz: 0, vx: 0, h: 0, t: 0, count: 3.6, lastCount: 4, got: 0, bump: 0 });
  sled.y = Math.floor(slopeH(sled.z)) + 1;
  sled.gifts = [];
  for (let z = SLOPE.z0 + 12; z < SLOPE.z1 - 4; z += 9) {
    const x = CX + .5 + (Math.random() - 0.5) * (SLOPE.hw * 2 - 5);
    if (sled.trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.5)) continue;
    const m = giftModel();
    m.position.set(x, Math.floor(slopeH(z)) + 1, z + .5);
    scene.add(m);
    sled.gifts.push({ m, x, z: z + .5, got: false });
  }
  placeSled();
  updateSledHud();
}
function leaveSled() {
  if (sled.g) scene.remove(sled.g);
  sled.gifts.forEach(g => scene.remove(g.m));
  sled.g = null; sled.gifts = []; sled.state = 'off';
}
function updateSledHud() {
  if (dim !== D_SLED) return;
  setGameHud([`Подарунків ${sled.got} / ${sled.gifts.length}`, `Час ${fmtTime(sled.t)}`, `${Math.round(sled.vz * 3.6)} км/год`]);
}
function placeSled() {
  sled.g.position.set(sled.x, sled.y, sled.z);
  sled.g.rotation.y = sled.h;
  sled.g.rotation.z = -sled.vx * 0.03;
  pl.p.set(sled.x, sled.y, sled.z); pl.facing = sled.h; pl.vel.set(0, 0, 0);
}
function updateSled(dt, t) {
  if (sled.state === 'off' || !sled.g) return;
  if (sled.state === 'count') {
    sled.count -= dt;
    const n = Math.ceil(sled.count - 0.6);
    if (n !== sled.lastCount && n >= 1 && n <= 3) { sled.lastCount = n; bigText(String(n), 700); sfx.tick(); }
    if (sled.count <= 0.6) { sled.state = 'run'; bigText('Поїхали!', 900); sfx.go(); }
    placeSled();
    return;
  }
  const steer = playing ? clamp((keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, -1, 1) : 0;
  const push = playing && (keys.KeyW || keys.ArrowUp || joy.y > 0.3) ? 1 : 0;
  const brake = playing && (keys.KeyS || keys.ArrowDown || joy.y < -0.3) ? 1 : 0;
  const onSlope = sled.z > SLOPE.z0 && sled.z < SLOPE.z1;
  if (sled.state === 'run') {
    sled.t += dt;
    const onIce = get(Math.floor(sled.x), Math.floor(sled.y) - 1, Math.floor(sled.z)) === ICE;
    if (onIce && sled.bump <= 0) { if (sled.vz < 20) sfx.boost(); sled.vz = Math.max(sled.vz, 22); }
    const max = onIce ? 24 : 17;
    sled.vz += ((onSlope ? 7 : sled.z < SLOPE.z0 ? 3 : -6) + push * 3 - brake * 10) * dt;
    if (sled.vz > max) sled.vz = Math.max(max, sled.vz - 15 * dt);
    sled.vz = Math.max(sled.vz, sled.z < SLOPE.z0 ? 1.5 : 0.5);
  } else sled.vz = Math.max(0, sled.vz - 12 * dt);
  sled.vx += (steer * 9 - sled.vx) * Math.min(1, dt * 6);
  sled.bump = Math.max(0, sled.bump - dt);
  sled.x = clamp(sled.x + sled.vx * dt, CX + .5 - SLOPE.hw + 0.8, CX + .5 + SLOPE.hw - 0.8);
  sled.z += sled.vz * dt;
  const gy = Math.floor(slopeH(sled.z)) + 1;
  sled.y += (gy - sled.y) * Math.min(1, dt * 12);
  sled.h = Math.atan2(sled.vx, Math.max(1, sled.vz)) * 0.8;
  sled.trees.forEach(tr => {
    const dx = sled.x - tr.x, dz = sled.z - tr.z;
    if (Math.abs(dz) < 0.9 && Math.abs(dx) < 1.0 && sled.bump <= 0) {
      sled.bump = 0.8; sled.vz *= 0.3; sled.x += (dx >= 0 ? 1 : -1) * 0.7;
      sfx.hurt(); toast('Ой, ялинка! Об\'їжджай', 1200);
      burst(tr.x - .5, sled.y, tr.z - .5, '#ffffff', 10);
    }
  });
  sled.gifts.forEach(gf => {
    if (gf.got) return;
    gf.m.rotation.y += dt * 2;
    if (Math.hypot(sled.x - gf.x, sled.z - gf.z) < 1.4) {
      gf.got = true; scene.remove(gf.m); sled.got++; sfx.heart();
      burst(gf.x - .5, gf.m.position.y, gf.z - .5, '#ffd23f', 10, ['#ff4f9a', '#ffd23f', '#7cc8ff']);
    }
  });
  if (sled.state === 'run' && sled.z > SLOPE.z1 + 6) finishSled();
  if (sled.state === 'done' && sled.vz <= 0.01) sled.vz = 0;
  if (sled.vz > 8 && Math.random() < dt * 30) sparkle(sled.x + (Math.random() - .5), sled.y + 0.1, sled.z - 1);
  placeSled();
  if (sled.rider) sled.rider.rotation.z = Math.sin(t * 6) * 0.03 * Math.min(1, sled.vz / 10);
  updateSledHud();
}
function finishSled() {
  sled.state = 'done';
  const total = sled.gifts.length, newBest = !sled.best || sled.t < sled.best;
  if (newBest) sled.best = sled.t;
  sled.bestGifts = Math.max(sled.bestGifts, sled.got);
  scheduleSave();
  sfx.win(); bigText('Фініш!', 1400);
  const k = sled.got / Math.max(1, total);
  const stars = k >= 0.8 ? '★★★' : k >= 0.5 ? '★★☆' : '★☆☆';
  setTimeout(() => showResult(`Санчата ${stars}`, `Ангеліна з'їхала з гори за ${fmtTime(sled.t)} і зібрала ${sled.got} з ${total} подарунків.${newBest ? ' Найшвидший спуск!' : ` Найкращий час: ${fmtTime(sled.best)}.`}`, () => enterSled()), 1600);
}
const sledLook = new THREE.Vector3(), sledCam = new THREE.Vector3();
function sledCamera(dt) {
  if (!sled.g) return;
  if (view === 'fp') {
    sled.rider.visible = false;
    camera.position.set(sled.x, sled.y + 1.5, sled.z - 0.1);
    sledLook.set(sled.x + Math.sin(sled.h) * 10, sled.y - 0.4, sled.z + 10);
    camera.lookAt(sledLook);
    return;
  }
  sled.rider.visible = true;
  sledCam.set(sled.x, sled.y + 3.6, sled.z - 6.5);
  if (camera.position.distanceTo(sledCam) > 20) camera.position.copy(sledCam);
  camera.position.lerp(sledCam, Math.min(1, dt * 6));
  sledLook.set(sled.x, sled.y + 0.6, sled.z + 4);
  camera.lookAt(sledLook);
}

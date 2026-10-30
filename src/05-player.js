// ---------- entity physics ----------
const GRAV = 26;
function collides(e, px, py, pz) {
  const x0 = Math.floor(px - e.hw), x1 = Math.floor(px + e.hw), z0 = Math.floor(pz - e.hw), z1 = Math.floor(pz + e.hw);
  const y0 = Math.floor(py), y1 = Math.floor(py + e.h);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (solidAt(x, y, z)) return true;
  return false;
}
function moveAxis(e, a, amt) {
  if (amt === 0) return;
  const steps = Math.max(1, Math.ceil(Math.abs(amt) / 0.3)), s = amt / steps, p = e.p;
  for (let i = 0; i < steps; i++) {
    p[a] += s;
    if (!collides(e, p.x, p.y, p.z)) continue;
    if (a === 'y') {
      if (s < 0) { p.y = Math.floor(p.y) + 1; e.onGround = true; } else p.y = Math.floor(p.y + e.h) - e.h - 0.001;
      e.vel.y = 0;
    } else {
      p[a] = s > 0 ? Math.floor(p[a] + e.hw) - e.hw - 0.001 : Math.floor(p[a] - e.hw) + 1 + e.hw + 0.001;
      e.blocked = true;
      if (e.accel) e.vel[a] = 0;
    }
    return;
  }
}
function stepEntity(e, mx, mz, speed, dt, jump) {
  if (collides(e, e.p.x, e.p.y, e.p.z)) {
    for (let i = 0; i < SY && collides(e, e.p.x, e.p.y, e.p.z); i++) e.p.y = Math.floor(e.p.y) + 1;
    e.vel.y = 0;
  }
  const inW = get(Math.floor(e.p.x), Math.floor(e.p.y + e.h * 0.4), Math.floor(e.p.z)) === WATER;
  const sp = inW ? speed * 0.6 : speed;
  if (e.accel) {
    const k = Math.min(1, dt * (e.onGround || inW ? e.accel : e.accel * 0.45));
    e.vel.x += (mx * sp - e.vel.x) * k; e.vel.z += (mz * sp - e.vel.z) * k;
  } else { e.vel.x = mx * sp; e.vel.z = mz * sp; }
  const wasG = e.onGround;
  e.coyote = wasG ? 0.12 : Math.max(0, (e.coyote || 0) - dt);
  let jumped = false;
  if (inW) {
    e.vel.y -= 6 * dt;
    if (jump || e.float) e.vel.y = Math.min(e.vel.y + 24 * dt, 3);
    e.vel.y = Math.max(e.vel.y, -3);
  } else {
    if (jump && (wasG || e.coyote > 0) && e.vel.y <= 0.5) { e.vel.y = e.jumpV; e.coyote = 0; jumped = true; }
    e.vel.y = Math.max(-30, e.vel.y - GRAV * dt);
  }
  e.onGround = false; e.blocked = false;
  moveAxis(e, 'x', e.vel.x * dt);
  moveAxis(e, 'z', e.vel.z * dt);
  moveAxis(e, 'y', e.vel.y * dt);
  if (e.blocked && (wasG || inW) && Math.hypot(mx, mz) > 0.1 && !collides(e, e.p.x + mx * 0.35, e.p.y + 1.05, e.p.z + mz * 0.35)) e.vel.y = e.jumpV;
  return { inW, jumped };
}

// ---------- player ----------
const SPEED = 4.6;
const pl = { p: new THREE.Vector3(), vel: new THREE.Vector3(), hw: 0.28, h: 1.7, onGround: false, blocked: false, jumpV: 8.6, float: false, facing: 0, accel: 16, coyote: 0 };
let walk = 0, jumpBuf = 0, blinkT = 2.5, aimFaceT = 0, aimFacing = 0, hurtT = 0;
function spawn() { pl.p.set(CX + 0.5, surfaceY(CX, CZ) + 0.01, CZ + 0.5); pl.vel.set(0, 0, 0); }
function overlapsPlayer(x, y, z) {
  const p = pl.p;
  return x < p.x + pl.hw && x + 1 > p.x - pl.hw && z < p.z + pl.hw && z + 1 > p.z - pl.hw && y < p.y + pl.h && y + 1 > p.y;
}
function readMove() {
  let ix = 0, iz = 0;
  if (playing) {
    ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    iz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + joy.y;
  }
  const il = Math.hypot(ix, iz);
  if (il > 1) { ix /= il; iz /= il; }
  return { ix, iz, sprint: playing && (keys.ShiftLeft || keys.ShiftRight || Math.hypot(joy.x, joy.y) > 0.92) };
}
function updatePlayer(dt, now) {
  const { ix, iz, sprint } = readMove();
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
  jumpBuf = Math.max(0, jumpBuf - dt);
  const res = stepEntity(pl, mx, mz, SPEED * (sprint ? 1.5 : 1), dt, playing && (jumpBuf > 0 || wantJump));
  if (res.jumped) { jumpBuf = 0; sfx.jump(); }
  if (pl.p.y < -10) { respawnHere(); toast('Ой! Повертаємось'); }
  const moving = Math.hypot(mx, mz) > 0.1;
  aimFaceT = Math.max(0, aimFaceT - dt);
  if (view === 'fp' && !wardrobeOpen) pl.facing = yaw + Math.PI;
  else if (aimFaceT > 0) pl.facing += wrapAngle(aimFacing - pl.facing) * Math.min(1, dt * 20);
  else if (moving) pl.facing += wrapAngle(Math.atan2(mx, mz) - pl.facing) * Math.min(1, dt * 12);
  if (moving) walk += dt * (sprint ? 14 : 10) * Math.min(1, Math.hypot(mx, mz)); else walk *= 0.8;
  const sw = Math.sin(walk) * (moving ? 0.7 : 0);
  legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
  const swim = res.inW && !pl.onGround;
  const armed = dim === D_ARENA;
  arms[0].rotation.x = swim ? -2.6 + Math.sin(now / 150) * 0.4 : -sw * 0.8;
  arms[1].rotation.x = armed ? -1.45 : swim ? -2.6 - Math.sin(now / 150) * 0.4 : sw * 0.8;
  arms[0].rotation.z = pl.onGround || swim ? 0 : -0.5; arms[1].rotation.z = pl.onGround || swim || armed ? 0 : 0.5;
  girl.position.copy(pl.p);
  girl.position.y += moving && pl.onGround ? Math.abs(Math.sin(walk)) * 0.05 : 0;
  girl.rotation.y = pl.facing;
  girl.visible = view !== 'fp' || wardrobeOpen;
  blinkT -= dt;
  eyes.forEach(e => { e.scale.y = blinkT < 0.12 ? 0.15 : 1; });
  if (blinkT < 0) blinkT = 2 + Math.random() * 3;
  let gy = Math.floor(pl.p.y);
  const sx = Math.floor(pl.p.x), sz = Math.floor(pl.p.z);
  while (gy > 0 && !opaqueAt(sx, gy - 1, sz) && get(sx, gy - 1, sz) !== WATER) gy--;
  shadow.visible = girl.visible;
  shadow.position.set(pl.p.x, gy + 0.02, pl.p.z);
  shadow.scale.setScalar(Math.max(0.3, 1 - (pl.p.y - gy) * 0.15));
}
function respawnHere() {
  if (dim === D_MAIN) spawn();
  else { const a = arrivalFor(dim); pl.p.set(a.x + .5, surfaceY(a.x, a.z) + 0.01, a.z + .5); pl.vel.set(0, 0, 0); }
}
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
shadow.rotation.x = -Math.PI / 2;
scene.add(shadow);

// ---------- camera: behind Angelina or through her eyes ----------
let yaw = 0.7, pitch = 0.38, dist = 6.5, camDist = 6.5, view = 'tp';
const target = new THREE.Vector3(), tmpDir = new THREE.Vector3(), lookAt = new THREE.Vector3();
let underwater = false, viewOffset = '';
function rayVoxel(o, d, maxD, test) {
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
  const tdx = d.x ? Math.abs(1 / d.x) : Infinity, tdy = d.y ? Math.abs(1 / d.y) : Infinity, tdz = d.z ? Math.abs(1 / d.z) : Infinity;
  let tmx = d.x > 0 ? (x + 1 - o.x) * tdx : d.x < 0 ? (o.x - x) * tdx : Infinity;
  let tmy = d.y > 0 ? (y + 1 - o.y) * tdy : d.y < 0 ? (o.y - y) * tdy : Infinity;
  let tmz = d.z > 0 ? (z + 1 - o.z) * tdz : d.z < 0 ? (o.z - z) * tdz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  while (t <= maxD) {
    if (inB(x, y, z) && test(world[I(x, y, z)])) return { x, y, z, nx, ny, nz, t };
    if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
    else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
    else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
  }
  return null;
}
const pickable = b => b !== 0 && b !== WATER;
function pitchLimits() { return view === 'fp' && !wardrobeOpen ? [-1.5, 1.5] : [-0.35, 1.35]; }
function setViewOffset() {
  const W = innerWidth, H = innerHeight;
  const want = wardrobeOpen ? (W <= 640 ? 'b' : 'r') : '';
  if (want === viewOffset) return;
  viewOffset = want;
  if (want === 'b') camera.setViewOffset(W, H, 0, H * 0.2, W, H);
  else if (want === 'r') camera.setViewOffset(W, H, 190, 0, W, H);
  else camera.clearViewOffset();
}
function updateCamera(dt) {
  setViewOffset();
  tmpDir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  if (view === 'fp' && !wardrobeOpen) {
    camera.position.set(pl.p.x, pl.p.y + 1.52, pl.p.z);
    lookAt.copy(camera.position).sub(tmpDir);
    camera.lookAt(lookAt);
    camDist = 0;
  } else {
    target.set(pl.p.x, pl.p.y + (wardrobeOpen ? 1.05 : 1.35), pl.p.z);
    const hit = rayVoxel(target, tmpDir, dist, isOpaque);
    const want = hit ? Math.max(0.5, hit.t - 0.3) : dist;
    camDist = want < camDist ? want : camDist + (want - camDist) * Math.min(1, dt * 6);
    camera.position.copy(target).addScaledVector(tmpDir, camDist);
    camera.lookAt(target);
  }
  underwater = get(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)) === WATER;
}
function setView(v) {
  view = v;
  const [lo, hi] = pitchLimits();
  pitch = clamp(v === 'fp' ? pitch - 0.38 : pitch + 0.38, lo, hi);
  if (v === 'tp' && document.pointerLockElement) document.exitPointerLock();
  document.getElementById('cross').hidden = !(v === 'fp' || dim === D_ARENA);
  fpGun.visible = v === 'fp' && dim === D_ARENA;
  scheduleSave();
}

// ---------- targeting ----------
const REACH = 7;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function aim(cx, cy) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
}
function pickBlock() {
  const hit = rayVoxel(raycaster.ray.origin, raycaster.ray.direction, camDist + REACH, pickable);
  if (!hit) return null;
  return Math.hypot(hit.x + .5 - pl.p.x, hit.y + .5 - (pl.p.y + 1), hit.z + .5 - pl.p.z) <= REACH ? hit : null;
}
function pickMob(maxT) {
  const h = raycaster.intersectObjects(mobGroups.filter(g => g.visible), true)[0];
  if (!h || h.distance > maxT) return null;
  const m = mobs[h.object.userData.mobId];
  return m && m.dim === dim && m.e.p.distanceTo(pl.p) <= REACH + 1 ? m : null;
}
let building = false, selected = 0;
function setBlock(x, y, z, b) {
  world[I(x, y, z)] = b;
  if (dim <= D_CASTLE) { editsByDim[dim][I(x, y, z)] = b; scheduleSave(); }
  rebuildAround(x, z);
}
function tapAt(cx, cy, place) {
  aim(cx, cy);
  const hit = pickBlock();
  if (dim <= D_CASTLE) { const m = pickMob(hit ? hit.t : camDist + REACH); if (m) { pet(m); return; } }
  if (!hit) return;
  if (dim === D_ART) { artTap(hit, place); return; }
  if (dim > D_CASTLE) return;
  if (place) {
    const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
    if (!inB(x, y, z)) return;
    const cur = world[I(x, y, z)];
    if (cur && cur !== WATER && !isPlant(cur)) return;
    const nb = hotbar[selected];
    if (isOpaque(nb) && overlapsPlayer(x, y, z)) { toast('Тут стоїть Ангеліна'); return; }
    setBlock(x, y, z, nb);
    sfx.place();
  } else {
    if (hit.y === 0) { toast('Це дно світу, його не зламати'); return; }
    const b = world[I(hit.x, hit.y, hit.z)];
    setBlock(hit.x, hit.y, hit.z, 0);
    burst(hit.x, hit.y, hit.z, BLOCKS[b].c, isPlant(b) ? 5 : 10);
    sfx.brk();
    if (b === GOLD) toast('Золото!');
  }
}

const hl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
  new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
hl.visible = false;
scene.add(hl);

// ---------- candy monster arena ----------
const arena = { hp: 5, wave: 0, score: 0, best: 0, monsters: [], candies: [], drops: [], queue: [], spawnT: 0, state: 'off', pause: 0, cool: 0, firing: false, fireX: 0, fireY: 0, fireCenter: false,
  lead: true, remote: new Map(), midSeq: 0, snapT: 0 };
const WAVES = [
  { gummy: 5 },
  { gummy: 6, lollipop: 3 },
  { gummy: 5, lollipop: 3, cupcake: 4 },
  { gummy: 6, cupcake: 4, marshmallow: 4 },
  { queen: 1, gummy: 6 },
];
const GUMMY_COLORS = ['#7be0a0', '#ff6b8b', '#7cc8ff', '#ffd23f', '#b388ff', '#ff9f40'];
function cuteFace(g, y, z, scale = 1) {
  [-1, 1].forEach(s => {
    box(0.16 * scale, 0.2 * scale, 0.03, '#ffffff', s * 0.15 * scale, y, z, g);
    box(0.09 * scale, 0.12 * scale, 0.03, '#2b2140', s * 0.15 * scale, y - 0.02 * scale, z + 0.01, g);
    box(0.04 * scale, 0.04 * scale, 0.03, '#ffffff', s * 0.15 * scale + 0.025 * scale, y + 0.03 * scale, z + 0.02, g);
    box(0.08 * scale, 0.05 * scale, 0.02, '#ff9db4', s * 0.27 * scale, y - 0.12 * scale, z, g);
  });
  box(0.16 * scale, 0.04 * scale, 0.03, '#2b2140', 0, y - 0.16 * scale, z, g);
  box(0.04 * scale, 0.04 * scale, 0.03, '#2b2140', -0.09 * scale, y - 0.13 * scale, z, g);
  box(0.04 * scale, 0.04 * scale, 0.03, '#2b2140', 0.09 * scale, y - 0.13 * scale, z, g);
}
const MONSTERS = {
  gummy: { hp: 2, speed: 2.4, hw: 0.4, h: 0.8, pts: 10, hop: true, build(g, k) {
    const c = GUMMY_COLORS[k % GUMMY_COLORS.length];
    box(0.8, 0.8, 0.8, c, 0, 0.4, 0, g, MJ(c));
    cuteFace(g, 0.5, 0.41);
  } },
  lollipop: { hp: 2, speed: 3.3, hw: 0.35, h: 1.3, pts: 15, build(g, k) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 20), M(['#ff6b8b', '#b388ff', '#7cc8ff'][k % 3]));
    disc.rotation.x = Math.PI / 2; disc.position.set(0, 0.95, 0); g.add(disc);
    for (let i = 0; i < 3; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12 + i * 0.13, 0.03, 6, 24), M('#ffffff')); ring.position.set(0, 0.95, 0.1); g.add(ring); }
    box(0.08, 0.5, 0.08, '#ffffff', 0, 0.4, 0, g);
    cuteFace(g, 1.0, 0.12, 0.8);
    box(0.14, 0.08, 0.2, '#ff9fd2', -0.12, 0.05, 0.03, g); box(0.14, 0.08, 0.2, '#ff9fd2', 0.12, 0.05, 0.03, g);
  } },
  cupcake: { hp: 3, speed: 1.9, hw: 0.4, h: 1.0, pts: 20, hop: true, build(g) {
    box(0.66, 0.42, 0.66, '#ff9fd2', 0, 0.21, 0, g);
    for (let i = -2; i <= 2; i++) box(0.04, 0.42, 0.68, '#ff7ab8', i * 0.13, 0.21, 0, g);
    box(0.8, 0.26, 0.8, '#fff6fb', 0, 0.55, 0, g);
    box(0.56, 0.18, 0.56, '#fff6fb', 0, 0.76, 0, g);
    box(0.16, 0.16, 0.16, '#e8333a', 0, 0.93, 0, g);
    ['#ffd23f', '#7cc8ff', '#7be0a0'].forEach((c, i) => box(0.05, 0.05, 0.05, c, -0.25 + i * 0.25, 0.69, 0.41, g));
    cuteFace(g, 0.27, 0.34, 0.8);
  } },
  marshmallow: { hp: 4, speed: 1.5, hw: 0.38, h: 1.0, pts: 25, build(g) {
    box(0.72, 0.95, 0.72, '#fffaf6', 0, 0.48, 0, g);
    box(0.74, 0.06, 0.74, '#ffd6e8', 0, 0.75, 0, g);
    cuteFace(g, 0.6, 0.37);
  } },
  queen: { hp: 26, speed: 1.7, hw: 0.9, h: 1.9, pts: 100, hop: true, build(g) {
    box(1.8, 1.8, 1.8, '#b388ff', 0, 0.9, 0, g, MJ('#b388ff'));
    cuteFace(g, 1.1, 0.91, 2.1);
    box(1.0, 0.18, 1.0, '#f4c23f', 0, 1.88, 0, g);
    [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4], [0, 0.45]].forEach(([x, z]) => box(0.16, 0.24, 0.16, '#f4c23f', x, 2.08, z, g));
    box(0.18, 0.18, 0.06, '#ff4f9a', 0, 1.9, 0.52, g);
  } },
};
function enterArena() {
  arena.hp = 5; arena.wave = 0; arena.score = 0; arena.state = 'pause'; arena.pause = 1.2; arena.queue = [];
  clearArena();
  updateArenaHud();
  bigText('Цукеркова битва!', 1300);
}
function clearArena() {
  arena.monsters.forEach(m => scene.remove(m.g)); arena.monsters = [];
  arena.remote.forEach(r => scene.remove(r.g)); arena.remote.clear();
  arena.candies.forEach(c => scene.remove(c.mesh)); arena.candies = [];
  arena.drops.forEach(d => scene.remove(d.mesh)); arena.drops = [];
}
function leaveArena() { clearArena(); arena.state = 'off'; arena.firing = false; }
function startWave() {
  arena.wave++;
  const w = WAVES[arena.wave - 1];
  arena.queue = [];
  Object.entries(w).forEach(([t, n]) => { for (let i = 0; i < n; i++) arena.queue.push(t); });
  arena.queue.sort(() => Math.random() - .5);
  if (w.queen) { arena.queue = arena.queue.filter(t => t !== 'queen'); arena.queue.unshift('queen'); }
  arena.spawnT = 0.5; arena.state = 'fight';
  bigText(arena.wave === WAVES.length ? 'Королева Желейка!' : `Хвиля ${arena.wave}`, 1400);
  updateArenaHud();
}
function spawnMonster(type) {
  const def = MONSTERS[type], g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  def.build(body, arena.monsters.length + arena.wave * 3);
  const a = Math.random() * Math.PI * 2, r = 27;
  const m = { mid: `${net.myId}:${++arena.midSeq}`, type, def, g, body, hp: def.hp, flash: 0, hopT: Math.random(), facing: 0,
    e: { p: new THREE.Vector3(CX + .5 + Math.cos(a) * r, KH + 1.01, CZ + .5 + Math.sin(a) * r), vel: new THREE.Vector3(), hw: def.hw, h: def.h, onGround: false, blocked: false, jumpV: 5.5, float: true } };
  scene.add(g);
  burst(m.e.p.x - .5, m.e.p.y, m.e.p.z - .5, '#fff', 10, ['#ffffff', '#ff9fd2', '#c9a8ff']);
  arena.monsters.push(m);
}
const candyGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const CANDY_COLORS = ['#ff4f9a', '#ffd23f', '#7cc8ff', '#7be0a0', '#b388ff'];
function fireCandy(tx, ty, tz) {
  if (arena.cool > 0 || arena.state === 'over' || arena.state === 'won') return;
  arena.cool = 0.17;
  const f = pl.facing;
  const from = new THREE.Vector3(pl.p.x + Math.sin(f) * 0.5 + Math.cos(f) * 0.33, pl.p.y + 1.05, pl.p.z + Math.cos(f) * 0.5 - Math.sin(f) * 0.33);
  if (view === 'fp') from.set(pl.p.x, pl.p.y + 1.35, pl.p.z);
  const dir = new THREE.Vector3(tx - from.x, ty - from.y, tz - from.z).normalize();
  aimFacing = Math.atan2(dir.x, dir.z); aimFaceT = 0.5;
  const mesh = new THREE.Mesh(candyGeo, M(CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)]));
  mesh.position.copy(from);
  scene.add(mesh);
  arena.candies.push({ mesh, v: dir.multiplyScalar(30), life: 1.6 });
  sfx.shoot();
}
const _ray = new THREE.Vector3();
function aimPoint(cx, cy) {
  aim(cx, cy);
  const o = raycaster.ray.origin, d = raycaster.ray.direction;
  let best = 60;
  arena.monsters.forEach(m => {
    const c = _ray.set(m.e.p.x, m.e.p.y + m.def.h / 2, m.e.p.z).sub(o), t = c.dot(d);
    if (t < 0) return;
    const r = Math.max(m.def.hw, m.def.h / 2) + 0.25;
    if (c.lengthSq() - t * t < r * r && t < best) best = t;
  });
  const hit = rayVoxel(o, d, best, isOpaque);
  if (hit && hit.t < best) best = hit.t + 0.3;
  return [o.x + d.x * best, o.y + d.y * best, o.z + d.z * best];
}
function fireAtScreen(cx, cy) { const [x, y, z] = aimPoint(cx, cy); fireCandy(x, y, z); }
function hurtPlayer(from) {
  if (hurtT > 0 || arena.state !== 'fight' || arena.hp <= 0) return;
  hurtT = 1.2;
  arena.hp--;
  sfx.hurt();
  const hurtEl = document.getElementById('hurt');
  hurtEl.classList.add('on'); setTimeout(() => hurtEl.classList.remove('on'), 60);
  const dx = pl.p.x - from.x, dz = pl.p.z - from.z, d = Math.hypot(dx, dz) || 1;
  pl.vel.x += dx / d * 9; pl.vel.z += dz / d * 9; pl.vel.y = 6;
  updateArenaHud();
  if (arena.hp <= 0 && arenaCoop()) {
    toast('Ой! Зараз повернешся', 1600);
    setTimeout(() => { if (dim !== D_ARENA) return; arena.hp = 5; const a = GAME_START[D_ARENA]; pl.p.set(a.x + .5, KH + 1.01, a.z + .5); updateArenaHud(); }, 1800);
  } else if (arena.hp <= 0) {
    arena.state = 'over';
    setTimeout(() => showResult('Ой! Монстрики виграли', `Ангеліна дійшла до хвилі ${arena.wave} і набрала ${arena.score} очок. Спробуєш ще?`, () => enterArena()), 900);
  }
}
// with friends in the arena one player runs the monsters and the others see the same ones
function arenaPeers() { return [...net.players.values()].filter(P => P.d === D_ARENA); }
function arenaCoop() { return net.role !== 'off' && arenaPeers().length > 0; }
function arenaLeader() { const ids = arenaPeers().map(P => P.id).concat(net.myId).sort(); return ids[0] === net.myId; }
function updateArena(dt) {
  if (arena.state === 'off') return;
  const coop = arenaCoop(), lead = !coop || arenaLeader();
  if (lead !== arena.lead) {
    arena.lead = lead;
    if (lead) {
      arena.remote.forEach(r => scene.remove(r.g)); arena.remote.clear();
      if (arena.state !== 'won') { arena.wave = Math.max(0, arena.wave - 1); arena.state = 'pause'; arena.pause = 1.5; arena.queue = []; }
    } else { arena.monsters.forEach(m => scene.remove(m.g)); arena.monsters = []; arena.queue = []; }
  }
  arena.cool = Math.max(0, arena.cool - dt);
  hurtT = Math.max(0, hurtT - dt);
  if (arena.firing && playing) {
    if (arena.fireCenter) fireAtScreen(innerWidth / 2, innerHeight / 2);
    else fireAtScreen(arena.fireX, arena.fireY);
  }
  if (lead && arena.state === 'pause') { arena.pause -= dt; if (arena.pause <= 0) startWave(); }
  if (lead && arena.state === 'fight') {
    arena.spawnT -= dt;
    if (arena.queue.length && arena.spawnT <= 0 && arena.monsters.length < 9) { spawnMonster(arena.queue.shift()); arena.spawnT = 0.9; }
    if (!arena.queue.length && !arena.monsters.length) {
      if (arena.wave >= WAVES.length) {
        arena.state = 'won';
        if (coop) netSend({ t: 'arenaWin', sc: arena.score });
        arena.best = Math.max(arena.best, arena.score); scheduleSave();
        sfx.win(); bigText('Перемога!', 1500);
        setTimeout(() => showResult('Перемога! Королівство врятоване', `Ангеліна перемогла всіх цукеркових монстриків і набрала ${arena.score} очок. Рекорд: ${arena.best}.`, () => enterArena()), 1600);
      } else { arena.state = 'pause'; arena.pause = 2.2; toast('Хвилю пройдено!', 1500); }
    }
  }
  const t = performance.now() / 1000;
  const goals = [pl.p].concat(coop ? arenaPeers().map(P => ({ x: P.x, y: P.y, z: P.z })) : []);
  arena.monsters.forEach(m => {
    const e = m.e;
    let goal = goals[0], gd = Infinity;
    goals.forEach(q => { const dd = Math.hypot(q.x - e.p.x, q.z - e.p.z); if (dd < gd) { gd = dd; goal = q; } });
    const dx = goal.x - e.p.x, dz = goal.z - e.p.z, d = Math.hypot(dx, dz) || 1;
    const pd = Math.hypot(pl.p.x - e.p.x, pl.p.z - e.p.z);
    const go = arena.state === 'fight' ? 1 : 0;
    m.hopT -= dt;
    const hop = m.def.hop && m.hopT <= 0 && e.onGround;
    if (hop) m.hopT = 0.6 + Math.random() * 0.4;
    stepEntity(e, dx / d * go, dz / d * go, m.def.speed, dt, hop);
    m.facing += wrapAngle(Math.atan2(dx, dz) - m.facing) * Math.min(1, dt * 6);
    m.g.position.copy(e.p); m.g.rotation.y = m.facing;
    m.flash = Math.max(0, m.flash - dt);
    const squash = e.onGround ? 1 - Math.abs(Math.sin(t * 8 + m.hopT)) * 0.08 : 1.08;
    const pop = 1 + m.flash * 1.5;
    m.body.scale.set(pop / Math.sqrt(squash), squash * pop, pop / Math.sqrt(squash));
    if (pd < m.def.hw + 0.45 && Math.abs(e.p.y - pl.p.y) < 1.5) { hurtPlayer(e.p); e.vel.x -= dx / d * 6; e.vel.z -= dz / d * 6; }
  });
  if (!lead) updateRemoteMonsters(dt, t);
  for (let i = arena.candies.length - 1; i >= 0; i--) {
    const c = arena.candies[i];
    c.life -= dt; c.v.y -= 5 * dt;
    c.mesh.position.addScaledVector(c.v, dt);
    c.mesh.rotation.x += dt * 12; c.mesh.rotation.y += dt * 9;
    const p = c.mesh.position;
    let hitM = null;
    for (const m of lead ? arena.monsters : arena.remote.values()) {
      const mp = m.e ? m.e.p : m.p, r = Math.max(m.def.hw, m.def.h / 2) + 0.18;
      if (Math.hypot(p.x - mp.x, p.y - (mp.y + m.def.h / 2), p.z - mp.z) < r) { hitM = m; break; }
    }
    if (hitM) {
      hitM.flash = 0.12;
      sfx.hit();
      if (lead) { hitM.hp--; if (hitM.hp <= 0) popMonster(hitM); }
      else netSend({ t: 'hit', mid: hitM.mid });
    }
    if (hitM || c.life <= 0 || solidAt(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) {
      if (!hitM && c.life > 0) burst(p.x - .5, p.y - .5, p.z - .5, '#fff', 3, CANDY_COLORS);
      scene.remove(c.mesh); arena.candies.splice(i, 1);
    }
  }
  for (let i = arena.drops.length - 1; i >= 0; i--) {
    const dr = arena.drops[i];
    dr.mesh.rotation.y += dt * 3;
    dr.mesh.position.y = dr.y + Math.sin(t * 3) * 0.12;
    if (Math.hypot(dr.mesh.position.x - pl.p.x, dr.mesh.position.z - pl.p.z) < 1 && Math.abs(dr.y - pl.p.y) < 2) {
      arena.hp = Math.min(5, arena.hp + 1); sfx.heart(); updateArenaHud();
      scene.remove(dr.mesh); arena.drops.splice(i, 1);
    }
  }
  if (lead && coop) {
    arena.snapT -= dt;
    if (arena.snapT <= 0) {
      arena.snapT = 0.1;
      const r2 = v => Math.round(v * 100) / 100;
      netSend({ t: 'mon', w: arena.wave, s: arena.state, sc: arena.score,
        m: arena.monsters.map(m => [m.mid, m.type, r2(m.e.p.x), r2(m.e.p.y), r2(m.e.p.z), r2(m.facing), m.flash > 0 ? 1 : 0]) });
    }
  }
}
function applyMonSnap(s) {
  if (dim !== D_ARENA || arena.lead || arena.state === 'off' || !Array.isArray(s.m)) return;
  arena.wave = clamp(s.w | 0, 0, WAVES.length); arena.score = s.sc | 0;
  if (arena.state !== 'won' && ['pause', 'fight'].includes(s.s)) arena.state = s.s;
  const seen = new Set();
  s.m.slice(0, 20).forEach(([mid, type, x, y, z, f, fl]) => {
    if (!Object.prototype.hasOwnProperty.call(MONSTERS, type) || ![x, y, z, f].every(Number.isFinite)) return;
    mid = String(mid).slice(0, 24);
    seen.add(mid);
    let r = arena.remote.get(mid);
    if (!r) {
      const g = new THREE.Group(), body = new THREE.Group();
      g.add(body); MONSTERS[type].build(body, arena.remote.size + arena.wave * 3);
      scene.add(g);
      r = { mid, type, def: MONSTERS[type], g, body, p: new THREE.Vector3(x, y, z), tx: x, ty: y, tz: z, f, tf: f, flash: 0 };
      arena.remote.set(mid, r);
    }
    r.tx = x; r.ty = y; r.tz = z; r.tf = f;
    if (fl) r.flash = 0.12;
  });
  arena.remote.forEach((r, mid) => {
    if (seen.has(mid)) return;
    if (r.p.distanceTo(pl.p) < 60) { sfx.poof(); burst(r.p.x - .5, r.p.y + r.def.h / 2 - .5, r.p.z - .5, '#fff', 14, ['#ff4f9a', '#ffd23f', '#7cc8ff', '#7be0a0', '#b388ff', '#ffffff']); }
    scene.remove(r.g); arena.remote.delete(mid);
  });
  updateArenaHud();
}
function updateRemoteMonsters(dt, t) {
  const k = Math.min(1, dt * 12);
  arena.remote.forEach(r => {
    r.p.x += (r.tx - r.p.x) * k; r.p.y += (r.ty - r.p.y) * k; r.p.z += (r.tz - r.p.z) * k;
    r.f += wrapAngle(r.tf - r.f) * k;
    r.g.position.copy(r.p); r.g.rotation.y = r.f;
    r.flash = Math.max(0, r.flash - dt);
    const squash = 1 - Math.abs(Math.sin(t * 8 + r.tx)) * 0.08, pop = 1 + r.flash * 1.5;
    r.body.scale.set(pop / Math.sqrt(squash), squash * pop, pop / Math.sqrt(squash));
    if (Math.hypot(pl.p.x - r.p.x, pl.p.z - r.p.z) < r.def.hw + 0.45 && Math.abs(r.p.y - pl.p.y) < 1.5) hurtPlayer(r.p);
  });
}
function applyHit(mid) {
  if (dim !== D_ARENA || !arena.lead) return;
  const m = arena.monsters.find(x => x.mid === mid);
  if (!m) return;
  m.hp--; m.flash = 0.12;
  if (m.hp <= 0) popMonster(m);
}
function popMonster(m) {
  const p = m.e.p;
  arena.score += m.def.pts;
  sfx.poof();
  burst(p.x - .5, p.y + m.def.h / 2 - .5, p.z - .5, '#fff', m.type === 'queen' ? 40 : 16, ['#ff4f9a', '#ffd23f', '#7cc8ff', '#7be0a0', '#b388ff', '#ffffff']);
  scene.remove(m.g);
  arena.monsters.splice(arena.monsters.indexOf(m), 1);
  if (Math.random() < 0.14 && arena.hp < 5) {
    const mesh = new THREE.Mesh(heartGeo, heartMat);
    mesh.position.set(p.x, p.y + 0.6, p.z); mesh.scale.setScalar(0.7);
    scene.add(mesh);
    arena.drops.push({ mesh, y: p.y + 0.6 });
  }
  updateArenaHud();
}
function updateArenaHud() {
  if (dim !== D_ARENA) return;
  setGameHud([{ text: '♥'.repeat(Math.max(0, arena.hp)) + '♡'.repeat(5 - Math.max(0, arena.hp)), cls: 'hp' }, `Хвиля ${Math.max(1, arena.wave)} / ${WAVES.length}`, `Очки ${arena.score}`]);
}

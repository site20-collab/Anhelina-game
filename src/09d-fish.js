// ---------- fishing from a little pier ----------
const FISH_TYPES = [
  { name: 'Золота рибка', c: '#ffb703', w: 1 },
  { name: 'Рожевий карасик', c: '#ff6fae', w: 1 },
  { name: 'Смугастий окунь', c: '#7cbf3a', w: 1, stripe: '#2f6f33' },
  { name: 'Блакитна плітка', c: '#7cc8ff', w: 1 },
  { name: 'Сонячна рибка', c: '#ffd23f', w: 0.8, stripe: '#ff8a1f' },
  { name: 'Сомик-вусик', c: '#8a7a6a', w: 0.6 },
  { name: 'Веселкова форель', c: '#b388ff', w: 0.45, stripe: '#7be0a0' },
  { name: 'Зіркова рибка', c: '#ffffff', w: 0.22, stripe: '#ffd23f' },
];
const POND = { r: 15 };
const fishKindsEver = new Set();
const fishing = { state: 'off', t: 0, wait: 0, caught: 0, kinds: new Set(), bobber: null, line: null, flying: null, best: 0, total: 0 };
function generateFish() {
  flatGround(GRASS, FISHB);
  for (let dz = -POND.r - 3; dz <= POND.r + 3; dz++) for (let dx = -POND.r - 3; dx <= POND.r + 3; dx++) {
    const d = Math.hypot(dx, dz), x = CX + dx, z = CZ + dz;
    if (d <= POND.r) for (let y = KH - 3; y <= KH; y++) setB(x, y, z, WATER);
    else if (d <= POND.r + 1.5) setB(x, KH, z, SAND);
    else if (d <= POND.r + 2.6 && hash(x, z, 41) < 0.35) setB(x, KH + 1, z, TALLGRASS);
  }
  // the pier reaches from the south shore to the middle of the pond
  fillBox(CX - 1, KH, CZ + 2, CX + 1, KH, CZ + POND.r + 3, PLANKS);
  fillBox(CX - 2, KH, CZ + 1, CX + 2, KH, CZ + 4, PLANKS);
  [[-2, 1], [2, 1], [-2, 9], [2, 9]].forEach(([dx, dz]) => { setB(CX + dx, KH + 1, CZ + dz, LOG); setB(CX + dx, KH + 2, CZ + dz, LANTERN); });
  smallHouse(CX + 6, CZ + POND.r + 6, CX + 12, CZ + POND.r + 11, PLANKS, 4, BRICK);
  fillBox(CX + 6, KH + 1, CZ + POND.r + 8, CX + 6, KH + 2, CZ + POND.r + 8, 0);
  for (let z = 4; z < SZ - 4; z++) for (let x = 4; x < SX - 4; x++) {
    const d = Math.hypot(x - CX, z - CZ), h = hash(x, z, 93);
    if (d > POND.r + 7 && d < 100 && h < 0.015) treeOak(x, KH, z, 4 + Math.floor(hash(x, z, 8) * 2), LOG, h < 0.006 ? PINKLEAVES : LEAVES);
    else if (d > POND.r + 3 && h < 0.09 && !get(x, KH + 1, z)) setB(x, KH + 1, z, FLOWERS[Math.floor(hash(x, z, 5) * FLOWERS.length)]);
  }
}
function pierEnd() { return fishing.state !== 'off' && Math.hypot(pl.p.x - CX - .5, pl.p.z - CZ - .5) < POND.r + 2.5; }
function fishStart() { return { x: CX, z: CZ + 3, face: Math.PI, yaw: 0, pitch: 0.35 }; }
function fishModel(type, s = 1) {
  const g = new THREE.Group();
  box(0.5 * s, 0.24 * s, 0.16 * s, type.c, 0, 0, 0, g);
  box(0.16 * s, 0.24 * s, 0.05 * s, type.c, -0.32 * s, 0, 0, g);
  if (type.stripe) { box(0.06 * s, 0.25 * s, 0.17 * s, type.stripe, 0.05 * s, 0, 0, g); box(0.06 * s, 0.25 * s, 0.17 * s, type.stripe, -0.1 * s, 0, 0, g); }
  box(0.05 * s, 0.05 * s, 0.17 * s, '#1a1a1a', 0.17 * s, 0.04 * s, 0, g);
  return g;
}
function enterFish() {
  fishing.state = 'idle'; fishing.caught = 0; fishing.kinds = new Set(); fishing.t = 0;
  const bob = new THREE.Group();
  box(0.18, 0.12, 0.18, '#e8333a', 0, 0.06, 0, bob); box(0.18, 0.1, 0.18, '#ffffff', 0, -0.05, 0, bob); box(0.03, 0.18, 0.03, '#2b2140', 0, 0.2, 0, bob);
  bob.visible = false; scene.add(bob);
  fishing.bobber = bob;
  fishing.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff }));
  fishing.line.visible = false; fishing.line.frustumCulled = false;
  scene.add(fishing.line);
  toast('Підійди до краю містка й закинь вудку', 2500);
  updateFishHud();
}
function leaveFish() {
  [fishing.bobber, fishing.line, fishing.flying && fishing.flying.g].forEach(o => { if (o) scene.remove(o); });
  fishing.bobber = fishing.line = fishing.flying = null; fishing.state = 'off';
}
function updateFishHud() {
  if (dim !== D_FISH) return;
  setGameHud([`Рибок ${fishing.caught}`, `Колекція ${fishing.kinds.size} / ${FISH_TYPES.length}`]);
}
function fishLabel() { return fishing.state === 'bite' ? 'Тягни!' : fishing.state === 'cast' ? 'Чекай на клювання…' : 'Закинути вудку'; }
function rodTip() {
  const f = pl.facing;
  return new THREE.Vector3(pl.p.x + Math.sin(f) * 1.1 + Math.cos(f) * 0.33, pl.p.y + 2.1, pl.p.z + Math.cos(f) * 1.1 - Math.sin(f) * 0.33);
}
function fishAction() {
  if (fishing.state === 'idle') {
    const f = pl.facing, tx = pl.p.x + Math.sin(f) * 6, tz = pl.p.z + Math.cos(f) * 6;
    if (get(Math.floor(tx), KH, Math.floor(tz)) !== WATER) { toast('Повернися до води й закинь ще раз', 1500); return; }
    fishing.bobber.position.set(tx, KH + 0.95, tz); fishing.bobber.visible = true;
    fishing.state = 'cast'; fishing.wait = 2 + Math.random() * 4; fishing.t = 0;
    sfx.jump();
  } else if (fishing.state === 'cast') {
    toast('Ще рано, рибка не клюнула', 1300);
    fishing.state = 'idle'; fishing.bobber.visible = false;
  } else if (fishing.state === 'bite') catchFish();
  actKind = ''; actT = 0;
}
function pickFishType() {
  const sum = FISH_TYPES.reduce((a, t) => a + t.w, 0);
  let r = Math.random() * sum;
  for (const t of FISH_TYPES) { r -= t.w; if (r <= 0) return t; }
  return FISH_TYPES[0];
}
function catchFish() {
  const type = pickFishType(), isNew = !fishing.kinds.has(type.name);
  fishing.kinds.add(type.name); fishing.caught++; fishing.total++;
  if (!fishKindsEver.has(type.name)) { fishKindsEver.add(type.name); scheduleSave(); }
  const g = fishModel(type, 1.6);
  g.position.copy(fishing.bobber.position);
  scene.add(g);
  fishing.flying = { g, t: 0, from: fishing.bobber.position.clone() };
  fishing.bobber.visible = false; fishing.state = 'idle';
  burst(g.position.x - .5, KH, g.position.z - .5, '#9ad8ff', 10);
  sfx.heart();
  toast(isNew ? `Нова рибка: ${type.name}!` : `Спіймала: ${type.name}`, 2200);
  updateFishHud();
  if (isNew && fishing.kinds.size === FISH_TYPES.length) {
    fishing.best = Math.max(fishing.best, fishing.total); scheduleSave();
    setTimeout(() => { sfx.win(); showResult('Уся колекція рибок! ★★★', `Ангеліна спіймала всі ${FISH_TYPES.length} види рибок за ${fishing.caught} закидань. Можна рибалити далі!`, () => enterFishAgain()); }, 1500);
  }
}
function enterFishAgain() { leaveFish(); enterFish(); }
function updateFishing(dt, t) {
  if (fishing.state === 'off') return;
  const b = fishing.bobber;
  if (fishing.state === 'cast') {
    fishing.t += dt;
    b.position.y = KH + 0.95 + Math.sin(t * 3) * 0.03;
    if (fishing.t > fishing.wait) { fishing.state = 'bite'; fishing.t = 0; sfx.tick(); bigText('Клює!', 700); }
  } else if (fishing.state === 'bite') {
    fishing.t += dt;
    b.position.y = KH + 0.8 + Math.sin(t * 25) * 0.12;
    if (fishing.t > 2.2) { fishing.state = 'idle'; b.visible = false; toast('Рибка втекла. Спробуй ще!', 1500); }
  }
  fishing.line.visible = b.visible;
  if (b.visible) {
    const tip = rodTip(), pos = fishing.line.geometry.attributes.position;
    pos.setXYZ(0, tip.x, tip.y, tip.z); pos.setXYZ(1, b.position.x, b.position.y + 0.25, b.position.z); pos.needsUpdate = true;
  }
  if (fishing.flying) {
    const F = fishing.flying;
    F.t += dt;
    const k = Math.min(1, F.t / 0.8), tip = rodTip();
    F.g.position.lerpVectors(F.from, tip, k); F.g.position.y += Math.sin(k * Math.PI) * 2.5;
    F.g.rotation.z = Math.sin(t * 20) * 0.5;
    if (F.t > 1.6) { scene.remove(F.g); fishing.flying = null; }
  }
}

// ---------- biomes ----------
const MEADOW = 0, FOREST = 1, DESERT = 2, SNOWY = 3, CANDYLAND = 4, LAKE = 5, KINGDOM = 6, RACEB = 7, ARTB = 8, ARENAB = 9, HIDEB = 10, JUMPB = 11;
const BIOME_NAMES = ['Луки', 'Ліс', 'Пустеля', 'Сніжні гори', 'Цукеркова країна', 'Озеро', 'Королівство Ангеліни', 'Гоночна траса', 'Майстерня картин', 'Цукеркова арена', 'Лабіринт хованок', 'Хмаринки'];
const BIOME_SKY = [0x9fd8ff, 0x93d0f5, 0xbfe6ff, 0xd8ecff, 0xffc9ec, 0x9fd8ff, 0xf1d9ff, 0xa8e0ff, 0xffe6f3, 0xffcfe9, 0xa6e3c8, 0xbfe2ff];
function biomeAt(x, z) {
  if (Math.hypot(x - CX, z - CZ) < 18) return MEADOW;
  const candy = vnoise(x, z, 70, 30), temp = vnoise(x, z, 76, 10), moist = vnoise(x, z, 58, 20);
  if (candy > 0.76) return CANDYLAND;
  if (temp < 0.18) return SNOWY;
  if (temp > 0.55 && moist < 0.55) return DESERT;
  if (moist > 0.55) return FOREST;
  return MEADOW;
}
function rawHeight(x, z) {
  const temp = vnoise(x, z, 76, 10);
  const h = 8.5 + vnoise(x, z, 40, 1) * 12 + vnoise(x, z, 12, 2) * 4;
  return h + clamp((0.24 - temp) / 0.12, 0, 1) * (4 + vnoise(x, z, 18, 3) * 18);
}
// the spawn plateau sits at the height of the land around it, so Angelina never starts in a pit
let spawnH = 18;
function computeSpawnH() {
  let s = 0;
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; s += rawHeight(CX + Math.cos(a) * 22, CZ + Math.sin(a) * 22); }
  spawnH = clamp(Math.round(s / 24), SEA + 3, 28);
}
function heightAt(x, z) {
  let h = rawHeight(x, z);
  const dc = Math.hypot(x - CX, z - CZ);
  if (dc < 28) { const k = Math.max(0, (dc - 19) / 9); h = h * k + spawnH * (1 - k); }
  h = villageHeight(x, z, h);
  return Math.min(SY - 10, Math.floor(h));
}
function topY(x, z) {
  for (let y = SY - 1; y >= 0; y--) if (get(x, y, z)) return y + 1;
  return 0;
}
function surfaceY(x, z) {
  for (let y = SY - 1; y >= 0; y--) if (opaqueAt(x, y, z)) return y + 1;
  return 0;
}
const setB = (x, y, z, b) => { if (inB(x, y, z)) world[I(x, y, z)] = b; };
const setIfFree = (x, y, z, b) => { if (inB(x, y, z)) { const c = world[I(x, y, z)]; if (!c || isPlant(c)) world[I(x, y, z)] = b; } };
function fillBox(x0, y0, z0, x1, y1, z1, b) {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) setB(x, y, z, b);
}
function treeOak(x, g, z, th, log, leaves) {
  for (let i = 1; i <= th; i++) setB(x, g + i, z, log);
  for (let dy = -2; dy <= 1; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const rad = dy < 0 ? 2 : 1;
    if (Math.abs(dx) > rad || Math.abs(dz) > rad) continue;
    if (Math.abs(dx) === rad && Math.abs(dz) === rad && hash(x + dx, z + dz + dy * 7, 9) < 0.5) continue;
    setIfFree(x + dx, g + th + dy, z + dz, leaves);
  }
}
function treePine(x, g, z, th) {
  for (let i = 1; i <= th; i++) setB(x, g + i, z, LOG);
  const radii = [2, 1, 2, 1, 1, 0];
  for (let j = 0; j < radii.length; j++) {
    const y = g + th - 3 + j, r = radii[j];
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
      setIfFree(x + dx, y, z + dz, PINE);
    }
  }
  setIfFree(x, g + th + 3, z, PINE);
}
function flowerFor(bi, x, z) {
  const list = bi === FOREST ? [LAVENDER, DAISY, CORNFLOWER, RED] : bi === CANDYLAND ? [TULIP, RED, DAISY, LAVENDER, TULIP] : bi === DESERT ? [MARIGOLD, SUNFLOWER] : FLOWERS;
  return list[Math.floor(hash(x, z, 3) * list.length)];
}
function flatGround(top, biome) {
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    biomeMap[x + z * SX] = biome;
    for (let y = 0; y <= KH; y++) world[I(x, y, z)] = y === KH ? top : y >= KH - 3 ? DIRT : STONE;
  }
}

// ---------- big world ----------
function generateMain() {
  clearFurniture(D_MAIN);
  world.fill(0);
  computeSpawnH();
  computeVillageHeights();
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    const h = heightAt(x, z), bi = biomeAt(x, z);
    biomeMap[x + z * SX] = h < SEA ? LAKE : bi;
    const beach = h <= SEA + 1 && bi !== SNOWY;
    for (let y = 0; y <= h; y++) {
      let t;
      if (y === h) {
        if (bi === DESERT || beach || h < SEA) t = SAND;
        else if (bi === SNOWY) t = h >= 30 ? SNOW : SNOWGRASS;
        else if (bi === CANDYLAND) t = PINKGRASS;
        else t = GRASS;
      } else if (y >= h - 3) {
        t = (bi === DESERT || beach) ? SAND : (bi === SNOWY && h >= 30) ? STONE : DIRT;
      } else t = y > 0 && hash(x + y * 31, z, 5) < 0.03 ? GOLD : STONE;
      world[I(x, y, z)] = t;
    }
    for (let y = h + 1; y <= SEA; y++) world[I(x, y, z)] = (bi === SNOWY && y === SEA) ? ICE : WATER;
  }
  for (let z = 3; z < SZ - 3; z++) for (let x = 3; x < SX - 3; x++) {
    const g = topY(x, z) - 1, top = get(x, g, z), bi = biomeMap[x + z * SX], r = hash(x, z, 7);
    if (get(x, g + 1, z)) continue;
    const nearSpawn = Math.hypot(x - CX, z - CZ) < 20 || nearVillage(x, z, 4);
    const crowded = () => get(x - 1, g + 1, z) || get(x + 1, g + 1, z) || get(x, g + 1, z - 1) || get(x, g + 1, z + 1);
    const th = 4 + Math.floor(hash(x, z, 8) * 2);
    if (top === GRASS) {
      const treeChance = bi === FOREST ? 0.07 : 0.008, flowerChance = bi === FOREST ? 0.04 : 0.09;
      if (r < treeChance && !nearSpawn && !crowded()) treeOak(x, g, z, th, LOG, LEAVES);
      else if (r < treeChance + flowerChance) world[I(x, g + 1, z)] = flowerFor(bi, x, z);
      else if (r < treeChance + flowerChance + 0.12) world[I(x, g + 1, z)] = TALLGRASS;
    } else if (top === SAND && bi === DESERT) {
      if (r < 0.012) { const ch = 1 + Math.floor(hash(x, z, 4) * 3); for (let i = 1; i <= ch; i++) world[I(x, g + i, z)] = CACTUS; }
      else if (r < 0.016) world[I(x, g + 1, z)] = flowerFor(DESERT, x, z);
    } else if (top === SNOWGRASS) {
      if (r < 0.03 && !crowded()) treePine(x, g, z, 5 + Math.floor(hash(x, z, 8) * 3));
    } else if (top === PINKGRASS) {
      if (r < 0.025 && !crowded()) treeOak(x, g, z, th, CANDY, PINKLEAVES);
      else if (r < 0.12) world[I(x, g + 1, z)] = flowerFor(CANDYLAND, x, z);
    }
  }
  buildHouse();
  buildVillages();
}

// ---------- hearts: many, easy to find, only 5 needed ----------
const HEART_TOTAL = 20, HEART_NEED = 5;
let hearts = [];
const collected = new Set();
function placeHearts() {
  hearts.forEach(h => scene.remove(h.mesh));
  hearts = [];
  let k = 0;
  while (hearts.length < HEART_TOTAL && k < 40000) {
    k++;
    const near = hearts.length < 6;
    let x, z;
    if (near) {
      const a = hash(k, 1, 12) * Math.PI * 2, r = 14 + hash(k, 2, 12) * 46;
      x = Math.floor(CX + Math.cos(a) * r); z = Math.floor(CZ + Math.sin(a) * r);
    } else { x = 6 + Math.floor(hash(k, 3, 11) * (SX - 12)); z = 6 + Math.floor(hash(k, 5, 13) * (SZ - 12)); }
    if (Math.hypot(x - CX, z - CZ) < 10 || nearVillage(x, z, 2)) continue;
    if (hearts.some(h => Math.abs(h.x - x) + Math.abs(h.z - z) < (near ? 14 : 40))) continue;
    let g = topY(x, z), ok = true;
    while (g > 0) {
      const b = get(x, g - 1, z);
      if (b === LOG || b === PINE || b === CANDY || b === WATER || b === ICE || b === CACTUS) { ok = false; break; }
      if (!b || b === LEAVES || b === PINKLEAVES || isPlant(b)) { g--; continue; }
      break;
    }
    // Angelina must fit under whatever hangs above the heart
    if (!ok || opaqueAt(x, g, z) || opaqueAt(x, g + 1, z) || opaqueAt(x, g + 2, z)) continue;
    if (![GRASS, SAND, SNOWGRASS, PINKGRASS, SNOW, DIRT, STONE].includes(get(x, g - 1, z))) continue;
    const mesh = new THREE.Mesh(heartGeo, heartMat);
    mesh.position.set(x + 0.5, g + 1, z + 0.5);
    mesh.scale.setScalar(0.9);
    hearts.push({ id: hearts.length, x, z, y: g + 1, mesh, phase: hearts.length * 0.7 });
    scene.add(mesh);
  }
}

// ---------- princess kingdom ----------
function cone(cx, cz, y0, r0, layers) {
  for (let j = 0; j < layers; j++) {
    const r = r0 * (1 - j / layers) + 0.4, c = Math.ceil(r);
    for (let dz = -c; dz <= c; dz++) for (let dx = -c; dx <= c; dx++) if (dx * dx + dz * dz <= r * r) setB(cx + dx, y0 + j, cz + dz, ROOF);
  }
  setB(cx, y0 + layers, cz, GOLD);
}
function tower(cx, cz, r, bottom, top, roofLayers) {
  for (let y = bottom; y <= top; y++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++)
    if (dx * dx + dz * dz <= r * r + 0.5) setB(cx + dx, y, cz + dz, CASTLE);
  [[0, r], [0, -r], [r, 0], [-r, 0]].forEach(([dx, dz]) => fillBox(cx + dx, top - 4, cz + dz, cx + dx, top - 3, cz + dz, ICE));
  cone(cx, cz, top + 1, r + 1, roofLayers);
}
function generateCastle() {
  clearFurniture(D_CASTLE);
  world.fill(0);
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    const dc = Math.hypot(x - CX, z - CZ);
    let h = Math.floor(KH - 1 + vnoise(x, z, 24, 61) * 7 + vnoise(x, z, 8, 62) * 2);
    if (dc < 78) h = KH; else if (dc < 92) { const k = (dc - 78) / 14; h = Math.round(KH * (1 - k) + h * k); }
    biomeMap[x + z * SX] = KINGDOM;
    for (let y = 0; y <= h; y++) world[I(x, y, z)] = y === h ? GRASS : y >= h - 3 ? DIRT : STONE;
    if (dc >= 37 && dc < 41.5) for (let y = KH - 3; y <= KH; y++) world[I(x, y, z)] = WATER;
  }
  fillBox(CX - 2, KH, CZ + 36, CX + 2, KH, CZ + 43, PLANKS);
  [-3, 3].forEach(dx => [CZ + 37, CZ + 42].forEach(z => { setB(CX + dx, KH, z, PLANKS); setB(CX + dx, KH + 1, z, LOG); setB(CX + dx, KH + 2, z, LANTERN); }));
  // outer wall with battlements, a wide gate and towers
  const W = 26;
  for (let i = -W; i <= W; i++) {
    [[CX + i, CZ - W], [CX + i, CZ + W], [CX - W, CZ + i], [CX + W, CZ + i]].forEach(([x, z]) => {
      fillBox(x, KH + 1, z, x, KH + 9, z, CASTLE);
      if (i % 2 === 0) setB(x, KH + 10, z, CASTLE);
    });
  }
  fillBox(CX - 2, KH + 1, CZ + W, CX + 2, KH + 6, CZ + W, 0);
  fillBox(CX - 3, KH + 7, CZ + W, CX + 3, KH + 7, CZ + W, CANDY);
  [[-W, -W], [W, -W], [-W, W], [W, W]].forEach(([dx, dz]) => tower(CX + dx, CZ + dz, 4, KH + 1, KH + 16, 7));
  [[-5, W], [5, W]].forEach(([dx, dz]) => tower(CX + dx, CZ + dz, 2, KH + 1, KH + 14, 5));
  [[0, -W], [-W, 0], [W, 0]].forEach(([dx, dz]) => tower(CX + dx, CZ + dz, 3, KH + 1, KH + 13, 6));
  // courtyard: path, fountain, flower beds and lanterns
  fillBox(CX - 1, KH, CZ + 7, CX + 1, KH, CZ + W, CASTLE);
  fillBox(CX - 22, KH, CZ + 18, CX + 22, KH, CZ + 19, CASTLE);
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const r = Math.hypot(dx, dz), x = CX + dx, z = CZ + 14 + dz;
    if (r <= 4.4 && r > 3.4) { setB(x, KH, z, CASTLE); setB(x, KH + 1, z, CASTLE); }
    else if (r <= 3.4) setB(x, KH, z, WATER);
  }
  fillBox(CX, KH + 1, CZ + 14, CX, KH + 2, CZ + 14, CASTLE);
  setB(CX, KH + 3, CZ + 14, WATER);
  fillBox(CX - 1, KH, CZ + 7, CX + 1, KH, CZ + 9, CASTLE);
  [[-18, 10], [18, 10], [-18, 22], [18, 22]].forEach(([dx, dz]) => {
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      const x = CX + dx + a, z = CZ + dz + b;
      if (Math.abs(a) === 2 || Math.abs(b) === 2) setB(x, KH + 1, z, LEAVES);
      else setB(x, KH + 1, z, FLOWERS[(a + b + 8 + dx) % FLOWERS.length]);
    }
  });
  [[-6, 9], [6, 9], [-6, 21], [6, 21], [-12, 18], [12, 18]].forEach(([dx, dz]) => { fillBox(CX + dx, KH + 1, CZ + dz, CX + dx, KH + 2, CZ + dz, LOG); setB(CX + dx, KH + 3, CZ + dz, LANTERN); });
  // the palace: a great hall, a bedroom and a dining room
  const kx0 = CX - 14, kx1 = CX + 14, kz0 = CZ - 18, kz1 = CZ + 6, kt = KH + 12;
  fillBox(kx0, KH + 1, kz0, kx1, kt, kz1, CASTLE);
  fillBox(kx0 + 1, KH + 1, kz0 + 1, kx1 - 1, kt, kz1 - 1, 0);
  fillBox(kx0 + 1, KH, kz0 + 1, kx1 - 1, KH, kz1 - 1, PLANKS);
  fillBox(kx0, kt + 1, kz0, kx1, kt + 1, kz1, CASTLE);
  for (let j = 0; kx0 + j <= kx1 - j && kz0 + j <= kz1 - j; j++) fillBox(kx0 + j, kt + 2 + j, kz0 + j, kx1 - j, kt + 2 + j, kz1 - j, ROOF);
  tower(CX, CZ - 6, 3, kt + 2, KH + 24, 5);
  [[kx0, kz0], [kx1, kz0], [kx0, kz1], [kx1, kz1]].forEach(([x, z]) => tower(x, z, 2, KH + 1, KH + 18, 5));
  fillBox(CX - 2, KH + 1, kz1, CX + 2, KH + 6, kz1, 0);
  for (let x = kx0 + 2; x <= kx1 - 2; x += 3) {
    if (Math.abs(x - CX) > 3) fillBox(x, KH + 4, kz1, x, KH + 7, kz1, ICE);
    fillBox(x, KH + 4, kz0, x, KH + 7, kz0, ICE);
  }
  for (let z = kz0 + 2; z <= kz1 - 2; z += 3) { fillBox(kx0, KH + 4, z, kx0, KH + 7, z, ICE); fillBox(kx1, KH + 4, z, kx1, KH + 7, z, ICE); }
  // side rooms
  [kx0 + 8, kx1 - 8].forEach(x => { fillBox(x, KH + 1, kz0 + 1, x, KH + 7, kz1 - 1, CASTLE); fillBox(x, KH + 1, CZ - 7, x, KH + 4, CZ - 5, 0); });
  for (let z = kz0 + 3; z <= kz1 - 3; z += 5) { setB(CX - 5, KH + 1, z, CANDY); fillBox(CX - 5, KH + 1, z, CX - 5, kt, z, CANDY); fillBox(CX + 5, KH + 1, z, CX + 5, kt, z, CANDY); }
  fillBox(CX - 1, KH, kz0 + 2, CX + 1, KH, kz1 - 1, CARPET);
  setB(CX, KH + 1, kz0 + 2, GOLD);
  fillBox(CX - 1, KH + 1, kz0 + 1, CX + 1, KH + 1, kz0 + 1, GOLD);
  fillBox(CX, KH + 2, kz0 + 1, CX, KH + 5, kz0 + 1, GOLD);
  setB(CX, KH + 6, kz0 + 1, MAGIC);
  [[CX, CZ - 12], [CX, CZ - 2], [CX - 11, CZ - 6], [CX + 11, CZ - 6]].forEach(([x, z]) => setB(x, kt, z, LANTERN));
  // princess bedroom (west) and dining room (east)
  addGenFurniture(D_CASTLE, kx0 + 3, KH + 1, kz0 + 3, 'bed', 0); addGenFurniture(D_CASTLE, kx0 + 5, KH + 1, kz0 + 3, 'bed', 0);
  addGenFurniture(D_CASTLE, kx0 + 2, KH + 1, kz1 - 3, 'wardrobe', 1); addGenFurniture(D_CASTLE, kx0 + 6, KH + 1, kz1 - 2, 'lamp', 0);
  addGenFurniture(D_CASTLE, kx0 + 4, KH + 1, CZ - 6, 'toybox', 1); addGenFurniture(D_CASTLE, kx0 + 2, KH + 1, CZ - 10, 'shelf', 1);
  // the cinema corner of the east room: sofas facing the big TV on the north wall
  for (let x = kx1 - 6; x <= kx1 - 2; x += 2) addGenFurniture(D_CASTLE, x, KH + 1, CZ - 13, 'sofa', 2);
  for (let z = CZ - 9; z <= CZ; z += 3) { addGenFurniture(D_CASTLE, kx1 - 4, KH + 1, z, 'table', 0); addGenFurniture(D_CASTLE, kx1 - 5, KH + 1, z, 'chair', 1); addGenFurniture(D_CASTLE, kx1 - 3, KH + 1, z, 'chair', 3); }
  addGenFurniture(D_CASTLE, kx1 - 2, KH + 1, kz0 + 2, 'pot', 0); addGenFurniture(D_CASTLE, kx1 - 2, KH + 1, kz1 - 2, 'pot', 0);
  // path from the bridge to the row of game portals
  fillBox(CX - 1, KH, CZ + 42, CX + 1, KH, CZ + 70, CASTLE);
  fillBox(CX - 32, KH, CZ + 57, CX + 32, KH, CZ + 58, CASTLE);
  [-28, -14, 14, 28].forEach(dx => fillBox(CX + dx - 1, KH, CZ + 58, CX + dx + 1, KH, CZ + 64, CASTLE));
  for (let z = 2; z < SZ - 2; z++) for (let x = 2; x < SX - 2; x++) {
    const g = topY(x, z) - 1;
    if (get(x, g, z) !== GRASS || get(x, g + 1, z)) continue;
    const dc = Math.hypot(x - CX, z - CZ), r = hash(x, z, 71);
    const roomy = !get(x - 1, g + 1, z) && !get(x + 1, g + 1, z) && !get(x, g + 1, z - 1) && !get(x, g + 1, z + 1);
    if (dc > 82 && r < 0.03 && roomy) treeOak(x, g, z, 4 + Math.floor(hash(x, z, 8) * 2), CANDY, PINKLEAVES);
    else if (dc > 82 && r < 0.04 && roomy) treeOak(x, g, z, 4 + Math.floor(hash(x, z, 8) * 2), LOG, LEAVES);
    else if (r < 0.15) world[I(x, g + 1, z)] = FLOWERS[Math.floor(hash(x, z, 5) * FLOWERS.length)];
    else if (r < 0.2) world[I(x, g + 1, z)] = TALLGRASS;
  }
}

// ---------- race track ----------
const TRACK = { pts: [], N: 720, L: 0, HW: 5, boosts: [], tunnel: [0, 0] };
function buildTrack() {
  const T = TRACK;
  T.pts = [];
  for (let i = 0; i < T.N; i++) {
    const t = i / T.N * Math.PI * 2;
    const r = 74 + 20 * Math.sin(2 * t) + 10 * Math.cos(3 * t + 0.5);
    T.pts.push({ x: CX + Math.cos(t) * r, z: CZ + Math.sin(t) * r * 0.82, s: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
  }
  let s = 0;
  T.pts.forEach((p, i) => {
    const q = T.pts[(i + 1) % T.N], o = T.pts[(i + T.N - 1) % T.N];
    p.s = s; s += Math.hypot(q.x - p.x, q.z - p.z);
    let tx = q.x - o.x, tz = q.z - o.z; const l = Math.hypot(tx, tz); tx /= l; tz /= l;
    p.tx = tx; p.tz = tz;
    let nx = -tz, nz = tx;
    if (nx * (p.x - CX) + nz * (p.z - CZ) < 0) { nx = -nx; nz = -nz; }
    p.nx = nx; p.nz = nz;
  });
  T.L = s;
  T.boosts = [0.2, 0.45, 0.78].map(f => f * s);
  T.tunnel = [0.56 * s, 0.56 * s + 26];
}
function trackNearest(x, z, hint) {
  const T = TRACK, N = T.N;
  let best = 1e18, bi = 0;
  if (hint >= 0) {
    for (let k = -40; k <= 40; k++) { const i = (hint + k + N) % N, p = T.pts[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } }
  } else {
    for (let i = 0; i < N; i += 3) { const p = T.pts[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } }
    for (let k = -3; k <= 3; k++) { const i = (bi + k + N) % N, p = T.pts[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } }
  }
  return { i: bi, d: Math.sqrt(best) };
}
function generateRace() {
  flatGround(GRASS, RACEB);
  if (!TRACK.pts.length) buildTrack();
  const T = TRACK, HW = T.HW;
  const inRange = (s, a, b) => s >= a && s <= b;
  for (let z = 40; z < SZ - 40; z++) for (let x = 40; x < SX - 40; x++) {
    const n = trackNearest(x + .5, z + .5, -1), p = T.pts[n.i], d = n.d;
    const outward = (x + .5 - p.x) * p.nx + (z + .5 - p.z) * p.nz > 0;
    const top = I(x, KH, z);
    const nearStart = p.s < 14 || p.s > T.L - 14;
    if (d <= HW) {
      let b = ASPHALT;
      if (d < 0.6 && Math.floor(p.s / 3) % 2 === 0) b = ROADLINE;
      if (p.s < 2) b = CHECKER;
      if (T.boosts.some(s0 => inRange(p.s, s0, s0 + 4)) && d < 3) b = BOOST;
      world[top] = b;
    } else if (d <= HW + 1.2) world[top] = KERB;
    else if (d >= HW + 5 && d < HW + 6 && !(outward && nearStart)) world[I(x, KH + 1, z)] = PLANKS;
    else if (!outward && d > HW + 14 && vnoise(x, z, 18, 77) > 0.45) { world[top] = WATER; world[I(x, KH - 1, z)] = WATER; }
    else if (d > HW + 7 && !(outward && nearStart)) {
      const r = hash(x, z, 81);
      if (r < 0.012) treeOak(x, KH, z, 4 + Math.floor(hash(x, z, 8) * 2), r < 0.006 ? CANDY : LOG, r < 0.006 ? PINKLEAVES : LEAVES);
      else if (r < 0.08) world[I(x, KH + 1, z)] = FLOWERS[Math.floor(hash(x, z, 5) * FLOWERS.length)];
    }
    // tunnel with candy stripes
    if (inRange(p.s, T.tunnel[0], T.tunnel[1])) {
      if (d > HW + 1.2 && d <= HW + 2.4) fillBox(x, KH + 1, z, x, KH + 6, z, CASTLE);
      if (d <= HW + 2.4) setB(x, KH + 6, z, Math.floor(p.s) % 4 < 2 ? CANDY : CASTLE);
    }
    // start gate and banner
    if (p.s < 1.2) {
      if (d > HW + 1.4 && d <= HW + 2.4) fillBox(x, KH + 1, z, x, KH + 7, z, MAGIC);
      if (d <= HW + 2.4) setB(x, KH + 8, z, CHECKER);
    }
    // grandstand with cheering block fans
    if (outward && nearStart && d >= HW + 7 && d < HW + 14) {
      const h = 1 + Math.min(4, Math.floor((d - HW - 7) / 1.4));
      fillBox(x, KH + 1, z, x, KH + h, z, PLANKS);
      if (hash(x, z, 83) < 0.45) setB(x, KH + h + 1, z, WOOLS[Math.floor(hash(x, z, 84) * 8)]);
    }
  }
}

// ---------- picture workshop ----------
const ART = { x0T: CX - 12, x0C: CX + 4, y0: KH + 2, zWall: CZ - 12, size: 8 };
function generateArt() {
  flatGround(GRASS, ARTB);
  const x0 = CX - 16, x1 = CX + 16, z0 = CZ - 12, z1 = CZ + 10;
  fillBox(x0, KH, z0, x1, KH, z1, PLANKS);
  for (let x = x0; x <= x1; x++) { fillBox(x, KH + 1, z0, x, KH + 12, z0, CASTLE); fillBox(x, KH + 1, z1, x, KH + 12, z1, CASTLE); }
  for (let z = z0; z <= z1; z++) { fillBox(x0, KH + 1, z, x0, KH + 12, z, CASTLE); fillBox(x1, KH + 1, z, x1, KH + 12, z, CASTLE); }
  for (let z = z0 + 3; z <= z1 - 3; z += 4) { fillBox(x0, KH + 5, z, x0, KH + 7, z, ICE); fillBox(x1, KH + 5, z, x1, KH + 7, z, ICE); }
  fillBox(CX - 1, KH, CZ - 9, CX + 1, KH, CZ + 8, CARPET);
  [[x0 + 2, z1 - 2], [x1 - 2, z1 - 2], [x0 + 2, z0 + 3], [x1 - 2, z0 + 3]].forEach(([x, z], i) => { setB(x, KH + 1, z, PLANKS); setB(x, KH + 2, z, [SUNFLOWER, TULIP, CORNFLOWER, DAISY][i]); });
  // two golden frames on the north wall: the sample on the left, the blank canvas on the right
  [ART.x0T - 1, ART.x0C - 1].forEach(fx => {
    for (let y = ART.y0 - 1; y <= ART.y0 + ART.size; y++) for (let x = fx; x <= fx + ART.size + 1; x++) {
      const edge = y === ART.y0 - 1 || y === ART.y0 + ART.size || x === fx || x === fx + ART.size + 1;
      setB(x, y, ART.zWall, edge ? GOLD : W_WHITE);
    }
  });
}

// ---------- candy arena ----------
const ARENA_R = 33;
function generateArena() {
  flatGround(PINKGRASS, ARENAB);
  for (let z = CZ - 40; z <= CZ + 40; z++) for (let x = CX - 40; x <= CX + 40; x++) {
    const r = Math.hypot(x + .5 - CX, z + .5 - CZ);
    if (r <= ARENA_R) world[I(x, KH, z)] = ((Math.floor((x - CX) / 4) + Math.floor((z - CZ) / 4)) & 1) ? W_PINK : W_WHITE;
    else if (r <= ARENA_R + 2) fillBox(x, KH + 1, z, x, KH + 4, z, CANDY);
  }
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, lx = Math.round(CX + Math.cos(a) * (ARENA_R + 5)), lz = Math.round(CZ + Math.sin(a) * (ARENA_R + 5));
    fillBox(lx, KH + 1, lz, lx, KH + 7, lz, W_WHITE);
    const col = [W_RED, W_PURPLE, W_GREEN, W_ORANGE][i % 4];
    for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++)
      if (dx * dx + dy * dy + dz * dz <= 5) setB(lx + dx, KH + 10 + dy, lz + dz, (dx + dy + dz) & 1 ? col : W_WHITE);
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + 0.4, r = i % 2 ? 13 : 20, gx = Math.round(CX + Math.cos(a) * r), gz = Math.round(CZ + Math.sin(a) * r);
    const col = [W_GREEN, W_YELLOW, W_PURPLE, MAGIC][i % 4];
    fillBox(gx, KH + 1, gz, gx + 1, KH + 2, gz + 1, col);
  }
  for (let z = 4; z < SZ - 4; z++) for (let x = 4; x < SX - 4; x++) {
    const r = Math.hypot(x - CX, z - CZ), h = hash(x, z, 91);
    if (r > ARENA_R + 9 && r < 110 && h < 0.02) treeOak(x, KH, z, 4 + Math.floor(hash(x, z, 8) * 2), CANDY, PINKLEAVES);
    else if (r > ARENA_R + 9 && h < 0.1) setB(x, KH + 1, z, [TULIP, RED, DAISY, LAVENDER][Math.floor(hash(x, z, 5) * 4)]);
  }
}

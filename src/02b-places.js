// ---------- furniture ----------
// each piece is a list of boxes [w, h, d, colour, x, y, z, glows?] around the bottom centre of its cell, facing +z
const FURNITURE = {
  bed: { name: 'Ліжко', h: 1, parts: [[0.9, 0.3, 0.95, '#c79856', 0, 0.15, 0], [0.86, 0.14, 0.9, '#ffffff', 0, 0.37, 0], [0.88, 0.1, 0.6, '#ff6fae', 0, 0.47, 0.15],
    [0.6, 0.12, 0.22, '#ffffff', 0, 0.48, -0.3], [0.9, 0.62, 0.08, '#a57b4a', 0, 0.31, -0.46]] },
  table: { name: 'Стіл', h: 1, parts: [[0.92, 0.08, 0.92, '#c79856', 0, 0.72, 0], [0.08, 0.68, 0.08, '#a57b4a', -0.38, 0.34, -0.38], [0.08, 0.68, 0.08, '#a57b4a', 0.38, 0.34, -0.38],
    [0.08, 0.68, 0.08, '#a57b4a', -0.38, 0.34, 0.38], [0.08, 0.68, 0.08, '#a57b4a', 0.38, 0.34, 0.38], [0.16, 0.16, 0.16, '#ff6fae', 0, 0.84, 0]] },
  chair: { name: 'Стілець', h: 1, parts: [[0.6, 0.08, 0.6, '#ff9fd2', 0, 0.45, 0], [0.6, 0.5, 0.08, '#ff9fd2', 0, 0.74, -0.26], [0.06, 0.42, 0.06, '#a57b4a', -0.24, 0.21, -0.24],
    [0.06, 0.42, 0.06, '#a57b4a', 0.24, 0.21, -0.24], [0.06, 0.42, 0.06, '#a57b4a', -0.24, 0.21, 0.24], [0.06, 0.42, 0.06, '#a57b4a', 0.24, 0.21, 0.24]] },
  sofa: { name: 'Диван', h: 1, parts: [[0.96, 0.32, 0.72, '#9a7bff', 0, 0.24, 0.04], [0.96, 0.46, 0.2, '#8466f0', 0, 0.56, -0.3], [0.14, 0.3, 0.72, '#8466f0', -0.42, 0.5, 0.04],
    [0.14, 0.3, 0.72, '#8466f0', 0.42, 0.5, 0.04], [0.32, 0.1, 0.5, '#c9a8ff', -0.18, 0.45, 0.08], [0.32, 0.1, 0.5, '#c9a8ff', 0.18, 0.45, 0.08]] },
  wardrobe: { name: 'Шафа', h: 2, parts: [[0.9, 1.9, 0.6, '#ffd6ea', 0, 0.95, -0.15], [0.03, 1.7, 0.03, '#c97aa0', 0, 0.95, 0.16], [0.06, 0.06, 0.04, '#f4c23f', -0.08, 1, 0.17],
    [0.06, 0.06, 0.04, '#f4c23f', 0.08, 1, 0.17], [0.94, 0.08, 0.64, '#ff9fd2', 0, 1.9, -0.15]] },
  lamp: { name: 'Торшер', h: 2, parts: [[0.4, 0.06, 0.4, '#2b2140', 0, 0.03, 0], [0.06, 1.2, 0.06, '#2b2140', 0, 0.66, 0], [0.5, 0.4, 0.5, '#fff3b0', 0, 1.4, 0, 1]] },
  shelf: { name: 'Полиця з книжками', h: 2, parts: [[0.92, 1.9, 0.42, '#a57b4a', 0, 0.95, -0.24], [0.84, 0.04, 0.36, '#c79856', 0, 0.5, -0.2], [0.84, 0.04, 0.36, '#c79856', 0, 0.98, -0.2],
    [0.84, 0.04, 0.36, '#c79856', 0, 1.46, -0.2]].concat([0.72, 1.2, 1.68].flatMap((y, r) => [0, 1, 2, 3, 4].map(i => [0.13, 0.32, 0.3, ['#e8333a', '#3d7be0', '#3bb54a', '#ffd23f', '#9a7bff'][(i + r) % 5], -0.3 + i * 0.15, y, -0.18]))) },
  pot: { name: 'Вазон', h: 1, parts: [[0.4, 0.36, 0.4, '#c9764a', 0, 0.18, 0], [0.36, 0.04, 0.36, '#6b4426', 0, 0.37, 0], [0.56, 0.42, 0.56, '#3f9b3a', 0, 0.62, 0], [0.18, 0.18, 0.18, '#ff4f9a', 0.1, 0.88, 0.1], [0.14, 0.14, 0.14, '#ffd23f', -0.14, 0.82, -0.06]] },
  tv: { name: 'Телевізор', h: 1, parts: [[0.86, 0.34, 0.5, '#c79856', 0, 0.17, 0], [0.92, 0.56, 0.1, '#2b2140', 0, 0.66, -0.1], [0.8, 0.44, 0.02, '#7cc8ff', 0, 0.66, -0.04, 1], [0.3, 0.2, 0.02, '#ff9fd2', -0.12, 0.62, -0.03, 1]] },
  toybox: { name: 'Скриня з іграшками', h: 1, parts: [[0.8, 0.5, 0.6, '#ffd23f', 0, 0.25, 0], [0.84, 0.08, 0.64, '#ff8a1f', 0, 0.54, 0], [0.26, 0.26, 0.24, '#b08060', -0.15, 0.71, 0], [0.08, 0.08, 0.06, '#b08060', -0.25, 0.86, 0],
    [0.08, 0.08, 0.06, '#b08060', -0.05, 0.86, 0], [0.18, 0.18, 0.18, '#3d7be0', 0.2, 0.67, 0.05]] },
  // the sign by Angelina's house; it is never offered in the furniture bar
  sign: { name: 'Табличка', h: 1, parts: [[0.14, 1.3, 0.14, '#8c6534', 0, 0.65, -0.05], [1.3, 0.8, 0.1, '#c79856', 0, 1.25, 0.04], [1.36, 0.06, 0.14, '#8c6534', 0, 1.67, 0.04]] },
};
const HOTBAR_FURN = Object.keys(FURNITURE).filter(k => k !== 'sign').map(k => 'f:' + k);
const glowCache = {};
const MB = c => glowCache[c] || (glowCache[c] = new THREE.MeshBasicMaterial({ color: c }));
// per world: base cell -> piece, and every occupied cell -> its base cell
const furn = [new Map(), new Map()], furnCell = [new Map(), new Map()];
function furnitureCells(x, y, z, type) { const out = []; for (let i = 0; i < FURNITURE[type].h; i++) out.push(I(x, y + i, z)); return out; }
function addFurnitureRec(d, x, y, z, type, rot, gen) {
  if (!FURNITURE[type] || d > D_CASTLE) return null;
  const base = I(x, y, z);
  if (furn[d].has(base)) return furn[d].get(base);
  const rec = { d, x, y, z, type, rot: rot & 3, gen: !!gen, g: null };
  furn[d].set(base, rec);
  furnitureCells(x, y, z, type).forEach(c => { worlds[d][c] = FURN; furnCell[d].set(c, base); });
  return rec;
}
function addGenFurniture(d, x, y, z, type, rot) { addFurnitureRec(d, x, y, z, type, rot, true); }
function furnModel(rec) {
  if (rec.g) return;
  const g = new THREE.Group();
  FURNITURE[rec.type].parts.forEach(([w, h, dd, c, x, y, z, glow]) => box(w, h, dd, c, x, y, z, g, glow ? MB(c) : undefined));
  if (rec.type === 'sign') { const face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshLambertMaterial({ map: signTexture() })); face.position.set(0, 1.25, 0.095); g.add(face); }
  g.position.set(rec.x + .5, rec.y, rec.z + .5);
  g.rotation.y = rec.rot * Math.PI / 2;
  g.visible = false;
  scene.add(g);
  rec.g = g;
}
function removeFurnitureRec(d, base) {
  const rec = furn[d].get(base);
  if (!rec) return null;
  if (rec.g) scene.remove(rec.g);
  furnitureCells(rec.x, rec.y, rec.z, rec.type).forEach(c => { if (worlds[d][c] === FURN) worlds[d][c] = 0; furnCell[d].delete(c); if (rec.gen) editsByDim[d][c] = 0; });
  furn[d].delete(base);
  return rec;
}
function clearFurniture(d) { furn[d].forEach(rec => { if (rec.g) scene.remove(rec.g); }); furn[d].clear(); furnCell[d].clear(); }
// after edits are applied, pieces whose cells were cleared are gone for good
function settleFurniture() {
  [0, 1].forEach(d => {
    [...furn[d].values()].forEach(rec => { if (worlds[d][I(rec.x, rec.y, rec.z)] !== FURN) removeFurnitureRec(d, I(rec.x, rec.y, rec.z)); else furnModel(rec); });
  });
}
function updateFurniture() {
  [0, 1].forEach(d => furn[d].forEach(rec => {
    if (!rec.g) return;
    rec.g.visible = d === dim && Math.abs(rec.x - pl.p.x) < 70 && Math.abs(rec.z - pl.p.z) < 70;
  }));
}
function furnIcon(type) {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), def = FURNITURE[type], H = def.h;
  const sc = 26 / Math.max(1, H);
  [...def.parts].sort((a, b) => (a[6] - a[2] / 2) - (b[6] - b[2] / 2)).forEach(([w, h, , col, x, y]) => {
    g.fillStyle = col;
    g.fillRect(16 + (x - w / 2) * sc, 29 - (y + h / 2) * sc, Math.max(1, w * sc), Math.max(1, h * sc));
  });
  return c;
}
function placeFurnitureByPlayer(hit, type) {
  const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz, def = FURNITURE[type];
  for (let i = 0; i < def.h; i++) {
    if (!inB(x, y + i, z)) return;
    const b = world[I(x, y + i, z)];
    if (b && b !== WATER && !isPlant(b)) { toast('Тут замало місця'); return; }
    if (overlapsPlayer(x, y + i, z)) { toast('Тут стоїть Ангеліна'); return; }
  }
  const rot = (Math.round(Math.atan2(pl.p.x - (x + .5), pl.p.z - (z + .5)) / (Math.PI / 2)) + 4) % 4;
  const rec = addFurnitureRec(dim, x, y, z, type, rot, false);
  furnModel(rec); rec.g.visible = true;
  rebuildAround(x, z);
  sfx.place();
  scheduleSave();
  netSend({ t: 'furn', op: 'add', d: dim, x, y, z, type, rot });
}
function breakFurniture(d, cell, fromNet) {
  const base = furnCell[d].get(cell);
  if (base === undefined) { worlds[d][cell] = 0; return; }
  if (furn[d].get(base).type === 'sign') { if (!fromNet) toast('Цю табличку не можна зламати. Підійди й прочитай її!', 2200); return; }
  const rec = removeFurnitureRec(d, base);
  if (!rec) return;
  if (d === dim) { burst(rec.x, rec.y, rec.z, '#c79856', 10, FURNITURE[rec.type].parts.map(p => p[3])); rebuildAround(rec.x, rec.z); }
  scheduleSave();
  if (!fromNet) netSend({ t: 'furn', op: 'del', d, x: rec.x, y: rec.y, z: rec.z });
}

// ---------- signs ----------
const labels = [];
function addLabel(d, text, x, y, z, size = 1.6) {
  const s = textSprite(text, size, 'rgba(255,79,154,.88)');
  s.position.set(x, y, z);
  s.visible = false;
  scene.add(s);
  labels.push({ d, s });
}
function clearLabels() { labels.forEach(l => scene.remove(l.s)); labels.length = 0; }
function updateLabels() { labels.forEach(l => { l.s.visible = l.d === dim && Math.hypot(l.s.position.x - pl.p.x, l.s.position.z - pl.p.z) < 80; }); }

// ---------- Angelina's house next to where she starts ----------
const HOUSE = { x0: CX + 7, x1: CX + 15, z0: CZ - 2, z1: CZ + 4 };
function buildHouse() {
  const { x0, x1, z0, z1 } = HOUSE, h = heightAt(CX + 11, CZ + 1);
  fillBox(x0 - 1, h + 1, z0 - 1, x1 + 1, h + 12, z1 + 1, 0);
  fillBox(x0, h, z0, x1, h, z1, PLANKS);
  fillBox(x0, h + 1, z0, x1, h + 5, z1, W_PINK);
  fillBox(x0 + 1, h + 1, z0 + 1, x1 - 1, h + 5, z1 - 1, 0);
  fillBox(x0 + 3, h, z0 + 2, x1 - 3, h, z1 - 2, CARPET);
  fillBox(x0, h + 1, CZ + 1, x0, h + 3, CZ + 2, 0);
  [[x0 + 2, z0], [x1 - 2, z0], [x0 + 2, z1], [x1 - 2, z1]].forEach(([x, z]) => fillBox(x, h + 2, z, x, h + 3, z, ICE));
  [CZ, CZ + 2].forEach(z => fillBox(x1, h + 2, z, x1, h + 3, z, ICE));
  [x0 + 3, x1 - 3].forEach(x => setB(x, h + 5, z0, LANTERN));
  for (let j = 0; x0 - 1 + j <= x1 + 1 - j && z0 - 1 + j <= z1 + 1 - j; j++) fillBox(x0 - 1 + j, h + 6 + j, z0 - 1 + j, x1 + 1 - j, h + 6 + j, z1 + 1 - j, ROOF);
  [[x0 - 1, CZ - 1], [x0 - 1, CZ + 4]].forEach(([x, z]) => setB(x, h + 1, z, FLOWERS[(x + z) % FLOWERS.length]));
  addGenFurniture(D_MAIN, x1 - 1, h + 1, z0 + 1, 'bed', 0);
  addGenFurniture(D_MAIN, x1 - 2, h + 1, z0 + 1, 'bed', 0);
  addGenFurniture(D_MAIN, x1 - 1, h + 1, z1 - 1, 'wardrobe', 3);
  addGenFurniture(D_MAIN, x1 - 3, h + 1, z1 - 1, 'shelf', 2);
  addGenFurniture(D_MAIN, CX + 11, h + 1, CZ + 1, 'table', 0);
  addGenFurniture(D_MAIN, CX + 10, h + 1, CZ + 1, 'chair', 1);
  addGenFurniture(D_MAIN, CX + 12, h + 1, CZ + 1, 'chair', 3);
  addGenFurniture(D_MAIN, x0 + 1, h + 1, z0 + 1, 'lamp', 0);
  addGenFurniture(D_MAIN, x0 + 3, h + 1, z0 + 1, 'tv', 0);
  addGenFurniture(D_MAIN, x0 + 1, h + 1, z1 - 1, 'pot', 0);
  addGenFurniture(D_MAIN, x0 + 4, h + 1, z1 - 1, 'sofa', 2);
  addGenFurniture(D_MAIN, x1 - 4, h + 1, z0 + 1, 'toybox', 0);
  fillBox(x0 - 3, h + 1, CZ - 1, x0 - 3, h + 2, CZ - 1, 0);
  addGenFurniture(D_MAIN, x0 - 3, h + 1, CZ - 1, 'sign', 3);
  HOUSE.h = h;
}

// ---------- villages ----------
const VILLAGE_NAMES = ['Ромашкове', 'Сонячне', 'Яблунівка', 'Медове', 'Зірочка', 'Веселкове'];
const VR = 22;
const villages = VILLAGE_NAMES.map((name, i) => {
  const a = i / VILLAGE_NAMES.length * Math.PI * 2 + 0.35, r = i % 2 ? 178 : 134;
  return { name, x: Math.round(CX + Math.cos(a) * r), z: Math.round(CZ + Math.sin(a) * r), h: 0 };
});
function computeVillageHeights() {
  villages.forEach(v => {
    let s = 0;
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; s += rawHeight(v.x + Math.cos(a) * 14, v.z + Math.sin(a) * 14); }
    v.h = clamp(Math.round(s / 16), SEA + 2, 28);
  });
}
function villageHeight(x, z, h) {
  for (const v of villages) {
    const d = Math.hypot(x - v.x, z - v.z);
    if (d < VR) return v.h;
    if (d < VR + 10) { const k = (d - VR) / 10; return v.h * (1 - k) + h * k; }
  }
  return h;
}
const nearVillage = (x, z, pad) => villages.some(v => Math.hypot(x - v.x, z - v.z) < VR + pad);
const villageAt = (x, z) => villages.find(v => Math.hypot(x - v.x, z - v.z) < VR + 3);
const VSTYLE = {
  [MEADOW]: { wall: PLANKS, roof: BRICK }, [FOREST]: { wall: LOG, roof: BRICK }, [DESERT]: { wall: SANDSTONE, roof: W_ORANGE },
  [SNOWY]: { wall: LOG, roof: SNOW }, [CANDYLAND]: { wall: W_WHITE, roof: ROOF },
};
function buildCottage(cx, h, cz, v, st, k) {
  const w = k % 2 ? 3 : 2, d = 2;
  const dx = v.x - cx, dz = v.z - cz, alongX = Math.abs(dx) > Math.abs(dz);
  fillBox(cx - w - 1, h + 1, cz - d - 1, cx + w + 1, h + 10, cz + d + 1, 0);
  fillBox(cx - w, h, cz - d, cx + w, h, cz + d, PLANKS);
  fillBox(cx - w, h + 1, cz - d, cx + w, h + 4, cz + d, st.wall);
  fillBox(cx - w + 1, h + 1, cz - d + 1, cx + w - 1, h + 4, cz + d - 1, 0);
  let door, back;
  if (alongX) { const sx = dx > 0 ? cx + w : cx - w; door = [sx + Math.sign(dx), cz]; fillBox(sx, h + 1, cz, sx, h + 2, cz, 0); back = [dx > 0 ? cx - w : cx + w, cz]; }
  else { const sz = dz > 0 ? cz + d : cz - d; door = [cx, sz + Math.sign(dz)]; fillBox(cx, h + 1, sz, cx, h + 2, sz, 0); back = [cx, dz > 0 ? cz - d : cz + d]; }
  setB(back[0], h + 2, back[1], ICE);
  setB(back[0], h + 4, back[1], LANTERN);
  if (alongX) { setB(cx, h + 2, cz - d, ICE); setB(cx, h + 2, cz + d, ICE); } else { setB(cx - w, h + 2, cz, ICE); setB(cx + w, h + 2, cz, ICE); }
  for (let j = 0; cx - w - 1 + j <= cx + w + 1 - j && cz - d - 1 + j <= cz + d + 1 - j; j++) fillBox(cx - w - 1 + j, h + 5 + j, cz - d - 1 + j, cx + w + 1 - j, h + 5 + j, cz + d + 1 - j, st.roof);
  const bx = clamp(back[0], cx - w + 1, cx + w - 1), bz = clamp(back[1], cz - d + 1, cz + d - 1);
  const ax = alongX ? bx : cx - w + 1, az = alongX ? cz - d + 1 : bz;
  addGenFurniture(D_MAIN, ax, h + 1, az, 'bed', alongX ? (dx > 0 ? 1 : 3) : (dz > 0 ? 0 : 2));
  addGenFurniture(D_MAIN, alongX ? bx : cx + w - 1, h + 1, alongX ? cz + d - 1 : bz, k % 3 ? 'pot' : 'table', 0);
  return door;
}
function buildVillages() {
  villages.forEach((v, vi) => {
    const st = VSTYLE[biomeAt(v.x, v.z)] || VSTYLE[MEADOW], h = v.h;
    for (let dz = -VR; dz <= VR; dz++) for (let dx = -VR; dx <= VR; dx++) if (Math.hypot(dx, dz) <= VR) fillBox(v.x + dx, h + 1, v.z + dz, v.x + dx, h + 9, v.z + dz, 0);
    // well with a little roof
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (dx || dz) { setB(v.x + dx, h, v.z + dz, STONE); setB(v.x + dx, h + 1, v.z + dz, STONE); } else { setB(v.x, h, v.z, WATER); setB(v.x, h - 1, v.z, WATER); }
    }
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dz]) => fillBox(v.x + dx, h + 2, v.z + dz, v.x + dx, h + 3, v.z + dz, LOG));
    fillBox(v.x - 1, h + 4, v.z - 1, v.x + 1, h + 4, v.z + 1, st.roof);
    const doors = [];
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + vi;
      doors.push(buildCottage(Math.round(v.x + Math.cos(a) * 12), h, Math.round(v.z + Math.sin(a) * 12), v, st, k));
    }
    // gravel paths from the well to every door
    doors.forEach(([tx, tz]) => {
      const n = Math.ceil(Math.hypot(tx - v.x, tz - v.z));
      for (let i = 2; i <= n; i++) {
        const x = Math.round(v.x + (tx - v.x) * i / n), z = Math.round(v.z + (tz - v.z) * i / n);
        if (get(x, h + 1, z) && !isPlant(get(x, h + 1, z))) continue;
        setB(x, h, z, GRAVEL); setB(x, h + 1, z, 0);
      }
    });
    [[5, 0], [-5, 0], [0, 5], [0, -5]].forEach(([dx, dz]) => { fillBox(v.x + dx, h + 1, v.z + dz, v.x + dx, h + 2, v.z + dz, LOG); setB(v.x + dx, h + 3, v.z + dz, LANTERN); });
    // two wheat fields at the edge
    [0, Math.PI].forEach(off => {
      const a = vi * 1.3 + off + 0.5, fx = Math.round(v.x + Math.cos(a) * 19), fz = Math.round(v.z + Math.sin(a) * 19);
      for (let dz = -2; dz <= 2; dz++) for (let dx = -3; dx <= 3; dx++) {
        if (get(fx + dx, h + 1, fz + dz) && !isPlant(get(fx + dx, h + 1, fz + dz))) continue;
        setB(fx + dx, h, fz + dz, DIRT);
        setB(fx + dx, h + 1, fz + dz, (dz & 1) ? 0 : WHEAT);
      }
    });
  });
}
function addPlaceLabels() {
  clearLabels();
  addLabel(D_MAIN, 'Будиночок Ангеліни', HOUSE.x0 - 0.5, HOUSE.h + 9, CZ + 1.5, 1.7);
  villages.forEach(v => addLabel(D_MAIN, `Село ${v.name}`, v.x + .5, v.h + 7.5, v.z + .5, 2));
}

function playerFurniture() {
  const out = [];
  [0, 1].forEach(d => furn[d].forEach(r => { if (!r.gen) out.push([d, r.x, r.y, r.z, r.type, r.rot]); }));
  return out;
}
function loadFurniture(list) {
  (Array.isArray(list) ? list : []).forEach(e => {
    if (!Array.isArray(e) || e.length !== 6) return;
    const [d, x, y, z, type, rot] = e;
    if ((d === 0 || d === 1) && [x, y, z].every(Number.isInteger) && inB(x, y, z) && FURNITURE[type]) addFurnitureRec(d, x, y, z, type, rot | 0, false);
  });
}

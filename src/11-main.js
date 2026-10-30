// ---------- main loop ----------
let biomeT = 0, curBiome = -1, curVillage = null;
function nearestHeart() {
  let best = null, bd = Infinity;
  hearts.forEach(h => {
    if (collected.has(h.id)) return;
    const d = Math.hypot(h.x + .5 - pl.p.x, h.z + .5 - pl.p.z);
    if (d < bd) { bd = d; best = h; }
  });
  return best ? { h: best, d: bd } : null;
}
function updateHearts(t) {
  if (dim !== D_MAIN) return;
  hearts.forEach(h => {
    if (collected.has(h.id)) return;
    const d = Math.hypot(h.x + .5 - pl.p.x, h.z + .5 - pl.p.z);
    h.mesh.visible = d < 90;
    if (!h.mesh.visible) return;
    h.mesh.rotation.y = t * 2 + h.phase;
    h.mesh.position.y = h.y + Math.sin(t * 2.5 + h.phase) * 0.15;
    if (d < 1.2 && Math.abs(h.mesh.position.y - (pl.p.y + 0.8)) < 1.4) collectHeart(h, false);
  });
}
// a heart counts for everyone in the room, whoever picked it up
function collectHeart(h, fromNet) {
  if (!h || collected.has(h.id)) return;
  collected.add(h.id); scene.remove(h.mesh);
  if (dim === D_MAIN) burst(h.mesh.position.x - .5, h.mesh.position.y - .5, h.mesh.position.z - .5, '#ff4f9a', 14);
  updateStats(); scheduleSave();
  if (!fromNet) netSend({ t: 'heart', h: h.id });
  if (collected.size === HEART_NEED) {
    sfx.win();
    const P = PORTALS[0];
    P.open = true; placePortal(P);
    if (dim === D_MAIN) rebuildAround(P.x, P.z);
    toast('Ура! 5 сердечок! Посередині світу відкрився портал до замку', 5000);
  } else if (fromNet) toast('Подружка знайшла сердечко!', 1600);
  else if (collected.size < HEART_NEED) { sfx.heart(); toast(`Сердечко! Ще ${HEART_NEED - collected.size}`); }
  else { sfx.heart(); toast('Ще одне сердечко!'); }
}
function updateCompass() {
  if (dim !== D_MAIN || !playing) { compassEl.hidden = true; return; }
  const P = PORTALS[0];
  let tx, tz, label;
  if (P.open && collected.size >= HEART_NEED) { tx = P.x + .5; tz = P.z + .5; label = 'Портал'; }
  else { const n = nearestHeart(); if (!n) { compassEl.hidden = true; return; } tx = n.h.x + .5; tz = n.h.z + .5; label = 'Сердечко'; }
  const d = Math.hypot(tx - pl.p.x, tz - pl.p.z);
  const ang = Math.atan2(tx - pl.p.x, tz - pl.p.z);
  const camFwd = Math.atan2(-Math.sin(yaw), -Math.cos(yaw));
  const rel = wrapAngle(camFwd - ang);
  compassEl.hidden = false;
  compassArrow.style.transform = `rotate(${rel}rad)`;
  compassText.textContent = `${label}: ${steps(Math.round(d))}`;
}
function update(dt, now) {
  const t = now / 1000, mode = modeOf(dim);
  if (mode === 'race') {
    updateRace(dt);
    raceCamera(dt);
  } else {
    updatePlayer(dt, now);
    updateCamera(dt);
  }
  if (dim <= D_CASTLE) {
    mobs.forEach(m => {
      const follows = friends.has(m.id) || (m.mother && friends.has(m.mother.id));
      if (follows && m.dim !== dim && !traveling) bringToPlayer(m);
      if (m.dim === dim) updateMob(m, dt); else m.g.visible = false;
    });
  } else mobs.forEach(m => { m.g.visible = false; });
  updateHearts(t);
  updatePortals(dt, t);
  updateNet(dt);
  if (mode === 'arena') updateArena(dt);
  if (mode === 'hide') updateHide(dt, t);
  if (mode === 'jump') updateJump(dt);
  updateParticles(dt);
  clouds.forEach(c => {
    c.position.x += dt * 0.6;
    if (c.position.x - camera.position.x > 160) c.position.x -= 320;
    if (c.position.x - camera.position.x < -160) c.position.x += 320;
    if (c.position.z - camera.position.z > 160) c.position.z -= 320;
    if (c.position.z - camera.position.z < -160) c.position.z += 320;
  });
  biomeT -= dt;
  if (biomeT <= 0) {
    biomeT = 0.4;
    const bx = clamp(Math.floor(camera.position.x), 0, SX - 1), bz = clamp(Math.floor(camera.position.z), 0, SZ - 1);
    const b = biomeMap[bx + bz * SX];
    if (b !== curBiome) {
      if (curBiome !== -1 && playing && mode === 'explore' && !curVillage) toast(BIOME_NAMES[b], 1300);
      curBiome = b; skyTarget.setHex(BIOME_SKY[b]);
    }
    // villages announce themselves when you walk in
    const v = dim === D_MAIN ? villageAt(pl.p.x, pl.p.z) : null;
    if (v !== curVillage) { curVillage = v; if (v && playing) toast(`Село ${v.name}`, 1800); }
    biomeEl.textContent = v ? `Село ${v.name}` : BIOME_NAMES[b];
    updateCompass();
  }
  skyColor.lerp(skyTarget, Math.min(1, dt * 1.5));
  const horizon = updateSky(dt, skyColor);
  windTime.value = t;
  waterTex.offset.set(t * 0.05, t * 0.03);
  if (underwater && mode !== 'race') { skyDome.visible = false; scene.background = waterFog; scene.fog.color.copy(waterFog); scene.fog.near = 1; scene.fog.far = 20; }
  else { skyDome.visible = true; scene.background = null; scene.fog.color.copy(horizon); scene.fog.near = VIEW * CS * 0.42; scene.fog.far = VIEW * CS * 0.98; }
  updateFauna(dt, t);
  updateFurniture();
  updateLabels();
  updateExtras(dt, t);
  let hit = null;
  if (playing && (mode === 'explore' || mode === 'art') && !drag) {
    if (locked()) { aim(innerWidth / 2, innerHeight / 2); hit = pickBlock(); }
    else if (mouse) { aim(mouse.x, mouse.y); hit = pickBlock(); }
  }
  hl.visible = !!hit;
  if (hit) hl.position.set(hit.x + .5, hit.y + .5, hit.z + .5);
  refreshChunks(camera.position.x, camera.position.z, false);
  buildFor(6);
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  viewOffset = '-';
  if (cssRenderer) cssRenderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);

// ---------- boot ----------
function boot() {
  for (let d = D_CASTLE + 1; d < NDIMS; d++) freeDim(d);
  dim = D_MAIN;
  useDim(D_MAIN); generateMain(); placeHearts();
  useDim(D_CASTLE); generateCastle();
  useDim(D_MAIN);
  load();
  hearts.forEach(h => { const on = !collected.has(h.id); h.mesh.visible = on; if (!on) scene.remove(h.mesh); });
  settleFurniture();
  addPlaceLabels();
  PORTALS[0].open = collected.size >= HEART_NEED;
  PORTALS.forEach(P => { if (P.open) placePortal(P); });
  portalLock = false;
  buildGirl();
  setNameTag(net.name);
  spawnMobs();
  spawn();
  pl.facing = yaw;
  curBiome = -1;
  updateStats();
  applyMode();
  setMode(false);
  resetChunks();
  refreshChunks(pl.p.x, pl.p.z, true);
  buildCount(9);
}
resize();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt, now);
  renderer.render(scene, camera);
  renderCss();
  requestAnimationFrame(frame);
}
setTimeout(() => {
  boot();
  $('playBtn').disabled = false;
  $('playBtn').textContent = 'Грати';
  requestAnimationFrame(frame);
}, 30);

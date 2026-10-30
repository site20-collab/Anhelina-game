// ---------- playing together: rooms over PeerJS ----------
// The host's game is the record of the shared world; guests send what they do and the host passes it on.
const PEER_PREFIX = 'angelina-world-v1-';
const PHRASES = ['Привіт!', 'Ходи сюди!', 'Дивись!', 'Ура!', 'Дякую!', 'Давай будувати!', 'Біжимо до порталу!', 'Ти найкраща!'];
const MAX_GUESTS = 3;
const net = { role: 'off', peer: null, conns: new Map(), conn: null, myId: 'h', code: '', name: 'Ангеліна', players: new Map(), sendT: 0, nextGuest: 1, joinTimer: 0 };
const peerOpts = () => window.__PEER_OPTS || { debug: 0 };
// the Claude preview blocks direct connections between devices, so rooms only work on the game's own site
const SITE = 'site20-collab.github.io/Anhelina-game';
const netBlocked = () => typeof Peer === 'undefined' || !('RTCPeerConnection' in window) || /claude/i.test(location.hostname);

function cleanName(s) { return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14) || 'Подружка'; }
function cleanOutfit(o) {
  const out = {};
  Object.keys(WARDROBE).forEach(cat => { const v = o && o[cat]; out[cat] = WARDROBE[cat].items.some(i => i.id === v) ? v : WARDROBE[cat].items[0].id; });
  return out;
}
const finite = v => typeof v === 'number' && Number.isFinite(v);

function netSend(msg) {
  if (net.role === 'host') { msg.id = msg.id || 'h'; net.conns.forEach(c => { if (c.open) c.send(msg); }); }
  else if (net.role === 'guest' && net.conn && net.conn.open) net.conn.send(msg);
}
function relay(msg, fromId) { net.conns.forEach((c, id) => { if (id !== fromId && c.open) c.send(msg); }); }

// ---------- rooms ----------
function hostRoom() {
  if (netBlocked()) { netStatus(`Гра з друзями працює на сайті гри: ${SITE}`); return; }
  net.name = cleanName($('netName').value); setNameTag(net.name);
  const code = String(100000 + Math.floor(Math.random() * 900000));
  netStatus('Створюю кімнату…');
  let peer;
  try { peer = new Peer(PEER_PREFIX + code, peerOpts()); } catch (e) { netStatus('Не вдалося створити кімнату. Спробуй ще раз.'); return; }
  net.peer = peer;
  peer.on('open', () => {
    net.role = 'host'; net.myId = 'h'; net.code = code; net.nextGuest = 1;
    netStatus(''); renderNet(); scheduleSave();
    toast(`Кімната ${code} готова. Скажи код подружці!`, 3000);
  });
  peer.on('connection', conn => {
    conn.on('open', () => {
      if (net.conns.size >= MAX_GUESTS) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 400); return; }
      const id = 'g' + net.nextGuest++;
      net.conns.set(id, conn);
      conn.on('data', m => onHostData(id, m));
      conn.on('close', () => dropPlayer(id, true));
    });
    conn.on('error', () => {});
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); hostRoom(); return; }
    if (net.role === 'host' && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error')) return;
    netStatus(errText(e));
    if (net.role !== 'host') closePeer();
  });
  peer.on('disconnected', () => { if (net.role === 'host') { try { peer.reconnect(); } catch (e) {} } });
}
function joinRoom() {
  const code = $('netCode').value.replace(/\D/g, '').slice(0, 6);
  if (code.length !== 6) { netStatus('Код кімнати складається з 6 цифр'); return; }
  if (netBlocked()) { netStatus(`Гра з друзями працює на сайті гри: ${SITE}`); return; }
  net.name = cleanName($('netName').value); setNameTag(net.name);
  netStatus('Під\'єднуюсь…');
  let peer;
  try { peer = new Peer(undefined, peerOpts()); } catch (e) { netStatus('Не вдалося під\'єднатися. Спробуй ще раз.'); return; }
  net.peer = peer;
  clearTimeout(net.joinTimer);
  net.joinTimer = setTimeout(() => { if (net.role !== 'guest') { netStatus('Не вдалося під\'єднатися. Перевір код і чи відкрита кімната.'); closePeer(); } }, 15000);
  peer.on('open', () => {
    const conn = peer.connect(PEER_PREFIX + code, { reliable: true });
    net.conn = conn;
    conn.on('open', () => conn.send({ t: 'hello', name: net.name, o: outfit }));
    conn.on('data', m => applyNet(m));
    conn.on('close', () => { if (net.role === 'guest') { toast('Кімната закрилася', 2500); leaveRoom(); } });
    conn.on('error', () => {});
  });
  peer.on('error', e => { netStatus(errText(e)); if (net.role !== 'guest') closePeer(); });
}
function errText(e) {
  if (e.type === 'peer-unavailable') return 'Кімнату з таким кодом не знайдено';
  if (e.type === 'browser-incompatible') return 'Цей браузер не вміє грати разом';
  return 'Не вдалося з\'єднатися. Перевір інтернет і спробуй ще раз.';
}
function closePeer() {
  clearTimeout(net.joinTimer);
  try { if (net.peer) net.peer.destroy(); } catch (e) {}
  net.peer = null; net.conn = null; net.conns.clear();
}
function leaveRoom(quiet) {
  const wasGuest = net.role === 'guest';
  if (net.role !== 'off' && !quiet) netSend({ t: 'leave' });
  closePeer();
  net.players.forEach(P => removeAvatar(P));
  net.players.clear();
  net.role = 'off'; net.myId = 'h'; net.code = '';
  renderNet();
  // a guest goes back to her own world and saved progress
  if (wasGuest) { leaveGame(dim); boot(); }
}

// ---------- messages ----------
function onHostData(id, m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'hello') {
    const P = addPlayer(id, cleanName(m.name), cleanOutfit(m.o));
    const others = [{ id: 'h', name: net.name, o: outfit, ...myState() }].concat([...net.players.values()].filter(q => q.id !== id).map(q => ({ id: q.id, name: q.name, o: q.outfit, d: q.d, x: q.x, y: q.y, z: q.z, f: q.f })));
    net.conns.get(id).send({ t: 'welcome', id, code: net.code, e: [editsByDim[0], editsByDim[1]], h: [...collected], players: others, fu: playerFurniture(), tod: sky.t, night: sky.night });
    net.petsKey = '';
    relay({ t: 'join', id, name: P.name, o: P.outfit }, id);
    toast(`${P.name} приєдналася до гри!`, 2500);
    renderNet();
    return;
  }
  // only everyday game messages are passed on; nothing a guest sends can act as the host
  if (!RELAYED.has(m.t)) return;
  m.id = id;
  applyNet(m);
  relay(m, id);
}
const RELAYED = new Set(['sleep', 'st', 'outfit', 'say', 'block', 'heart', 'raceStart', 'mon', 'hit', 'arenaWin', 'furn', 'pets', 'art', 'artLvl', 'artHi', 'artState', 'leave']);
function kickPlayer(id) {
  const P = net.players.get(id), c = net.conns.get(id);
  if (net.role !== 'host' || !P) return;
  try { if (c && c.open) c.send({ t: 'kicked', id: 'h' }); } catch (e) {}
  setTimeout(() => dropPlayer(id, false), 300);
  toast(`${P.name} більше не в кімнаті`, 2000);
}
function applyNet(m) {
  if (!m || typeof m !== 'object') return;
  const P = m.id && net.players.get(m.id);
  switch (m.t) {
    case 'welcome': return adoptRoom(m);
    case 'full': netStatus('Кімната вже повна'); closePeer(); return;
    case 'kicked': if (net.role === 'guest' && m.id === 'h') { net.role = 'guest'; leaveRoom(true); toast('Тебе попросили вийти з кімнати', 3000); } return;
    case 'furn':
      if ((m.d === 0 || m.d === 1) && [m.x, m.y, m.z].every(Number.isInteger) && inB(m.x, m.y, m.z)) {
        if (m.op === 'add' && FURNITURE[m.type]) { const r = addFurnitureRec(m.d, m.x, m.y, m.z, m.type, m.rot | 0, false); if (r) furnModel(r); if (m.d === dim) rebuildAround(m.x, m.z); }
        if (m.op === 'del') breakFurniture(m.d, I(m.x, m.y, m.z), true);
        if (net.role === 'host') scheduleSave();
      }
      return;
    case 'pets': if (P) setPlayerPets(P, m.l); return;
    case 'sleep': if (net.role === 'host') sky.t = MORNING; if (P) toast(`${P.name} поспала, настав ранок`, 2000); return;
    case 'art': case 'artLvl': case 'artHi': case 'artState': return applyArtNet(m);
    case 'join': if (m.id !== net.myId && !net.players.has(m.id)) { addPlayer(m.id, cleanName(m.name), cleanOutfit(m.o)); toast(`${cleanName(m.name)} приєдналася до гри!`, 2500); renderNet(); } return;
    case 'leave': if (P) { toast(`${P.name} вийшла з гри`, 2000); dropPlayer(m.id, false); } return;
    case 'st': if (P) setPlayerState(P, m); return;
    case 'outfit': if (P) { P.outfit = cleanOutfit(m.o); rebuildAvatar(P); } return;
    case 'say': if (P && Number.isInteger(m.i) && PHRASES[m.i]) { showBubble(P.g, PHRASES[m.i], P); toast(`${P.name}: ${PHRASES[m.i]}`, 1800); } return;
    case 'block': return applyBlock(m);
    case 'heart': if (Number.isInteger(m.h) && m.h >= 0 && m.h < hearts.length) collectHeart(hearts[m.h], true); return;
    // a friend arriving at the track starts a fresh race for everyone there, so the grid matches
    case 'raceStart': if (P && P.d !== D_RACE) { P.d = D_RACE; rebuildAvatar(P); } if (dim === D_RACE) { startRace(); if (m.id) toast('Подружка на трасі! Новий заїзд', 1600); } return;
    case 'mon': return applyMonSnap(m);
    case 'hit': if (typeof m.mid === 'string') applyHit(m.mid); return;
    case 'arenaWin':
      if (dim === D_ARENA && !arena.lead && arena.state !== 'won') {
        arena.state = 'won'; sfx.win(); bigText('Перемога!', 1500);
        setTimeout(() => showResult('Перемога разом!', `Подружки перемогли всіх цукеркових монстриків і набрали ${m.sc | 0} очок.`, () => enterArena()), 1600);
      }
      return;
  }
}
function adoptRoom(m) {
  clearTimeout(net.joinTimer);
  net.role = 'guest'; net.myId = String(m.id); net.code = String(m.code || '');
  leaveGame(dim);
  // the guest plays in the host's world: same generated land plus everything built there
  useDim(D_MAIN); generateMain(); placeHearts();
  useDim(D_CASTLE); generateCastle();
  editsByDim = [{}, {}];
  [0, 1].forEach(d => {
    const ed = (m.e && m.e[d]) || {};
    Object.keys(ed).forEach(k => {
      const i = +k, b = ed[k];
      if (Number.isInteger(i) && i >= 0 && i < SX * SY * SZ && Number.isInteger(b) && (b === 0 || BLOCKS[b])) { worlds[d][i] = b; editsByDim[d][i] = b; }
    });
  });
  collected.clear();
  (m.h || []).forEach(i => { if (Number.isInteger(i) && hearts[i]) collected.add(i); });
  hearts.forEach(h => { if (collected.has(h.id)) scene.remove(h.mesh); });
  PORTALS[0].open = collected.size >= HEART_NEED;
  PORTALS.forEach(P => { if (P.open) placePortal(P); });
  loadFurniture(m.fu);
  settleFurniture();
  if (typeof m.tod === 'number' && Number.isFinite(m.tod)) sky.t = ((m.tod % 1) + 1) % 1;
  if (typeof m.night === 'boolean') sky.night = m.night;
  spawnMobs();
  updateStats();
  (m.players || []).forEach(p => {
    if (!p || p.id === net.myId) return;
    const P = addPlayer(String(p.id).slice(0, 4), cleanName(p.name), cleanOutfit(p.o));
    setPlayerState(P, p, true);
  });
  const host = net.players.get('h');
  const d = host && [D_MAIN, D_CASTLE].includes(host.d) ? host.d : D_MAIN;
  if (host && host.d === d) teleportTo(d, host.x + 1.2, host.y + 0.5, host.z + 1.2);
  else teleportTo(D_MAIN, CX + .5, withDim(D_MAIN, () => surfaceY(CX, CZ)) + 0.01, CZ + .5);
  netStatus(''); renderNet();
  toast(`Ти в кімнаті ${net.code}! Грайте разом`, 3000);
}
function applyBlock(m) {
  const d = m.d, i = m.i, b = m.b;
  if ((d !== D_MAIN && d !== D_CASTLE) || !Number.isInteger(i) || i < 0 || i >= SX * SY * SZ || !Number.isInteger(b) || (b !== 0 && !BLOCKS[b])) return;
  worlds[d][i] = b;
  editsByDim[d][i] = b;
  if (net.role === 'host') scheduleSave();
  if (d === dim) { const x = i % SX, z = Math.floor(i / SX) % SZ; rebuildAround(x, z); }
}

// ---------- other players ----------
function addPlayer(id, name, o) {
  let P = net.players.get(id);
  if (!P) { P = { id, name, outfit: o, d: -1, x: 0, y: 0, z: 0, f: 0, mv: 0, car: null, g: new THREE.Group(), walk: 0, seen: false }; net.players.set(id, P); scene.add(P.g); }
  P.name = name; P.outfit = o;
  rebuildAvatar(P);
  return P;
}
function rebuildAvatar(P) {
  if (P.parts) P.g.remove(P.parts.body);
  P.parts = buildAvatar(P.outfit, P.d);
  P.g.add(P.parts.body);
  if (P.tag) P.g.remove(P.tag);
  P.tag = textSprite(P.name, 1.15, 'rgba(106,76,255,.75)');
  P.tag.position.y = 2.15;
  P.g.add(P.tag);
  if (P.carObj) { scene.remove(P.carObj.g); P.carObj = null; }
}
function removeAvatar(P) { scene.remove(P.g); if (P.carObj) scene.remove(P.carObj.g); (P.petObjs || []).forEach(o => scene.remove(o.g)); P.petObjs = []; }
function dropPlayer(id, announce) {
  const P = net.players.get(id);
  if (net.role === 'host') { const c = net.conns.get(id); net.conns.delete(id); try { if (c) c.close(); } catch (e) {} if (P) relay({ t: 'leave', id }, id); }
  if (!P) return;
  if (announce) toast(`${P.name} вийшла з гри`, 2000);
  removeAvatar(P);
  net.players.delete(id);
  renderNet();
}
function setPlayerState(P, m, snap) {
  if (![m.x, m.y, m.z].every(finite)) return;
  const d = Number.isInteger(m.d) && m.d >= 0 && m.d < NDIMS ? m.d : P.d;
  if (d !== P.d) { P.d = d; rebuildAvatar(P); snap = true; }
  P.x = clamp(m.x, 0, SX); P.y = clamp(m.y, -20, SY + 10); P.z = clamp(m.z, 0, SZ);
  P.f = finite(m.f) ? m.f : P.f; P.mv = m.mv ? 1 : 0;
  P.car = Array.isArray(m.car) && m.car.length === 4 && m.car.every(finite) ? m.car : null;
  // guests keep the host's clock so night falls for everyone together
  if (P.id === 'h' && net.role === 'guest' && finite(m.tod) && Math.abs(m.tod - sky.t) > 0.01) sky.t = ((m.tod % 1) + 1) % 1;
  if (snap || !P.seen) { P.g.position.set(P.x, P.y, P.z); P.seen = true; }
}
function myState() {
  const car = dim === D_RACE && race.player ? [race.player.x, race.player.z, race.player.h, raceProgress(race.player)] : 0;
  return { d: dim, x: pl.p.x, y: pl.p.y, z: pl.p.z, f: pl.facing, mv: Math.hypot(pl.vel.x, pl.vel.z) > 0.6 ? 1 : 0, car };
}
function updateNet(dt) {
  for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.t -= dt; if (b.t <= 0) { b.parent.remove(b.s); bubbles.splice(i, 1); } }
  if (net.role === 'off') return;
  net.sendT -= dt;
  if (net.sendT <= 0) {
    net.sendT = 0.1;
    const s = myState(), r2 = v => Math.round(v * 100) / 100;
    netSend({ t: 'st', d: s.d, x: r2(s.x), y: r2(s.y), z: r2(s.z), f: r2(s.f), mv: s.mv, car: s.car ? s.car.map(r2) : 0, tod: net.role === 'host' ? Math.round(sky.t * 10000) / 10000 : undefined });
    sendPetsIfChanged();
  }
  const k = Math.min(1, dt * 10);
  net.players.forEach(P => {
    const here = P.d === dim;
    const racing = here && dim === D_RACE && P.car;
    P.g.visible = here && !racing;
    if (P.carObj) P.carObj.g.visible = !!racing;
    if (racing) {
      if (!P.carObj) P.carObj = buildCar(pickColor(P), 'angelina');
      const c = P.carObj;
      c.g.position.x += (P.car[0] - c.g.position.x) * k;
      c.g.position.z += (P.car[1] - c.g.position.z) * k;
      c.g.position.y = KH + 1;
      c.g.rotation.y += wrapAngle(P.car[2] - c.g.rotation.y) * k;
      return;
    }
    updatePlayerPets(P, dt, here && dim <= D_CASTLE);
    if (!here) return;
    P.g.position.x += (P.x - P.g.position.x) * k;
    P.g.position.y += (P.y - P.g.position.y) * k;
    P.g.position.z += (P.z - P.g.position.z) * k;
    P.g.rotation.y += wrapAngle(P.f - P.g.rotation.y) * k;
    P.walk = P.mv ? P.walk + dt * 10 : P.walk * 0.8;
    const sw = Math.sin(P.walk) * (P.mv ? 0.7 : 0);
    P.parts.legs[0].rotation.x = sw; P.parts.legs[1].rotation.x = -sw;
    P.parts.arms[0].rotation.x = -sw * 0.8;
    P.parts.arms[1].rotation.x = dim === D_ARENA ? -1.45 : sw * 0.8;
  });
}
function pickColor(P) { return (WARDROBE.dress.items.find(i => i.id === P.outfit.dress) || {}).sw || '#ff4f9a'; }
// remote cars only nudge your own car, never the other way round
function pushFromRemoteCars(c) {
  net.players.forEach(P => {
    if (P.d !== D_RACE || !P.car) return;
    const dx = c.x - P.car[0], dz = c.z - P.car[1], d = Math.hypot(dx, dz);
    if (d > 0.01 && d < 1.9) { c.x += dx / d * (1.9 - d); c.z += dz / d * (1.9 - d); c.speed *= 0.97; }
  });
}
function remoteRacersAhead(myProg) {
  let ahead = 0, total = 0;
  net.players.forEach(P => { if (P.d === D_RACE && P.car) { total++; if (P.car[3] > myProg) ahead++; } });
  return { ahead, total };
}

// ---------- phrases ----------
const bubbles = [];
function showBubble(parent, text, P) {
  bubbles.filter(b => b.parent === parent).forEach(b => { b.t = 0; });
  const s = textSprite(text, 1.3, 'rgba(255,79,154,.92)');
  s.position.y = 2.75;
  parent.add(s);
  bubbles.push({ s, parent, t: 3.2 });
  if (!P) sfx.click();
}
function say(i) {
  showBubble(girl, PHRASES[i]);
  netSend({ t: 'say', i });
}

// ---------- teleport used when joining a friend ----------
function teleportTo(d, x, y, z) {
  switchDim(d);
  pl.p.set(x, y, z); pl.vel.set(0, 0, 0);
  portalLock = true;
  hearts.forEach(h => { const on = d === D_MAIN && !collected.has(h.id); h.mesh.visible = on; });
  curBiome = -1;
  buildGirl();
  applyMode();
  resetChunks(); refreshChunks(pl.p.x, pl.p.z, true); buildCount(9);
  enterGame(d);
}

// ---------- panel ----------
const netPanel = $('netPanel');
function netStatus(text) { $('netStatus').textContent = text; }
function renderNet() {
  const on = net.role !== 'off';
  $('netOff').hidden = on; $('netOn').hidden = !on;
  document.body.classList.toggle('in-room', on);
  const roomTag = $('roomTag');
  roomTag.hidden = !on;
  roomTag.textContent = on ? `Кімната ${net.code} · гравців: ${net.players.size + 1}` : '';
  if (!on) return;
  $('netCodeShow').textContent = net.code;
  const list = $('netPlayers');
  list.textContent = '';
  [{ name: net.name + ' (ти)', host: net.role === 'host' }].concat([...net.players.values()].map(P => ({ id: P.id, name: P.name, host: P.id === 'h' }))).forEach(p => {
    const li = document.createElement('li');
    const who = document.createElement('div'); who.className = 'who';
    const b = document.createElement('b'); b.textContent = p.name;
    const sp = document.createElement('span'); sp.textContent = p.host ? 'створила кімнату' : 'гостя';
    who.append(b, sp); li.appendChild(who);
    // only the girl who made the room can ask someone to leave
    if (net.role === 'host' && p.id && !p.host) {
      const kb = document.createElement('button'); kb.className = 'free'; kb.textContent = 'Вигнати';
      kb.addEventListener('click', () => { kickPlayer(p.id); });
      li.appendChild(kb);
    }
    list.appendChild(li);
  });
}
function openNet() {
  $('netName').value = net.name;
  renderNet();
  netPanel.hidden = false; playing = false;
  if (document.pointerLockElement) document.exitPointerLock();
}
$('netBtn').addEventListener('click', openNet);
$('roomTag').addEventListener('click', openNet);
$('netHost').addEventListener('click', () => { if (net.role === 'off' && !net.peer) hostRoom(); });
$('netJoin').addEventListener('click', () => { if (net.role === 'off' && !net.peer) joinRoom(); });
$('netCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('netJoin').click(); });
$('netClose').addEventListener('click', () => { netPanel.hidden = true; playing = true; netStatus(''); });
$('netBack').addEventListener('click', () => { netPanel.hidden = true; playing = true; if (net.role === 'off') { closePeer(); netStatus(''); } });
$('netLeave').addEventListener('click', () => { leaveRoom(); netStatus('Ти вийшла з кімнати'); });
const phraseMenu = $('phraseMenu');
PHRASES.forEach((p, i) => {
  const b = document.createElement('button'); b.className = 'mitem'; b.textContent = p;
  b.addEventListener('click', () => { say(i); phraseMenu.hidden = true; });
  phraseMenu.appendChild(b);
});
$('phraseBtn').addEventListener('click', e => { e.stopPropagation(); phraseMenu.hidden = !phraseMenu.hidden; setMenu(false); });
addEventListener('pointerdown', e => { if (!phraseMenu.hidden && !e.target.closest('.tools')) phraseMenu.hidden = true; });
addEventListener('beforeunload', () => { if (net.role !== 'off') netSend({ t: 'leave' }); });

// ---------- friends' pets walk behind them ----------
function myPets() {
  return [...friends].map(id => mobs[id]).filter(m => m && m.type !== 'villager').slice(0, 8)
    .map(m => ({ type: m.type, breed: m.breed ? m.breed.id : '', variant: m.variant || '' }));
}
function sendPetsIfChanged() {
  const l = myPets(), key = JSON.stringify(l);
  if (key === net.petsKey) return;
  net.petsKey = key;
  netSend({ t: 'pets', l });
}
function setPlayerPets(P, list) {
  (P.petObjs || []).forEach(o => scene.remove(o.g));
  P.petObjs = [];
  (Array.isArray(list) ? list : []).slice(0, 8).forEach((p, i) => {
    if (!p || !Object.prototype.hasOwnProperty.call(MOB_TYPES, p.type) || p.type === 'villager') return;
    const breed = DUCK_BREEDS.find(b => b.id === p.breed) || DUCK_BREEDS[1];
    const parts = MOB_TYPES[p.type].build({ id: i, breed, variant: p.variant === 'arctic' || p.variant === 'polar' ? p.variant : '' });
    parts.g.position.copy(P.g.position);
    scene.add(parts.g);
    P.petObjs.push({ g: parts.g, legs: parts.legs || [], phase: i });
  });
}
function updatePlayerPets(P, dt, show) {
  (P.petObjs || []).forEach((o, i) => {
    o.g.visible = show;
    if (!show) return;
    const side = (i % 2 ? 1 : -1) * (1 + Math.floor(i / 2) * 0.7), back = 1.6 + Math.floor(i / 2) * 0.9;
    const f = P.g.rotation.y, tx = P.g.position.x - Math.sin(f) * back + Math.cos(f) * side, tz = P.g.position.z - Math.cos(f) * back - Math.sin(f) * side;
    const dx = tx - o.g.position.x, dz = tz - o.g.position.z, d = Math.hypot(dx, dz);
    const k = Math.min(1, dt * 4);
    o.g.position.x += dx * k; o.g.position.z += dz * k;
    o.g.position.y += (surfaceY(Math.floor(o.g.position.x), Math.floor(o.g.position.z)) - o.g.position.y) * Math.min(1, dt * 10);
    if (d > 0.2) o.g.rotation.y += wrapAngle(Math.atan2(dx, dz) - o.g.rotation.y) * k;
    o.phase += dt * (d > 0.3 ? 9 : 0);
    const sw = d > 0.3 ? Math.sin(o.phase) * 0.6 : 0;
    o.legs.forEach((l, j) => { l.rotation.x = (j === 0 || j === 3) ? sw : -sw; });
  });
}

// ---------- one shared picture ----------
function applyArtNet(m) {
  if (dim !== D_ART) return;
  const S = ART.size, W = worlds[D_ART];
  if (m.t === 'artHi') { netSend({ t: 'artState', l: art.level, cells: artCells() }); return; }
  if (m.t === 'artState') {
    if (!art.wantState || !Number.isInteger(m.l) || !PICTURES[m.l] || !Array.isArray(m.cells)) return;
    art.wantState = false;
    art.level = m.l; paintArt();
    m.cells.slice(0, S * S).forEach(([gx, gy, b]) => { if (Number.isInteger(gx) && Number.isInteger(gy) && gx >= 0 && gy >= 0 && gx < S && gy < S && WOOLS.includes(b)) W[I(ART.x0C + gx, ART.y0 + gy, ART.zWall + 1)] = b; });
    rebuildAround(ART.x0C + 3, ART.zWall); rebuildAround(ART.x0C + 6, ART.zWall);
    updateArtHud();
    return;
  }
  if (m.t === 'artLvl') { if (Number.isInteger(m.l) && PICTURES[m.l]) { art.level = m.l; paintArt(); } return; }
  if (m.t === 'art') {
    if (m.l !== art.level || !Number.isInteger(m.x) || !Number.isInteger(m.y) || m.x < 0 || m.y < 0 || m.x >= S || m.y >= S) return;
    if (m.b !== 0 && !WOOLS.includes(m.b)) return;
    W[I(ART.x0C + m.x, ART.y0 + m.y, ART.zWall + 1)] = m.b;
    rebuildAround(ART.x0C + m.x, ART.zWall);
    updateArtHud();
    artCheckDone();
  }
}
function artCells() {
  const S = ART.size, W = worlds[D_ART], out = [];
  for (let gy = 0; gy < S; gy++) for (let gx = 0; gx < S; gx++) { const b = W[I(ART.x0C + gx, ART.y0 + gy, ART.zWall + 1)]; if (b) out.push([gx, gy, b]); }
  return out;
}

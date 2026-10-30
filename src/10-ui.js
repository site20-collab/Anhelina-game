// ---------- HUD ----------
const $ = id => document.getElementById(id);
const toastEl = $('toast'), nameEl = $('blockName'), heartsEl = $('hearts'), friendsEl = $('friends'), biomeEl = $('biome'),
  modeBtn = $('modeBtn'), overlay = $('overlay'), gameHud = $('gameHud'), bigEl = $('bigText'), crossEl = $('cross'),
  compassEl = $('compass'), compassArrow = $('compassArrow'), compassText = $('compassText'), resultEl = $('result');
let toastT = 0, nameT = 0, bigT = 0, playing = false;
function toast(msg, ms = 1600) {
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms);
}
function bigText(msg, ms = 1000) {
  bigEl.textContent = msg; bigEl.classList.add('show');
  clearTimeout(bigT); bigT = setTimeout(() => bigEl.classList.remove('show'), ms);
}
let hudKey = '';
function setGameHud(items, buttons = []) {
  const key = JSON.stringify(items) + buttons.map(b => b[0]).join();
  if (key === hudKey) return;
  hudKey = key;
  gameHud.textContent = '';
  items.forEach(it => {
    const s = document.createElement('span');
    s.className = 'pill' + (it.cls ? ' ' + it.cls : '');
    s.textContent = it.text || it;
    gameHud.appendChild(s);
  });
  buttons.forEach(([label, fn]) => {
    const b = document.createElement('button'); b.textContent = label;
    b.addEventListener('click', e => { e.stopPropagation(); fn(); });
    gameHud.appendChild(b);
  });
}
let resultAgain = null;
function showResult(title, text, again) {
  $('resTitle').textContent = title; $('resText').textContent = text;
  resultAgain = again;
  resultEl.hidden = false; playing = false;
  arena.firing = false;
  if (document.pointerLockElement) document.exitPointerLock();
}
$('resAgain').addEventListener('click', () => { resultEl.hidden = true; playing = true; if (resultAgain) resultAgain(); });
$('resExit').addEventListener('click', () => { resultEl.hidden = true; playing = true; travel(D_CASTLE); });

// ---------- hotbar ----------
let hotbar = HOTBAR_EXPLORE, slots = [];
function setHotbar(list) {
  hotbar = list;
  const el = $('hotbar');
  el.textContent = '';
  const tog = document.createElement('button');
  tog.className = 'inv-toggle';
  tog.addEventListener('click', () => setInventory(!invOpen));
  el.appendChild(tog);
  slots = list.map((b, i) => {
    const btn = document.createElement('button');
    btn.className = 'slot'; btn.title = BLOCKS[b].name; btn.setAttribute('aria-label', BLOCKS[b].name);
    const c = document.createElement('canvas'); c.width = c.height = 16;
    c.getContext('2d').drawImage(atlas, BLOCKS[b].t[1] * 16, 0, 16, 16, 0, 0, 16, 16);
    const num = document.createElement('span'); num.className = 'num'; num.textContent = i < 10 ? (i + 1) % 10 : '';
    btn.append(c, num);
    btn.addEventListener('click', () => { if (!invOpen) { setInventory(true); return; } select(i); setMode(true); canvas.focus({ preventScroll: true }); });
    el.appendChild(btn);
    return btn;
  });
  select(Math.min(selected, list.length - 1), true);
  setInventory(invOpen, true);
}
let invOpen = true;
function setInventory(open, quiet) {
  invOpen = open;
  const el = $('hotbar'), tog = el.querySelector('.inv-toggle');
  el.classList.toggle('collapsed', !open);
  tog.textContent = open ? '‹' : 'Блоки ›';
  tog.setAttribute('aria-label', open ? 'Сховати блоки' : 'Показати блоки');
  if (!quiet) scheduleSave();
}
function select(i, quiet) {
  selected = i;
  slots.forEach((s, j) => s.classList.toggle('sel', j === i));
  if (slots[i]) slots[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (quiet) return;
  nameEl.textContent = BLOCKS[hotbar[selected]].name; nameEl.classList.add('show');
  clearTimeout(nameT); nameT = setTimeout(() => nameEl.classList.remove('show'), 1200);
}
function setMode(b) {
  building = b;
  modeBtn.textContent = b ? 'Будую' : 'Ламаю';
  modeBtn.className = 'tool build-tool ' + (b ? 'build' : 'break');
}
function updateStats() {
  heartsEl.textContent = collected.size >= HEART_NEED ? `♥ ${collected.size} · портал відкрито` : `♥ ${collected.size} / ${HEART_NEED}`;
  friendsEl.textContent = `Друзі: ${friends.size}`;
}
function applyMode() {
  const mode = modeOf(dim);
  document.body.dataset.mode = mode;
  gameHud.hidden = mode === 'explore';
  hudKey = '';
  crossEl.hidden = !(view === 'fp' || mode === 'arena');
  fpGun.visible = view === 'fp' && mode === 'arena';
  setHotbar(mode === 'art' ? HOTBAR_ART : HOTBAR_EXPLORE);
  if (mode !== 'explore') compassEl.hidden = true;
}
function enterGame(d) {
  if (d === D_RACE) { girl.visible = false; shadow.visible = false; startRace(); }
  if (d === D_ART) enterArt();
  if (d === D_ARENA) enterArena();
}
function leaveGame(d) {
  if (d === D_RACE) leaveRace();
  if (d === D_ART) leaveArt();
  if (d === D_ARENA) leaveArena();
}

modeBtn.addEventListener('click', () => { setMode(!building); toast(building ? 'Будуємо!' : 'Ламаємо!', 900); });
$('viewBtn').addEventListener('click', () => { setView(view === 'fp' ? 'tp' : 'fp'); toast(view === 'fp' ? 'Очима Ангеліни' : 'Камера ззаду', 1000); });
$('soundBtn').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.textContent = soundOn ? 'Звук' : 'Тихо'; scheduleSave(); });
$('helpBtn').addEventListener('click', () => { overlay.hidden = false; playing = false; arena.firing = false; if (document.pointerLockElement) document.exitPointerLock(); });
$('wardrobeBtn').addEventListener('click', openWardrobe);
$('wardrobeDone').addEventListener('click', closeWardrobe);
$('exitBtn').addEventListener('click', () => travel(D_CASTLE));
$('playBtn').addEventListener('click', () => {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === 'suspended') actx.resume();
  if (dim === D_RACE && !race.engine) startEngine();
  overlay.hidden = true; playing = true; canvas.focus({ preventScroll: true });
});
let resetArmed = false;
const resetBtn = $('resetBtn');
resetBtn.addEventListener('click', () => {
  if (!resetArmed) {
    resetArmed = true; resetBtn.textContent = 'Точно? Натисни ще раз'; resetBtn.classList.add('warn');
    setTimeout(() => { resetArmed = false; resetBtn.textContent = 'Новий світ'; resetBtn.classList.remove('warn'); }, 3000);
    return;
  }
  resetArmed = false; resetBtn.textContent = 'Новий світ'; resetBtn.classList.remove('warn');
  editsByDim = [{}, {}]; collected.clear(); friends.clear();
  try { localStorage.removeItem(SAVE); } catch (e) {}
  leaveGame(dim);
  boot();
  toast('Новий світ готовий');
});

// ---------- friends panel ----------
const fPanel = $('friendsPanel'), fList = $('fList');
function renderFriends() {
  fList.textContent = '';
  const list = [...friends].map(id => mobs[id]).filter(Boolean);
  $('fEmpty').hidden = list.length > 0;
  $('fAll').hidden = list.length < 2;
  list.forEach(m => {
    const li = document.createElement('li');
    const who = document.createElement('div'); who.className = 'who';
    const b = document.createElement('b'); b.textContent = m.nick;
    const sp = document.createElement('span');
    sp.textContent = `${mobLabel(m)}, ${steps(Math.round(m.e.p.distanceTo(pl.p)))} від тебе`;
    who.append(b, sp);
    const btn = document.createElement('button'); btn.className = 'free'; btn.textContent = 'Відпустити';
    btn.addEventListener('click', () => { release(m); renderFriends(); toast(`${m.nick} іде гуляти`, 1400); });
    li.append(who, btn);
    fList.appendChild(li);
  });
}
friendsEl.addEventListener('click', () => { renderFriends(); fPanel.hidden = false; playing = false; });
$('fClose').addEventListener('click', () => { fPanel.hidden = true; playing = true; canvas.focus({ preventScroll: true }); });
$('fAll').addEventListener('click', () => { [...friends].forEach(id => mobs[id] && release(mobs[id])); renderFriends(); toast('Усі друзі ідуть гуляти', 1400); });

// ---------- input ----------
const keys = {};
let wantJump = false;
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
addEventListener('keydown', e => {
  if (!playing) return;
  keys[e.code] = true;
  if (e.code === 'Space') { if (!e.repeat) jumpBuf = 0.15; wantJump = true; e.preventDefault(); }
  if (e.code.startsWith('Arrow')) e.preventDefault();
  if (e.code === 'KeyV' && !e.repeat) $('viewBtn').click();
  if (dim === D_RACE || dim === D_ARENA) return;
  const m = e.code.match(/^Digit(\d)$/);
  if (m) { select(Math.min(hotbar.length - 1, (+m[1] + 9) % 10)); setMode(true); }
  if (e.code === 'KeyQ' || e.code === 'KeyE') setMode(!building);
  if (e.code === 'KeyB' && !e.repeat) setInventory(!invOpen);
});
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space') wantJump = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; wantJump = false; arena.firing = false; });

const touches = new Map();
let drag = null, mouse = null, pinch = 0;
const locked = () => document.pointerLockElement === canvas;
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  if (!playing) return;
  if (e.pointerType === 'touch') document.body.classList.add('touch');
  if (locked()) {
    if (dim === D_ARENA) { arena.firing = true; arena.fireCenter = true; }
    else if (dim !== D_RACE) tapAt(innerWidth / 2, innerHeight / 2, e.button === 2 ? !building : building);
    return;
  }
  // pointer lock is a bonus: when the page may not lock, dragging still turns the view
  if (view === 'fp' && e.pointerType === 'mouse' && dim !== D_RACE && canvas.requestPointerLock) {
    try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) {}
  }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); drag = null; return; }
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, btn: e.button, type: e.pointerType };
  if (dim === D_ARENA && e.pointerType === 'mouse' && e.button === 0) { arena.firing = true; arena.fireCenter = false; arena.fireX = e.clientX; arena.fireY = e.clientY; }
});
canvas.addEventListener('pointermove', e => {
  if (locked()) {
    if (!playing) return;
    yaw -= e.movementX * 0.0026;
    const [lo, hi] = pitchLimits();
    pitch = clamp(pitch + e.movementY * 0.0026, lo, hi);
    return;
  }
  if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY };
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (touches.size === 2 && pinch) {
    const [a, b] = [...touches.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (view === 'tp') dist = clamp(dist * pinch / d, 2.5, 14);
    pinch = d;
    return;
  }
  if (arena.firing && !arena.fireCenter) { arena.fireX = e.clientX; arena.fireY = e.clientY; }
  if (!drag || drag.id !== e.pointerId) return;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.moved = true;
  if (drag.moved && dim !== D_RACE) {
    const k = view === 'fp' ? 0.005 : 0.007;
    yaw -= (e.clientX - drag.x) * k;
    const [lo, hi] = pitchLimits();
    pitch = clamp(pitch + (e.clientY - drag.y) * (view === 'fp' ? 0.005 : 0.005), lo, hi);
  }
  drag.x = e.clientX; drag.y = e.clientY;
});
function endDrag(e) {
  touches.delete(e.pointerId);
  if (touches.size < 2) pinch = 0;
  if (e.pointerType === 'mouse' && !arena.fireCenter) arena.firing = false;
  if (locked() && dim === D_ARENA) { arena.firing = false; return; }
  if (!drag || drag.id !== e.pointerId) return;
  const tap = !drag.moved && e.type === 'pointerup' && playing;
  if (tap) {
    if (dim === D_ARENA) { if (drag.type !== 'mouse') fireAtScreen(e.clientX, e.clientY); }
    else if (dim !== D_RACE) tapAt(e.clientX, e.clientY, drag.btn === 2 ? !building : building);
  }
  drag = null;
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') mouse = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); if (view === 'tp') dist = clamp(dist * (e.deltaY > 0 ? 1.1 : 0.9), 2.5, 14); }, { passive: false });

// floating joystick: it appears wherever the thumb lands on the left side
const joy = { x: 0, y: 0, id: null, cx: 0, cy: 0 };
const joyZone = $('joyZone'), joyEl = $('joy'), knob = $('knob');
function joyMove(e) {
  const R = 62, max = R - 10;
  let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy;
  const l = Math.hypot(dx, dy);
  if (l > max) { dx *= max / l; dy *= max / l; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  joy.x = dx / max; joy.y = -dy / max;
}
joyZone.addEventListener('pointerdown', e => {
  if (!playing || joy.id !== null) return;
  joy.id = e.pointerId;
  try { joyZone.setPointerCapture(e.pointerId); } catch (err) {}
  const zr = joyZone.getBoundingClientRect();
  joy.cx = e.clientX; joy.cy = e.clientY;
  joyEl.classList.add('floating');
  joyEl.style.left = (e.clientX - zr.left - 62) + 'px';
  joyEl.style.top = (e.clientY - zr.top - 62) + 'px';
  joyMove(e);
});
joyZone.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMove(e); });
const joyEnd = e => {
  if (e.pointerId !== joy.id) return;
  joy.id = null; joy.x = joy.y = 0; knob.style.transform = '';
  joyEl.classList.remove('floating'); joyEl.style.left = ''; joyEl.style.top = '';
};
joyZone.addEventListener('pointerup', joyEnd);
joyZone.addEventListener('pointercancel', joyEnd);
const jumpBtn = $('jumpBtn');
jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jumpBuf = 0.15; wantJump = true; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => jumpBtn.addEventListener(t, () => { wantJump = false; }));
const shootBtn = $('shootBtn');
shootBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (!playing) return; arena.firing = true; arena.fireCenter = true; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => shootBtn.addEventListener(t, () => { arena.firing = false; }));

// ---------- save ----------
const SAVE = 'angelina-world-v3';
let editsByDim = [{}, {}], saveT = 0;
function save() {
  try {
    localStorage.setItem(SAVE, JSON.stringify({ e: editsByDim[0], e2: editsByDim[1], h: [...collected], f: [...friends], o: outfit,
      art: art.level, race: race.best, arena: arena.best, view, sound: soundOn, inv: invOpen }));
  } catch (e) {}
}
function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (!s) return;
    editsByDim = [s.e || {}, s.e2 || {}];
    editsByDim.forEach((ed, d) => { for (const k in ed) worlds[d][+k] = ed[k]; });
    (s.h || []).forEach(i => collected.add(i));
    (s.f || []).forEach(i => friends.add(i));
    if (s.o) Object.assign(outfit, s.o);
    art.level = s.art || 0; race.best = s.race || 0; arena.best = s.arena || 0;
    if (s.view === 'fp') view = 'fp';
    if (s.inv === false) invOpen = false;
    if (s.sound === false) { soundOn = false; $('soundBtn').textContent = 'Тихо'; }
  } catch (e) {}
}

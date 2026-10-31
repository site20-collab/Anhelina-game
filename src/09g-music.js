// ---------- music keys: a giant floor piano and "repeat the tune" ----------
const MUSIC_KEYS = [
  { n: 'До', f: 523.25, b: W_RED, c: '#e8333a' }, { n: 'Ре', f: 587.33, b: W_ORANGE, c: '#ff8a1f' },
  { n: 'Мі', f: 659.25, b: W_YELLOW, c: '#ffd23f' }, { n: 'Фа', f: 698.46, b: W_GREEN, c: '#5fd36a' },
  { n: 'Соль', f: 783.99, b: W_BLUE, c: '#3d9bff' }, { n: 'Ля', f: 880, b: W_PURPLE, c: '#9e61ff' },
  { n: 'Сі', f: 987.77, b: W_PINK, c: '#ff6bbd' }, { n: 'До', f: 1046.5, b: W_WHITE, c: '#ffffff' },
];
const MK = { x0: CX - 8, w: 2, z0: CZ - 3, z1: CZ + 3 };
const music = { state: 'off', seq: [], pos: 0, play: 0, playT: 0, round: 0, cur: -1, glow: [], tries: 0, best: 0, labels: [] };
const MUSIC_ROUNDS = 8;
function generateMusic() {
  flatGround(GRASS, MUSICB);
  fillBox(CX - 11, KH, CZ - 6, CX + 10, KH, CZ + 13, PLANKS);
  MUSIC_KEYS.forEach((k, i) => {
    const x0 = MK.x0 + i * MK.w;
    fillBox(x0, KH, MK.z0, x0 + MK.w - 1, KH, MK.z1, k.b);
  });
  // a little stage wall with notes behind the piano
  fillBox(CX - 11, KH + 1, CZ - 7, CX + 10, KH + 5, CZ - 7, CASTLE);
  for (let x = CX - 10; x <= CX + 9; x += 3) setB(x, KH + 4, CZ - 6, LANTERN);
  [W_PINK, W_PURPLE, W_BLUE, W_YELLOW].forEach((c, i) => fillBox(CX - 7 + i * 4, KH + 2, CZ - 7, CX - 6 + i * 4, KH + 3, CZ - 7, c));
  for (let z = 4; z < SZ - 4; z++) for (let x = 4; x < SX - 4; x++) {
    const d = Math.hypot(x - CX, z - CZ), h = hash(x, z, 96);
    if (d > 20 && d < 100 && h < 0.014) treeOak(x, KH, z, 4 + Math.floor(hash(x, z, 8) * 2), CANDY, h < 0.007 ? PINKLEAVES : LEAVES);
    else if (d > 16 && h < 0.08) setB(x, KH + 1, z, FLOWERS[Math.floor(hash(x, z, 5) * FLOWERS.length)]);
  }
}
function note(i, dur = 0.5) {
  const k = MUSIC_KEYS[i];
  beep(k.f, dur, 'triangle', 0.13); beep(k.f * 2, dur * 0.6, 'sine', 0.03);
  music.glow[i] = 1;
}
function enterMusic() {
  music.labels.forEach(s => scene.remove(s)); music.labels = [];
  music.glowMesh = MUSIC_KEYS.map((k, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(MK.w - 0.1, MK.z1 - MK.z0 + 0.9), new THREE.MeshBasicMaterial({ color: k.c === '#ffffff' ? 0xffe066 : 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(MK.x0 + i * MK.w + MK.w / 2, KH + 1.02, (MK.z0 + MK.z1 + 1) / 2);
    scene.add(m);
    const s = textSprite(k.n, 0.9, 'rgba(43,33,64,.6)');
    s.position.set(MK.x0 + i * MK.w + MK.w / 2, KH + 1.6, MK.z1 + 1.6);
    scene.add(s); music.labels.push(s);
    return m;
  });
  music.glow = MUSIC_KEYS.map(() => 0);
  Object.assign(music, { state: 'free', round: 0, cur: -1, tries: 0 });
  bigText('Музичні клавіші', 1500);
  toast('Стрибай по клавішах і грай музику! Натисни «Повтори мелодію», щоб пограти в гру', 4200);
  updateMusicHud();
}
function leaveMusic() {
  (music.glowMesh || []).forEach(m => scene.remove(m)); music.labels.forEach(s => scene.remove(s));
  music.glowMesh = null; music.labels = []; music.state = 'off';
}
function updateMusicHud() {
  if (dim !== D_MUSIC) return;
  if (music.state === 'free') setGameHud([...(music.best ? [`Рекорд ${music.best} / ${MUSIC_ROUNDS}`] : [])], [['Повтори мелодію', () => musicRound(1)]]);
  else setGameHud([`Мелодія ${music.round} / ${MUSIC_ROUNDS}`, music.state === 'listen' ? 'Слухай…' : `Нотка ${music.pos + 1} / ${music.seq.length}`],
    music.state === 'repeat' ? [['Послухати ще', () => musicListen()]] : []);
}
function musicRound(r) {
  music.round = r;
  if (r === 1) music.seq = [];
  while (music.seq.length < r + 2) {
    let n;
    do n = Math.floor(Math.random() * MUSIC_KEYS.length); while (n === music.seq[music.seq.length - 1]);
    music.seq.push(n);
  }
  music.tries = 0;
  musicListen();
}
function musicListen() {
  music.state = 'listen'; music.play = 0; music.playT = 0.9; music.pos = 0;
  updateMusicHud();
}
function musicKeyAt() {
  if (!pl.onGround || pl.p.z < MK.z0 || pl.p.z > MK.z1 + 1 || Math.abs(pl.p.y - KH - 1) > 0.3) return -1;
  const i = Math.floor((pl.p.x - MK.x0) / MK.w);
  return i >= 0 && i < MUSIC_KEYS.length ? i : -1;
}
function updateMusic(dt) {
  if (music.state === 'off') return;
  const k = musicKeyAt();
  if (k !== music.cur) {
    music.cur = k;
    if (k >= 0) {
      note(k);
      if (music.state === 'repeat') {
        if (k === music.seq[music.pos]) {
          music.pos++;
          if (music.pos === music.seq.length) {
            if (music.round >= MUSIC_ROUNDS) finishMusic(true);
            else { music.state = 'wait'; music.playT = 1.4; setTimeout(() => { sfx.heart(); bigText('Чудово!', 900); }, 300); }
          }
        } else {
          music.tries++;
          sfx.hurt();
          if (music.tries >= 3) finishMusic(false);
          else { toast('Ой, не та нотка. Послухай ще раз', 1600); music.state = 'wait2'; music.playT = 1.2; }
        }
        updateMusicHud();
      }
    }
  }
  if (music.state === 'listen') {
    music.playT -= dt;
    if (music.playT <= 0) {
      if (music.play < music.seq.length) { note(music.seq[music.play], 0.45); music.play++; music.playT = 0.6; }
      else { music.state = 'repeat'; music.pos = 0; bigText('Твоя черга!', 900); updateMusicHud(); }
    }
  } else if (music.state === 'wait' || music.state === 'wait2') {
    music.playT -= dt;
    if (music.playT <= 0) { if (music.state === 'wait') musicRound(music.round + 1); else musicListen(); }
  }
  (music.glowMesh || []).forEach((m, i) => {
    music.glow[i] = Math.max(0, music.glow[i] - dt * 2.2);
    m.material.opacity = music.glow[i] * 0.75;
    m.position.y = KH + 1.02 + music.glow[i] * 0.04;
  });
}
function finishMusic(won) {
  const got = won ? MUSIC_ROUNDS : music.round - 1;
  const newBest = got > music.best;
  music.best = Math.max(music.best, got); scheduleSave();
  music.state = 'free';
  updateMusicHud();
  if (won) sfx.win();
  const stars = got >= MUSIC_ROUNDS ? '★★★' : got >= 4 ? '★★☆' : '★☆☆';
  setTimeout(() => showResult(won ? `Маленька музикантка ${stars}` : `Музичні клавіші ${stars}`,
    won ? `Ангеліна повторила всі ${MUSIC_ROUNDS} мелодій!` : `Повторено мелодій: ${got} з ${MUSIC_ROUNDS}.${newBest ? ' Це новий рекорд!' : ` Рекорд: ${music.best}.`}`,
    () => musicRound(1)), won ? 1400 : 600);
}

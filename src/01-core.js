// ---------- world size & dimensions ----------
const SX = 640, SY = 48, SZ = 640, CS = 32, NCX = SX / CS, NCZ = SZ / CS;
const CX = 320, CZ = 320, SEA = 14, KH = 16;
// 0 big biome world, 1 princess kingdom, then the games: race track, picture workshop, candy arena, hide and seek, cloud jumping
const D_MAIN = 0, D_CASTLE = 1, D_RACE = 2, D_ART = 3, D_ARENA = 4, D_HIDE = 5, D_JUMP = 6,
  D_FISH = 7, D_STARS = 8, D_MEMO = 9, D_MUSIC = 10, D_SLED = 11, NDIMS = 12;
// the two big worlds stay in memory; a game's world is built when you step in and dropped when you leave
const worlds = [], biomeMaps = [];
for (let d = 0; d < NDIMS; d++) { worlds.push(d <= D_CASTLE ? new Uint8Array(SX * SY * SZ) : null); biomeMaps.push(d <= D_CASTLE ? new Uint8Array(SX * SZ) : null); }
function allocDim(d) { if (!worlds[d]) { worlds[d] = new Uint8Array(SX * SY * SZ); biomeMaps[d] = new Uint8Array(SX * SZ); } }
function freeDim(d) { if (d > D_CASTLE) { worlds[d] = null; biomeMaps[d] = null; } }
let dim = D_MAIN, world = worlds[0], biomeMap = biomeMaps[0];
function useDim(d) { world = worlds[d]; biomeMap = biomeMaps[d]; }
function withDim(d, fn) {
  const pw = world, pb = biomeMap;
  useDim(d);
  try { return fn(); } finally { world = pw; biomeMap = pb; }
}
const MODES = { [D_RACE]: 'race', [D_ART]: 'art', [D_ARENA]: 'arena', [D_HIDE]: 'hide', [D_JUMP]: 'jump', [D_FISH]: 'fish', [D_STARS]: 'stars', [D_MEMO]: 'memo', [D_MUSIC]: 'music', [D_SLED]: 'sled' };
const modeOf = d => MODES[d] || 'explore';
const I = (x, y, z) => x + SX * (z + SZ * y);
const inB = (x, y, z) => x >= 0 && x < SX && y >= 0 && y < SY && z >= 0 && z < SZ;
const get = (x, y, z) => inB(x, y, z) ? world[I(x, y, z)] : 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

// ---------- blocks ----------
const GRASS = 1, DIRT = 2, STONE = 3, SAND = 4, LOG = 5, LEAVES = 6, CANDY = 7, MAGIC = 8, BRICK = 9, PLANKS = 10,
  SNOW = 11, GOLD = 12, WATER = 13, CACTUS = 14, SNOWGRASS = 15, PINKGRASS = 16, PINE = 17, PINKLEAVES = 18,
  RED = 19, YELLOW = 20, TALLGRASS = 21, ICE = 22, CASTLE = 23, ROOF = 24, CARPET = 25,
  CORNFLOWER = 26, LAVENDER = 27, DAISY = 28, TULIP = 29, SUNFLOWER = 30, MARIGOLD = 31,
  ASPHALT = 32, ROADLINE = 33, KERB = 34, CHECKER = 35, BOOST = 36,
  W_RED = 37, W_ORANGE = 38, W_YELLOW = 39, W_GREEN = 40, W_BLUE = 41, W_PURPLE = 42, W_PINK = 43, W_WHITE = 44, W_BLACK = 45, W_BROWN = 46,
  FURN = 47, LANTERN = 48, GRAVEL = 49, SANDSTONE = 50, WHEAT = 51, CLOUD = 52, DRYGRASS = 53, BAMBOO = 54, ACACIA = 55;
const FLOWERS = [RED, YELLOW, CORNFLOWER, LAVENDER, DAISY, TULIP, SUNFLOWER, MARIGOLD];
const WOOLS = [W_RED, W_ORANGE, W_YELLOW, W_GREEN, W_BLUE, W_PURPLE, W_PINK, W_WHITE, W_BLACK, W_BROWN];
// t: [top, side, bottom] tiles; k: 0 solid, 1 water, 2 plant, 3 furniture (solid, drawn as a model), 4 glowing
const blk = (name, t, c, k = 0) => ({ name, t: Array.isArray(t) ? t : [t, t, t], c, k });
const BLOCKS = [null,
  blk('Трава', [0, 1, 2], '#67b845'),
  blk('Земля', 2, '#8a5a33'),
  blk('Камінь', 3, '#8d9299'),
  blk('Пісок', 4, '#e9d494'),
  blk('Колода', [6, 5, 6], '#7a5230'),
  blk('Листя', 7, '#3f9b3a'),
  blk('Цукерка', 8, '#ff8cc6'),
  blk('Чарівний', 9, '#9a7bff'),
  blk('Цегла', 10, '#b4543c'),
  blk('Дошки', 11, '#c79856'),
  blk('Сніг', 12, '#f2f4fa'),
  blk('Золото', 13, '#f4c23f'),
  blk('Вода', 14, '#3d8fe0', 1),
  blk('Кактус', [16, 15, 16], '#3e9a3c'),
  blk('Сніжна трава', [12, 17, 2], '#f2f4fa'),
  blk('Рожева трава', [18, 19, 2], '#ff9fd2'),
  blk('Ялинка', 20, '#1f5e3a'),
  blk('Рожеве листя', 21, '#ff7dc0'),
  blk('Мак', 22, '#ff4040', 2),
  blk('Кульбабка', 23, '#ffd23f', 2),
  blk('Травичка', 24, '#5fae3f', 2),
  blk('Лід', 25, '#bfe6ff'),
  blk('Замкова стіна', 26, '#f6f0fa'),
  blk('Дах', 27, '#ff6fae'),
  blk('Килим', 28, '#e0315f'),
  blk('Волошка', 29, '#4a7bff', 2),
  blk('Лаванда', 30, '#9b6bd6', 2),
  blk('Ромашка', 31, '#ffffff', 2),
  blk('Тюльпан', 32, '#ff5fa2', 2),
  blk('Соняшник', 33, '#ffcc1f', 2),
  blk('Чорнобривці', 34, '#ff8a1f', 2),
  blk('Асфальт', 35, '#4a4d55'),
  blk('Розмітка', 36, '#f2f2f2'),
  blk('Бордюр', 37, '#e8333a'),
  blk('Шахівниця', 38, '#222222'),
  blk('Прискорювач', 39, '#ffd23f'),
  blk('Червоний', 40, '#e8333a'),
  blk('Помаранчевий', 41, '#ff8a1f'),
  blk('Жовтий', 42, '#ffd23f'),
  blk('Зелений', 43, '#3bb54a'),
  blk('Синій', 44, '#3d7be0'),
  blk('Фіолетовий', 45, '#8a4fd8'),
  blk('Рожевий', 46, '#ff7ab8'),
  blk('Білий', 47, '#f7f7f7'),
  blk('Чорний', 48, '#2a2630'),
  blk('Коричневий', 49, '#8a5a33'),
  blk('Меблі', 49, '#c79856', 3),
  blk('Ліхтарик', 50, '#ffe27a', 4),
  blk('Стежка', 51, '#b9a98e'),
  blk('Пісковик', [52, 53, 52], '#e3c98d'),
  blk('Пшениця', 54, '#e6c35a', 2),
  blk('Хмаринка', 55, '#ffffff'),
  blk('Суха трава', [56, 57, 2], '#d9c26a'),
  blk('Бамбук', 58, '#7cbf3a', 2),
  blk('Листя акації', 59, '#5f9a2e'),
];
const NT = 64;
const OPQ = new Uint8Array(64), SOLID = new Uint8Array(64);
BLOCKS.forEach((b, i) => { if (b && (b.k === 0 || b.k === 4)) OPQ[i] = 1; if (b && (b.k === 0 || b.k === 3 || b.k === 4)) SOLID[i] = 1; });
const isOpaque = b => OPQ[b] === 1;
const isPlant = b => b > 0 && BLOCKS[b] && BLOCKS[b].k === 2;
const opaqueAt = (x, y, z) => OPQ[get(x, y, z)] === 1;
function solidAt(x, y, z) {
  if (x < 0 || x >= SX || z < 0 || z >= SZ || y < 0) return true;
  if (y >= SY) return false;
  return SOLID[world[I(x, y, z)]] === 1;
}
const HOTBAR_EXPLORE = [PLANKS, CANDY, MAGIC, SNOW, BRICK, GOLD, CASTLE, ROOF, CARPET, ICE, WATER, LANTERN, GRAVEL, SANDSTONE, CLOUD,
  W_RED, W_ORANGE, W_YELLOW, W_GREEN, W_BLUE, W_PURPLE, W_PINK, W_WHITE, W_BLACK,
  GRASS, PINKGRASS, DRYGRASS, SAND, STONE, LOG, LEAVES, PINKLEAVES, ACACIA, CACTUS, BAMBOO, ...FLOWERS, WHEAT];
const HOTBAR_ART = WOOLS;

// ---------- noise ----------
function hash(x, z, s) {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, z, sc, s) {
  const fx = x / sc, fz = z / sc, x0 = Math.floor(fx), z0 = Math.floor(fz);
  const tx = fx - x0, tz = fz - z0, ux = tx * tx * (3 - 2 * tx), uz = tz * tz * (3 - 2 * tz);
  const a = hash(x0, z0, s), b = hash(x0 + 1, z0, s), c = hash(x0, z0 + 1, s), d = hash(x0 + 1, z0 + 1, s);
  const top = a + (b - a) * ux, bot = c + (d - c) * ux;
  return top + (bot - top) * uz;
}

// ---------- texture atlas ----------
function makeAtlas() {
  const cv = document.createElement('canvas');
  cv.width = 16 * NT; cv.height = 16;
  const g = cv.getContext('2d');
  let s = 12345;
  const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const dirt = () => r() < .1 ? '#6b4426' : '#8a5a33';
  const stem = (x, y, top) => (x >= 7 && x <= 8 && y >= top) ? (y === 11 && x === 8 ? '#5cbf4f' : '#3f9b3a') : ((x === 9 || x === 10) && y === 11) ? '#5cbf4f' : null;
  const flower = (petal, mid) => (x, y) => {
    const st = stem(x, y, 7);
    if (st) return st;
    const d = Math.hypot(x - 7.5, y - 4.5);
    return d < 1.3 ? mid : d < 3.4 ? petal : null;
  };
  const wool = c => () => r() < .12 ? c + 'd' : c;
  const tiles = [
    () => r() < .12 ? '#4f9a35' : r() < .08 ? '#86d860' : '#67b845',
    (x, y) => (y < 3 || (y === 3 && r() < .5)) ? '#5fae3f' : dirt(),
    () => r() < .12 ? '#6b4426' : r() < .06 ? '#a77a4e' : '#8a5a33',
    () => r() < .15 ? '#74787f' : r() < .08 ? '#a5aab1' : '#8d9299',
    () => r() < .1 ? '#d9c27c' : '#e9d494',
    (x, y) => (x % 4 === 0 || ((x + (y >> 2)) % 5 === 0 && r() < .3)) ? '#5c3c20' : '#7a5230',
    (x, y) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); return d > 6.5 ? '#7a5230' : (Math.floor(d) % 2 ? '#c09460' : '#a57b4a'); },
    () => r() < .15 ? '#2c7a2a' : r() < .1 ? '#5cbf4f' : '#3f9b3a',
    (x, y) => ((x + y) % 6 < 2) ? '#ffd6ec' : '#ff8cc6',
    () => r() < .05 ? '#ffffff' : r() < .15 ? '#8466f0' : '#9a7bff',
    (x, y) => { if (y % 4 === 3) return '#d8cbb6'; const off = (Math.floor(y / 4) % 2) * 4; return (x + off) % 8 === 7 ? '#d8cbb6' : '#b4543c'; },
    (x, y) => y % 4 === 3 ? '#8c6534' : ((x + Math.floor(y / 4) * 5) % 11 === 0 ? '#a9803f' : '#c79856'),
    () => r() < .08 ? '#dde3ee' : '#f2f4fa',
    (x, y) => (x === 0 || y === 0) ? '#fff1b0' : (x === 15 || y === 15) ? '#c8941d' : r() < .1 ? '#ffe27a' : '#f4c23f',
    (x, y) => ((y + (x >> 2)) % 5 === 0 && r() < .7) ? '#7cc0f5' : '#3d8fe0',
    (x) => r() < .05 ? '#eef5c8' : (x % 4 === 1 ? '#2d7a2e' : '#3e9a3c'),
    (x, y) => (x === 0 || y === 0 || x === 15 || y === 15) ? '#2d7a2e' : (r() < .1 ? '#4aa548' : '#5cb85a'),
    (x, y) => (y < 3 || (y === 3 && r() < .5)) ? '#f2f4fa' : dirt(),
    () => r() < .12 ? '#ffc4e6' : r() < .08 ? '#f07ab8' : '#ff9fd2',
    (x, y) => (y < 3 || (y === 3 && r() < .5)) ? '#ff9fd2' : dirt(),
    () => r() < .15 ? '#164a2c' : r() < .1 ? '#2a7548' : '#1f5e3a',
    () => r() < .15 ? '#e85ea8' : r() < .12 ? '#ffb0dc' : '#ff7dc0',
    flower('#ff4040', '#ffd23f'),
    flower('#ffd23f', '#ff8a1f'),
    (x, y) => { const tall = 4 + Math.floor(hash(x, 1, 99) * 9); return (x % 3 !== 2 && y >= 16 - tall) ? (r() < .3 ? '#4f9a35' : '#6cc04a') : null; },
    (x, y) => ((x + y) % 7 === 0 || ((x + y) % 7 === 1 && r() < .5)) ? '#e8f6ff' : '#bfe6ff',
    (x, y) => { if (y % 4 === 3) return '#d9cde8'; const off = (Math.floor(y / 4) % 2) * 4; return (x + off) % 8 === 7 ? '#d9cde8' : (r() < .08 ? '#ece4f4' : '#f6f0fa'); },
    (x, y) => (y % 4 === 3 || ((x + (Math.floor(y / 4) % 2) * 2) % 4 === 0 && y % 4 === 2)) ? '#d94f8c' : (r() < .1 ? '#ff8cc0' : '#ff6fae'),
    (x) => (x <= 1 || x >= 14) ? '#f4c23f' : (r() < .1 ? '#c9264f' : '#e0315f'),
    flower('#4a7bff', '#2b3fae'),
    (x, y) => { const st = stem(x, y, 6); if (st) return st; return (y >= 1 && y <= 9 && Math.abs(x - 7.5) <= 2 && (x + y) % 2 === 0) ? (y < 4 ? '#c7a3f0' : '#9b6bd6') : null; },
    flower('#ffffff', '#ffd23f'),
    (x, y) => { const st = stem(x, y, 8); if (st) return st; if (y >= 3 && y <= 8 && x >= 5 && x <= 10) { if (y === 3 && (x === 6 || x === 9)) return null; return (y < 5 && (x === 7 || x === 8)) ? '#ff9fc8' : '#ff5fa2'; } return null; },
    (x, y) => { const st = stem(x, y, 9); if (st) return st; const d = Math.hypot(x - 7.5, y - 4.5); return d < 2.1 ? '#6b4426' : d < 4.4 ? '#ffcc1f' : null; },
    flower('#ff8a1f', '#c4500e'),
    () => r() < .12 ? '#3e4148' : r() < .08 ? '#5a5d66' : '#4a4d55',
    () => r() < .1 ? '#e2e2e2' : '#f7f7f7',
    (x, y) => ((x + y) >> 2) % 2 ? '#e8333a' : '#ffffff',
    (x, y) => ((x >> 2) + (y >> 2)) % 2 ? '#222222' : '#f4f4f4',
    (x, y) => ((y + Math.abs(x - 7.5)) % 8 < 3) ? '#ff7a1a' : '#ffd23f',
    wool('#e8333a'), wool('#ff8a1f'), wool('#ffd23f'), wool('#3bb54a'), wool('#3d7be0'),
    wool('#8a4fd8'), wool('#ff7ab8'), wool('#f7f7f7'), wool('#2a2630'), wool('#8a5a33'),
    (x, y) => (x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || y === 7) ? '#5a3e26' : (Math.hypot(x - 7.5, y - 7.5) < 4 ? '#fff6b0' : '#ffd84a'),
    () => r() < .2 ? '#9a8c74' : r() < .15 ? '#cfc1a4' : '#b9a98e',
    () => r() < .1 ? '#d6b979' : '#e3c98d',
    (x, y) => y % 5 === 4 ? '#c9a868' : (r() < .08 ? '#d6b979' : '#e3c98d'),
    (x, y) => { if (x % 3 === 1 && y >= 5) return y < 7 ? '#d9a93a' : '#8fae3c'; if (x % 3 === 1 && y >= 2 && y < 5) return '#e6c35a'; return null; },
    (x, y) => (r() < .1 ? '#eef3ff' : '#ffffff'),
    () => r() < .14 ? '#c4aa52' : r() < .08 ? '#e8d47e' : '#d9c26a',
    (x, y) => (y < 3 || (y === 3 && r() < .5)) ? '#d9c26a' : dirt(),
    (x, y) => (x >= 6 && x <= 9) ? (y % 5 === 0 ? '#4f8a24' : (x === 6 ? '#9ad35a' : '#7cbf3a')) : ((y % 5 === 1 && (x === 10 || x === 11 || x === 4 || x === 5)) ? '#6aa835' : null),
    () => r() < .18 ? '#4a7e22' : r() < .12 ? '#79b443' : '#5f9a2e',
  ];
  tiles.forEach((fn, t) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let col = fn(x, y);
      if (!col) continue;
      let k = 1 + (r() - .5) * .12;
      if (col.length === 8) { col = col.slice(0, 7); k *= 0.93; }
      const c = hex(col);
      g.fillStyle = `rgb(${c.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).join(',')})`;
      g.fillRect(t * 16 + x, y, 1, 1);
    }
  });
  return cv;
}

// ---------- three.js setup ----------
const canvas = document.getElementById('game');
// the canvas is see-through only where the castle TV shows a video playing behind it
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
// the layer for web pages shown inside the world (the castle TV); made when first needed
const cssScene = new THREE.Scene();
let cssRenderer = null;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const skyColor = new THREE.Color(0x9fd8ff), skyTarget = new THREE.Color(0x9fd8ff);
const waterFog = new THREE.Color(0x2f6fb5);
scene.background = skyColor.clone();
scene.fog = new THREE.Fog(skyColor.clone(), 40, 100);
const camera = new THREE.PerspectiveCamera(65, 1, 0.08, 260);
scene.add(camera);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 0.55);
sun.position.set(0.6, 1, 0.35);
scene.add(sun);

const atlas = makeAtlas();
const tex = new THREE.CanvasTexture(atlas);
tex.magFilter = THREE.NearestFilter;
tex.minFilter = THREE.NearestFilter;
tex.generateMipmaps = false;
const opaqueMat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true });
// water gets its own tiling texture so it can ripple
const waterTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#3d8fe0'; g.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 40; i++) { const x = (i * 37) % 32, y = (i * 13) % 32, w = 3 + (i % 5); g.fillStyle = i % 3 ? '#62a8ee' : '#9ccaf6'; g.fillRect(x, y, w, 1); g.fillRect((x + 16) % 32, (y + 9) % 32, w - 1, 1); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
})();
const waterMat = new THREE.MeshLambertMaterial({ map: waterTex, vertexColors: true, transparent: true, opacity: 0.74, depthWrite: false, side: THREE.DoubleSide });
const plantMat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
// flowers and grass sway in the wind
const windTime = { value: 0 };
plantMat.onBeforeCompile = sh => {
  sh.uniforms.windTime = windTime;
  sh.vertexShader = 'uniform float windTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nfloat sway = step(0.5, uv.y);\ntransformed.x += sway * sin(windTime * 1.8 + position.x * 0.7 + position.z * 0.45) * 0.07;\ntransformed.z += sway * cos(windTime * 1.5 + position.x * 0.4 + position.z * 0.8) * 0.05;');
};
const glowMat = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true });
const MATS = [opaqueMat, waterMat, plantMat, glowMat];

// ---------- chunk meshing ----------
const FACES = [
  { dir: [-1, 0, 0], corners: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]] },
  { dir: [1, 0, 0],  corners: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]] },
  { dir: [0, -1, 0], corners: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]] },
  { dir: [0, 1, 0],  corners: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]] },
  { dir: [0, 0, -1], corners: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]] },
  { dir: [0, 0, 1],  corners: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]] },
];
const PLANT_QUADS = [
  [[.15, 0, .15, 0, 0], [.85, 0, .85, 1, 0], [.15, 1, .15, 0, 1], [.85, 1, .85, 1, 1]],
  [[.85, 0, .15, 0, 0], [.15, 0, .85, 1, 0], [.85, 1, .15, 0, 1], [.15, 1, .85, 1, 1]],
];
const AO = [0.5, 0.68, 0.84, 1];
const newBuf = () => ({ pos: [], nor: [], uv: [], col: [], idx: [] });
const tileU = (tile, u) => (tile + 0.002 + u * 0.996) / NT;
const v3 = [0, 0, 0];
function addFace(Bf, x, y, z, f, tile, ao, lowerTop) {
  const [dx, dy, dz] = f.dir;
  const a = dx ? 0 : dy ? 1 : 2, ua = (a + 1) % 3, va = (a + 2) % 3;
  const n = x + dx, m = y + dy, o = z + dz, base = Bf.pos.length / 3;
  for (const c of f.corners) {
    Bf.pos.push(x + c[0], y + (lowerTop && c[1] === 1 ? 0.88 : c[1]), z + c[2]);
    Bf.nor.push(dx, dy, dz);
    // water tiles by world position so the ripples run across neighbouring blocks
    if (tile < 0) Bf.uv.push(((a === 0 ? z + c[2] : x + c[0])) * 0.5, ((a === 1 ? z + c[2] : y + c[1])) * 0.5);
    else Bf.uv.push(tileU(tile, c[3]), 0.002 + c[4] * 0.996);
    let br = 1;
    if (ao) {
      const su = c[ua] ? 1 : -1, sv = c[va] ? 1 : -1;
      v3[0] = n; v3[1] = m; v3[2] = o; v3[ua] += su; const s1 = opaqueAt(v3[0], v3[1], v3[2]) ? 1 : 0;
      v3[0] = n; v3[1] = m; v3[2] = o; v3[va] += sv; const s2 = opaqueAt(v3[0], v3[1], v3[2]) ? 1 : 0;
      v3[0] = n; v3[1] = m; v3[2] = o; v3[ua] += su; v3[va] += sv; const cr = opaqueAt(v3[0], v3[1], v3[2]) ? 1 : 0;
      br = AO[s1 && s2 ? 0 : 3 - (s1 + s2 + cr)];
    }
    Bf.col.push(br, br, br);
  }
  Bf.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
}
function addPlant(Bf, x, y, z, tile) {
  for (const q of PLANT_QUADS) {
    const base = Bf.pos.length / 3;
    for (const c of q) {
      Bf.pos.push(x + c[0], y + c[1], z + c[2]);
      Bf.nor.push(0, 1, 0);
      Bf.uv.push(tileU(tile, c[3]), 0.002 + c[4] * 0.996);
      Bf.col.push(0.92, 0.92, 0.92);
    }
    Bf.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
}
const VIEW = matchMedia('(pointer: coarse)').matches ? 3 : 4;
const chunkMeshes = [];
const built = new Uint8Array(NCX * NCZ);
let buildQueue = [], chunkKey = -1, camChunkX = 0, camChunkZ = 0;
function setMesh(k, i, Bf) {
  chunkMeshes[k] = chunkMeshes[k] || [];
  let mesh = chunkMeshes[k][i];
  if (mesh) mesh.geometry.dispose();
  if (!Bf.idx.length) {
    if (mesh) { mesh.geometry = new THREE.BufferGeometry(); mesh.visible = false; mesh.userData.has = false; }
    return;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(Bf.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(Bf.nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(Bf.uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(Bf.col, 3));
  geo.setIndex(Bf.idx);
  if (mesh) mesh.geometry = geo;
  else {
    mesh = chunkMeshes[k][i] = new THREE.Mesh(geo, MATS[i]);
    if (i === 1) mesh.renderOrder = 1;
    scene.add(mesh);
  }
  mesh.userData.has = true;
  mesh.visible = true;
}
function buildChunk(cx, cz) {
  const O = newBuf(), W = newBuf(), P = newBuf(), G = newBuf();
  for (let y = 0; y < SY; y++) for (let z = cz * CS; z < cz * CS + CS; z++) for (let x = cx * CS; x < cx * CS + CS; x++) {
    const b = world[I(x, y, z)];
    if (!b) continue;
    const def = BLOCKS[b];
    if (def.k === 2) { addPlant(P, x, y, z, def.t[1]); continue; }
    if (def.k === 3) continue;
    if (def.k === 1) {
      const lower = get(x, y + 1, z) !== WATER;
      for (const f of FACES) {
        const nb = get(x + f.dir[0], y + f.dir[1], z + f.dir[2]);
        if (nb === WATER || isOpaque(nb)) continue;
        addFace(W, x, y, z, f, -1, false, lower);
      }
      continue;
    }
    if (def.k === 4) {
      for (const f of FACES) if (!opaqueAt(x + f.dir[0], y + f.dir[1], z + f.dir[2])) addFace(G, x, y, z, f, def.t[1], false, false);
      continue;
    }
    for (const f of FACES) {
      const dy = f.dir[1];
      if (opaqueAt(x + f.dir[0], y + dy, z + f.dir[2])) continue;
      addFace(O, x, y, z, f, dy === 1 ? def.t[0] : dy === -1 ? def.t[2] : def.t[1], true, false);
    }
  }
  const k = cx + cz * NCX;
  setMesh(k, 0, O); setMesh(k, 1, W); setMesh(k, 2, P); setMesh(k, 3, G);
  built[k] = 1;
}
function disposeChunk(k) {
  const a = chunkMeshes[k];
  if (a) a.forEach(m => { if (m) { m.geometry.dispose(); m.geometry = new THREE.BufferGeometry(); m.visible = false; m.userData.has = false; } });
  built[k] = 0;
}
function resetChunks() {
  for (let k = 0; k < NCX * NCZ; k++) if (built[k]) disposeChunk(k);
  chunkKey = -1; buildQueue = [];
}
// keeps only the chunks around the player built, so a big world stays light on phones
function refreshChunks(px, pz, force) {
  const ccx = Math.floor(px / CS), ccz = Math.floor(pz / CS), key = ccx * 1000 + ccz;
  if (key === chunkKey && !force) return;
  chunkKey = key; camChunkX = ccx; camChunkZ = ccz;
  buildQueue = [];
  for (let cz = 0; cz < NCZ; cz++) for (let cx = 0; cx < NCX; cx++) {
    const k = cx + cz * NCX, d = Math.max(Math.abs(cx - ccx), Math.abs(cz - ccz));
    if (d > VIEW + 1) { if (built[k]) disposeChunk(k); continue; }
    if (d <= VIEW && !built[k]) buildQueue.push([cx, cz, Math.hypot(cx - ccx, cz - ccz)]);
    const a = chunkMeshes[k];
    if (a) a.forEach(m => { if (m) m.visible = !!built[k] && m.userData.has && d <= VIEW; });
  }
  buildQueue.sort((a, b) => a[2] - b[2]);
}
function buildFor(ms) {
  const t0 = performance.now();
  while (buildQueue.length) {
    const [cx, cz] = buildQueue.shift();
    buildChunk(cx, cz);
    if (performance.now() - t0 > ms) break;
  }
}
function buildCount(n) { while (n-- > 0 && buildQueue.length) { const [cx, cz] = buildQueue.shift(); buildChunk(cx, cz); } }
function rebuildAround(x, z) {
  const set = new Set();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, nz = z + dz;
    if (nx < 0 || nx >= SX || nz < 0 || nz >= SZ) continue;
    const k = Math.floor(nx / CS) + Math.floor(nz / CS) * NCX;
    if (built[k]) set.add(k);
  }
  set.forEach(k => buildChunk(k % NCX, Math.floor(k / NCX)));
}

// ---------- clouds ----------
const clouds = [];
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false });
for (let i = 0; i < 60; i++) {
  const g = new THREE.Group();
  const n = 2 + Math.floor(hash(i, 1, 21) * 3);
  for (let j = 0; j < n; j++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(3 + hash(i, j, 22) * 6, 1, 2 + hash(i, j, 23) * 4), cloudMat);
    m.position.set(j * 2.5 - n, 0, (hash(i, j, 24) - .5) * 3);
    g.add(m);
  }
  g.position.set(CX + hash(i, 2, 25) * 360 - 180, SY + 6 + hash(i, 3, 26) * 5, CZ + hash(i, 4, 27) * 360 - 180);
  scene.add(g); clouds.push(g);
}

// ---------- model helpers ----------
const matCache = {};
const M = c => matCache[c] || (matCache[c] = new THREE.MeshLambertMaterial({ color: c }));
const jellyCache = {};
const MJ = c => jellyCache[c] || (jellyCache[c] = new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: 0.82 }));
const boxGeos = {};
function boxGeo(w, h, d) { const k = w + ',' + h + ',' + d; return boxGeos[k] || (boxGeos[k] = new THREE.BoxGeometry(w, h, d)); }
function box(w, h, d, c, x, y, z, parent, mat) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat || M(c));
  m.position.set(x, y, z); parent.add(m); return m;
}
function pivot(x, y, z, parent) { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; }
function textSprite(text, size = 1, bg = 'rgba(43,33,64,.62)') {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const font = 'bold 52px Nunito, system-ui, sans-serif';
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 64;
  c.width = w; c.height = 96;
  g.font = font;
  g.fillStyle = bg;
  g.beginPath(); g.roundRect ? g.roundRect(4, 8, w - 8, 80, 40) : g.rect(4, 8, w - 8, 80); g.fill();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, 50);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  s.scale.set(size * w / 96 * 0.33, size * 0.33, 1);
  return s;
}
const heartGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.25);
  s.bezierCurveTo(0, 0.3, -0.05, 0.4, -0.2, 0.4);
  s.bezierCurveTo(-0.45, 0.4, -0.45, 0.15, -0.45, 0.15);
  s.bezierCurveTo(-0.45, 0, -0.3, -0.2, 0, -0.4);
  s.bezierCurveTo(0.3, -0.2, 0.45, 0, 0.45, 0.15);
  s.bezierCurveTo(0.45, 0.15, 0.45, 0.4, 0.2, 0.4);
  s.bezierCurveTo(0.05, 0.4, 0, 0.3, 0, 0.25);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 8 });
  g.center();
  return g;
})();
const heartMat = new THREE.MeshLambertMaterial({ color: 0xff3d8b, emissive: 0x88123f });

// ---------- particles ----------
const parts = [], floaters = [];
const pGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
function burst(x, y, z, color, n, colors) {
  for (let i = 0; i < n; i++) {
    const c = colors ? colors[i % colors.length] : color;
    const m = new THREE.Mesh(pGeo, new THREE.MeshLambertMaterial({ color: c }));
    m.position.set(x + 0.5 + (Math.random() - .5) * .6, y + 0.5 + (Math.random() - .5) * .6, z + 0.5 + (Math.random() - .5) * .6);
    m.userData.v = new THREE.Vector3((Math.random() - .5) * 4, Math.random() * 4 + 1, (Math.random() - .5) * 4);
    m.userData.life = .6 + Math.random() * .3;
    scene.add(m); parts.push(m);
  }
}
function sparkle(x, y, z) {
  const m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: ['#ffffff', '#ff9fd2', '#c9a8ff', '#ffe27a'][Math.floor(Math.random() * 4)] }));
  m.position.set(x, y, z);
  m.userData.v = new THREE.Vector3((Math.random() - .5) * .4, 0.6 + Math.random() * .6, (Math.random() - .5) * .4);
  m.userData.life = 0.8 + Math.random() * .5;
  m.userData.g = 0;
  scene.add(m); parts.push(m);
}
function floatHeart(x, y, z) {
  const m = new THREE.Mesh(heartGeo, heartMat);
  m.position.set(x, y, z); m.scale.setScalar(0.45); m.userData.life = 1.2;
  scene.add(m); floaters.push(m);
}
function updateParticles(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const m = parts[i], u = m.userData;
    u.life -= dt; u.v.y -= (u.g ?? 15) * dt;
    m.position.addScaledVector(u.v, dt);
    m.scale.setScalar(Math.max(0.01, Math.min(1, u.life * 1.6)));
    if (u.life <= 0) { scene.remove(m); m.material.dispose(); parts.splice(i, 1); }
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const m = floaters[i];
    m.userData.life -= dt;
    m.position.y += dt * 1.2;
    m.rotation.y += dt * 4;
    m.scale.setScalar(Math.max(0.01, 0.45 * Math.min(1, m.userData.life * 2)));
    if (m.userData.life <= 0) { scene.remove(m); floaters.splice(i, 1); }
  }
}

// ---------- sound ----------
let actx = null, soundOn = true;
function beep(freq, dur, type, vol, slide, delay = 0) {
  if (!soundOn || !actx) return;
  const t = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  brk: () => beep(170, .14, 'square', .05, .5),
  place: () => beep(420, .08, 'triangle', .1, 1.3),
  jump: () => beep(300, .12, 'sine', .06, 1.7),
  heart: () => { beep(660, .15, 'triangle', .1, 1, 0); beep(880, .15, 'triangle', .1, 1, .1); beep(1320, .25, 'triangle', .1, 1, .2); },
  pet: () => beep(700, .18, 'sine', .08, 1.4),
  friend: () => { beep(523, .15, 'sine', .1, 1, 0); beep(784, .2, 'sine', .1, 1, .12); },
  win: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => beep(f, .22, 'triangle', .1, 1, i * .14)),
  portal: () => [392, 523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, .3, 'sine', .07, 1, i * .07)),
  shoot: () => beep(900, .07, 'square', .03, 1.8),
  hit: () => beep(520, .09, 'triangle', .07, .6),
  poof: () => { beep(320, .2, 'sine', .08, 2.5); beep(640, .15, 'triangle', .05, 2, .05); },
  hurt: () => beep(220, .25, 'sawtooth', .05, .5),
  tick: () => beep(440, .15, 'square', .06),
  go: () => beep(880, .35, 'square', .07),
  boost: () => beep(300, .35, 'sawtooth', .04, 3),
  click: () => beep(1200, .04, 'square', .03),
};

const steps = n => {
  const d = n % 10, h = n % 100;
  return `${n} ${d === 1 && h !== 11 ? 'крок' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'кроки' : 'кроків'}`;
};
const fmtTime = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

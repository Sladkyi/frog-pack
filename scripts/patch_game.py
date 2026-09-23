import re

path = 'c:/Users/User/Documents/ChatGPT/go w go/game.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Header to prepend
header = """'use strict';
const { TYPES, makeItem, merge, damage, shots, power } = PackCore;
function bagSize(){return state.bagSize||3;}
function canPlace(items,item,x,y,ignoreId=item.id){return PackCore.canPlace(items,item,x,y,ignoreId,bagSize());}
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
let W = 900, H = 348, time = 0, last = 0, uiTick = 0, toastTimer, announceTimer;
let state, selected = null, soundOn = false, audioCtx, mergedId = null;
let suppressClickUntil = 0;
const atlas = assetImage('sprites-v2.png',true);
const forest = assetImage('forest-v2.png',true);
const biomeBgs = [
  forest,
  assetImage('bg-mushroom-v1.png'),
  assetImage('bg-autumn-v1.png'),
  assetImage('bg-crystal-v1.png'),
  assetImage('bg-ember-v1.png'),
  assetImage('bg-frost-v1.png')
];
const BIOMES = [
  { id: 'forest', name: 'СУМЕРЕЧНЫЙ ЛЕС', img: forest, particles: { color: '#f8edab85', count: 7, size: 1.3, speed: .25 } },
  { id: 'mushroom', name: 'ГРИБНАЯ ЧАЩА', img: biomeBgs[1], particles: { color: '#67e8f990', count: 10, size: 1.6, speed: .2 } },
  { id: 'autumn', name: 'ДРЕВНЯЯ РОЩА', img: biomeBgs[2], particles: { color: '#fbbf2490', count: 9, size: 2.0, speed: .3 } },
  { id: 'crystal', name: 'КРИСТАЛЬНЫЙ РАЗЛОМ', img: biomeBgs[3], particles: { color: '#38bdf895', count: 11, size: 1.5, speed: .18 } },
  { id: 'ember', name: 'ОГНЕННЫЕ ПУСТОШИ', img: biomeBgs[4], particles: { color: '#ff602095', count: 10, size: 1.8, speed: .35 } },
  { id: 'frost', name: 'МОРОЗНЫЕ ПИКИ', img: biomeBgs[5], particles: { color: '#e0f2fe95', count: 14, size: 1.7, speed: .28 } }
];
function waveBiomeIndex(wave = (state ? state.wave : 1)) {
  if (wave <= 3) return 0;
  if (wave <= 7) return 1;
  if (wave <= 10) return 2;
  if (wave <= 14) return 3;
  if (wave <= 17) return 4;
  return 5;
}
function currentBiomeAssets() {
  const assets = [];
  const curIdx = state ? (state.currentBiome || 0) : 0;
  const tgtIdx = state ? (state.targetBiome ?? curIdx) : 0;
  if (biomeBgs[curIdx]) assets.push(biomeBgs[curIdx]);
  if (tgtIdx !== curIdx && biomeBgs[tgtIdx]) assets.push(biomeBgs[tgtIdx]);
  return assets;
}
const heroAtlas = new Image(); // Retained only for legacy fallback code; not downloaded.
let iconSerial = 0;
// Explicit source rectangles preserve feet and halos in the hand-drawn atlas.
const spriteRegions = [
  [[0, 20, 313, 330], [313, 20, 314, 330], [627, 20, 313, 330], [940, 20, 314, 330]],
  [[10, 403, 300, 279], [320, 403, 292, 279], [620, 350, 327, 330], [958, 466, 296, 216]],
  [[18, 690, 290, 263], [347, 711, 248, 244], [644, 682, 305, 285], [969, 711, 280, 252]],
  [[24, 953, 284, 275], [330, 981, 290, 270], [635, 970, 308, 280], [946, 978, 308, 276]]
];
// A released drag must not click a new control that appears under the pointer.
document.addEventListener('click', e => {
  if (Date.now() < suppressClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
const spriteCells = { axe: [0, 2], shuriken: [1, 2], wand: [2, 2], storm: [3, 2], blade: [0, 3], chest: [3, 1] };
function drawSprite(col, row, x, y, width, height = width) {
  if (!atlas.complete || !atlas.naturalWidth) return false;
  const [sx, sy, sw, sh] = spriteRegions[row][col];
  const fit = Math.min(width / sw, height / sh), dw = sw * fit, dh = sh * fit;
"""

# Strip out corrupted leading lines until drawSprite body
pattern = r"^[\s\S]*?ctx\.drawImage\(atlas, sx, sy, sw, sh"
content = re.sub(pattern, header + "  ctx.drawImage(atlas, sx, sy, sw, sh", content)

# Check reset()
if 'state.currentBiome' not in content:
    content = content.replace(
        "bossSpawned: false };",
        "bossSpawned: false, currentBiome: 0, targetBiome: 0, biomeBlend: 0 };"
    )

# Check updateUI()
old_biome_ui = "$('biome').textContent = `${chapterIndex()+1}/3 · ${CHAPTERS[chapterIndex()]}`;"
new_biome_ui = "const curBiomeName = (BIOMES[state.currentBiome || 0] || BIOMES[0]).name; $('biome').textContent = `${chapterIndex()+1}/3 · ${curBiomeName}`;"
if old_biome_ui in content:
    content = content.replace(old_biome_ui, new_biome_ui)

# Check update(dt)
old_update = "updateRun(dt);\n  if (state.mode === 'paused') return;"
new_update = """updateRun(dt);
  if (state.mode === 'paused') return;
  const targetIdx = waveBiomeIndex(state.wave);
  if (state.targetBiome !== targetIdx) state.targetBiome = targetIdx;
  if (state.currentBiome !== state.targetBiome) {
    const speed = (state.phase === 'travel' || state.phase === 'depart') ? 1.5 : 0.6;
    state.biomeBlend = Math.min(1, (state.biomeBlend || 0) + dt * speed);
    if (state.biomeBlend >= 1) { state.currentBiome = state.targetBiome; state.biomeBlend = 0; }
  } else { state.biomeBlend = 0; }"""
if old_update in content:
    content = content.replace(old_update, new_update)

# Check background()
old_bg_block = """function background() {
  if (forest.complete && forest.naturalWidth) {
    const tileWidth = H * forest.naturalWidth / forest.naturalHeight;
    const scroll = state.distance * 7, firstTile = Math.floor(scroll / tileWidth), offset = scroll % tileWidth;
    // Mirrored neighbors share exact edge pixels, avoiding a visible loop seam.
    for (let i = 0; i * tileWidth - offset < W; i++) {
      const x = i * tileWidth - offset;
      ctx.save(); ctx.translate(x, 0);
      if ((firstTile + i) % 2) { ctx.translate(tileWidth, 0); ctx.scale(-1, 1); }
      ctx.drawImage(forest, 0, 0, tileWidth + .5, H); ctx.restore();
    }
    if (chapterIndex()>0) { ctx.fillStyle = chapterIndex()===1?'#50315338':'#164b5540'; ctx.fillRect(0, 0, W, H); }
    for (let i = 0; i < 7; i++) {
      const px = ((i * 137 - scroll * .25) % (W + 30) + W + 30) % (W + 30);
      const py = H * .18 + (i * 43 % (H * .4)) + Math.sin(time + i) * 6;
      ellipse(px, py, 1.3, 1.3, '#f8edab85');
    }
    return;
  }"""

new_bg_block = """function drawTiledBg(img, alpha = 1.0) {
  if (!img || !img.complete || !img.naturalWidth || alpha <= 0.001) return false;
  const tileWidth = H * img.naturalWidth / img.naturalHeight;
  const scroll = state.distance * 7, firstTile = Math.floor(scroll / tileWidth), offset = scroll % tileWidth;
  ctx.save();
  if (alpha < 0.999) ctx.globalAlpha = alpha;
  for (let i = 0; i * tileWidth - offset < W; i++) {
    const x = i * tileWidth - offset;
    ctx.save(); ctx.translate(x, 0);
    if ((firstTile + i) % 2) { ctx.translate(tileWidth, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, 0, 0, tileWidth + .5, H); ctx.restore();
  }
  ctx.restore();
  return true;
}
function renderBiomeParticles(cur, nxt, blend) {
  const scroll = state.distance * 7;
  const pCur = cur.particles, pNxt = nxt.particles;
  const count = Math.round(pCur.count * (1 - blend) + pNxt.count * blend);
  for (let i = 0; i < count; i++) {
    const spd = (pCur.speed * (1 - blend) + pNxt.speed * blend);
    const px = ((i * 137 - scroll * spd) % (W + 30) + W + 30) % (W + 30);
    let py = H * .18 + (i * 43 % (H * .42));
    if (cur.id === 'ember' || nxt.id === 'ember') {
      py = (py - (time * 25 + i * 22) % (H * .6) + H * .6) % (H * .6) + H * .15;
    } else if (cur.id === 'frost' || nxt.id === 'frost') {
      py = (py + (time * 30 + i * 18) % (H * .6)) % (H * .6) + H * .15;
    } else {
      py += Math.sin(time * 1.5 + i) * 6;
    }
    const size = pCur.size * (1 - blend) + pNxt.size * blend;
    const col = blend < 0.5 ? pCur.color : pNxt.color;
    ellipse(px, py, size, size, col);
  }
}
function background() {
  const curIdx = state ? (state.currentBiome || 0) : 0;
  const tgtIdx = state ? (state.targetBiome ?? curIdx) : 0;
  const cur = BIOMES[curIdx] || BIOMES[0];
  const nxt = BIOMES[tgtIdx] || cur;
  const rawBlend = state ? (state.biomeBlend || 0) : 0;
  const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);

  const drawnCur = drawTiledBg(cur.img, 1.0);
  if (drawnCur && cur !== nxt && blend > 0) {
    drawTiledBg(nxt.img, blend);
  }
  if (drawnCur) {
    renderBiomeParticles(cur, nxt, blend);
    return;
  }"""

if old_bg_block in content:
    content = content.replace(old_bg_block, new_bg_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated game.js successfully!")

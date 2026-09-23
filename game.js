'use strict';
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
  assetImage('bg-02-mountains.png'),
  assetImage('bg-03-brook.png'),
  assetImage('bg-04-market.png'),
  assetImage('bg-05-castle.png'),
  assetImage('bg-06-cave.png'),
  assetImage('bg-07-swamp.png'),
  assetImage('bg-08-village.png'),
  assetImage('bg-09-desert.png'),
  assetImage('bg-10-crypt.png'),
  assetImage('bg-11-snow.png'),
  assetImage('bg-12-windmills.png'),
  assetImage('bg-13-bamboo.png'),
  assetImage('bg-14-volcano.png'),
  assetImage('bg-15-temple.png'),
  assetImage('bg-16-gardens.png'),
  assetImage('bg-17-coast.png'),
  assetImage('bg-18-forge.png'),
  assetImage('bg-19-skyislands.png'),
  assetImage('bg-20-throneroom.png')
];
const forgeTiles = [
  biomeBgs[18]
];
/** Feet sit on each biome's dirt/stone path (forest reference ≈ 0.79). */
const BIOME_GROUND_Y = [
  0.798, 0.787, 0.720, 0.786, 0.680, 0.745, 0.784, 0.790, 0.760, 0.860,
  0.802, 0.820, 0.860, 0.820, 0.807, 0.788, 0.800, 0.800, 0.770, 0.761
];
// Tall stages keep the authored cast. A short phone stage shrinks it with the forest.
function castScale(){
  return Math.min(128, Math.max(72, H * .32)) / 128;
}
function groundY() {
  const cur = state ? (state.currentBiome || 0) : 0;
  const tgt = state ? (state.targetBiome ?? cur) : cur;
  const raw = state ? (state.biomeBlend || 0) : 0;
  const t = raw * raw * (3 - 2 * raw);
  const a = BIOME_GROUND_Y[cur] ?? 0.79, b = BIOME_GROUND_Y[tgt] ?? a;
  return H * (a * (1 - t) + b * t);
}
/** Inventory carried into the next level after a win. */
let carryBag = null;
function cloneBag(items) {
  return items.map(i => ({ id: i.id, type: i.type, level: i.level, w: i.w, h: i.h, x: i.x, y: i.y }));
}
function rebagItems(items, size) {
  const next = [];
  for (const src of items) {
    const item = { id: src.id, type: src.type, level: src.level, w: src.w, h: src.h, x: src.x, y: src.y };
    const fits = item.x >= 0 && item.y >= 0 && item.x + item.w <= size && item.y + item.h <= size && PackCore.canPlace(next, item, item.x, item.y, item.id, size);
    if (!fits) {
      let placed = false;
      for (let rot = 0; rot < 2 && !placed; rot++) {
        for (let y = 0; y < size && !placed; y++) for (let x = 0; x < size && !placed; x++) {
          if (PackCore.canPlace(next, item, x, y, item.id, size)) { item.x = x; item.y = y; placed = true; }
        }
        if (!placed) [item.w, item.h] = [item.h, item.w];
      }
      if (!placed) continue;
    }
    next.push(item);
  }
  if (!next.some(i => !TYPES[i.type].gear)) return null;
  return next;
}
const BIOMES = [
  { id: 'forest', name: 'TWILIGHT FOREST', img: forest, weather: { kind: 'fireflies', color: '#f8edab90', count: 14, size: 1.6, speed: .22, veil: null }, particles: { color: '#f8edab85', count: 7, size: 1.3, speed: .25 } },
  { id: 'mountains', name: 'OLD BRIDGE AND BROOK', img: biomeBgs[1], noMirror: true, weather: { kind: 'rain', color: '#d8e8f8', count: 70, size: 1.35, speed: .55, wind: .4, veil: '#d0dce818' }, particles: { color: '#67e8f985', count: 8, size: 1.4, speed: .22 } },
  { id: 'brook', name: 'HOME POND BANK', img: biomeBgs[2], noMirror: true, weather: { kind: 'clear', color: '#86efac80', count: 8, size: 1.3, speed: .2, veil: null }, particles: { color: '#86efac85', count: 8, size: 1.5, speed: .2 } },
  { id: 'market', name: 'BARON ROOT CAVE', img: biomeBgs[3], noMirror: true, weather: { kind: 'spores', color: '#fed7aa90', count: 16, size: 1.5, speed: .14, veil: '#3a2a1814' }, particles: { color: '#fed7aa80', count: 7, size: 1.4, speed: .18 } },
  { id: 'castle', name: 'WILD SWAMP AND REEDS', img: biomeBgs[4], weather: { kind: 'drizzle', color: '#d8e8f8', count: 48, size: 1.2, speed: .4, wind: .3, veil: '#c8d4b814' }, particles: { color: '#a3e63585', count: 9, size: 1.6, speed: .2 } },
  { id: 'cave', name: 'VILLAGE GARDEN AND PLOT', img: biomeBgs[5], weather: { kind: 'pollen', color: '#fde04790', count: 18, size: 1.4, speed: .2, veil: null }, particles: { color: '#fde04780', count: 7, size: 1.3, speed: .22 } },
  { id: 'swamp', name: 'MILL ROAD', img: biomeBgs[6], weather: { kind: 'clear', color: '#fef08a80', count: 10, size: 1.3, speed: .28, veil: null }, particles: { color: '#fef08a85', count: 9, size: 1.4, speed: .25 } },
  { id: 'village', name: 'MANOR GARDEN AND GROVE', img: biomeBgs[7], weather: { kind: 'petals', color: '#f9a8d4aa', count: 16, size: 2.2, speed: .18, wind: .4, veil: null }, particles: { color: '#86efac80', count: 8, size: 1.5, speed: .2 } },
  { id: 'desert', name: 'CASTLE YARD AT SUNSET', img: biomeBgs[8], noMirror: true, weather: { kind: 'dust', color: '#fb923c88', count: 20, size: 1.4, speed: .32, wind: .55, veil: '#c45a2014' }, particles: { color: '#fb923c85', count: 8, size: 1.5, speed: .18 } },
  { id: 'crypt', name: 'MANOR STONE WALLS', img: biomeBgs[9], weather: { kind: 'clear', color: '#cbd5e180', count: 8, size: 1.2, speed: .2, veil: null }, particles: { color: '#94a3b885', count: 8, size: 1.4, speed: .2 } },
  { id: 'snow', name: 'FARM YARD', img: biomeBgs[10], weather: { kind: 'chaff', color: '#f5e6c8aa', count: 18, size: 1.5, speed: .25, wind: .45, veil: null }, particles: { color: '#fed7aa85', count: 7, size: 1.3, speed: .2 } },
  { id: 'windmills', name: 'GARDEN BY THE BOG', img: biomeBgs[11], noMirror: true, weather: { kind: 'drizzle', color: '#d8e8f8', count: 48, size: 1.2, speed: .45, wind: .28, veil: '#c8d4b814' }, particles: { color: '#a3e63580', count: 8, size: 1.5, speed: .18 } },
  { id: 'bamboo', name: 'ROYAL ARENA', img: biomeBgs[12], noMirror: true, weather: { kind: 'dust', color: '#e7d3a088', count: 22, size: 1.3, speed: .3, wind: .5, veil: '#8a704012' }, particles: { color: '#fde04785', count: 8, size: 1.5, speed: .22 } },
  { id: 'volcano', name: 'OLD POND AND LILIES', img: biomeBgs[13], noMirror: true, weather: { kind: 'clear', color: '#5eead480', count: 8, size: 1.3, speed: .18, veil: null }, particles: { color: '#5eead485', count: 9, size: 1.5, speed: .2 } },
  { id: 'temple', name: 'KINGDOM GREEN MEADOWS', img: biomeBgs[14], weather: { kind: 'pollen', color: '#bbf7d090', count: 20, size: 1.35, speed: .24, veil: null }, particles: { color: '#86efac85', count: 9, size: 1.4, speed: .25 } },
  { id: 'gardens', name: 'DEEP CLAWED WOODS', img: biomeBgs[15], weather: { kind: 'fireflies', color: '#f8edab90', count: 16, size: 1.7, speed: .2, veil: '#1a281810' }, particles: { color: '#f8edab80', count: 8, size: 1.6, speed: .22 } },
  { id: 'coast', name: 'CASTLE KNIGHT HALL', img: biomeBgs[16], weather: { kind: 'dust', color: '#fdba7488', count: 12, size: 1.2, speed: .12, veil: '#1a12080e' }, particles: { color: '#fb923c85', count: 7, size: 1.5, speed: .15 } },
  { id: 'forge', name: 'ARMORY CHAMBER', img: biomeBgs[17], weather: { kind: 'dust', color: '#94a3b888', count: 14, size: 1.25, speed: .14, veil: '#10182012' }, particles: { color: '#94a3b885', count: 8, size: 1.4, speed: .18 } },
  { id: 'skyislands', name: 'UNDERGROUND FORGE', img: forgeTiles[0], imgs: forgeTiles, noMirror: true, weather: { kind: 'embers', color: '#fdba74ee', count: 28, size: 1.7, speed: .18, veil: '#3a180810' }, particles: { color: '#fdba7495', count: 11, size: 1.6, speed: .28 } },
  { id: 'throneroom', name: 'ANCIENT CRYPT AND TOMB', img: biomeBgs[19], weather: { kind: 'dust', color: '#94a3b888', count: 12, size: 1.2, speed: .1, veil: '#1e293b1a' }, particles: { color: '#94a3b890', count: 8, size: 1.5, speed: .15 } }
];
function biomeTileImages(biome) {
  if (!biome) return [];
  if (biome.imgs && biome.imgs.length) return biome.imgs;
  return biome.img ? [biome.img] : [];
}
function stageBiomeIndex(stageIndex = state?.stageIndex ?? 0) {
  const n = Math.max(0, Math.floor(Number(stageIndex) || 0)) % BIOMES.length;
  // Open on the rainy bridge; forest takes the second slot.
  if (n === 0) return 1;
  if (n === 1) return 0;
  return n;
}
/** One full background per level; after 20 levels the cycle repeats. */
function waveBiomeIndex(wave = (state ? state.wave : 1)) {
  const w = Math.max(1, Math.floor(Number(wave) || 1));
  const stageIndex = STAGES.findIndex(s => w >= s.firstWave && w <= s.lastWave);
  if (stageIndex >= 0) return stageBiomeIndex(stageIndex);
  if (state && Number.isInteger(state.stageIndex)) return stageBiomeIndex(state.stageIndex);
  return stageBiomeIndex(w - 1);
}
function currentBiomeAssets() {
  const assets = [];
  const curIdx = state ? (state.currentBiome || 0) : 0;
  const tgtIdx = state ? (state.targetBiome ?? curIdx) : 0;
  for (const idx of [curIdx, tgtIdx]) {
    for (const img of biomeTileImages(BIOMES[idx])) assets.push(img);
  }
  return assets;
}
const heroAtlas = new Image();
let iconSerial = 0;
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
  ctx.drawImage(atlas, sx, sy, sw, sh, x + (width - dw) / 2, y + height - dh, dw, dh);
  return true;
}
let best = 0;
try { best = Number(localStorage.getItem('packrun-best')) || 0; } catch (_) {}
$('best').textContent = `${best} m`;
// Fresh ids: the item serial restarts on reload and must not collide with saved pieces.
function sanitizeBag(raw,cleared){
  if(!raw||!Number.isInteger(raw.stage)||raw.stage<0||raw.stage>Math.min(cleared,STAGES.length-1)||!Array.isArray(raw.items))return null;
  const items=[];
  for(const src of raw.items){
    const def=TYPES[src?.type];
    if(!def||!Number.isInteger(src.level)||src.level<1||src.level>4)continue;
    const item=makeItem(src.type,src.level);
    if(src.w===def.h&&src.h===def.w)[item.w,item.h]=[def.h,def.w];
    item.x=Number.isInteger(src.x)?src.x:-1;item.y=Number.isInteger(src.y)?src.y:-1;
    items.push(item);
  }
  return items.some(i=>!TYPES[i.type].gear)?{stage:raw.stage,items}:null;
}
function savedBag(index){return progress.bag&&progress.bag.stage===index?progress.bag.items:null;}
function loadProgress(){
  try{
    const saved=JSON.parse(localStorage.getItem('packrun-levels-v1'));
    const cleared=Number.isInteger(saved?.cleared)?Math.max(0,Math.min(STAGES.length,saved.cleared)):0;
    const upgrades={...PackCore.defaultUpgrades()};
    for(const key of Object.keys(upgrades))upgrades[key]=Math.max(0,Math.min(PackCore.UPGRADE_DEFS[key].max,Math.floor(Number(saved?.upgrades?.[key])||0)));
    return {cleared,selected:Number.isInteger(saved?.selected)?Math.max(0,Math.min(cleared,STAGES.length-1,saved.selected)):Math.min(cleared,STAGES.length-1),
      stars:STAGES.map((_,i)=>i<cleared?Math.max(1,Math.min(3,Math.floor(Number(saved?.stars?.[i])||1))):0),
      upgrades,essence:Math.max(0,Math.floor(Number(saved?.essence)||0)),bag:sanitizeBag(saved?.bag,cleared)};
  }catch(_){return {cleared:0,selected:0,stars:STAGES.map(()=>0),upgrades:PackCore.defaultUpgrades(),essence:0};}
}
let progress=loadProgress(),menuSelection=progress.selected,menuPage=Math.floor(progress.selected/10),menuReturnMode=null;
function saveProgress(){try{localStorage.setItem('packrun-levels-v1',JSON.stringify(progress));}catch(_){}}
function stageUnlocked(index){return Number.isInteger(index)&&index>=0&&index<STAGES.length&&index<=progress.cleared;}
const evolutionArt = assetImage('evolution-v1.png',true);
const equipmentArt = assetImage('equipment-v1.png');
const glyphWeaponsArt = assetImage('glyph-weapons-v1.png');
function itemRegion(type,level=1) {
  const glyph=['scythe','hammer','orb','dagger','tome'];
  if(glyph.includes(type)){
    const row=glyph.indexOf(type),cols=4,rows=5;
    const sheet=glyphWeaponsArt,iw=sheet.naturalWidth||864,ih=sheet.naturalHeight||1152;
    const cw=iw/cols,ch=ih/rows;
    return {sheet,path:assetPath('glyph-weapons-v1.png'),x:(level-1)*cw,y:row*ch,w:cw,h:ch,iw,ih};
  }
  const original=['axe','shuriken','wand','storm','blade'],extra=['bow','spear','bomb','armor','boots'];
  const old=original.includes(type),row=(old?original:extra).indexOf(type);
  if(row<0)return null;
  const bounds=old?[0,277,536,817,1062,1402]:[0,292,560,837,1110,1402];
  return {sheet:old?evolutionArt:equipmentArt,path:assetPath(old?'evolution-v1.png':'equipment-v1.png'),x:(level-1)*280.5,y:bounds[row],w:280.5,h:bounds[row+1]-bounds[row],iw:1122,ih:1402};
}
const GLYPH_WEAPONS=new Set(['scythe','hammer','orb','dagger','tome']);
function drawWeaponGlyph(type,level=1,x=0,y=0,size=40,centered=false){
  // Prefer the generated atlas; canvas glyphs are only a last-resort fallback.
  if(!GLYPH_WEAPONS.has(type))return false;
  const r=itemRegion(type,level);
  if(r?.sheet?.complete&&r.sheet.naturalWidth){
    const s=size, ox=centered?-s/2:x, oy=centered?-s/2:y;
    ctx.drawImage(r.sheet,r.x,r.y,r.w,r.h,ox,oy,s,s);return true;
  }
  const c=TYPES[type].color, s=size, ox=centered?-s/2:x, oy=centered?-s/2:y;
  ctx.save();ctx.translate(ox+s/2,oy+s/2);ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=Math.max(1.6,s*.045);ctx.strokeStyle='#3a2a18';
  if(type==='scythe'){
    ctx.fillStyle='#8b6a3e';ctx.fillRect(-s*.04,-s*.08,s*.08,s*.42);ctx.strokeRect(-s*.04,-s*.08,s*.08,s*.42);
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(s*.02,-s*.1);ctx.quadraticCurveTo(s*.38,-s*.42,s*.42,s*.02);ctx.quadraticCurveTo(s*.22,-s*.12,s*.02,-s*.02);ctx.closePath();ctx.fill();ctx.stroke();
  } else if(type==='hammer'){
    ctx.fillStyle='#8b6a3e';ctx.fillRect(-s*.05,-s*.05,s*.1,s*.42);ctx.strokeRect(-s*.05,-s*.05,s*.1,s*.42);
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-s*.28,-s*.38);ctx.lineTo(s*.28,-s*.38);ctx.lineTo(s*.28,-s*.1);ctx.lineTo(-s*.28,-s*.1);ctx.closePath();ctx.fill();ctx.stroke();
  } else if(type==='orb'){
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,s*.28,s*.28,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.ellipse(-s*.08,-s*.08,s*.1,s*.1,0,0,Math.PI*2);ctx.fill();
  } else if(type==='dagger'){
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-s*.4);ctx.lineTo(s*.12,s*.05);ctx.lineTo(0,s*.12);ctx.lineTo(-s*.12,s*.05);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#8b6a3e';ctx.fillRect(-s*.05,s*.1,s*.1,s*.18);ctx.strokeRect(-s*.05,s*.1,s*.1,s*.18);
  } else if(type==='tome'){
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-s*.28,-s*.32);ctx.lineTo(s*.28,-s*.32);ctx.lineTo(s*.28,s*.28);ctx.lineTo(-s*.28,s*.28);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f4ecd0';ctx.fillRect(-s*.16,-s*.18,s*.32,s*.08);ctx.strokeRect(-s*.16,-s*.18,s*.32,s*.08);
    for(let i=0;i<level;i++){ctx.fillRect(-s*.14,s*(.02+i*.08),s*.28,s*.04);}
  }
  ctx.restore();return true;
}
function drawItemArt(item,x,y,size) {
  if(GLYPH_WEAPONS.has(item.type))return drawWeaponGlyph(item.type,item.level,x,y,size,false);
  const r=itemRegion(item.type,item.level);
  if(r&&r.sheet.complete&&r.sheet.naturalWidth){ctx.drawImage(r.sheet,r.x,r.y,r.w,r.h,x,y,size,size);return true;}
  if(typeof WeaponIcons !== 'undefined' && WeaponIcons.hasIcon(item.type)) {
    return WeaponIcons.drawWeaponIconCanvas(ctx, item.type, x, y, size);
  }
  return false;
}
function icon(type,level=1) {
  let x,y,w,h,path,iw,ih;
  if(type==='chest'){const [col,row]=spriteCells[type];[x,y,w,h]=spriteRegions[row][col];path=assetPath('sprites-v2.png');iw=ih=1254;}
  else {
    const r=itemRegion(type,level);
    if(r){({x,y,w,h,path}=r);iw=r.iw||1122;ih=r.ih||1402;}
    else if(typeof WeaponIcons !== 'undefined' && WeaponIcons.hasIcon(type)) {
      return WeaponIcons.getWeaponIconSvg(type, { level, className: 'sprite-icon', size: 36 });
    } else {
      return `<span class="sprite-icon">${type}</span>`;
    }
  }
  const clip=`item-crop-${++iconSerial}`;
  // Explicit square + meet: WebKit otherwise sizes from the full atlas <image> and clips the art.
  return `<svg class="sprite-icon" viewBox="${x} ${y} ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${w}" height="${h}" /></clipPath></defs><image href="${path}" x="0" y="0" width="${iw}" height="${ih}" clip-path="url(#${clip})" /></svg>`;
}
function reset(stageIndex=0, opts={}) {
  const stage=STAGES[stageIndex],offset=stage.firstWave-1,startBiome=stageBiomeIndex(stageIndex);
  const source = opts.carry === false ? null : (opts.carry && carryBag) || savedBag(stageIndex);
  const carry = source ? rebagItems(source, stage.bag) : null;
  const lootPity = state?.lootPity || 0;
  let items;
  if (carry && carry.length) {
    items = carry;
  } else {
    items = PackCore.placeGear(stage.gear, stage.bag);
  }
  const held = items.find(i => !TYPES[i.type].gear) || items[0];
  if (!progress.upgrades) progress.upgrades = PackCore.defaultUpgrades();
  const stats = PackCore.upgradeStats(progress.upgrades);
  state = { mode: 'ready', stageIndex, damageTaken:0, completedLevels:offset, bagSize:stage.bag, distance:offset*LEG_DISTANCE, hp:stats.maxHp, maxHp:stats.maxHp, mana:stats.maxMana, maxMana:stats.maxMana, kills:0, items, loot:[], nextLoot:(offset+1)*LEG_DISTANCE, stops:offset, enemies:[], projectiles:[], particles:[], texts:[], arcs:[], cooldowns:{}, spawn:.4, shake:0, flash:0, bossSpawned:false, currentBiome:startBiome, targetBiome:startBiome, biomeBlend:0 };
  state.entryBag = cloneBag(items);
  state.lootSeed = Math.floor(Math.random() * 4294967296) >>> 0; state.lootPity = lootPity;
  state.poseTime = 0; state.runTime = 0; state.stopAge = STOP_DURATION; state.phase = 'combat'; state.wave = offset; state.waveTotal = 0; state.phaseTime = 0; state.effects = []; state.pendingEnemies=[];state.encounterTime=0;state.handFlash = 0; state.heldId = held.id; selected = null;
  if (!opts.carry) carryBag = null;
  $('announcement').classList.remove('show');$('toast').classList.remove('show');
  showMenu();
  renderInventory(); renderLoot(); updateUI();
}
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2700); }
function announce(message) { $('announcement').textContent = message; $('announcement').classList.add('show'); clearTimeout(announceTimer); announceTimer = setTimeout(() => $('announcement').classList.remove('show'), 1800); }
function beep(freq, duration = .08, type = 'sine', volume = .035) {
  if (!soundOn || !audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(volume, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
  o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + duration);
}
// Haptics only on touch devices; desktop Chrome would otherwise buzz a paired phone or ignore it noisily.
const canBuzz = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' && typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
function buzz(pattern) { if (canBuzz) try { navigator.vibrate(pattern); } catch (_) {} }
function select(id) { selected = id; if (state.items.some(i => i.id === id && !TYPES[i.type].gear)) state.heldId = id; renderInventory(); renderLoot(); }
function selectedItem() { return [...state.items, ...state.loot].find(i => i.id === selected); }
function matching(item) { return state.items.find(i => i.id !== item.id && i.type === item.type && i.level === item.level && i.level < 4); }
function availablePair() {
  const current = selectedItem();
  if (current && matching(current)) return [current, matching(current)];
  for (const item of [...state.loot, ...state.items]) { const target = matching(item); if (target) return [item, target]; }
  return null;
}
function quickTake(id) {
  const item = state.loot.find(i => i.id === id); if (!item) return;
  selected = id; const target = matching(item);
  if (target) { place(target.x, target.y); return; }
  for (let rotation = 0; rotation < 2; rotation++) {
    for (let y = 0; y < bagSize(); y++) for (let x = 0; x < bagSize(); x++) if (canPlace(state.items, item, x, y)) { place(x, y); return; }
    [item.w, item.h] = [item.h, item.w];
  }
  select(id); toast('Backpack full — free some space');
}
// Pointer capture supports both touch and mouse; a short tap remains a normal click.
function bindDrag(button, item) {
  let origin = null, ghost = null, preview = null;
  function layout(e) {
    const inv = $('inventory'), rect = inv.getBoundingClientRect(), gap = parseFloat(getComputedStyle(inv).gap) || 0;
    const stepX = (rect.width + gap) / bagSize(), stepY = (rect.height + gap) / bagSize();
    const cw = stepX - gap, ch = stepY - gap;
    const width = item.w * stepX - gap, height = item.h * stepY - gap;
    const py = e.clientY - origin.lift;
    const left = e.clientX - origin.grabX * width, top = py - origin.grabY * height;
    const x = Math.round((left - rect.left) / stepX), y = Math.round((top - rect.top) / stepY);
    const inGrid = e.clientX >= rect.left && e.clientX < rect.right && py >= rect.top && py < rect.bottom;
    const target = state.items.find(i => x >= i.x && x < i.x + i.w && y >= i.y && y < i.y + i.h);
    const combines = target && target.id !== item.id && target.type === item.type && target.level === item.level && item.level < 4;
    return { rect, gap, stepX, stepY, cw, ch, width, height, left, top, x, y, inGrid, combines, valid: combines || canPlace(state.items, item, x, y), target };
  }
  button.onpointerdown = e => {
    if (e.button !== 0) return;
    const rect = button.getBoundingClientRect(), inBag = state.items.includes(item);
    // A fingertip hides the drop cell, so touch drags carry the piece above the finger.
    origin = { x: e.clientX, y: e.clientY, lift: e.pointerType === 'touch' ? 36 : 0, grabX: inBag ? (e.clientX - rect.left) / rect.width : .5 / item.w, grabY: inBag ? (e.clientY - rect.top) / rect.height : .5 / item.h };
    button.setPointerCapture(e.pointerId);
  };
  button.onpointermove = e => {
    if (!origin) return;
    if (!ghost && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < 7) return;
    if (!ghost) {
      selected = item.id; ghost = document.createElement('div'); ghost.className = 'drag-ghost'; ghost.setAttribute('aria-hidden', 'true');
      ghost.innerHTML = `<div class="drag-cells">${'<span></span>'.repeat(item.w * item.h)}</div>${icon(item.type,item.level)}<b class="drag-size">${item.w} × ${item.h}</b>`;
      document.body.append(ghost); button.classList.add('dragging');
      preview = document.createElement('div'); preview.className = 'drop-footprint'; preview.setAttribute('aria-hidden', 'true'); $('inventory').append(preview);
    }
    const p = layout(e);
    ghost.style.width = `${p.width}px`; ghost.style.height = `${p.height}px`;
    ghost.style.setProperty('--drag-cols', item.w); ghost.style.setProperty('--drag-rows', item.h); ghost.style.setProperty('--drag-gap', `${p.gap}px`);
    ghost.style.left = `${p.inGrid ? p.rect.left + p.x * p.stepX : p.left}px`; ghost.style.top = `${p.inGrid ? p.rect.top + p.y * p.stepY : p.top}px`;
    ghost.classList.toggle('invalid', p.inGrid && !p.valid); ghost.classList.toggle('merge-target', Boolean(p.inGrid && p.combines));
    preview.style.display = p.inGrid ? 'block' : 'none'; preview.classList.toggle('invalid', !p.valid); preview.classList.toggle('merge-target', Boolean(p.combines));
    preview.style.left = `${(p.combines ? p.target.x : p.x) * p.stepX}px`; preview.style.top = `${(p.combines ? p.target.y : p.y) * p.stepY}px`;
    preview.style.width = `${p.combines ? p.target.w * p.stepX - p.gap : p.width}px`; preview.style.height = `${p.combines ? p.target.h * p.stepY - p.gap : p.height}px`;
  };
  const end = (e, cancelled) => {
    if (!origin) return;
    if (!ghost) { origin = null; return; }
    const p = cancelled ? null : layout(e); origin = null;
    ghost.remove(); ghost = null; preview.remove(); preview = null; button.classList.remove('dragging'); suppressClickUntil = Date.now() + 350;
    if (p && p.inGrid) place(p.x, p.y);
    renderInventory(); renderLoot();
  };
  button.onpointerup = e => end(e, false); button.onpointercancel = e => end(e, true);
  button.onlostpointercapture = e => end(e, true);
  button.ondragstart = e => e.preventDefault();
}
function renderInventory() {
  const inv = $('inventory'); inv.innerHTML = '';
  inv.style.gridTemplateColumns=`repeat(${bagSize()},1fr)`;
  inv.style.gridTemplateRows=`repeat(${bagSize()},1fr)`;
  inv.style.setProperty('--bag-scale',Math.min(1,bagSize()/5));
  inv.style.setProperty('--bag-cells',bagSize());
  inv.setAttribute('aria-label',`Backpack ${bagSize()} by ${bagSize()}`);
  const current = selectedItem();
  const spare = spareItems();
  for (let y = 0; y < bagSize(); y++) for (let x = 0; x < bagSize(); x++) {
    const cell = document.createElement('button'); cell.className = 'cell'; cell.style.gridArea = `${y + 1} / ${x + 1}`; cell.textContent = '·'; cell.setAttribute('aria-label', `Cell ${x + 1}, ${y + 1}`);
    if (current && canPlace(state.items, current, x, y)) cell.className += ' valid';
    cell.onclick = () => { if (Date.now() >= suppressClickUntil) place(x, y); }; inv.append(cell);
  }
  state.items.forEach(item => {
    const d = TYPES[item.type], b = document.createElement('button');
    const rarity = PackCore.RARITIES[d.rarity] || PackCore.RARITIES.common;
    const canMerge = [...state.items, ...state.loot].some(i => i.id !== item.id && i.type === item.type && i.level === item.level && item.level < 4);
    const live = d.gear
      ? state.items.some(i => i.id !== item.id && !TYPES[i.type].gear && PackCore.edgeTouch(item, i))
      : PackCore.linkMul(state.items, item, bagSize()) >= 1;
    const pacts = d.gear ? [] : PackCore.synergiesFor(state.items, item);
    const pack = bagSize() >= 5;
    b.className = `inv-item rarity-${d.rarity || 'common'}${item.id === selected ? ' selected' : ''}${canMerge ? ' mergeable' : ''}${mergedId === item.id ? ' just-merged' : ''}${live ? ' is-linked' : pack ? ' is-isolated' : ''}${pacts.length ? ' is-synergy' : ''}${spare.has(item.id) ? ' is-spare' : ''}`;
    b.style.cssText = `grid-area:${item.y + 1}/${item.x + 1}/span ${item.h}/span ${item.w};--item-color:${rarity.color}`;
    const pactMark = spare.has(item.id) ? '<span class="spare-badge">SPARE</span>' : pacts.length ? `<span class="pact-badge">${pacts[0].name}</span>` : '';
    b.innerHTML = `${icon(item.type,item.level)}${pactMark}<span class="tier" style="color:${rarity.color}">${'◆'.repeat(item.level)}</span><span class="rarity-tag" style="color:${rarity.color}">${rarity.name}</span>${canMerge ? '<span class="merge-badge">↑</span>' : ''}`;
    b.title = `${rarity.name} · ${d.name} · lv. ${item.level}${d.role ? ' · ' + PackCore.ROLES[d.role].name : ''} · ${d.descriptions[item.level - 1]}${d.aspect ? ' · ' + aspectHint(d.aspect) : ''}${pacts.length ? ' · ' + pacts.map(p => p.name).join(' + ') : ''}`; b.setAttribute('aria-label', b.title);
    b.onclick = () => {
      if (Date.now() < suppressClickUntil) return;
      const active = selectedItem();
      if (active && active.id !== item.id && active.type === item.type && active.level === item.level && item.level < 4) place(item.x, item.y);
      else select(selected === item.id ? null : item.id);
    };
    bindDrag(b, item); inv.append(b);
  });
  renderSeams(inv);
  $('capacity').innerHTML = `${state.items.reduce((n, i) => n + i.w * i.h, 0)} <span>/ ${bagSize()*bagSize()}</span>`;
  $('power').textContent = power(state.items, bagSize());
  $('rotate').disabled = !current; $('discard').disabled = !current;
  const curDef = current ? TYPES[current.type] : null;
  const curRarity = curDef ? (PackCore.RARITIES[curDef.rarity] || PackCore.RARITIES.common) : null;
  let formation = '';
  if (current && curDef) {
    if (curDef.gear) {
      const wired = state.items.some(i => i.id !== current.id && !TYPES[i.type].gear && PackCore.edgeTouch(current, i));
      formation = wired ? ' Empowering adjacent weapons.' : ' Move next to a weapon.';
    } else {
      const mul = PackCore.linkMul(state.items, current, bagSize());
      const pacts = PackCore.synergiesFor(state.items, current);
      const pactLine = pacts.length ? ' ' + pacts.map(p => `${p.name} · ${p.hint}`).join(' · ') + '.' : '';
      formation = mul < 1 ? ` Isolated ${Math.round(mul * 100)}% — touch another piece.` : ` Formation ${Math.round(mul * 100)}%.${pactLine}`;
    }
  }
  const aspectLine = curDef?.aspect ? ` ${aspectHint(curDef.aspect)}.` : '';
  const role = curDef && !curDef.gear ? PackCore.ROLES[curDef.role] : null;
  const roleLine = role ? ` <b class="role-rule">${role.name}: ${role.counter}.</b> ${role.hint}.` : '';
  const cost = role ? ` · ✦${PackCore.manaCost(current, progress.upgrades)}` : '';
  const spareLine = current && spare.has(current.id) ? ` <b class="spare-rule">Spare: only the best copy ${curDef.gear ? 'counts' : 'fires'}. Merge it or drop it.</b>` : '';
  const stats = role && state.items.includes(current) ? `<span class="item-stats">${pressStats(current)}</span>` : '';
    $('item-detail').innerHTML = current ? `<b style="color:${curRarity.color}">${curDef.name} · lv. ${current.level}</b><span class="rarity-detail" style="color:${curRarity.color}">${curRarity.name}${role ? ' · ' + role.name : ''} · ${current.w}×${current.h}${cost}</span>${stats}<p>${curDef.descriptions[current.level - 1]}${spareLine}${roleLine}${aspectLine}${formation}</p>` : '';
}
// Only the best copy of a type fires (weapons) or applies (gear); everything else is dead weight in the bag.
function spareItems() {
  const best = new Map();
  for (const item of state.items) { const top = best.get(item.type); if (!top || top.level < item.level) best.set(item.type, item); }
  return new Set(state.items.filter(i => best.get(i.type) !== i).map(i => i.id));
}
function pressStats(item) {
  const def = TYPES[item.type], burstMul = def.role === 'burst' ? PackCore.BURST_MUL : 1;
  const press = Math.round(attackDamage(item) * itemShots(item) * burstMul), cost = attackManaCost(item);
  const cd = def.cooldown / PackCore.hasteFor(state.items, item);
  return `Hit ${press} · ✦${cost} · ${cd.toFixed(1)}s · ${(press / cost).toFixed(1)} per ✦`;
}
function seamKind(a, b) {
  const da = TYPES[a.type], db = TYPES[b.type];
  if (da.gear && db.gear) return null;
  if (da.gear || db.gear) return { kind: 'gear' };
  if (da.school === db.school) return { kind: 'school', color: PackCore.SCHOOLS[da.school]?.color };
  const pact = PackCore.PACTS[[da.school, db.school].sort().join('+')];
  const live = pact && [a, b].some(i => PackCore.synergiesFor(state.items, i).includes(pact));
  return { kind: live ? 'pact' : 'plain' };
}
function renderSeams(inv) {
  const items = state.items;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const [a, b] = [items[i], items[j]], link = PackCore.edgeTouch(a, b) && seamKind(a, b);
    if (!link) continue;
    const seam = document.createElement('div');
    const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h), x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
    // Side contact shares a column boundary; top/bottom contact shares a row boundary.
    if (y1 > y0) { const col = a.x + a.w === b.x ? b.x : a.x; seam.className = `seam v ${link.kind}`; seam.style.gridArea = `${y0 + 1}/${col + 1}/${y1 + 1}/${col + 2}`; }
    else { const row = a.y + a.h === b.y ? b.y : a.y; seam.className = `seam h ${link.kind}`; seam.style.gridArea = `${row + 1}/${x0 + 1}/${row + 2}/${x1 + 1}`; }
    if (link.color) seam.style.setProperty('--seam', link.color);
    inv.append(seam);
  }
}
function renderLoot() {
  const tray = $('loot-tray'); tray.innerHTML = '';
  if (!state.loot.length) {
    const el = document.createElement('div'); el.className = 'loot-empty'; el.innerHTML = `${icon('chest')}${state.mode === 'loot' ? 'All taken. Onward!' : state.phase === 'combat' ? 'Beat the pack to claim loot' : 'Loot ahead!'}`; tray.append(el);
  }
  state.loot.forEach(item => {
    const d = TYPES[item.type], b = document.createElement('button'), target = matching(item);
    const rarity = PackCore.RARITIES[d.rarity] || PackCore.RARITIES.common;
    const owned = state.items.some(i => i.type === item.type);
    const tag = target ? 'Merge' : owned ? 'Spare' : (d.gear ? 'Gear' : 'New');
    b.className = `loot-card rarity-${d.rarity || 'common'}${selected === item.id ? ' selected' : ''}${target ? ' upgrade' : ''}${!target && owned ? ' spare' : ''}`;
    b.style.setProperty('--rarity-color', rarity.color);
    b.innerHTML = `${icon(item.type,item.level)}<div><b style="color:${rarity.color}">${d.name}</b><small style="color:${rarity.color}">${tag}</small></div><span class="tier" style="color:${rarity.color}">${'◆'.repeat(item.level)}</span>`;
    b.setAttribute('aria-label', `${d.name}: ${target ? 'drag onto its pair to merge' : 'drag into the backpack'}`);
    b.onclick = () => { if (Date.now() >= suppressClickUntil) select(selected === item.id ? null : item.id); }; bindDrag(b, item); tray.append(b);
  });
  $('loot-heading').textContent = state.mode === 'loot' ? 'Pick one' : state.phase === 'combat' ? 'Fighting the pack' : state.phase === 'chest' ? 'Rummaging the chest…' : 'To the next chest';
  $('loot-count').textContent = state.mode === 'loot' ? 'Drag onto a pair · or skip' : 'Same school stacks · two schools pact';
  $('loot-help').textContent = state.mode==='loot'?'Drag two matching together':'';
  $('continue').textContent='GO';
  $('continue').disabled = state.mode !== 'loot';
  syncEncounterSlot();
}
function place(x, y) {
  const item = selectedItem(); if (!item) return;
  const target = state.items.find(i => x >= i.x && x < i.x + i.w && y >= i.y && y < i.y + i.h);
  if (target && target.id !== item.id) {
    if (merge(state.items, item, target)) {
      state.loot = state.loot.filter(i => i.id !== item.id); selected = target.id; mergedId = target.id; setTimeout(() => { mergedId = null; }, 600); state.flash = .75; state.shake = 5; state.cooldowns[target.id] = 0;
      burst(W * .27, H * .73, TYPES[target.type].color, 50, 160); announce(`${TYPES[target.type].name} · LEVEL ${target.level}`);
      beep(440, .14); setTimeout(() => beep(660, .2), 90); setTimeout(() => beep(880, .4), 190); buzz([14, 50, 14, 50, 30]);
    } else { toast(target.level === 4 && item.type === target.type ? 'Max level' : 'Need matching items of the same level'); return; }
  } else {
    if (!canPlace(state.items, item, x, y)) { toast('Won\'t fit — rotate or move'); return; }
    const isNew = state.loot.some(i => i.id === item.id); item.x = x; item.y = y;
    if (isNew) { state.loot = state.loot.filter(i => i.id !== item.id); state.items.push(item); state.cooldowns[item.id] = 0; toast(`${TYPES[item.type].name} ready for combat`); beep(550, .12); }
    selected = null;
  }
  renderInventory(); renderLoot();
}
function rotate() {
  const item = selectedItem(); if (!item) return;
  const rotated = { ...item, w: item.h, h: item.w };
  if (state.items.includes(item) && !canPlace(state.items, rotated, item.x, item.y)) return toast('Not enough space to rotate. Move the item first.');
  item.w = rotated.w; item.h = rotated.h; renderInventory(); renderLoot();
}
$('rotate').onclick = rotate;
$('discard').onclick = () => {
  const item = selectedItem(); if (!item) return;
  if (!TYPES[item.type].gear && state.items.includes(item) && state.items.filter(i=>!TYPES[i.type].gear).length === 1) return toast('Keep at least one weapon to defend yourself.');
  state.items = state.items.filter(i => i.id !== item.id); state.loot = state.loot.filter(i => i.id !== item.id); selected = null; renderInventory(); renderLoot(); beep(180);
};
function lootStop() {
  state.stopAge = state.phase === 'travel' ? 0 : STOP_DURATION; state.handFlash = 0;
  state.mode = 'loot'; state.phase = 'loot'; state.stops++;
  state.hp=Math.min(state.maxHp||100,state.hp+18);
  state.mana=Math.min(state.maxMana||100,(state.mana||0)+35);
  state.loot = chooseChestLoot(state.stops, state.chestReward); state.chestReward=null; state.poseTime=0;
  selected = state.loot[0].id; renderInventory(); renderLoot(); updateUI();
  const jackpot = Math.max(0, ...state.loot.map(i => rarityRank(i.type)));
  const top = state.loot.find(i => rarityRank(i.type) === jackpot) || state.loot[0];
  const _rd = TYPES[top.type], _rr = PackCore.RARITIES[_rd?.rarity] || PackCore.RARITIES.common;
  announce(`${_rr.name.toUpperCase()} · ${_rd?.name || 'ITEM'}!`); beep(520, .15); setTimeout(() => beep(780, .25), 130);
  if (jackpot >= 3) {
    buzz([20, 60, 20, 60, 50]);
    const color = _rr.color;
    state.flash = Math.max(state.flash, .4 + jackpot * .12); state.shake = Math.max(state.shake, 3 + jackpot * 2);
    burst(chestLayout().x + chestLayout().w / 2, groundY() - 30, color, 30 + jackpot * 15, 150 + jackpot * 30);
    [990, 1180, 1320, 1580].slice(0, jackpot - 1).forEach((f, i) => setTimeout(() => beep(f, .22, 'triangle', .03), 260 + i * 110));
  }
  if (state.stops === 1) toast('Merge the axes');
}
$('continue').onclick = () => { if (state.mode !== 'loot') return; state.loot = []; selected = null; state.nextLoot = state.distance + LEG_DISTANCE; renderInventory(); leaveChest(); };
function showOverlay(title, text, button, hint) { $('overlay').classList.remove('is-menu'); $('overlay-title').textContent = title; $('overlay-text').innerHTML = text; $('start').innerHTML = `${button} <span>→</span>`; $('overlay-hint').textContent = hint; $('overlay').classList.remove('hidden'); }
function showMenu(){ showOverlay('Frog Pack', `Level ${state.stageIndex+1}`, 'PLAY', ''); $('overlay').classList.add('is-menu'); }
let bootShownAt=0;
function paintBoot(){
  const boot=$('boot'); if(!boot) return;
  if(!bootShownAt) bootShownAt=Date.now();
  const images=sceneAssets();
  const total=Math.max(1, images.length);
  const done=images.filter(img=>img.complete&&img.naturalWidth>0).length;
  const fill=$('boot-fill');
  if(fill) fill.style.width=`${Math.round(done/total*100)}%`;
  const ready=!state.loadingAssets&&!state.assetError&&Date.now()-bootShownAt>=700;
  boot.classList.toggle('is-done', ready);
  boot.setAttribute('aria-hidden', ready?'true':'false');
}
function pause() {
  if(menuReturnMode!==null)return;
  if (state.mode === 'running') { state.mode = 'paused'; showOverlay('Still in there?', 'The bag can still be saved', 'BACK', ''); }
  else if (state.mode === 'paused') { state.mode = 'running'; $('overlay').classList.add('hidden'); }
  else if (state.mode === 'loot') toast('Camp');
  updateUI();
}
$('pause').onclick = pause;
$('start').onclick = () => {
  autoSound();
  if(state.mode==='won'&&state.stageIndex===STAGES.length-1){openLevelMenu();return;}
  if(state.mode==='won'){startStage(state.stageIndex+1,{carry:true});return;}
  if(state.mode==='dead'){startStage(state.stageIndex,{carry:!!carryBag});return;}
  if(state.mode==='ready')startEncounter();else state.mode='running';
  $('overlay').classList.add('hidden');updateUI();
};
function startStage(index, opts={}){
  if(!stageUnlocked(index))return false;
  progress.selected=index;saveProgress();menuReturnMode=null;$('level-select').hidden=true;
  $('game-layout').inert=false;$('app-header').inert=false;
  const carry = opts.carry === false ? false : (opts.carry === true || (state?.mode==='won' && index===state.stageIndex+1)) || undefined;
  reset(index,{carry});startEncounter();$('overlay').classList.add('hidden');updateUI();return true;
}
function openLevelMenu(){
  if(menuReturnMode!==null)return;
  menuReturnMode=state.mode;if(state.mode==='running')state.mode='paused';
  menuSelection=progress.selected;menuPage=Math.floor(menuSelection/10);$('level-select').hidden=false;
  $('game-layout').inert=true;$('app-header').inert=true;
  renderLevelMenu();updateUI();$('levels-close').focus?.();
}
function closeLevelMenu(){
  if(menuReturnMode===null)return;
  state.mode=menuReturnMode;menuReturnMode=null;$('level-select').hidden=true;
  $('game-layout').inert=false;$('app-header').inert=false;
  updateUI();$('level-menu-button').focus?.();
}
function renderLevelMenu(){
  const list=$('level-cards');list.innerHTML='';
  STAGES.slice(menuPage*10,menuPage*10+10).forEach((stage,local)=>{
    const index=menuPage*10+local;
    const unlocked=stageUnlocked(index),stars=progress.stars[index],button=document.createElement('button');
    button.className=`stage-card${index===menuSelection?' selected':''}`;button.disabled=!unlocked;
    button.setAttribute('aria-label',`Level ${index+1}: ${stage.name}${unlocked?stars?`, ${stars} of 3 stars`:', unlocked':', locked'}`);
    button.setAttribute('aria-pressed',String(index===menuSelection));
    button.innerHTML=`<span class="stage-number">${index+1}</span><span class="stage-card-copy"><span class="stage-card-name">${PackCampaign.stageHook(index)}</span><span class="stage-card-place">${stage.name}</span></span><span class="stage-card-mark">${!unlocked?'🔒':stars?'★'.repeat(stars)+'☆'.repeat(3-stars):'→'}</span>`;
    button.onclick=()=>{menuSelection=index;renderLevelMenu();};list.append(button);
  });
  $('levels-play').textContent=`TRY · ${menuSelection+1}`;
  $('levels-range').textContent=`${menuPage*10+1}–${Math.min(STAGES.length,menuPage*10+10)} / ${STAGES.length}`;
  $('levels-world').textContent=WORLDS[menuPage].hook||WORLDS[menuPage].name;
  $('levels-prev').disabled=menuPage===0;$('levels-next').disabled=menuPage===Math.ceil(STAGES.length/10)-1;
  list.scrollTop=0;
}
function changeLevelPage(delta){menuPage=Math.max(0,Math.min(Math.ceil(STAGES.length/10)-1,menuPage+delta));renderLevelMenu();}
$('levels-prev').onclick=()=>changeLevelPage(-1);$('levels-next').onclick=()=>changeLevelPage(1);
$('level-menu-button').onclick=openLevelMenu;$('levels-close').onclick=closeLevelMenu;
$('levels-play').onclick=()=>startStage(menuSelection);
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}
const fsBtn = $('fullscreen');
if (fsBtn) {
  fsBtn.onclick = toggleFullscreen;
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    fsBtn.classList.toggle('active', isFs);
    fsBtn.title = isFs ? 'Exit full screen (F)' : 'Full screen (F)';
    fsBtn.textContent = isFs ? '✕' : '⛶';
    resize();
  });
}
function setSound(on) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  soundOn = on && !!Ctx;
  if (soundOn) { audioCtx ||= new Ctx(); audioCtx.resume?.(); beep(650); }
  $('sound').classList.toggle('active', soundOn); $('sound').title = soundOn ? 'Mute sound' : 'Enable sound'; $('sound').setAttribute('aria-label', $('sound').title);
}
$('sound').onclick = () => { setSound(!soundOn); try { localStorage.setItem('packrun-sound', soundOn ? '1' : '0'); } catch (_) {} };
// Browsers only allow audio after a gesture, so the first PLAY turns it on unless the player muted it.
function autoSound() { let pref = null; try { pref = localStorage.getItem('packrun-sound'); } catch (_) {} if (!soundOn && pref !== '0') setSound(true); }
window.addEventListener('keydown', e => {
  if(menuReturnMode!==null){
    if(e.code==='Escape'){e.preventDefault();closeLevelMenu();}
    if(e.code==='Tab'){
      const buttons=[...$('level-select').querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
    return;
  }
  if(e.code==='KeyF'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();toggleFullscreen();}
  if(e.code==='Space'&&!['BUTTON','INPUT'].includes(document.activeElement.tagName)){e.preventDefault();pause();}
  if(e.code==='KeyR')rotate();if(e.code==='Escape')select(null);
});
// iOS suspends (or "interrupts") the audio context in the background; wake it on return.
document.addEventListener('visibilitychange', () => { if (document.hidden && state.mode === 'running') pause(); else if (!document.hidden && soundOn) audioCtx?.resume?.(); });
// Long-press is a drag here, never a copy/save menu.
document.addEventListener('contextmenu', e => { if (!e.target.closest?.('a')) e.preventDefault(); });
// A phone turned sideways gets a "turn upright" cover (CSS); the run must not keep going under it.
const sideways = typeof matchMedia === 'function' ? matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)') : null;
sideways?.addEventListener?.('change', e => { if (e.matches && state.mode === 'running') pause(); });
function finish(won) {
  if(state.mode==='won'||state.mode==='dead')return;
  $('announcement').classList.remove('show');
  state.mode = won ? 'won' : 'dead'; const meters = Math.floor(state.distance); best = Math.max(best, meters); try { localStorage.setItem('packrun-best', best); } catch (_) {} $('best').textContent = `${best} m`;
  if(won){
    carryBag = cloneBag(state.items);
    // Only the frontier bag persists; replaying an old level must not overwrite it.
    const nextStage=state.stageIndex+1;
    if(nextStage<STAGES.length&&(!progress.bag||nextStage>=progress.bag.stage))progress.bag={stage:nextStage,items:cloneBag(state.items)};
    const stars=state.damageTaken===0?3:state.damageTaken<=30?2:1;
    progress.stars[state.stageIndex]=Math.max(progress.stars[state.stageIndex],stars);
    progress.cleared=Math.max(progress.cleared,state.stageIndex+1);progress.selected=Math.min(STAGES.length-1,state.stageIndex+1);
    const gained=2+stars*2;progress.essence=(progress.essence||0)+gained;saveProgress();
    showOverlay('You packed it',`<span class="result-stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span><div class="essence-gain">+${gained} essence · total ${progress.essence}</div>${upgradeShopHtml()}`,state.stageIndex<STAGES.length-1?'Next level':'ALL 100','The next one is meaner.');
    bindUpgradeShop();
  }else {
    // Retry keeps the bag the frog walked in with, so a death never leaves you weaker.
    carryBag = state.entryBag ? cloneBag(state.entryBag) : null;
    const near=nearMiss();
    showOverlay(near.close?'SO CLOSE!':'The bag killed you',`<div class="near-miss${near.close?' is-close':''}">${near.line}</div>Level ${state.stageIndex+1} · ${currentStage().name}<div class="essence-gain">Essence: ${progress.essence||0}</div>${upgradeShopHtml()}`,near.close?'ONE MORE TRY':'RETRY','Same road. Smarter bag.');
    bindUpgradeShop();
  }
  updateUI();
}
// Losses read as "almost": the smaller the gap, the louder the screen says it.
function nearMiss(){
  const stage=currentStage(),living=state.enemies.filter(e=>e.hp>0);
  const boss=living.find(e=>e.boss);
  const foes=living.length+(state.pendingEnemies?.length||0);
  const waves=stage.lastWave-stage.firstWave+1,wave=state.wave-stage.firstWave+1;
  if(boss){
    const pct=Math.max(1,Math.ceil(boss.hp/boss.maxHp*100));
    return {close:pct<=35,pct,line:`The boss had only <b>${pct}%</b> left`};
  }
  if(foes<=3)return {close:true,line:`<b>${foes}</b> ${foes===1?'foe':'foes'} from the ${wave===waves?'finish':'chest'}`};
  return {close:wave>=waves-1,line:`Wave <b>${wave}</b> of ${waves}`};
}
function upgradeShopHtml(){
  const defs=PackCore.UPGRADE_DEFS,u=progress.upgrades||PackCore.defaultUpgrades();
  return `<div class="upgrade-shop" id="upgrade-shop">${Object.entries(defs).map(([id,def])=>{
    const lv=u[id]||0,cost=def.cost(lv),maxed=lv>=def.max;
    return `<button type="button" class="upgrade-card" data-upgrade="${id}" ${maxed||(progress.essence||0)<cost?'disabled':''}><b>${def.name}</b><span>${def.desc}</span><em>${maxed?'MAX':`lv.${lv} · ${cost}✦`}</em></button>`;
  }).join('')}</div>`;
}
function bindUpgradeShop(){
  const shop=$('upgrade-shop');if(!shop)return;
  shop.onclick=e=>{
    const btn=e.target.closest('[data-upgrade]');if(!btn||btn.disabled)return;
    buyUpgrade(btn.dataset.upgrade);
  };
}
function buyUpgrade(id){
  const def=PackCore.UPGRADE_DEFS[id];if(!def)return false;
  const u=progress.upgrades||(progress.upgrades=PackCore.defaultUpgrades());
  const lv=u[id]||0;if(lv>=def.max)return false;
  const cost=def.cost(lv);if((progress.essence||0)<cost)return false;
  progress.essence-=cost;u[id]=lv+1;saveProgress();
  const stats=PackCore.upgradeStats(u);
  if(state){state.maxHp=stats.maxHp;state.maxMana=stats.maxMana;state.hp=Math.min(state.maxHp,state.hp);state.mana=Math.min(state.maxMana,state.mana||0);}
  const text=$('overlay-text');
  if(text){
    const starsHtml=typeof text.querySelector==='function'?['.near-miss','.result-stars'].map(sel=>text.querySelector(sel)?.outerHTML||'').join(''):'';
    text.innerHTML=`${starsHtml}<div class="essence-gain">Essence: ${progress.essence}</div>${upgradeShopHtml()}`;
    bindUpgradeShop();
  }
  updateUI();beep(620,.1);return true;
}
function updateLevelHUD(){
  const stage=currentStage(),completed=Math.max(0,state.completedLevels-stage.firstWave+1),count=stage.lastWave-stage.firstWave+1;
  $('biome').textContent=`Level ${state.stageIndex+1}`;
  const key=`${state.stageIndex}:${completed}`;
  if($('wave-dots').datasetKey!==key){
    $('wave-dots').datasetKey=key;
    $('wave-dots').innerHTML=Array.from({length:count},(_,i)=>{const boss=levelInfo(stage.firstWave+i).boss;return `<span class="wave-dot${i<completed?' done':i===completed?' current':''}${boss?' boss':''}" aria-hidden="true">${boss?'♛':''}</span>`;}).join('');
    $('wave-dots').setAttribute('aria-label',`Waves cleared: ${completed} of ${count}`);
  }
  $('continue').textContent='GO';
}
function updateAttackButtons(){
 const bar=$('attack-bar'),choices=attackChoices(),signature=choices.map(i=>i.id+':'+i.level).join(',');
 if(bar.datasetKey!==signature){
  bar.datasetKey=signature;bar.innerHTML='';bar.attackButtons=[];
  for(const item of choices){
   const button=document.createElement('button');button.className='attack-button';
   const cost=PackCore.manaCost(item,progress.upgrades),role=PackCore.ROLES[TYPES[item.type].role];
   button.className=`attack-button role-${role.id}`;
   button.innerHTML=icon(item.type,item.level)+`<span class="attack-level">${item.level}</span><span class="attack-mana">${cost}✦</span><span class="attack-role">${role.tag}</span>${TYPES[item.type].aspect?`<span class="attack-aspect ${TYPES[item.type].aspect}"></span>`:''}`;
   const timer=document.createElement('span');timer.className='attack-timer';button.append(timer);
   const aspectName=TYPES[item.type].aspect?`, ${ASPECT_LABEL[TYPES[item.type].aspect]}`:'';
   button.title=`${TYPES[item.type].name} · ${role.name}: ${role.counter} · ✦${cost}`;
   button.setAttribute('aria-label',`${TYPES[item.type].name}${aspectName}, ${role.name}, level ${item.level}, mana ${cost}`);
   button.onclick=()=>{manualAttack(item.id);updateAttackButtons();};
   bar.append(button);bar.attackButtons.push({button,timer,item});
  }
 }
 // A hesitating player sees ready buttons pulse while foes are on screen; newcomers get it sooner.
 const idle=(state.encounterTime||0)-(state.lastAttackAt||0);
 const foesInView=state.phase==='combat'&&state.enemies.some(e=>e.hp>0&&e.x<W-5);
 const nudge=foesInView&&idle>(state.stageIndex<3?1.2:3);
 const counters=roleCounters();
 $('mana-fill').classList.toggle('focus',state.phase==='combat'&&!!state.focus);
 for(const {button,timer,item} of bar.attackButtons||[]){
  const role=TYPES[item.type].role;
  button.classList.toggle('is-urgent',counters.urgent.has(role));
  button.classList.toggle('is-counter',!counters.urgent.has(role)&&counters.on.has(role));
  const cd=Math.max(0,state.cooldowns[item.id]||0),total=TYPES[item.type].cooldown/PackCore.hasteFor(state.items,item);
  const cost=PackCore.manaCost(item,progress.upgrades),lowMana=(state.mana||0)<cost;
  button.disabled=state.mode!=='running'||state.phase!=='combat'||cd>0||state.attackLock>0||state.loadingAssets||lowMana;
  button.classList.toggle('no-mana',lowMana&&cd<=0);
  button.classList.toggle('nudge',nudge&&!button.disabled);
  button.style.setProperty('--cooldown',`${Math.min(100,cd/total*100)}%`);
  timer.textContent=cd>0?cd.toFixed(1):(lowMana?'✦':'');
 }
 syncEncounterSlot();
}
function syncEncounterSlot(){
 const row=$('encounter-controls');
 if(!row)return;
 const picking=state.mode==='loot';
 row.classList.toggle('is-loot',picking);
 $('combat-controls').hidden=false;
 $('loot-panel').hidden=false;
 $('combat-controls').setAttribute('aria-hidden',picking?'true':'false');
 $('loot-panel').setAttribute('aria-hidden',picking?'false':'true');
}
function updateUI() {
  const assetsReady=warmGameAssets();
  updateAttackButtons();
  updateLevelHUD();
  const maxHp=state.maxHp||100,maxMana=state.maxMana||100;
  $('hp-text').textContent = Math.ceil(state.hp); $('hp-fill').style.width = `${Math.min(100,state.hp/maxHp*100)}%`;
  if($('mana-text')){$('mana-text').textContent=Math.ceil(state.mana||0);$('mana-fill').style.width=`${Math.min(100,(state.mana||0)/maxMana*100)}%`;}
  $('kills').textContent = state.kills;
  $('run-state').textContent=state.mode==='running'&&state.bossSpawned&&state.phase==='combat'?'BOSS':'';
  $('pause').textContent = state.mode === 'paused' ? '▶' : 'Ⅱ';
  if(!assetsReady)$('run-state').textContent=state.assetError?'Load error · refresh the page':'';
  $('start').disabled=state.mode==='ready'&&!assetsReady;
  paintBoot();
}
function burst(x, y, color, count = 12, speed = 80) {
  for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, v = Math.random() * speed; state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: .3 + Math.random() * .7, max: 1, color, size: 1 + Math.random() * 3 }); }
}
function spawnEnemy(boss = false) {
  const n = Math.floor(state.distance / 160), elite = !boss && Math.random() < .2;
  const hp = boss ? 5500 : (40 + n * 31) * (elite ? 2 : 1);
  state.enemies.push({ x: W + 30, y: groundY() - H * .01, hp, maxHp: hp, size: boss ? 58 : elite ? 27 : 18 + Math.random() * 5, speed: boss ? 27 : 32 + Math.random() * 17, phase: Math.random() * 7, hit: 0, attack: 0, boss, elite });
}
// Kills leave a short squash-and-poof instead of vanishing on the frame their HP reaches zero.
const CORPSE_LIFE = .42;
function spawnCorpse(enemy) {
  (state.corpses ||= []).push({ ...enemy, corpse: true, hp: 1, maxHp: 1, dieAge: 0, dieLife: enemy.boss ? .9 : CORPSE_LIFE, baseX: enemy.x });
}
function updateCorpses(dt) {
  if (!state.corpses?.length) return;
  for (const c of state.corpses) {
    c.dieAge += dt;
    const t = Math.min(1, c.dieAge / c.dieLife);
    c.x = c.baseX + (1 - (1 - t) ** 2) * 18 * castScale();
    c.hit = t < .3 ? 1 : 0;
  }
  state.corpses = state.corpses.filter(c => c.dieAge < c.dieLife);
}
function drawCorpses() {
  for (const c of state.corpses || []) {
    const t = Math.min(1, c.dieAge / c.dieLife), ground = c.y + 5, s = castScale();
    // Flatten toward the ground during a short hop: reads as a knock-out, not a deletion.
    const hop = Math.sin(Math.PI * Math.min(1, t * 1.6)) * 10 * s;
    ctx.save(); ctx.globalAlpha = 1 - t * t;
    ctx.translate(c.x, ground - hop); ctx.scale(1 + .35 * t, 1 - .7 * t * t); ctx.translate(-c.x, -ground);
    enemyDraw(c); ctx.restore();
    ctx.save(); ctx.globalAlpha = (1 - t) * .8; ctx.strokeStyle = '#f4ecd0'; ctx.lineWidth = .5 + 2.5 * (1 - t);
    ctx.beginPath(); ctx.ellipse(c.x, ground, c.size * (.6 + 1.8 * t) * s, c.size * (.18 + .4 * t) * s, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}
function hit(enemy, dmg, color, aspect, role) {
  if (enemy.hp <= 0) return;
  let crit = false;
  if (aspect && enemy.aspect) {
    const mul = aspectMul(aspect, enemy.aspect);
    dmg *= mul;
    if (mul > 1) { color = '#f6e7a2'; crit = true; }
    else if (mul < 1) color = '#9aa094';
  }
  // Role counters: Pierce ignores barriers, Burst ignores armor, Blight stops healing.
  if(enemy.barrier>0){enemy.barrier--;if(role!=='pierce')dmg*=.2;burst(enemy.x,enemy.y-enemy.size,'#a6e8f4',8);}
  const kind=ENEMY_KINDS[enemy.kind];
  dmg=Math.max(1,Math.round(dmg*(role==='burst'?1:kind?.armor||1)));
  if(kind?.shield&&(enemy.age||0)%5<1.6)dmg=Math.max(1,Math.round(dmg*.4));
  if(enemy.stun>0){dmg=Math.round(dmg*STAGGER_VULN);crit=true;}
  if(role==='dot')enemy.blight=BLIGHT_TIME;
  if(enemy.windup>0){enemy.windupDmg=(enemy.windupDmg||0)+dmg*(role==='burst'?BURST_STAGGER:1);checkStagger(enemy);}
  enemy.hp -= dmg;
  const killed=enemy.hp<=0;
  enemy.hit = killed?.38:.28;
  burst(enemy.x, enemy.y - enemy.size, color, killed?(enemy.boss?80:22):10, killed?150:110);
  state.shake=Math.max(state.shake||0, killed?(enemy.boss?12:7):2.5);
  state.flash=Math.max(state.flash||0, killed?.28:.08);
  const textSize = Math.max(12, Math.round(Math.min(30, 15 + Math.log10(dmg+1)*8) * castScale() * (crit ? 1.25 : 1)));
  state.texts.push({ x: enemy.x + (Math.random() - .5) * 16, y: enemy.y - enemy.size * 2, text: dmg, life: killed?1.2:.95, color, size: textSize, pop: killed, crit,
    age: 0, vx: (Math.random() - .5) * 40, vy: killed ? -120 : -85 });
  if (killed) spawnCorpse(enemy);
  if (!killed && enemy.boss && !enemy.almost && enemy.hp < enemy.maxHp * .2) { enemy.almost = true; announce('ALMOST!'); beep(330, .1, 'square', .025); }
  if (killed) { enemy.aspectLock = null; state.kills++; registerKill(enemy); state.mana=Math.min(state.maxMana||100,(state.mana||0)+(enemy.boss?0:enemy.elite?ELITE_KILL_MANA:KILL_MANA)); beep(120 + Math.random() * 100 + (state.combo?.count || 0) * 18, .045, 'triangle', .018);
    const split=ENEMY_KINDS[enemy.kind]?.split;if(split){spawnOffspring(enemy,split);spawnOffspring(enemy,split);}
  }
}
function attack(item) { return weaponAttack(item); }
function update(dt) {
  if(state.mode!=='paused')state.poseTime+=dt;
  if(state.mode!=='paused')state.stopAge=Math.min(STOP_DURATION,state.stopAge+dt);
  updateRun(dt);
  if (state.mode === 'paused') return;
  const targetIdx = stageBiomeIndex(state.stageIndex);
  if (state.targetBiome !== targetIdx) state.targetBiome = targetIdx;
  if (state.currentBiome !== state.targetBiome) {
    const speed = (state.phase === 'travel' || state.phase === 'depart') ? 1.5 : 0.6;
    state.biomeBlend = Math.min(1, (state.biomeBlend || 0) + dt * speed);
    if (state.biomeBlend >= 1) { state.currentBiome = state.targetBiome; state.biomeBlend = 0; }
  } else { state.biomeBlend = 0; }
  for (const p of state.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; }
  // Numbers burst upward and brake, instead of a flat 36px/s crawl.
  for (const t of state.texts) { t.life -= dt; t.age = (t.age || 0) + dt; t.x += (t.vx || 0) * dt; t.y += (t.vy ?? -36) * dt; if (t.vy != null) t.vy *= Math.exp(-3.2 * dt); }
  updateCorpses(dt);
  for (const a of state.arcs) a.life -= dt;
  state.particles = state.particles.filter(p => p.life > 0); state.texts = state.texts.filter(t => t.life > 0); state.arcs = state.arcs.filter(a => a.life > 0);
  state.flash = Math.max(0, state.flash - dt); state.shake = Math.max(0, state.shake - dt * 25);
  if (state.combo) state.combo.pop = Math.max(0, state.combo.pop - dt * 5);
  state.frenzy = Math.max(0, (state.frenzy || 0) - dt);
  if (inDanger()) { state.heartbeat = (state.heartbeat || 0) - dt; if (state.heartbeat <= 0) { state.heartbeat = .5 + state.hp / state.maxHp * 1.6; beep(58, .09, 'sine', .06); setTimeout(() => beep(52, .12, 'sine', .05), 130); } }
  stepRainDrops(dt);
}
const DANGER_HP = .35;
function inDanger() { return state.mode === 'running' && state.phase === 'combat' && state.hp > 0 && state.hp < (state.maxHp || 100) * DANGER_HP; }
function poly(points, fill) { ctx.fillStyle = fill; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
function ellipse(x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function tree(x, base, size, color, pine = true) {
  ctx.fillStyle = color; ctx.fillRect(x - size * .035, base - size, size * .07, size);
  if (pine) for (let j = 0; j < 4; j++) { const y = base - size + j * size * .17, width = size * (.19 + j * .065); poly([[x, y - size * .16], [x - width, y + size * .37], [x + width, y + size * .37]], color); }
  else { ellipse(x, base - size * .8, size * .36, size * .23, color); ellipse(x - size * .2, base - size * .62, size * .25, size * .22, color); }
}
function drawTiledBg(biome, alpha = 1.0) {
  const tiles = biomeTileImages(biome).filter(img => img && img.complete && img.naturalWidth);
  if (!tiles.length || alpha <= 0.001) return false;
  const sample = tiles[0];
  const tileWidth = H * sample.naturalWidth / sample.naturalHeight;
  const scroll = state.distance * 7, firstTile = Math.floor(scroll / tileWidth), offset = scroll % tileWidth;
  const multi = tiles.length > 1;
  const allowMirror = !multi && !biome.noMirror;
  ctx.save();
  if (alpha < 0.999) ctx.globalAlpha = alpha;
  for (let i = 0; i * tileWidth - offset < W; i++) {
    const tileIndex = firstTile + i;
    const img = tiles[((tileIndex % tiles.length) + tiles.length) % tiles.length];
    const x = i * tileWidth - offset;
    ctx.save(); ctx.translate(x, 0);
    if (allowMirror && tileIndex % 2) { ctx.translate(tileWidth, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, 0, 0, tileWidth + .5, H); ctx.restore();
  }
  ctx.restore();
  return true;
}
function biomeWeather(biome) {
  return biome?.weather || biome?.particles || { kind: 'clear', color: '#ffffff80', count: 8, size: 1.3, speed: .2 };
}
/** Rain drops — same model as Don't Let Him Die (king-two/weatherFx.ts). */
let rainDrops = [];
let rainFxKind = '';
function rebuildRainDrops(kind) {
  if (rainFxKind === kind && rainDrops.length) return;
  rainFxKind = kind;
  rainDrops = [];
  if (kind !== 'rain' && kind !== 'drizzle' && kind !== 'storm') return;
  const n = kind === 'storm' ? 88 : kind === 'rain' ? 70 : 48;
  const vyBase = kind === 'drizzle' ? 520 : 780;
  const vySpan = kind === 'drizzle' ? 200 : 280;
  const sizeBase = kind === 'drizzle' ? 9 : 12;
  const sizeSpan = kind === 'drizzle' ? 10 : 14;
  for (let i = 0; i < n; i++) {
    rainDrops.push({
      x: Math.random() * (W + 80) - 40,
      y: Math.random() * H,
      vx: 70 + Math.random() * 40,
      vy: vyBase + Math.random() * vySpan,
      size: sizeBase + Math.random() * sizeSpan,
      alpha: 0.18 + Math.random() * 0.28
    });
  }
}
function stepRainDrops(dt) {
  if (!state || state.mode === 'paused') return;
  const cur = BIOMES[state.currentBiome || 0] || BIOMES[0];
  const nxt = BIOMES[state.targetBiome ?? state.currentBiome] || cur;
  const blend = state.biomeBlend || 0;
  const kind = blend < 0.5 ? (biomeWeather(cur).kind || 'clear') : (biomeWeather(nxt).kind || 'clear');
  rebuildRainDrops(kind);
  if (!rainDrops.length) return;
  for (const d of rainDrops) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (d.y > H + 20) { d.y = -20; d.x = Math.random() * (W + 80) - 40; }
    if (d.x > W + 40) d.x -= W + 80;
    if (d.x < -40) d.x += W + 80;
  }
}
function drawRainDrops(kind, alphaScale) {
  if (!rainDrops.length || alphaScale <= 0.01) return;
  const storm = kind === 'storm';
  ctx.save();
  for (const d of rainDrops) {
    ctx.globalAlpha = Math.min(1, d.alpha * alphaScale);
    ctx.strokeStyle = storm ? '#c8d8f0' : '#d8e8f8';
    ctx.lineWidth = storm ? 1.6 : 1.35;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.vx * 0.018, d.y + d.size);
    ctx.stroke();
  }
  ctx.restore();
}
function renderWeatherVeil(cur, nxt, blend) {
  const a = biomeWeather(cur).veil, b = biomeWeather(nxt).veil;
  if (a) { ctx.fillStyle = a; ctx.globalAlpha = 1 - blend; ctx.fillRect(0, 0, W, H); }
  if (b && blend > 0.01) { ctx.fillStyle = b; ctx.globalAlpha = blend; ctx.fillRect(0, 0, W, H); }
  ctx.globalAlpha = 1;
}
function renderWeatherKind(kind, color, count, size, speed, wind, alphaScale) {
  if (alphaScale <= 0.01 || count <= 0) return;
  if (kind === 'rain' || kind === 'drizzle' || kind === 'storm') {
    drawRainDrops(kind, alphaScale);
    return;
  }
  const scroll = state.distance * 7;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alphaScale);
  for (let i = 0; i < count; i++) {
    const seed = i * 97.13;
    let px, py, s = size;
    if (kind === 'embers' || kind === 'sparks') {
      const rise = time * 55 + seed * 18;
      px = ((i * 113 - scroll * speed + Math.sin(time + i) * 12) % (W + 30) + W + 30) % (W + 30);
      py = H * .85 - ((i * 41 + rise) % (H * .7));
      s = size * (.7 + (Math.sin(time * 4 + i) * .5 + .5) * .8);
      ellipse(px, py, s, s, color);
      continue;
    }
    if (kind === 'petals' || kind === 'chaff' || kind === 'pollen' || kind === 'spores' || kind === 'dust') {
      const drift = time * (28 + (wind || .3) * 40) + seed * 10;
      px = ((i * 91 - scroll * speed + drift * (wind || .35) + Math.sin(time + i) * 18) % (W + 40) + W + 40) % (W + 40);
      py = H * .12 + (i * 37 % (H * .55)) + Math.cos(time * 1.2 + i) * 10;
      if (kind === 'petals') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(px, py, s * 1.2, s * .55, time + i, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ellipse(px, py, s, s, color);
      }
      continue;
    }
    px = ((i * 137 - scroll * speed) % (W + 30) + W + 30) % (W + 30);
    py = H * .16 + (i * 43 % (H * .45)) + Math.sin(time * 1.5 + i) * 6;
    if (kind === 'fireflies') {
      const pulse = .45 + Math.sin(time * 3.2 + i * 1.7) * .55;
      s = size * (.6 + pulse * .7);
      ctx.globalAlpha = Math.min(1, alphaScale * (.35 + pulse * .65));
    }
    ellipse(px, py, s, s, color);
    ctx.globalAlpha = Math.min(1, alphaScale);
  }
  ctx.restore();
}
function renderBiomeParticles(cur, nxt, blend) {
  renderWeatherVeil(cur, nxt, blend);
  const wCur = biomeWeather(cur), wNxt = biomeWeather(nxt);
  if (blend < 0.98) {
    renderWeatherKind(wCur.kind || 'clear', wCur.color, Math.round(wCur.count * (1 - blend)), wCur.size, wCur.speed, wCur.wind || 0, 1 - blend);
  }
  if (blend > 0.02 && (wNxt.kind || 'clear') !== (wCur.kind || 'clear')) {
    renderWeatherKind(wNxt.kind || 'clear', wNxt.color, Math.round(wNxt.count * blend), wNxt.size, wNxt.speed, wNxt.wind || 0, blend);
  }
}
function background() {
  const curIdx = state ? (state.currentBiome || 0) : 0;
  const tgtIdx = state ? (state.targetBiome ?? curIdx) : 0;
  const cur = BIOMES[curIdx] || BIOMES[0];
  const nxt = BIOMES[tgtIdx] || cur;
  const rawBlend = state ? (state.biomeBlend || 0) : 0;
  const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);

  const drawnCur = drawTiledBg(cur, 1.0);
  if (drawnCur && cur !== nxt && blend > 0) {
    drawTiledBg(nxt, blend);
  }
  if (drawnCur) {
    if(currentStage().tint){ctx.fillStyle=currentStage().tint;ctx.globalAlpha=.14;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
    renderBiomeParticles(cur, nxt, blend);
    return;
  }
  const scroll = state.distance * 7;
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#173637'); sky.addColorStop(.65, '#517768'); sky.addColorStop(1, '#8b996a'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * .69, H * .28, 3, W * .69, H * .28, 145); glow.addColorStop(0, '#d0d49b4d'); glow.addColorStop(1, '#accba000'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ellipse(W * .69, H * .26, 27, 27, '#d7dcaf'); ellipse(W * .69 + 10, H * .26 - 5, 25, 25, '#45665a');
  poly([[0,H*.55],[W*.13,H*.25],[W*.28,H*.55],[W*.43,H*.29],[W*.63,H*.64],[W*.8,H*.35],[W,H*.57],[W,H],[0,H]], '#315b54');
  for (let layer = 0; layer < 3; layer++) {
    const spacing = [97, 137, 205][layer], offset = scroll * [.13, .3, .57][layer] % spacing;
    for (let i = -1; i < W / spacing + 2; i++) { const size = [135, 173, 247][layer] + Math.sin(i * 12.7 + layer) * 32; tree(i * spacing - offset, H * (.69 + layer * .045), size, ['#365f55', '#274d42', '#193c32'][layer]); }
  }
  // Sparse light shafts cut through the canopy.
  poly([[W*.48,0],[W*.52,0],[W*.31,H*.8],[W*.12,H*.8]], '#cedda00a'); poly([[W*.76,0],[W*.8,0],[W*.7,H*.8],[W*.57,H*.8]], '#d7edb00b');
  if (state.distance >= 500) for (let i = 0; i < 4; i++) { const x = ((i * 280 - scroll * .6) % (W + 280) + W + 280) % (W + 280) - 80; ctx.fillStyle = '#657364'; ctx.fillRect(x, H * .53, 27, H * .24); ctx.fillStyle = '#85917a'; ctx.fillRect(x - 5, H * .51, 37, 13); ctx.fillRect(x - 6, H * .75, 39, 10); }
  ctx.fillStyle = '#334536'; ctx.fillRect(0, H * .79, W, H * .21); poly([[0,H*.79],[W*.18,H*.78],[W*.35,H*.8],[W*.64,H*.775],[W,H*.79],[W,H*.83],[0,H*.83]], '#7e8960');
  ctx.fillStyle = '#48523b'; ctx.fillRect(0, H * .835, W, H * .065); ctx.fillStyle = '#24362b'; ctx.fillRect(0, H * .9, W, H * .1);
  for (let i = 0; i < W / 43 + 2; i++) { const x = i * 43 - scroll % 43; ctx.fillStyle = '#a0a275'; ctx.fillRect(x, H * .8 + Math.sin(i * 4) * 3, 9 + i % 4 * 4, 2); ctx.fillStyle = '#38452f'; ctx.fillRect(x + 15, H * .865, 13, 3); }
  for (let i = 0; i < 13; i++) { const x = (i * 137 + Math.sin(time * .3 + i) * 14 - scroll * .28) % (W + 100); const y = H * .27 + (i * 41 % (H * .4)) + Math.cos(time + i) * 8; ellipse(x < 0 ? x + W + 100 : x, y, 1.4, 1.4, `rgba(219,239,145,${.2 + Math.sin(time * 2 + i) * .18})`); }
  for (let i = 0; i < W / 150 + 2; i++) { const x = i * 150 - scroll * 1.15 % 150; poly([[x,H],[x-16,H*.92],[x+2,H*.95],[x+8,H*.86],[x+18,H*.96],[x+36,H*.91],[x+29,H]], '#172d24'); }
}
function hero() { if(state.phase==='chest'){renderRummage();return;} renderFrogHero(); }
function bossBarColor(e) {
  if (!e.boss) return '#b8d88f';
  return e.hp < e.maxHp * .2 && Math.sin(time * 18) > 0 ? '#ff5a4a' : '#efac7e';
}
function enemyDraw(e) {
  const y = e.y + Math.sin(time * 5 + e.phase) * 2, s = e.size; ellipse(e.x, e.y + 5, s * 1.1, s * .22, '#10251d66');
  const kind=ENEMY_KINDS[e.kind];
  if(!e.corpse&&(e.barrier>0||kind?.healer||kind?.aura||e.enraged)){
    ctx.save();ctx.strokeStyle=e.barrier>0?'#a6ecff':e.enraged?'#ff8e59':kind?.healer?'#b6ee92':'#e8bf7e';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(e.x,y-s,s*1.3,s*1.45,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  const enemySheet=kind?.extra?extraEnemies:enemyAtlas;
  if(kind&&enemySheet.complete&&enemySheet.naturalWidth){
    const size=(e.boss?Math.min(H*.69,150):s*2.8)*castScale();
    const cell=kind.art*2+Math.floor((e.age||0)*(kind.flying?9:5))%2;
    ctx.save();if(e.hit)ctx.filter='brightness(1.6)';else if(kind.hue)ctx.filter=`hue-rotate(${kind.hue}deg)`;
    const row=Math.floor(cell/4),bounds=kind.extra?[0,325,620,889,1254]:[0,325,620,885,1254],sw=enemySheet.naturalWidth/4,sy=bounds[row],sh=bounds[row+1]-sy;
    const height=size*sh/sw;
    ctx.drawImage(enemySheet,cell%4*sw,sy,sw,sh,e.x-size/2,y+size*.08-height,size,height);ctx.restore();
    if(e.corpse)return;
    if(kind.shield&&(e.age||0)%5<1.6){ctx.strokeStyle='#99edff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,y-size*.4,size*.48,size*.55,0,0,Math.PI*2);ctx.stroke();}
    const bw=e.boss?100:s*2,barY=y+size*.08-height-5;
    if(e.hp<e.maxHp||e.boss){const bh=e.boss?6:4;ctx.fillStyle='#1d322a';ctx.fillRect(e.x-bw/2,barY,bw,bh);ctx.fillStyle=bossBarColor(e);ctx.fillRect(e.x-bw/2,barY,bw*e.hp/e.maxHp,bh);}
    drawAspectPip(e, e.x, y+size*.08-height-14);
    drawBossTells(e, barY, bw);
    return;
  }
  if (atlas.complete && atlas.naturalWidth) {
    const size = (e.boss ? Math.min(H * .69, 150) : s * 2.5) * castScale();
    ctx.save(); if (e.hit) ctx.filter = 'brightness(1.8)';
    drawSprite(e.boss ? 2 : e.elite ? 1 : 0, 1, e.x - size / 2, y - size * .97, size);
    ctx.restore();
    if (e.corpse) return;
    if (e.hp < e.maxHp || e.boss) { const bw = e.boss ? 100 : s * 2; ctx.fillStyle = '#1d322a'; ctx.fillRect(e.x - bw / 2, y - size - 7, bw, 4); ctx.fillStyle = e.boss ? '#efac7e' : '#b8d88f'; ctx.fillRect(e.x - bw / 2, y - size - 7, bw * e.hp / e.maxHp, 4); }
    drawAspectPip(e, e.x, y - size - 16);
    drawBossTells(e, y - size - 7, e.boss ? 100 : s * 2);
    return;
  }
  if (e.boss) {
    ctx.fillStyle = e.hit ? '#fff2cf' : '#4b6260'; ctx.fillRect(e.x-s*.65,y-s*1.6,s*1.3,s*1.5); poly([[e.x-s*.85,y-s*1.25],[e.x-s*.55,y-s*2.15],[e.x,y-s*2.45],[e.x+s*.6,y-s*2],[e.x+s*.8,y-s*1.2]], e.hit?'#fff3d0':'#6a8170');
    ctx.fillStyle='#203b34';ctx.fillRect(e.x-s*.45,y-s*1.8,s*.9,s*.4);ctx.fillStyle='#e5bf7e';ctx.fillRect(e.x-s*.3,y-s*1.7,s*.18,6);ctx.fillRect(e.x+s*.12,y-s*1.7,s*.18,6);
    ctx.fillStyle='#94aa75';ctx.fillRect(e.x-s*.75,y-s*2,25,9);ctx.fillRect(e.x+s*.35,y-s*1.95,25,10);
  } else {
    const color=e.hit?'#f4f3c6':e.elite?'#897491':'#88a49b';
    poly([[e.x-s,y],[e.x-s*.95,y-s*.9],[e.x-s*.65,y-s*1.55],[e.x,y-s*1.8],[e.x+s*.7,y-s*1.4],[e.x+s,y-s*.5],[e.x+s*.75,y],[e.x+s*.3,y-4],[e.x,y],[e.x-s*.45,y-4]],color);
    poly([[e.x-s*.6,y-s*1.3],[e.x-s*.75,y-s*2],[e.x-s*.15,y-s*1.6]],color);ctx.fillStyle='#233e39';ctx.fillRect(e.x-s*.58,y-s,7,5);ctx.fillRect(e.x+s*.12,y-s,7,5);ctx.fillStyle='#d8e9b5';ctx.fillRect(e.x-s*.5,y-s,3,3);ctx.fillRect(e.x+s*.13,y-s,3,3);
  }
  if(!e.corpse&&(e.hp<e.maxHp||e.boss)){const bw=e.boss?120:s*2;ctx.fillStyle='#1d322a';ctx.fillRect(e.x-bw/2,y-s*(e.boss?2.7:2.25),bw,4);ctx.fillStyle=e.boss?'#efac7e':'#b8d88f';ctx.fillRect(e.x-bw/2,y-s*(e.boss?2.7:2.25),bw*e.hp/e.maxHp,4);if(e.boss){ctx.font='bold 9px Manrope,Arial';ctx.fillStyle='#e4eacb';ctx.textAlign='center';ctx.fillText('FOREST GUARDIAN',e.x,y-s*2.9);}}
}
function projectileDraw(p) {
  if(p.delay>0)return;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.color;ctx.strokeStyle=p.color;
  if(p.type==='bow'){
    const size=(28+p.level*3)*castScale();ctx.rotate(Math.atan2(p.vy,p.vx));
    drawCel(seedBolts,Math.floor((2.5-p.life)*12)%3,0,3,2,0,size/2,size,size);ctx.restore();return;
  }
  if(p.type==='spear'){
    const size=(48+p.level*5)*castScale();ctx.rotate(Math.atan2(p.vy,p.vx));
    drawCel(spearThrust,Math.floor((2.5-p.life)*14)%3,0,3,2,0,size/2,size,size);ctx.restore();return;
  }
  if(p.type==='bomb') {
    const row={bow:0,spear:1,bomb:2}[p.type],size=(p.type==='bomb'?30+p.level*3:42+p.level*6)*castScale();
    drawCel(newAttackFrames,p.type==='bomb'?0:Math.min(1,Math.floor((2.5-p.life)*8)),row,6,3,0,size/2,size,size);ctx.restore();return;
  }
  if (atlas.complete && atlas.naturalWidth && ['axe','shuriken','wand'].includes(p.type)) {
    const size = (p.type === 'axe' ? 29 + p.level * 3 : p.type === 'wand' ? 23 + p.level * 3 : 19 + p.level * 2) * castScale();
    if (p.type !== 'wand') ctx.rotate(Math.floor((2.5-p.life)*12)/12 * (p.type === 'axe' ? 12 : 19) + p.phase);
    const [col,row] = p.type === 'wand' ? [1,3] : spriteCells[p.type];
    drawItemArt(p, -size/2, -size/2, size); ctx.restore(); return;
  }
  if(p.type==='shuriken'){ctx.rotate(time*19+p.phase);const s=7+p.level;poly([[0,-s],[3,-3],[s,0],[3,3],[0,s],[-3,3],[-s,0],[-3,-3]],p.color);}
  if(p.type==='axe'){ctx.rotate(time*12+p.phase);ctx.fillStyle='#b99569';ctx.fillRect(-2,-13,4,27);poly([[-3,-12],[11,-11],[16,0],[0,5]],p.color);}
  if(p.type==='wand'){ellipse(0,0,5+p.level,5+p.level,p.color);ellipse(-1,-1,3,3,'#fff4ff');}
  if(p.type==='blade' && weaponFrames.complete && weaponFrames.naturalWidth){const f=Math.min(3,Math.floor((2.5-p.life)*10));const size=(35+p.level*16)*castScale();drawCel(weaponFrames,f,1,6,4,0,size/2,size,size);ctx.restore();return;}
  if(p.type==='blade'){ctx.lineWidth=3+p.level;ctx.beginPath();ctx.arc(-13,0,17+p.level*4,-1.1,1.1);ctx.stroke();}
  ctx.restore();
}
function render() {
  ctx.save();if(state.shake>0)ctx.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);background();renderWorldChest();
  drawCorpses();state.enemies.forEach(enemyDraw);hero();state.projectiles.forEach(projectileDraw);renderCombatEffects();

  state.particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});ctx.globalAlpha=1;
  state.texts.forEach(t=>{
    ctx.save();
    ctx.globalAlpha=Math.min(1,t.life*2.1);
    const size=t.size||15,age=t.age??1;
    // Pop in oversized and settle; kills and crits hit harder and flash white on their first frames.
    const k=Math.min(1,age/.16),scale=1+((t.pop||t.crit)?1:.5)*(1-k)**3;
    ctx.translate(t.x,t.y);if(scale!==1&&typeof ctx.scale==='function')ctx.scale(scale,scale);
    ctx.font=`800 ${size}px Manrope,Arial`;
    ctx.textAlign='center';
    ctx.lineJoin='round';
    ctx.lineWidth=Math.max(2,size/7);
    ctx.strokeStyle='#141c12';
    ctx.strokeText(String(t.text),0,0);
    ctx.fillStyle=(t.pop||t.crit)&&age<.06?'#ffffff':t.color;
    ctx.fillText(String(t.text),0,0);
    ctx.restore();
  });
  ctx.restore();
  drawDanger();drawFrenzy();drawCombo();
}
function drawDanger(){
  if(!inDanger()||typeof ctx.createRadialGradient!=='function')return;
  const depth=1-state.hp/((state.maxHp||100)*DANGER_HP),pulse=.55+.45*Math.sin(time*(6+depth*6));
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.22,W/2,H/2,Math.max(W,H)*.62);
  g.addColorStop(0,'#c8101000');g.addColorStop(1,`rgba(200,16,16,${(.4+depth*.4)*pulse})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawFrenzy(){
  if(!(state.frenzy>0)||typeof ctx.strokeRect!=='function')return;
  ctx.save();ctx.globalAlpha=Math.min(1,state.frenzy)*.5;ctx.strokeStyle='#ffd86b';ctx.lineWidth=6+state.frenzy*6;
  ctx.strokeRect(0,0,W,H);ctx.restore();
}
function drawCombo(){
  const c=state.combo;if(!c||c.count<2||state.mode!=='running'||state.phase!=='combat'||typeof ctx.fillText!=='function')return;
  const x=W*.5,y=H*.2,size=Math.round((30+c.pop*18)*castScale()+10);
  ctx.save();ctx.textAlign='center';ctx.lineJoin='round';ctx.font=`900 ${size}px Manrope,Arial`;
  ctx.lineWidth=Math.max(3,size/6);ctx.strokeStyle='#141c12';ctx.fillStyle=c.count>=FRENZY_AT/2?'#ffd86b':'#fff1ca';
  ctx.strokeText(`×${c.count}`,x,y);ctx.fillText(`×${c.count}`,x,y);
  // Draining bar: the chain is about to break.
  const bw=86*castScale()+20,left=x-bw/2,by=y+8,share=Math.max(0,c.timer/COMBO_WINDOW);
  ctx.fillStyle='#141c12cc';ctx.fillRect(left-1,by-1,bw+2,6);
  ctx.fillStyle=share<.3?'#ff7a59':'#ffd86b';ctx.fillRect(left,by,bw*share,4);
  // Pips toward the next FRENZY.
  const into=c.count%FRENZY_AT,gap=bw/FRENZY_AT;
  for(let i=0;i<FRENZY_AT;i++){ctx.fillStyle=i<into?'#ffd86b':'#ffffff33';ctx.fillRect(left+i*gap+1,by+8,gap-3,3);}
  ctx.restore();
}
function resize() {const rect=canvas.getBoundingClientRect(),oldW=W,oldH=H;W=rect.width;H=rect.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(state&&oldW&&oldH){const sx=W/oldW,sy=H/oldH;/* Mobile URL bars and bag-size changes resize mid-fight: keep lanes and flight heights proportional. */for(const e of [...state.enemies,...(state.corpses||[])]){e.x*=sx;e.y*=sy;if(e.baseY!=null)e.baseY*=sy;if(e.baseX!=null)e.baseX*=sx;}state.projectiles.forEach(p=>{p.x*=sx;p.y*=sy;});}}
new ResizeObserver(resize).observe(canvas);
// Hitstop freezes the world for a few frames on a kill; slowmo stretches the last blow of a wave.
function frame(now) {
  const real=Math.min((now-last)/1000,.04);last=now;let dt=real;
  if(state.hitstop>0){state.hitstop=Math.max(0,state.hitstop-real);dt=0;}
  else if(state.slowmo>0){state.slowmo=Math.max(0,state.slowmo-real);dt*=.35;}
  time+=dt;update(dt);render();uiTick+=real;if(uiTick>.1){updateUI();uiTick=0;}requestAnimationFrame(frame);
}
reset(progress.selected);resize();requestAnimationFrame(frame);

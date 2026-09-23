'use strict';
const battleHero = new Image(); // Retained only for legacy fallback code; not downloaded.
const RUN_SPEED = 52;
const LEG_DISTANCE = 100;
const MELEE_SLOTS = 3;
// The swing's strike frames; the recovery tail of the .78s pose can be cancelled by the next attack.
const ATTACK_LOCK = .45;
// Kill chain: every kill refills the window; FRENZY_AT kills in one chain reset all cooldowns.
const COMBO_WINDOW = 2.2;
const FRENZY_AT = 8;
const FRENZY_MANA = 30;
// Mana is the real budget: holding fire for FOCUS_DELAY multiplies regen, so spamming every button starves you.
const FOCUS_DELAY = 1.5;
const FOCUS_MUL = 1.8;
const KILL_MANA = 5, ELITE_KILL_MANA = 10;
const BLIGHT_TIME = 3;
// Bosses telegraph a signature move; enough damage during the wind-up staggers them into a vulnerable window.
const BOSS_FIRST_SIG = 3.2, BOSS_SIG_GAP = 6.5, BOSS_WINDUP = 1.8;
const STAGGER_SHARE = .09, STAGGER_TIME = 2.4, STAGGER_VULN = 1.3, BURST_STAGGER = 2;
const SLAM_POWER = 2.2, MEND_SHARE = .1;
const BOSS_PHASES = [.66, .33];
const SIG_LABEL = { slam: 'SMASH', brood: 'BROOD', mend: 'MEND' };
function registerKill(enemy){
  const c=state.combo||(state.combo={count:0,timer:0,pop:0});
  c.count++;c.timer=COMBO_WINDOW;c.pop=1;
  state.hitstop=Math.max(state.hitstop||0,enemy.boss?.22:enemy.elite?.08:.045);
  if(c.count%FRENZY_AT===0)triggerFrenzy();
}
function triggerFrenzy(){
  for(const id of Object.keys(state.cooldowns))state.cooldowns[id]=0;
  state.mana=Math.min(state.maxMana||100,(state.mana||0)+FRENZY_MANA);
  state.frenzy=1.2;state.flash=Math.max(state.flash||0,.55);state.shake=Math.max(state.shake||0,9);
  announce('FRENZY!');beep(520,.12,'square',.03);setTimeout(()=>beep(780,.14,'square',.03),70);setTimeout(()=>beep(1040,.3,'square',.03),150);
}
const QUEUE_GAP = 16;
const {STAGES,LEVELS,LAST_WAVE,WORLDS,ENEMY_UNLOCKS}=PackCampaign;
function currentStage(){return STAGES[state.stageIndex||0];}
const ENEMY_KINDS={
 beetle:{art:0,name:'Carapace Beetle',hp:1.25,speed:.8,armor:.72},
 mushroom:{art:1,name:'Mushroomkin',hp:.85,speed:1,regen:2},
 boar:{art:2,name:'Spiny Boar',hp:.8,speed:1.1,charge:true},
 moth:{art:3,name:'Moon Moth',hp:.7,speed:1.5,flying:true},
 stump:{art:4,name:'Rootwalker',hp:1.5,speed:.7,power:6},
 snail:{art:5,name:'Crystal Snail',hp:1.7,speed:.5,armor:.65},
 mushroomKing:{art:6,name:'MUSHROOM KING',hp:1,speed:.7,power:12},
 ancientTree:{art:7,name:'HEART OF THE GROVE',hp:1,speed:.6,power:15},
 spider:{art:0,extra:true,name:'Shadow Spider',hp:.6,speed:1.6},
 toad:{art:1,extra:true,name:'Moss Toad',hp:1.2,speed:.85,charge:true},
 bat:{art:2,extra:true,name:'Crimson Bat',hp:.6,speed:1.7,flying:true},
 mandrake:{art:3,extra:true,name:'Mandrake',hp:.85,speed:.9,regen:3},
 scorpion:{art:4,extra:true,name:'Amber Scorpion',hp:1.1,speed:1.1,power:7},
 spiderQueen:{art:5,extra:true,name:'SPIDER MATRIARCH',hp:1,speed:.55,power:8,summon:true},
 swampLord:{art:6,extra:true,name:'SWAMP COLOSSUS',hp:1,speed:.6,power:12,charge:true},
 crystalGolem:{art:7,extra:true,name:'CRYSTAL GUARDIAN',hp:1,speed:.5,power:11,shield:true}
};
// New roles reuse the illustrated species, with distinct combat tells.
Object.assign(ENEMY_KINDS,{
 broodling:{...ENEMY_KINDS.spider,name:'Cocoonling',hp:.85,speed:1,split:'spider',hue:35},
  windMoth:{...ENEMY_KINDS.moth,name:'Wind Moth',hp:.8,speed:1.65,hue:40,aspect:'storm'},
 shardBeetle:{...ENEMY_KINDS.beetle,name:'Shard Beetle',hp:1.1,armor:.9,barrier:2,hue:110},
  emberBoar:{...ENEMY_KINDS.boar,name:'Ash Boar',hp:1,rage:true,hue:315,aspect:'ember'},
  frostMoth:{...ENEMY_KINDS.moth,name:'Frost Moth',hp:.9,speed:1.25,barrier:1,hue:160,aspect:'frost'},
 healer:{...ENEMY_KINDS.mandrake,name:'Spore Healer',hp:1,healer:true,hue:75},
 warDrummer:{...ENEMY_KINDS.stump,name:'Root Drummer',hp:1.2,aura:1.18,hue:335},
 broodMother:{...ENEMY_KINDS.spiderQueen,name:'BROOD MOTHER',rage:true,hue:40},
  nightWing:{...ENEMY_KINDS.moth,name:'LORD OF NIGHT',hp:1,speed:.75,power:10,rage:true,hue:240,aspect:'storm'},
  ashLord:{...ENEMY_KINDS.swampLord,name:'ASH LORD',power:9,rage:true,hue:310,aspect:'ember'},
  frostWarden:{...ENEMY_KINDS.crystalGolem,name:'FROST WARDEN',barrier:3,hue:60,aspect:'frost'},
 eclipseKeeper:{...ENEMY_KINDS.mushroomKing,name:'ECLIPSE KEEPER',shield:true,summon:true,hue:210},
  worldHeart:{...ENEMY_KINDS.ancientTree,name:'WORLD HEART',power:12,rage:true,summon:true,aura:1.12,hue:35}
});
// Signature rotation per boss: what happens when a wind-up is not broken.
const BOSS_SIGNATURES={
 mushroomKing:['slam','brood'],ancientTree:['slam','mend'],spiderQueen:['brood','slam'],swampLord:['mend','slam'],
 crystalGolem:['slam'],broodMother:['brood','slam'],nightWing:['slam'],ashLord:['slam'],frostWarden:['slam'],
 eclipseKeeper:['brood','mend'],worldHeart:['slam','brood','mend']
};
function armBoss(e){
  Object.assign(e,{sigClock:0,sigAt:BOSS_FIRST_SIG,sigGap:BOSS_SIG_GAP,sigIndex:0,windup:0,windupMax:0,windupDmg:0,stun:0,bossPhase:0,sig:null});
}
function bossSignature(e){const list=BOSS_SIGNATURES[e.kind]||['slam'];return list[e.sigIndex%list.length];}
function staggerNeed(e){return e.maxHp*STAGGER_SHARE;}
function checkStagger(e){
  if(!(e.windup>0)||e.windupDmg<staggerNeed(e))return false;
  e.windup=0;e.stun=STAGGER_TIME;e.sigIndex++;e.sigAt=e.sigClock+e.sigGap;
  state.hitstop=Math.max(state.hitstop||0,.12);state.shake=Math.max(state.shake||0,10);state.flash=Math.max(state.flash||0,.35);
  burst(e.x,e.y-e.size,'#ffe27a',30,160);announce('STAGGERED! ×1.3');beep(880,.08,'square',.03);setTimeout(()=>beep(1180,.16,'square',.03),60);
  return true;
}
function summonAdds(e,n,share){
  const level=levelInfo(),pool=level.pool?.length?level.pool:['spider'];
  for(let i=0;i<n;i++){
    if(state.enemies.filter(o=>o.hp>0).length>=14)return;
    const add=spawnEncounterEnemy({kind:pool[(e.sigIndex+i)%pool.length],lane:i});
    add.x=Math.min(W-8,e.x+20+i*18);add.hp=add.maxHp=Math.round(level.health*share);add.aspect=e.aspect||null;
    state.waveTotal++;burst(add.x,add.y-add.size,'#c7a2de',8);
  }
}
function unleashSignature(e,kind){
  const sig=e.sig||'slam';
  if(sig==='slam'){
    const received=Math.max(1,Math.round((kind?.power||10)*SLAM_POWER*(e.damageScale||1)*(1-PackCore.reductionFor(state.items))));
    state.damageTaken+=Math.min(state.hp,received);state.hp=Math.max(0,state.hp-received);
    state.shake=Math.max(state.shake||0,16);state.flash=Math.max(state.flash||0,.5);
    burst(W*.27,H*.78-25,'#ff6a4a',40,190);beep(55,.3,'sawtooth',.05);buzz([80,40,160]);
    state.texts.push({x:W*.27,y:H*.78-70,text:`-${received}`,life:1.3,color:'#ff6a4a',size:Math.round(28*castScale()),pop:true,age:0,vx:0,vy:-90});
    if(state.hp<=0)finish(false);
  } else if(sig==='brood'){
    summonAdds(e,3,.4);announce('BROOD!');beep(140,.2,'triangle',.04);
  } else if(sig==='mend'){
    if(e.blight>0){announce('BLIGHTED · NO HEAL');burst(e.x,e.y-e.size,'#8fcf5a',16);}
    else{const heal=Math.round(e.maxHp*MEND_SHARE);e.hp=Math.min(e.maxHp,e.hp+heal);burst(e.x,e.y-e.size,'#a4e88d',30,120);announce('MENDED');
      state.texts.push({x:e.x,y:e.y-e.size*2,text:`+${heal}`,life:1.2,color:'#a4e88d',size:Math.round(22*castScale()),pop:true,age:0,vx:0,vy:-80});}
  }
  e.sigIndex++;e.sigAt=e.sigClock+e.sigGap;
}
function updateBoss(e,kind,dt,slowed){
  if(e.stun>0){e.stun=Math.max(0,e.stun-dt);return;}
  if(e.bossPhase<BOSS_PHASES.length&&e.hp<e.maxHp*BOSS_PHASES[e.bossPhase]){
    e.bossPhase++;e.barrier=(e.barrier||0)+2+e.bossPhase*2;e.sigGap*=.85;
    summonAdds(e,2,.35);
    state.shake=Math.max(state.shake||0,12);state.flash=Math.max(state.flash||0,.4);
    announce(`PHASE ${e.bossPhase+1} · BARRIER`);beep(200,.25,'sawtooth',.04);
  }
  if(e.x>W*.95)return;
  e.sigClock+=dt*slowed;
  if(e.windup>0){
    e.windup-=dt*slowed;
    if(e.windup<=0){e.windup=0;unleashSignature(e,kind);}
  } else if(e.sigClock>=e.sigAt){
    e.sig=bossSignature(e);e.windupMax=e.windup=BOSS_WINDUP*(e.enraged?.8:1);e.windupDmg=0;
    announce(`${SIG_LABEL[e.sig]} INCOMING · BREAK IT`);beep(240,.18,'square',.03);
  }
}
const ASPECTS = ['ember', 'frost', 'storm'];
const ASPECT_FAVORED = { ember: 'frost', frost: 'storm', storm: 'ember' };
const ASPECT_COLOR = { ember: '#f97316', frost: '#7dd3fc', storm: '#fde047' };
const ASPECT_LABEL = { ember: 'Ember', frost: 'Frost', storm: 'Storm' };
function aspectMul(weaponAspect, enemyAspect) {
  if (!weaponAspect || !enemyAspect) return 1;
  if (weaponAspect === enemyAspect) return 0.3;
  if (ASPECT_FAVORED[weaponAspect] === enemyAspect) return 1.8;
  return 1;
}
function aspectHint(aspect) {
  if (!ASPECT_LABEL[aspect]) return '';
  return `${ASPECT_LABEL[aspect]}: strong vs ${ASPECT_LABEL[ASPECT_FAVORED[aspect]]}, weak vs itself`;
}
function waveAspects() {
  const index = state.stageIndex || 0;
  if (index < 2) return [];
  const n = state.wave || 1;
  const first = ASPECTS[n % 3];
  if (index < 4) return [first];
  return [first, ASPECTS[(n + 1) % 3]];
}
function assignEnemyAspect(enemy, slot) {
  if ((state.stageIndex || 0) < 2) { enemy.aspect = null; return; }
  const kindAspect = ENEMY_KINDS[enemy.kind]?.aspect;
  if (kindAspect) { enemy.aspect = kindAspect; return; }
  const wave = waveAspects();
  enemy.aspect = wave.length ? wave[(slot || 0) % wave.length] : null;
}
function drawAspectPip(e, x, y) {
  if (!e.aspect || !ASPECT_COLOR[e.aspect]) return;
  ctx.save();
  ctx.fillStyle = ASPECT_COLOR[e.aspect];
  ctx.strokeStyle = '#1a140c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
// Boss wind-up, stagger, barrier and blight read at a glance under the HP bar; no on-field tutorials.
function drawBossTells(e, barY, bw) {
  if (typeof ctx.beginPath !== 'function') return;
  const ground = e.y + 5, s = castScale();
  ctx.save();
  if (e.windup > 0) {
    const t = 1 - e.windup / (e.windupMax || 1), pulse = .5 + .5 * Math.sin(time * 22);
    ctx.strokeStyle = e.sig === 'mend' ? '#a4e88d' : e.sig === 'brood' ? '#c7a2de' : '#ff5a4a';
    ctx.globalAlpha = .45 + pulse * .45; ctx.lineWidth = 3 + t * 3;
    ctx.beginPath(); ctx.ellipse(e.x, ground, (40 + t * 50) * s, (9 + t * 8) * s, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    const by = barY + 9, share = Math.min(1, (e.windupDmg || 0) / staggerNeed(e));
    ctx.fillStyle = '#141c12dd'; ctx.fillRect(e.x - bw / 2 - 1, by - 1, bw + 2, 7);
    ctx.fillStyle = '#ffd86b'; ctx.fillRect(e.x - bw / 2, by, bw * share, 5);
    ctx.fillStyle = '#ff5a4a'; ctx.fillRect(e.x - bw / 2, by + 5, bw * (1 - t), 1.5);
    ctx.font = `900 ${Math.round(13 * s + 4)}px Manrope,Arial`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.lineWidth = 4; ctx.strokeStyle = '#141c12'; ctx.fillStyle = pulse > .5 ? '#fff1ca' : '#ff8e6e';
    const label = `! ${SIG_LABEL[e.sig] || 'SMASH'} !`;
    ctx.strokeText(label, e.x, barY - 8); ctx.fillText(label, e.x, barY - 8);
  } else if (e.stun > 0) {
    ctx.strokeStyle = '#ffd86b'; ctx.lineWidth = 2.5; ctx.globalAlpha = .85;
    ctx.beginPath(); ctx.ellipse(e.x, ground, 46 * s, 11 * s, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd86b'; ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const a = time * 6 + i * 2.1; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 26 * s, barY - 12 + Math.sin(a) * 5, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = `900 ${Math.round(11 * s + 4)}px Manrope,Arial`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#141c12';
    ctx.strokeText('STAGGERED ×1.3', e.x, barY - 20); ctx.fillText('STAGGERED ×1.3', e.x, barY - 20);
  }
  if (e.barrier > 0) {
    ctx.font = `800 ${Math.round(9 * s + 3)}px Manrope,Arial`; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = '#141c12'; ctx.fillStyle = '#a6ecff';
    const txt = `◈${e.barrier}`; ctx.strokeText(txt, e.x + bw / 2 + 4, barY + 6); ctx.fillText(txt, e.x + bw / 2 + 4, barY + 6);
  }
  if (e.blight > 0) { ctx.fillStyle = '#8fcf5a'; ctx.beginPath(); ctx.arc(e.x - bw / 2 - 7, barY + 3, 3.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
const extraEnemies = assetImage('enemies-v4.png');
const spearThrust = assetImage('spear-thrust-v2.png');
const enemyAtlas = assetImage('enemies-v3.png');
const seedBolts = assetImage('seed-bolt-v1.png');
function levelInfo(number=state.wave||1){return LEVELS[Math.max(0,Math.min(LAST_WAVE-1,number-1))];}
function startEncounter() {
  if(state.wave>=currentStage().lastWave)return;
  state.stopAge=STOP_DURATION;
  state.mode = 'running'; state.phase = 'combat'; state.wave++;
  state.enemies = []; state.projectiles = []; state.effects = []; state.arcs = [];
  const level=levelInfo();
  state.encounterTime=0;state.pendingEnemies=[];state.lastAttackAt=0;
  state.combo={count:0,timer:0,pop:0};
  state.bossSpawned = level.boss;
  state.waveTotal = level.count;
  state.items.forEach(item => { state.cooldowns[item.id] = 0; });
  if(level.entries){state.pendingEnemies=level.entries.map(e=>({...e}));spawnScheduledEnemies();}
  else for (let i = 0; i < state.waveTotal; i++) {
    const boss = state.bossSpawned && i === state.waveTotal - 1;
    spawnEnemy(boss);
    const e = state.enemies.at(-1);
    e.x = W * (.74 + i * .085); e.y = groundY() - H * .01 + (i % 3 - 1) * 5;
    e.elite=!boss&&i<level.elites;
    e.size=boss?58:e.elite?27:20;
    e.speed = Math.max(36, W * .105) * (boss ? .65 : 1) * level.speedScale;
    const introduced=ENEMY_UNLOCKS[state.wave];
    e.kind=boss?level.bossKind:(introduced&&i<introduced.length?introduced[i]:level.pool.length?level.pool[(state.wave+i)%level.pool.length]:null);
    const kind=ENEMY_KINDS[e.kind];
    e.hp = e.maxHp = boss ? level.bossHealth : Math.round(level.health * (kind?.hp||1) * (e.elite ? 1.45 : 1));
    e.damageScale=level.damageScale;
    e.speed*=kind?.speed||1;e.baseY=e.y;e.age=i*.31;
    e.attack = .5;
    if(boss)armBoss(e);
    assignEnemyAspect(e, i);
  }
  state.heldId ||= state.items[0].id;
  const stats=PackCore.upgradeStats(typeof progress!=='undefined'?progress.upgrades:undefined);
  state.maxMana=stats.maxMana;state.mana=state.maxMana;
  const aspects = waveAspects();
  const aspectLine = aspects.map(a => ASPECT_LABEL[a].toUpperCase()).join(' / ');
  announce(level.boss ? (aspectLine ? `BOSS · ${aspectLine}` : 'BOSS') : `WAVE ${state.wave - currentStage().firstWave + 1}${aspectLine ? ' · ' + aspectLine : ''}`);
  renderLoot(); updateUI();
}
function encounterHpMul(){
  // Carried endgame bags into early procedural stages used to one-tap whole packs.
  if(!state?.items?.length)return 1;
  const stage=currentStage();
  if(stage.legacy)return 1;
  const size=state.bagSize||stage.bag||5;
  const carried=PackCore.power(state.items,size,false);
  const kit=PackCore.power((stage.gear||[]).map(([type,level])=>PackCore.makeItem(type,level)),size,false);
  if(kit<=0)return 1;
  const ratio=carried/kit;
  // Soft cap only: a well-built bag must still feel stronger than the starter kit.
  // Random loot builds wide bags (one ready weapon per cooldown), and rarity/size edges make a maxed
  // epic+ bag ~30% stronger still, hence the higher ceiling.
  if(ratio<=1.6)return 1;
  // Early carried bags run 5–9× their tiny kits and made levels 7–20 damage-free under the late ×1.7 cap.
  const early=(state.stageIndex||0)<30;
  return Math.min(early?2.2:1.7,1+(ratio-1.6)*(early?.25:.2));
}
function spawnEncounterEnemy(entry,level=levelInfo()){
  spawnEnemy(!!entry.boss);const e=state.enemies.at(-1),kind=ENEMY_KINDS[entry.kind];
  Object.assign(e,{kind:entry.kind,boss:!!entry.boss,elite:!!entry.elite,
    x:W*((state.encounterTime<.1?.8:1.01)+(entry.lane||0)*.075),y:H*.78+((entry.lane||0)%3-1)*5,
    size:entry.boss?58:entry.elite?27:20,age:0,attack:.5,damageScale:level.damageScale,barrier:kind?.barrier||0});
  const mul=encounterHpMul();
  e.hp=e.maxHp=Math.round((entry.boss?level.bossHealth:Math.round(level.health*(kind?.hp||1)*(entry.elite?1.35:1)))*mul);
  e.baseY=e.y;e.speed=W*.105*(entry.boss?.8:1)*(entry.boss?Math.max(.9,kind?.speed||1):(kind?.speed||1))*level.speedScale;
  if(entry.boss)armBoss(e);
  assignEnemyAspect(e, entry.lane || 0);
  return e;
}
function spawnScheduledEnemies(){
  while(state.pendingEnemies?.length&&state.pendingEnemies[0].at<=state.encounterTime&&state.enemies.filter(e=>e.hp>0).length<14){
    spawnEncounterEnemy(state.pendingEnemies.shift());
  }
}
function spawnOffspring(parent,kindName){
  if(state.enemies.filter(e=>e.hp>0).length>=14)return;
  const add=spawnEncounterEnemy({kind:kindName});
  add.aspect=parent.aspect||null;
  add.x=Math.min(W-8,parent.x+25);add.hp=add.maxHp=Math.round(levelInfo().health*.28);
  state.waveTotal++;burst(add.x,add.y-add.size,'#c7a2de',6);
}
function clearEncounter() {
  state.completedLevels=Math.max(state.completedLevels||0,state.wave);
  state.phase = 'victory'; state.phaseTime = .8;
  state.projectiles = []; state.enemies = [];state.pendingEnemies=[];
  renderLoot();
  // The final blow of a wave plays in slow motion; the level finale lingers longer.
  const finale=state.wave===currentStage().lastWave;state.slowmo=finale?1.1:.55;
  announce(finale?'VICTORY!':'✓'); beep(660, .16); setTimeout(() => beep(880, .2), 100);
}
function wield(item) {
  state.heldId = item.id; state.handFlash = .78; state.attackLock = ATTACK_LOCK;
}
function attackChoices(){
  const best=new Map();
  for(const item of state.items)if(!TYPES[item.type].gear&&(!best.has(item.type)||best.get(item.type).level<item.level))best.set(item.type,item);
  return [...best.values()];
}
// Roles that answer what is on screen right now; `urgent` is a live boss wind-up.
function roleCounters(){
  const live=state.enemies.filter(e=>e.hp>0&&e.x<W-5),on=new Set(),urgent=new Set();
  if(state.phase!=='combat'||!live.length)return {on,urgent};
  const has=test=>live.some(e=>test(e,ENEMY_KINDS[e.kind]||{}));
  if(has(e=>e.windup>0)){urgent.add('burst');urgent.add('pull');}
  if(has(e=>e.barrier>0))on.add('pierce');
  if(has((e,k)=>k.healer||k.regen||(e.windup>0&&e.sig==='mend')))on.add('dot');
  if(has((e,k)=>(k.armor||1)<1))on.add('burst');
  if(live.length>=5){on.add('nova');on.add('chain');}
  return {on,urgent};
}
function runUpgrades(){return typeof progress!=='undefined'?progress.upgrades:PackCore.defaultUpgrades();}
function attackManaCost(item){return PackCore.manaCost(item,runUpgrades());}
function attackDamage(item){
  const syn=PackCore.synergyStats(state.items,item);
  return Math.round(PackCore.scaledDamage(item,runUpgrades())*PackCore.linkMul(state.items,item,state.bagSize||5)*syn.damage);
}
function itemShots(item){return PackCore.shots(item,state.items);}
function manualAttack(id){
  if(!warmGameAssets())return false;
  const item=attackChoices().find(i=>i.id===id);
  if(!item||state.mode!=='running'||state.phase!=='combat'||state.attackLock>0||(state.cooldowns[id]||0)>0)return false;
  if((state.mana||0)<attackManaCost(item))return false;
  if(!weaponAttack(item))return false;
  state.cooldowns[id]=TYPES[item.type].cooldown/PackCore.hasteFor(state.items,item);
  state.lastAttackAt=state.encounterTime||0;
  buzz(8);
  return true;
}
function leaveChest(){
  state.mode='running';state.phase='depart';state.departEnd=state.distance+35;
  state.enemies=[];state.handFlash=0;state.attackLock=0;renderLoot();updateUI();
}
// Role tuning: every role must keep ~equal damage per mana on its best target set.
const CHAIN_FALLOFF=[1.25,.9,.8,.7,.6,.5];
const DOT_BONUS=1.1,PULL_DAMAGE=.85,PULL_REACH=1.8,PULL_STRENGTH=.35,PULL_SLOW=1.2;
function strike(enemy,dmg,color,src){
  hit(enemy,(enemy.elite||enemy.boss)&&src?.eliteMul?dmg*src.eliteMul:dmg,color,src?.aspect,src?.srcRole);
}
function attackProfile(type) {
  return (typeof PackAttackFx !== 'undefined' && PackAttackFx.resolve)
    ? PackAttackFx.resolve(type)
    : { type, mode: 'projectile', impact: 'vortex' };
}
function pickTarget(item, targets) {
  const aspect = TYPES[item.type].aspect;
  if (!aspect) return targets[0];
  const open = e => !e.aspectLock || e.aspectLock === item.id;
  const favored = targets.filter(e => open(e) && ASPECT_FAVORED[aspect] === e.aspect);
  const chosen = favored[0] || targets.find(open) || targets[0];
  if (ASPECT_FAVORED[aspect] === chosen.aspect) chosen.aspectLock = item.id;
  else if (chosen.aspectLock === item.id) chosen.aspectLock = null;
  return chosen;
}
function weaponAttack(item) {
  if(TYPES[item.type].gear)return false;
  const cost=attackManaCost(item);
  if((state.mana??0)<cost)return false;
  const pool = state.enemies.filter(e => e.hp > 0 && e.x < W - 5).sort((a,b) => a.x-b.x);
  if (!pool.length) return false;
  state.mana=Math.max(0,(state.mana||0)-cost);
  const syn=PackCore.synergyStats(state.items,item);
  if(syn.manaRefund)state.mana=Math.min(state.maxMana||state.mana,state.mana+Math.round(cost*syn.manaRefund));
  if(syn.heal)state.hp=Math.min(state.maxHp||100,state.hp+syn.heal);
  wield(item);
  const d = TYPES[item.type], target = pickTarget(item, pool), level = item.level, dmg=attackDamage(item);
  const burst = d.role === 'burst' ? PackCore.BURST_MUL : 1;
  const eliteMul = syn.eliteMul * (d.role === 'burst' ? PackCore.BURST_ELITE : 1);
  const fxFrom = state.effects.length, shotFrom = state.projectiles.length;
  const targets = [target, ...pool.filter(e => e !== target)];
  const x = W * .27 + 20, y = groundY() - 30;
  const profile = attackProfile(item.type);
  const mode = profile?.mode || 'projectile';

  if (mode === 'beam') {
    const ticks = level < 3 ? 1 : level === 3 ? 3 : 5;
    state.effects.push({ kind:'beam', x:target.x, target, level, age:0, life:.88 + ticks * .18,
      nextTick:.28, ticks, remaining:ticks, radius:[28,45,70,108][level-1], damage:Math.round(dmg*itemShots(item)/ticks), color:d.color, aspect:d.aspect });
    beep(360 + level * 70, .22, 'sine', .025);
  } else if (mode === 'storm') {
    let fromX=x, fromY=y;
    // Chain falloff: one tap must not full-clear a packed wave.
    const chain = targets.slice(0, level + 2);
    chain.forEach((enemy, i) => {
      state.arcs.push({x:fromX,y:fromY,ex:enemy.x,ey:enemy.y-enemy.size,life:.32,color:d.color,level});
      state.effects.push({kind:'lightning',x:enemy.x,level,age:0,life:.9});
      strike(enemy, Math.round(dmg * itemShots(item) * CHAIN_FALLOFF[i]), d.color, {aspect:d.aspect,eliteMul});
      fromX = enemy.x; fromY = enemy.y - enemy.size;
    });
    if (level===4) state.effects.push({kind:'thunderfield',x:target.x,level,age:0,life:1.1,nextTick:.4,remaining:2,damage:Math.round(dmg*.18),radius:W*.55,aspect:d.aspect});
    state.shake=Math.max(state.shake,level); beep(90,.12,'sawtooth',.025);
  } else if (mode === 'thunder_halberd') {
    const ticks = level < 3 ? 2 : level === 3 ? 3 : 5;
    state.effects.push({kind:'thunder_halberd',x:target.x,target,level,age:0,life:1.05+ticks*.12,
      nextTick:.28,remaining:ticks,radius:[50,72,98,130][level-1],damage:Math.round(dmg*itemShots(item)/ticks),color:d.color,aspect:d.aspect});
    for (const enemy of targets.slice(0, Math.min(targets.length, 1 + level))) {
      state.arcs.push({x:target.x,y:groundY()-80,ex:enemy.x,ey:enemy.y-enemy.size,life:.28,color:d.color,level});
    }
    state.shake=Math.max(state.shake,level*1.4); beep(80+level*25,.16,'sawtooth',.028);
  } else if (mode === 'slam') {
    const ticks = level < 3 ? 1 : level === 3 ? 2 : 4;
    state.effects.push({kind:'slam',x:target.x,target,level,age:0,life:.95+ticks*.16,
      nextTick:.42,remaining:ticks,radius:[40,62,88,120][level-1],damage:Math.round(dmg*itemShots(item)/ticks),color:d.color,aspect:d.aspect});
    state.shake=Math.max(state.shake,level*1.6); beep(70+level*20,.18,'sawtooth',.03);
  } else if (mode === 'reap') {
    state.effects.push(launch({kind:'reap',x:target.x,y:target.y-target.size,target,level,age:0,life:.78+level*.06,
      nextTick:.2,remaining:level,radius:[48,70,95,130][level-1],damage:Math.round(dmg*itemShots(item)/Math.max(1,level)),color:d.color,aspect:d.aspect},
      {x,y},FLY_TIME.reap,{weapon:item}));
    beep(220+level*40,.14,'triangle',.022);
  } else if (mode === 'runes') {
    const ticks = level < 3 ? 1 : level === 3 ? 3 : 5;
    state.effects.push({kind:'runes',x:target.x,target,level,age:0,life:1.05+ticks*.12,
      nextTick:.34,remaining:ticks,radius:[36,55,78,110][level-1],damage:Math.round(dmg*itemShots(item)/ticks),color:d.color,aspect:d.aspect});
    beep(400+level*55,.2,'sine',.028);
  } else if (mode === 'orbs') {
    const seen=new Set();
    for (let i=0;i<itemShots(item);i++) {
      const enemy=targets[i%targets.length];
      const showFx=!seen.has(enemy);
      if(showFx)seen.add(enemy);
      // Cel 1 of the orb strip is the bare orb: it is the projectile, the rest is the hit.
      state.effects.push(launch({kind:'orbs',x:enemy.x,y:enemy.y-enemy.size,target:enemy,level,age:0,life:.75+i*.04,
        nextTick:.2+i*.08,remaining:1,radius:28+level*6,damage:Math.round(dmg*burst),color:d.color,aspect:d.aspect,showFx},
        {x,y},FLY_TIME.orbs,{sheet:orbFx,cols:6,rows:1,frame:1,color:d.color},i*.06));
    }
    beep(480,.1,'sine',.02);
  } else if (mode === 'flurry') {
    for (let i=0;i<itemShots(item);i++) {
      const enemy=targets[i%targets.length];
      state.effects.push(launch({kind:'flurry',x:enemy.x+(i%2?12:-12),y:enemy.y-enemy.size,target:enemy,level,age:0,life:.45,
        nextTick:.08+i*.05,remaining:1,radius:22,damage:Math.round(dmg*burst),color:d.color,tilt:i,aspect:d.aspect,
        sheet:item.type==='hammer'?'hammer':'dagger'},{x,y},FLY_TIME.flurry,{weapon:item},i*.05));
    }
    beep(item.type==='hammer'?160:520,item.type==='hammer'?.1:.05,'triangle',item.type==='hammer'?.025:.016);
  } else if (mode === 'ground') {
    const kind = profile.effectKind || 'generic_slam', role = d.role || 'nova';
    const dot = role === 'dot';
    const ticks = (level < 3 ? 1 : level === 3 ? 2 : 3) * (dot ? 2 : 1), tickGap = dot ? .3 : .18;
    const radius = kind === 'generic_bolt' ? [32,48,70,96][level-1] : [36,55,78,105][level-1];
    const total = dmg * itemShots(item) * burst * (dot ? DOT_BONUS : role === 'pull' ? PULL_DAMAGE : 1);
    const fx={kind,x:target.x,fromX:x+36,target,level,age:0,life:.85+ticks*(dot?tickGap:.14),
      nextTick:.3,remaining:ticks,tickGap,role,chain:role==='chain'?level+2:0,radius,damage:Math.round(total/ticks),color:d.color,aspect:d.aspect};
    // Sheets without drawn flight cels throw their own opening spark at the foe.
    if (legendFx[kind] && !LEGEND_TRAVEL[kind]) launch(fx,{x,y},FLY_TIME.legend,{sheet:legendFx[kind],frame:0,color:d.color});
    state.effects.push(fx);
    if (kind === 'generic_bolt') {
      state.arcs.push({x:x,y:y,ex:target.x,ey:target.y-target.size,life:.28,color:d.color,level});
      beep(300+level*40,.12,'sine',.02);
    } else {
      state.shake=Math.max(state.shake,level*1.2); beep(90+level*18,.14,'sawtooth',.025);
    }
  } else {
    const delayBase = (profile.impact === 'bow' || profile.impact === 'spear' || profile.pierce) ? .24 : 0;
    for (let i=0;i<itemShots(item);i++) state.projectiles.push({x,y:y-i*3,vx:460+level*45,vy:0,target:targets[i%targets.length],
      type:item.type,color:d.color,level,damage:dmg,life:2.5,phase:i*1.2,delay:delayBase+i*.085,hitIds:new Set(),
      impact:profile.impact||'vortex', splash:!!profile.splash, pierce:!!profile.pierce, aspect:d.aspect});
    if (profile.impact === 'vortex' && level===4) state.effects.push({kind:'vortex',x:target.x,level,age:0,life:1.1,nextTick:.25,remaining:3,damage:Math.round(dmg*.25),radius:95,aspect:d.aspect});
    beep(profile.impact==='slash'?420:260,.06,'triangle',.018);
  }
  // srcRole, not role: `fx.role` already picks the tick behavior of ground effects.
  for (const fx of state.effects.slice(fxFrom)) { fx.eliteMul = eliteMul; fx.srcRole = d.role; }
  for (const p of state.projectiles.slice(shotFrom)) { p.eliteMul = eliteMul; p.srcRole = d.role; }
  return true;
}
function updateEffects(dt, combat) {
  state.handFlash=Math.max(0,state.handFlash-dt);state.attackLock=Math.max(0,(state.attackLock||0)-dt);
  for(const fx of state.effects) {
    fx.age+=dt; fx.life-=dt;
    if (inFlight(fx)) {
      if (fx.target?.hp>0) { fx.x=fx.target.x; fx.y=fx.target.y-fx.target.size; }
      continue;
    }
    if ((fx.kind==='beam'||fx.kind==='slam'||fx.kind==='runes'||fx.kind==='thunder_halberd'||fx.kind==='generic_slam'||fx.kind==='generic_bolt') && fx.age<.28 && fx.target?.hp>0) fx.x=fx.target.x;
    if (legendFx[fx.kind]) {
      const pose = legendPose(impactView(fx));
      fx.x = pose.x; fx.lift = pose.lift;
      if (!pose.landed) continue;
    }
    if (fx.kind==='orbs' && fx.target?.hp>0) { fx.x=fx.target.x; fx.y=fx.target.y-fx.target.size; }
    if (fx.kind==='flurry' && fx.target?.hp>0) { fx.x=fx.target.x+(fx.orbit!=null?Math.cos(fx.age*8+fx.orbit)*18:0); fx.y=fx.target.y-fx.target.size; }
    if (!combat || !fx.remaining || fx.age<fx.nextTick) continue;
    fx.remaining--; fx.nextTick+=fx.tickGap||(fx.kind==='flurry'?.06:fx.kind==='reap'?.14:.18);
    const color=fx.kind==='thunderfield'||fx.kind==='thunder_halberd'||fx.kind==='generic_bolt'?'#95e8ff':fx.kind==='vortex'?'#d3f994':fx.kind==='slam'||fx.kind==='generic_slam'?'#e8b878':fx.kind==='reap'?'#c8e0a8':fx.kind==='runes'?'#d4b8ef':fx.kind==='orbs'?'#a8d4ef':fx.kind==='flurry'?'#f0d090':'#e7bdff';
    const inside=e=>e.hp>0&&Math.abs(e.x-fx.x)<=(fx.radius||20)+e.size;
    if(fx.kind==='orbs'||fx.kind==='flurry'){
      if(fx.target?.hp>0)strike(fx.target,fx.damage,color,fx);
    } else if(fx.role==='burst'){
      const focus=fx.target?.hp>0?fx.target:state.enemies.filter(inside).sort((a,b)=>Math.abs(a.x-fx.x)-Math.abs(b.x-fx.x))[0];
      if(focus)strike(focus,fx.damage,color,fx);
    } else if(fx.role==='chain'){
      const links=state.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.abs(a.x-fx.x)-Math.abs(b.x-fx.x)).slice(0,fx.chain);
      links.forEach((e,i)=>{
        if(i)state.arcs.push({x:links[i-1].x,y:links[i-1].y-links[i-1].size,ex:e.x,ey:e.y-e.size,life:.26,color:fx.color||color,level:fx.level});
        strike(e,Math.round(fx.damage*CHAIN_FALLOFF[i]),color,fx);
      });
    } else {
      if(fx.role==='pull')for(const e of state.enemies){
        if(e.hp<=0||Math.abs(e.x-fx.x)>(fx.radius||20)*PULL_REACH+e.size)continue;
        e.x+=(fx.x-e.x)*PULL_STRENGTH;e.slow=Math.max(e.slow||0,PULL_SLOW);
      }
      state.enemies.filter(inside).forEach(e=>strike(e,fx.damage,color,fx));
    }
    state.shake=Math.max(state.shake,fx.level*1.5);
    if(fx.kind==='beam'||fx.kind==='slam'||fx.kind==='runes'||fx.kind==='thunder_halberd'||fx.kind==='generic_slam'||legendFx[fx.kind]) { state.flash=Math.max(state.flash,.12+fx.level*.045); beep(160+fx.level*70,.12,'triangle',.035); }
  }
  state.effects=state.effects.filter(fx=>fx.life>0);
}
function impact(p, enemy) {
  strike(enemy,p.damage,p.color,p);
  const profile = attackProfile(p.type);
  const impactKind = p.impact || profile?.impact || null;
  if(impactKind==='bow'||impactKind==='spear'||impactKind==='bomb') {
    const kind = impactKind === 'bow' ? 'bow' : impactKind === 'spear' ? 'spear' : 'bomb';
    // Bomb blast plants on the ground at impact X — not stuck to the enemy torso.
    const blastY = kind === 'bomb' ? null : enemy.y - enemy.size;
    state.effects.push({kind,x:enemy.x,y:blastY,level:p.level,age:0,life:kind==='bomb'?.56:.22});
    if(kind==='bomb') {
      const radius=35+p.level*23;
      state.enemies.filter(e=>e!==enemy&&e.hp>0&&Math.abs(e.x-enemy.x)<radius).forEach(e=>strike(e,Math.round(p.damage*.45),p.color,p));
      if(p.level>=3)state.effects.push({kind:'afterburn',x:enemy.x,y:null,level:p.level,age:0,life:.9,nextTick:.4,remaining:p.level===4?2:1,damage:Math.round(p.damage*.22),radius,aspect:p.aspect,srcRole:p.srcRole});
    }
    if(kind==='bow'&&p.level===4&&!p.phase&&!p.bloomTriggered){
      p.bloomTriggered=true;
      state.effects.push({kind:'bowBloom',x:enemy.x,y:enemy.y-enemy.size,level:4,age:0,life:.9,nextTick:.25,remaining:2,damage:Math.round(p.damage*.25),radius:75,aspect:p.aspect,srcRole:p.srcRole});
    }
    if((kind==='spear'||p.pierce)&&p.level>=3&&p.hitIds.size===1)state.enemies.filter(e=>e!==enemy&&e.hp>0&&Math.abs(e.x-enemy.x)<60).forEach(e=>strike(e,Math.round(p.damage*.3),p.color,p));
  }
  if(impactKind==='vortex' && p.level<4)state.effects.push({kind:'vortex',x:enemy.x,level:p.level,age:0,life:.72});
  if(impactKind==='fire') {
    state.effects.push({kind:'fire',x:enemy.x,level:p.level,age:0,life:.8+p.level*.08});
    if(p.splash!==false && (p.splash || p.type==='axe') && p.level>=2)
      state.enemies.filter(e=>e!==enemy && e.hp>0 && Math.abs(e.x-enemy.x)<[0,35,70,105][p.level-1]).forEach(e=>strike(e,Math.round(p.damage*.5),p.color,p));
    state.shake=Math.max(state.shake,p.level*1.4);
  }
  if(impactKind==='slash') state.effects.push({kind:'slash',x:enemy.x,level:p.level,age:0,life:.9});
}
function updateCombat(dt) {
  state.encounterTime=(state.encounterTime||0)+dt;spawnScheduledEnemies();
  const stats=PackCore.upgradeStats(runUpgrades());
  state.maxMana=stats.maxMana;
  state.focus=(state.encounterTime-(state.lastAttackAt||0))>=FOCUS_DELAY;
  state.mana=Math.min(state.maxMana,(state.mana||0)+stats.manaRegen*(state.focus?FOCUS_MUL:1)*dt);
  if(state.combo?.count){state.combo.timer-=dt;if(state.combo.timer<=0)state.combo.count=0;}
  for(const item of state.items) {
    state.cooldowns[item.id]=(state.cooldowns[item.id]||0)-dt;
    state.cooldowns[item.id]=Math.max(0,state.cooldowns[item.id]);
  }
  // Only the front MELEE_SLOTS enemies can reach the frog; the rest queue behind them.
  const queue=state.enemies.filter(e=>e.hp>0).sort((a,b)=>a.x-b.x);
  for(const e of state.enemies) {
    if(e.hp<=0)continue;
    const kind=ENEMY_KINDS[e.kind];e.age=(e.age||0)+dt;
    const slot=queue.indexOf(e);
    if(kind?.rage&&e.hp<e.maxHp*.5&&!e.enraged){e.enraged=true;e.speed*=1.2;e.damageScale*=1.15;burst(e.x,e.y-e.size,'#ff985e',15);}
    const aura=state.enemies.reduce((speed,other)=>other!==e&&other.hp>0&&Math.abs(other.x-e.x)<W*.22?Math.max(speed,ENEMY_KINDS[other.kind]?.aura||1):speed,1);
    const slowed=e.slow>0?.45:1;e.slow=Math.max(0,(e.slow||0)-dt);
    e.blight=Math.max(0,(e.blight||0)-dt);
    e.hit=Math.max(0,e.hit-dt);
    if(e.boss){updateBoss(e,kind,dt,slowed);if(state.mode!=='running')return;if(e.stun>0)continue;}
    e.x-=e.speed*dt*aura*slowed*(kind?.charge&&e.age%3<.55?2.2:1); e.attack-=dt*slowed;
    if(kind?.flying)e.y=(e.baseY??H*.78)-12+Math.sin(e.age*5)*9;
    if(kind?.regen&&!(e.blight>0))e.hp=Math.min(e.maxHp,e.hp+kind.regen*dt);
    if(kind?.healer&&e.age>=(e.nextHeal||4)){
      e.nextHeal=e.age+4;
      if(!(e.blight>0))for(const ally of state.enemies)if(ally!==e&&ally.hp>0&&!(ally.blight>0)&&Math.abs(ally.x-e.x)<W*.24){ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*.03);burst(ally.x,ally.y-ally.size,'#a4e88d',4);}
    }
    if(kind?.summon&&e.age>=(e.nextSummon||5)&&state.enemies.length<10){
      e.nextSummon=e.age+7;
      spawnEnemy(false);const add=state.enemies.at(-1);
      Object.assign(add,{kind:'spider',x:Math.min(W-10,e.x+25),y:H*.78,baseY:H*.78,age:0,hp:Math.round(levelInfo().health*.6),maxHp:Math.round(levelInfo().health*.6),speed:Math.max(45,W*.14)*levelInfo().speedScale,damageScale:levelInfo().damageScale,elite:false,size:18});
      state.waveTotal++;burst(e.x,e.y-e.size,'#b794d5',8);
    }
    const front=slot<MELEE_SLOTS;
    const stop=W*.27+e.size+18+(front?0:(slot-MELEE_SLOTS+1)*QUEUE_GAP*castScale());
    if(e.x<stop) {
      e.x=stop;
      if(front&&e.attack<=0) {
        const received=Math.max(1,Math.round((kind?.power||(e.boss?10:4))*(e.elite?1.5:1)*(e.damageScale||1)*(1-PackCore.reductionFor(state.items))));
        state.damageTaken+=Math.min(state.hp,received);state.hp=Math.max(0,state.hp-received);e.attack=kind?.charge?(e.boss?1.05:.9):1.2;
        state.shake=5; burst(W*.27,H*.78-25,'#f39178',10); beep(95,.1,'sawtooth'); buzz(state.hp<=0?[60,40,120]:25);
        if(state.hp<=0) {finish(false);return;}
      }
    }
  }
  for(const p of state.projectiles) {
    if(p.delay>0){p.delay-=dt;continue;} p.life-=dt;
    if(p.target.hp<=0) p.target=state.enemies.find(e=>e.hp>0)||p.target;
    p.vy=(p.target.y-p.target.size-p.y)*3; p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(Math.random()<.75) state.particles.push({x:p.x,y:p.y,vx:-45,vy:0,life:.2+p.level*.07,max:.5,color:p.color,size:p.level});
    for(const e of state.enemies) {
      if(e.hp<=0 || p.hitIds.has(e) || Math.abs(e.x-p.x)>e.size+14 || Math.abs(e.y-e.size-p.y)>e.size+18)continue;
      p.hitIds.add(e); impact(p,e);
      const pierces=p.pierce||p.type==='spear'||p.type==='bow'&&p.level>=3||p.type==='blade'&&p.level>=2||p.type==='shuriken'&&p.level>=3;
      // Unlimited pierce let one uncommon spear outdamage every mythic on a packed wave.
      if(!pierces||p.hitIds.size>p.level){p.life=0;break;}
    }
  }
  state.projectiles=state.projectiles.filter(p=>p.life>0&&p.x<W+80);
  state.enemies=state.enemies.filter(e=>e.hp>0);
}
function updateRun(dt) {
  if(state.mode!=='running')return;
  if(!warmGameAssets())return;
  warmFxBounds();
  updateEffects(dt,state.phase==='combat');
  if(state.mode!=='running')return;
  if(state.phase==='combat') {
    updateCombat(dt);
    if(state.mode==='running' && !state.enemies.some(e=>e.hp>0)&&!state.pendingEnemies?.length)clearEncounter();
  } else if(state.phase==='victory') {
    state.phaseTime-=dt;
    if(state.phaseTime<=0) {
      if(state.wave===currentStage().lastWave){finish(true);return;}
      state.phase='travel';state.nextLoot=(state.stops+1)*LEG_DISTANCE;
      renderLoot();
      announce('FORWARD!');
    }
  } else if(state.phase==='depart') {
    state.runTime+=dt;state.distance=Math.min(state.departEnd,state.distance+RUN_SPEED*dt);
    if(state.distance>=state.departEnd){startEncounter();state.stopAge=0;}
  } else if(state.phase==='chest') {
    const prev=state.chestAge;state.chestAge+=dt;updateChestSuspense(prev,state.chestAge);
    if(state.chestAge>=CHEST_DURATION)lootStop();
  } else if(state.phase==='travel') {
    state.runTime+=dt;state.distance=Math.min(state.nextLoot,state.distance+RUN_SPEED*dt);
    if(state.distance>=state.nextLoot)beginChest();
  }
}

const STOP_DURATION=.56;
const stopFrames = new Image(); // Retained only for legacy fallback code; not downloaded.
// Last exposure uses the existing idle cel, avoiding a mismatched final generated pose.
function stopCel(){return celFrame(state.stopAge,STOP_DURATION,[.06,.08,.10,.12,.10,.10]);}
function renderStoppingHero() {
  if(!stopFrames.complete||!stopFrames.naturalWidth)return false;
  const frame=stopCel();if(frame===5)return renderBattleHero();
  const size=Math.min(108,Math.max(82,H*.40)),ground=groundY(),scale=size/460;
  const sx=(frame%3)*512,sy=frame<3?50:520;
  const hands=[[437,297],[408,315],[401,319],[406,778],[403,783]];
  const [hx,worldY]=hands[frame],hy=worldY-sy;
  const left=W*.27-size*.60,top=ground-450*scale;
  ellipse(W*.27,ground+3,size*.27,3.5,'#10251d55');
  ctx.drawImage(stopFrames,sx,sy,512,460,left,top,512*scale,460*scale);
  drawHeldWeapons(size,ground,{x:left+hx*scale,y:top+hy*scale});
  ctx.drawImage(stopFrames,sx+hx-18,sy+hy-20,36,40,left+(hx-18)*scale,top+(hy-20)*scale,36*scale,40*scale);
  return true;
}

const newAttackFrames = assetImage('new-attacks-v1.png');
const beamFrames = assetImage('beam-frames-v2.png');
const hammerFx = assetImage('hammer-fx-v4.png');
const scytheFx = assetImage('scythe-fx-v2.png');
const scythe12Fx = assetImage('scythe-fx-v4.png');
const orbFx = assetImage('orb-fx-v3.png');
const daggerFx = assetImage('dagger-fx-v3.png');
const shurikenFx = assetImage('shuriken-fx-v2.png');
const thunderHalberdFx = assetImage('thunder-halberd-fx-v2.png');
// Flight frames cross from the frog to the target. Later frames are the hit and stay there.
const LEGEND_TRAVEL = {
  void_greatsword: { hit: 6 },
  bone_scythe: { hit: 8 },
  phoenix_lance: { hit: 3 }
};
const legendFx = {
  eclipse_censer: assetImage('eclipse-censer-fx-v2.png'),
  void_greatsword: assetImage('void-greatsword-fx-v2.png'),
  doomsday_bell: assetImage('doomsday-bell-fx-v2.png'),
  bone_scythe: assetImage('bone-scythe-fx-v2.png'),
  phoenix_lance: assetImage('phoenix-lance-fx-v1.png?v=fx2'),
  abyss_eye: assetImage('abyss-eye-fx-v2.png'),
  demon_inferno: assetImage('demon-fx-v2.png'),
  spirit_epic: assetImage('spirit-epic-fx-v2.png'),
  frost_scepter: assetImage('frost-scepter-fx-v2.png'),
  thunder_hammer: assetImage('thunder-hammer-fx-v2.png'),
  holy_flail: assetImage('holy-flail-fx-v2.png'),
  blood_falchion: assetImage('blood-falchion-fx-v2.png'),
  plague_censer: assetImage('plague-censer-fx-v2.png'),
  astral_mirror: assetImage('astral-mirror-fx-v2.png'),
  starfall_shard: assetImage('starfall-shard-fx-v2.png'),
  tome_rune: assetImage('tome-fx-v4.png'),
  solar_bow: assetImage('solar-bow-fx-v2.png'),
  dragon_pike: assetImage('dragon-pike-fx-v1.png'),
  chaos_flail: assetImage('chaos-flail-fx-v1.png'),
  moon_glaive: assetImage('moon-glaive-fx-v1.png'),
  clockwork_trap: assetImage('clockwork-trap-fx-v1.png')
};
const axe12Fx = assetImage('axe-fx-v3.png');
const blade12Fx = assetImage('blade-fx-v3.png');
const slamFrames = assetImage('slam-frames-v1.png');
const meleeFx = assetImage('melee-fx-v1.png');
const weaponFrames = assetImage('weapon-frames-v2.png',true);
const tomeFx = assetImage('tome-fx-6f.png');
const tome12Fx = { complete:false, naturalWidth:0 };
const heroAttackFrames = new Image(); // Retained only for legacy fallback code; not downloaded.
const CEL_HOLDS = [.09,.11,.15,.13,.11,.13];
const TWELVE_HOLDS = [.08,.09,.10,.07,.09,.12,.14,.12,.10,.09,.08,.07];
function draw12FrameFx(sheet,frame,x,ground,destW,destH,anchorY=1.0){
  if(!sheet?.complete||!sheet.naturalWidth)return false;
  const cols=4,rows=3;
  frame=Math.max(0,Math.min(11,frame|0));
  const sw=sheet.naturalWidth/cols,sh=sheet.naturalHeight/rows;
  const col=frame%cols,row=Math.floor(frame/cols);
  ctx.drawImage(sheet,col*sw,row*sh,sw,sh,x-destW/2,ground-destH*anchorY,destW,destH);
  return true;
}
/** Cohesive sky strike — one stroke language top→bottom (no sheet splice). */
function drawEpicLightning(x,ground,frame){
  if(typeof ctx.beginPath!=='function')return false;
  const sky=-28;
  const y1=ground-2;
  const segs=Math.max(14,((y1-sky)/18)|0);
  const amp=9+(frame%3);
  const seed=frame*1.9;
  const boltPath=(widen)=>{
    ctx.beginPath();
    let px=x;
    ctx.moveTo(px,sky);
    for(let i=1;i<=segs;i++){
      const t=i/segs;
      const y=sky+(y1-sky)*t;
      const jag=Math.sin(i*2.6+seed)*amp+((i%2)?amp*.55:-amp*.55);
      px=x+jag*(1-t*.15)*widen;
      ctx.lineTo(px,y);
    }
  };
  const strokeBolt=(color,alpha,width,widen=1)=>{
    ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;
    ctx.lineJoin='round';ctx.lineCap='round';
    boltPath(widen);ctx.stroke();
  };
  ctx.save();
  strokeBolt('#38bdf8',.4,10,1);
  strokeBolt('#7dd3fc',.85,5.2,1);
  strokeBolt('#f8fcff',1,2.2,1);

  if(frame>=3&&frame<=8){
    const fork=(dir,len)=>{
      const fy=ground-28-frame*2;
      ctx.beginPath();
      ctx.moveTo(x+dir*4,fy);
      ctx.lineTo(x+dir*(14+len),fy-18-len);
      ctx.lineTo(x+dir*(8+len*.5),fy-34-len);
      ctx.strokeStyle='#7dd3fc';ctx.globalAlpha=.9;ctx.lineWidth=3.2;ctx.stroke();
      ctx.strokeStyle='#f8fcff';ctx.globalAlpha=1;ctx.lineWidth=1.4;ctx.stroke();
    };
    fork(-1,frame);fork(1,frame*.8);
    if(frame>=6){fork(-1,frame+4);fork(1,frame+2);}
  }

  const burst=frame>=2?(18+Math.min(36,frame*4)):8;
  ctx.globalAlpha=.9;
  ctx.strokeStyle='#38bdf8';ctx.lineWidth=3;
  ctx.beginPath();
  for(let i=0;i<7;i++){
    const a=(-Math.PI*.15)+i*(Math.PI*1.3/6);
    ctx.moveTo(x,ground-2);
    ctx.lineTo(x+Math.cos(a)*burst,ground-2-Math.sin(a)*burst*.85);
  }
  ctx.stroke();
  ctx.strokeStyle='#f8fcff';ctx.lineWidth=1.5;ctx.stroke();

  if(frame>=5&&frame<=8){
    ctx.globalAlpha=.75;
    ctx.strokeStyle='#7dd3fc';ctx.lineWidth=2.4;
    ctx.beginPath();
    ctx.ellipse(x,ground-4,22+frame*2,7,0,0,Math.PI*2);
    ctx.stroke();
  }

  if(frame>=3&&frame<=9){
    ctx.fillStyle='#9ae6ff';ctx.globalAlpha=.95;
    for(let i=0;i<4;i++){
      const sx=x+((i%2)?1:-1)*(12+i*5);
      const sy=ground-10-i*7-(frame%3)*3;
      ctx.beginPath();
      ctx.moveTo(sx,sy-3);ctx.lineTo(sx+2,sy);ctx.lineTo(sx,sy+3);ctx.lineTo(sx-2,sy);
      ctx.closePath();ctx.fill();
    }
  }
  ctx.restore();
  return true;
}
function drawSkyThunderFx(sheet,frame,x,ground){
  frame=Math.max(0,Math.min(11,frame|0));
  if(frame>=10){
    if(sheet?.complete&&sheet.naturalWidth){
      const sw=sheet.naturalWidth/4,sh=sheet.naturalHeight/3;
      const col=frame%4,row=(frame/4)|0;
      const w=96,h=110;
      ctx.drawImage(sheet,col*sw,row*sh,sw,sh,x-w/2,ground-h,w,h);
      return true;
    }
    ctx.save();
    ctx.fillStyle='#7dd3fc';ctx.globalAlpha=frame===11?.5:.8;
    ctx.beginPath();ctx.arc(x,ground-12,3,0,Math.PI*2);ctx.fill();
    ctx.restore();
    return true;
  }
  return drawEpicLightning(x,ground,frame);
}
// Painted extents per cell as cell fractions: cells carry a lot of padding, so art is sized by what is drawn.
// feet[i] is the lowest dense row of paint. Null when pixels are unreadable (no canvas, tainted image).
function sheetBounds(sheet, cols=4, rows=3) {
  const key=cols+'x'+rows;
  if (sheet._bounds?.key===key) return sheet._bounds.value;
  sheet._bounds={key,value:null};
  const sw=sheet.naturalWidth/cols|0, sh=sheet.naturalHeight/rows|0;
  const scratch=document.createElement('canvas');
  scratch.width=sw; scratch.height=sh;
  const g=scratch.getContext?.('2d',{willReadFrequently:true});
  if (!g?.getImageData || !sw || !sh) return null;
  const minFoot=Math.max(18, sw*0.06), frames=[], feet=[];
  let union=null;
  try {
    for (let i=0;i<cols*rows;i++) {
      g.clearRect(0,0,sw,sh);
      g.drawImage(sheet,(i%cols)*sw,((i/cols)|0)*sh,sw,sh,0,0,sw,sh);
      const data=g.getImageData(0,0,sw,sh).data;
      let x0=sw, y0=sh, x1=-1, y1=-1, foot=sh;
      for (let y=0;y<sh;y++) {
        const row=y*sw*4;
        let n=0, lo=sw, hi=-1;
        for (let x=0;x<sw;x++) if (data[row+x*4+3]>32) { n++; if (x<lo) lo=x; hi=x; }
        // A few stray pixels are dust, not art.
        if (n>=3) { if (y<y0) y0=y; y1=y; if (lo<x0) x0=lo; if (hi>x1) x1=hi; }
        if (n>=minFoot) foot=y+1;
      }
      const box=x1<0?null:[x0/sw,y0/sh,(x1+1)/sw,(y1+1)/sh];
      if (box) union=union?[Math.min(union[0],box[0]),Math.min(union[1],box[1]),Math.max(union[2],box[2]),Math.max(union[3],box[3])]:box;
      frames.push(box); feet.push(foot/sh);
    }
  } catch { return null; }
  sheet._bounds.value={frames,feet,union:union||[0,0,1,1]};
  return sheet._bounds.value;
}
// One ground line per sheet: anchoring each cel on its own lowest paint made the art hop every frame.
function legendAnchor(sheet) {
  if (!sheet?.complete || !sheet.naturalWidth) return 1;
  const feet=sheetBounds(sheet)?.feet;
  return feet?.length ? Math.max(...feet) : 1;
}
function legendPaintHeight(sheet) {
  const union=sheet?.complete && sheet.naturalWidth ? sheetBounds(sheet)?.union : null;
  return union ? Math.max(.35, union[3]-union[1]) : .8;
}
function legendFrame(fx) {
  // Flight sheets must not loop back into their flight cels.
  const hit = LEGEND_TRAVEL[fx.kind]?.hit;
  const loop = hit ? [hit, Math.min(11, hit + 3)] : [4, 8];
  return artFrame(fx.age, Math.max(.28, fx.age + fx.life), TWELVE_HOLDS, loop);
}
function legendPose(fx) {
  const travel = LEGEND_TRAVEL[fx.kind];
  const frame = legendFrame(fx);
  // A thrown effect is planted where it landed; sliding along with the foe reads as jitter.
  const to = fx.fly ? fx.x : fx.target?.hp > 0 ? fx.target.x : fx.x;
  if (!travel || frame >= travel.hit) return { x: to, lift: 0, frame, landed: true };
  const t = frame / travel.hit;
  const ease = t * t * (3 - 2 * t);
  if (travel.sky) return { x: to, lift: 0, frame, landed: false };
  const from = fx.fromX != null ? fx.fromX : to;
  return { x: from + (to - from) * ease, lift: 0, frame, landed: false };
}
// Hits leave the frog first instead of popping inside the foe. Damage and the hit cels wait for the landing.
const FLY_TIME={legend:.18,orbs:.16,flurry:.12,reap:.14};
function launch(fx, from, dur, art, delay=0) {
  fx.fly={x:from.x,y:from.y,dur,delay,...art};
  const lead=delay+dur;
  fx.life+=lead; fx.nextTick=(fx.nextTick||0)+lead;
  return fx;
}
function flyLead(fx) { return fx.fly ? fx.fly.delay+fx.fly.dur : 0; }
function inFlight(fx) { return !!fx.fly && fx.age<flyLead(fx); }
/** The effect as its hit animation sees it: age counted from the landing. */
function impactView(fx) { const lead=flyLead(fx); return lead ? {...fx,age:fx.age-lead} : fx; }
function flightPoint(fx, t) {
  const f=fx.fly, live=fx.target?.hp>0;
  const tx=live?fx.target.x:fx.x, ty=live?fx.target.y-fx.target.size:(fx.y??groundY()-30);
  const arc=Math.min(70,Math.abs(tx-f.x)*.2);
  return {x:f.x+(tx-f.x)*t, y:f.y+(ty-f.y)*t-Math.sin(Math.PI*t)*arc};
}
function drawFlightCel(f, size) {
  const cols=f.cols||4, rows=f.rows||3, frame=f.frame||0, sheet=f.sheet;
  if (!sheet?.complete || !sheet.naturalWidth) {
    if (typeof ctx.beginPath!=='function') return;
    ctx.fillStyle=f.color||'#fff'; ctx.beginPath(); ctx.arc(0,0,size*.3,0,Math.PI*2); ctx.fill(); return;
  }
  const sw=sheet.naturalWidth/cols, sh=sheet.naturalHeight/rows;
  const b=sheetBounds(sheet,cols,rows)?.frames[frame]||[0,0,1,1];
  const bw=(b[2]-b[0])*sw, bh=(b[3]-b[1])*sh, k=size/Math.max(bw,bh);
  ctx.drawImage(sheet,(frame%cols)*sw+b[0]*sw,((frame/cols)|0)*sh+b[1]*sh,bw,bh,-bw*k/2,-bh*k/2,bw*k,bh*k);
}
function drawFlight(fx) {
  const f=fx.fly, t=(fx.age-f.delay)/f.dur;
  if (t<0) return;
  const size=(f.weapon?30+fx.level*3:24+fx.level*5)*castScale();
  // Fading ghosts along the arc read as speed without a trail sheet.
  for (let k=3;k>=0;k--) {
    const tk=Math.min(1,t)-k*.1;
    if (tk<0) continue;
    const p=flightPoint(fx,tk), s=size*(1-k*.14);
    ctx.save(); ctx.translate(p.x,p.y);
    if (k) { ctx.globalAlpha=.42-k*.1; ctx.globalCompositeOperation='lighter'; }
    if (f.weapon) { ctx.rotate?.((fx.age-k*.03)*22); drawItemArt(f.weapon,-s/2,-s/2,s); }
    else drawFlightCel(f,s);
    ctx.restore();
  }
}
// House cadence: every sheet plays at 12 cels/s ("on twos") however long its damage window is.
// Stretching cels over the window made upgraded weapons (longer windows) the choppiest ones.
// Longer windows loop the peak cels [loop[0], loop[1]); holds keep their relative weight.
const ART_CEL=1/12;
function artFrame(age, whole, holds=CEL_HOLDS, loop=null) {
  const span=holds.length*ART_CEL;
  if (whole<=span) return celFrame(age, whole, holds);
  if (!loop) return celFrame(age, span, holds);
  const k=span/holds.reduce((s,h)=>s+h,0), sum=list=>list.reduce((s,h)=>s+h,0)*k;
  const [a,b]=loop, head=sum(holds.slice(0,a)), tail=sum(holds.slice(b)), tailStart=whole-tail;
  if (age<head) return celFrame(age, head, holds.slice(0,a));
  if (age>=tailStart) return b+celFrame(age-tailStart, tail, holds.slice(b));
  // Ping-pong: wrapping from the last peak cel straight to the first reads as a restart.
  const n=b-a, cycle=Math.max(1,2*n-2), i=Math.floor((age-head)/ART_CEL)%cycle;
  return a+(i<n?i:cycle-i);
}
// 60fps motion over the 12fps cels: arrival pops with a slight overshoot, departure fades instead of cutting.
const FX_POP=.12, FX_FADE=.14;
function fxPopScale(age) {
  if (age>=FX_POP) return 1;
  const t=Math.max(0,age)/FX_POP-1, c1=1.70158;
  return .6+.4*(1+(c1+1)*t*t*t+c1*t*t);
}
// The bounds scan costs ~10ms per sheet on desktop, several frames on a phone: do it in idle time, not on the first hit.
let boundsWarmPending=false;
function warmFxBounds() {
  if (boundsWarmPending || typeof requestIdleCallback!=='function') return;
  const sheets=[...Object.values(legendFx).map(s=>[s,4,3]),[scythe12Fx,4,3],[orbFx,6,1]];
  const next=sheets.find(([s,c,r])=>s.complete&&s.naturalWidth&&s._bounds?.key!==c+'x'+r);
  if (!next) return;
  boundsWarmPending=true;
  requestIdleCallback(()=>{boundsWarmPending=false;sheetBounds(...next);});
}
function celFrame(age, duration, holds=CEL_HOLDS) {
  let t=Math.max(0,age)/Math.max(.001,duration)*holds.reduce((a,b)=>a+b,0);
  for(let i=0;i<holds.length;i++){if(t<holds[i])return i;t-=holds[i];}
  return holds.length-1;
}
function drawCel(sheet,col,row,cols,rows,x,y,w,h) {
  if(!sheet.complete||!sheet.naturalWidth)return false;
  const sw=sheet.naturalWidth/cols,sh=sheet.naturalHeight/rows;
  ctx.drawImage(sheet,col*sw,row*sh,sw,sh,x-w/2,y-h,w,h);
  return true;
}
function drawSkyBeam(frame,x,ground,width,height) {
  if(!beamFrames.complete||!beamFrames.naturalWidth)return false;
  if(frame<4||frame>8)return drawCel(beamFrames,frame%4,Math.floor(frame/4),4,3,x,ground,width,height);
  const sw=beamFrames.naturalWidth/4,sh=beamFrames.naturalHeight/3;
  const sx=(frame%4)*sw,sy=Math.floor(frame/4)*sh;
  const split=sh*.12,stripStart=sh*.04;
  const join=ground-height*.88,sky=-32;
  ctx.drawImage(beamFrames,sx,sy+stripStart,sw,split-stripStart,x-width/2,sky,width,join-sky);
  ctx.drawImage(beamFrames,sx,sy+split,sw,sh-split,x-width/2,join,width,height*.88);
  return true;
}
function skyBeamFrame(fx){
  return fx.age<.28 ? celFrame(fx.age,.28,[.06,.08,.10,.04]) : 4+artFrame(fx.age-.28,fx.age+fx.life-.28,[.13,.1,.16,.1,.1,.08,.1,.12],[1,5]);
}
/** One-row strip atlases (6 square cells, bottom-anchored art). */
function drawStripFx(sheet,frame,x,ground,destH,cols=6,widthScale=1){
  if(!sheet?.complete||!sheet.naturalWidth)return false;
  const col=Math.max(0,Math.min(cols-1,frame|0));
  const sw=sheet.naturalWidth/cols,sh=sheet.naturalHeight;
  const destW=Math.max(28,destH*(sw/Math.max(1,sh))*widthScale);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(sheet,col*sw,0,sw,sh,x-destW/2,ground-destH,destW,destH);
  return true;
}
function stripFrame(fx,holds=[.1,.12,.16,.18,.16,.12]){
  return artFrame(fx.age,Math.max(.2,fx.age+fx.life),holds);
}
function inkStroke(pathFn, fill, stroke='#3a2a18', line=2.4) {
  if(typeof ctx.beginPath!=='function')return;
  ctx.beginPath(); pathFn();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
}
function drawStoryColumn(x,ground,width,height,fill,edge='#3a2a18',pulse=0) {
  const top=-28, mid=ground-height*.82, sway=Math.sin(pulse*9)*width*.04;
  inkStroke(()=>{ctx.moveTo(x-width*.22+sway,top);ctx.lineTo(x+width*.22+sway,top);ctx.lineTo(x+width*.38,mid);ctx.lineTo(x+width*.55,ground);ctx.lineTo(x-width*.55,ground);ctx.lineTo(x-width*.38,mid);ctx.closePath();},fill,edge,3);
  ctx.globalAlpha*=.55;
  inkStroke(()=>{ctx.moveTo(x-width*.08+sway,top);ctx.lineTo(x+width*.08+sway,top);ctx.lineTo(x+width*.12,ground-8);ctx.lineTo(x-width*.12,ground-8);ctx.closePath();},'#fff6d8cc',edge,1.5);
  ctx.globalAlpha=1;
  inkStroke(()=>{ctx.ellipse(x,ground-4,width*.62,10+width*.04,0,0,Math.PI*2);},'#f4ecd088',edge,2);
}
function renderCombatEffects() {
  const ground=groundY()+5;
  for(const a of state.arcs||[]){
    if(typeof ctx.beginPath!=='function')break;
    ctx.save();ctx.globalAlpha=Math.max(0,a.life/.32);ctx.strokeStyle=a.color||'#8cdeef';ctx.lineWidth=2+a.level*.4;
    ctx.beginPath();ctx.moveTo(a.x,a.y);
    const mx=(a.x+a.ex)/2+(Math.random()-.5)*18,my=(a.y+a.ey)/2-20;
    ctx.quadraticCurveTo(mx,my,a.ex,a.ey);ctx.stroke();
    ctx.strokeStyle='#3a2a18';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  }
  for(const raw of state.effects) {
    if(inFlight(raw)){drawFlight(raw);continue;}
    const fx=impactView(raw);
    ctx.save();
    if(raw.life<FX_FADE)ctx.globalAlpha=Math.max(0,raw.life/FX_FADE);
    const pop=fxPopScale(fx.age);
    if(pop!==1&&typeof ctx.scale==='function'){ctx.translate(fx.x,ground);ctx.scale(pop,pop);ctx.translate(-fx.x,-ground);}
    if(fx.kind==='beam') {
      const frame=skyBeamFrame(fx);
      const height=Math.min(ground-10,125+fx.level*26),width=height*(.65+fx.level*.075);
      if(fx.level>=3 && frame>=4 && frame<=8) {
        const sideFrame=Math.max(4,frame-1),side=width*.45;
        drawSkyBeam(sideFrame,fx.x-side,ground,width*.55,height*.8);
        if(fx.level===4)drawSkyBeam(sideFrame,fx.x+side,ground,width*.55,height*.8);
      }
      if(!drawSkyBeam(frame,fx.x,ground,width,height)) drawStoryColumn(fx.x,ground,width*.7,height,fx.color||'#bba1ff','#3a2a18',fx.age);
    } else if(fx.kind==='slam') {
      const h=100+fx.level*20;
      const frame=artFrame(fx.age,Math.max(.28,fx.age+fx.life));
      if(!drawCel(slamFrames,frame%4,Math.floor(frame/4)%3,4,3,fx.x,ground,h*1.1,h)) {
        drawStoryColumn(fx.x,ground,40+fx.level*8,h*.7,fx.color||'#e8b878','#3a2a18',fx.age);
      }
    } else if(fx.kind==='runes') {
      const h=125+fx.level*24;
      if(!drawStripFx(tomeFx,stripFrame(fx,[.1,.12,.18,.2,.16,.12]),fx.x,ground,h,6,1.2)) {
        drawStoryColumn(fx.x,ground,36+fx.level*8,h*.65,fx.color||'#d4b8ef','#3a2a18',fx.age);
      }
    } else if(fx.kind==='reap') {
      const h=(96+fx.level*16)*castScale();
      const f12=artFrame(fx.age,Math.max(.25,fx.age+fx.life),TWELVE_HOLDS,[4,8]);
      if(!draw12FrameFx(scythe12Fx,f12,fx.x,ground,h*1.05,h,legendAnchor(scythe12Fx))) {
        if(!drawStripFx(scytheFx,stripFrame(fx,[.1,.12,.18,.2,.16,.12]),fx.x,ground,h,6,2.2)) {
          const y=fx.y??ground-40; ctx.translate(fx.x,y);
          inkStroke(()=>{ctx.moveTo(-30,0);ctx.quadraticCurveTo(10,-35,50,5);ctx.quadraticCurveTo(10,-8,-30,6);ctx.closePath();},fx.color,'#3a2a18',2.8);
        }
      }
    } else if(fx.kind==='orbs') {
      if(fx.showFx===false){ctx.restore();continue;}
      const h=(64+fx.level*10)*castScale();
      // The orb itself already flew in; the hit starts at the ringed orb and bursts from there.
      const frame=fx.fly?2+artFrame(fx.age,Math.max(.2,fx.age+fx.life),[.12,.2,.2,.16]):stripFrame(fx,[.1,.12,.16,.18,.16,.12]);
      if(!drawStripFx(orbFx,frame,fx.x,(fx.y??ground-24)+h*.5,h,6,1.0)) {
        inkStroke(()=>{ctx.ellipse(fx.x,fx.y??ground-36,9+fx.level,9+fx.level,0,0,Math.PI*2);},fx.color,'#3a2a18',2.2);
      }
    } else if(fx.kind==='flurry') {
      const h=(60+fx.level*10)*castScale();
      const sheet=fx.sheet==='hammer'?hammerFx:daggerFx;
      if(!drawStripFx(sheet,stripFrame(fx,[.08,.1,.16,.18,.16,.1]),fx.x,(fx.y??ground-24)+h*.5,h,6,1.0)) {
        ctx.translate(fx.x,fx.y??ground-40);ctx.rotate((fx.tilt||0)*.35-0.4);
        inkStroke(()=>{ctx.moveTo(-4,16);ctx.lineTo(2,-18);ctx.lineTo(8,-14);ctx.lineTo(2,18);ctx.closePath();},fx.color,'#3a2a18',2);
      }
    } else if(fx.kind==='thunder_halberd') {
      const f12=artFrame(fx.age,Math.max(.28,fx.age+fx.life),TWELVE_HOLDS,[4,8]);
      if(!drawSkyThunderFx(thunderHalberdFx,f12,fx.x,ground)) {
        drawStoryColumn(fx.x,ground,28+fx.level*6,Math.min(ground,160+fx.level*20),fx.color||'#0284c7','#3a2a18',fx.age);
      }
    } else if(legendFx[fx.kind]) {
      // Big epics stay large; this batch of 10 stays compact.
      const epic=fx.kind==='eclipse_censer'||fx.kind==='demon_inferno'||fx.kind==='abyss_eye';
      const compact=fx.kind==='frost_scepter'||fx.kind==='thunder_hammer'||fx.kind==='holy_flail'||fx.kind==='blood_falchion'||fx.kind==='plague_censer'||fx.kind==='astral_mirror'||fx.kind==='starfall_shard'||fx.kind==='tome_rune'||fx.kind==='solar_bow'
        ||fx.kind==='dragon_pike'||fx.kind==='chaos_flail'||fx.kind==='moon_glaive'||fx.kind==='clockwork_trap';
      const pose=legendPose(fx);
      const sheet=legendFx[fx.kind];
      // Targets are the height of the painted art; the cell is scaled up to fit its padding.
      const paint=(epic?180+fx.level*32:compact?96+fx.level*18:110+fx.level*20)*castScale();
      const h=paint/legendPaintHeight(sheet);
      const anchor=legendAnchor(sheet);
      if(!draw12FrameFx(sheet,pose.frame,pose.x,ground,h*1.08,h,anchor)) {
        drawStoryColumn(pose.x,ground,38+fx.level*8,h*.7,fx.color||'#e7bdff','#3a2a18',fx.age);
      }
    } else if(fx.kind==='generic_slam') {
      const h=100+fx.level*20;
      const frame=artFrame(fx.age,Math.max(.28,fx.age+fx.life));
      if(!drawCel(slamFrames,frame%4,Math.floor(frame/4)%3,4,3,fx.x,ground,h*1.1,h)) {
        if(!drawCel(meleeFx,frame%4,0,4,1,fx.x,ground,h,h*.85)) {
          drawCel(weaponFrames,frame,0,6,4,fx.x,ground,55+fx.level*14,55+fx.level*14);
        }
      }
    } else if(fx.kind==='generic_bolt') {
      const size=90+fx.level*18;
      const frame=artFrame(fx.age,fx.age+fx.life);
      drawCel(weaponFrames,frame,3,6,4,fx.x,ground,size,size);
    } else {
      if(fx.kind==='bow'||fx.kind==='bowBloom'){
        const bloom=fx.kind==='bowBloom',duration=bloom?.9:.22,size=(bloom?56:30+fx.level*4)*castScale();
        ctx.globalAlpha*=Math.max(0,1-fx.age/duration);
        drawCel(seedBolts,celFrame(fx.age,duration,[.05,.07,.10]),1,3,2,fx.x,(fx.y??ground-size/2)+size/2,size,size);ctx.restore();continue;
      }
      if(fx.kind==='spear'){
        const size=(32+fx.level*5)*castScale();
        ctx.globalAlpha*=Math.max(0,1-fx.age/.22);
        drawCel(spearThrust,celFrame(fx.age,.22,[.06,.07,.09]),1,3,2,fx.x,(fx.y??ground-size/2)+size/2,size,size);ctx.restore();continue;
      }
      if(fx.kind==='bomb'||fx.kind==='afterburn'){
        const smoke=fx.kind==='afterburn';
        const f=smoke?4+celFrame(fx.age,.9,[.55,.35]):2+artFrame(fx.age,.56,[.07,.13,.18,.18]);
        // Big ground mushroom — was 48px and stuck on the foe midsection.
        const size=smoke?90+fx.level*16:120+fx.level*28;
        if(smoke)ctx.globalAlpha*=.45*Math.max(0,1-fx.age/.9);
        drawCel(newAttackFrames,f,2,6,3,fx.x,ground,size,size);ctx.restore();continue;
      }
      if(fx.kind==='lightning'||fx.kind==='thunderfield') {
        // Storm Stone uses shared weapon-frames lightning row — thunder_halberd keeps its own sheet.
        const size=fx.kind==='lightning'?110+fx.level*22:140;
        const frame=artFrame(fx.age,fx.age+fx.life);
        drawCel(weaponFrames,frame,3,6,4,fx.x,ground,size,size);
        ctx.restore();continue;
      }
      if(fx.kind==='fire') {
        const size=68+fx.level*20;
        const f12=artFrame(fx.age,Math.max(.28,fx.age+fx.life),TWELVE_HOLDS,[4,8]);
        if(!draw12FrameFx(axe12Fx,f12,fx.x,ground,size*1.2,size,1.0)) {
          const frame=artFrame(fx.age,fx.age+fx.life);
          drawCel(weaponFrames,frame,0,6,4,fx.x,ground,size,size);
        }
        ctx.restore();continue;
      }
      if(fx.kind==='slash') {
        const size=65+fx.level*18;
        const f12=artFrame(fx.age,Math.max(.28,fx.age+fx.life),TWELVE_HOLDS,[4,8]);
        if(!draw12FrameFx(blade12Fx,f12,fx.x,ground,size*1.3,size,1.0)) {
          const frame=artFrame(fx.age,fx.age+fx.life);
          drawCel(weaponFrames,frame,1,6,4,fx.x,ground,size,size);
        }
        ctx.restore();continue;
      }
      const row={vortex:2}[fx.kind];
      if(row!==undefined) {
        const h=(58+fx.level*10)*castScale();
        if(!drawStripFx(shurikenFx,stripFrame(fx,[.08,.1,.14,.18,.16,.12]),fx.x,(fx.y??ground-22)+h*.5,h,6,1.0)) {
          const frame=artFrame(fx.age,fx.age+fx.life);
          const size=55+fx.level*17;
          drawCel(weaponFrames,frame,row,6,4,fx.x,ground,size,size);
        }
      }
    }
    ctx.restore();
  }
}
// Explicit crops and fist anchors keep all eight hand-drawn poses registered.
const HERO_CELS = [
  [0,0,438,430,392,246], [466,0,416,430,149,215],
  [890,0,422,430,314,91], [1325,0,449,430,412,209],
  [0,440,475,430,440,194], [480,440,406,430,342,200],
  [906,440,411,430,332,223], [1338,440,436,430,377,240]
];
function heroCel() { return state.handFlash>0?celFrame(.78-state.handFlash,.78,[.06,.08,.1,.07,.15,.11,.1,.11]):0; }
function drawHeldWeapons(size,ground,hand=null) {
  if(state.phase==='chest')return;
  const item=(state.mode==='loot'&&state.loot[0])||state.items.find(i=>i.id===state.heldId&&!TYPES[i.type].gear)||state.items.find(i=>!TYPES[i.type].gear);if(!item)return;
  // One readable silhouette: the active weapon, held at its actual grip point.
  const attacking=state.phase==='combat'&&state.handFlash>0;
  drawGrippedItem(item,hand||{x:W*.27+size*.30,y:ground-size*.40},size,attacking?[0,-.35,-.8,.32,.32,.15,0,0][heroCel()]:0,!attacking);
}
function drawGrippedItem(item,hand,size,poseAngle=0,resting=true){
  const grips={bow:[.58,.50,.50,0],spear:[.90,.30,.73,-.50],bomb:[.31,.50,.72,0],axe:[.48,.66,.66,.55],blade:[.55,.72,.74,.55],wand:[.68,.28,.72,-.55],shuriken:[.27,.50,.68,0],storm:[.34,.50,.80,0],scythe:[.55,.45,.70,.35],hammer:[.48,.50,.72,.4],orb:[.34,.50,.70,0],dagger:[.30,.50,.68,.2],tome:[.40,.50,.75,0],armor:[.43,.5,.15,0],boots:[.38,.5,.18,0]};
  const [scale,gx,gy,angle]=grips[item.type]||[.45,.5,.7,0];
  const carry=resting?({axe:2.65,blade:2.65,wand:.65,spear:.8,scythe:2.2,hammer:2.4}[item.type]||0):0;
  ctx.save();ctx.translate(hand.x,hand.y);ctx.rotate(angle+poseAngle+carry);
  if(typeof drawWeaponGlyph==='function'&&drawWeaponGlyph(item.type,item.level,0,0,size*scale,true)){ctx.restore();return;}
  const r=itemRegion(item.type,item.level);
  if(!r||!r.sheet?.complete||!r.sheet.naturalWidth){ctx.restore();return;}
  const w=size*scale,h=w*r.h/r.w;
  // Carry blades outwards and down; raised silhouettes belong to an attack only.
  ctx.drawImage(r.sheet,r.x,r.y,r.w,r.h,-w*gx,-h*gy,w,h);ctx.restore();
}
function renderBattleHero() {
  if(!battleHero.complete||!battleHero.naturalWidth)return false;
  const size=Math.min(108,Math.max(82,H*.40)),ground=groundY();
  ellipse(W*.27,ground+3,size*.27,3.5,'#10251d55');
  if(heroAttackFrames.complete&&heroAttackFrames.naturalWidth) {
    const [sx,sy,sw,sh,hx,hy]=HERO_CELS[heroCel()],scale=size/430;
    const left=W*.27-size*.56,top=ground-size*.98;
    ctx.drawImage(heroAttackFrames,sx,sy,sw,sh,left,top,sw*scale,sh*scale);
    drawHeldWeapons(size,ground,{x:left+hx*scale,y:top+hy*scale});
    // Put the drawn fingers back over the handle so the weapon is gripped, not pasted on.
    const gloveX=Math.max(0,hx-18),gloveY=hy-20,gloveW=Math.min(36,sw-gloveX);
    ctx.drawImage(heroAttackFrames,sx+gloveX,sy+gloveY,gloveW,40,left+gloveX*scale,top+gloveY*scale,gloveW*scale,40*scale);
  } else {
    ctx.drawImage(battleHero,W*.27-size*.53,ground-size*.915,size,size);
    drawHeldWeapons(size,ground);
  }
  return true;
}

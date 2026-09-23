const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const {game}=require('./helpers/game-harness');

test('campaign difficulty grows and new enemy mechanics appear on their announced levels',()=>{
 const run=game();
 assert.equal(run('STAGES.length'),100);assert.equal(run('LEVELS.length'),601);
 assert.equal(run('LEVELS.slice(0,21).filter(l=>l.boss).map(l=>l.number).join(",")'),'4,7,10,14,17,21');
 assert.equal(run('LEVELS.slice(0,21).every((l,i)=>!i||(l.health>LEVELS[i-1].health&&l.damageScale>LEVELS[i-1].damageScale&&l.speedScale>LEVELS[i-1].speedScale))'),true);
 assert.equal(run('LEVELS.slice(0,21).filter(l=>l.boss).every((l,i,a)=>!i||l.bossHealth>a[i-1].bossHealth)'),true);
 run('startEncounter()');
 assert.equal(run('state.enemies.some(e=>e.elite||e.kind)'),false);
 for(const wave of [2,3,4,5,8,9,11,12,15,16]){
  run(`state.stageIndex=STAGES.findIndex(s=>s.firstWave<=${wave}&&s.lastWave>=${wave});state.wave=${wave}-1;startEncounter()`);
  assert.equal(run('ENEMY_UNLOCKS[state.wave].every(kind=>state.enemies.some(e=>e.kind===kind))'),true);
 }
 run('reset(5);state.wave=18;startEncounter()');
 assert.equal(run('state.enemies.filter(e=>e.elite).length'),run('levelInfo().elites'));
 assert.equal(run('state.enemies.length'),run('levelInfo().count'));
 const lateDamage=run('state.enemies.forEach(e=>{e.x=0;e.attack=0;e.kind=null;e.elite=false});state.enemies=state.enemies.slice(0,1);state.hp=100;updateCombat(.01);100-state.hp');
 run('reset();startEncounter();state.enemies=state.enemies.slice(0,1);state.enemies[0].x=0;state.enemies[0].attack=0;updateCombat(.01)');
 assert.ok(lateDamage>run('100-state.hp'));
});

test('short levels unlock sequentially, persist stars and retry only the current level',()=>{
 const storage=new Map(),run=game(false,storage);run('updateUI()');
 assert.equal(run("$('biome').textContent"),'Level 1');
 assert.equal(run("$('wave-dots').innerHTML.match(/aria-hidden/g).length"),4);
 assert.equal(run('startStage(1)'),false);
 run('startStage(0);state.wave=3;startEncounter();clearEncounter();update(1.1)');
 assert.equal(run('state.mode'),'won');assert.equal(run('progress.cleared'),1);
 assert.equal(run('progress.stars[0]'),3);
 assert.match(run("$('start').innerHTML"),/Next level/);
 run("$('start').onclick()");
 assert.equal(run('state.stageIndex'),1);assert.equal(run('state.wave'),5);
 assert.equal(run('state.hp'),100);
 assert.equal(run('state.items[0].level'),1,'carries the finished level backpack forward');
 assert.equal(run("state.items.some(i=>i.type==='shuriken')"),true);
 run("state.hp=0;finish(false);$('start').onclick()");
 assert.equal(run('state.stageIndex'),1);assert.equal(run('state.wave'),5);
 assert.equal(run('progress.cleared'),1);assert.equal(run('state.hp'),100);
 const reloaded=game(false,storage);
 assert.equal(reloaded('progress.cleared'),1);assert.equal(reloaded('state.stageIndex'),1);
 assert.equal(reloaded('state.mode'),'ready');assert.equal(reloaded('progress.stars[0]'),3);
 run('startStage(0);state.damageTaken=80;finish(true)');
 assert.equal(run('progress.stars[0]'),3,'a replay cannot erase the best stars');
 assert.equal(run('stageUnlocked(2)'),false);
});

test('level menu pauses gameplay, blocks locked choices and returns to the same run',()=>{
 const run=game();run('startStage(0);openLevelMenu()');
 assert.equal(run('state.mode'),'paused');assert.equal(run("$('level-select').hidden"),false);
 run('pause()');assert.equal(run('state.mode'),'paused');
 assert.equal(run("$('level-cards').children.filter(b=>b.disabled).length"),9);
 const snapshot=run('JSON.stringify([state.hp,state.wave,state.enemies])');
 run('update(1);closeLevelMenu()');
 assert.equal(run('state.mode'),'running');assert.equal(run("$('level-select').hidden"),true);
 assert.equal(run('JSON.stringify([state.hp,state.wave,state.enemies])'),snapshot);
 assert.equal(run('startStage(-1)'),false);assert.equal(run('startStage(100)'),false);
 assert.equal(run('startStage(0.5)'),false);
});

test('healing does not erase star damage and loading new gear does not disable results',()=>{
 const run=game();
 run('startStage(0);state.enemies=state.enemies.slice(0,1);state.enemies[0].x=0;state.enemies[0].attack=0;updateCombat(.01)');
 assert.ok(run('state.damageTaken')>0);
 const received=run('state.damageTaken');run('lootStop()');
 assert.equal(run('state.hp'),100);assert.equal(run('state.damageTaken'),received);
 run('finish(true)');assert.equal(run('progress.stars[0]'),2);
 run('warmGameAssets=()=>false;startStage(1);finish(false);updateUI()');
 assert.equal(run("$('start').disabled"),false);
 run('reset(1);update(.1)');assert.equal(run('state.targetBiome'),run('stageBiomeIndex(1)'));
});

test('saved progress is validated and the final level offers the level menu',()=>{
 const broken=game(false,new Map([['packrun-levels-v1','{bad']]));
 assert.equal(broken('progress.cleared'),0);
 const locked=game(false,new Map([['packrun-levels-v1',JSON.stringify({cleared:1,selected:5,stars:[3,3,3]})]]));
 assert.equal(locked('state.stageIndex'),1);assert.equal(locked('progress.stars[2]'),0);
 const run=game();run('progress.cleared=99;startStage(99);state.wave=LAST_WAVE;clearEncounter();update(1.1)');
 assert.equal(run('state.mode'),'won');assert.equal(run('progress.cleared'),100);
 run("$('start').onclick()");assert.equal(run("$('level-select').hidden"),false);
 assert.equal(run('state.stageIndex'),99);assert.equal(run('state.wave'),run('LAST_WAVE'));
});

test('each level starts with a fresh usable backpack and matching scenery',()=>{
 const run=game();
 for(let i=0;i<100;i++){
  run(`reset(${i})`);
  assert.equal(run('state.items.length'),run('currentStage().gear.length'));
  assert.equal(run('state.items.every(item=>canPlace(state.items,item,item.x,item.y))'),true);
  assert.equal(run(`state.currentBiome`),run(`stageBiomeIndex(${i})`));assert.equal(run('state.hp'),100);
  assert.equal(run('state.enemies.length'),0);assert.equal(run('state.damageTaken'),0);
 }
});

test('winning carries backpack into the next level; an explicit fresh start uses starter gear',()=>{
 const run=game();
 run('progress.cleared=10');
 run('startStage(0)');
 run("state.items=[{id:1,type:'axe',level:3,w:1,h:2,x:0,y:0},{id:2,type:'bow',level:2,w:2,h:2,x:1,y:0},{id:3,type:'armor',level:2,w:2,h:2,x:0,y:2}];state.heldId=1;state.bagSize=4");
 run('carryBag=cloneBag(state.items);state.mode="won";state.stageIndex=0');
 run('startStage(1,{carry:true})');
 assert.equal(run("state.items.some(i=>i.type==='axe'&&i.level===3)"),true);
 assert.equal(run("state.items.some(i=>i.type==='bow'&&i.level===2)"),true);
 assert.equal(run('state.items.every(item=>canPlace(state.items,item,item.x,item.y))'),true);
 assert.equal(run('!!carryBag'),true);
 run('startStage(1,{carry:false})');
 assert.equal(run('state.items.length'),run('currentStage().gear.length'));
 assert.equal(run("!state.items.some(i=>i.type==='bow'&&i.level===2)"),true);
 assert.equal(run("!state.items.some(i=>i.type==='axe'&&i.level===3)"),true);
 assert.equal(run('carryBag'),null);
});

test('retry after a death restores the bag the frog entered with, not the starter kit',()=>{
 const run=game();
 run('progress.cleared=10;startStage(0)');
 run("state.items=[{id:1,type:'axe',level:3,w:1,h:2,x:0,y:0},{id:2,type:'bow',level:2,w:2,h:2,x:1,y:0}];state.bagSize=4");
 run('carryBag=cloneBag(state.items);state.mode="won";state.stageIndex=0;startStage(1)');
 run("state.items.push({id:99,type:'bomb',level:1,w:2,h:2,x:0,y:2})");
 run("state.hp=0;finish(false);$('start').onclick()");
 assert.equal(run('state.stageIndex'),1);assert.equal(run('state.mode'),'running');
 assert.equal(run("state.items.some(i=>i.type==='axe'&&i.level===3)"),true);
 assert.equal(run("state.items.some(i=>i.type==='bomb')"),false,'mid-level pickups do not survive the death');
});

test('the frontier bag persists across reloads and replays never overwrite it',()=>{
 const storage=new Map(),run=game(false,storage);
 run('progress.cleared=5;startStage(4)');
 run("state.items=[{id:1,type:'axe',level:4,w:1,h:2,x:0,y:0},{id:2,type:'armor',level:2,w:2,h:2,x:1,y:0}];finish(true)");
 assert.equal(run('progress.bag.stage'),5);
 const reloaded=game(false,storage);
 assert.equal(reloaded('state.stageIndex'),5);
 assert.equal(reloaded("state.items.some(i=>i.type==='axe'&&i.level===4)"),true);
 assert.equal(reloaded('new Set(state.items.map(i=>i.id)).size'),reloaded('state.items.length'));
 assert.equal(reloaded("makeItem('bow').id>Math.max(...state.items.map(i=>i.id))"),true,'saved ids never collide with new loot');
 run("startStage(0,{carry:false});state.items=[{id:3,type:'shuriken',level:1,w:1,h:1,x:0,y:0}];finish(true)");
 assert.equal(run('progress.bag.stage'),5,'an old replay keeps the frontier bag');
 assert.equal(run("progress.bag.items.some(i=>i.type==='axe'&&i.level===4)"),true);
 const junk=game(false,new Map([['packrun-levels-v1',JSON.stringify({cleared:3,selected:3,bag:{stage:3,items:[{type:'nope',level:9}]}})]]));
 assert.equal(junk('progress.bag'),null);
 assert.equal(junk('state.items.length'),junk('currentStage().gear.length'));
});

test('only the front melee slots hit the frog; the rest of the pack queues behind',()=>{
 const run=game();
 run('progress.cleared=99;startStage(30);state.enemies=[]');
 run("for(let i=0;i<6;i++){const e=spawnEncounterEnemy({kind:'beetle'});e.x=0;e.attack=0;}state.hp=1000;state.maxHp=1000;updateCombat(.01)");
 const perHit=run("Math.max(1,Math.round(4*CONTACT_MUL*levelInfo().damageScale*(1-PackCore.reductionFor(state.items))))");
 const slots=run('MELEE_SLOTS');
 assert.equal(run('1000-state.hp'),perHit*slots);
 assert.equal(run('state.enemies.filter(e=>e.attack>0).length'),slots);
 assert.ok(run('Math.max(...state.enemies.map(e=>e.x))>Math.min(...state.enemies.map(e=>e.x))'),'queued enemies stand behind the front line');
});

test('a kill chain builds a combo, breaks after its window and every eighth kill is a FRENZY',()=>{
 const run=game();
 run('progress.cleared=99;startStage(30);state.enemies=[]');
 run("for(let i=0;i<7;i++){const e=spawnEncounterEnemy({kind:'beetle'});hit(e,1e7,'#fff');}");
 assert.equal(run('state.combo.count'),7);assert.ok(run('state.hitstop')>0);
 run("for(const id of Object.keys(state.cooldowns))state.cooldowns[id]=2;state.mana=10");
 run("hit(spawnEncounterEnemy({kind:'beetle'}),1e7,'#fff')");
 assert.equal(run('state.combo.count'),8);
 assert.equal(run('Object.values(state.cooldowns).every(v=>v===0)'),true);
 assert.equal(run('state.mana'),run('Math.min(state.maxMana,10+FRENZY_MANA+KILL_MANA)'));
 run('state.enemies=[spawnEncounterEnemy({kind:"beetle"})];state.enemies[0].x=W*.9;state.enemies[0].speed=0;updateCombat(COMBO_WINDOW+.01)');
 assert.equal(run('state.combo.count'),0);
});

test('a loss names how close it was and a near miss asks for one more try',()=>{
 const run=game();
 run('progress.cleared=99;startStage(30);state.enemies=[];state.pendingEnemies=[]');
 run("var boss=spawnEncounterEnemy({kind:'crystalGolem',boss:true});boss.hp=boss.maxHp*.055;state.hp=0;finish(false)");
 assert.equal(run("$('overlay-title').textContent"),'SO CLOSE!');
 assert.match(run("$('overlay-text').innerHTML"),/<b>6%<\/b>/);
 assert.match(run("$('start').innerHTML"),/ONE MORE TRY/);
 run('startStage(30);state.hp=0;finish(false)');
 assert.equal(run("$('overlay-title').textContent"),'The bag killed you');
 assert.match(run("$('overlay-text').innerHTML"),/Wave <b>1<\/b> of 6/);
});

test('ready buttons pulse only while the player hesitates with foes in view',()=>{
 const run=game();
 run('startStage(0);update(.04);updateAttackButtons()');
 assert.equal(run("$('attack-bar').attackButtons.some(b=>b.button.classList.contains('nudge'))"),false);
 run('state.enemies.forEach(e=>e.speed=0);for(let i=0;i<40;i++)update(.04);updateAttackButtons()');
 assert.equal(run("$('attack-bar').attackButtons.some(b=>b.button.classList.contains('nudge'))"),true);
 run('manualAttack(attackChoices()[0].id);updateAttackButtons()');
 assert.equal(run("$('attack-bar').attackButtons.some(b=>b.button.classList.contains('nudge'))"),false);
});

test('the first PLAY turns sound on unless the player muted it earlier',()=>{
 const make=storage=>{const run=game(false,storage);run('window.AudioContext=class{resume(){}createOscillator(){return {frequency:{},connect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}}');return run;};
 const fresh=make(new Map());fresh("$('start').onclick()");
 assert.equal(fresh('soundOn'),true);
 const muted=make(new Map([['packrun-sound','0']]));muted("$('start').onclick()");
 assert.equal(muted('soundOn'),false);
});

test('the next attack may cancel the swing recovery but not its strike frames',()=>{
 const run=game();
 run('startStage(0);update(1)');
 const ids=run('JSON.stringify(attackChoices().map(i=>i.id))');
 const [a,b]=JSON.parse(ids);
 assert.equal(run(`manualAttack(${a})`),true);
 assert.equal(run(`manualAttack(${b})`),false);
 run('update(ATTACK_LOCK+.01)');
 assert.ok(run('state.handFlash')>0,'the pose is still playing');
 assert.equal(run(`manualAttack(${b})`),true);
});

test('frog and enemies sit on per-biome ground lines',()=>{
 const run=game();
 run('H=348;state.currentBiome=0;state.targetBiome=0;state.biomeBlend=0');
 assert.ok(Math.abs(run('groundY()/H')-0.798)<0.002);
 run('state.currentBiome=3;state.targetBiome=3');
 assert.ok(Math.abs(run('groundY()/H')-0.786)<0.002,'root cave path');
 run('state.currentBiome=2;state.targetBiome=2');
 assert.ok(Math.abs(run('groundY()/H')-0.72)<0.002,'pond bank path');
 run('state.currentBiome=11;state.targetBiome=11');
 assert.ok(Math.abs(run('groundY()/H')-0.82)<0.01,'cabbage garden path near forest height');
 run('state.currentBiome=9;state.targetBiome=9');
 assert.ok(run('groundY()/H')>0.82,'manor walls path is lower');
 assert.equal(run('BIOMES[3].noMirror'),true);
 assert.equal(run('BIOMES[11].noMirror'),true);
 assert.equal(run('BIOME_GROUND_Y.length'),20);
 assert.equal(run('BIOME_GROUND_Y.every(y=>y>0.5&&y<0.95)'),true);
});

test('chests never drop level 4 and do not always clone the best weapon',()=>{
 const run=game();
 assert.equal(run('chooseChestReward(1).type'),'axe');
 assert.equal(run('chooseChestReward(1).level'),1);
 run('state.items[0].level=3');
 const rolls=run(`[...Array(20)].map((_,i)=>chooseChestReward(i+2)).map(r=>[r.type,r.level])`);
 assert.equal(rolls.every(r=>r[1]<=3),true);
 assert.ok(new Set(rolls.map(r=>r[0])).size>=3);
 assert.equal(run('STAGES.slice(0,6).every(s=>s.gear.every(([,lv])=>lv<4))'),true);
 assert.equal(run('STAGES.every(s=>!s.lootTier||s.lootTier<=3)'),true);
});

test('chests are random per run, replayable per seed, and gate rarity by level',()=>{
 const run=game();run('progress.cleared=99');
 const roll=(level,seed)=>run(`startStage(${level},{carry:false});state.lootSeed=${seed};[...Array(6)].map((_,i)=>chooseChestLoot(state.stops+2+i).map(x=>x.type).join('+')).join(' ')`);
 assert.equal(roll(30,11),roll(30,11));
 assert.notEqual(roll(30,11),roll(30,12));
 const rare=run(`startStage(0,{carry:false});var ranks=[];for(let s=0;s<40;s++){state.lootSeed=s;for(let c=2;c<8;c++)chooseChestLoot(c).forEach(i=>ranks.push(rarityRank(i.type)));}Math.max(...ranks)`);
 assert.ok(rare<2);
 const gates=run(`(()=>{const bad=[];for(const lvl of [3,8,15,25]){startStage(lvl,{carry:false});const theme=new Set(currentStage().lootPool);for(let s=0;s<30;s++){state.lootSeed=s;for(let c=2;c<8;c++)for(const i of chooseChestLoot(c)){const r=TYPES[i.type].rarity||'common';if(lvl<RARITY_GATE[r]&&!theme.has(i.type))bad.push(lvl+':'+i.type);}}}return bad.join(',')})()`);
 assert.equal(gates,'');
});

test('an epic find is guaranteed within PITY_CAP+1 chests and the counter survives level changes',()=>{
 const run=game();run('progress.cleared=99');
 const worst=run(`(()=>{let gap=0,worst=0;for(let lvl=10;lvl<40;lvl++){startStage(lvl,{carry:false});for(let c=0;c<6;c++){const r=chooseChestReward(state.stops+2+c);if(rarityRank(r.type)>=3)gap=0;else worst=Math.max(worst,++gap);}}return worst})()`);
 assert.ok(worst<=run('PITY_CAP'));
 run('startStage(20,{carry:false});state.lootPity=4;startStage(21,{carry:false})');
 assert.equal(run('state.lootPity'),4);
});

test('a bag without armor is always offered armor and every weapon type can drop',()=>{
 const run=game();run('progress.cleared=99;startStage(40,{carry:false});state.items=state.items.filter(i=>i.type!=="armor")');
 for(let s=0;s<10;s++)assert.ok(run(`state.lootSeed=${s};chooseChestLoot(5).some(i=>i.type==='armor')`));
 const missing=run(`(()=>{const seen=new Set();for(let lvl=0;lvl<100;lvl+=3){startStage(lvl,{carry:false});for(let s=0;s<8;s++){state.lootSeed=s*977+lvl;for(let c=2;c<8;c++)chooseChestLoot(c).forEach(i=>seen.add(i.type));}}return allWeapons().filter(t=>!seen.has(t)).join(',')})()`);
 assert.equal(missing,'');
});

test('an unupgraded starting backpack cannot clear the campaign',()=>{
 const run=game();
 run(`progress.cleared=99;startStage(20);state.items=PackCore.placeGear([['axe',1],['shuriken',1]],state.bagSize);state.heldId=state.items[0].id;state.hp=100;state.maxHp=100;
  for(let f=0;f<20000&&!['dead','won'].includes(state.mode);f++){
  if(state.mode==='loot')$('continue').onclick();
  attackChoices().forEach(i=>manualAttack(i.id));update(.04);
 }`);
 assert.equal(run('state.mode'),'dead');
 assert.ok(run('state.wave')<run('LAST_WAVE'));
});

test('startup requests only essential artwork and waits safely for missing scene assets',()=>{
 const run=game(true);
 assert.equal(run('managedAssets.filter(i=>i.assetStatus!=="idle").length'),8);
 assert.equal(run('!!axe12Fx.src'),true,'starter axe loads the impact sheet that the renderer actually uses');
 assert.equal(run('frogSheets.slice(1).every(i=>!i.src)'),true);
 assert.equal(run('!enemyAtlas.src&&!extraEnemies.src&&!beamFrames.src&&!seedBolts.src&&!spearThrust.src'),true);
 assert.equal(run('!battleHero.src&&!heroAtlas.src&&!stopFrames.src&&!heroAttackFrames.src'),true);
 run('startEncounter();var hp=state.hp,age=state.enemies[0].age;update(.5)');
 assert.equal(run('state.hp'),run('hp'));assert.equal(run('state.enemies[0].age'),run('age'));
 run('sceneAssets().forEach(i=>{i.complete=true;i.naturalWidth=1024});update(.1)');assert.equal(run('state.loadingAssets'),false);
 run("state.items.push(makeItem('armor',3),makeItem('wand'));warmGameAssets()");
 assert.equal(run('!!frogSheets[3].src&&!!beamFrames.src'),true);assert.equal(run('!frogSheets[4].src'),true);
 run('beamFrames.onerror()');assert.equal(run('beamFrames.src'),'assets/beam-frames-v2.png');
 run('beamFrames.onerror();warmGameAssets()');assert.equal(run('state.assetError'),true);
});

test('rendered effects select distinct atlas drawings without scaling a static image', () => {
  const run=game();
  run("var draws=[];Object.assign(ctx,{save(){},restore(){},drawImage(...args){draws.push(args)}});beamFrames.complete=true;beamFrames.naturalWidth=1448;beamFrames.naturalHeight=1086;weaponFrames.complete=true;weaponFrames.naturalWidth=1536;weaponFrames.naturalHeight=1024;");
  run("for(let i=0;i<1060;i++){state.effects=[{kind:'beam',level:1,x:400,age:i/1000,life:1.06-i/1000}];renderCombatEffects();}");
  assert.equal(run('new Set(Array.from({length:1060},(_,i)=>skyBeamFrame({age:i/1000,life:1.06-i/1000}))).size'),12);
  assert.equal(run('draws.every(d=>d[1]>=0&&d[2]>=0&&d[1]+d[3]<=1448&&d[2]+d[4]<=1086)'),true);
  for(const kind of ['fire','slash','vortex']) {
    run(`draws=[];for(let i=0;i<900;i++){state.effects=[{kind:'${kind}',level:1,x:400,age:i/1000,life:.9-i/1000}];renderCombatEffects();}`);
    assert.equal(run('new Set(draws.map(d=>d[1]+","+d[2])).size'),kind==='slash'?3:6,kind);
    assert.equal(run('draws.every(d=>d[1]>=0&&d[1]+d[3]<=1536&&d[2]+d[4]<=1024)'),true);
  }
  assert.equal(run('new Set(Array.from({length:780},(_,i)=>{state.handFlash=.78-i/1000;return heroCel()})).size'),8);
  assert.equal(run('celFrame(.20,.9)'),run('celFrame(.21,.9)'));
});

test('all sustained sky beams enter above the viewport and keep their ground impact', () => {
  const run=game();
  run("var draws=[];Object.assign(ctx,{drawImage(...args){draws.push(args)}});beamFrames.complete=true;beamFrames.naturalWidth=1448;beamFrames.naturalHeight=1086;");
  for(const ground of [155,280,540])for(const height of [100,145,225])for(let frame=3;frame<=7;frame++) {
    if(height>ground-10)continue;
    run(`draws=[];drawSkyBeam(${frame},300,${ground},110,${height});`);
    assert.ok(run('draws[0][6]')<0);
    assert.ok(Math.abs(run('draws[0][6]+draws[0][8]-draws[1][6]'))<.000001);
    assert.ok(Math.abs(run('draws[1][6]+draws[1][8]')-ground)<12,'transparent cell padding stays close to ground');
    assert.equal(run('draws[0][7]<draws[1][7]'),true,'only the connected beam neck is stretched, not the side curls');
    assert.equal(run('draws.every(d=>d[1]>=0&&d[2]>=0&&d[1]+d[3]<=1448&&d[2]+d[4]<=1086)'),true);
  }
});

test('backpack size belongs to the selected level and retry restores its starter kit',()=>{
 const run=game();
 for(const [stage,size] of [[0,3],[1,3],[2,4],[3,4],[4,5],[5,5],[20,6],[50,7]]){
  run(`reset(${stage})`);assert.equal(run('bagSize()'),size);
  assert.equal(run("$('inventory').style.gridTemplateColumns"),`repeat(${size},1fr)`);
  const items=run('JSON.stringify(state.items.map(i=>[i.type,i.level,i.x,i.y]))');
  run(`state.items[0].level=4;state.hp=5;reset(${stage})`);
  assert.equal(run('JSON.stringify(state.items.map(i=>[i.type,i.level,i.x,i.y]))'),items);
  assert.equal(run('state.hp'),100);
 }
 run('reset()');assert.equal(run('bagSize()'),3);
});

test('first chest forces a weapon versus armor choice even after the free merge',()=>{
 const run=game();run('lootStop();var options=state.loot.map(i=>i.type);state.loot.slice().forEach(i=>quickTake(i.id))');
 assert.equal(run('options.join(",")'),'axe,bow,armor');
 assert.equal(run('state.items[0].level'),2);
 assert.equal(run('state.loot.length'),1);
 assert.equal(run("state.items.some(i=>i.type==='bow')"),true);
 assert.equal(run("state.items.some(i=>i.type==='armor')"),false);
 run("selected=state.items.find(i=>i.type==='bow').id;$('discard').onclick();quickTake(state.loot[0].id)");
 assert.equal(run("state.items.some(i=>i.type==='armor')"),true);
 assert.equal(run('state.loot.length'),0);
});

test('first loot stop freezes travel; merging, taking loot and continuing work', () => {
  const run = game(); run("startEncounter(); for(let i=0;i<900 && state.mode!=='loot';i++){attackChoices().forEach(i=>manualAttack(i.id));update(.04)}");
  assert.equal(run('state.mode'), 'loot'); assert.equal(run('state.loot.length'), 3); assert.ok(run('state.kills') > 0);
  const meters = run('state.distance'); run('update(1)'); assert.equal(run('state.distance'), meters);
  run('place(0,0)'); assert.equal(run('state.items[0].level'), 2); assert.equal(run('state.loot.length'), 2);
  run("state.loot=[makeItem('wand')];selected=state.loot[0].id; place(2,0)"); assert.equal(run('state.items.length'), 3);
  run("$('continue').onclick()"); assert.equal(run('state.mode'), 'running'); assert.equal(run('state.loot.length'), 0); assert.equal(run('state.nextLoot'), 200);
});
test('manual attacks require mana, input, respect individual cooldowns and finish the current pose',()=>{
 const run=game();run('startEncounter();state.mana=100;update(.2)');
 assert.equal(run('state.projectiles.length'),0);assert.equal(run('state.effects.length'),0);
 assert.equal(run('manualAttack(state.items[0].id)'),true);
 assert.equal(run('manualAttack(state.items[0].id)'),false);
 assert.equal(run('manualAttack(state.items[1].id)'),false);
 run('update(.8)');assert.equal(run('manualAttack(state.items[1].id)'),true);
 assert.equal(run('manualAttack(state.items[0].id)'),false);
 run('pause();var cooldown=state.cooldowns[state.items[0].id];update(1)');
 assert.equal(run('state.cooldowns[state.items[0].id]'),run('cooldown'));
 assert.equal(run('manualAttack(state.items[0].id)'),false);
 run("state.items.push(makeItem('armor',4),makeItem('axe',3));updateAttackButtons()");
 assert.equal(run('attackChoices().length'),2);assert.equal(run('attackChoices()[0].level'),3);
});
test('attacks spend mana and refuse when empty',()=>{
 const run=game();run("startEncounter();state.mana=5;var id=state.items[0].id");
 assert.equal(run('manualAttack(id)'),false);
 run('state.mana=100');assert.equal(run('manualAttack(id)'),true);
 assert.ok(run('state.mana')<100);
});
test('new glyph weapons fire distinct sky and melee animations',()=>{
 const run=game();run("startEncounter();state.mana=200;state.enemies.forEach(e=>{e.x=W*.65;e.hp=100000})");
 run("weaponAttack(makeItem('hammer',3))");assert.equal(run("state.effects.some(f=>f.kind==='flurry')"),true);
 run("state.effects=[];weaponAttack(makeItem('scythe',2))");assert.equal(run("state.effects.some(f=>f.kind==='reap')"),true);
 run("state.effects=[];weaponAttack(makeItem('tome',4))");assert.equal(run("state.effects.some(f=>f.kind==='tome_rune')"),true);
 run("state.effects=[];weaponAttack(makeItem('orb',4))");assert.equal(run("state.effects.filter(f=>f.kind==='orbs').length"),5);
 run("state.effects=[];weaponAttack(makeItem('dagger',3))");assert.equal(run("state.effects.filter(f=>f.kind==='flurry').length"),3);
});
test('meta upgrades persist essence between resets',()=>{
 const run=game();run("progress.essence=20;progress.upgrades.might=2;saveProgress();reset(0);");
 assert.equal(run('PackCore.upgradeStats(progress.upgrades).damageMul'),1.2);
 assert.equal(run('progress.essence'),20);
 assert.ok(run('state.maxMana')>=100);
 assert.ok(run('buyUpgrade("might")'));assert.equal(run('progress.upgrades.might'),3);
});

test('six independent levels introduce every enemy and each boss completes its level',()=>{
 const run=game();run('var seen=new Set();for(let wave=1;wave<=LAST_WAVE;wave++){state.stageIndex=STAGES.findIndex(s=>s.firstWave<=wave&&s.lastWave>=wave);state.wave=wave-1;startEncounter();state.enemies.forEach(e=>{if(e.kind)seen.add(e.kind)})}');
 assert.equal(run('seen.size'),23);
 for(const wave of [4,7,10,14,17,21]){
  run(`state.stageIndex=STAGES.findIndex(s=>s.firstWave<=${wave}&&s.lastWave>=${wave});state.wave=${wave}-1;startEncounter()`);assert.equal(run('state.bossSpawned'),true);
  assert.equal(run('state.enemies.filter(e=>e.boss).length'),1);
  run('clearEncounter();update(1.1)');assert.equal(run('state.mode'),'won');
 }
 run("reset();state.wave=1;startEncounter();var e=state.enemies[0];e.kind='beetle';e.hp=e.maxHp=100;hit(e,100,'#fff')");assert.equal(run('e.hp'),28);
 run("e.kind='mushroom';e.hp=50;state.enemies=[e];updateCombat(.2)");assert.ok(run('e.hp')>50);
});

test('new bosses summon within the cap and crystal armor has vulnerable intervals',()=>{
 const run=game();run('state.wave=3;startEncounter();var queen=state.enemies.at(-1);queen.age=5;updateCombat(.01)');
 assert.equal(run('state.enemies.length'),6);assert.equal(run('state.waveTotal'),6);assert.equal(run('state.enemies.at(-1).kind'),'spider');
 run('for(let n=0;n<20;n++){queen.age+=8;updateCombat(.001)}');assert.ok(run('state.enemies.length')<=10);
 run("var crystal={kind:'crystalGolem',hp:100,maxHp:100,age:0};hit(crystal,10,'#fff')");assert.equal(run('crystal.hp'),96);
 run("crystal.age=2;hit(crystal,10,'#fff')");assert.equal(run('crystal.hp'),86);
});

test('spear uses three new thrust poses and separate small impact poses',()=>{
 const run=game();run("var draws=[];Object.assign(ctx,{save(){},restore(){},translate(){},rotate(){},drawImage(...a){draws.push(a)}});spearThrust.complete=true;spearThrust.naturalWidth=1536;spearThrust.naturalHeight=1024;");
 run("for(let life=2.5;life>2;life-=.02)projectileDraw({type:'spear',level:4,x:100,y:80,vx:600,vy:0,life,delay:0})");
 assert.equal(run('new Set(draws.map(d=>d[1])).size'),3);assert.equal(run('draws.every(d=>d[0]===spearThrust&&d[2]===0)'),true);
 run("draws=[];for(let age=0;age<.22;age+=.01){state.effects=[{kind:'spear',x:150,y:80,level:4,age,life:.22-age}];renderCombatEffects()}");
 assert.equal(run('draws.every(d=>d[0]===spearThrust&&d[2]===512&&Math.abs(d[7]-52*castScale())<1e-6)'),true);
});

test('pause freezes enemies, health and travel; restart restores initial state', () => {
  const run = game(); run("startEncounter(); update(.04); pause()"); const snapshot = run('JSON.stringify([state.distance,state.hp,state.enemies])');
  run('update(.5)'); assert.equal(run('JSON.stringify([state.distance,state.hp,state.enemies])'), snapshot);
  run("finish(false); $('start').onclick()"); assert.equal(run('state.mode'), 'running'); assert.equal(run('state.hp'), 100); assert.equal(run('state.distance'), 0); assert.equal(run('state.items.length'), 2);
});
test('group combat must finish before victory, fast travel and inventory', () => {
  const run = game(); run('startEncounter()');
  assert.equal(run('state.phase'), 'combat'); assert.equal(run('state.enemies.length'), 3);
  assert.equal(run('state.enemies.every(e=>e.x<W)'), true);
  run('update(.04)'); assert.equal(run('state.distance'), 0);
  run("state.enemies.forEach(e=>hit(e,100000,'#fff'));update(.04)");
  assert.equal(run('state.phase'), 'victory'); assert.equal(run('state.mode'), 'running');
  run('update(1.1)'); assert.equal(run('state.phase'), 'travel');
  run('update(.5)'); assert.equal(run('state.distance'), run('RUN_SPEED*.5'));
  run('for(let i=0;i<180;i++)update(.04)'); assert.equal(run('state.mode'), 'loot'); assert.equal(run('state.distance'), 100);
  run("$('continue').onclick()");assert.equal(run('state.phase'),'depart');assert.equal(run('state.enemies.length'),0);run('update(1)'); assert.equal(run('state.wave'), 2); assert.equal(run('state.phase'), 'combat'); assert.equal(run('state.distance'), 135);
});
test('staff equips in the hand and damages an area only after its wind-up', () => {
  const run = game();
  run("startEncounter(); var staff=makeItem('wand',4);state.items.push(staff);state.enemies.forEach((e,i)=>{e.x=W*.6+i*20;e.hp=100000;e.maxHp=100000;});weaponAttack(staff)");
  assert.equal(run('state.heldId'), run('staff.id')); assert.equal(run('state.effects[0].kind'), 'beam');
  assert.equal(run('state.effects[0].ticks'), 5); assert.equal(run('state.effects[0].level'), 4);
  run('updateEffects(.15,true)'); assert.equal(run('state.enemies.every(e=>e.hp===100000)'), true);
  run('updateEffects(.14,true)'); assert.equal(run('state.enemies.every(e=>e.hp<100000)'), true);
  const hp = run('state.enemies[0].hp'); run('updateEffects(.19,true)'); assert.ok(run('state.enemies[0].hp')<hp);
});
test('evolved weapons have distinct splash, piercing, vortex and chain mechanics', () => {
  const run = game();
  run("startEncounter();state.enemies.forEach((e,i)=>{e.x=W*.6+i*20;e.hp=100000;});var axe=makeItem('axe',3);impact({type:'axe',level:3,damage:100,color:'#fff'},state.enemies[0])");
  assert.ok(run('state.enemies[1].hp')<100000); assert.equal(run('state.effects[0].kind'),'fire');
  run("weaponAttack(makeItem('shuriken',4))"); assert.equal(run("state.effects.some(f=>f.kind==='vortex')"),true); assert.equal(run('state.projectiles.length'),5);
  run("weaponAttack(makeItem('blade',3))"); assert.equal(run("state.projectiles.filter(p=>p.type==='blade').length"),3);
  run("weaponAttack(makeItem('storm',4))"); assert.equal(run('state.arcs.length'),3); assert.equal(run("state.effects.some(f=>f.kind==='thunderfield')"),true);
});
test('pause freezes the encounter phase and delayed beam damage', () => {
  const run=game(); run("startEncounter();state.enemies[0].x=W*.7;weaponAttack(makeItem('wand'));pause()");
  const before=run('JSON.stringify([state.phase,state.effects,state.hp,state.distance,state.runTime])');
  run('update(.8)'); assert.equal(run('JSON.stringify([state.phase,state.effects,state.hp,state.distance,state.runTime])'),before);
});
test('last weapon is protected; incoming loot rotation and removal work', () => {
  const run = game(); run("selected=state.items[1].id; $('discard').onclick(); selected=state.items[0].id; $('discard').onclick()"); assert.equal(run('state.items.length'), 1);
  run("state.loot=[makeItem('wand')]; selected=state.loot[0].id; rotate()"); assert.equal(run('state.loot[0].w'), 3); assert.equal(run('state.loot[0].h'), 1);
  run("$('discard').onclick()"); assert.equal(run('state.loot.length'), 0);
});
test('loot tap selects; merge still happens by dropping onto a pair', () => {
  const run = game(); run('lootStop();');
  assert.equal(run('state.items[0].level'), 1);
  assert.equal(run('state.loot.length'), 3);
  run("selected=state.loot[0].id; place(0,0)");
  assert.equal(run('state.items[0].level'), 2); assert.equal(run('state.items.length'), 2); assert.equal(run('state.loot.length'), 2);
  run("state.loot=[makeItem('wand')];quickTake(state.loot[0].id)"); assert.equal(run('state.items.length'), 3); assert.equal(run('state.loot.length'), 0);
});
test('drag shows the actual two-cell footprint and drops at its preview position', () => {
  const run = game();
  run(`state.bagSize=5;state.items[0].x=0;state.items[0].y=0;state.items[1].x=2;state.items[1].y=0;$('inventory').rect={left:10,top:20,right:280,bottom:290,width:270,height:270};
    var dragButton=document.createElement('button'); dragButton.rect={left:10,top:20,width:50.8,height:105.6};
    bindDrag(dragButton,state.items[0]); dragButton.onpointerdown({button:0,pointerId:1,clientX:35.4,clientY:72.8});
    dragButton.onpointermove({clientX:199.8,clientY:127.6});`);
  assert.equal(run("document.body.children.at(-1).style.width"), '50.8px');
  assert.equal(run("document.body.children.at(-1).style.height"), '105.6px');
  assert.equal(run("document.body.children.at(-1).style['--drag-rows']"), 2);
  assert.equal(run("document.body.children.at(-1).classList.contains('invalid')"), false);
  run('dragButton.onpointerup({clientX:199.8,clientY:127.6})');
  assert.equal(run('state.items[0].x'), 3); assert.equal(run('state.items[0].y'), 1);
  assert.equal(run('document.body.children.at(-1).removed'), true);
});
test('blocked drag turns red and cancellation leaves the item in place', () => {
  const run = game();
  run(`state.bagSize=5;state.items[0].x=0;state.items[0].y=0;state.items[1].x=2;state.items[1].y=0;$('inventory').rect={left:10,top:20,right:280,bottom:290,width:270,height:270};
    var dragButton=document.createElement('button'); dragButton.rect={left:10,top:20,width:50.8,height:105.6};
    bindDrag(dragButton,state.items[0]); dragButton.onpointerdown({button:0,pointerId:1,clientX:35.4,clientY:72.8});
    dragButton.onpointermove({clientX:145,clientY:72.8});`);
  assert.equal(run("document.body.children.at(-1).classList.contains('invalid')"), true);
  assert.equal(run("$('inventory').children.at(-1).classList.contains('invalid')"), true);
  run('dragButton.onpointercancel({})'); assert.equal(run('state.items[0].x'), 0);
  assert.equal(run('document.body.children.at(-1).removed'), true);
});
test('dropping a duplicate onto its pair merges without a skip button', () => {
  const run = game(); run("var extra={...makeItem('shuriken'),x:2,y:0};state.items.push(extra);selected=extra.id;place(state.items[1].x,state.items[1].y)");
  assert.equal(run('state.items.length'), 2); assert.equal(run("state.items.find(i=>i.type==='shuriken').level"), 2);
});
test('auto placement rotates when necessary and does not lose loot if full', () => {
  const run = game(); run(`state.bagSize=5;state.items=Array.from({length:25},(_,n)=>({...makeItem('shuriken',4),x:n%5,y:Math.floor(n/5)})).filter(i=>i.y!==4||i.x>2);state.loot=[makeItem('wand')];quickTake(state.loot[0].id)`);
  assert.equal(run('state.loot.length'), 0); assert.equal(run('state.items.at(-1).w'), 3); assert.equal(run('state.items.at(-1).y'), 4);
  run("state.loot=[makeItem('storm')]; quickTake(state.loot[0].id)"); assert.equal(run('state.loot.length'), 1); assert.equal(run('state.loot[0].w'), 2); assert.equal(run('selected'), run('state.loot[0].id'));
});
for (const width of [354,850]) test(`the first five levels stay clearable from starter kits at width ${width}`,()=>{
 const {simulate}=require('../scripts/simulate-campaign');
 const report=simulate({width,first:0,last:4});
 assert.equal(report.wins,5,JSON.stringify(report.rows.filter(r=>r.mode!=='won')));
 assert.ok(report.rows.every(r=>r.peakEnemies<=14));
});

test('equipment is passive, uses the strongest copy and protects the last weapon',()=>{
  const run=game();
  run("var armor=makeItem('armor',4),boots=makeItem('boots',4);state.items=[state.items[0],armor,boots,makeItem('boots',1)];");
  assert.equal(run('PackCore.equipment(state.items).reduction'),.42);
  assert.equal(run('PackCore.equipment(state.items).haste'),1.45);
  assert.equal(run('weaponAttack(armor)'),false);
  run("selected=state.items[0].id;$('discard').onclick()");assert.equal(run('state.items.length'),4);
  run("startEncounter();state.enemies=state.enemies.slice(0,1);state.enemies[0].x=0;state.enemies[0].hp=100000;state.enemies[0].elite=false;state.enemies[0].attack=0;state.cooldowns[state.items[0].id]=0;updateCombat(.01)");
  assert.equal(run('state.hp'),97);
  run('manualAttack(state.items[0].id)');assert.ok(Math.abs(run('state.cooldowns[state.items[0].id]')-1.9/1.45)<.00001);
});

test('new weapons fire, spear pierces, and evolved bombs deal splash and afterburn',()=>{
  const run=game();run("startEncounter();state.enemies.forEach((e,i)=>{e.x=500+i*10;e.hp=100000;});");
  run("weaponAttack(makeItem('bow',4))");assert.equal(run('state.projectiles.length'),4);
  run("state.projectiles=[];weaponAttack(makeItem('spear'));state.projectiles[0].delay=0;state.projectiles[0].x=500;state.projectiles[0].y=state.enemies[0].y-state.enemies[0].size;var sp=state.projectiles[0];state.items=[];updateCombat(.001)");
  // A level-1 spear passes through exactly two foes, then stops.
  assert.equal(run('sp.hitIds.size'),2);assert.equal(run('state.projectiles.length'),0);
  run("state.effects=[];impact({type:'bomb',level:4,damage:100,color:'#fff'},state.enemies[0]);var beforeBurn=state.enemies[1].hp;updateEffects(.41,true)");
  assert.ok(run('state.enemies[1].hp')<run('beforeBurn'));
  assert.equal(run("state.effects.some(f=>f.kind==='bomb')"),true);
});

test('all item levels have different clipped artwork and all types appear in loot',()=>{
  const run=game();
  assert.ok(run("Object.keys(TYPES).length")>=15);
  assert.equal(run("['axe','shuriken','wand','storm','blade','bow','spear','bomb','armor','boots'].every(type=>new Set([1,2,3,4].map(l=>itemRegion(type,l).x)).size===4)"),true);
  assert.equal(run("['scythe','hammer','orb','dagger','tome'].every(type=>new Set([1,2,3,4].map(l=>itemRegion(type,l).x)).size===4)"),true);
  assert.equal(run("['axe','shuriken','wand','storm','blade','bow','spear','bomb','armor','boots'].every(type=>[1,2,3,4].every(l=>{const r=itemRegion(type,l);return r.x>=0&&r.x+r.w<=1122&&r.y>=0&&r.y+r.h<=1402}))"),true);
  run("progress.cleared=99;startStage(40,{carry:false});var found=new Set();for(let n=0;n<40;n++){lootStop();state.loot.forEach(i=>found.add(i.type));}");
  assert.ok(run('found.size')>=10);
});
test('new attack atlases stretch sky columns and play melee cels',()=>{
  const run=game();
  run("var draws=[];Object.assign(ctx,{save(){},restore(){},drawImage(...args){draws.push(args)},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},ellipse(){},closePath(){},fill(){},stroke(){},translate(){},rotate(){}});slamFrames.complete=true;slamFrames.naturalWidth=1280;slamFrames.naturalHeight=960;scytheFx.complete=true;scytheFx.naturalWidth=1280;scytheFx.naturalHeight=720;orbFx.complete=true;orbFx.naturalWidth=1280;orbFx.naturalHeight=720;daggerFx.complete=true;daggerFx.naturalWidth=1280;daggerFx.naturalHeight=720;");
  run("draws=[];state.effects=[{kind:'slam',level:2,x:400,age:.5,life:1}];renderCombatEffects()");
  assert.ok(run('draws.some(d=>d[0]===slamFrames)'));
  run("draws=[];state.effects=[{kind:'runes',level:3,x:400,age:.5,life:1}];renderCombatEffects()");
  assert.equal(run('draws.filter(d=>d[0]===tomeFx).length'),0);
  run("draws=[];state.effects=[{kind:'reap',level:2,x:400,y:200,age:.2,life:.7}];renderCombatEffects()");
  assert.ok(run('draws.some(d=>d[0]===scytheFx)'));
  run("draws=[];state.effects=[{kind:'orbs',level:2,x:400,y:200,age:.2,life:.7}];renderCombatEffects()");
  assert.ok(run('draws.some(d=>d[0]===orbFx)'));
  run("draws=[];state.effects=[{kind:'flurry',level:2,x:400,y:200,age:.2,life:.7,tilt:1}];renderCombatEffects()");
  assert.ok(run('draws.some(d=>d[0]===daggerFx)'));
  run("hammerFx.complete=true;hammerFx.naturalWidth=2688;hammerFx.naturalHeight=448;draws=[];state.effects=[{kind:'flurry',sheet:'hammer',level:2,x:400,y:200,age:.2,life:.7,tilt:0}];renderCombatEffects()");
  assert.ok(run('draws.some(d=>d[0]===hammerFx)'));
});


test('chest rummaging freezes on pause and reveals its reserved reward plus two alternatives',()=>{
 const run=game();run("startEncounter();state.phase='travel';state.distance=99.9;state.nextLoot=100;update(.01)");
 assert.equal(run('state.phase'),'chest');assert.equal(run('state.loot.length'),0);
 const reward=run('state.chestReward.id');run("$('continue').onclick()");assert.equal(run('state.phase'),'chest');
 run('update(.8);pause();var age=state.chestAge;update(.5)');assert.equal(run('state.chestAge'),run('age'));
 run('pause();for(let i=0;i<100;i++)update(.04)');assert.equal(run('state.mode'),'loot');assert.equal(run('state.loot.length'),3);assert.equal(run('state.loot[0].id'),reward);
 run('update(10)');assert.equal(run('state.loot.length'),3);assert.equal(run('state.distance'),100);
});

test('chests approach closed and opened chests scroll away with the ground',()=>{
 const run=game();
 run("var draws=[];ctx.drawImage=(...a)=>draws.push(a);chestScenes.complete=closedChestSheet.complete=true;chestScenes.naturalWidth=1536;closedChestSheet.naturalWidth=1448;state.phase='travel';state.distance=90;state.nextLoot=100;renderWorldChest()");
 assert.equal(run('draws.length'),1);assert.equal(run('draws[0][0]===closedChestSheet'),true);
 run("state.distance=100;beginChest();state.phase='loot';draws=[];renderWorldChest();var chestX=draws[0][5];startEncounter();draws=[];renderWorldChest()");
 assert.equal(run('draws[0][5]'),run('chestX'));
 run("state.phase='travel';state.nextLoot=200;state.distance=110;draws=[];renderWorldChest()");
 assert.equal(run('draws[0][5]'),run('chestX-70'));
 run("state.distance=160;draws=[];renderWorldChest()");
 assert.equal(run('draws.length'),1);assert.equal(run('draws[0][0]===closedChestSheet'),true);
 run('reset()');assert.equal(run('state.lastChestDistance'),undefined);
});

test('chest rewards follow the drawn fist and keep their artwork proportions',()=>{
 const run=game();
 run("var grips=[],draws=[];Object.assign(ctx,{save(){},restore(){},translate(x,y){grips.push([x,y])},rotate(){},drawImage(...a){draws.push(a)}});chestScenes.complete=true;chestScenes.naturalWidth=1536;evolutionArt.complete=true;evolutionArt.naturalWidth=1122;state.phase='chest';state.chestReward=makeItem('blade');");
 for(const age of [1.02,1.3,1.6])run(`state.chestAge=${age};renderRummage()`);
 assert.equal(run('grips.length'),3);assert.equal(run('new Set(grips.map(p=>p.join())).size'),3);
 assert.equal(run('draws.filter(d=>d[0]===evolutionArt).every(d=>Math.abs(d[8]/d[7]-d[4]/d[3])<1e-9)'),true);
 assert.equal(run('draws.filter(d=>d[0]===chestScenes&&d[3]===24&&d[4]===26).length'),3);
});

test('seed bow uses only the new animated bolt and impact atlas',()=>{
 const run=game();run("var draws=[];Object.assign(ctx,{save(){},restore(){},translate(){},rotate(){},drawImage(...a){draws.push(a)}});seedBolts.complete=true;seedBolts.naturalWidth=1536;seedBolts.naturalHeight=1024;");
 run("for(let life=2.5;life>2;life-=.02)projectileDraw({type:'bow',level:4,x:100,y:80,vx:500,vy:10,life,delay:0})");
 assert.equal(run('new Set(draws.map(d=>d[1])).size'),3);
  assert.equal(run('draws.every(d=>d[0]===seedBolts&&d[2]===0&&Math.abs(d[7]-40*castScale())<1e-6)'),true);
 run("draws=[];for(let age=0;age<.22;age+=.01){state.effects=[{kind:'bow',x:150,y:80,level:4,age,life:.22-age}];renderCombatEffects()}");
 assert.equal(run('draws.every(d=>d[0]===seedBolts&&d[2]===512&&Math.abs(d[7]-46*castScale())<1e-6)'),true);
 assert.equal(run('new Set(draws.map(d=>d[1])).size'),3);
});

test('bomb impacts exclude bomb sprites and afterburn does not restart explosions',()=>{
 const run=game();run("var draws=[];Object.assign(ctx,{save(){},restore(){},translate(){},rotate(){},drawImage(...a){draws.push(a)}});newAttackFrames.complete=true;newAttackFrames.naturalWidth=1774;newAttackFrames.naturalHeight=887;");
 for(const kind of ['bomb','afterburn']){
  run(`draws=[];for(let age=0;age<${kind==='bomb'?.56:.9};age+=.01){state.effects=[{kind:'${kind}',x:150,y:null,level:4,age,life:1-age}];renderCombatEffects()}`);
  // Skip bomb/fuse cells; plant big mushroom on the ground (not enemy torso).
    assert.equal(run(`draws.every(d=>Math.round(d[1]/(1774/6))>=${kind==='bomb'?2:4}&&d[7]>=60&&d[7]<160&&Math.abs(d[6]+d[8]-(groundY()+5))<.001)`),true);
 }
 run("startEncounter();state.enemies.forEach(e=>e.hp=100000);var arrow={type:'bow',level:4,damage:10,color:'#fff'};state.enemies.forEach(e=>impact(arrow,e));");
 assert.equal(run("state.effects.filter(f=>f.kind==='bowBloom').length"),1);
 run("state.effects=[];var bomb={type:'bomb',level:1,damage:10,color:'#fff'};impact(bomb,state.enemies[0]);");
 assert.equal(run("state.effects.filter(f=>f.kind==='bomb').length"),1);
 assert.equal(run("state.effects.find(f=>f.kind==='bomb').y"), null);
});

test('frog appearance follows strongest armor immediately, including removal',()=>{
  const run=game();assert.equal(run('frogArmorLevel()'),0);
  run("var light=makeItem('armor',1),heavy=makeItem('armor',3);state.items.push(light,heavy)");assert.equal(run('frogArmorLevel()'),3);
  run('heavy.level=4');assert.equal(run('frogArmorLevel()'),4);
  run("selected=heavy.id;$('discard').onclick()");assert.equal(run('frogArmorLevel()'),1);
  run("selected=light.id;$('discard').onclick()");assert.equal(run('frogArmorLevel()'),0);
});

test('frog armor sheets draw valid matching cells for run, attack, stop and idle',()=>{
  const run=game();
  run("var draws=[];Object.assign(ctx,{save(){},restore(){},translate(){},rotate(){},beginPath(){},ellipse(){},fill(){},drawImage(...a){draws.push(a)}});frogSheets.forEach(i=>{i.complete=true;i.naturalWidth=1024;i.naturalHeight=1536});");
  for(let level=0;level<=4;level++){
    run(`state.items=state.items.filter(i=>i.type!=='armor');if(${level})state.items.push(makeItem('armor',${level}));draws=[];`);
    run("state.phase='travel';for(let i=0;i<52;i++){state.runTime=i*.01;renderFrogHero();}");
    run("state.phase='combat';for(let i=0;i<78;i++){state.handFlash=.78-i*.01;renderFrogHero();}");
    run("state.phase='loot';for(let i=0;i<56;i++){state.stopAge=i*.01;renderFrogHero();}state.stopAge=STOP_DURATION;for(let i=0;i<240;i++){state.poseTime=i*.01;renderFrogHero();}");
    assert.equal(run('new Set(draws.filter((d,i)=>i%2===0).map(d=>d[1]+","+d[2])).size'),24);
    assert.equal(run(`draws.every(d=>d[0]===frogSheets[${level}]&&d[1]>=0&&d[2]>=0&&d[1]+d[3]<=1024&&d[2]+d[4]<=1536)`),true);
  }
  run("state.mode='paused';var frozen=frogFrame();update(.4)");assert.equal(run('frogFrame()'),run('frozen'));
});


test('frog crops keep overhanging hats and exclude neighboring sprites on all armor sheets',()=>{
  const run=game();
  assert.equal(run('FROG_REGIONS.every(frames=>frames.length===24&&frames.every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=1024&&y+h<=1536))'),true);
  assert.ok(run('FROG_REGIONS[0][0][0]+FROG_REGIONS[0][0][2]')>256);
  assert.ok(run('FROG_REGIONS[0][1][0]')>run('FROG_REGIONS[0][0][0]+FROG_REGIONS[0][0][2]'));
  assert.equal(run('FROG_REGIONS.every(frames=>frames.every((a,i)=>frames.every((b,j)=>i===j||a[0]+a[2]<=b[0]||b[0]+b[2]<=a[0]||a[1]+a[3]<=b[1]||b[1]+b[3]<=a[1])))'),true);
});

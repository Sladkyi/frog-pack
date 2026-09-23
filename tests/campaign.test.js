const test=require('node:test');
const assert=require('node:assert/strict');
const {STAGES,LEVELS,LAST_WAVE,WORLDS}=require('../campaign');
const {game}=require('./helpers/game-harness');

test('100 distinct routes cover every encounter once and finish with a boss',()=>{
  assert.equal(STAGES.length,100);assert.equal(WORLDS.length,10);
  assert.equal(LAST_WAVE,601);
  const routes=new Set();let next=1;
  for(const stage of STAGES){
    assert.equal(stage.firstWave,next);
    const waves=LEVELS.slice(stage.firstWave-1,stage.lastWave);
    assert.equal(waves.length,stage.waveCount);
    assert.ok(waves.at(-1).boss);
    routes.add(JSON.stringify([stage.gear,waves.map(w=>w.entries||w.pool)]));
    for(const wave of waves){
      assert.equal(wave.stageIndex,stage.id-1);
      if(wave.entries){
        assert.equal(wave.entries.length,wave.count);
        assert.ok(wave.entries.every((e,i,a)=>e.at>=0&&(!i||e.at>=a[i-1].at)));
      }
    }
    next=stage.lastWave+1;
  }
  assert.equal(next,LAST_WAVE+1);assert.equal(routes.size,100);
  assert.equal(LEVELS.slice(-3).filter(w=>w.boss).length,3);
});

test('reinforcement gaps cannot end a wave, pause freezes the queue and retry resets it',()=>{
  const run=game();run('progress.cleared=99;startStage(20);var queued=state.pendingEnemies.length;state.enemies=[];update(.04)');
  assert.equal(run('state.phase'),'combat');assert.equal(run('state.pendingEnemies.length'),run('queued'));
  run('pause();var age=state.encounterTime;update(20)');
  assert.equal(run('state.encounterTime'),run('age'));
  run('pause();state.encounterTime=30;spawnScheduledEnemies()');
  assert.ok(run('state.enemies.length')<=14);
  assert.ok(run('state.enemies.length')>0);
  run('startStage(20)');assert.equal(run('state.encounterTime'),0);
  assert.equal(run('state.pendingEnemies.length'),run('queued'));
});

test('barriers absorb only their charges and brood creatures split just once',()=>{
  const run=game();run("progress.cleared=99;startStage(30);state.enemies=[];var shell=spawnEncounterEnemy({kind:'shardBeetle'});shell.hp=shell.maxHp=1000;hit(shell,100,'#fff');hit(shell,100,'#fff');var shielded=shell.hp;hit(shell,100,'#fff')");
  assert.equal(run('shell.barrier'),0);assert.equal(run('shielded'),964);assert.equal(run('shell.hp'),874);
  run("state.enemies=[];var brood=spawnEncounterEnemy({kind:'broodling'});hit(brood,100000,'#fff');hit(brood,100000,'#fff')");
  assert.equal(run("state.enemies.filter(e=>e.hp>0&&e.kind==='spider').length"),2);
});

test('healers restore nearby allies, rage triggers once and aura respects its strength',()=>{
  const run=game();run("progress.cleared=99;startStage(90);state.enemies=[];var healer=spawnEncounterEnemy({kind:'healer'}),ally=spawnEncounterEnemy({kind:'beetle'});healer.x=ally.x=W*.9;healer.speed=ally.speed=0;ally.hp=ally.maxHp/2;var before=ally.hp;healer.age=3.99;updateCombat(.02)");
  assert.ok(run('ally.hp')>run('before'));
  run("state.enemies=[];var rage=spawnEncounterEnemy({kind:'emberBoar'});rage.hp=rage.maxHp*.4;var speed=rage.speed,scale=rage.damageScale;updateCombat(.01);updateCombat(.01)");
  assert.equal(run('rage.speed'),run('speed*1.2'));assert.equal(run('rage.damageScale'),run('scale*1.15'));
  run("state.enemies=[];var drum=spawnEncounterEnemy({kind:'worldHeart'}),friend=spawnEncounterEnemy({kind:'beetle'});drum.x=friend.x=W;drum.speed=0;var startX=friend.x,walkSpeed=friend.speed;updateCombat(.1)");
  assert.ok(Math.abs(run('startX-friend.x')-run('walkSpeed*.1*1.12*ENEMY_PACE'))<1e-8);
});

test('six-level saves migrate without losing stars and unlock level seven',()=>{
  const storage=new Map([['packrun-levels-v1',JSON.stringify({cleared:6,selected:5,stars:[3,2,1,3,2,1]})]]);
  const run=game(false,storage);
  assert.equal(run('progress.stars.length'),100);
  assert.equal(run('progress.stars.slice(0,6).join()'),'3,2,1,3,2,1');
  assert.equal(run('startStage(6)'),true);assert.equal(run('startStage(7)'),false);
});

test('menu reaches 100, shows ten cards and opens on the saved page',()=>{
  const run=game();run('openLevelMenu();changeLevelPage(9)');
  assert.equal(run("$('levels-range').textContent"),'91–100 / 100');
  assert.equal(run("$('level-cards').children.length"),10);
  assert.equal(run("$('levels-next').disabled"),true);
  assert.equal(run("$('level-cards').children.every(el=>el.disabled)"),true);
  run('closeLevelMenu();progress.cleared=95;startStage(95);openLevelMenu()');
  assert.equal(run('menuPage'),9);
  assert.equal(run("$('level-cards').children.filter(el=>el.disabled).length"),4);
});

test('all 601 waves resolve to a loaded background with no ready-screen jump',()=>{
  const run=game();
  assert.equal(run('LEVELS.every(w=>waveBiomeIndex(w.number)>=0&&waveBiomeIndex(w.number)<BIOMES.length)'),true);
  run('reset(99);var bg=state.currentBiome;update(.04)');
  assert.equal(run('state.targetBiome'),run('bg'));
  assert.equal(run('state.biomeBlend'),0);
});

test('procedural stages stay above late-legacy toughness so level 7 is not a one-shot stroll',()=>{
  const run=game();
  assert.ok(run('LEVELS[5].health')<run('LEVELS[20].health'));
  assert.ok(run('LEVELS[STAGES[6].firstWave-1].health')>=200);
  assert.ok(run('LEVELS.filter(l=>l.stageIndex===6).every(l=>l.health>=200)'));
  // A whole press of a carried axe 4 (every shot) must not one-shot stage-7 scouts.
  assert.ok(run('LEVELS[STAGES[6].firstWave-1].health > (()=>{const a=PackCore.makeItem("axe",4);return PackCore.scaledDamage(a,PackCore.defaultUpgrades())*PackCore.shots(a);})()'));
  assert.ok(run('LEVELS[STAGES[6].firstWave-1].health < LEVELS[STAGES[6].firstWave-1].health * 0 + 700'));
});

test('level 4 is never a starter kit and opens only from level 31',()=>{
  const {levelCap,STAGES}=require('../campaign');
  assert.equal(levelCap(0),3);assert.equal(levelCap(29),3);assert.equal(levelCap(30),4);
  for(const stage of STAGES){
    assert.ok(stage.gear.every(([,level])=>level>=1&&level<4),stage.name);
    if(stage.id>30)assert.ok(stage.gear.every(([,level])=>level<levelCap(stage.id-1)),stage.name);
  }
});

test('bags grow and every starter kit still fits',()=>{
  const {placeGear}=require('../core');
  const {STAGES}=require('../campaign');
  assert.equal(STAGES[5].bag,5);
  assert.equal(STAGES[20].bag,6);
  assert.equal(STAGES[50].bag,7);
  assert.ok(STAGES[20].gear.length>STAGES[6].gear.length);
  assert.ok(STAGES[70].gear.some(([type])=>type==='orb'));
  for(const stage of STAGES){
    const items=placeGear(stage.gear,stage.bag);
    assert.equal(items.length,stage.gear.length,`stage ${stage.id} dropped kit pieces`);
  }
});

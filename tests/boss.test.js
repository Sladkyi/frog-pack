const test = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game-harness');
const PackCore = require('../core.js');

const bossFight = run => {
  run("progress.cleared=99;startStage(30);state.enemies=[];state.pendingEnemies=[]");
  // age 2 sits outside the golem's shield window (first 1.6s of every 5s).
  run("var boss=spawnEncounterEnemy({kind:'crystalGolem',boss:true});boss.x=W*.7;boss.speed=0;boss.hp=boss.maxHp=10000;boss.age=2;state.hp=100;state.maxHp=100");
};

test('a lv4 press is ~5× a lv1 press, not 18×, and costs twice the mana', () => {
  const press = level => { const i = PackCore.makeItem('axe', level); return PackCore.damage(i) * PackCore.shots(i); };
  assert.ok(press(4) / press(1) < 6);
  assert.ok(press(4) / press(1) > 4.5);
  const cost = level => PackCore.manaCost(PackCore.makeItem('axe', level));
  assert.equal(cost(4), 2 * cost(1));
  assert.ok(cost(2) > cost(1) && cost(3) > cost(2) && cost(4) > cost(3));
});

test('holding fire triggers Focus and regenerates mana faster than spamming', () => {
  const run = game();
  run('startEncounter();state.enemies.forEach(e=>{e.x=W*.9;e.speed=0;e.hp=1e6});state.mana=0;state.lastAttackAt=state.encounterTime');
  run('updateCombat(.5)');
  const busy = run('state.mana');
  run('state.mana=0;state.lastAttackAt=state.encounterTime-FOCUS_DELAY;updateCombat(.5)');
  assert.equal(run('state.focus'), true);
  assert.ok(Math.abs(run('state.mana') - busy * run('FOCUS_MUL')) < 1e-6);
});

test('a boss telegraphs its signature, and enough damage during the wind-up staggers it', () => {
  const run = game(); bossFight(run);
  run('boss.sigClock=boss.sigAt;updateCombat(.01)');
  assert.ok(run('boss.windup') > 0);
  assert.equal(run('boss.sig'), 'slam');
  run("hit(boss,staggerNeed(boss)+1,'#fff')");
  assert.equal(run('boss.windup'), 0);
  assert.ok(run('boss.stun') > 0);
  // Stunned bosses take bonus damage and stand still.
  run('var x0=boss.x;boss.speed=100;updateCombat(.2)');
  assert.equal(run('boss.x'), run('x0'));
  const hp = run('boss.hp'); run("hit(boss,100,'#fff')");
  assert.equal(hp - run('boss.hp'), Math.round(100 * run('STAGGER_VULN')));
});

test('an unbroken SMASH lands from anywhere; Burst breaks wind-ups twice as fast', () => {
  const run = game(); bossFight(run);
  run('boss.x=W*.9;boss.sigClock=boss.sigAt;updateCombat(.01);updateCombat(BOSS_WINDUP+.01)');
  assert.ok(run('state.hp') < 100);
  assert.ok(run('boss.stun') === 0);
  run('boss.sigClock=boss.sigAt;updateCombat(.01)');
  assert.ok(run('boss.windup') > 0);
  run("hit(boss,Math.ceil(staggerNeed(boss)/BURST_STAGGER)+1,'#fff',null,'burst')");
  assert.ok(run('boss.stun') > 0);
});

test('bosses shift phase with a barrier and reinforcements; Pierce ignores barriers', () => {
  const run = game(); bossFight(run);
  const before = run('state.enemies.length');
  run('boss.hp=boss.maxHp*.6;updateCombat(.01)');
  assert.equal(run('boss.bossPhase'), 1);
  assert.ok(run('boss.barrier') > 0);
  assert.ok(run('state.enemies.length') > before);
  const hp = run('boss.hp'); run("hit(boss,1000,'#fff',null,'nova')");
  const blocked = hp - run('boss.hp');
  const hp2 = run('boss.hp'); run("hit(boss,1000,'#fff',null,'pierce')");
  assert.ok(hp2 - run('boss.hp') > blocked * 3);
});

test('Burst ignores armor and Blight stops healing', () => {
  const run = game();
  run("startEncounter();state.enemies=[];var snail=spawnEncounterEnemy({kind:'snail'});snail.hp=snail.maxHp=1e5;snail.age=0");
  const hp = run('snail.hp'); run("hit(snail,100,'#fff',null,'nova')");
  const armored = hp - run('snail.hp');
  const hp2 = run('snail.hp'); run("hit(snail,100,'#fff',null,'burst')");
  assert.ok(hp2 - run('snail.hp') > armored);
  run("var shroom=spawnEncounterEnemy({kind:'mushroom'});shroom.x=W*.9;shroom.speed=0;shroom.hp=10;shroom.maxHp=1000");
  run("hit(shroom,1,'#fff',null,'dot');updateCombat(1)");
  assert.equal(run('shroom.hp'), 9);
});

test('level 4 stays locked until the mythic stretch, and a temper only pays off in its moment', () => {
  const run = game();
  run('progress.cleared=99;startStage(10);state.enemies=[];state.hp=100;state.maxHp=100');
  run("var a=makeItem('axe',3),b=makeItem('axe',3);a.x=0;a.y=0;b.x=2;b.y=0;state.items.push(a,b);state.loot=[b]");
  assert.equal(run('itemCap()'), 3);
  run('selected=b.id;place(a.x,a.y)');
  assert.equal(run('a.level'), 3);
  run('startStage(30)');
  assert.equal(run('itemCap()'), 4);
  run("var boss=spawnEncounterEnemy({kind:'beetle',boss:true});boss.x=W*.7;boss.speed=0;boss.hp=boss.maxHp=5000;state.enemies=[boss];state.focus=true");
  run("var plain=makeItem('dagger',3);plain.temper=null;var tuned=makeItem('dagger',3);tuned.temper='focus'");
  run('strike(boss,100,"#fff",{temper:null});var base=5000-boss.hp;boss.hp=5000;strike(boss,100,"#fff",{temper:"focus"})');
  assert.ok(run('5000-boss.hp') > run('base'));
});

test('the chest reveal suspense loop terminates for every rarity', () => {
  const run = game();
  for (const type of ['dagger', 'bow', 'storm', 'orb', 'wand', 'starfall_shard']) {
    run(`state.chestReward=makeItem('${type}');updateChestSuspense(0,CHEST_REVEAL+.1)`);
  }
});

test('the attack bar marks the counter to what is on screen', () => {
  const run = game(); bossFight(run);
  run('boss.sigClock=boss.sigAt;updateCombat(.01)');
  assert.equal(run('roleCounters().urgent.has("burst")'), true);
  run('boss.windup=0;boss.barrier=3');
  assert.equal(run('roleCounters().on.has("pierce")'), true);
});

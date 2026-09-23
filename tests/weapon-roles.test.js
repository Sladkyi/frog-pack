const test = require('node:test');
const assert = require('node:assert/strict');
const PackCore = require('../core.js');
const { game } = require('./helpers/game-harness');

// A standing pack of huge-HP foes, so every tick of an attack lands and nothing dies.
const PACK = n => `state.mode='running';state.phase='combat';state.effects=[];state.projectiles=[];state.arcs=[];state.pendingEnemies=[];
  state.enemies=[];for(let i=0;i<${n};i++){const e=spawnEncounterEnemy({kind:'boar'});e.x=W*.6+i*18;e.speed=0;e.hp=e.maxHp=1e9;e.attack=1e9;e.aspect=null;}
  state.mana=1e6;state.maxMana=1e6;state.hp=50;state.attackLock=0;state.cooldowns={};`;
const settle = "for(let t=0;t<4;t+=.02){update(.02);state.mode='running';state.phase='combat';state.enemies.forEach((e,i)=>{e.attack=1e9;e.x=W*.6+i*18;});}";
const lost = 'state.enemies.map(e=>1e9-e.hp)';

test('every weapon plays a named role', () => {
  const weapons = Object.entries(PackCore.TYPES).filter(([, d]) => !d.gear);
  assert.deepEqual(weapons.filter(([, d]) => !PackCore.ROLES[d.role]).map(([id]) => id), []);
  const roles = new Set(weapons.map(([, d]) => d.role));
  assert.deepEqual([...roles].sort(), Object.keys(PackCore.ROLES).sort());
});

test('rarity and footprint scale the hit, mana is priced by the base hit', () => {
  const edge = type => PackCore.damage(PackCore.makeItem(type, 4)) / (PackCore.TYPES[type].damage * 1.65 ** 3);
  assert.ok(edge('demon_axe') > edge('holy_flail') && edge('holy_flail') > edge('tome') && edge('tome') > edge('chaos_flail'),
    'mythic > legendary > epic > rare at the same 2×2 footprint');
  assert.ok(edge('phoenix_lance') > edge('starfall_shard'), 'a 1×3 mythic hits harder per base point than a 1×1 mythic');
  assert.equal(PackCore.manaCost(PackCore.makeItem('tome')), PackCore.manaCost(PackCore.makeItem('chaos_flail')));
});

test('burst hits one foe hard, nova hits the pack, chain jumps through level+2', () => {
  const run = game();
  run('progress.cleared=99;startStage(30,{carry:false});W=390');
  const hitCount = type => run(`(()=>{${PACK(6)}state.items=[makeItem('${type}',3)];weaponAttack(state.items[0]);${settle}return ${lost}.filter(d=>d>0).length})()`);
  assert.equal(hitCount('abyssal_eye'), 1);
  assert.equal(hitCount('holy_flail'), 6);
  assert.equal(hitCount('thunder_hammer'), 5);
  assert.equal(hitCount('storm'), 5);
});

test('burst and elite pacts deal extra damage only to elites and bosses', () => {
  const run = game();
  run('progress.cleared=99;startStage(30,{carry:false});W=390');
  const dealt = (items, elite) => run(`(()=>{${PACK(1)}state.enemies[0].elite=${elite};state.items=[${items}];weaponAttack(state.items[0]);${settle}return ${lost}[0]})()`);
  const eye = "makeItem('abyssal_eye',2)";
  assert.ok(dealt(eye, true) > dealt(eye, false) * 1.1);
  // Cleave: a blade touching a heavy weapon, +20% on elites, nothing on plain foes.
  const cleave = "Object.assign(makeItem('blade',1),{x:0,y:0}),Object.assign(makeItem('axe',1),{x:2,y:0})";
  const plain = "Object.assign(makeItem('blade',1),{x:0,y:0}),Object.assign(makeItem('boots',1),{x:2,y:0})";
  assert.ok(dealt(cleave, true) > dealt(plain, true) * 1.15);
  assert.equal(dealt(cleave, false), dealt(plain, false));
});

test('vortex slows the pack, blight lingers, brace heals per strike', () => {
  const run = game();
  run('progress.cleared=99;startStage(30,{carry:false});W=390');
  assert.ok(run(`(()=>{${PACK(4)}state.items=[makeItem('eclipse_censer',2)];weaponAttack(state.items[0]);for(let t=0;t<1.2;t+=.02)updateEffects(.02,true);return state.enemies.filter(e=>e.slow>0).length})()`) >= 3);
  const ticks = type => run(`(()=>{${PACK(1)}state.items=[makeItem('${type}',3)];weaponAttack(state.items[0]);return state.effects.find(f=>f.role).remaining})()`);
  assert.equal(ticks('plague_censer'), 2 * ticks('chaos_flail'));
  const healed = run(`(()=>{${PACK(1)}state.maxHp=100;state.items=[Object.assign(makeItem('axe',1),{x:0,y:0}),Object.assign(makeItem('spear',1),{x:1,y:0})];weaponAttack(state.items[0]);return state.hp})()`);
  assert.equal(healed, 54);
});

test('the backpack draws a glowing seam on every contact, gold for a live pact', () => {
  const run = game();
  run("state.items=[Object.assign(makeItem('blade',1),{x:0,y:0}),Object.assign(makeItem('bow',1),{x:2,y:0}),Object.assign(makeItem('dagger',1),{x:0,y:1})];renderInventory()");
  const seams = run("$('inventory').children.filter(c=>/\\bseam\\b/.test(c.className)).map(c=>c.className+'@'+c.style.gridArea).sort().join('|')");
  assert.equal(seams, 'seam h school@2/1/3/2|seam v pact@1/3/2/4');
});

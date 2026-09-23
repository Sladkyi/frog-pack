const test = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game-harness');

test('aspect matchups punish the same element and reward the prey', () => {
  const run = game();
  assert.equal(run("aspectMul('ember','frost')"), 1.8);
  assert.equal(run("aspectMul('frost','storm')"), 1.8);
  assert.equal(run("aspectMul('storm','ember')"), 1.8);
  assert.equal(run("aspectMul('ember','ember')"), 0.3);
  assert.equal(run("aspectMul('ember','storm')"), 1);
  assert.equal(run("aspectMul(undefined,'frost')"), 1);
  assert.equal(run('PackCore.TYPES.solar_bow.aspect'), 'ember');
  assert.equal(run('PackCore.TYPES.spirit_lance.aspect'), 'frost');
  assert.equal(run('PackCore.TYPES.thunder_hammer.aspect'), 'storm');
  assert.equal(run('PackCore.TYPES.dagger.aspect'), undefined);
  run("var frost={hp:1000,maxHp:1000,aspect:'frost',x:1,y:1,size:10}; hit(frost,100,'#fff','ember');");
  assert.equal(run('frost.hp'), 820);
  run("var same={hp:1000,maxHp:1000,aspect:'ember',x:1,y:1,size:10}; hit(same,100,'#fff','ember');");
  assert.equal(run('same.hp'), 970);
  run("var plain={hp:1000,maxHp:1000,x:1,y:1,size:10}; hit(plain,100,'#fff','ember');");
  assert.equal(run('plain.hp'), 900);
});

test('early chapters stay plain and later waves carry one then two aspects', () => {
  const run = game();
  run('progress.cleared=10');
  assert.equal(run('startStage(0)'), true);
  assert.equal(run('state.enemies.every(e => !e.aspect)'), true);
  assert.equal(run('startStage(2)'), true);
  assert.equal(run('new Set(state.enemies.map(e => e.aspect)).size'), 1);
  assert.ok(run('state.enemies[0].aspect'));
  assert.equal(run('startStage(4)'), true);
  assert.equal(run('new Set(state.enemies.map(e => e.aspect)).size'), 2);
});

test('an ember weapon spends its hit on frost and leaves the next frost for the next weapon', () => {
  const run = game();
  run("startEncounter(); state.mana=500; state.enemies=[{x:80,y:10,hp:1000,maxHp:1000,size:20,aspect:'ember'},{x:240,y:10,hp:1000,maxHp:1000,size:20,aspect:'frost'},{x:400,y:10,hp:1000,maxHp:1000,size:20,aspect:'frost'}];");
  run("var bow=makeItem('phoenix_lance',4); var bow2=makeItem('phoenix_lance',4); weaponAttack(bow); weaponAttack(bow2);");
  assert.equal(run('state.effects[0].target.x'), 240);
  assert.equal(run('state.effects[1].target.x'), 400);
  assert.equal(run('state.effects[0].aspect'), 'ember');
});

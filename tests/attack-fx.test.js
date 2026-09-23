const test = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./helpers/game-harness');

test('unique weapons keep dedicated attack modes', () => {
  const run = game();
  assert.equal(run("PackAttackFx.resolve('wand').mode"), 'beam');
  assert.equal(run("PackAttackFx.resolve('hammer').mode"), 'flurry');
  assert.equal(run("PackAttackFx.resolve('thunder_halberd').mode"), 'thunder_halberd');
  assert.equal(run("PackAttackFx.resolve('thunder_halberd').unique"), true);
  assert.equal(run("PackAttackFx.resolve('storm').mode"), 'storm');
  assert.equal(run("PackAttackFx.resolve('dagger').unique"), true);
  assert.equal(run("PackAttackFx.resolve('axe').impact"), 'fire');
});

test('every weapon in the game has its own attack animation', () => {
  const run = game();
  assert.equal(run("Object.keys(TYPES).filter(id=>!TYPES[id].gear&&!PackAttackFx.resolve(id).unique).join(',')"), '');
  assert.equal(run('PackAttackFx.missingUnique().length'), 0);
  assert.equal(run("Object.keys(TYPES).filter(id=>!TYPES[id].gear).length"), 36);
});

test('animated rare weapons keep their own effect and still fight', () => {
  const run = game();
  assert.equal(run("PackAttackFx.resolve('solar_bow').effectKind"), 'solar_bow');
  assert.equal(run("PackAttackFx.resolve('glacial_estoc').effectKind"), 'frost_scepter');
  assert.equal(run("PackAttackFx.resolve('phoenix_lance').unique"), true);
  assert.equal(run("PackAttackFx.resolve('abyssal_eye').effectKind"), 'abyss_eye');
  assert.equal(run("PackAttackFx.resolve('spirit_lance').effectKind"), 'spirit_epic');
  run("startEncounter();state.mana=200;state.enemies.forEach(e=>{e.x=W*.65;e.hp=100000});");
  assert.equal(run("weaponAttack(makeItem('thunder_halberd'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='thunder_halberd')"), true);
  run("state.effects=[];state.arcs=[];");
  assert.equal(run("weaponAttack(makeItem('demon_axe'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='demon_inferno')"), true);
  run("state.effects=[];state.arcs=[];state.projectiles=[];");
  assert.equal(run("weaponAttack(makeItem('abyssal_eye'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='abyss_eye')"), true);
  run("state.effects=[];");
  assert.equal(run("weaponAttack(makeItem('spirit_lance'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='spirit_epic')"), true);
  run("state.effects=[];");
  assert.equal(run("weaponAttack(makeItem('frost_scepter'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='frost_scepter')"), true);
  run("state.effects=[];");
  assert.equal(run("weaponAttack(makeItem('starfall_shard'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='starfall_shard')"), true);
  run("state.effects=[];");
  assert.equal(run("weaponAttack(makeItem('moon_glaive'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='moon_glaive')"), true);
  run("state.effects=[];");
  assert.equal(run("weaponAttack(makeItem('dragon_pike'))"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='dragon_pike')"), true);
});

test('flight frames leave the frog and the hit stays on the enemy', () => {
  const run = game();
  run("startEncounter();state.mana=500;state.enemies.forEach(e=>{e.x=W*.7;e.hp=1e9});");
  assert.equal(run("weaponAttack(makeItem('void_greatsword',4))"), true);
  const start = run("legendPose(state.effects[0]).x");
  const frog = run("W*.27+20");
  assert.ok(Math.abs(start - (frog + 36)) < 2, 'first frame starts in front of the frog');
  run("state.effects[0].life=state.effects[0].life*0.08; state.effects[0].age=state.effects[0].life*11.5;");
  const end = run("legendPose(state.effects[0]).x");
  const foe = run("state.enemies[0].x");
  assert.ok(Math.abs(end - foe) < 2, 'impact frame sits on the enemy');
  assert.ok(end - start > 80, 'the streak actually crosses the gap');
  run("state.effects=[];weaponAttack(makeItem('eclipse_censer',4))");
  assert.equal(run("inFlight(state.effects[0])"), true, 'a slam is thrown at the foe, not spawned inside it');
  const hp = run("state.enemies[0].hp");
  run("for(let i=0;i<100&&inFlight(state.effects[0]);i++)update(.01)");
  assert.equal(run("state.enemies[0].hp"), hp, 'no damage before the throw lands');
  const slam = run("legendPose(impactView(state.effects[0]))");
  assert.equal(slam.landed, true);
  assert.ok(Math.abs(slam.x - run("state.enemies[0].x")) < 4, 'the slam lands on the foe');
  run("var planted=state.effects[0].x;state.enemies[0].x-=40;updateEffects(.01,true)");
  assert.equal(run("state.effects[0].x"), run("planted"), 'a landed slam stays planted');
});

test('hit sheets keep one cel cadence at every weapon level', () => {
  const run = game();
  const cadence = level => run(`(()=>{startEncounter();state.mana=1e6;state.effects=[];state.enemies.forEach(e=>{e.x=W*.6;e.hp=1e9});
    weaponAttack(makeItem('dragon_pike',${level}));const fx=impactView(state.effects[0]),whole=fx.age+fx.life;
    const times=[];let last=-1;for(let a=0;a<whole;a+=1/120){const f=legendFrame({...fx,age:a,life:whole-a});if(f!==last){times.push(a);last=f;}}
    return {step:(times.at(-1)-times[0])/(times.length-1),last};})()`);
  const low = cadence(1), high = cadence(4);
  assert.ok(Math.abs(low.step - ART_CEL_VALUE()) < .02 && Math.abs(high.step - ART_CEL_VALUE()) < .02, `${low.step} vs ${high.step}`);
  assert.equal(high.last, 11, 'long windows still end on the dissipating cel');
  function ART_CEL_VALUE() { return run('ART_CEL'); }
});

test('legend sheets share one ground line and are sized by their painted art', () => {
  const run = game();
  run("var sheet={complete:true,naturalWidth:1152,naturalHeight:864,_bounds:{key:'4x3',value:{feet:[.7,.98,.5,.9],union:[0,.4,1,.9],frames:[]}}}");
  assert.equal(run("legendAnchor(sheet)"), .98);
  assert.equal(run("legendPaintHeight(sheet)"), .5);
  assert.equal(run("legendAnchor({complete:false})"), 1);
});

test('storm no longer borrows thunder_halberd sheet', () => {
  const run = game();
  run("startEncounter();state.mana=200;state.items=[makeItem('storm',2)];manualAttack(state.items[0].id)");
  assert.equal(run("state.effects.some(f=>f.kind==='lightning')"), true);
  assert.equal(run("state.effects.some(f=>f.kind==='thunder_halberd')"), false);
});

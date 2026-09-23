const test=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./helpers/game-harness');
const setup="startEncounter();state.mana=1e6;state.maxMana=1e6;state.effects=[];state.enemies.forEach((e,i)=>{e.x=W*.6+i*25;e.hp=e.maxHp=1e9;e.speed=0;});";
test('every weapon requests the effect atlas used by the renderer',()=>{
 const run=game();
 assert.equal(run(`(()=>{${setup}return Object.keys(TYPES).filter(type=>!TYPES[type].gear).every(type=>{
  state.items=[makeItem(type)];const assets=sceneAssets();const kind=attackProfile(type)?.effectKind;
  return kind?assets.includes(legendFx[kind]):true;
 })})()`),true);
 for(const type of ['axe','scythe','storm'])assert.equal(run(`state.items=[makeItem('${type}')];sceneAssets().includes(${type==='axe'?'axe12Fx':type==='scythe'?'scythe12Fx':'stormHitFx'})`),true);
});
test('measured frame rectangles stay within their atlas and have positive area',()=>{
 const run=game();
 assert.equal(run('Object.values(FX_ATLAS_DATA).every(m=>m.frames.length===m.cols*m.rows&&m.frames.every(([x,y,w,h])=>x>=0&&y>=0&&w>0&&h>0&&x+w<=m.size[0]&&y+h<=m.size[1]))'),true);
});
test('all ground magic waits for contact and actually damages after it',()=>{
 const run=game();
 const types=run("Object.keys(TYPES).filter(t=>attackProfile(t)?.mode==='ground')");
 for(const type of types){
  run(`${setup}state.items=[makeItem('${type}',4)];weaponAttack(state.items[0]);var f=state.effects[0],at=legendContactTime(f);`);
  run('updateEffects(Math.max(0,at-.001),true)');
  assert.equal(run('state.enemies.every(e=>e.hp===1e9)'),true,type+' damages early');
  run('for(let i=0;i<200;i++)updateEffects(.01,true)');
  assert.equal(run('state.enemies.some(e=>e.hp<1e9)'),true,type+' never lands');
 }
});
test('star shards start beyond the sky, travel down-left, and stay on their own victim',()=>{
 const run=game();run(`${setup}weaponAttack(makeItem('starfall_shard',2));var f=state.effects[0];`);
 const first=run('legendPose(f)');
 assert.ok(first.y<0);assert.ok(first.x>run('f.target.x'));
 run('updateEffects(.15,true)');const later=run('legendPose(f)');
 assert.ok(later.x<first.x&&later.y>first.y);
 run('for(let i=0;i<80;i++)updateEffects(.01,true);var x=f.impactX,y=f.impactY;f.target.x-=50;f.target.y-=30;');
 assert.equal(run('legendPose(f).x'),run('x'));assert.equal(run('legendPose(f).y'),run('y'));
 run(`${setup}weaponAttack(makeItem('starfall_shard',1));state.effects[0].target.hp=0;var other=state.enemies.find(e=>e.hp>0);state.effects=state.effects.slice(0,1);for(let i=0;i<150;i++)updateEffects(.01,true)`);
 assert.equal(run('other.hp'),1e9,'a dead meteor target must not redirect the impact invisibly');
});
test('body impacts retain their center and fit short phone and wide scenes',()=>{
 const run=game();run('Object.values(legendFx).forEach(s=>{const m=FX_ATLAS_DATA[s.assetName];if(m){s.complete=true;s.naturalWidth=m.size[0];s.naturalHeight=m.size[1];}})');
 for(const [w,h] of [[320,210],[390,340],[850,348]])for(const x of [25,w*.6,w-25]){
  run(`W=${w};H=${h};var f={kind:'starfall_shard',age:.65,life:.65,level:4,x:${x},impactX:${x},impactY:H*.65};var l=legendLayout(f),m=fxAtlas(legendFx[f.kind]),b=m.boxes[legendPose(f).frame];`);
  assert.equal(run('l.x'),x);
  assert.ok(run('l.x+(b[0]-l.ax)*l.w')>=0);
  assert.ok(run('l.x+(b[2]-l.ax)*l.w')<=w);
  assert.ok(run('l.y+(b[1]-l.ay)*l.h')>=0);
  assert.ok(run('l.y+(b[3]-l.ay)*l.h')<=h);
 }
});

test('compact attacks contact promptly at every evolution and finish without replaying flight',()=>{
 const run=game();
 for(const type of ['clockwork_trap','dragon_pike','tempest_tome','astral_mirror','moon_glaive','chaos_flail'])for(const lv of [1,2,3,4]){
  run(`${setup}weaponAttack(makeItem('${type}',${lv}));var f=state.effects[0],cfg=LEGEND_TRAVEL[f.kind],at=legendContactTime(f),whole=f.life;`);
  assert.ok(run('at')<=.3,type+' contacts late');
  assert.ok(run('cfg.size')<=84,type+' obscures the enemy');
  assert.ok(run('legendFrame({...f,age:at+.001,life:whole-at-.001})')>=run('cfg.hit'));
  assert.equal(run('legendFrame({...f,age:whole-.001,life:.001})'),11);
 }
 assert.equal(run("legendFx.dragon_pike.assetName"),'epic-fire-crescent-frames-v1.png','dragon cannot carry baked dirt');
 assert.equal(run("legendFx.clockwork_trap.assetName"),'clockwork-trap-fx-v1.png','trap uses small gold teeth, not the purple spell');
});

test('contact feedback is once per effect and rapid DOT numbers combine',()=>{
 const run=game();run(`${setup}var e=state.enemies[0],f={srcRole:'burst'};state.texts=[];state.hitstop=0;state.impactCooldown=0;strike(e,10,'#fff',f);`);
 assert.ok(run('state.hitstop')>0&&run('state.hitstop')<=.055);
 run("state.hitstop=0;state.impactCooldown=0;strike(e,12,'#fff',f)");
 assert.equal(run('state.hitstop'),0,'repeated damage must not freeze again');
 assert.equal(run('state.texts.length'),1);assert.equal(run('state.texts[0].text'),22);
});

test('resizing keeps the projectile origin and locked impact attached to the scene',()=>{
 const run=game();run(`${setup}weaponAttack(makeItem('starfall_shard',4));for(let i=0;i<60;i++)updateEffects(.01,true);var f=state.effects[0],x=f.impactX,y=f.impactY;$('game').rect={width:W/2,height:H/2};resize()`);
 assert.equal(run('f.impactX'),run('x/2'));assert.equal(run('f.impactY'),run('y/2'));
});

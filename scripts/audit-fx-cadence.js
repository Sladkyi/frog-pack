// Effective ms per cel for every weapon's hit animation, per level, measured on the real attack code.
const { game } = require('../tests/helpers/game-harness');
const run = game();
const frameCounts = { beam: 12, slam: 12, runes: 6, reap: 12, orbs: 4, flurry: 6, thunder_halberd: 12, lightning: 6, fire: 12, slash: 12, vortex: 6, bow: 3, spear: 3, bomb: 4 };
const rows = run(`(()=>{
  const out=[];
  const weapons=Object.keys(TYPES).filter(t=>!TYPES[t].gear);
  for(const type of weapons)for(let level=1;level<=4;level++){
    startEncounter();state.mana=1e6;state.effects=[];state.projectiles=[];state.arcs=[];
    state.enemies.forEach(e=>{e.x=W*.6;e.hp=1e9;});
    weaponAttack(makeItem(type,level));
    const fx=state.effects[0];
    if(!fx){out.push({type,level,kind:'projectile'});continue;}
    const lead=fx.fly?fx.fly.delay+fx.fly.dur:0;
    out.push({type,level,kind:fx.kind,dur:+(fx.life-lead).toFixed(3),legend:!!legendFx[fx.kind]});
  }
  return out;
})()`);
const byType = {};
for (const r of rows) (byType[r.type] ||= []).push(r);
const lines = [];
for (const [type, list] of Object.entries(byType)) {
  const k = list[0].kind;
  if (k === 'projectile') { lines.push(`${type.padEnd(16)} projectile`); continue; }
  const frames = list[0].legend ? 12 : frameCounts[k] || 6;
  const ms = list.map(r => Math.round(r.dur * 1000 / frames));
  // Measure the real cel changes the renderer produces, sampled at 60fps.
  const real = list.map(r => run(`(()=>{const fx={kind:'${k}',level:${r.level},age:0,life:${r.dur}};let last=-1,times=[];for(let a=0;a<${r.dur};a+=1/60){fx.age=a;fx.life=${r.dur}-a;const f=${list[0].legend ? 'legendFrame(fx)' : `artFrame(a,${r.dur},Array(${frames}).fill(1))`};if(f!==last){times.push(a);last=f;}}return times.length>1?Math.round((times.at(-1)-times[0])/(times.length-1)*1000):0})()`));
  lines.push(`${type.padEnd(16)} ${k.padEnd(16)} ${frames}f  ms/cel L1-L4 rendered: ${real.join(' / ')}  (if stretched over the window: ${ms.join(' / ')})`);
}
console.log(lines.join('\n'));

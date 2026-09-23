'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {game}=require('../tests/helpers/game-harness');
const {STAGES}=require('../campaign');

// Same combat, inventory and loot code as the browser. No damage/HP cheats.
// A death is retried through the real RETRY button, like a player would.
function simulate({width=390,first=0,last=99,decisionSeconds=5,reactionSeconds=.25,upgrade=true,attempts=3}={}){
  const run=game();run(`W=${width};progress.cleared=STAGES.length`);
  // SIM_PATCH runs inside the game sandbox, for A/B experiments without editing the game.
  if(process.env.SIM_PATCH)run(process.env.SIM_PATCH);
  const rows=[];
  for(let index=first;index<=last;index++){
    run(`startStage(${index})`);
    const bag=run(`({power:PackCore.power(state.items,state.bagSize),kit:PackCore.power(PackCore.placeGear(currentStage().gear,state.bagSize),state.bagSize),
      armor:Math.max(0,...state.items.filter(i=>i.type==='armor').map(i=>i.level)),weapons:state.items.filter(i=>!TYPES[i.type].gear).length,
      rare:state.items.filter(i=>rarityRank(i.type)>=3).map(i=>i.type+i.level).join(' ')})`);
    let result,tries=0,totalSeconds=0,totalChests=0;
    do{
      if(tries)run(`$('start').onclick()`);
      tries++;
      result=run(`(()=>{
        let seconds=0,combat=0,chests=0,nextInput=0,peakEnemies=0;
        while(!['won','dead'].includes(state.mode)&&seconds<480){
          if(state.mode==='loot'){
            chests++;
            // Merges first, then missing gear; a full bag drops its weakest weapon to fit that gear.
            if(${upgrade}){
              const owned=type=>state.items.some(i=>i.type===type);
              const rank=item=>matching(item)?0:TYPES[item.type].gear&&!owned(item.type)?1:2;
              for(const item of [...state.loot].sort((a,b)=>rank(a)-rank(b))){
                const needed=TYPES[item.type].gear&&!owned(item.type);
                quickTake(item.id);
                for(let n=0;needed&&state.loot.includes(item)&&n<4;n++){
                  const weapons=state.items.filter(i=>!TYPES[i.type].gear);
                  if(weapons.length<=1)break;
                  const weak=weapons.sort((a,b)=>PackCore.damage(a)*PackCore.shots(a)-PackCore.damage(b)*PackCore.shots(b))[0];
                  state.items=state.items.filter(i=>i!==weak);
                  quickTake(item.id);
                }
              }
            }
            $('continue').onclick();
          }
          if(state.phase==='combat'){
            combat+=.04;
            if(seconds>=nextInput){
              // Like a player: the hardest-hitting press while mana lasts, the most efficient one when it runs low.
              const press=item=>attackDamage(item)*itemShots(item),frugal=state.mana<state.maxMana*.35;
              const value=item=>frugal?press(item)/Math.max(1,attackManaCost(item)):press(item);
              attackChoices().slice().sort((a,b)=>value(b)-value(a)).forEach(item=>manualAttack(item.id));
              nextInput=seconds+${reactionSeconds};
            }
          }
          peakEnemies=Math.max(peakEnemies,state.enemies.length);
          update(.04);seconds+=.04;
        }
        return {mode:state.mode,seconds,combat,chests,damage:state.damageTaken,hp:state.hp,wave:state.wave,kills:state.kills,peakEnemies,
          remaining:state.enemies.filter(e=>e.hp>0).map(e=>({kind:e.kind,hp:Math.round(e.hp)}))};
      })()`);
      totalSeconds+=result.seconds;totalChests+=result.chests;
    }while(result.mode!=='won'&&tries<attempts);
    rows.push({level:index+1,name:STAGES[index].name,...result,attempts:tries,bag,
      estimatedSeconds:Math.round((totalSeconds+totalChests*decisionSeconds+3*tries)*10)/10});
  }
  return {width,reactionSeconds,decisionSeconds,upgrade,attempts,levels:rows.length,wins:rows.filter(r=>r.mode==='won').length,
    firstTry:rows.filter(r=>r.mode==='won'&&r.attempts===1).length,
    simulationMinutes:Math.round(rows.reduce((s,r)=>s+r.seconds,0)/6)/10,
    estimatedMinutes:Math.round(rows.reduce((s,r)=>s+r.estimatedSeconds,0)/6)/10,rows};
}
if(require.main===module){
  const first=Number(process.env.FIRST_LEVEL||1)-1,last=Number(process.env.LAST_LEVEL||100)-1;
  const report=simulate({width:Number(process.env.SIM_WIDTH||390),first,last,upgrade:process.env.NO_UPGRADES!=='1',
    reactionSeconds:Number(process.env.REACTION_SECONDS||.25),attempts:Number(process.env.ATTEMPTS||3)});
  const file=path.join(__dirname,'../reports/campaign-balance.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,rows:undefined,failures:report.rows.filter(r=>r.mode!=='won').map(r=>({level:r.level,wave:r.wave,seconds:Math.round(r.seconds),remaining:r.remaining}))},null,2));
  process.exitCode=report.wins===report.levels?0:1;
}
module.exports={simulate};

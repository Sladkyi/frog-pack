'use strict';
const chestScenes = assetImage('chest-short-v2.png');
const closedChestSheet = assetImage('chest-closed-v3.png');
const CHEST_DURATION=1.95;
const DROP_CAP=3;
const TOY_POOL=['wand','bow','spear','bomb','storm','blade','scythe','hammer','orb','dagger','tome','shuriken'];
const GEAR_POOL=['armor','boots'];

// Rarity unlocks by level index; weights make each chest a gamble with a visible jackpot.
const RARITY_ORDER=['common','uncommon','rare','epic','legendary','mythic'];
const RARITY_GATE={common:0,uncommon:0,rare:1,epic:5,legendary:14,mythic:30};
const RARITY_WEIGHT={common:34,uncommon:30,rare:20,epic:10,legendary:4.5,mythic:2};
const THEME_WEIGHT=2.5;
// Each chest without an epic+ find makes the next one likelier; PITY_CAP guarantees it.
// The counter survives level changes, so short levels still reach the guarantee.
const PITY_STEP=.35,PITY_CAP=5;
let weaponTypes=null;
function allWeapons(){
  // A weapon without its own attack sheet must not reach a chest.
  return weaponTypes||(weaponTypes=Object.keys(TYPES).filter(type=>!TYPES[type].gear&&(typeof PackAttackFx==='undefined'||PackAttackFx.resolve(type)?.unique)));
}

function rarityRank(type){return Math.max(0,RARITY_ORDER.indexOf(TYPES[type]?.rarity||'common'));}
// mulberry32 on a per-run seed: retries reshuffle the chests, a fixed seed replays them.
function lootRandom(){
  let t=(state.lootSeed=((state.lootSeed>>>0)+0x6D2B79F5)>>>0);
  t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
}
function ownedTypes(){return new Set((state.items||[]).map(i=>i.type));}
function mergableWeapons(){return (state.items||[]).filter(i=>TYPES[i.type]&&!TYPES[i.type].gear&&i.level<4);}
function dropLevel(type){
  const existing=(state.items||[]).find(i=>i.type===type);
  if(existing)return Math.min(DROP_CAP,existing.level);
  // Plain new weapons arrive a tier lower, so a rare+ find is the one that changes the bag.
  const tier=currentStage().lootTier||1,plain=!TYPES[type].gear&&rarityRank(type)<2;
  return Math.min(DROP_CAP,Math.max(1,tier-(plain?1:0)));
}
function weightedPick(entries){
  const total=entries.reduce((s,[,w])=>s+w,0);
  let roll=lootRandom()*total;
  for(const [value,w] of entries){roll-=w;if(roll<0)return value;}
  return entries[entries.length-1]?.[0];
}
function unlockedWeapons(){
  const stage=currentStage(),index=state.stageIndex||0;
  return allWeapons().filter(type=>index>=RARITY_GATE[TYPES[type].rarity||'common']||(stage.lootPool||[]).includes(type));
}
function rollWeapon(avoid,forceEpic=false){
  const theme=new Set(currentStage().lootPool||[]),pity=state.lootPity||0;
  let pool=unlockedWeapons().filter(type=>!avoid.has(type));
  if(forceEpic&&pool.some(type=>rarityRank(type)>=3))pool=pool.filter(type=>rarityRank(type)>=3);
  if(!pool.length)pool=unlockedWeapons();
  return weightedPick(pool.map(type=>{
    const rank=rarityRank(type);
    return [type,RARITY_WEIGHT[TYPES[type].rarity||'common']*(theme.has(type)?THEME_WEIGHT:1)*(rank>=3?1+pity*PITY_STEP:1)];
  }));
}
function rollDrop(avoid,{allowGear=true,forceEpic=false}={}){
  const weapons=mergableWeapons().filter(i=>!avoid.has(i.type));
  const roll=lootRandom();
  if(!forceEpic&&roll<.3&&weapons.length){
    const target=weapons[Math.floor(lootRandom()*weapons.length)];
    return makeItem(target.type,Math.min(DROP_CAP,target.level));
  }
  if(!forceEpic&&allowGear&&roll>=.82){
    const gear=GEAR_POOL.filter(type=>!avoid.has(type))[Math.floor(lootRandom()*2)]||GEAR_POOL[0];
    if(!avoid.has(gear))return makeItem(gear,dropLevel(gear));
  }
  const type=rollWeapon(new Set([...avoid,...ownedTypes()]),forceEpic);
  return makeItem(type,dropLevel(type));
}
function chooseChestReward(stop){
  const weapons=mergableWeapons();
  // The very first chest of the game teaches merge by cloning a starter weapon.
  if(stop===1&&weapons.length){
    const starter=weapons[0];
    return makeItem(starter.type,Math.min(DROP_CAP,starter.level));
  }
  const epicOpen=(state.stageIndex||0)>=RARITY_GATE.epic;
  const reward=rollDrop(new Set(),{forceEpic:epicOpen&&(state.lootPity||0)>=PITY_CAP});
  state.lootPity=rarityRank(reward.type)>=3?0:(state.lootPity||0)+1;
  return reward;
}
function chooseChestLoot(stop,main){
 const first=main||chooseChestReward(stop);
 if(stop===1&&(state.stageIndex||0)===0)return [first,makeItem('bow',dropLevel('bow')),makeItem('armor',dropLevel('armor'))];
 const choices=[first],taken=new Set([first.type]);
 // A bag without armor always gets offered some: random loot must not strand a glass cannon.
 if(!ownedTypes().has('armor')&&!taken.has('armor')){choices.push(makeItem('armor',dropLevel('armor')));taken.add('armor');}
 while(choices.length<3){
  const item=rollDrop(taken,{allowGear:!choices.some(i=>TYPES[i.type].gear)});
  if(taken.has(item.type))break;
  taken.add(item.type);choices.push(item);
 }
 return choices;
}
function beginChest(){
  state.lastChestDistance=state.distance;
  state.phase='chest';state.chestAge=0;state.stopAge=0;state.handFlash=0;state.chestReward=chooseChestReward(state.stops+1);
  state.projectiles=[];state.effects=[];renderLoot();announce("WHAT'S INSIDE?");
}
// Six poses only: three entering, three returning. Chest corners, not cell edges,
// define registration so the generator's variable framing cannot resize the prop.
const CHEST_BOXES=[
 [228,352,244,145],[742,352,251,145],[1185,352,270,145],
 [214,824,244,132],[746,824,225,132],[1244,824,230,132]
];
const CHEST_CROPS=[[20,105,502,397],[565,195,482,307],[1165,177,359,325],[74,596,432,368],[520,594,499,370],[1024,598,500,366]];
// The frog's braking cels play first, so the scene never swaps in mid-stride.
const CHEST_ENTER=.24;
function chestFrame(){return celFrame(Math.max(0,state.chestAge-CHEST_ENTER),1.47,[.22,.22,.30,.23,.25,.25]);}
// The scene redraws the frog: it must match the sprite's size and stand where the sprite stands.
function chestHeroSize(){return 128*castScale();}
function chestLayout(){
 const heroSize=chestHeroSize();
 return {x:W*.27+heroSize*.1,y:groundY(),w:heroSize*.55,h:heroSize*.34};
}
function drawChestScene(frame,offset=0,propOnly=false){
 if(!chestScenes.complete||!chestScenes.naturalWidth)return;
 const box=CHEST_BOXES[frame],r=CHEST_CROPS[frame],target=chestLayout();
 const kx=target.w/box[2],ky=target.h/box[3];
 // Frame 2 contains only the chest and legs; the right-hand lid and front can
 // be drawn separately to keep one identical open chest outside the scene.
 if(propOnly){
   ctx.drawImage(chestScenes,box[0],box[1],box[2],box[3],target.x+offset,target.y-target.h,target.w,target.h);
   ctx.drawImage(chestScenes,1337,218,175,135,target.x+offset+(1337-box[0])*kx,target.y+(218-box[1]-box[3])*ky,175*kx,135*ky);
   return;
 }
 ctx.drawImage(chestScenes,...r,target.x+offset+(r[0]-box[0])*kx,target.y+(r[1]-box[1]-box[3])*ky,r[2]*kx,r[3]*ky);
}
function drawClosedChest(offset=0){
 if(!closedChestSheet.complete||!closedChestSheet.naturalWidth)return;
 const target=chestLayout(),kx=target.w/942,ky=target.h/446;
 ctx.drawImage(closedChestSheet,128,268,990,730,target.x+offset-12*kx,target.y-728*ky,990*kx,730*ky);
}
function renderWorldChest(){
 if(state.phase==='chest')return;
 // Opened chests stay anchored to the ground while the camera moves on.
 if(Number.isFinite(state.lastChestDistance)){
  const offset=(state.lastChestDistance-state.distance)*7;
  if(chestLayout().x+offset+chestLayout().w*1.4>0)drawChestScene(2,offset,true);
 }
  if(state.phase==='travel'){
   const remaining=state.nextLoot-state.distance;
   const spawnThreshold=Math.max(65,Math.ceil((W-chestLayout().x+100)/7));
   if(remaining<spawnThreshold)drawClosedChest(remaining*7);
  }
}
const CHEST_HANDS=[
 [300,410],[820,408],[1264,412],
 [292,868],[832,862],[1348,858]
];
// The find surfaces when the first "emerging" cel starts.
const CHEST_REVEAL=CHEST_ENTER+.74;
function chestRewardRank(){return state.chestReward?rarityRank(state.chestReward.type):0;}
function chestRewardColor(){return (PackCore.RARITIES[TYPES[state.chestReward?.type]?.rarity]||PackCore.RARITIES.common).color;}
// Suspense scales with the hidden find: ticks accelerate into the reveal, and rare+ reveals land with a hit.
function updateChestSuspense(prev,age){
 const rank=chestRewardRank();
 if(rank>=2){
  // The gap floor keeps the loop finite: .78 decay alone converges short of the reveal for mythics.
  for(let t=CHEST_ENTER+.08,gap=.2-rank*.015;t<CHEST_REVEAL-.03;t+=gap,gap=Math.max(.03,gap*.78)){
   if(prev<t&&age>=t)beep(560+rank*50+t*260,.03,'square',.012);
  }
 }
 if(prev<CHEST_REVEAL&&age>=CHEST_REVEAL){
  const target=chestLayout();
  burst(target.x+target.w/2,target.y-target.h,chestRewardColor(),8+rank*8,90+rank*25);
  if(rank>=3){
   state.hitstop=Math.max(state.hitstop||0,.08+rank*.02);
   state.flash=Math.max(state.flash||0,.18+rank*.05);state.shake=Math.max(state.shake||0,2+rank*1.5);
   beep(660+rank*110,.18,'triangle',.028);
  }
 }
}
// Light leaks out of the chest while the frog digs; rarer finds shine harder and pulse faster.
function drawChestGlow(age){
 const reward=state.chestReward;if(!reward||typeof ctx.createRadialGradient!=='function')return;
 const rank=rarityRank(reward.type);if(rank<2)return;
 const color=chestRewardColor();
 const target=chestLayout(),cx=target.x+target.w/2,cy=target.y-target.h*.6;
 const grow=Math.min(1,age/CHEST_DURATION),pulse=.7+.3*Math.sin(age*(8+rank*3));
 const radius=target.w*(1.1+rank*.35)*(.6+grow*.6);
 const g=ctx.createRadialGradient(cx,cy,0,cx,cy,radius);
 g.addColorStop(0,color);g.addColorStop(1,color+'00');
 ctx.save();ctx.globalAlpha=Math.min(.85,(.25+rank*.12)*grow*pulse);ctx.globalCompositeOperation='lighter';
 ctx.fillStyle=g;ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);ctx.restore();
 if(rank<3||age<CHEST_ENTER)return;
 // Epic+ finds throw a fan of rays out of the lid before anyone has seen the item.
 const rays=3+rank,len=radius*1.7,build=Math.min(1,(age-CHEST_ENTER)/(CHEST_REVEAL-CHEST_ENTER));
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.32*build*pulse;ctx.fillStyle=color;
 ctx.beginPath();
 for(let i=0;i<rays;i++){
  const a=-Math.PI/2+(i/(rays-1)-.5)*1.9+Math.sin(age*1.3+i)*.08,w=.06+.03*(i%2);
  ctx.moveTo(cx,cy-target.h*.3);
  ctx.lineTo(cx+Math.cos(a-w)*len,cy+Math.sin(a-w)*len);
  ctx.lineTo(cx+Math.cos(a+w)*len,cy+Math.sin(a+w)*len);
  ctx.closePath();
 }
 ctx.fill();ctx.restore();
}
function renderRummage(){
 const age=state.chestAge;
 if(age>=CHEST_DURATION){lootStop();return;}
 drawChestGlow(age);
 if(age<CHEST_ENTER){drawClosedChest();renderFrogHero();return;}
 const frame=chestFrame();
 // Each dig cel is held ~0.25s; a fast shake keeps the hold alive, and it builds harder for rarer finds.
 const rank=chestRewardRank(),build=Math.min(1,(age-CHEST_ENTER)/(CHEST_REVEAL-CHEST_ENTER));
 const dig=frame===1||frame===2?Math.sin(age*(48+rank*6))*(1+rank*.45)*(.6+.4*build)*1.5*castScale():0;
 drawChestScene(frame,dig);
 if(frame<3||!state.chestReward)return;
 const box=CHEST_BOXES[frame],target=chestLayout(),kx=target.w/box[2],ky=target.h/box[3];
 const [hx,hy]=CHEST_HANDS[frame];
 const hand={x:target.x+(hx-box[0])*kx,y:target.y+(hy-box[1]-box[3])*ky};
 drawGrippedItem(state.chestReward,hand,chestHeroSize()*.88);
 ctx.drawImage(chestScenes,hx-12,hy-13,24,26,hand.x-12*kx,hand.y-13*ky,24*kx,26*ky);
}

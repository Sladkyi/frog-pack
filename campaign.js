(function(root){
'use strict';
// Authored content is shared by the browser and the headless balance runner.
const LEGACY_STAGES=[
  {name:'Twilight Forest',firstWave:1,lastWave:4,biome:0,bag:3,gear:[['axe',1],['shuriken',1]]},
  {name:'Mushroom Thicket',firstWave:5,lastWave:7,biome:1,bag:3,gear:[['axe',2],['shuriken',2],['armor',1]]},
  {name:'Ancient Grove',firstWave:8,lastWave:10,biome:2,bag:4,gear:[['axe',3],['shuriken',2],['bow',2],['boots',1]]},
  {name:'Crystal Rift',firstWave:11,lastWave:14,biome:3,bag:4,gear:[['axe',3],['shuriken',3],['spear',2],['armor',2],['boots',2]]},
  {name:'Ashen Wastes',firstWave:15,lastWave:17,biome:4,bag:5,gear:[['axe',3],['shuriken',3],['bow',3],['armor',2],['boots',2]]},
  {name:'Frost Peaks',firstWave:18,lastWave:21,biome:5,bag:5,gear:[['axe',3],['shuriken',3],['bow',3],['spear',3],['armor',3],['boots',3]]}
];
const EXTRA_BOSSES={4:'spiderQueen',10:'swampLord',17:'crystalGolem'};
const ENEMY_UNLOCKS={2:['beetle'],3:['mushroom','boar'],4:['spider'],5:['toad'],8:['moth'],9:['stump'],11:['bat'],12:['mandrake'],15:['snail'],16:['scorpion']};
const BOSS_HEALTH={4:350,7:850,10:1400,14:2200,17:3200,21:4600};
const LEGACY_WAVES=Array.from({length:21},(_,index)=>{
  const number=index+1,difficultyBand=Math.floor(index/7),boss=number%7===0||!!EXTRA_BOSSES[number];
  return {number,boss,bossKind:EXTRA_BOSSES[number]||(number===14?'mushroomKing':number===21?'ancientTree':null),
    count:boss?5+difficultyBand:Math.min(10,3+Math.floor(number/3)),
    health:Math.round(32*Math.pow(1.15,index)),bossHealth:BOSS_HEALTH[number]||0,
    damageScale:1+index*.04,speedScale:1+index*.01,
    elites:number<5?0:number<11?1:number<18?2:3,
    pool:Object.entries(ENEMY_UNLOCKS).filter(([unlock])=>Number(unlock)<=number).flatMap(([,kinds])=>kinds)};
});
const WORLDS=[
  {name:'Forest Paths',hook:'They look cute',biome:0,pool:['beetle','mushroom','boar','spider','toad'],boss:'spiderQueen',tint:null},
  {name:'Under the Roots',hook:'It gets dark',biome:1,pool:['spider','mushroom','stump','broodling'],boss:'broodMother',tint:'#434522'},
  {name:'Night Flight',hook:'They come from above',biome:2,pool:['moth','bat','boar','windMoth'],boss:'nightWing',tint:'#25244b'},
  {name:'Shards of Light',hook:'Armor lies',biome:3,pool:['beetle','snail','shardBeetle','scorpion'],boss:'crystalGolem',tint:null,hp:.93},
  {name:'Ash Trail',hook:'Fire eats fire',biome:4,pool:['boar','scorpion','emberBoar','bat'],boss:'ashLord',tint:null,hp:.9},
  {name:'White Silence',hook:'Ice does nothing',biome:5,pool:['moth','snail','frostMoth','stump'],boss:'frostWarden',tint:'#80bed0'},
  {name:'Living Swamp',hook:'They heal',biome:1,pool:['toad','mandrake','healer','mushroom'],boss:'swampLord',tint:'#276b40'},
  {name:'Royal Swarm',hook:'Too many',biome:2,pool:['broodling','spider','warDrummer','windMoth'],boss:'broodMother',tint:'#77532c'},
  {name:'Eclipse',hook:'Wrong element dies',biome:3,pool:['shardBeetle','emberBoar','healer','frostMoth','warDrummer'],boss:'eclipseKeeper',tint:'#3b205c',hp:.85},
  {name:'Heart of the World',hook:'You will not',biome:0,pool:['warDrummer','broodling','healer','shardBeetle','emberBoar','windMoth'],boss:'worldHeart',tint:'#665437',hp:.92}
];
const NAMES=[
 ['Twilight Forest','Mushroom Thicket','Ancient Grove','Crystal Rift','Ashen Wastes','Frost Peaks','Overgrown Ford','Boar Path','Old Watch','Dungeon Gate'],
 ['Hollow Roots','Spider Well','Spore Brook','Lower Tier','Cocoon Wall','Crunchy Moss','Oak Nest','Dark Undergrowth','Whisper of the Depths','Brood Mother'],
 ['First Flight','Moon Glade','Night Hunters','Wind in the Branches','Winged Ambush','Owl Ledge','Falling Stars','Cliff Nest','Black Flock','Lord of Night'],
 ['Glass Path','Sharp Edges','Carapace Line','Mirror Bridge','Shard Cave','Ringing Pass','Stone Watch','Glitter Swarm','Final Seal','Crystal Throne'],
 ['Hot Ash','Smoldering Forest','Fire Dash','Coal Ravine','Amber Hunt','Red Sunset','Smoke Outpost','Lava Ford','Burning Circle','Ash Lord'],
 ['First Snow','Ice Wings','White Pass','Frozen Brook','Frost Watch','Crystal Frost','Snow Blind','North Wind','Permafrost','Frost Warden'],
 ['Green Backwater','Roots Underwater','Healing Spores','Sinking Shore','Mandrake Song','Mossy Isle','Living Palisade','Fog Siege','Swamp Circle','Bog Master'],
 ['Hum in the Grass','Swarm Drums','Amber Cocoons','Creeping Tide','Alarm Chime','Winged Convoy','Queen Nest','Endless Swarm','Royal Guard','Golden Queen'],
 ['Fading Light','Black Crystal','Twilight Guards','Moonfire','Shadows in Rank','Mirror of Dark','Last Ray','Moon Siege','Endless Night','Eclipse Keeper'],
 ['Return to the Forest','Ancient Drums','Memory of Roots','Trial of the Swarm','Trial of Flame','Trial of Ice','Three Guardians','Road to the Heart','Final Siege','Heart of the World']
];
// Ten encounter families change formation, pacing and target priorities.
const PATTERNS=[
 {id:'scouts',size:4,packs:3,gap:4.8,hp:1,order:[0,1,0,2]},
 {id:'swarm',size:7,packs:3,gap:4.2,hp:.6,order:[1,0,1,3]},
 {id:'armored',size:4,packs:3,gap:5.2,hp:1.12,order:[2,0,2,1]},
 {id:'rush',size:5,packs:3,gap:4.5,hp:.82,order:[3,1,3,0],speed:1.12},
 {id:'convoy',size:4,packs:4,gap:4.4,hp:.94,order:[0,2,3,1]},
 {id:'crossfire',size:5,packs:3,gap:5,hp:.9,order:[1,3,0,2]},
 {id:'siege',size:3,packs:4,gap:4.8,hp:1.15,order:[2,2,1,0]},
 {id:'brood',size:6,packs:3,gap:4.6,hp:.72,order:[3,0,1,3]},
 {id:'gauntlet',size:4,packs:4,gap:4.6,hp:1.04,order:[0,3,2,1]},
 {id:'royal',size:5,packs:4,gap:4.8,hp:1,order:[3,2,1,0]}
];
const ARMS=['axe','bow','spear','wand','blade','storm','bomb','scythe','hammer','tome'];
const SUPPORT=['bow','spear','storm','bomb','wand','blade','dagger','orb','scythe','bow'];
// Compensates the starter kit's main weapon; storm, orb, dagger and hammer lost their old handicaps.
const WEAPON_HEALTH={axe:1,bow:.85,spear:1,wand:1.08,blade:.88,storm:1,bomb:1.08,scythe:1,hammer:1.25,orb:1.1,dagger:1,tome:1.05};
const HP_LATE=6,HP_WORLD=30,BOSS_LATE=30,BOSS_WORLD=100,DMG_LATE=.002,DMG_WORLD=.015;
const STAGES=LEGACY_STAGES.map((s,i)=>({...s,id:i+1,world:0,legacy:true,waveCount:s.lastWave-s.firstWave+1}));
const LEVELS=LEGACY_WAVES.map(w=>({...w,legacy:true,stageIndex:STAGES.findIndex(s=>w.number>=s.firstWave&&w.number<=s.lastWave)}));
for(let index=6;index<100;index++){
  const worldIndex=Math.floor(index/10),slot=index%10,world=WORLDS[worldIndex];
  const waveCount=index<20?5:index<70?6:7;
  const main=ARMS[(slot+worldIndex)%ARMS.length],support=SUPPORT[(slot+worldIndex)%SUPPORT.length];
  const firstWave=LEVELS.length+1;
  // Early procedural stages used to drop below late-legacy HP (~500) while handing out lv3 weapons —
  // that made level 7+ a one-shot stroll. Keep scaling above the Frost Peaks floor.
  const weaponTier=3;
  const armorTier=index<40?2:3;
  const bag=index<20?5:index<50?6:7;
  // Only the best copy of a type attacks, so kit growth adds new types, never duplicates.
  const extra=[],owned=new Set([main,support]);
  const addArm=(start,tier)=>{for(let k=0;k<ARMS.length;k++){const type=ARMS[(start+k)%ARMS.length];if(!owned.has(type)){owned.add(type);extra.push([type,tier]);return;}}};
  if(index>=20)addArm(slot+worldIndex+4,3);
  if(index>=35)addArm(slot+worldIndex+7,3);
  if(index>=70&&!owned.has('orb')){owned.add('orb');extra.push(['orb',3]);}
  const stage={id:index+1,name:NAMES[worldIndex][slot],world:worldIndex,biome:world.biome,tint:world.tint,
    firstWave,lastWave:firstWave+waveCount-1,waveCount,bag,
    gear:[[main,index>=50?4:weaponTier],[support,weaponTier],['armor',armorTier],['boots',armorTier],...extra],
    lootPool:[main,support,'armor','boots',ARMS[(slot+3)%10],'orb','dagger'],lootTier:3};
  STAGES.push(stage);
  for(let local=0;local<waveCount;local++){
    const pattern=PATTERNS[(slot+local*3+worldIndex)%PATTERNS.length];
    const boss=local===waveCount-1||(index===99&&local>=waveCount-3);
    // Keep trash above a single carried lv4 hit, but leave starter t3 kits viable.
    const earlyEase=index<20?(20-index)/20:0;
    // Player DPS is mana-bound and nearly flat, so late growth must stay gentle.
    const late=Math.max(0,index-20),ramp=Math.min(index,20);
    const health=Math.round((560+ramp*38+late*HP_LATE+slot*10+local*24+worldIndex*HP_WORLD-earlyEase*560)*pattern.hp*WEAPON_HEALTH[main]*(world.hp||1)*(local===0?.9:1));
    const roster=[...world.pool];
    if(worldIndex>0&&local%2===1)roster.push(WORLDS[worldIndex-1].pool[(slot+local)%WORLDS[worldIndex-1].pool.length]);
    const packs=boss?3:pattern.packs,entries=[];
    for(let pack=0;pack<packs;pack++){
      const size=boss&&pack===packs-1?3:pattern.size;
      for(let member=0;member<size;member++){
        const isBoss=boss&&pack===packs-1&&member===size-1;
        entries.push({at:Math.round(pack*pattern.gap*100)/100,lane:member,
          kind:isBoss?(index===99?[world.boss,'crystalGolem','ashLord'][waveCount-1-local]:world.boss):roster[(pattern.order[member%4]+pack+local+slot)%roster.length],
          boss:isBoss,elite:!isBoss&&worldIndex>=2&&member===0&&pack%2===0});
      }
    }
    LEVELS.push({number:LEVELS.length+1,stageIndex:index,pattern:pattern.id,boss,bossKind:entries.find(e=>e.boss)?.kind,
      count:entries.length,health,bossHealth:Math.round((4200+ramp*120+late*BOSS_LATE+worldIndex*BOSS_WORLD+slot*60-earlyEase*1600)*(slot===9?1.14:1)*(index>=30?.85:1)*(index===99?.6:1)*(world.hp||1)*WEAPON_HEALTH[main]),
      damageScale:1.4+ramp*.02+late*DMG_LATE+worldIndex*DMG_WORLD,speedScale:(.9+worldIndex*.012+index*.002)*(pattern.speed||1),
      elites:entries.filter(e=>e.elite).length,pool:roster,entries});
  }
}
const LAST_WAVE=LEVELS.length;
const LEVEL_HOOKS=['Too easy?','They get bigger','Sort the bag','Wrong weapon dies','No room left','Merge or lose','This one hurts','You will retry','The bag is the boss','Don\'t blink'];
function stageHook(index){
  if(index===2)return 'Fire won\'t work';
  if(index===3)return 'Pick the element';
  if(index===99)return 'You won\'t';
  return LEVEL_HOOKS[index%LEVEL_HOOKS.length];
}
const api={STAGES,LEVELS,LAST_WAVE,WORLDS,PATTERNS,ENEMY_UNLOCKS,stageHook};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PackCampaign=api;
})(typeof window==='undefined'?globalThis:window);

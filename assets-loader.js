'use strict';
const managedAssets=[];
function assetPath(name){return ASSET_URLS[name]||`assets/${name}`;}
function assetImage(name,eager=false){
 const img=new Image();img.assetName=name;img.assetStatus='idle';
 img.decoding='async';managedAssets.push(img);
 img.onload=()=>{img.assetStatus='ready';};
 img.onerror=()=>{
  if(!img.originalAttempt){img.originalAttempt=true;img.src=`assets/${name}`;}
  else img.assetStatus='error';
 };
 if(eager)requestAsset(img);return img;
}
function requestAsset(img){
 if(img.assetStatus==='idle'){img.assetStatus='loading';img.src=assetPath(img.assetName);}
 return img.complete&&img.naturalWidth>0;
}
function sceneAssets(){
 const list=[atlas,forest,evolutionArt,frogSheets[frogArmorLevel()]];
 const items=[...state.items,...state.loot];if(state.chestReward)items.push(state.chestReward);
  const effects={axe:weaponFrames,shuriken:shurikenFx,blade:weaponFrames,storm:weaponFrames,wand:beamFrames,bow:seedBolts,spear:spearThrust,bomb:newAttackFrames,hammer:hammerFx,scythe:scytheFx,orb:orbFx,dagger:daggerFx,tome:tomeFx};
  for(const item of items){
  if(['bow','spear','bomb','armor','boots'].includes(item.type))list.push(equipmentArt);
  if(GLYPH_WEAPONS.has(item.type))list.push(glyphWeaponsArt);
  if(effects[item.type])list.push(effects[item.type]);
  if(item.type==='scythe')list.push(scythe12Fx);
  if(item.type==='thunder_halberd')list.push(thunderHalberdFx);
  if(typeof legendFx!=='undefined'){
    if(legendFx[item.type])list.push(legendFx[item.type]);
    const profile=typeof PackAttackFx!=='undefined'?PackAttackFx.resolve(item.type):null;
    if(profile?.effectKind&&legendFx[profile.effectKind])list.push(legendFx[profile.effectKind]);
  }
 }
 const enemies=[...state.enemies,...(state.pendingEnemies||[])];
 if(enemies.some(e=>ENEMY_KINDS[e.kind]?.extra))list.push(extraEnemies);
 if(enemies.some(e=>e.kind&&!ENEMY_KINDS[e.kind]?.extra))list.push(enemyAtlas);
 if(['victory','travel','depart'].includes(state.phase))list.push(closedChestSheet,chestScenes);
 if(['chest','loot'].includes(state.phase))list.push(chestScenes,closedChestSheet);
 if(typeof currentBiomeAssets==='function')for(const bg of currentBiomeAssets())list.push(bg);
 return [...new Set(list)];
}
function warmGameAssets(){
 const images=sceneAssets();let ready=true;
 for(const img of images)if(!requestAsset(img))ready=false;
 state.loadingAssets=!ready;
 state.assetError=images.some(img=>img.assetStatus==='error');
 return ready;
}

'use strict';
const frogSheets=Array.from({length:5},(_,level)=>{return assetImage(`frog-armor-${level}.png`,level===0);});
function frogArmorLevel(){return Math.max(0,...state.items.filter(i=>i.type==='armor').map(i=>i.level));}
function frogFrame(){
  if(state.phase==='chest')return state.chestAge<.24?16+Math.min(3,Math.floor(state.chestAge/.06)):20;
  if(state.phase==='travel'||state.phase==='depart')return celFrame(state.runTime%.52,.52,[.09,.04,.075,.055,.09,.04,.075,.055]);
  if(state.phase==='combat'&&state.stopAge<STOP_DURATION&&!state.handFlash)return 16+Math.min(3,Math.floor(state.stopAge/STOP_DURATION*4));
  if(state.phase==='loot'&&state.stopAge<STOP_DURATION){const frame=stopCel();return frame<4?16+frame:20;}
  if(state.phase==='combat'&&state.handFlash>0)return 8+heroCel();
  return 20+celFrame((state.poseTime||0)%2.4,2.4,[.9,.65,.12,.73]);
}
// Normalized fist anchors shared by every armor sheet, whose poses are identical.
const FROG_HANDS=[
  [245,159],[222,185],[215,167],[220,138],
  [219,165],[198,187],[208,166],[226,134],
  [228,132],[84,117],[72,79],[224,127],
  [252,124],[106,98],[211,153],[213,142],
  [231,134],[99,171],[193,154],[211,131],
  [216,145],[215,145],[207,143],[216,145]
];
// Squash before the throw, stretch on release, recoil and settle: weight on top of the attack cels.
function frogAttackPose(){
  if(state.phase!=='combat'||!(state.handFlash>0))return null;
  const t=.78-state.handFlash,ease=k=>1-(1-k)**3;
  let sy=1;
  if(t<.06)sy=1-.08*(t/.06);
  else if(t<.16)sy=.92+.16*ease((t-.06)/.1);
  else if(t<.4)sy=1.08-.08*ease((t-.16)/.24);
  const recoil=t>=.06&&t<.3?-Math.sin(Math.PI*(t-.06)/.24)*4:0;
  return {sx:1+(1-sy)*.6,sy,dx:recoil*castScale()};
}
function renderFrogHero(){
  let level=frogArmorLevel(),sheet=frogSheets[level];
  if(!sheet.complete||!sheet.naturalWidth){level=0;sheet=frogSheets[0];}
  if(!sheet.complete||!sheet.naturalWidth)return false;
  const frame=frogFrame(),sw=sheet.naturalWidth/4,sh=sheet.naturalHeight/6;
  const sx=(frame%4)*sw,sy=Math.floor(frame/4)*sh;
  const [rx,ry,rw,rh]=FROG_REGIONS[level][frame];
  const size=128*castScale(),ground=groundY(),left=W*.27-size*.58;
  const unit=size/256;
  // Keep airborne poses above the ground, but align contact frames in both half-cycles.
  const baseline=frame<4?249:frame<8?243:ry+rh-2-sy;
  const top=ground-baseline*unit;
  ellipse(W*.27,ground+3,size*.24,3.5,'#10251d55');
  const pose=frogAttackPose();
  ctx.save();
  if(pose&&typeof ctx.scale==='function'){ctx.translate(W*.27+pose.dx,ground);ctx.scale(pose.sx,pose.sy);ctx.translate(-W*.27,-ground);}
  ctx.drawImage(sheet,rx,ry,rw,rh,left+(rx-sx)*unit,top+(ry-sy)*unit,rw*unit,rh*unit);
  const [hx,hy]=FROG_HANDS[frame];
  const hand={x:left+hx*unit,y:top+hy*unit};
  if(state.phase==='chest'&&state.chestAge>1.71&&state.chestReward)drawGrippedItem(state.chestReward,hand,size*.88);
  else drawHeldWeapons(size*.88,ground,hand);
  // Fingers overlap the grip; sample only this cel, including when the hand reaches its edge.
  const px=hx-9,py=hy-10;
  ctx.drawImage(sheet,sx+px*sw/256,sy+py*sh/256,18*sw/256,20*sh/256,left+px*unit,top+py*unit,18*unit,20*unit);
  ctx.restore();
  return true;
}

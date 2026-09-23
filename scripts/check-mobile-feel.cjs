const fs=require('node:fs');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],results=[];
 for(const [width,height] of [[360,640],[375,667],[430,932],[1280,800]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700});
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/');
  await p.waitForFunction(()=>typeof state!=='undefined'&&typeof startEncounter==='function');
  await p.evaluate(async()=>{while(!warmGameAssets())await new Promise(r=>setTimeout(r,25));window.requestAnimationFrame=()=>0;state.mode='paused';$('overlay').classList.add('hidden');$('overlay').classList.remove('is-menu');$('game-layout').inert=false;});
  const phases=[];
  for(const bagSize of [3,5,7]){
   await p.evaluate(n=>{state.bagSize=n;state.items=Object.keys(TYPES).filter(t=>!TYPES[t].gear).slice(0,n===7?9:4).map((t,i)=>({...makeItem(t,2),x:i%n,y:Math.floor(i/n)}));renderInventory();updateUI();},bagSize);
   await p.waitForTimeout(80);
   for(const phase of ['combat','loot']){
    await p.evaluate(phase=>{state.mode=phase==='loot'?'loot':'running';state.phase=phase;state.loot=phase==='loot'?[makeItem('axe'),makeItem('wand'),makeItem('armor')]:[];renderLoot();updateUI();},phase);
    await p.waitForTimeout(80);
    phases.push(await p.evaluate(({bagSize,phase})=>{
     const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}};
     return {bagSize,phase,canvas:rect('game'),inventory:rect('inventory'),controls:rect('encounter-controls'),continue:rect('continue'),buttons:[...document.querySelectorAll('.attack-button')].map(b=>b.getBoundingClientRect().width),scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
    },{bagSize,phase}));
   }
  }
  // Stable single-cast samples of the chest handover, with the same scene size.
  await p.evaluate(async()=>{state.bagSize=3;state.items=[makeItem('axe')];state.mode='running';state.phase='travel';state.nextLoot=state.distance;beginChest();renderInventory();updateUI();while(!warmGameAssets())await new Promise(r=>setTimeout(r,25));state.mode='paused';});
  await p.waitForTimeout(100);
  for(const t of [.23,.25,.7,1.52,1.74,1.94]){
   await p.evaluate(t=>{state.phase='chest';state.chestAge=t;render()},t);
   await p.locator('#game').screenshot({path:`reports/chest-${width}-${t}.png`});
  }
  await p.evaluate(()=>{lootStop();render()});
  await p.waitForTimeout(450);
  await p.screenshot({path:`reports/mobile-${width}.png`});
  results.push({width,height,phases});await p.close();
 }
 await browser.close();fs.writeFileSync('reports/mobile-feel-audit.json',JSON.stringify({errors,results},null,2));
 console.log(JSON.stringify({errors,layouts:results.flatMap(r=>r.phases.map(p=>({width:r.width,bag:p.bagSize,phase:p.phase,stage:Math.round(p.canvas.h),button:Math.round(Math.min(...p.buttons)),bottom:Math.round(p.controls.bottom),overflow:p.scrollWidth>p.viewport})))},null,2));
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});

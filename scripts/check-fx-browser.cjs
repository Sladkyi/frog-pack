const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[],errors=[];
 for(const [width,height] of [[390,340],[850,348]]){
  const p=await browser.newPage({viewport:{width,height:900}});
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await p.goto('http://127.0.0.1:4173/fx-demo.html');
  await p.waitForFunction(()=>window.fxLab);
  await p.evaluate(h=>{document.querySelector('.stage').style.height=h+'px';document.querySelector('.stage').style.minHeight='0';resize();fxLab.stop()},height);
  const ids=await p.evaluate(()=>fxLab.ids);
  for(const type of ids){
   for(const level of [1,4]){
    await p.evaluate(async({type,level})=>{await fxLab.arm(type,level,3);fxLab.stop();},{type,level});
    const item={width,type,level,frames:[]};
    for(const t of [.12,.32,.55,.86,1.3]){
      await p.evaluate(t=>fxLab.seek(t),t);
      item.frames.push(await p.evaluate(()=>({t:fxLab.snapshot().age,effects:state.effects.length,damage:state.enemies.map(e=>1e9-e.hp),bad:state.effects.some(f=>!Number.isFinite(f.x)||!Number.isFinite(f.age))})));
    }
    if(level===4){await p.evaluate(()=>fxLab.seek(.55));await p.locator('#game').screenshot({path:`reports/fx-${width}-${type}.png`});}
    results.push(item);
   }
  }
  await p.close();
 }
 await browser.close();
 fs.writeFileSync('reports/fx-browser-audit.json',JSON.stringify({errors,results},null,2));
 const bad=results.filter(r=>r.frames.some(f=>f.bad));
 console.log(JSON.stringify({casts:results.length,weapons:new Set(results.map(r=>r.type)).size,errors,bad,nonDamaging:results.filter(r=>!r.frames.some(f=>f.damage.some(d=>d>0))).map(r=>[r.type,r.level,r.width])},null,2));
 if(errors.length||bad.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});

const fs=require('node:fs');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const p=await b.newPage({viewport:{width:360,height:760},isMobile:true,hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173/fx-demo.html');await p.waitForFunction(()=>window.fxLab);
 await p.evaluate(()=>{document.querySelector('.stage').style.cssText='height:205px;min-height:205px';resize();fxLab.stop();document.getElementById('fx-feedback').checked=false;document.getElementById('fx-feedback').onchange({target:{checked:false}})});
 const types=['dragon_pike','clockwork_trap','tempest_tome','astral_mirror','moon_glaive','chaos_flail','wand','starfall_shard','eclipse_censer'];
 for(const type of types){
  await p.evaluate(async type=>{await fxLab.arm(type,4,6);fxLab.stop()},type);
  for(const t of [.07,.17,.28,.38,.56,.8]){
   await p.evaluate(t=>fxLab.seek(t),t);
   await p.locator('#game').screenshot({path:`reports/focus-${type}-${t}.png`});
  }
 }
 await p.screenshot({path:'reports/fx-lab-mobile.png',fullPage:true});await b.close();
 fs.writeFileSync('reports/fx-focus-audit.json',JSON.stringify({errors,weapons:types.length,shots:types.length*6,width:360,stageHeight:205,targets:6},null,2));console.log({errors,shots:types.length*6});
})().catch(e=>{console.error(e);process.exitCode=1});

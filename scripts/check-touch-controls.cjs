const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const p=await b.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});
 await p.goto('http://127.0.0.1:4173/');await p.waitForFunction(()=>typeof state!=='undefined');
 await p.evaluate(async()=>{window.requestAnimationFrame=()=>0;state.mode='paused';while(!warmGameAssets())await new Promise(r=>setTimeout(r,20));$('overlay').classList.add('hidden');$('overlay').classList.remove('is-menu');});
 await p.waitForTimeout(60);
 const before=await p.evaluate(async()=>{state.items=[makeItem('axe',1)];startEncounter();state.enemies.forEach(e=>{e.hp=e.maxHp=1e6;e.x=W*.65;e.speed=0});state.mana=state.maxMana=100;state.attackLock=0;while(!warmGameAssets())await new Promise(r=>setTimeout(r,20));renderInventory();renderLoot();updateUI();return {mana:state.mana,cost:attackManaCost(state.items[0])}});
 await p.locator('.attack-button').tap();
 const after=await p.evaluate(()=>({mana:state.mana,shots:state.projectiles.length,disabled:$('attack-bar').attackButtons[0].button.disabled}));
 assert.equal(after.mana,before.mana-before.cost);assert.ok(after.shots>0);assert.equal(after.disabled,true);
 // A drag through a long weapon row must scroll without casting.
 await p.evaluate(async()=>{state.items=Object.keys(TYPES).filter(t=>!TYPES[t].gear).slice(0,9).map(t=>makeItem(t));state.mana=state.maxMana=10000;state.attackLock=0;state.cooldowns={};while(!warmGameAssets())await new Promise(r=>setTimeout(r,20));renderInventory();updateUI()});
 const mana=await p.evaluate(()=>state.mana),bar=await p.locator('#attack-bar').boundingBox();
 const cdp=await p.context().newCDPSession(p),y=bar.y+bar.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bar.x+bar.width-25,y}]});
 for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:bar.x+bar.width-25-i*30,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const scroll=await p.evaluate(()=>({mana:state.mana,left:$('attack-bar').scrollLeft}));
 assert.equal(scroll.mana,mana);assert.ok(scroll.left>0);
 fs.writeFileSync('reports/touch-controls-audit.json',JSON.stringify({before,after,scroll},null,2));await b.close();console.log('touch press: one cast; horizontal swipe: scrolls, no cast');
})().catch(e=>{console.error(e);process.exitCode=1});

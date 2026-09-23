const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
// GAME_ROOT points the sandbox at another build (e.g. dist/) for before/after balance runs.
const root=process.env.GAME_ROOT?path.resolve(process.env.GAME_ROOT):path.join(__dirname,'../..');
function game(realLoading=false, storage=new Map()) {
  const elements = new Map();
  const element = () => {
    const classes = new Set();
    const el={ style: { setProperty(k,v) { this[k] = v; } }, children: [], classList: { add(c) { classes.add(c); }, remove(c) { classes.delete(c); }, contains(c) { return classes.has(c); }, toggle(c,on) { on ? classes.add(c) : classes.delete(c); } }, append(el) { this.children.push(el); }, remove() { this.removed = true; }, attributes:{}, setAttribute(k,v) {this.attributes[k]=String(v);}, getAttribute(k){return this.attributes[k];}, setPointerCapture() {}, getBoundingClientRect() { return this.rect || { width: 850, height: 348 }; }, getContext: () => ({ setTransform() {} }) };
    Object.defineProperty(el,'innerHTML',{get(){return this.html||'';},set(value){this.html=value;this.children=[];}});
    return el;
  };
  let seed = 7;
  const math = Object.create(Math); math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const sandbox = { console, Math: math, Image: class { complete = false; }, setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame() {}, ResizeObserver: class { observe() {} }, localStorage: { getItem: key => storage.get(key) ?? null, setItem(key,value) { storage.set(key,value); } }, document: { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element, addEventListener() {}, activeElement: { tagName: 'BODY' } }, window: { addEventListener() {}, devicePixelRatio: 1 } };
  const context = vm.createContext(sandbox);
  sandbox.document.body = element(); sandbox.getComputedStyle = () => ({ gap: '4px' });
  for(const f of ['assets-manifest.js','assets-loader.js'])vm.runInContext(fs.readFileSync(path.join(root,f), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'core.js'), 'utf8'), context);
  sandbox.PackCore = sandbox.window.PackCore;
  vm.runInContext(fs.readFileSync(path.join(root, 'attack-fx.js'), 'utf8'), context);
  sandbox.PackAttackFx = sandbox.window.PackAttackFx;
  vm.runInContext(fs.readFileSync(path.join(root, 'campaign.js'), 'utf8'), context);
  sandbox.PackCampaign = sandbox.window.PackCampaign;
  vm.runInContext(fs.readFileSync(path.join(root, 'combat.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'frog-regions.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'frog.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'chest.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), context);
  if(!realLoading)vm.runInContext('warmGameAssets=()=>{state.loadingAssets=false;return true}', context);
  return source => vm.runInContext(source, context);
}
module.exports={game};

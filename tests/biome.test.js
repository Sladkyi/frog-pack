const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function createGameContext() {
  const elements = new Map();
  const element = () => {
    const classes = new Set();
    return {
      style: { setProperty(k,v) { this[k] = v; } },
      children: [],
      classList: {
        add(c) { classes.add(c); },
        remove(c) { classes.delete(c); },
        contains(c) { return classes.has(c); },
        toggle(c,on) { on ? classes.add(c) : classes.delete(c); }
      },
      append(el) { this.children.push(el); },
      remove() { this.removed = true; },
      setAttribute() {},
      setPointerCapture() {},
      getBoundingClientRect() { return { width: 850, height: 348 }; },
      getContext: () => ({
        save() {},
        restore() {},
        translate() {},
        scale() {},
        drawImage() {},
        fillRect() {},
        beginPath() {},
        closePath() {},
        moveTo() {},
        lineTo() {},
        fill() {},
        stroke() {},
        ellipse() {},
        setTransform() {}
      })
    };
  };

  const sandbox = {
    console,
    Math,
    Image: class {
      complete = true;
      naturalWidth = 1774;
      naturalHeight = 887;
    },
    setTimeout: () => 1,
    clearTimeout() {},
    requestAnimationFrame: () => 1,
    ResizeObserver: class { observe() {} },
    localStorage: { getItem: () => null, setItem() {} },
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
      },
      createElement: element,
      addEventListener() {},
      activeElement: { tagName: 'BODY' }
    },
    window: { addEventListener() {}, devicePixelRatio: 1 }
  };

  const context = vm.createContext(sandbox);
  sandbox.document.body = element();
  sandbox.getComputedStyle = () => ({ gap: '4px' });

  for (const f of ['assets-manifest.js', 'assets-loader.js', 'core.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), context);
  }
  sandbox.PackCore = sandbox.window.PackCore;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../attack-fx.js'), 'utf8'), context);
  sandbox.PackAttackFx = sandbox.window.PackAttackFx;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../campaign.js'), 'utf8'), context);
  sandbox.PackCampaign = sandbox.window.PackCampaign;
  for (const f of ['combat.js', 'frog-regions.js', 'frog.js', 'chest.js', 'game.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), context);
  }
  return source => vm.runInContext(source, context);
}

test('all 20 biomes exist with valid background assets and particle configurations', () => {
  const run = createGameContext();
  assert.equal(run('BIOMES.length'), 20);
  assert.equal(run('biomeBgs.length'), 20);
  assert.equal(run('forgeTiles.length'), 1);

  const manifest = run('ASSET_URLS');
  const expectedFiles = [
    'forest-v2.png',
    'bg-02-mountains.png', 'bg-03-brook.png', 'bg-04-market.png', 'bg-05-castle.png',
    'bg-06-cave.png', 'bg-07-swamp.png', 'bg-08-village.png', 'bg-09-desert.png',
    'bg-10-crypt.png', 'bg-11-snow.png', 'bg-12-windmills.png', 'bg-13-bamboo.png',
    'bg-14-volcano.png', 'bg-15-temple.png', 'bg-16-gardens.png', 'bg-17-coast.png',
    'bg-18-forge.png', 'bg-19-skyislands.png', 'bg-20-throneroom.png'
  ];
  for (const name of expectedFiles) {
    assert.ok(manifest[name], `Manifest must contain ${name}`);
    const webpRel = manifest[name].split('?')[0];
    const fullPath = path.join(__dirname, '..', webpRel);
    assert.ok(fs.existsSync(fullPath), `Optimized webp must exist at ${fullPath}`);
    assert.ok(fs.statSync(fullPath).size > 5000, `Webp file ${name} should have valid size`);
  }

  assert.equal(run('BIOMES[3].noMirror'), true);
  assert.equal(run('BIOMES[8].noMirror'), true);
  assert.equal(run('BIOMES[11].noMirror'), true);
  assert.equal(run('BIOMES[13].noMirror'), true);
  assert.equal(run('BIOMES[14].noMirror'), undefined);
  assert.equal(run('BIOMES[18].imgs.length'), 1);
  assert.equal(run('BIOMES[18].noMirror'), true);
  assert.equal(run('BIOMES.every(b => b.weather && b.weather.kind)'), true);
  assert.equal(run('new Set(BIOMES.map(b => b.weather.kind)).size >= 8'), true);
});

test('weather kinds differ across biomes and render without errors', () => {
  const run = createGameContext();
  const kinds = run('BIOMES.map(b => b.weather.kind).join(",")');
  assert.ok(kinds.includes('fireflies'));
  assert.ok(kinds.includes('rain'));
  assert.ok(!kinds.includes('fog'));
  assert.ok(!kinds.includes('mist'));
  assert.ok(kinds.includes('embers'));
  assert.ok(kinds.includes('petals'));
  run('reset(); state.mode = "running"; state.currentBiome = 1; state.targetBiome = 1;');
  run('update(0.05); background()');
  assert.ok(run('rainDrops.length >= 60'), 'king-two style rain should spawn many drops');
  run('state.currentBiome = 18; state.targetBiome = 4; state.biomeBlend = 0.4; update(0.05); background()');
  assert.equal(run('biomeWeather(BIOMES[1]).kind'), 'rain');
  assert.equal(run('BIOMES[1].noMirror'), true);
  assert.equal(run('biomeWeather(BIOMES[2]).kind'), 'clear');
  assert.equal(run('biomeWeather(BIOMES[18]).kind'), 'embers');
});

test('forge biome uses a seamless single tile without mirroring', () => {
  const run = createGameContext();
  assert.equal(run('biomeTileImages(BIOMES[18]).length'), 1);
  assert.equal(run('biomeTileImages(BIOMES[18])[0].assetName'), 'bg-19-skyislands.png');
  assert.equal(run('BIOMES[18].noMirror'), true);
});

test('stageBiomeIndex gives one background per level and repeats after 20', () => {
  const run = createGameContext();
  assert.equal(run('stageBiomeIndex(0)'), 1);
  assert.equal(run('stageBiomeIndex(1)'), 0);
  assert.equal(run('stageBiomeIndex(19)'), 19);
  assert.equal(run('stageBiomeIndex(20)'), 1);
  assert.equal(run('stageBiomeIndex(21)'), 0);
  // Waves inside the same level share one background
  assert.equal(run('waveBiomeIndex(1)'), 1);
  assert.equal(run('waveBiomeIndex(2)'), 1);
  assert.equal(run('waveBiomeIndex(4)'), 1);
  assert.equal(run('waveBiomeIndex(5)'), 0);
  assert.equal(run('biomeWeather(BIOMES[stageBiomeIndex(0)]).kind'), 'rain');
  assert.equal(run('STAGES.every((s,i)=>waveBiomeIndex(s.firstWave)===stageBiomeIndex(i)&&waveBiomeIndex(s.lastWave)===stageBiomeIndex(i))'), true);
});

test('background transitions blend across level changes, not mid-level waves', () => {
  const run = createGameContext();
  run('reset(0); state.mode = "running";');
  assert.equal(run('state.currentBiome'), 1);
  assert.equal(run('state.targetBiome'), 1);

  // Waves inside level 1 must keep the same background
  run('state.wave = 3; update(0.5)');
  assert.equal(run('state.targetBiome'), 1);
  assert.equal(run('state.biomeBlend'), 0);

  // Moving to level 2 starts a blend into the forest background
  run('state.stageIndex = 1; update(0.5)');
  assert.equal(run('state.targetBiome'), 0);
  assert.ok(run('state.biomeBlend > 0 && state.biomeBlend < 1'), 'Biome blend should be progressing');

  run('var testDraws = []; ctx.drawImage = (...args) => testDraws.push(args)');
  run('background()');
  assert.ok(run('testDraws.length') > 0, 'Background tiles must be rendered during blend');

  run('update(2.0)');
  assert.equal(run('state.currentBiome'), 0);
  assert.equal(run('state.biomeBlend'), 0);
});

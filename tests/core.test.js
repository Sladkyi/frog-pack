const test = require('node:test');
const assert = require('node:assert/strict');
const { makeItem, canPlace, merge, damage, power } = require('../core.js');
test('inventory enforces all edges, overlaps and self-movement', () => {
  const axe = makeItem('axe'); axe.x = 2; axe.y = 2;
  const stone = makeItem('storm');
  assert.equal(canPlace([axe], stone, 1, 1), false);
  assert.equal(canPlace([axe], stone, 3, 3), true);
  assert.equal(canPlace([axe], stone, 4, 3), false);
  assert.equal(canPlace([axe], stone, 3, 4), false);
  assert.equal(canPlace([axe], stone, -1, 0), false);
  assert.equal(canPlace([axe], axe, 2, 2), true);
  assert.equal(canPlace([axe], axe, 0, 4), false);
});
test('rotation checks the full new footprint', () => {
  const wand = makeItem('wand'); wand.x = 3;
  assert.equal(canPlace([], wand, 3, 0), true);
  assert.equal(canPlace([], { ...wand, w: 3, h: 1 }, 3, 0), false);
  assert.equal(canPlace([], { ...wand, w: 3, h: 1 }, 2, 0), true);
});
test('merge consumes an inventory duplicate and retains target position', () => {
  const a = makeItem('axe'), b = makeItem('axe'); b.x = 3; b.y = 2;
  const items = [a, b]; const before = power(items);
  assert.equal(merge(items, a, b), true); assert.equal(items.length, 1); assert.equal(b.level, 2); assert.equal(b.x, 3); assert.equal(b.y, 2); assert.ok(power(items) > before);
});
test('incoming loot can merge into a full backpack', () => {
  const items = Array.from({ length: 25 }, (_, n) => ({ ...makeItem('shuriken'), x: n % 5, y: Math.floor(n / 5) }));
  const incoming = makeItem('shuriken'); assert.equal(canPlace(items, incoming, 0, 0), false);
  assert.equal(merge(items, incoming, items[0]), true); assert.equal(items.length, 25); assert.equal(items[0].level, 2);
});
test('incompatible, unequal, self and maximum-level merges are rejected', () => {
  const a = makeItem('axe'), b = makeItem('shuriken'), c = makeItem('axe', 2), d = makeItem('axe', 4), e = makeItem('axe', 4);
  assert.equal(merge([a], a, a), false); assert.equal(merge([a], b, a), false); assert.equal(merge([a], c, a), false); assert.equal(merge([d], e, d), false); assert.equal(d.level, 4);
});
test('every weapon upgrade increases damage and effective power', () => {
  for (const type of ['axe', 'shuriken', 'wand', 'storm', 'blade', 'scythe', 'hammer', 'orb', 'dagger', 'tome']) for (let level = 1; level < 4; level++) {
    assert.ok(damage(makeItem(type, level + 1)) > damage(makeItem(type, level)));
    assert.ok(power([makeItem(type, level + 1)]) > power([makeItem(type, level), makeItem(type, level)]));
  }
});
test('late bags punish isolated corners and only socketed gear counts', () => {
  const { edgeTouch, linkMul, hasteFor, reductionFor, placeGear } = require('../core.js');
  const axe = makeItem('axe', 3); axe.x = 0; axe.y = 0;
  const bow = makeItem('bow', 3); bow.x = 3; bow.y = 3;
  const pack = [axe, bow];
  assert.equal(edgeTouch(axe, bow), false);
  assert.equal(linkMul(pack, axe, 5), 0.8);
  assert.ok(power(pack, 5) < power([{ ...axe }, { ...bow, x: 1, y: 0 }], 5));
  const boots = makeItem('boots', 4); boots.x = 4; boots.y = 4;
  const armor = makeItem('armor', 4); armor.x = 3; armor.y = 0;
  const scattered = [axe, boots, armor];
  assert.equal(hasteFor(scattered, axe), 1);
  assert.equal(reductionFor(scattered), 0);
  const wired = placeGear([['axe', 3], ['bow', 3], ['armor', 4], ['boots', 4]], 5);
  assert.ok(wired.length === 4);
  assert.ok(hasteFor(wired, wired[0]) > 1);
  assert.ok(reductionFor(wired) > 0);
  assert.ok(linkMul(wired, wired[0], 5) > linkMul(pack, axe, 5));
});
test('touching different schools opens a named pact, same school does not', () => {
  const { synergyStats, shots, PACTS } = require('../core.js');
  assert.equal(Object.keys(PACTS).length, 15);
  const axe = makeItem('axe', 1); axe.x = 0; axe.y = 0;
  const shuriken = makeItem('shuriken', 1); shuriken.x = 1; shuriken.y = 0;
  const hurl = synergyStats([axe, shuriken], axe);
  assert.equal(hurl.list[0].id, 'hurl');
  assert.ok(hurl.haste > 1);
  const twin = makeItem('axe', 1); twin.x = 1; twin.y = 0;
  assert.equal(synergyStats([axe, twin], axe).list.length, 0);
  const blade = makeItem('blade', 1); blade.x = 0; blade.y = 0;
  const bow = makeItem('bow', 1); bow.x = 2; bow.y = 0;
  assert.equal(synergyStats([blade, bow], blade).list[0].id, 'volley');
  assert.equal(shots(blade, [blade, bow]), shots(blade) + 1);
  const far = makeItem('bow', 1); far.x = 3; far.y = 3;
  assert.equal(synergyStats([blade, far], blade).list.length, 0);
  const orb = makeItem('orb', 1); orb.x = 0; orb.y = 1;
  const bomb = makeItem('bomb', 1); bomb.x = 0; bomb.y = 0;
  assert.equal(synergyStats([orb, bomb], orb).manaRefund, .25);
});
test('mana cost and upgrades scale together', () => {
  const { manaCost, scaledDamage, upgradeStats, defaultUpgrades } = require('../core.js');
  const wand = makeItem('wand');
  assert.equal(manaCost(wand), 17.5);
  assert.ok(manaCost(wand, { thrift: 2 }) < 17.5);
  assert.ok(scaledDamage(wand, { might: 2 }) > damage(wand));
  const stats = upgradeStats({ manaPool: 2, manaFlow: 1, vitality: 1 });
  assert.equal(stats.maxMana, 140);
  assert.equal(stats.maxHp, 112);
  assert.equal(stats.manaRegen, 17);
  assert.deepEqual(Object.keys(defaultUpgrades()).sort(), ['manaFlow', 'manaPool', 'might', 'thrift', 'vitality']);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const PackCore = require('../core.js');
const WeaponIcons = require('../weapon-icons.js');

test('every weapon in core TYPES has a dedicated storybook icon', () => {
  const weaponIds = Object.keys(PackCore.TYPES).filter(id => !PackCore.TYPES[id].gear);
  assert.equal(weaponIds.length, 37, 'There should be 37 weapon types');

  for (const id of weaponIds) {
    assert.equal(WeaponIcons.hasIcon(id), true, `Weapon "${id}" must have an icon`);
    const svg = WeaponIcons.getWeaponIconSvg(id);
    assert.ok(svg.includes('<svg'), `Weapon "${id}" SVG should start with svg tag`);
    assert.ok(svg.includes('viewBox="0 0 64 64"'), `Weapon "${id}" should have 64x64 viewBox`);
    assert.ok(svg.length > 100, `Weapon "${id}" SVG should have detailed vector content`);
  }
});

test('gear and utility items have icons', () => {
  assert.equal(WeaponIcons.hasIcon('armor'), true);
  assert.equal(WeaponIcons.hasIcon('boots'), true);
  assert.equal(WeaponIcons.hasIcon('chest'), true);
});

test('each weapon has unique vector graphics', () => {
  const bodies = new Set();
  const weaponIds = Object.keys(PackCore.TYPES).filter(id => !PackCore.TYPES[id].gear);

  for (const id of weaponIds) {
    const body = WeaponIcons.getIconSvgBody(id).trim();
    assert.ok(!bodies.has(body), `Weapon "${id}" must have unique artwork, not a duplicate`);
    bodies.add(body);
  }
  assert.equal(bodies.size, 37);
});

test('each weapon and gear has a dedicated raster PNG image on disk', () => {
  const fs = require('fs');
  const path = require('path');

  const allIds = [...Object.keys(PackCore.TYPES).filter(id => !PackCore.TYPES[id].gear), 'armor', 'boots', 'chest'];
  assert.equal(allIds.length, 40);

  for (const id of allIds) {
    const iconPath = WeaponIcons.getWeaponIconPath(id);
    assert.ok(iconPath.includes(id + '.png'), `Path should point to ${id}.png`);

    const imgTag = WeaponIcons.getWeaponIconImg(id, { size: 48 });
    assert.ok(imgTag.startsWith('<img'), 'Should return an <img> element');
    assert.ok(imgTag.includes(`src="${iconPath}"`), 'Should include the correct src');

    const absPath = path.join(__dirname, '..', iconPath);
    assert.ok(fs.existsSync(absPath), `Image file "${absPath}" must exist on disk`);
    const stat = fs.statSync(absPath);
    assert.ok(stat.size > 1000, `Image file "${absPath}" should be a valid PNG (size ${stat.size}B > 1000B)`);
  }

  // Atlas checks
  const atlasPng = path.join(__dirname, '..', WeaponIcons.ATLAS_PNG);
  assert.ok(fs.existsSync(atlasPng), 'Master atlas PNG must exist');
  assert.ok(fs.statSync(atlasPng).size > 10000, 'Atlas PNG must be populated');

  const atlasWebp = path.join(__dirname, '..', WeaponIcons.ATLAS_WEBP);
  assert.ok(fs.existsSync(atlasWebp), 'Optimized atlas WebP must exist');
});


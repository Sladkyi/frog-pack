/**
 * Attack FX profiles: dedicated sheets for unique weapons,
 * school generics for common/uncommon (and temporary rare+ fallbacks until art lands).
 */
(function (root) {
  'use strict';

  /** Modes that already have dedicated combat wiring + art. */
  const UNIQUE = {
    wand: { mode: 'beam', unique: true },
    storm: { mode: 'storm', unique: true },
    hammer: { mode: 'flurry', unique: true },
    scythe: { mode: 'reap', unique: true },
    orb: { mode: 'orbs', unique: true },
    dagger: { mode: 'flurry', unique: true },
    axe: { mode: 'projectile', impact: 'fire', splash: true, unique: true },
    blade: { mode: 'projectile', impact: 'slash', unique: true },
    shuriken: { mode: 'projectile', impact: 'vortex', unique: true },
    bow: { mode: 'projectile', impact: 'bow', unique: true },
    spear: { mode: 'projectile', impact: 'spear', pierce: true, unique: true },
    bomb: { mode: 'projectile', impact: 'bomb', unique: true },
    thunder_halberd: { mode: 'thunder_halberd', unique: true },
    eclipse_censer: { mode: 'ground', effectKind: 'eclipse_censer', unique: true },
    void_greatsword: { mode: 'ground', effectKind: 'void_greatsword', unique: true },
    doomsday_bell: { mode: 'ground', effectKind: 'doomsday_bell', unique: true },
    bone_scythe: { mode: 'ground', effectKind: 'bone_scythe', unique: true },
    phoenix_lance: { mode: 'ground', effectKind: 'phoenix_lance', unique: true },
    abyssal_eye: { mode: 'ground', effectKind: 'abyss_eye', unique: true },
    demon_axe: { mode: 'ground', effectKind: 'demon_inferno', unique: true },
    spirit_lance: { mode: 'ground', effectKind: 'spirit_epic', unique: true },
    frost_scepter: { mode: 'ground', effectKind: 'frost_scepter', unique: true },
    glacial_estoc: { mode: 'ground', effectKind: 'frost_scepter', unique: true },
    thunder_hammer: { mode: 'ground', effectKind: 'thunder_hammer', unique: true },
    holy_flail: { mode: 'ground', effectKind: 'holy_flail', unique: true },
    blood_falchion: { mode: 'ground', effectKind: 'blood_falchion', unique: true },
    plague_censer: { mode: 'ground', effectKind: 'plague_censer', unique: true },
    astral_mirror: { mode: 'ground', effectKind: 'astral_mirror', unique: true },
    starfall_shard: { mode: 'ground', effectKind: 'starfall_shard', unique: true },
    tome: { mode: 'ground', effectKind: 'tome_rune', unique: true },
    tempest_tome: { mode: 'ground', effectKind: 'tome_rune', unique: true },
    solar_bow: { mode: 'ground', effectKind: 'solar_bow', unique: true },
    dragon_pike: { mode: 'ground', effectKind: 'dragon_pike', unique: true },
    chaos_flail: { mode: 'ground', effectKind: 'chaos_flail', unique: true },
    moon_glaive: { mode: 'ground', effectKind: 'moon_glaive', unique: true },
    clockwork_trap: { mode: 'ground', effectKind: 'clockwork_trap', unique: true }
  };

  /** Shared templates for weapons without their own sheet. */
  const SCHOOL_GENERIC = {
    heavy: { mode: 'ground', effectKind: 'generic_slam', impact: 'fire' },
    blades: { mode: 'projectile', impact: 'slash' },
    ranged: { mode: 'projectile', impact: 'vortex' },
    polearms: { mode: 'projectile', impact: 'spear', pierce: true },
    magic: { mode: 'ground', effectKind: 'generic_bolt' },
    relics: { mode: 'projectile', impact: 'bomb' }
  };

  function resolve(type) {
    const TYPES = (root.PackCore && root.PackCore.TYPES) || {};
    const def = TYPES[type];
    if (!def || def.gear) return null;
    if (UNIQUE[type]) return { type, ...UNIQUE[type] };
    const school = def.school || 'blades';
    const generic = SCHOOL_GENERIC[school] || SCHOOL_GENERIC.blades;
    const rarity = def.rarity || 'common';
    const pendingUnique = rarity !== 'common' && rarity !== 'uncommon';
    return { type, ...generic, unique: false, pendingUnique, school, rarity };
  }

  function missingUnique() {
    const TYPES = (root.PackCore && root.PackCore.TYPES) || {};
    return Object.keys(TYPES).filter(id => {
      const def = TYPES[id];
      if (!def || def.gear) return false;
      if (UNIQUE[id]) return false;
      return def.rarity !== 'common' && def.rarity !== 'uncommon';
    }).sort();
  }

  const api = { UNIQUE, SCHOOL_GENERIC, resolve, missingUnique };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PackAttackFx = api;
})(typeof window === 'undefined' ? globalThis : window);

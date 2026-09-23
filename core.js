(function (root) {
  'use strict';

  const RARITIES = {
    common: { id: 'common', name: 'Common', color: '#94a39e', bg: 'rgba(148, 163, 158, 0.15)', mul: .9 },
    uncommon: { id: 'uncommon', name: 'Uncommon', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', mul: .95 },
    rare: { id: 'rare', name: 'Rare', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', mul: 1 },
    epic: { id: 'epic', name: 'Epic', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', mul: 1.07 },
    legendary: { id: 'legendary', name: 'Legendary', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', mul: 1.14 },
    mythic: { id: 'mythic', name: 'Mythic', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', mul: 1.22 }
  };

  const SCHOOLS = {
    magic: { id: 'magic', name: 'Elemental Magic', color: '#bba1ff' },
    heavy: { id: 'heavy', name: 'Heavy Weapons', color: '#e8b878' },
    blades: { id: 'blades', name: 'Blades & Swords', color: '#ffe19a' },
    ranged: { id: 'ranged', name: 'Ranged', color: '#c6df8d' },
    polearms: { id: 'polearms', name: 'Polearms', color: '#b6e7be' },
    relics: { id: 'relics', name: 'Artifacts & Alchemy', color: '#f472b6' }
  };

  const TYPES = {
    // === 1. ORIGINAL BASE TYPES (backward compatibility) ===
    shuriken: { name: 'Shuriken', rarity: 'common', school: 'ranged', w: 1, h: 1, color: '#c5e5a0', damage: 14, cooldown: 1.05, descriptions: ['A quick, precise throw.', 'A double volley into the group.', 'Three piercing blades.', 'Five blades and a cutting whirlwind.'] },
    axe: { name: 'Axe', rarity: 'uncommon', school: 'heavy', w: 1, h: 2, color: '#ffa66e', damage: 29, cooldown: 1.9, descriptions: ['A heavy throw with an impact flash.', 'Two flaming axes, area damage.', 'Three blasts tear through the group.', 'Four axes and massive fire explosions.'] },
    wand: { name: 'Staff', rarity: 'legendary', school: 'magic', w: 1, h: 3, color: '#bba1ff', damage: 46, cooldown: 2.4, descriptions: ['A beam from the sky strikes the target and neighbors.', 'A wide beam with runes and a shock ring.', 'Celestial pillar: three pulses across the area.', 'Heavenly judgment: a triple beam and five pulses.'] },
    storm: { name: 'Storm Stone', rarity: 'rare', aspect: 'storm', school: 'magic', w: 2, h: 2, color: '#8cdeef', damage: 34, cooldown: 2.3, descriptions: ['Heavenly lightning strikes the enemy.', 'A chain discharge between two foes.', 'Three branching lightning strikes.', 'The whole group under a storm of repeated discharges.'] },
    blade: { name: 'Blade', rarity: 'rare', school: 'blades', w: 2, h: 1, color: '#ffe19a', damage: 21, cooldown: 1.3, descriptions: ['A golden cutting crescent.', 'Two waves carve straight through the group.', 'Three wide arcs with hit flashes.', 'Four giant solar rifts.'] },
    bow: { name: 'Bow', rarity: 'uncommon', school: 'ranged', w: 2, h: 2, color: '#c6df8d', damage: 19, cooldown: 1.55, descriptions: ['A glowing forest bolt.', 'Two bolts at different targets.', 'Three piercing bolts.', 'Five bolts and a flash of forest magic.'] },
    spear: { name: 'Spear', rarity: 'uncommon', school: 'polearms', w: 1, h: 3, color: '#b6e7be', damage: 32, cooldown: 2, descriptions: ['Pierces enemies in a line.', 'A double piercing lunge.', 'A triple lunge with a shockwave.', 'Four lunges and a wide jade rift.'] },
    bomb: { name: 'Bomb', rarity: 'uncommon', school: 'relics', w: 2, h: 2, color: '#ffbe78', damage: 48, cooldown: 3, descriptions: ['An explosion over a small area.', 'Two bombs, a wide blast.', 'Three bombs and burning shrapnel.', 'Four bombs, a huge blast, and a follow-up fire strike.'] },
    scythe: { name: 'Scythe', rarity: 'rare', school: 'blades', w: 2, h: 2, color: '#c8e0a8', damage: 33, cooldown: 2.15, descriptions: ['A wide reaper sweep.', 'A double arc through the group.', 'Three harvest waves with recoil.', 'Harvest: a scythe whirlwind and a bloody sickle.'] },
    hammer: { name: 'Hammer', rarity: 'rare', school: 'heavy', w: 2, h: 2, color: '#e8b878', damage: 42, cooldown: 2.55, descriptions: ['A strike from the sky into the ground.', 'A double celestial hammer.', 'Three pillars and a shockwave.', 'Forge judgment: a massive pillar and repeated quakes.'] },
    orb: { name: 'Orb', rarity: 'epic', school: 'magic', w: 1, h: 1, color: '#a8d4ef', damage: 24, cooldown: 1.7, descriptions: ['A hovering orb strikes the target.', 'Two orbits around the enemy.', 'Three mana pulses.', 'Constellation: five orbs and a flash.'] },
    dagger: { name: 'Dagger', rarity: 'common', school: 'blades', w: 1, h: 1, color: '#f0d090', damage: 11, cooldown: .85, descriptions: ['A quick stab.', 'A double shadow strike.', 'Three swift blades.', 'Flurry: five shadow stabs.'] },
    tome: { name: 'Grimoire', rarity: 'epic', school: 'magic', w: 2, h: 2, color: '#d4b8ef', damage: 36, cooldown: 2.35, descriptions: ['Runes rise from the ground.', 'A double seal circle.', 'A rain of glyphs from the sky.', 'Archive: celestial seals and pulses.'] },

    // Gear (passive armor)
    armor: { name: 'Armor', rarity: 'common', w: 2, h: 2, color: '#b6c8a2', damage: 0, cooldown: 1, gear: true, descriptions: ['Reduces damage taken by 12%.', 'Reduces damage taken by 22%.', 'Reduces damage taken by 32%.', 'Reduces damage taken by 42%.'] },
    boots: { name: 'Boots', rarity: 'common', w: 2, h: 1, color: '#e2c48d', damage: 0, cooldown: 1, gear: true, descriptions: ['Weapons attack 10% more often.', 'Weapons attack 20% more often.', 'Weapons attack 30% more often.', 'Weapons attack 45% more often.'] }
  };

  // Weapons that have their own attack animation. Types without a sheet are not in the game.
  const EXTENDED_WEAPONS = {
    // School I: Elemental Magic (continued)
    frost_scepter: { name: 'Frost Scepter', rarity: 'rare', aspect: 'frost', school: 'magic', w: 1, h: 2, color: '#7dd3fc', damage: 28, cooldown: 1.8, descriptions: ['A falling ice stalactite.', 'Two ice spears from the sky.', 'Glaciation: three spikes and a frost blast.', 'Absolute zero: a cascade of icebergs.'] },
    tempest_tome: { name: 'Tempest Grimoire', rarity: 'epic', school: 'magic', w: 2, h: 2, color: '#38bdf8', damage: 39, cooldown: 2.2, descriptions: ['Summons a spinning twister.', 'A double whirlwind pulls enemies in.', 'A storm tornado laced with lightning.', 'Eye of the storm: a giant hurricane across the screen.'] },
    astral_mirror: { name: 'Astral Mirror', rarity: 'epic', school: 'magic', w: 2, h: 1, color: '#e879f9', damage: 31, cooldown: 1.6, descriptions: ['A prismatic fan of light beams.', 'A double reflection ricochets into foes.', 'An astral lattice of light.', 'Prism shatter: a spectral blast.'] },
    eclipse_censer: { name: 'Eclipse Censer', rarity: 'legendary', school: 'magic', w: 2, h: 2, color: '#818cf8', damage: 52, cooldown: 2.8, descriptions: ['A gravitational funnel of darkness.', 'Matter compression and a pulsing blast.', 'A black hole with an accretion disk.', 'Total eclipse: gravitational collapse.'] },

    // School II: Heavy Crushers (continued)
    chaos_flail: { name: 'Chaos Morningstar', rarity: 'rare', school: 'heavy', w: 2, h: 2, color: '#f87171', damage: 36, cooldown: 2.1, descriptions: ['A falling spiked core with sparks.', 'A double sweeping chain strike.', 'A spiked blast with shrapnel.', 'Chaos whirlwind: a fiery hail of debris.'] },
    thunder_hammer: { name: 'Thunder Hammer', rarity: 'legendary', aspect: 'storm', school: 'heavy', w: 2, h: 2, color: '#67e8f9', damage: 56, cooldown: 2.7, descriptions: ['An electric hammer smash into the earth.', 'A thunder dome with chain arcs.', 'A triple thunderclap across the area.', 'Thor\'s fury: a titanic hammer and a storm of lightning.'] },
    holy_flail: { name: 'Chain of Redemption', rarity: 'legendary', school: 'heavy', w: 2, h: 2, color: '#fde047', damage: 54, cooldown: 2.5, descriptions: ['A light bell strikes the ground.', 'A golden aura with a cleansing peal.', 'Three light bells cover the enemies.', 'Judgment hour: a divine cascade of redemption.'] },
    demon_axe: { name: 'Demon Maw Axe', rarity: 'mythic', aspect: 'ember', school: 'heavy', w: 2, h: 2, color: '#ef4444', damage: 78, cooldown: 3.4, descriptions: ['A lava rift lined with demonic fangs.', 'A hellish maw erupts from the underworld.', 'Bloody lava geysers tear the earth.', 'Armageddon: the abyss lord burns the ranks.'] },

    // School III: Blades, Swords & Harvest (continued)
    blood_falchion: { name: 'Crimson Falchion', rarity: 'epic', school: 'blades', w: 2, h: 1, color: '#dc2626', damage: 34, cooldown: 1.4, descriptions: ['A crimson sickle of bloodletting.', 'A double bloody slash.', 'A blood whirlwind drains essence.', 'Blood harvest: a crimson tide of life force.'] },
    glacial_estoc: { name: 'Glacial Estoc', rarity: 'epic', aspect: 'frost', school: 'blades', w: 2, h: 1, color: '#0284c7', damage: 32, cooldown: 1.35, descriptions: ['A lunge sprouts ice spikes.', 'A double frost puncture.', 'An ice ridge freezes the ground.', 'Glacial spire: a blast of absolute permafrost.'] },
    void_greatsword: { name: 'Abyss Blade', rarity: 'legendary', school: 'blades', w: 2, h: 2, color: '#7c3aed', damage: 58, cooldown: 2.3, descriptions: ['A black spatial rift edged in violet.', 'A double slash that swallows projectiles.', 'A spatial crack pulls enemies in.', 'Void blade: the dimension splits apart.'] },
    bone_scythe: { name: 'Ashen Bone Scythe', rarity: 'mythic', school: 'blades', w: 2, h: 2, color: '#e2e8f0', damage: 72, cooldown: 2.8, descriptions: ['A scythe strike spawns bone spikes.', 'A double spiral of bone blades.', 'A bone storm from earth and air.', 'Undead king: an army of bone sickles.'] },

    // School IV: Ranged & Thrown (continued)
    solar_bow: { name: 'Solar Bow', rarity: 'legendary', aspect: 'ember', school: 'ranged', w: 2, h: 2, color: '#eab308', damage: 48, cooldown: 1.8, descriptions: ['A light arrow leaves a burning trail.', 'A double solar beam.', 'Three piercing arrows of dawn.', 'Helios\'s wrath: a blazing pillar of light.'] },

    // School V: Polearms (continued)
    dragon_pike: { name: 'Dragon Pike', rarity: 'epic', school: 'polearms', w: 1, h: 3, color: '#ea580c', damage: 46, cooldown: 2.2, descriptions: ['A lunge unleashes a cone of flame.', 'A double jet of dragon fire.', 'A fire gale that melts armor.', 'Dragon breath: a pillar of all-consuming fire.'] },
    moon_glaive: { name: 'Moon Glaive', rarity: 'epic', school: 'polearms', w: 1, h: 3, color: '#818cf8', damage: 42, cooldown: 1.85, descriptions: ['Spinning sickles of moonlight.', 'A double lunar orbit around the shaft.', 'Three shining crescents that ricochet.', 'Lunar eclipse: a dance of silver sickles.'] },
    spirit_lance: { name: 'Spirit Lance', rarity: 'legendary', aspect: 'frost', school: 'polearms', w: 1, h: 3, color: '#38bdf8', damage: 55, cooldown: 2.4, descriptions: ['A swarm of ghostly blue wisps.', 'A spirit ram that stitches through the ranks.', 'Phantom riders race through the foes.', 'Spirit procession: an ancestral army sweeps the dark.'] },
    thunder_halberd: { name: 'Thunder Halberd', rarity: 'legendary', aspect: 'storm', school: 'polearms', w: 1, h: 3, color: '#0284c7', damage: 58, cooldown: 2.5, descriptions: ['Driving the halberd creates a lightning rod.', 'Constant chain lightning between foes.', 'A high-power electric field.', 'Storm lord: an unbroken barrage of discharges.'] },
    phoenix_lance: { name: 'Phoenix Lance', rarity: 'mythic', aspect: 'ember', school: 'polearms', w: 1, h: 3, color: '#f97316', damage: 76, cooldown: 3.1, descriptions: ['A lunge births a flying fire phoenix.', 'A bird of flame soars and dives.', 'Fiery wings cover the battlefield.', 'Phoenix rebirth: a solar blast and ash.'] },

    // School VI: Artifacts, Alchemy & Relics (continued)
    clockwork_trap: { name: 'Clockwork Trap', rarity: 'rare', school: 'relics', w: 2, h: 2, color: '#78716c', damage: 37, cooldown: 2.2, descriptions: ['Steel jaws slam shut.', 'A double trap that flings out saws.', 'A mechanical blast of gears.', 'Clockwork nightmare: a factory of spikes and teeth.'] },
    plague_censer: { name: 'Plague Censer', rarity: 'rare', school: 'relics', w: 2, h: 2, color: '#65a30d', damage: 32, cooldown: 2.0, descriptions: ['A cloud of toxic spores and flies.', 'A double poison cloud crawls forward.', 'Toxic smog infects the target.', 'Great Plague: a choking mortal blight.'] },
    abyssal_eye: { name: 'Abyssal Eye', rarity: 'legendary', school: 'relics', w: 1, h: 1, color: '#9333ea', damage: 56, cooldown: 2.3, descriptions: ['A dreadful violet eye opens in the air.', 'A beam of entropy disintegrates matter.', 'Three hovering eyes bombard the target.', 'Gaze of Cthulhu: madness and a tear in matter.'] },
    doomsday_bell: { name: 'Doomsday Bell', rarity: 'legendary', school: 'relics', w: 2, h: 2, color: '#eab308', damage: 60, cooldown: 2.9, descriptions: ['A bronze bell strikes with a sonic wave.', 'Golden concentric waves crush enemies.', 'A triple funeral peal deafens the ranks.', 'Requiem: a crushing resonance that destroys all.'] },
    starfall_shard: { name: 'Star Shard', rarity: 'mythic', school: 'relics', w: 1, h: 1, color: '#ec4899', damage: 80, cooldown: 3.3, descriptions: ['A small crystal summons a meteorite.', 'A starfall rains on the coordinates.', 'A cascading meteor storm with stardust.', 'Comet fall: a blast of galactic scale.'] }
  };

  Object.assign(TYPES, EXTENDED_WEAPONS);

  // The attack sheet is the skin, the role is the behavior: two weapons of one role only differ in numbers.
  // `tag` is the attack-button badge, `counter` the one rule a player must remember.
  const ROLES = {
    nova: { id: 'nova', name: 'Nova', tag: 'AOE', hint: 'hits the whole pack around the target', counter: 'best vs packs' },
    burst: { id: 'burst', name: 'Burst', tag: 'BOSS', hint: 'one target, ×1.6 damage, +15% to elites and bosses', counter: 'ignores armor, breaks boss wind-ups twice as fast' },
    chain: { id: 'chain', name: 'Chain', tag: 'CHAIN', hint: 'jumps through level+2 foes anywhere in the line', counter: 'best vs spread-out lines' },
    pull: { id: 'pull', name: 'Vortex', tag: 'PULL', hint: 'drags the pack together and slows it', counter: 'slows boss wind-ups and attacks' },
    dot: { id: 'dot', name: 'Blight', tag: 'DOT', hint: 'lingers twice as long, +10% damage over time', counter: 'blighted foes cannot heal' },
    pierce: { id: 'pierce', name: 'Pierce', tag: 'PIERCE', hint: 'each shot passes through level+1 foes', counter: 'ignores barriers' }
  };
  const ROLE_MEMBERS = {
    burst: ['abyssal_eye', 'starfall_shard', 'solar_bow', 'glacial_estoc', 'blood_falchion', 'dagger', 'orb', 'hammer'],
    chain: ['storm', 'thunder_hammer', 'astral_mirror', 'moon_glaive'],
    pull: ['eclipse_censer', 'tempest_tome', 'void_greatsword', 'clockwork_trap'],
    dot: ['plague_censer', 'dragon_pike'],
    pierce: ['spear', 'bow', 'blade', 'shuriken']
  };
  for (const [role, ids] of Object.entries(ROLE_MEMBERS)) for (const id of ids) TYPES[id].role = role;
  for (const def of Object.values(TYPES)) if (!def.gear && !def.role) def.role = 'nova';
  // Bosses are the only real threat: a large elite bonus flattened every boss fight in the balance bot.
  const BURST_MUL = 1.6, BURST_ELITE = 1.15;

  // Cooldowns, not mana, gate real fights, so rarity and footprint (bag space) scale the hit itself.
  // Both edges are centred on 1 so the campaign curve keeps its difficulty. SIZE_EDGE is indexed by cells.
  // Mana is priced by the size of one hit; 2.6 is the old hand-set average damage per mana.
  const MANA_EFF = 2.6;
  // Whole-press output per level. The old 1.65^n per shot × n shots made a lv4 hit 18× a lv1 hit
  // (from 8 merged pieces) and one-tapped every pack. Per-shot damage still rises every level.
  // lv4/lv3 must clear 1.475 after rounding: an isolated merged piece (×0.8) has to outhit two touching copies (×1.18).
  const LEVEL_POWER = [1, 2.2, 3.5, 5.3];
  // Mana grows almost as fast as damage: a lv4 press is slightly more efficient but cannot be spammed.
  const MANA_LEVEL = [1, 1.3, 1.6, 2];
  const SIZE_EDGE = [.92, .92, 1, 1.07, 1.12];
  const edgeOf = def => (RARITIES[def.rarity] || RARITIES.common).mul * SIZE_EDGE[Math.min(4, def.w * def.h)];
  for (const def of Object.values(TYPES)) def.manaCost = def.gear ? 0 : Math.max(1, Math.round(2 * def.damage / MANA_EFF) / 2);

  const UPGRADE_DEFS = {
    vitality: { name: 'Vitality', desc: '+12 max HP', max: 8, cost: lv => 3 + lv * 2 },
    manaPool: { name: 'Reservoir', desc: '+20 max mana', max: 8, cost: lv => 3 + lv * 2 },
    manaFlow: { name: 'Flow', desc: '+3 mana regen/s', max: 6, cost: lv => 4 + lv * 2 },
    might: { name: 'Might', desc: '+10% damage', max: 10, cost: lv => 4 + lv * 2 },
    thrift: { name: 'Thrift', desc: '−8% mana cost', max: 5, cost: lv => 5 + lv * 3 }
  };

  function defaultUpgrades() {
    return { vitality: 0, manaPool: 0, manaFlow: 0, might: 0, thrift: 0 };
  }

  function upgradeStats(upgrades = {}) {
    const u = { ...defaultUpgrades(), ...upgrades };
    return {
      maxHp: 100 + u.vitality * 12,
      maxMana: 100 + u.manaPool * 20,
      manaRegen: 14 + u.manaFlow * 3,
      damageMul: 1 + u.might * .1,
      manaDiscount: Math.max(.55, 1 - u.thrift * .08),
      upgrades: u
    };
  }

  function equipment(items) {
    const best = type => Math.max(0, ...items.filter(i => i.type === type).map(i => i.level));
    return {
      reduction: [0, .12, .22, .32, .42][best('armor')],
      haste: [1, 1.1, 1.2, 1.3, 1.45][best('boots')]
    };
  }

  let serial = 0;
  const makeItem = (type, level = 1) => ({
    id: ++serial,
    type,
    level,
    w: TYPES[type]?.w || 1,
    h: TYPES[type]?.h || 1,
    x: 0,
    y: 0
  });

  function canPlace(items, item, x, y, ignoreId = item.id, size = 5) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x + item.w > size || y + item.h > size) return false;
    return !items.some(other => other.id !== ignoreId && x < other.x + other.w && x + item.w > other.x && y < other.y + other.h && y + item.h > other.y);
  }

  function edgeTouch(a, b) {
    const ar = a.x + a.w, ab = a.y + a.h, br = b.x + b.w, bb = b.y + b.h;
    const overlapX = a.x < br && ar > b.x;
    const overlapY = a.y < bb && ab > b.y;
    if (overlapX && overlapY) return true;
    if (overlapX && (ab === b.y || bb === a.y)) return true;
    if (overlapY && (ar === b.x || br === a.x)) return true;
    return false;
  }

  function placeGear(gear, size = 5) {
    const items = [];
    for (const [type, level] of gear || []) {
      const item = makeItem(type, level);
      let placed = false;
      for (let y = 0; y < size && !placed; y++) {
        for (let x = 0; x < size && !placed; x++) {
          if (canPlace(items, item, x, y, item.id, size)) {
            item.x = x;
            item.y = y;
            items.push(item);
            placed = true;
          }
        }
      }
    }
    return items;
  }

  function pactKey(a, b) {
    return a < b ? a + '+' + b : b + '+' + a;
  }

  const PACTS = {
    // Six effect families so that picking a neighbor is a build choice, not a flat +15%.
    [pactKey('heavy', 'magic')]: { id: 'fuse', name: 'Fuse', hint: '+18% damage', damage: 1.18 },
    [pactKey('blades', 'heavy')]: { id: 'cleave', name: 'Cleave', hint: '+20% to elites and bosses', eliteMul: 1.2 },
    [pactKey('heavy', 'ranged')]: { id: 'hurl', name: 'Hurl', hint: '+14% haste', haste: 1.14 },
    [pactKey('heavy', 'polearms')]: { id: 'brace', name: 'Brace', hint: 'heals 4 HP per strike', heal: 4 },
    [pactKey('heavy', 'relics')]: { id: 'demolish', name: 'Demolish', hint: '+20% damage', damage: 1.2 },
    [pactKey('blades', 'ranged')]: { id: 'volley', name: 'Volley', hint: '+1 shot', extraShots: 1 },
    [pactKey('polearms', 'ranged')]: { id: 'lance', name: 'Lance', hint: '+20% to elites and bosses', eliteMul: 1.2 },
    [pactKey('magic', 'ranged')]: { id: 'enchant', name: 'Enchant', hint: '+15% damage', damage: 1.15 },
    [pactKey('ranged', 'relics')]: { id: 'payload', name: 'Payload', hint: '+18% damage', damage: 1.18 },
    [pactKey('magic', 'polearms')]: { id: 'rod', name: 'Rod', hint: '+16% damage', damage: 1.16 },
    [pactKey('blades', 'magic')]: { id: 'rune', name: 'Rune', hint: '20% mana back', manaRefund: .2 },
    [pactKey('magic', 'relics')]: { id: 'catalyst', name: 'Catalyst', hint: '25% mana back', manaRefund: .25 },
    [pactKey('blades', 'polearms')]: { id: 'duelist', name: 'Duelist', hint: '+12% haste', haste: 1.12 },
    [pactKey('blades', 'relics')]: { id: 'hex', name: 'Hex', hint: '+20% to elites and bosses', eliteMul: 1.2 },
    [pactKey('polearms', 'relics')]: { id: 'banner', name: 'Banner', hint: 'heals 3 HP per strike', heal: 3 }
  };

  function synergiesFor(items, item) {
    const def = TYPES[item.type];
    if (!def || def.gear || !def.school) return [];
    if (!items.some(other => other.id === item.id)) return [];
    const seen = new Set();
    const list = [];
    for (const other of items) {
      if (other.id === item.id || !edgeTouch(item, other)) continue;
      const o = TYPES[other.type];
      if (!o || o.gear || !o.school || o.school === def.school) continue;
      const key = pactKey(def.school, o.school);
      if (seen.has(key) || !PACTS[key]) continue;
      seen.add(key);
      list.push(PACTS[key]);
      if (list.length >= 2) break;
    }
    return list;
  }

  function synergyStats(items, item) {
    const list = synergiesFor(items, item);
    let damageMul = 1, haste = 1, extraShots = 0, manaRefund = 0, eliteMul = 1, heal = 0;
    for (const pact of list) {
      if (pact.damage) damageMul *= pact.damage;
      if (pact.haste) haste *= pact.haste;
      if (pact.extraShots) extraShots += pact.extraShots;
      if (pact.manaRefund) manaRefund = Math.max(manaRefund, pact.manaRefund);
      if (pact.eliteMul) eliteMul = Math.max(eliteMul, pact.eliteMul);
      if (pact.heal) heal += pact.heal;
    }
    return { damage: damageMul, haste, extraShots: Math.min(1, extraShots), manaRefund, eliteMul, heal, list };
  }

  function linkMul(items, item, size = 5) {
    const def = TYPES[item.type];
    if (!def || def.gear) return 1;
    let schoolN = 0, n = 0;
    for (const other of items) {
      if (other.id === item.id || !edgeTouch(item, other)) continue;
      n++;
      if (def.school && TYPES[other.type]?.school === def.school) schoolN++;
    }
    // A school cluster is the main reward; isolation is a nudge, not a punishment.
    if ((size || 5) < 5) return Math.min(1.3, 1 + schoolN * 0.1);
    if (n === 0) return 0.8;
    return Math.min(1.6, 1 + schoolN * 0.18 + Math.max(0, n - 1) * 0.04);
  }

  function hasteFor(items, item) {
    let best = 0;
    for (const gear of items) {
      if (gear.type !== 'boots' || gear.id === item.id) continue;
      if (edgeTouch(item, gear)) best = Math.max(best, gear.level);
    }
    return ([1, 1.1, 1.2, 1.3, 1.45][best] || 1) * synergyStats(items, item).haste;
  }

  function reductionFor(items) {
    let best = 0;
    for (const gear of items) {
      if (gear.type !== 'armor') continue;
      const wired = items.some(other => other.id !== gear.id && TYPES[other.type] && !TYPES[other.type].gear && edgeTouch(gear, other));
      if (wired) best = Math.max(best, gear.level);
    }
    return [0, .12, .22, .32, .42][best] || 0;
  }

  function merge(items, incoming, target) {
    if (!target || incoming.id === target.id || incoming.type !== target.type || incoming.level !== target.level || target.level >= 4) return false;
    target.level++;
    const index = items.findIndex(i => i.id === incoming.id);
    if (index >= 0) items.splice(index, 1);
    return true;
  }

  const damage = item => {
    const def = TYPES[item.type];
    if (!def) return 10;
    const level = Math.max(1, Math.min(4, item.level || 1));
    return Math.round(def.damage * LEVEL_POWER[level - 1] / level * edgeOf(def));
  };

  const shots = (item, items) => {
    let n = item.level;
    // Bow is left out: five piercing arrows outdamaged every mythic on a packed wave.
    if (['shuriken', 'dagger', 'orb'].includes(item.type) && item.level === 4) n = 5;
    if (items) n += synergyStats(items, item).extraShots;
    return n;
  };

  const manaCost = (item, upgrades) => {
    const def = TYPES[item.type];
    if (!def || def.gear) return 0;
    // Half-mana steps: whole numbers erased the rare→epic efficiency gap on small costs.
    const level = Math.max(1, Math.min(4, item.level || 1));
    return Math.max(1, Math.round(2 * def.manaCost * MANA_LEVEL[level - 1] * upgradeStats(upgrades).manaDiscount) / 2);
  };

  const scaledDamage = (item, upgrades) => Math.round(damage(item) * upgradeStats(upgrades).damageMul);

  const power = (items, size = 5, linked = true) => {
    const best = new Map();
    for (const i of items) {
      const def = TYPES[i.type];
      if (!def || def.gear) continue;
      if (!best.has(i.type) || best.get(i.type).level < i.level) best.set(i.type, i);
    }
    return Math.round([...best.values()].reduce((sum, i) => {
      const def = TYPES[i.type];
      const mul = linked ? linkMul(items, i, size) : 1;
      const haste = linked ? hasteFor(items, i) : 1;
      const syn = linked ? synergyStats(items, i) : { damage: 1, extraShots: 0 };
      const role = def.role === 'burst' ? BURST_MUL : 1;
      return sum + damage(i) * (shots(i) + syn.extraShots) / def.cooldown * haste * mul * syn.damage * role;
    }, 0));
  };

  const api = {
    RARITIES,
    SCHOOLS,
    ROLES,
    BURST_MUL,
    BURST_ELITE,
    LEVEL_POWER,
    MANA_LEVEL,
    equipment,
    TYPES,
    UPGRADE_DEFS,
    defaultUpgrades,
    upgradeStats,
    makeItem,
    canPlace,
    edgeTouch,
    placeGear,
    linkMul,
    PACTS,
    synergiesFor,
    synergyStats,
    hasteFor,
    reductionFor,
    merge,
    damage,
    shots,
    manaCost,
    scaledDamage,
    power
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PackCore = api;
})(typeof window === 'undefined' ? globalThis : window);

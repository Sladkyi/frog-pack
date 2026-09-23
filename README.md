# PACK / RUN

A 100-level campaign with 601 waves. Levels 1–2 use a 3×3 backpack, 3–4 use 4×4, and from level 5 onward it is 5×5. Each level starts with its own weapon kit. Every chest offers three items; take whatever you can place or merge. The first six levels gradually introduce upgrades. From the seventh chest onward you get a pair for the starter weapon, then items from the current level kit.

Combat controls: press the weapon buttons under the stage. Each has its own cooldown (boots help); the current attack animation finishes before the next strike. For each type, the strongest copy in the backpack is used. Auto-attacks are off. After a chest the hero runs 35 meters before the next pack appears. The attack bar replaces the loot panel during combat and travel.

A playable browser 2D prototype aimed at later adaptation for RUN.world.

## Run

Open `index.html` in a browser, or run `npm start` and go to http://127.0.0.1:4173. No install required. The game works offline; without internet it falls back to a system font.

## Rules

- Loop: fight → short run → chest and backpack → next wave. The last wave of a level ends with a boss and a results screen. In combat the hero stands still; weapons fire when you press their button.
- Kills chain into a combo while each one lands within 2.2 s of the last; a draining bar under `×N` shows the chain about to break. Every eighth kill in a chain triggers FRENZY: all cooldowns reset and +30 mana. Kills freeze the frame for a few milliseconds (longer for elites and bosses), the last blow of a wave plays in slow motion, a boss under 20% HP flashes its bar and calls ALMOST!, and under 35% HP the screen pulses red with a heartbeat. A loss says how close it was (boss HP left, foes left) and offers ONE MORE TRY. Ready attack buttons pulse when the player hesitates with foes on screen. Sound turns on with the first PLAY unless the player muted it before.
- Chests are random: a per-run seed (`state.lootSeed`, reshuffled on every start and retry) draws from the 37 weapon types that have their own attack animation. Rarity unlocks by level (rare from 2, epic from 6, legendary from 15, mythic from 31), the world's theme weapons weigh 2.5×, and every chest without an epic or better raises the odds until the sixth one guarantees it; the counter carries across levels. Plain (common/uncommon) new weapons arrive a tier below rare+ ones. A bag without armor is always offered armor. The only scripted chest is the very first one of level 1 (merge lesson, weapon versus armor). Rare+ rewards glow through the chest while the frog digs, and epic+ finds land with a flash, shake and fanfare.
- After a win the hero runs to the next chest at 52 m/s; chests sit every 100 meters. The hero opens the chest, dives in, and rummages with kicking feet, then climbs out with one find. After the scene: restore 18 HP and time to rearrange the backpack.
- The staff fires a painted sky beam: higher levels widen the hit area, add runes and repeat pulses. The axe does fire splash, the shuriken gains pierce and a whirl, the blade shoots golden crescents, the storm stone chains lightning and a thunder field.
- Every weapon plays one of six roles (`PackCore.ROLES`), shown on the item card: **Nova** hits the whole pack around the target; **Burst** hits one foe for ×1.6 and +15% on elites and bosses; **Chain** jumps through level+2 foes anywhere in the line (×1.25 on the first); **Vortex** pulls the pack together and slows its steps and attacks for 1.2 s at ×0.85 damage; **Blight** ticks twice as long for ×1.1; **Pierce** shots pass through level+1 foes. The attack sheet is the skin, the role is the behavior.
- Rarity and footprint scale the hit (`RARITIES[].mul` from ×0.9 common to ×1.22 mythic, `SIZE_EDGE` from ×0.92 for 1×1 to ×1.12 for 2×2), both centred on 1, so a bigger or rarer piece earns its bag space. Mana is priced by the base hit (`damage / 2.6`, half-mana steps). The balance bot never ran out of mana: cooldowns, not mana, gate a fight.
- Formation: a piece touching a same-school piece gains +18% per neighbor (+4% per extra neighbor of any kind, cap ×1.6); an isolated piece in a 5×5+ bag hits for ×0.8. Two different schools touching open a pact from six families: damage, haste, +1 shot, mana back, +20% on elites and bosses, or healing per strike. The backpack draws a seam on every contact: school color for a cluster, pulsing gold for a live pact, bronze for gear, faint for a plain neighbor.
- Tap a find: a duplicate upgrades the matching backpack item immediately; a new item auto-fills free space (rotating if needed).
- The Upgrade button merges an available pair without dragging. Pairs show an ↑ arrow. For manual layout, tap an item and a cell, or drag with mouse/finger.
- Axe is 1×2, shuriken 1×1, staff 1×3, storm stone 2×2, blade 2×1.
- Two matching items of the same level merge when you drop one onto the other. Cap is level 4. Merging keeps the footprint and strengthens the visible attack effect.
- R or Rotate turns the selected item. Discard frees space; you cannot discard the last weapon.
- Continue ⚔ leaves unclaimed finds at camp and starts the next fight. Space or the top button pauses.
- Twenty painted backgrounds swap between waves. Every ten levels, enemy pools and weapon kits change. The finale is three boss fights in a row.
- Best distance is saved locally. Sound toggles with ♫. Switching tabs auto-pauses the run.

## Files

`core.js` — backpack, weapons, and upgrades; `game.js` — combat, UI, and Canvas graphics; `style.css` — compact mobile layout; `server.js` — dependency-free local server. `assets/sprites-v2.png` — transparent atlas: 4 run frames, enemies, boss, weapons and effects. `assets/forest-v2.png` — painted forest. Style adapted from Don't Let Him Die (`king-two`) references. Prompts and provenance: `assets/STYLE-V2.md`. Previous atlas kept as `sprites-v1.png`.

Rule checks: `npm test`.

Attacks use separate painted frames: 12 beam frames, 6 each for fire, blade, vortex and lightning, 8 hero poses. Canvas picks different atlas regions and holds strong frames longer. Weapons bind to each pose’s hand. New atlases and prompts: `assets/ANIMATION-V2.md`.

`combat.js` — enemy packs, run phases, attacks and evolutions. `assets/hero-run-v3.png` — eight fast-run frames; `assets/hero-battle-v1.png` — battle stance; `assets/combat-fx-v1.png` — painted beams for four levels and weapon effects. Prompts for new combat sprites: `assets/COMBAT-V1.md`.

This is a standalone prototype. RUN.world publishing and platform API integration are not done yet. Unlocked levels and stars save locally; an unfinished level restarts after reload. Music is not implemented yet.


## Weapons and gear: expansion

There are now 10 item types, each with four separate evolution icons (40 drawings). Bow 2×2 fires volleys; higher levels add pierce and a leaf whirl. Spear 1×3 pierces a line of enemies and adds a damage wave at higher levels. Bomb 2×2 deals area damage; levels 3–4 leave a follow-up fire strike. Each new attack has six painted frames.

Armor 2×2 reduces incoming damage by 12/22/32/42%; boots 2×1 raise attack rate by 10/20/30/45%. Only the best gear level of each kind applies; duplicates do not stack. Items work from the backpack, rotate and merge; the last weapon stays protected even with gear equipped. All types appear in the loot cycle. Atlases and prompts: assets/EVOLUTION-V1.md.


## Frog mage

The hero is a frog from a user reference: wide brown hat with spiders, yellow scarf and bag. Five full atlases of 24 frames each: unarmored plus four armor levels. Each has 8 run, 8 attack, 4 stop and 4 idle frames. `frog.js` picks the set from the best armor in the backpack; equipping or discarding armor updates immediately. Prompts and provenance: assets/FROG-V1.md.

Chest scene: `chest.js`, 6 painted poses in assets/chest-short-v2.png: three enter and three exit over 1.95 seconds. Chest size is locked to anchor points; exit aligns with hero idle. The reward is chosen once on arrival and granted after the scene; pause freezes it. Prompt: assets/CHEST-V2.md.

## 100-level campaign

Built like Don’t Let Him Die from `king-two`: separate level select, sequential unlocks, stars, and a direct jump to the next level after a win. The menu has ten pages of ten levels. The first six levels have 3–4 waves, levels 7–20 have five, 21–70 six, 71–100 seven. Each ends with a boss. Defeat restarts only the current level, with the backpack the frog entered it with (mid-level pickups are lost, the starter kit never replaces a better bag). Cleared levels can be replayed from the menu with their starter kit.

During play you only see the level number, wave dots, and a boss crown. Map, tips, wave names, distance counters and overall progress are off the play screen. Level select is available from the start screen, pause, and results.

`campaign.js` defines 100 levels and 601 waves. The first six are kept for compatibility. The rest are built deterministically from ten encounter families: swarm, rush, siege, convoy, and others. They differ in roster, reinforcement order and gaps, starter weapons and loot. Every ten levels, enemy HP and pressure rise, and mixed groups from earlier areas appear. The first wave leaves room to reach an upgrade; later waves require using loot. At most 14 living foes on screen; only the front three can hit the frog, the rest queue behind them. A won level carries its backpack into the next one, and the frontier backpack is saved in `packrun-levels-v1` so a reload continues with it. Late starter kits add new weapon types rather than duplicates, because only the best copy of a type attacks. After level 20, enemy HP and damage grow slowly: player damage is limited by the attack rhythm and mana, not by the kit. `WORLDS[].hp` softens the few worlds whose mechanics stack (armor, rage bosses, healers).

An attack locks the other buttons only for its strike frames (`ATTACK_LOCK`, 0.45 s). The next attack can cancel the rest of the 0.78 s pose, so cooldowns, not animation, are what limit a fast player.

`combat.js` adds 13 enemy and boss variants on existing painted atlases with color shifts. New mechanics: breakable shields, spider splits, neighbor healing, haste aura, and rage below half HP. Rings and flashes show active abilities without on-field text tutorials.

Progress is stored locally in `packrun-levels-v1`: unlocked levels, best stars, and selected level. An old six-level save keeps stars and unlocks level seven. A win gives one star; ≤30 total damage taken that level gives two; zero damage gives three. Healing does not erase damage taken; replays never lower the best stars. Stars do not gate later unlocks.

`npm test` covers saves, locks, retries, menu, starter backpacks, reinforcements, new abilities, and full clears of all 100 levels at stage widths 354 and 850.

`npm run balance` runs a fast simulation of the real combat code with no damage or HP cheats. The bot presses the hardest-hitting ready attack (the most mana-efficient one below 35% mana) every 0.25 s, takes merges first, then missing gear (dropping its weakest weapon if the bag is full), never rearranges the bag and buys no meta upgrades; a death is retried through the real RETRY button up to three times. Output in `reports/campaign-balance.json`, with a bag snapshot per level. With `REACTION_SECONDS=0.4` it is 99 of 100 levels won on the first try, about 253 minutes including five seconds per chest choice; with `0.8` also 99, about 263 minutes. Late levels (76–100) cost the bot 44–93 HP per level. That is a duration estimate, not a human playtest. `SIM_WIDTH`, `FIRST_LEVEL`, `LAST_LEVEL`, `REACTION_SECONDS`, `ATTEMPTS`, `NO_UPGRADES=1` `SIM_PATCH` (code run inside the game sandbox for A/B tests) and `GAME_ROOT` (run another build, e.g. `dist`, for a before/after comparison) let you replay specific scenarios. In PowerShell pass numbers as strings (`'0.4'`), otherwise a comma locale turns them into `0,4`.

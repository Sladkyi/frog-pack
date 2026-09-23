# 12-Frame Attack Animation Architecture & Prompts

Standardized 12-frame (4 columns × 3 rows) hand-drawn storybook attack animations matching the art style and layout of `beam-frames-v2.png`.

## Specification
- **Canvas format**: 4 columns × 3 rows = 12 cells (1536×1152 or 1448×1086).
- **Background**: True transparent alpha.
- **Baseline**: Ground level calibrated at 88% of cell height, effect centered horizontally at 50%.
- **Art style**: Bold dark-brown ink outlines, simple two-tone cel shading, earthy storybook forms matching `beam-frames-v2.png`.
- **Phases across 12 frames**:
  - Frames 0–2 (Windup): Magic gathering, charge, rising sigils/sparks.
  - Frames 3–5 (Impact): Instant explosive blast, primary stroke, ground contact.
  - Frames 6–8 (Peak Sustain): Shockwave ring, branching arcs, erupting geysers/vortices.
  - Frames 9–11 (Fadeout): Smoke lobes, falling embers, fading sparkles.

---

## 1. Hammer Slam (`assets/hammer-fx-v3.png`)
- **Theme**: Titan golden celestial hammer slam & seismic fissure.
- **Color**: `#f59e0b` (warm gold / amber).
- **Phases**:
  1. Golden circular magic sigil on ground.
  2. Ethereal golden warhammer forms high above.
  3. Warhammer raises to peak windup, gathering sparks.
  4. Violent downward plunge with velocity streaks.
  5. Maximum impact slam into ground line with comic shockwave burst.
  6. Fracturing ground, bursting jagged rock chunks, expanding golden ring.
  7. Peak seismic eruption with stone pillars and dust geysers.
  8. Outward shockwave ring hugging ground with flying pebbles and smoke lobes.
  9. Warm amber fissures with rising cartoony smoke plumes.
  10. Airborne rocks falling back down, separating cloud puffs.
  11. Fading dust puffs and tiny floating embers.
  12. Final small smoke wisp and resting pebbles.

---

## 2. Storm Lightning (`assets/storm-fx-v3.png`)
- **Theme**: Celestial azure lightning strike & electric plasma web.
- **Color**: `#8cdeef` (cyan / pale electric teal).
- **Phases**:
  1. Small angular cyan spark and dark storm wisp at zenith.
  2. Descending jagged cyan branch with two sharp forks.
  3. Stepped leader branches touch ground, sparks jump up.
  4. Main stroke impact: thick jagged creamy-white & cyan bolt hits ground.
  5. Return stroke: bolt thickens with outward electric arcs, bulbous plasma burst.
  6. Bolt vibrates with jagged contour, 3 horizontal spiderweb arcs on ground.
  7. Peak electricity: central bolt breaks into thick zigzag ribbons.
  8. Bolt separates into disjointed curving sparks, crawling ground tendrils.
  9. Fading electrical curls, rising blue-grey smoke puffs.
  10. Broken sparks floating in air, two lingering smoke plumes.
  11. Tiny drifting cyan spark dots.
  12. Last faint electric sparks disappearing.

---

## 3. Fiery Axe Cleave (`assets/axe-fx-v3.png`)
- **Theme**: Blazing battleaxe cleave & magma flower eruption.
- **Color**: `#ffa66e` (flame orange / ochre).
- **Phases**:
  1. Spinning orange flame spark and heat ripple.
  2. Crescent fire arc curving downward with flame tongues.
  3. Giant blazing battleaxe blade silhouette sweeps down.
  4. Impact slam: fiery blade splits ground line with comic starburst.
  5. Erupting vertical pillar of roaring flame tongues with dark ink outlines.
  6. Flame pillar expands outward into curling flower-like fire petals.
  7. Peak firestorm: swirling fiery vortex with three twisting flame ribbons.
  8. Flames tear into billowing curly dark smoke clouds with burning cores.
  9. Smoke clouds expand upward into rounded cartoon puffs, scattering embers.
  10. Drifting separated smoke lobes and glowing ash flakes.
  11. Soft grey smoke curls thinning out, two fading embers.
  12. Final small wisp of dark smoke dissipating.

---

## 4. Tome Rune Shower (`assets/tome-fx-v3.png`)
- **Theme**: Ground magic seal, rising glyph tower & starry rune rain.
- **Color**: `#d4b8ef` (pale lavender / celestial violet).
- **Phases**:
  1. Glowing violet ground ellipse with four small runes.
  2. Circular magic seal rotates with 8 glowing glyphs.
  3. Seal glows bright creamy lavender, glowing ancient pages orbit.
  4. Runic burst: vertical pillar of glyph-inscribed light erupts upward.
  5. Seal detonates into starry shockwave, large floating runes burst outward.
  6. Celestial rune shower: glowing glyphs rain down, ground ripples pulse.
  7. Peak arcane surge: dome of glowing stardust and orbiting glyph ribbons.
  8. Runes break into glittering star fragments and soft violet smoke.
  9. Dissolving seal, floating glyph pieces turning to sparkling dust.
  10. Fading mystical smoke puffs with tiny floating rune particles.
  11. Lingering violet stardust drifting down toward ground.
  12. Last few tiny sparkles fading away.

---

## 5. Solar Blade Slash (`assets/blade-fx-v3.png`)
- **Theme**: Solar gold crescent slice & diamond sword-light shards.
- **Color**: `#ffe19a` (bright sun gold / cream).
- **Phases**:
  1. Narrow golden tapered glint and subtle curved slash trail.
  2. Sharp crescent blade light sweeping forward from left to right.
  3. Wide golden sickle crescent unfolds with high-speed white motion lines.
  4. Full slash impact: massive double-arc solar crescent cleaves through center.
  5. Sliced space erupts into horizontal starburst and sharp sword-light shards.
  6. Dual golden shockwave arcs tear outward in opposite directions.
  7. Peak slash bloom: cross-cutting secondary golden crescent with diamond stars.
  8. Light arcs fracture into curving ribbon segments and flying golden feathers.
  9. Ribbon segments dissolve into clusters of diamond glints and smoke trails.
  10. Fading sword light shards turning into falling golden dust.
  11. Tiny drifting sun dust specks.
  12. Final faint twinkle vanishing.

---

## 6. Spectral Scythe Sweep (`assets/scythe-fx-v3.png`)
- **Theme**: Spectral emerald harvest sickle sweep & soul leaf vortex.
- **Color**: `#c8e0a8` (emerald / mint green).
- **Phases**:
  1. Wispy spectral emerald trail curving behind windup path.
  2. Ghost-green crescent blade silhouette forms, pulling curved wisps.
  3. Giant spectral scythe blade swings forward with rapid green speed trails.
  4. Harvest sweep: colossal 180° emerald sickle arc slashes across ground.
  5. Slash path detonates with swirling storm of autumn leaves and spirit wisps.
  6. Leaf and spirit vortex expands into wide circular scythe shockwave.
  7. Peak spectral release: swirling ghost soul wisps in upward spiral.
  8. Vortex opens, spirit wisps scatter into soaring leafy embers.
  9. Leaves and soul wisps drifting outward, dissolving into curly green smoke.
  10. Fading smoke lobes with three lingering falling green leaves.
  11. Single falling leaf and tiny floating green embers.
  12. Final leaf settles, tiny spirit spark fades.

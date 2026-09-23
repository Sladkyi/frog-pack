# Combat art v1

Generated with the built-in image_gen tool using assets/sprites-v2.png as a style reference.

- assets/combat-fx-v1.png: transparent 1536×1024 atlas. Four evolving celestial beams across the top; fire impact, golden slash, shuriken vortex and lightning across the bottom. Fixed source rectangles and runtime animation isolate each effect.
- assets/hero-battle-v1.png: transparent standing combat pose. The owned weapon is drawn onto the front fist, changes when attacking or selecting an inventory item, and glows with its level.

## VFX prompt

Generate ONE production VFX sprite atlas for a 2D mobile woodland fantasy action game. Use the attached artwork ONLY as style reference: bold hand-inked outlines, clean cartoon shapes, expressive hand-painted colors, not pixel art, no realism, no 3D. Genuine transparent PNG background, no checkerboard, text, grids or scene.
STRICT 4 columns by 2 rows of equal cells, landscape canvas 1536x1024. All 8 effects fully contained within their own cell with 12% transparent padding, centered, no overlap. These effects will be animated in code by stretching, flashing and rotating separate pieces.
TOP ROW: four increasingly epic versions of a vertical magical SKY BEAM, violet, lilac, pale-gold white-hot cores.
Cell1: thin jagged hand-painted violet beam drops vertically from a small star above into a small bright impact burst below.
Cell2: wider radiant column with spiraling violet energy ribbons, small floating runes and a double-ring ground impact.
Cell3: enormous white-gold core wrapped in purple lightning, an ornate glowing magical halo above and explosive petal-shaped ground shockwave.
Cell4: ultimate heavenly judgement beam, twin violet-gold satellite pillars around a central bright column, crown-like halo of rune fragments at top, broad magnificent wing-shaped impact burst, bright gold sparks.
Beams are straight vertical, drawn as complete isolated effects from top celestial point down to bottom impact. Strong graphical silhouettes.
BOTTOM ROW: cell1 orange fire crescent and explosive ember burst for an axe impact; cell2 sweeping golden crescent slash with clean tapered arc and gold sparks for a sword; cell3 lime-green circular wind vortex with four small silver shuriken shapes around it; cell4 cyan-blue lightning strike with branching forks, blue magic ring and white-hot star impact.
Different evolution levels should read as dramatically different shapes at small scale. All VFX precisely isolated in separate cells, true transparent alpha, avoid faint giant haze that covers adjacent cells. No characters or weapons other than the small shuriken in the vortex.

## Hero prompt

Create a single transparent PNG game sprite of the SAME hooded adventurer in the attached reference (use ONLY the character from the top row as identity and style reference). Full body, facing RIGHT, stationary combat-ready standing pose. Both boots firmly planted on one horizontal ground baseline, knees slightly bent, feet shoulder-width apart. NOT running, NOT jumping, no lifted knee.
Sage green hood, face in shadow with two warm golden eyes, cream tunic, brown backpack, orange scarf streaming gently left, leather boots. Smooth bold dark ink outlines, clean two-tone cartoon shading, same rounded proportions. His visible right/front arm extends in front of chest toward the RIGHT, elbow slightly bent; a small closed fist at about x=70%, y=58% of the character, ready to grip a weapon. Empty fist; NO weapon (the game overlays different weapons onto this fist). Other hand near belt. Determined cute expression. Generous transparent margin, entire character contained. Square canvas 1024x1024; character occupies 75% of canvas height. True transparent alpha, no colored backdrop, no text, no ground or shadows. Maintain exact original hood/scarf/backpack identity.

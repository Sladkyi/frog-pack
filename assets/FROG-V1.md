# Frog wizard v1

Generated using built-in ImageGen from the user's supplied frog-wizard reference. Five transparent 1024×1536 sheets, each 4×6 cels. Original alpha retained, no raster retouching. Runtime source selection and grip anchors in frog.js.

- frog-armor-0.png: cream tunic, no armor.
- frog-armor-1.png: leather.
- frog-armor-2.png: reinforced leather.
- frog-armor-3.png: steel.
- frog-armor-4.png: legendary gold/emerald.

## Base generation prompt

Create a production transparent PNG SPRITE SHEET of the exact charming frog wizard in the reference image. Preserve recognizable green frog face, big black eyes with yellow-green rims, broad floppy pointed rust-brown witch hat with black band and a little leaf, three tiny black round white-eyed spider companions perched on the hat, mustard yellow scarf, cream tunic, dark belt, brown shoulder satchel. Friendly slim upright frog with long green fingers and frog feet. Faces RIGHT in side / three-quarter view, full body. Empty front hand shaped to grip a weapon; DO NOT draw stick or any weapon. Match simple storybook hand-inked dark outlines and flat cel shaded earthy colors, no photographic background grain. True alpha TRANSPARENT backdrop, no scenery, no checkerboard, no ground shadow, no text numbers borders or grid lines.
STRICT 4 columns by 6 rows = 24 equally sized square cells, portrait 1024x1536. Every cell fixed camera, same head size, same character size, feet baseline at 92% cell height, hat and spiders contained inside with 8% margin, torso centered x50%. NO overlapping cells.
Rows1-2: EIGHT genuinely different running cycle drawings read left-to-right: right foot contact, down/compression, passing, airborne, left foot contact, compression, passing, airborne. Legs clearly alternate, hat tip/scarf/satchel follow through.
Rows3-4: EIGHT attack gesture drawings: ready, pulling empty front fist back, lifting fist above shoulder, sharp forward thrust, extended follow-through, retracting, settling, ready. Hat and scarf react; front hand stays readable, weapon will be added at runtime.
Row5: FOUR running-to-idle braking drawings: shortened running stride, heel plant and lean back, both feet planted bent knees, upright settling.
Row6: FOUR quiet idle drawings: relaxed ready stance front empty hand forward at chest height, slight breathe in, blinking, breathe out. Tiny subtle motion, no attack or waving.
This is a real frame-by-frame animation sprite sheet, not repetitions. Anatomy and identity constant across all24 cels. Keep hat companions small and same three throughout. No armor yet: cream tunic and yellow scarf only.

## Armor edits

Each edit preserved the original 24 poses, registration, dimensions, face, hat, scarf and bag, changing only torso and shoulder armor. Requested variants:

1. warm brown fitted leather vest with stitched edges over cream tunic
2. reinforced dark brown leather cuirass, small steel shoulder guards and rivets
3. olive and silver plate breastplate with substantial steel pauldrons and leather straps
4. legendary cream-gold woodland plate armor, ornate leaf-shaped gold pauldrons and emerald chest jewel


Frame cropping: frog-regions.js records measured bounds for all 120 drawings. Several silhouettes cross the nominal 256 px grid. Rendering preserves their overhang while excluding neighboring drawings. Running contact baselines are registered per half-cycle; compressed poses use shorter holds.

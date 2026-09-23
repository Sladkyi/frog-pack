# Art direction v2: Don't Let Him Die

Created with the built-in image_gen tool. Reference project: C:/Users/User/dev/king-two. Its files were read only.

## Saved assets

- sprites-v2.png: 1254×1254 RGBA atlas, rendered using explicit sprite rectangles (the generated rows are not perfectly uniform). Existing sprites-v1.png retained.
- forest-v2.png: 1774×887 RGB side-view woodland panorama; alternating mirrored tiles keep the scrolling edge continuous.

## References

- public/images/tower-fox.png: rounded forms, large eyes, dark ink outlines, olive and cream palette.
- public/images/enemy-beetle.png: simple expressive creatures and two-tone shading.
- public/images/playfield-bg.jpg: outlined vegetation, ochre path, green foliage and orange flowers.
- The original PACK RUN atlas supplied as edit target.

## Sprite prompt

Use case: style-transfer. Edit target: image 1, the existing PACK RUN 4x4 sprite atlas. Style references only: image 2 is tower-fox.png from the user's Don't Let Him Die game, image 3 is enemy-beetle.png from that game, image 4 is its playfield-bg.jpg.
Redraw the ENTIRE atlas in the illustration style of reference images 2-4: bold dark-brown ink outlines, clean rounded storybook cartoon shapes, expressive large eyes, olive green and cream, warm ochre leather, small patches of simple cel shading. Smooth hand-drawn outlines, restrained two-tone shading and subtle paper-like brush texture. NOT pixel art, NOT realistic rendering, NOT 3D, NO dense metallic highlights or gritty detail. Make it feel like a sibling game to the provided reference.
Preserve image 1's gameplay subjects and exact 4-column x 4-row atlas arrangement on a square canvas with true TRANSPARENT alpha background. Every cell is equal size. No grid lines, text, labels, backdrop, fake checkerboard or contact shadows. Each sprite must be entirely contained in its cell with at least 8% padding on every side. Nothing crosses cell boundaries.
Row1: four consistent run-cycle poses of our same hooded little adventurer facing RIGHT. A round sage-green hood, large warm gold eyes visible in a shadowed face, cream tunic, ochre leather backpack, rust-orange scarf pointing LEFT, stubby boots. Cute determined expression, plump readable silhouette matching the cartoon proportions in reference 2. Same character size and floor baseline in all 4 frames. Alternate clearly different leg positions.
Row2: cell1 olive-green horned forest slime facing LEFT with big simple eyes; cell2 plum-colored tougher horned slime facing LEFT; cell3 chunky moss-covered stone golem facing LEFT with simple expressive eyes; cell4 ochre wooden treasure chest with simple brass bands.
Row3: cell1 iron axe with wooden handle; cell2 four-point silver shuriken; cell3 wooden staff and purple crystal; cell4 blue lightning rune stone.
Row4: cell1 simple gold-and-iron sword; cell2 violet magic orb with compact cartoon glow; cell3 golden four-point upgrade burst; cell4 cluster of green leaves and orange mushrooms.
All items in the same bold outlined illustrative language, clear at 40-70 pixels. Keep atlas coordinates exactly unchanged. Output square transparent PNG, preferably 1024x1024.

## Background prompt

Use case: stylized-concept. Asset type: horizontally scrolling 2D side-view forest game background.
The attached image is a STYLE REFERENCE ONLY, from the user's Don't Let Him Die game. Make a NEW horizontal background for a side-scrolling runner in exactly this hand-drawn cartoon language: crisp dark-brown ink outlines, rounded leafy canopies, simple flat olive and moss-green colors, two-tone painted shadows, warm ochre earth, little orange flowers and outlined pebbles. NOT pixel art, no realism, no polygonal geometric trees.
Composition: wide landscape image approximately 1536x768, side-on camera at a small character's eye level, no top-down view. A straight horizontal sandy walking path is located between y=78% and y=88% of image height, extends from left to right without bending, and is empty of obstacles and characters. Ground line at precisely y=79%. Foreground edge along bottom with grass and few tiny mushrooms. Background has tall gnarled trunks, clustered canopy foliage, ferns and soft layers of distant muted green forest. Keep lower-middle combat space open and low contrast so small creatures read clearly. Background enough detail to feel illustrated, simpler than a painting, no excessive texture.
Horizontally seamless panorama: left and right borders join naturally with same background values and path height. Lighting softly warm daytime woodland, cream-yellow filtered light at the center, earthy desaturated greens. No characters, no UI, no text, no logo, no large central focal object. Opaque full image, no transparency. Match the attached style reference while translating its overhead woodland map into a clean SIDE-VIEW running scene.

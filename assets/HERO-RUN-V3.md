# Runner animation v3

Generated with the built-in image_gen tool; saved as `assets/hero-run-v3.png`. Transparent 1774×887 PNG, 8 poses in two rows. Reference: `assets/sprites-v2.png`.

The renderer uses a fixed scale and ground baseline, explicit 443×412 source windows at y=40 and y=457, and 12 frames per second. Animation time advances only while the character travels; loot stops and pause freeze the pose. No additional sinusoidal vertical movement is applied over the drawn poses.

## Prompt

Create a production animation sprite sheet, using the attached image ONLY as character and art-style reference. ONLY the hooded adventurer from its top row. Do not reproduce weapons, monsters or other rows.
Transparent PNG, exactly 4 columns by 2 rows of EIGHT evenly sized square animation cells, 2:1 landscape canvas. True transparent alpha. Each cell contains the SAME full-body small hooded runner facing RIGHT: sage green hood, two gold eyes in black face, cream tunic, brown backpack, orange scarf trailing LEFT, brown leather boots. Bold dark ink outlines, smooth flat cartoon shading. Maintain the same scale, head size and fixed horizontal hip position for all eight frames. 15% transparent padding every cell. Absolutely no overlap between cells, no shadows, no text, no labels.
CRITICAL: this is a technically correct sequential RUN CYCLE, not eight similar illustrations with the same leg pose. Exactly TWO arms and TWO legs in every frame. Both boots must be visible and must CHANGE poses. Near leg lighter brown, far leg darker brown, so leg identity remains trackable.
Read left to right, top row then bottom row:
Frame1 CONTACT A: NEAR leg extended FORWARD to the right, boot at ground; FAR leg stretched BACK to left, heel up.
Frame2 DOWN A: NEAR support knee BENT under forward torso; FAR knee bends and its boot lifts behind; body slightly down.
Frame3 PASS A: NEAR support leg almost vertical beneath hip, boot on ground; FAR thigh swings FORWARD and far knee raised, far boot tucked under butt. Narrow silhouette.
Frame4 FLIGHT A: NEAR leg extends BACK to left with toe lifting; FAR knee reaches FORWARD/right, shin folded; both boots above ground, body slightly up.
Frame5 CONTACT B: FAR leg extended FORWARD to right, boot at ground; NEAR leg stretched BACK left, heel up. This MUST look different from frame1 because the leg identities exchange.
Frame6 DOWN B: FAR support knee bent, NEAR rear boot rises, body slightly down.
Frame7 PASS B: FAR support leg vertical at ground, NEAR knee lifted FORWARD and boot tucked. Narrow silhouette.
Frame8 FLIGHT B: FAR leg pushes backward left; NEAR knee forward right, both boots airborne, body slightly up. This leads smoothly back into frame1.
Arms swing opposite the corresponding legs. Head remains steady and eyes face RIGHT in all frames. Scarf waves gently with inertia. Do not keep both legs in a wide split in every frame: frames3 and7 are narrow with one raised knee. Preserve exact regular 4x2 cell arrangement, no separator lines. Clear readable 2D game animation.

# Chest orientation and item grip

chest-closed-v3.png generated with ImageGen using chest-short-v2.png as reference. Requested one closed oak chest with the exact same narrow left side, broad front, gold straps and right/back hinges; transparent background, no character, lock or scenery. Original alpha preserved. Runtime registers the front box to the open scene's ground line and size.

Chest exit items use per-frame fist coordinates and the shared weapon grip renderer. The sprite's knuckles render over the item. Loot remains in the hand during the inventory stop. Held art preserves its source aspect ratio.

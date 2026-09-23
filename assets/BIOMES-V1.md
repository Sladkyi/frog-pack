# Система биомов и бесшовных фонов v1

В игру добавлено 5 новых высокодетализированных задних фонов (всего 6 уникальных биомов). Все фоны созданы в строгом соответствии с параметрами `forest-v2.png` (1774×887, пропорции 2:1, перспектива бегуна сбоку, базовая линия земли точно на высоте **y = 79%**).

---

## 1. Список биомов и распределение по волнам

| Индекс | Название биома | Исходный PNG | WebP (оптимизирован) | Волны | Атмосферные частицы |
|:---:|:---|:---|:---|:---:|:---|
| **0** | **Сумеречный Лес** | `forest-v2.png` | `forest-v2.webp` | 1–3 | Золотистые светлячки (`#f8edab85`) |
| **1** | **Грибная Чаща** | `bg-mushroom-v1.png` | `bg-mushroom-v1.webp` | 4–7 | Биолюминесцентные бирюзовые споры (`#67e8f990`) |
| **2** | **Древняя Роща** | `bg-autumn-v1.png` | `bg-autumn-v1.webp` | 8–10 | Медово-золотые парящие листья (`#fbbf2490`) |
| **3** | **Кристальный Разлом** | `bg-crystal-v1.png` | `bg-crystal-v1.webp` | 11–14 | Мерцающая кристаллическая пыль (`#38bdf895`) |
| **4** | **Огненные Пустоши** | `bg-ember-v1.png` | `bg-ember-v1.webp` | 15–17 | Восходящие огненные искры и пепел (`#ff602095`) |
| **5** | **Морозные Пики** | `bg-frost-v1.png` | `bg-frost-v1.webp` | 18–21 | Падающие снежинки и ледяной туман (`#e0f2fe95`) |

---

## 2. Бесшовность (горизонтальная и межбиомовая)

1. **Горизонтальный скроллинг без шва (`drawTiledBg`)**:
   - Используется техника зеркалирования четных/нечетных тайлов (`ctx.scale(-1, 1)`).
   - Точки соединения левого и правого края идеально совпадают по высоте тропы (y=79%) и фоновой освещенности, исключая вертикальные швы при бесконечном беге.
2. **Бесшовная плавная смена биомов (Cross-Fade Blend)**:
   - При переходе между волнами активируется интерполятор `state.biomeBlend` (от 0.0 до 1.0) с функцией сглаживания `smoothstep(t) = t * t * (3 - 2 * t)`.
   - Входящий биом накладывается поверх текущего с плавно нарастающей прозрачностью. Благодаря одинаковой базовой линии земли персонаж не прыгает и не проваливается.
   - Атмосферные частицы (споры, искры, снег, светлячки) плавно перетекают из одной плотности, размера и цвета в другие.

---

## 3. Промпты для AI-генерации (при сбросе квоты Google API)

Если потребуется сгенерировать альтернативные варианты через модель `gemini-3.1-flash-image` (после сброса 4-часового лимита API), подготовлены точные промпты:

### Биом 1: Грибная Чаща (Mushroom Thicket)
```text
Horizontally scrolling 2D side-view game background for a side-scrolling runner: Bioluminescent Mushroom Thicket / Fungal Forest. Exactly match the art style, proportions, camera angle, and perspective of forest-v2.png: crisp dark-brown ink outlines, clean rounded storybook shapes, soft painterly cel shading, warm mystical glow. Composition: wide 16:9 landscape, side-on camera at a small character eye level (NOT top-down). A flat straight horizontal dirt/moss walking path extends from left to right along the bottom between y=78% and y=88% of image height, ground line at precisely y=79%, completely clear and flat for running characters. Background features magnificent giant glowing mushrooms with purple, teal, and amber caps, twisted mossy tree trunks, glowing spore particles floating in the air, soft layers of distant misty forest canopy. Low contrast and open in the lower-middle combat area. Seamless horizontal edges. Opaque full image, no text, no UI, no characters.
```

### Биом 2: Древняя Роща (Golden Autumn Grove)
```text
Horizontally scrolling 2D side-view game background for a side-scrolling runner: Ancient Golden Autumn Grove. Exactly match the art style, proportions, camera angle, and perspective of forest-v2.png: crisp dark-brown ink outlines, clean rounded storybook shapes, rich amber, copper-orange and honey-gold canopy, soft sunbeam shafts breaking through autumn oak branches. Flat horizontal sandy earth path at precisely y=79% height. Low contrast combat area, seamless horizontal edges. Opaque full image.
```

### Биом 3: Кристальный Разлом (Crystal Chasm / Cavern)
```text
Horizontally scrolling 2D side-view game background for a side-scrolling runner: Subterranean Crystal Chasm. Dark midnight navy and slate rocky cavern ceiling, luminous turquoise, aquamarine and amethyst crystals jutting from cave walls and trunks with bright glowing refractions. Crushed crystal pebble flat running path at y=79% height. Floating sparkling mineral dust. Seamless horizontal edges. Opaque full image.
```

### Биом 4: Огненные Пустоши (Volcanic Ember Ruins)
```text
Horizontally scrolling 2D side-view game background for a side-scrolling runner: Volcanic Ember Crags and Molten Ancient Ruins. Charcoal obsidian jagged rocks, dark smoky sky with deep crimson and fiery orange horizon glow, subtle magma fissures glowing in distant cracks. Dark soot-grey stone flat trail at y=79% height. Floating glowing orange ember motes. Seamless horizontal edges. Opaque full image.
```

### Биом 5: Морозные Пики (Frost Peaks / Glacial Pines)
```text
Horizontally scrolling 2D side-view game background for a side-scrolling runner: Frosty Arctic Pine Forest. Pale cyan and silver twilight sky with gentle aurora borealis hint, snow-dusted heavy pine branches, icicles, crisp clean winter chill. Packed snow and ice flat running trail at y=79% height. Gentle drifting snowflakes and ice crystals. Seamless horizontal edges. Opaque full image.
```

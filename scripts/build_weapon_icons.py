#!/usr/bin/env python3
"""
Generates weapon-icons.js containing dedicated storybook SVG vector icons
for all 52 weapons + gear + chest in PACK / RUN.
Matches the storybook ink outline and 2-tone warm cel-shading aesthetic.
"""
import os
import json

TARGET_FILE = os.path.join(os.path.dirname(__file__), '..', 'weapon-icons.js')

ICONS = {
    # === 13 BASE WEAPONS ===
    'shuriken': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M32 6 L38 24 L56 18 L42 32 L58 38 L40 44 L46 62 L32 48 L18 62 L24 44 L6 38 L22 32 L8 18 L26 24 Z" fill="#94a3b8"/>
            <path d="M32 10 L36 25 L40 32 L32 32 Z" fill="#e2e8f0"/>
            <path d="M54 20 L41 33 L32 32 L40 25 Z" fill="#cbd5e1"/>
            <path d="M44 43 L33 46 L32 32 L41 33 Z" fill="#64748b"/>
            <path d="M18 60 L25 43 L32 32 L22 46 Z" fill="#475569"/>
            <path d="M8 38 L23 33 L32 32 L25 25 Z" fill="#94a3b8"/>
            <circle cx="32" cy="32" r="6" fill="#f59e0b"/>
            <circle cx="32" cy="32" r="3" fill="#23170f"/>
            <circle cx="30" cy="30" r="1.2" fill="#fef08a"/>
        </g>
    ''',

    'axe': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Haft -->
            <path d="M14 54 L46 16" stroke="#78350f" stroke-width="5"/>
            <path d="M14 54 L46 16" stroke="#23170f" stroke-width="5" stroke-dasharray="2 6"/>
            <path d="M12 56 L16 52" stroke="#d97706" stroke-width="3"/>
            <!-- Axe Head -->
            <path d="M42 20 C48 10 56 12 58 14 C56 22 56 28 58 36 C54 38 46 40 40 30 Z" fill="#ea580c"/>
            <path d="M44 21 C50 14 55 15 57 16 C55 23 55 27 57 34 C53 35 47 37 42 29 Z" fill="#f97316"/>
            <path d="M52 17 C51 22 51 28 53 33 C50 33 47 31 46 25 Z" fill="#ffedd5"/>
            <!-- Back spike -->
            <path d="M38 18 L26 22 L34 26 Z" fill="#78716c"/>
            <!-- Socket band -->
            <rect x="36" y="20" width="8" height="9" rx="2" transform="rotate(-40 40 24)" fill="#d97706"/>
        </g>
    ''',

    'wand': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Staff Shaft -->
            <path d="M16 56 Q28 38 42 18" stroke="#854d0e" stroke-width="4.5"/>
            <path d="M16 56 Q28 38 42 18" stroke="#a16207" stroke-width="2" fill="none"/>
            <!-- Grip wrap -->
            <path d="M22 46 L26 43 M25 42 L29 39 M28 38 L32 35" stroke="#fef08a" stroke-width="2"/>
            <!-- Head Mount -->
            <path d="M38 22 C40 16 48 16 50 20 C48 24 42 26 38 22 Z" fill="#d97706"/>
            <!-- Arcane Crystal / Orb -->
            <circle cx="46" cy="16" r="9" fill="#8b5cf6"/>
            <circle cx="44" cy="14" r="7" fill="#a78bfa"/>
            <circle cx="43" cy="13" r="3" fill="#ede9fe"/>
            <!-- Sparkles -->
            <path d="M46 3 L47 6 L50 7 L47 8 L46 11 L45 8 L42 7 L45 6 Z" fill="#fef08a" stroke="#d97706" stroke-width="0.8"/>
            <path d="M58 14 L59 16 L61 17 L59 18 L58 20 L57 18 L55 17 L57 16 Z" fill="#c084fc" stroke="#7e22ce" stroke-width="0.8"/>
            <circle cx="34" cy="12" r="1.5" fill="#fef08a"/>
        </g>
    ''',

    'storm': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Hovering Crystal -->
            <polygon points="32,8 48,22 42,50 32,58 22,50 16,22" fill="#0284c7"/>
            <polygon points="32,8 48,22 36,36 32,58 32,8" fill="#38bdf8"/>
            <polygon points="32,8 36,36 28,36" fill="#e0f2fe"/>
            <polygon points="22,50 32,58 36,36" fill="#0369a1"/>
            <!-- Electric lightning bolts -->
            <path d="M24 12 L14 26 L22 28 L12 44" fill="none" stroke="#facc15" stroke-width="2.6"/>
            <path d="M42 16 L52 28 L44 30 L54 46" fill="none" stroke="#facc15" stroke-width="2.6"/>
            <path d="M24 12 L14 26 L22 28 L12 44" fill="none" stroke="#ffffff" stroke-width="1.2"/>
            <path d="M42 16 L52 28 L44 30 L54 46" fill="none" stroke="#ffffff" stroke-width="1.2"/>
            <circle cx="32" cy="32" r="4" fill="#ffffff" opacity="0.6"/>
        </g>
    ''',

    'blade': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Hilt & Pommel -->
            <circle cx="14" cy="52" r="4" fill="#d97706"/>
            <path d="M16 50 L24 42" stroke="#78350f" stroke-width="4.5"/>
            <!-- Guard -->
            <path d="M18 40 C22 41 27 46 28 48 C27 43 28 37 24 34 Z" fill="#f59e0b"/>
            <!-- Curved Scimitar Blade -->
            <path d="M25 38 C32 30 42 18 54 10 C50 20 44 34 31 43 Z" fill="#e2e8f0"/>
            <path d="M25 38 C32 30 42 18 54 10 C48 18 42 28 31 43 Z" fill="#ffffff"/>
            <!-- Gold fuller line -->
            <path d="M28 36 C34 28 42 20 48 14" fill="none" stroke="#f59e0b" stroke-width="1.4"/>
            <!-- Sparkle glint -->
            <path d="M53 11 L55 7 L57 11 L61 13 L57 15 L55 19 L53 15 L49 13 Z" fill="#fef08a" stroke="#d97706" stroke-width="0.8"/>
        </g>
    ''',

    'bow': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Bow Limb -->
            <path d="M14 16 C30 10 46 22 52 46 C40 40 24 44 14 16 Z" fill="#854d0e"/>
            <path d="M14 16 C28 12 42 22 50 44" fill="none" stroke="#a16207" stroke-width="2"/>
            <!-- Bowstring -->
            <path d="M14 16 L52 46" fill="none" stroke="#e2e8f0" stroke-width="1.6"/>
            <!-- Nocked Arrow -->
            <path d="M46 16 L22 40" stroke="#78350f" stroke-width="2.5"/>
            <polygon points="46,16 48,22 42,20" fill="#10b981"/>
            <polygon points="46,16 52,18 48,22" fill="#34d399"/>
            <!-- Arrow tip -->
            <polygon points="20,42 16,46 22,46" fill="#94a3b8"/>
            <!-- Wrapped grip -->
            <rect x="30" y="24" width="6" height="8" rx="2" transform="rotate(35 33 28)" fill="#15803d"/>
        </g>
    ''',

    'spear': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Shaft -->
            <path d="M10 54 L48 16" stroke="#854d0e" stroke-width="4"/>
            <path d="M10 54 L48 16" stroke="#a16207" stroke-width="1.8"/>
            <!-- Spearhead socket -->
            <rect x="44" y="16" width="6" height="5" transform="rotate(-45 47 18)" fill="#d97706"/>
            <!-- Jade Spearhead -->
            <path d="M46 20 L58 8 L52 26 Z" fill="#059669"/>
            <path d="M46 20 L58 8 L56 16 Z" fill="#34d399"/>
            <path d="M58 8 L54 12" stroke="#ffffff" stroke-width="1.2"/>
            <!-- Red silk tassels -->
            <path d="M45 22 C43 28 38 32 34 34 M45 22 C47 28 44 34 42 38" fill="none" stroke="#ef4444" stroke-width="2.2"/>
        </g>
    ''',

    'bomb': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Bomb Body -->
            <circle cx="30" cy="38" r="18" fill="#334155"/>
            <path d="M22 28 C26 25 32 26 34 29" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <circle cx="20" cy="34" r="2" fill="#ffffff"/>
            <!-- Collar -->
            <rect x="34" y="18" width="8" height="6" rx="1.5" transform="rotate(30 38 21)" fill="#d97706"/>
            <!-- Fuse -->
            <path d="M41 18 Q48 14 46 8" fill="none" stroke="#a16207" stroke-width="2.4"/>
            <!-- Spark -->
            <polygon points="46,8 48,2 50,7 56,8 51,11 53,16 47,13 42,15 44,10 39,8" fill="#facc15"/>
            <circle cx="47" cy="9" r="2.5" fill="#ef4444"/>
            <circle cx="47" cy="9" r="1" fill="#ffffff"/>
        </g>
    ''',

    'scythe': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Snath (handle) -->
            <path d="M14 56 C24 40 32 28 40 14" fill="none" stroke="#78350f" stroke-width="4.5"/>
            <path d="M14 56 C24 40 32 28 40 14" fill="none" stroke="#a16207" stroke-width="1.8"/>
            <!-- Grip pegs -->
            <rect x="22" y="42" width="7" height="3" rx="1" transform="rotate(15 25 43)" fill="#d97706"/>
            <!-- Collar mount -->
            <circle cx="40" cy="14" r="4" fill="#475569"/>
            <!-- Crescent Blade -->
            <path d="M38 16 C48 6 58 10 60 16 C54 26 46 32 30 32 C38 28 44 22 38 16 Z" fill="#64748b"/>
            <path d="M40 14 C48 7 56 10 59 15 C54 22 47 27 34 29 C40 25 45 20 40 14 Z" fill="#cbd5e1"/>
            <path d="M43 12 C48 9 54 11 57 14" stroke="#ffffff" stroke-width="1.4" fill="none"/>
        </g>
    ''',

    'hammer': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Handle -->
            <path d="M16 54 L36 28" stroke="#78350f" stroke-width="4.5"/>
            <path d="M16 54 L36 28" stroke="#a16207" stroke-width="1.8"/>
            <circle cx="15" cy="55" r="3" fill="#d97706"/>
            <!-- Stone Hammer Head -->
            <path d="M26 24 L48 10 L56 22 L34 36 Z" fill="#78716c"/>
            <path d="M26 24 L48 10 L44 6 L22 20 Z" fill="#a8a29e"/>
            <path d="M48 10 L56 22 L60 18 L52 6 Z" fill="#57534e"/>
            <!-- Iron band & Rune -->
            <path d="M33 18 L43 28" stroke="#f59e0b" stroke-width="2.5"/>
            <!-- Crack highlight -->
            <path d="M38 20 L40 24 L44 23" stroke="#fef08a" stroke-width="1.2" fill="none"/>
        </g>
    ''',

    'orb': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Background Glow Aura -->
            <circle cx="32" cy="32" r="16" fill="#38bdf8" opacity="0.3"/>
            <!-- Main Glass Orb -->
            <circle cx="32" cy="32" r="14" fill="#0284c7"/>
            <circle cx="30" cy="30" r="11" fill="#38bdf8"/>
            <circle cx="28" cy="28" r="7" fill="#7dd3fc"/>
            <!-- Specular Glint -->
            <ellipse cx="26" cy="25" rx="3.5" ry="2" transform="rotate(-30 26 25)" fill="#ffffff"/>
            <circle cx="38" cy="38" r="1.5" fill="#ffffff"/>
            <!-- Planetary Astral Ring -->
            <ellipse cx="32" cy="32" rx="20" ry="6" transform="rotate(-25 32 32)" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
            <ellipse cx="32" cy="32" rx="20" ry="6" transform="rotate(-25 32 32)" fill="none" stroke="#fef08a" stroke-width="1"/>
        </g>
    ''',

    'dagger': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Pommel & Hilt -->
            <circle cx="16" cy="50" r="3.5" fill="#d97706"/>
            <path d="M18 48 L26 40" stroke="#78350f" stroke-width="4"/>
            <!-- Crossguard -->
            <path d="M22 42 L30 34" stroke="#d97706" stroke-width="4.5" stroke-linecap="round"/>
            <circle cx="22" cy="42" r="1.5" fill="#fef08a"/>
            <circle cx="30" cy="34" r="1.5" fill="#fef08a"/>
            <!-- Stiletto Blade -->
            <path d="M27 37 L52 14 L41 33 Z" fill="#94a3b8"/>
            <path d="M27 37 L52 14 L37 23 Z" fill="#e2e8f0"/>
            <path d="M27 37 L52 14" stroke="#475569" stroke-width="1.2"/>
            <!-- Poison glint / drop -->
            <circle cx="50" cy="16" r="2" fill="#22c55e"/>
            <circle cx="53" cy="20" r="1.2" fill="#4ade80"/>
        </g>
    ''',

    'tome': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Book Cover -->
            <path d="M16 16 L44 12 C48 12 50 14 50 18 L46 50 C46 52 44 54 40 54 L14 52 C12 52 10 50 10 46 L14 18 C14 16 15 16 16 16 Z" fill="#6b21a8"/>
            <!-- Pages -->
            <path d="M44 16 L48 20 L44 50 L40 48 Z" fill="#fef3c7"/>
            <!-- Front Plate Cover -->
            <path d="M18 20 L42 16 L38 46 L16 48 Z" fill="#7e22ce"/>
            <!-- Golden Corner Protectors -->
            <polygon points="18,20 25,19 19,25" fill="#f59e0b"/>
            <polygon points="42,16 35,17 41,22" fill="#f59e0b"/>
            <polygon points="38,46 32,45 37,41" fill="#f59e0b"/>
            <polygon points="16,48 22,47 17,43" fill="#f59e0b"/>
            <!-- Mystic Rune -->
            <circle cx="29" cy="32" r="5.5" fill="none" stroke="#facc15" stroke-width="1.8"/>
            <path d="M29 25 L29 39 M23 32 L35 32" stroke="#facc15" stroke-width="1.6"/>
            <!-- Bookmark ribbon -->
            <path d="M28 46 L28 58 L32 54 L36 58 L36 46" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
        </g>
    ''',

    # === SCHOOL I: ELEMENTAL MAGIC (6) ===
    'frost_scepter': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 54 L38 28" stroke="#0284c7" stroke-width="4.5"/>
            <path d="M14 54 L38 28" stroke="#bae6fd" stroke-width="2"/>
            <circle cx="14" cy="54" r="3" fill="#38bdf8"/>
            <!-- Snowflake Crown -->
            <g transform="translate(42, 22)">
                <path d="M0 -14 L0 14 M-14 0 L14 0 M-10 -10 L10 10 M-10 10 L10 -10" stroke="#38bdf8" stroke-width="2.8"/>
                <path d="M0 -14 L0 14 M-14 0 L14 0 M-10 -10 L10 10 M-10 10 L10 -10" stroke="#ffffff" stroke-width="1.2"/>
                <circle cx="0" cy="0" r="4" fill="#e0f2fe"/>
                <circle cx="0" cy="0" r="2" fill="#0284c7"/>
            </g>
            <circle cx="48" cy="14" r="1.5" fill="#ffffff"/>
            <circle cx="34" cy="28" r="1.5" fill="#ffffff"/>
        </g>
    ''',

    'pyre_orb': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Fire Aura -->
            <circle cx="32" cy="34" r="15" fill="#b91c1c" opacity="0.3"/>
            <!-- Magma Core -->
            <circle cx="32" cy="34" r="13" fill="#7f1d1d"/>
            <!-- Molten Cracks -->
            <path d="M24 30 Q30 34 34 32 Q38 30 42 36" stroke="#f97316" stroke-width="3" fill="none"/>
            <path d="M30 24 Q32 32 30 42" stroke="#facc15" stroke-width="2.2" fill="none"/>
            <path d="M26 38 Q32 40 38 42" stroke="#ef4444" stroke-width="2" fill="none"/>
            <circle cx="31" cy="33" r="3" fill="#fef08a"/>
            <!-- Dancing Flame Tongues -->
            <path d="M20 24 C18 16 26 12 28 8 C30 14 36 12 34 20" fill="#f97316"/>
            <path d="M32 20 C34 10 44 8 44 4 C46 12 52 14 44 24" fill="#facc15"/>
            <path d="M14 32 C10 24 16 22 18 18 C20 24 22 26 18 32" fill="#ea580c"/>
        </g>
    ''',

    'tempest_tome': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Open Tome Wings -->
            <path d="M32 46 C24 44 14 46 8 44 L12 20 C18 22 26 20 32 24 Z" fill="#0284c7"/>
            <path d="M32 46 C40 44 50 46 56 44 L52 20 C46 22 38 20 32 24 Z" fill="#0369a1"/>
            <!-- Open Pages -->
            <path d="M32 44 C25 42 16 43 10 41 L14 22 C20 23 27 22 32 25 Z" fill="#e0f2fe"/>
            <path d="M32 44 C39 42 48 43 54 41 L50 22 C44 23 37 22 32 25 Z" fill="#f0f9ff"/>
            <!-- Spine -->
            <path d="M32 24 L32 46" stroke="#d97706" stroke-width="2.5"/>
            <!-- Whirling Wind Spirals -->
            <path d="M26 18 C26 12 34 10 36 14 C38 18 32 20 30 18" fill="none" stroke="#38bdf8" stroke-width="2.4"/>
            <path d="M36 12 C38 6 46 6 48 10 C50 14 44 16 42 13" fill="none" stroke="#7dd3fc" stroke-width="1.8"/>
        </g>
    ''',

    'astral_mirror': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Ornate Handle -->
            <path d="M20 54 L30 42" stroke="#d97706" stroke-width="5"/>
            <path d="M20 54 L30 42" stroke="#fde047" stroke-width="2"/>
            <circle cx="18" cy="56" r="3.5" fill="#f59e0b"/>
            <!-- Mirror Frame -->
            <circle cx="38" cy="26" r="16" fill="#f59e0b"/>
            <circle cx="38" cy="26" r="13" fill="#23170f"/>
            <!-- Baroque Filigree Crown -->
            <circle cx="38" cy="8" r="3.5" fill="#fde047"/>
            <circle cx="53" cy="18" r="2.5" fill="#fde047"/>
            <circle cx="23" cy="18" r="2.5" fill="#fde047"/>
            <!-- Cosmic Mirror Glass -->
            <circle cx="38" cy="26" r="11" fill="#4c1d95"/>
            <ellipse cx="38" cy="26" rx="9" ry="5" transform="rotate(-30 38 26)" fill="#c084fc" opacity="0.6"/>
            <!-- Starlight -->
            <polygon points="38,20 39,23 42,24 39,25 38,28 37,25 34,24 37,23" fill="#ffffff"/>
            <circle cx="43" cy="29" r="1.2" fill="#ffffff"/>
            <circle cx="33" cy="23" r="1" fill="#fef08a"/>
        </g>
    ''',

    'eclipse_censer': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Chains -->
            <path d="M32 6 L32 20 M24 8 L30 20 M40 8 L34 20" stroke="#94a3b8" stroke-width="1.8"/>
            <circle cx="32" cy="6" r="2.5" fill="#d97706"/>
            <!-- Censer Body -->
            <path d="M26 22 L38 22 L42 34 L32 44 L22 34 Z" fill="#334155"/>
            <path d="M26 22 L38 22 L40 32 L32 40 L24 32 Z" fill="#475569"/>
            <!-- Occult Eye / Slits -->
            <path d="M27 30 Q32 26 37 30 Q32 34 27 30 Z" fill="#818cf8"/>
            <circle cx="32" cy="30" r="2.5" fill="#312e81"/>
            <circle cx="32" cy="30" r="1" fill="#e0e7ff"/>
            <!-- Dark Purple Smoke Plumes -->
            <path d="M32 44 Q28 50 34 54 Q40 58 36 62" fill="none" stroke="#a855f7" stroke-width="2.5" opacity="0.7"/>
            <path d="M22 32 Q14 36 16 44 Q18 50 14 54" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.6"/>
        </g>
    ''',

    'supernova_scroll': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Parchment Roll -->
            <rect x="14" y="10" width="8" height="44" rx="3" fill="#d97706"/>
            <rect x="42" y="10" width="8" height="44" rx="3" fill="#d97706"/>
            <rect x="18" y="14" width="28" height="36" fill="#fef3c7"/>
            <rect x="18" y="16" width="28" height="32" fill="#fffbeb"/>
            <!-- Supernova Blast Core -->
            <polygon points="32,20 35,28 44,25 38,32 46,36 37,38 39,46 32,41 25,46 27,38 18,36 26,32 20,25 29,28" fill="#f43f5e"/>
            <circle cx="32" cy="32" r="5" fill="#fde047"/>
            <circle cx="32" cy="32" r="2.5" fill="#ffffff"/>
            <!-- Stardust rays -->
            <circle cx="23" cy="20" r="1.2" fill="#ea580c"/>
            <circle cx="41" cy="42" r="1.2" fill="#ea580c"/>
        </g>
    ''',

    # === SCHOOL II: HEAVY CRUSHERS (7) ===
    'titan_mace': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 54 L36 30" stroke="#78350f" stroke-width="5"/>
            <path d="M14 54 L36 30" stroke="#a16207" stroke-width="2"/>
            <circle cx="13" cy="55" r="4" fill="#57534e"/>
            <!-- Flanged Mace Head -->
            <path d="M34 32 L46 20 L54 28 L42 40 Z" fill="#78716c"/>
            <polygon points="46,20 54,12 58,22 54,28" fill="#a8a29e"/>
            <polygon points="46,20 40,12 48,8 54,12" fill="#cbd5e1"/>
            <polygon points="34,32 28,24 38,20 42,26" fill="#57534e"/>
            <polygon points="42,40 40,48 48,46 44,38" fill="#57534e"/>
            <!-- Center crown point -->
            <polygon points="54,12 60,6 62,14" fill="#e2e8f0"/>
        </g>
    ''',

    'chaos_flail': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Wooden Haft -->
            <path d="M10 56 L24 40" stroke="#78350f" stroke-width="5"/>
            <circle cx="10" cy="56" r="3" fill="#d97706"/>
            <!-- Chain Links -->
            <ellipse cx="27" cy="36" rx="3.5" ry="5" transform="rotate(-35 27 36)" fill="none" stroke="#64748b" stroke-width="2.5"/>
            <ellipse cx="33" cy="30" rx="3.5" ry="5" transform="rotate(25 33 30)" fill="none" stroke="#64748b" stroke-width="2.5"/>
            <ellipse cx="38" cy="24" rx="3.5" ry="5" transform="rotate(-40 38 24)" fill="none" stroke="#64748b" stroke-width="2.5"/>
            <!-- Spiked Morningstar Core -->
            <circle cx="46" cy="18" r="10" fill="#dc2626"/>
            <circle cx="44" cy="16" r="8" fill="#ef4444"/>
            <!-- Conical Spikes -->
            <polygon points="46,8 43,4 49,4" fill="#e2e8f0"/>
            <polygon points="56,18 61,15 61,21" fill="#e2e8f0"/>
            <polygon points="46,28 43,33 49,33" fill="#e2e8f0"/>
            <polygon points="36,18 31,15 31,21" fill="#e2e8f0"/>
            <polygon points="54,10 60,6 56,5" fill="#e2e8f0"/>
            <polygon points="54,26 60,29 57,31" fill="#e2e8f0"/>
            <circle cx="43" cy="15" r="2.5" fill="#fef08a"/>
        </g>
    ''',

    'earth_cleaver': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Grip -->
            <path d="M12 54 L22 42" stroke="#78350f" stroke-width="5"/>
            <circle cx="11" cy="55" r="3.5" fill="#92400e"/>
            <!-- Heavy Rock Cleaver Blade -->
            <path d="M20 44 L48 12 L58 18 L52 40 L30 50 Z" fill="#78716c"/>
            <path d="M24 42 L48 15 L55 20 L50 38 L32 46 Z" fill="#a8a29e"/>
            <!-- Chiseled Edge -->
            <polygon points="48,12 58,18 52,40 48,36" fill="#57534e"/>
            <!-- Amber Crystal Fissure Veins -->
            <path d="M30 44 L36 34 L44 32 L48 20" stroke="#f59e0b" stroke-width="2.5" fill="none"/>
            <path d="M36 34 L40 38 L48 36" stroke="#f59e0b" stroke-width="2" fill="none"/>
            <circle cx="36" cy="34" r="2" fill="#fef08a"/>
            <circle cx="44" cy="32" r="1.5" fill="#fef08a"/>
        </g>
    ''',

    'anvil_drop': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Anvil Horn & Face -->
            <path d="M12 24 L24 24 L28 20 L54 20 C56 20 58 22 56 26 L52 30 L48 30 L46 40 L52 44 L54 52 L14 52 L16 44 L22 40 L20 30 L10 28 C8 26 9 24 12 24 Z" fill="#64748b"/>
            <!-- Top Flat Table -->
            <path d="M28 20 L54 20 L52 26 L26 26 Z" fill="#cbd5e1"/>
            <!-- Red Hot Horn Tip -->
            <path d="M12 24 L20 24 L18 28 L10 28 Z" fill="#f97316"/>
            <!-- Runic Carving -->
            <path d="M30 36 L34 40 L38 36 M34 32 L34 44" stroke="#38bdf8" stroke-width="2" fill="none"/>
            <!-- Flying Sparks -->
            <circle cx="10" cy="18" r="1.5" fill="#facc15"/>
            <circle cx="18" cy="14" r="1.2" fill="#facc15"/>
            <circle cx="26" cy="12" r="1.5" fill="#f97316"/>
        </g>
    ''',

    'thunder_hammer': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Shaft -->
            <path d="M16 54 L36 28" stroke="#475569" stroke-width="5"/>
            <path d="M16 54 L36 28" stroke="#94a3b8" stroke-width="2"/>
            <!-- Hammer Head -->
            <rect x="30" y="14" width="22" height="18" rx="3" transform="rotate(-35 41 23)" fill="#0284c7"/>
            <rect x="32" y="16" width="18" height="14" rx="2" transform="rotate(-35 41 23)" fill="#38bdf8"/>
            <!-- Striking Plates -->
            <rect x="25" y="24" width="6" height="14" rx="1.5" transform="rotate(-35 28 31)" fill="#e0f2fe"/>
            <rect x="49" y="8" width="6" height="14" rx="1.5" transform="rotate(-35 52 15)" fill="#e0f2fe"/>
            <!-- Electric Arcs -->
            <path d="M22 20 L28 26 L24 32 L30 38" stroke="#facc15" stroke-width="2.4" fill="none"/>
            <path d="M46 4 L50 12 L44 16 L52 24" stroke="#facc15" stroke-width="2.4" fill="none"/>
            <path d="M46 4 L50 12 L44 16 L52 24" stroke="#ffffff" stroke-width="1.2" fill="none"/>
        </g>
    ''',

    'holy_flail': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Handle -->
            <path d="M12 56 L24 42" stroke="#854d0e" stroke-width="5"/>
            <circle cx="11" cy="57" r="3.5" fill="#f59e0b"/>
            <!-- Gold Links -->
            <circle cx="28" cy="38" r="3" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
            <circle cx="34" cy="32" r="3" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
            <circle cx="40" cy="26" r="3" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
            <!-- Radiant Holy Censer Ball -->
            <circle cx="48" cy="18" r="11" fill="#eab308"/>
            <circle cx="46" cy="16" r="9" fill="#fde047"/>
            <!-- Cutout Holy Cross -->
            <path d="M46 10 L46 22 M40 16 L52 16" stroke="#23170f" stroke-width="3" stroke-linecap="square"/>
            <path d="M46 10 L46 22 M40 16 L52 16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="square"/>
            <!-- Light Rays -->
            <path d="M48 4 L48 7 M62 18 L59 18 M57 9 L54 11 M57 27 L54 25" stroke="#f59e0b" stroke-width="2"/>
        </g>
    ''',

    'demon_axe': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Spine Handle -->
            <path d="M14 54 L44 18" stroke="#78350f" stroke-width="5"/>
            <path d="M14 54 L44 18" stroke="#d97706" stroke-width="2"/>
            <!-- Demon Jaw Axe Head -->
            <path d="M34 26 C40 10 56 8 60 14 C56 22 50 24 56 34 C48 38 40 34 34 26 Z" fill="#b91c1c"/>
            <path d="M36 24 C41 12 54 10 58 15 C54 21 49 23 54 31 C47 35 41 32 36 24 Z" fill="#ef4444"/>
            <!-- Demon Horn on top -->
            <path d="M46 12 C52 4 58 6 56 12 Z" fill="#f59e0b"/>
            <!-- Demon Eye -->
            <circle cx="44" cy="22" r="3.5" fill="#facc15"/>
            <circle cx="44" cy="22" r="1.5" fill="#23170f"/>
            <!-- Sharp Fangs -->
            <polygon points="46,27 48,33 50,28" fill="#ffffff"/>
            <polygon points="51,26 53,32 55,27" fill="#ffffff"/>
            <polygon points="52,18 55,23 56,19" fill="#ffffff"/>
            <!-- Molten Cutting Edge -->
            <path d="M58 14 C55 21 50 23 55 33" stroke="#facc15" stroke-width="2.5" fill="none"/>
            <!-- Fire plume -->
            <path d="M58 14 Q63 8 59 4 Q55 8 56 14" fill="#f97316"/>
        </g>
    ''',

    # === SCHOOL III: BLADES & SWORDS (6) ===
    'gale_katana': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Tsuka (Hilt) -->
            <path d="M12 54 L22 42" stroke="#047857" stroke-width="4.5"/>
            <path d="M12 54 L22 42" stroke="#facc15" stroke-width="1.8" stroke-dasharray="2 3"/>
            <!-- Tsuba (Guard) -->
            <ellipse cx="23" cy="41" rx="4.5" ry="2.5" transform="rotate(-45 23 41)" fill="#d97706"/>
            <!-- Curved Katana Blade -->
            <path d="M24 40 C32 28 42 16 56 8 C48 20 40 32 26 42 Z" fill="#e2e8f0"/>
            <path d="M24 40 C32 28 42 16 56 8 C50 18 42 28 26 42 Z" fill="#ffffff"/>
            <!-- Hamon (Temper Line) -->
            <path d="M27 39 Q34 30 38 24 Q44 18 53 10" stroke="#a7f3d0" stroke-width="1.4" fill="none"/>
            <!-- Wind Slash Trails -->
            <path d="M42 6 C48 10 54 18 56 26" stroke="#34d399" stroke-width="1.8" fill="none" opacity="0.8"/>
        </g>
    ''',

    'needle_rapier': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Pommel & Grip -->
            <circle cx="12" cy="54" r="3" fill="#94a3b8"/>
            <path d="M14 52 L18 46" stroke="#475569" stroke-width="3.5"/>
            <!-- Swept Basket Guard -->
            <path d="M14 50 C12 42 20 38 24 42 C28 44 26 52 20 52" fill="none" stroke="#cbd5e1" stroke-width="2.4"/>
            <circle cx="21" cy="44" r="3.5" fill="#d97706"/>
            <!-- Needle Blade -->
            <path d="M20 44 L58 10" stroke="#e2e8f0" stroke-width="2.8"/>
            <path d="M20 44 L58 10" stroke="#ffffff" stroke-width="1.2"/>
            <!-- Tip glint -->
            <polygon points="58,10 56,6 60,6" fill="#ffffff"/>
            <circle cx="58" cy="10" r="1.5" fill="#38bdf8"/>
        </g>
    ''',

    'blood_falchion': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Hilt -->
            <circle cx="12" cy="54" r="3.5" fill="#450a0a"/>
            <path d="M14 52 L22 42" stroke="#78350f" stroke-width="4.5"/>
            <!-- Guard -->
            <path d="M18 44 L26 38" stroke="#d97706" stroke-width="4.5" stroke-linecap="round"/>
            <!-- Heavy Falchion Blade -->
            <path d="M22 40 L38 22 C46 16 56 18 58 24 C52 34 40 38 26 44 Z" fill="#991b1b"/>
            <path d="M24 38 L38 24 C44 19 52 20 55 24 C50 31 40 35 28 41 Z" fill="#dc2626"/>
            <!-- Blood Channel & Dripping -->
            <path d="M26 38 L44 24" stroke="#f87171" stroke-width="1.6"/>
            <path d="M46 32 C46 36 43 38 43 40 C44 40 47 38 47 32" fill="#ef4444"/>
            <circle cx="45" cy="42" r="1.2" fill="#ef4444"/>
        </g>
    ''',

    'glacial_estoc': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Ice Pommel & Grip -->
            <polygon points="12,56 16,52 14,48 10,52" fill="#0284c7"/>
            <path d="M14 50 L20 44" stroke="#0369a1" stroke-width="4"/>
            <!-- Ice Crossguard -->
            <polygon points="14,46 24,36 28,40 18,50" fill="#38bdf8"/>
            <!-- Faceted Prism Ice Blade -->
            <polygon points="22,42 58,10 52,18 26,46" fill="#bae6fd"/>
            <polygon points="22,42 58,10 46,12 18,38" fill="#e0f2fe"/>
            <path d="M22 42 L58 10" stroke="#0284c7" stroke-width="1.2"/>
            <!-- Frost Sparkles -->
            <circle cx="50" cy="18" r="1.5" fill="#ffffff"/>
            <circle cx="40" cy="24" r="1.5" fill="#ffffff"/>
            <polygon points="58,10 61,8 60,11" fill="#ffffff"/>
        </g>
    ''',

    'void_greatsword': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Long Hilt -->
            <circle cx="10" cy="56" r="3.5" fill="#3b0764"/>
            <path d="M12 54 L22 42" stroke="#581c87" stroke-width="4.5"/>
            <!-- Greatsword Crossguard -->
            <path d="M16 46 L28 36" stroke="#9333ea" stroke-width="5" stroke-linecap="round"/>
            <!-- Split Zweihander Blade -->
            <path d="M22 40 L50 14 L56 18 L32 44 Z" fill="#2e1065"/>
            <path d="M24 38 L48 14 L52 16 L28 42 Z" fill="#4c1d95"/>
            <!-- Void Rift Center -->
            <path d="M26 38 L48 16" stroke="#c084fc" stroke-width="2.2"/>
            <ellipse cx="38" cy="26" rx="8" ry="2" transform="rotate(-40 38 26)" fill="#a855f7" opacity="0.6"/>
            <!-- Cosmic Void Stars -->
            <circle cx="36" cy="27" r="1.2" fill="#ffffff"/>
            <circle cx="42" cy="22" r="1" fill="#ffffff"/>
            <circle cx="31" cy="33" r="0.8" fill="#e9d5ff"/>
        </g>
    ''',

    'bone_scythe': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Vertebrae Spine Handle -->
            <path d="M14 56 C22 42 28 32 38 18" stroke="#d6d3d1" stroke-width="5"/>
            <circle cx="18" cy="48" r="3" fill="#a8a29e"/>
            <circle cx="25" cy="38" r="3" fill="#a8a29e"/>
            <circle cx="32" cy="28" r="3" fill="#a8a29e"/>
            <!-- Dragon Rib Scythe Blade -->
            <path d="M36 20 C46 8 58 12 60 18 C52 26 44 32 30 30 C36 26 40 22 36 20 Z" fill="#e7e5e4"/>
            <path d="M38 18 C46 9 56 12 58 17 C50 23 44 28 33 27 Z" fill="#fafaf9"/>
            <!-- Sinew bindings -->
            <path d="M35 18 L38 24 M37 17 L40 23" stroke="#b91c1c" stroke-width="1.8"/>
            <!-- Sharp Bone serrations -->
            <polygon points="46,20 48,24 45,23" fill="#a8a29e"/>
            <polygon points="52,18 54,21 51,20" fill="#a8a29e"/>
        </g>
    ''',

    # === SCHOOL IV: RANGED & THROWN (6) ===
    'siege_crossbow': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Tiller / Stock -->
            <path d="M16 50 L42 24" stroke="#78350f" stroke-width="6"/>
            <path d="M16 50 L42 24" stroke="#a16207" stroke-width="2"/>
            <!-- Steel Prod (Bow Arms) -->
            <path d="M26 14 C36 22 46 32 54 42" stroke="#475569" stroke-width="4.5" fill="none"/>
            <path d="M26 14 C36 22 46 32 54 42" stroke="#94a3b8" stroke-width="2" fill="none"/>
            <!-- Bowstring -->
            <path d="M26 14 L34 32 L54 42" stroke="#e2e8f0" stroke-width="1.6" fill="none"/>
            <!-- Heavy Steel Bolt -->
            <path d="M34 32 L46 20" stroke="#f59e0b" stroke-width="3"/>
            <polygon points="46,20 52,16 48,22" fill="#ef4444"/>
            <!-- Stirrup Ring -->
            <circle cx="46" cy="20" r="4.5" fill="none" stroke="#64748b" stroke-width="2.4"/>
        </g>
    ''',

    'flame_hatchets': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Crossed Hatchet 1 -->
            <path d="M16 50 L44 18" stroke="#78350f" stroke-width="4"/>
            <path d="M36 22 C42 16 48 18 50 20 C46 26 44 28 38 28 Z" fill="#ea580c"/>
            <!-- Crossed Hatchet 2 -->
            <path d="M44 50 L16 18" stroke="#78350f" stroke-width="4"/>
            <path d="M24 22 C18 16 12 18 10 20 C14 26 16 28 22 28 Z" fill="#ea580c"/>
            <!-- Fire Aura -->
            <path d="M44 14 Q52 10 50 18 Q46 22 48 24" stroke="#facc15" stroke-width="2.2" fill="none"/>
            <path d="M16 14 Q8 10 10 18 Q14 22 12 24" stroke="#facc15" stroke-width="2.2" fill="none"/>
            <circle cx="30" cy="34" r="3" fill="#d97706"/>
        </g>
    ''',

    'storm_javelin': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Lightning Shaft -->
            <path d="M10 54 L26 38 L22 34 L38 18 L34 14 L54 8" stroke="#0284c7" stroke-width="4" fill="none"/>
            <path d="M10 54 L26 38 L22 34 L38 18 L34 14 L54 8" stroke="#7dd3fc" stroke-width="2" fill="none"/>
            <path d="M10 54 L26 38 L22 34 L38 18 L34 14 L54 8" stroke="#ffffff" stroke-width="1" fill="none"/>
            <!-- Javelin Head -->
            <polygon points="54,8 60,6 56,12" fill="#facc15"/>
            <!-- Electric Feathers -->
            <path d="M12 52 L6 50 M14 50 L12 44" stroke="#38bdf8" stroke-width="2.2"/>
            <!-- Discharge Spark -->
            <circle cx="36" cy="16" r="2.5" fill="#fef08a"/>
        </g>
    ''',

    'solar_bow': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Golden Winged Bow -->
            <path d="M12 18 C28 8 46 16 54 44 C42 42 26 40 12 18 Z" fill="#eab308"/>
            <!-- Wing feathers on limbs -->
            <path d="M16 16 C12 10 18 8 22 14 M48 40 C52 46 48 50 44 46" stroke="#ca8a04" stroke-width="2"/>
            <!-- Sunbeam string -->
            <path d="M12 18 L54 44" stroke="#fef08a" stroke-width="1.8"/>
            <!-- Solar Arrow -->
            <path d="M48 16 L22 40" stroke="#facc15" stroke-width="3"/>
            <polygon points="48,16 54,12 50,20" fill="#f97316"/>
            <circle cx="50" cy="16" r="2" fill="#ffffff"/>
            <!-- Central Sun Emblem -->
            <circle cx="34" cy="28" r="5" fill="#f59e0b"/>
            <circle cx="34" cy="28" r="2.5" fill="#ffffff"/>
        </g>
    ''',

    'crescent_boomerang': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Curved Boomerang Body -->
            <path d="M14 42 C16 26 28 14 44 14 C36 20 28 28 26 44 C22 46 16 46 14 42 Z" fill="#a8a29e"/>
            <path d="M16 40 C18 28 28 18 42 16 C35 21 28 29 26 41 Z" fill="#e2e8f0"/>
            <!-- Tribal Notches -->
            <path d="M22 28 L27 30 M26 24 L31 26 M30 20 L35 22" stroke="#0284c7" stroke-width="2"/>
            <!-- Aerodynamic Slipstream -->
            <path d="M44 14 C52 18 56 26 54 36" stroke="#38bdf8" stroke-width="2" stroke-dasharray="2 3" fill="none"/>
            <circle cx="16" cy="42" r="2" fill="#f59e0b"/>
            <circle cx="44" cy="14" r="2" fill="#f59e0b"/>
        </g>
    ''',

    'phantom_barrage': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Spectral Bow -->
            <path d="M14 18 C30 10 46 22 52 46 C40 40 24 44 14 18 Z" fill="#7e22ce" opacity="0.8"/>
            <path d="M14 18 C28 12 42 22 50 44" stroke="#c084fc" stroke-width="2.4" fill="none"/>
            <!-- Ethereal String -->
            <path d="M14 18 L52 46" stroke="#e9d5ff" stroke-width="1.6"/>
            <!-- 3 Phantom Arrows -->
            <path d="M48 14 L24 38" stroke="#a855f7" stroke-width="2.2"/>
            <polygon points="48,14 52,12 49,18" fill="#e9d5ff"/>
            <path d="M44 10 L20 34" stroke="#c084fc" stroke-width="2"/>
            <polygon points="44,10 48,8 45,14" fill="#e9d5ff"/>
            <path d="M52 18 L28 42" stroke="#c084fc" stroke-width="2"/>
            <polygon points="52,18 56,16 53,22" fill="#e9d5ff"/>
            <circle cx="34" cy="28" r="2" fill="#f5d0fe"/>
        </g>
    ''',

    # === SCHOOL V: POLEARMS (7) ===
    'guardian_halberd': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Shaft -->
            <path d="M12 56 L46 22" stroke="#64748b" stroke-width="4.5"/>
            <path d="M12 56 L46 22" stroke="#cbd5e1" stroke-width="1.8"/>
            <!-- Halberd Spearhead -->
            <polygon points="46,22 58,10 50,26" fill="#e2e8f0"/>
            <!-- Axe Blade -->
            <path d="M44 24 C50 18 56 22 56 26 C52 32 46 34 40 30 Z" fill="#94a3b8"/>
            <!-- Rear Armor Hook -->
            <path d="M42 20 L34 22 L38 26 Z" fill="#475569"/>
            <!-- Royal Banner Pennant -->
            <path d="M38 30 C34 38 30 42 24 44 L28 36 Z" fill="#2563eb"/>
            <polygon points="24,44 28,36 30,42" fill="#facc15"/>
        </g>
    ''',

    'tide_trident': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Shaft -->
            <path d="M14 56 L38 32" stroke="#0369a1" stroke-width="4.5"/>
            <circle cx="13" cy="57" r="3.5" fill="#38bdf8"/>
            <!-- Trident Base -->
            <path d="M32 38 L44 26" stroke="#0284c7" stroke-width="5" stroke-linecap="round"/>
            <!-- 3 Prongs -->
            <path d="M34 36 L44 14 M38 32 L54 16 M42 28 L58 22" stroke="#0ea5e9" stroke-width="3"/>
            <!-- Prong barbed tips -->
            <polygon points="44,14 47,8 43,10" fill="#38bdf8"/>
            <polygon points="54,16 60,10 55,13" fill="#e0f2fe"/>
            <polygon points="58,22 62,18 58,19" fill="#38bdf8"/>
            <!-- Water droplet splash -->
            <circle cx="50" cy="10" r="1.5" fill="#bae6fd"/>
            <circle cx="58" cy="14" r="1.2" fill="#bae6fd"/>
        </g>
    ''',

    'dragon_pike': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Scaled Shaft -->
            <path d="M12 56 L42 26" stroke="#7c2d12" stroke-width="4.5"/>
            <path d="M12 56 L42 26" stroke="#d97706" stroke-width="2" stroke-dasharray="2 4"/>
            <!-- Bronze Dragon Head Socket -->
            <path d="M38 30 L48 20 C52 20 54 24 52 28 C48 32 44 32 38 30 Z" fill="#b45309"/>
            <circle cx="46" cy="22" r="1.8" fill="#facc15"/>
            <!-- Dragon Fire Breath Spear -->
            <polygon points="48,20 62,6 52,28" fill="#ea580c"/>
            <polygon points="48,20 62,6 56,16" fill="#facc15"/>
            <polygon points="52,12 60,8 56,16" fill="#ffffff"/>
        </g>
    ''',

    'moon_glaive': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Center Staff -->
            <path d="M20 44 L44 20" stroke="#312e81" stroke-width="4.5"/>
            <circle cx="32" cy="32" r="4.5" fill="#818cf8"/>
            <!-- Top Crescent Moon Blade -->
            <path d="M40 24 C44 12 54 8 58 12 C52 20 46 26 40 24 Z" fill="#c7d2fe"/>
            <path d="M42 22 C45 14 52 10 56 13 C51 18 46 22 42 22 Z" fill="#ffffff"/>
            <!-- Bottom Crescent Moon Blade -->
            <path d="M24 40 C20 52 10 56 6 52 C12 44 18 38 24 40 Z" fill="#c7d2fe"/>
            <path d="M22 42 C19 50 12 54 8 51 C13 46 18 42 22 42 Z" fill="#ffffff"/>
            <!-- Lunar Glow Stars -->
            <circle cx="56" cy="20" r="1.5" fill="#e0e7ff"/>
            <circle cx="8" cy="44" r="1.5" fill="#e0e7ff"/>
        </g>
    ''',

    'spirit_lance': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Spectral Shaft -->
            <path d="M12 54 L44 22" stroke="#0284c7" stroke-width="4.5" opacity="0.8"/>
            <path d="M12 54 L44 22" stroke="#7dd3fc" stroke-width="2"/>
            <!-- Ghost Lance Blade -->
            <polygon points="44,22 58,8 48,26" fill="#38bdf8"/>
            <polygon points="44,22 58,8 54,16" fill="#e0f2fe"/>
            <!-- Spirit Wisps orbiting -->
            <circle cx="36" cy="24" r="3.5" fill="#7dd3fc" opacity="0.8"/>
            <circle cx="36" cy="24" r="1.5" fill="#ffffff"/>
            <circle cx="26" cy="40" r="2.5" fill="#7dd3fc" opacity="0.8"/>
            <circle cx="48" cy="16" r="2.5" fill="#7dd3fc" opacity="0.8"/>
        </g>
    ''',

    'thunder_halberd': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Shaft -->
            <path d="M12 54 L42 24" stroke="#0369a1" stroke-width="4.5"/>
            <!-- Storm Halberd Fork -->
            <path d="M38 28 L48 18" stroke="#f59e0b" stroke-width="4"/>
            <!-- Left & Right Lightning Rods -->
            <path d="M42 24 L48 8 L44 22" stroke="#38bdf8" stroke-width="2.8" fill="none"/>
            <path d="M44 22 L60 16 L48 26" stroke="#38bdf8" stroke-width="2.8" fill="none"/>
            <!-- Ball Lightning Sphere in fork -->
            <circle cx="46" cy="20" r="6" fill="#0284c7"/>
            <circle cx="46" cy="20" r="4" fill="#38bdf8"/>
            <circle cx="46" cy="20" r="2" fill="#ffffff"/>
            <!-- Electric zig-zag arcs -->
            <path d="M46 14 L50 8 L54 12" stroke="#facc15" stroke-width="1.8" fill="none"/>
            <path d="M40 24 L34 26 L38 32" stroke="#facc15" stroke-width="1.8" fill="none"/>
        </g>
    ''',

    'phoenix_lance': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Gold Shaft -->
            <path d="M12 54 L44 22" stroke="#b45309" stroke-width="4.5"/>
            <path d="M12 54 L44 22" stroke="#fde047" stroke-width="2"/>
            <!-- Phoenix Wings Crossguard -->
            <path d="M36 30 C30 26 28 18 32 14 C36 20 40 24 44 22" fill="#f97316"/>
            <path d="M44 22 C48 26 52 30 58 26 C54 22 46 20 42 16" fill="#f97316"/>
            <!-- Solar Lance Tip -->
            <polygon points="42,24 60,6 48,30" fill="#ef4444"/>
            <polygon points="42,24 60,6 54,16" fill="#facc15"/>
            <polygon points="48,16 58,8 54,16" fill="#ffffff"/>
            <!-- Flame plume trail -->
            <circle cx="48" cy="8" r="1.5" fill="#fef08a"/>
            <circle cx="34" cy="18" r="1.5" fill="#f97316"/>
        </g>
    ''',

    # === SCHOOL VI: ARTIFACTS & RELICS (7) ===
    'acid_flask': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Cork Stopper & Neck -->
            <rect x="28" y="10" width="8" height="6" rx="1.5" fill="#a16207"/>
            <path d="M29 16 L29 22 L35 22 L35 16" stroke="#94a3b8" stroke-width="2" fill="#cbd5e1"/>
            <!-- Round Glass Bottle -->
            <circle cx="32" cy="38" r="16" fill="#d9f99d" opacity="0.4"/>
            <circle cx="32" cy="38" r="16" fill="none" stroke="#23170f" stroke-width="2.5"/>
            <!-- Corrosive Lime Acid -->
            <path d="M18 42 C22 36 28 44 32 40 C36 36 42 42 46 40 C46 48 38 52 32 52 C26 52 18 48 18 42 Z" fill="#84cc16"/>
            <circle cx="28" cy="44" r="2.5" fill="#bef264"/>
            <circle cx="36" cy="42" r="3.5" fill="#65a30d"/>
            <circle cx="35" cy="41" r="1.5" fill="#d9f99d"/>
            <!-- Rising Bubbles -->
            <circle cx="32" cy="28" r="2" fill="#84cc16"/>
            <circle cx="26" cy="32" r="1.5" fill="#a3e635"/>
            <circle cx="38" cy="34" r="1.2" fill="#a3e635"/>
        </g>
    ''',

    'plague_censer': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Chain -->
            <path d="M32 8 L32 20" stroke="#78716c" stroke-width="2.5"/>
            <circle cx="32" cy="8" r="2.5" fill="#a8a29e"/>
            <!-- Skull Censer Body -->
            <path d="M22 24 C22 18 42 18 42 24 L44 36 C44 42 38 46 32 46 C26 46 20 42 20 36 Z" fill="#4d7c0f"/>
            <path d="M24 26 C24 20 40 20 40 26 L42 36 C42 40 37 44 32 44 C27 44 22 40 22 36 Z" fill="#65a30d"/>
            <!-- Hollow Eye Sockets (Vents) -->
            <circle cx="27" cy="32" r="3" fill="#23170f"/>
            <circle cx="37" cy="32" r="3" fill="#23170f"/>
            <!-- Green Poison Spores Smoke -->
            <path d="M27 32 Q20 24 16 18 Q22 12 28 14" stroke="#84cc16" stroke-width="2.2" fill="none" opacity="0.8"/>
            <path d="M37 32 Q44 24 48 18 Q42 12 36 14" stroke="#84cc16" stroke-width="2.2" fill="none" opacity="0.8"/>
            <circle cx="20" cy="18" r="1.5" fill="#a3e635"/>
            <circle cx="44" cy="18" r="1.5" fill="#a3e635"/>
        </g>
    ''',

    'clockwork_trap': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Trap Base -->
            <ellipse cx="32" cy="40" rx="20" ry="10" fill="#78716c"/>
            <ellipse cx="32" cy="40" rx="16" ry="7" fill="#44403c"/>
            <!-- Interlocking Jagged Teeth Jaws -->
            <path d="M14 36 L18 24 L22 38 L26 22 L30 38 L34 22 L38 38 L42 24 L46 36 L50 24" stroke="#d97706" stroke-width="2.8" fill="none"/>
            <!-- Central Trip Plate & Gear -->
            <circle cx="32" cy="40" r="5" fill="#f59e0b"/>
            <circle cx="32" cy="40" r="2" fill="#23170f"/>
            <!-- Coiled Spring -->
            <path d="M22 42 Q32 46 42 42" stroke="#e2e8f0" stroke-width="2" fill="none"/>
        </g>
    ''',

    'magma_heart': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Living Rocky Volcanic Heart -->
            <path d="M32 54 C16 42 12 28 20 18 C26 10 32 16 32 20 C32 16 38 10 44 18 C52 28 48 42 32 54 Z" fill="#27272a"/>
            <!-- Molten Magma Cracks -->
            <path d="M22 24 Q32 30 30 46" stroke="#f97316" stroke-width="3" fill="none"/>
            <path d="M42 24 Q32 32 34 46" stroke="#ef4444" stroke-width="3" fill="none"/>
            <path d="M24 34 Q32 36 40 32" stroke="#facc15" stroke-width="2.2" fill="none"/>
            <!-- Pulsing Core -->
            <circle cx="32" cy="34" r="5" fill="#ea580c"/>
            <circle cx="32" cy="34" r="2.5" fill="#fef08a"/>
            <!-- Magma Drops -->
            <circle cx="32" cy="58" r="2" fill="#ea580c"/>
            <circle cx="32" cy="58" r="1" fill="#fef08a"/>
        </g>
    ''',

    'abyssal_eye': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Writhing Tentacles -->
            <path d="M18 46 C12 52 8 44 12 36 M46 46 C52 52 56 44 52 36 M32 50 C32 58 26 58 28 54 M20 18 C14 12 22 8 26 14 M44 18 C50 12 42 8 38 14" stroke="#581c87" stroke-width="4" stroke-linecap="round" fill="none"/>
            <!-- Eyeball Base -->
            <circle cx="32" cy="32" r="16" fill="#e9d5ff"/>
            <circle cx="32" cy="32" r="14" fill="#f5f3ff"/>
            <!-- Iris -->
            <circle cx="32" cy="32" r="9" fill="#9333ea"/>
            <circle cx="32" cy="32" r="6" fill="#7e22ce"/>
            <!-- Slitted Reptilian / Eldritch Pupil -->
            <ellipse cx="32" cy="32" rx="2" ry="7" fill="#0f172a"/>
            <!-- Arcane Glints -->
            <circle cx="28" cy="28" r="2" fill="#ffffff"/>
            <circle cx="35" cy="35" r="1" fill="#ffffff"/>
        </g>
    ''',

    'doomsday_bell': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Timber Framing Mount -->
            <rect x="22" y="8" width="20" height="6" rx="2" fill="#78350f"/>
            <circle cx="32" cy="11" r="2" fill="#d97706"/>
            <!-- Bronze Bell -->
            <path d="M26 14 C26 14 38 14 38 14 C40 26 48 36 50 44 L14 44 C16 36 24 26 26 14 Z" fill="#b45309"/>
            <path d="M28 16 C28 16 36 16 36 16 C38 26 45 35 47 42 L17 42 C19 35 26 26 28 16 Z" fill="#d97706"/>
            <!-- Lip & Clapper -->
            <rect x="12" y="42" width="40" height="6" rx="3" fill="#f59e0b"/>
            <circle cx="32" cy="48" r="4" fill="#78350f"/>
            <!-- Crack in Bell -->
            <path d="M30 22 L34 28 L32 34 L36 40" stroke="#23170f" stroke-width="1.8" fill="none"/>
            <!-- Acoustic Shockwaves -->
            <path d="M8 44 C6 38 6 30 10 24 M56 44 C58 38 58 30 54 24" stroke="#facc15" stroke-width="2" fill="none"/>
        </g>
    ''',

    'starfall_shard': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Prism Crystal Shard -->
            <polygon points="32,6 46,24 38,54 32,60 26,54 18,24" fill="#ec4899"/>
            <polygon points="32,6 46,24 36,36 32,60 32,6" fill="#f472b6"/>
            <polygon points="32,6 36,36 28,36" fill="#fbcfe8"/>
            <polygon points="26,54 32,60 36,36" fill="#be185d"/>
            <!-- Orbiting Miniature Meteoroids -->
            <circle cx="16" cy="38" r="3.5" fill="#9d174d"/>
            <circle cx="48" cy="22" r="2.5" fill="#f472b6"/>
            <circle cx="44" cy="48" r="2" fill="#f43f5e"/>
            <!-- Cosmic Glints -->
            <polygon points="32,6 34,12 30,12" fill="#ffffff"/>
            <circle cx="32" cy="36" r="3" fill="#ffffff" opacity="0.8"/>
            <path d="M12 28 Q24 22 36 24" stroke="#fde047" stroke-width="1.4" fill="none"/>
        </g>
    ''',

    # === GEAR & UTILITY ===
    'armor': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Pauldrons -->
            <path d="M10 24 C10 16 20 14 24 20 L20 30 Z" fill="#64748b"/>
            <path d="M54 24 C54 16 44 14 40 20 L44 30 Z" fill="#64748b"/>
            <!-- Cuirass Chestplate -->
            <path d="M22 18 C28 14 36 14 42 18 L46 36 C42 46 36 50 32 54 C28 50 22 46 18 36 Z" fill="#94a3b8"/>
            <path d="M24 20 C29 16 35 16 40 20 L43 35 C40 43 35 47 32 50 C29 47 24 43 21 35 Z" fill="#cbd5e1"/>
            <!-- Center Ridge & Gold Emblem -->
            <path d="M32 20 L32 50" stroke="#475569" stroke-width="2"/>
            <circle cx="32" cy="28" r="4.5" fill="#f59e0b"/>
            <circle cx="32" cy="28" r="2" fill="#fef08a"/>
        </g>
    ''',

    'boots': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Left Boot -->
            <path d="M16 20 L26 20 L26 36 L34 40 C36 44 34 50 28 50 L14 50 C12 44 14 36 16 20 Z" fill="#78350f"/>
            <path d="M18 22 L24 22 L24 35 L32 39 C34 43 32 48 27 48 L16 48 Z" fill="#a16207"/>
            <rect x="15" y="24" width="10" height="3" fill="#d97706"/>
            <!-- Wing Accent on Boot -->
            <path d="M14 24 C8 20 8 14 14 12 C16 16 18 20 16 26 Z" fill="#fef08a"/>
            <!-- Right Boot Offset -->
            <path d="M32 16 L42 16 L42 32 L50 36 C52 40 50 46 44 46 L30 46 C28 40 30 32 32 16 Z" fill="#92400e"/>
            <path d="M34 18 L40 18 L40 31 L48 35 C50 39 48 44 43 44 L32 44 Z" fill="#b45309"/>
            <path d="M42 20 C48 16 48 10 42 8 C40 12 38 16 40 22 Z" fill="#fde047"/>
        </g>
    ''',

    'chest': '''
        <g stroke="#23170f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Chest Base -->
            <rect x="12" y="28" width="40" height="24" rx="3" fill="#78350f"/>
            <rect x="14" y="30" width="36" height="20" rx="2" fill="#a16207"/>
            <!-- Chest Lid -->
            <path d="M10 28 C10 18 20 14 32 14 C44 14 54 18 54 28 Z" fill="#92400e"/>
            <path d="M12 26 C12 20 21 16 32 16 C43 16 52 20 52 26 Z" fill="#b45309"/>
            <!-- Gold / Iron Bands -->
            <rect x="20" y="15" width="5" height="37" fill="#f59e0b"/>
            <rect x="39" y="15" width="5" height="37" fill="#f59e0b"/>
            <!-- Keyhole Clasp -->
            <rect x="28" y="24" width="8" height="10" rx="2" fill="#d97706"/>
            <circle cx="32" cy="28" r="2" fill="#23170f"/>
            <rect x="31" y="28" width="2" height="4" fill="#23170f"/>
        </g>
    '''
}

def generate_js():
    js_content = """/**
 * PACK / RUN — 52 Weapons & Gear Storybook Vector Icon Engine
 * Hand-crafted storybook SVG icons matching the ink outline and 2-tone warm cel-shading style.
 */
(function (root) {
  'use strict';

  const ICONS = %s;

  function hasIcon(id) {
    return Boolean(ICONS[id]);
  }

  function getIconSvgBody(id) {
    return ICONS[id] || ICONS.shuriken;
  }

  function getWeaponIconSvg(id, opts = {}) {
    const size = opts.size || 40;
    const body = getIconSvgBody(id);
    const cls = opts.className ? `weapon-icon ${opts.className}` : 'weapon-icon';
    const borderRarity = opts.rarity || '';
    const style = opts.style || '';

    return `<svg class="${cls}" viewBox="0 0 64 64" width="${size}" height="${size}" style="${style}" aria-hidden="true">${body}</svg>`;
  }

  // Canvas rasterizer helper for drawing icons onto 2D canvas context
  const iconImageCache = {};

  function drawWeaponIconCanvas(ctx, id, x, y, size, callback) {
    if (!hasIcon(id)) return false;

    if (!iconImageCache[id]) {
      const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${getIconSvgBody(id)}</svg>`;
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        iconImageCache[id] = img;
        ctx.drawImage(img, x, y, size, size);
        if (callback) callback();
      };
      img.src = url;
      return true;
    }

    const cached = iconImageCache[id];
    if (cached.complete && cached.naturalWidth) {
      ctx.drawImage(cached, x, y, size, size);
      return true;
    }
    return false;
  }

  const WeaponIcons = {
    ICONS,
    hasIcon,
    getIconSvgBody,
    getWeaponIconSvg,
    drawWeaponIconCanvas
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeaponIcons;
  } else {
    root.WeaponIcons = WeaponIcons;
  }
})(typeof window !== 'undefined' ? window : globalThis);
""" % json.dumps({k: v.strip() for k, v in ICONS.items()}, indent=2)

    with open(TARGET_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Generated {TARGET_FILE} with {len(ICONS)} icons successfully.")

if __name__ == '__main__':
    generate_js()

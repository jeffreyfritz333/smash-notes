/**
 * Generate custom SVG tile icons for every SSBU roster character.
 * Each character gets a UNIQUE emblem and character-specific accent colors.
 *
 * Usage: node generate-icons.js
 * Output: images/icons/<CharacterName>.svg
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'images', 'icons');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ── Color utilities ──────────────────────────────────────────────

function hexToRgb(hex) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}
function rgbToHex({ r, g, b }) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
function darken(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r * (1 - amt), g: g * (1 - amt), b: b * (1 - amt) });
}
function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + (255 - r) * amt, g: g + (255 - g) * amt, b: b + (255 - b) * amt });
}

// ── Character-unique emblems ─────────────────────────────────────
// Each character gets their own recognizable shape, large & bold.
// All designed for a 200x200 viewBox.

const CHAR_EMBLEMS = {
  // ─── Mario Universe ─────────────────────────────
  'Mario': // Fireball
    `<circle cx="100" cy="88" r="36"/>
     <ellipse cx="72" cy="114" rx="18" ry="14" transform="rotate(-20 72 114)"/>
     <ellipse cx="58" cy="136" rx="12" ry="10" transform="rotate(-35 58 136)"/>
     <ellipse cx="128" cy="110" rx="16" ry="12" transform="rotate(25 128 110)"/>`,

  'Luigi': // Ghost (Boo silhouette from Luigi's Mansion)
    `<path d="M100 38c-38 0-60 28-60 62 0 16 6 30 16 40l-8 18 22-8c8 4 18 6 30 6s22-2 30-6l22 8-8-18c10-10 16-24 16-40 0-34-22-62-60-62z"/>
     <circle cx="82" cy="90" r="8" opacity="0.3"/>
     <circle cx="118" cy="90" r="8" opacity="0.3"/>`,

  'Peach': // Crown
    `<path d="M44 128l16-50 14 24 26-40 26 40 14-24 16 50z"/>
     <rect x="40" y="128" width="120" height="24" rx="6"/>
     <circle cx="100" cy="68" r="8"/>
     <circle cx="68" cy="92" r="6"/>
     <circle cx="132" cy="92" r="6"/>`,

  'Daisy': // 6-petal flower
    `<circle cx="100" cy="96" r="18"/>
     <ellipse cx="100" cy="56" rx="16" ry="22"/>
     <ellipse cx="135" cy="76" rx="16" ry="22" transform="rotate(60 135 76)"/>
     <ellipse cx="135" cy="116" rx="16" ry="22" transform="rotate(120 135 116)"/>
     <ellipse cx="100" cy="136" rx="16" ry="22"/>
     <ellipse cx="65" cy="116" rx="16" ry="22" transform="rotate(60 65 116)"/>
     <ellipse cx="65" cy="76" rx="16" ry="22" transform="rotate(120 65 76)"/>`,

  'Rosalina & Luma': // Star wand with sparkle
    `<polygon points="100,26 112,68 156,72 122,100 132,144 100,120 68,144 78,100 44,72 88,68"/>
     <circle cx="152" cy="42" r="10" opacity="0.5"/>
     <circle cx="160" cy="54" r="5" opacity="0.3"/>`,

  'Bowser': // Spiked shell (circle with triangular spikes)
    `<circle cx="100" cy="104" r="46"/>
     <polygon points="100,28 110,62 90,62"/>
     <polygon points="148,52 134,80 118,66" />
     <polygon points="160,100 130,100 138,82"/>
     <polygon points="52,52 66,80 82,66"/>
     <polygon points="40,100 70,100 62,82"/>
     <polygon points="142,140 126,118 138,108"/>
     <polygon points="58,140 74,118 62,108"/>`,

  'Bowser Jr.': // Paintbrush
    `<rect x="90" y="32" width="20" height="100" rx="4" transform="rotate(-15 100 82)"/>
     <ellipse cx="78" cy="142" rx="28" ry="20" transform="rotate(-15 78 142)"/>
     <circle cx="66" cy="148" r="10" opacity="0.4"/>
     <circle cx="88" cy="152" r="8" opacity="0.3"/>`,

  'Yoshi': // Egg with spots
    `<ellipse cx="100" cy="100" rx="52" ry="62"/>
     <circle cx="80" cy="80" r="14" opacity="0.25"/>
     <circle cx="118" cy="110" r="12" opacity="0.25"/>
     <circle cx="90" cy="126" r="10" opacity="0.2"/>`,

  'Dr. Mario': // Pill capsule
    `<rect x="58" y="60" width="84" height="40" rx="20"/>
     <rect x="100" y="60" width="42" height="40" rx="0" opacity="0.35"/>
     <rect x="72" y="110" width="56" height="40" rx="20"/>
     <rect x="100" y="110" width="28" height="40" rx="0" opacity="0.35"/>`,

  'Wario': // Garlic bulb
    `<ellipse cx="100" cy="108" rx="48" ry="42"/>
     <path d="M76 72c0-16 10-28 24-28s24 12 24 28" fill="none" stroke="currentColor" stroke-width="6" opacity="0.4"/>
     <line x1="100" y1="108" x2="100" y2="148" stroke="rgba(0,0,0,0.1)" stroke-width="3" fill="none"/>
     <ellipse cx="100" cy="60" rx="8" ry="12"/>`,

  'Piranha Plant': // Plant head in pipe
    `<rect x="66" y="118" width="68" height="42" rx="6"/>
     <rect x="60" y="114" width="80" height="12" rx="4" opacity="0.6"/>
     <ellipse cx="100" cy="80" rx="40" ry="36"/>
     <ellipse cx="100" cy="86" rx="28" ry="20" opacity="0.25"/>
     <polygon points="68,54 78,70 58,70"/>
     <polygon points="132,54 122,70 142,70"/>`,

  // ─── Zelda Universe ─────────────────────────────
  'Link': // Master Sword + Hylian Shield
    `<rect x="94" y="22" width="12" height="100" rx="3"/>
     <polygon points="100,18 90,38 110,38"/>
     <rect x="82" y="120" width="36" height="10" rx="3"/>
     <rect x="92" y="128" width="16" height="24" rx="3"/>
     <path d="M48 90l52-32 52 32v42c0 12-52 30-52 30s-52-18-52-30z" opacity="0.3"/>`,

  'Zelda': // Elegant triforce with crown accent
    `<polygon points="100,32 136,92 64,92"/>
     <polygon points="64,98 100,158 28,158"/>
     <polygon points="136,98 172,158 100,158"/>
     <circle cx="100" cy="32" r="8" opacity="0.5"/>`,

  'Sheik': // Sheikah eye symbol
    `<ellipse cx="100" cy="96" rx="58" ry="34"/>
     <circle cx="100" cy="96" r="18"/>
     <circle cx="100" cy="96" r="8" opacity="0.35"/>
     <path d="M100 130 L100 168" stroke="currentColor" stroke-width="6" fill="none" opacity="0.7"/>
     <polygon points="90,160 100,178 110,160" opacity="0.7"/>`,

  'Ganondorf': // Dark triforce with cracks
    `<polygon points="100,28 160,132 40,132"/>
     <polygon points="100,56 140,124 60,124" opacity="0.2"/>
     <line x1="100" y1="28" x2="100" y2="132" stroke="rgba(0,0,0,0.15)" stroke-width="3" fill="none"/>
     <line x1="52" y1="120" x2="148" y2="120" stroke="rgba(0,0,0,0.15)" stroke-width="3" fill="none"/>`,

  'Young Link': // Small Deku Shield
    `<path d="M100 36L154 72v48c0 24-54 48-54 48s-54-24-54-48V72z"/>
     <path d="M100 56L140 82v32c0 16-40 34-40 34s-40-18-40-34V82z" opacity="0.3"/>
     <circle cx="100" cy="94" r="12" opacity="0.25"/>`,

  'Toon Link': // Wind Waker baton swirl
    `<path d="M100 36 Q140 36 148 76 Q156 116 120 136 Q84 156 60 128 Q36 100 60 68 Q84 36 100 36z" fill="none" stroke="currentColor" stroke-width="10" opacity="0.85"/>
     <circle cx="100" cy="36" r="12"/>`,

  // ─── Pokemon ────────────────────────────────────
  'Pokemon Trainer': // Pokeball with cap brim
    `<path d="M38 100a62 62 0 0 1 124 0H130a30 30 0 0 0-60 0z"/>
     <path d="M38 100a62 62 0 0 0 124 0H130a30 30 0 0 1-60 0z" opacity="0.4"/>
     <circle cx="100" cy="100" r="14"/>
     <rect x="36" y="93" width="128" height="14" rx="7" opacity="0.55"/>
     <path d="M60 56 L140 56 L148 72 L52 72z" opacity="0.5"/>`,

  'Pikachu': // Lightning bolt tail
    `<polygon points="88,22 72,82 96,82 64,178 140,92 108,92 132,32"/>`,

  'Pichu': // Small lightning with heart
    `<polygon points="92,38 78,88 98,88 72,162 136,98 112,98 130,48"/>
     <path d="M88 160 Q100 142 112 160 Q100 178 88 160z" opacity="0.5"/>`,

  'Jigglypuff': // Round body with microphone
    `<circle cx="100" cy="90" r="52"/>
     <circle cx="78" cy="80" r="8" opacity="0.3"/>
     <circle cx="122" cy="80" r="8" opacity="0.3"/>
     <ellipse cx="100" cy="100" rx="6" ry="4" opacity="0.25"/>
     <rect x="120" y="130" width="10" height="34" rx="5" transform="rotate(20 125 147)"/>
     <circle cx="130" cy="162" r="10" opacity="0.6"/>`,

  'Mewtwo': // Psychic aura swirl + tail
    `<circle cx="100" cy="80" r="40"/>
     <circle cx="100" cy="80" r="24" opacity="0.25"/>
     <path d="M96 120 Q80 150 60 170 Q58 174 62 174 Q90 162 100 140" fill="none" stroke="currentColor" stroke-width="10" opacity="0.7"/>`,

  'Lucario': // Aura sphere between paws
    `<circle cx="100" cy="100" r="34"/>
     <circle cx="100" cy="100" r="22" opacity="0.3"/>
     <circle cx="100" cy="100" r="12" opacity="0.2"/>
     <path d="M56 68 L78 88" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.6"/>
     <path d="M144 68 L122 88" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.6"/>`,

  'Greninja': // Water shuriken
    `<polygon points="100,30 108,84 160,56 116,96 168,112 112,108 100,170 88,108 32,112 84,96 40,56 92,84"/>`,

  'Incineroar': // Fire belt / wrestling ring ropes
    `<ellipse cx="100" cy="100" rx="56" ry="56" fill="none" stroke="currentColor" stroke-width="14"/>
     <ellipse cx="100" cy="100" rx="38" ry="38" fill="none" stroke="currentColor" stroke-width="6" opacity="0.35"/>
     <polygon points="100,52 108,76 132,76 112,92 120,116 100,100 80,116 88,92 68,76 92,76"/>`,

  // ─── Kirby Universe ─────────────────────────────
  'Kirby': // Round body silhouette with feet
    `<circle cx="100" cy="82" r="50"/>
     <ellipse cx="76" cy="136" rx="18" ry="14"/>
     <ellipse cx="124" cy="136" rx="18" ry="14"/>
     <circle cx="82" cy="74" r="10" opacity="0.3"/>
     <circle cx="118" cy="74" r="10" opacity="0.3"/>`,

  'Meta Knight': // Bat-wing mask
    `<path d="M100 56c-30 0-52 22-52 44 0 18 14 34 34 40l18 20 18-20c20-6 34-22 34-40 0-22-22-44-52-44z"/>
     <path d="M30 86 L70 86 L52 56z" opacity="0.6"/>
     <path d="M170 86 L130 86 L148 56z" opacity="0.6"/>
     <rect x="70" y="86" width="24" height="10" rx="5" opacity="0.35"/>
     <rect x="106" y="86" width="24" height="10" rx="5" opacity="0.35"/>`,

  'King Dedede': // Big hammer
    `<rect x="90" y="56" width="20" height="110" rx="6"/>
     <rect x="56" y="34" width="88" height="50" rx="12"/>
     <rect x="64" y="42" width="72" height="34" rx="8" opacity="0.3"/>`,

  // ─── Star Fox ───────────────────────────────────
  'Fox': // Fox ear silhouette / arwing
    `<polygon points="100,28 50,160 76,120 100,140 124,120 150,160"/>
     <polygon points="100,62 78,130 100,116 122,130" opacity="0.25"/>`,

  'Falco': // Feather / bird wing
    `<path d="M100 28 C68 42 42 84 46 132 L72 120 C60 88 76 58 100 48 C124 58 140 88 128 120 L154 132 C158 84 132 42 100 28z"/>`,

  'Wolf': // Wolf claw slash marks (3 diagonal lines)
    `<rect x="42" y="28" width="16" height="144" rx="8" transform="rotate(12 50 100)"/>
     <rect x="92" y="28" width="16" height="144" rx="8" transform="rotate(12 100 100)"/>
     <rect x="142" y="28" width="16" height="144" rx="8" transform="rotate(12 150 100)"/>`,

  // ─── Metroid ────────────────────────────────────
  'Samus': // Arm cannon / visor shape
    `<path d="M60 56h80v28c0 36-18 60-40 76-22-16-40-40-40-76z"/>
     <rect x="58" y="56" width="84" height="16" rx="4" opacity="0.4"/>
     <ellipse cx="100" cy="82" rx="24" ry="10" opacity="0.3"/>`,

  'Dark Samus': // Corrupted visor with tendrils
    `<path d="M60 56h80v28c0 36-18 60-40 76-22-16-40-40-40-76z"/>
     <rect x="58" y="56" width="84" height="16" rx="4" opacity="0.4"/>
     <path d="M72 150 Q60 120 52 170" fill="none" stroke="currentColor" stroke-width="6" opacity="0.4"/>
     <path d="M128 150 Q140 120 148 170" fill="none" stroke="currentColor" stroke-width="6" opacity="0.4"/>`,

  'Zero Suit Samus': // Paralyzer pistol
    `<path d="M60 70h44v20h32l12 16H104v30H80v-30H48L60 70z"/>
     <circle cx="148" cy="98" r="8" opacity="0.5"/>`,

  'Ridley': // Dragon wings spread
    `<path d="M100 60 L42 38 L62 90 L28 100 L68 110 L50 164 L100 120 L150 164 L132 110 L172 100 L138 90 L158 38z"/>`,

  // ─── Fire Emblem ────────────────────────────────
  'Marth': // Elegant falchion
    `<path d="M96 26 L104 26 L108 110 L120 130 L100 122 L80 130 L92 110z"/>
     <polygon points="100,20 92,32 108,32"/>
     <rect x="76" y="126" width="48" height="10" rx="5"/>
     <rect x="90" y="134" width="20" height="28" rx="4"/>`,

  'Lucina': // Butterfly mask + Brand of the Exalt
    `<ellipse cx="100" cy="90" rx="52" ry="30"/>
     <path d="M100 66 L100 114" stroke="rgba(0,0,0,0.15)" stroke-width="3" fill="none"/>
     <circle cx="100" cy="138" r="22"/>
     <circle cx="100" cy="138" r="12" opacity="0.3"/>
     <path d="M100 116 L100 122" stroke="currentColor" stroke-width="4" fill="none"/>`,

  'Roy': // Flaming sword
    `<rect x="94" y="48" width="12" height="86" rx="3"/>
     <polygon points="100,42 90,58 110,58"/>
     <rect x="78" y="132" width="44" height="10" rx="4"/>
     <rect x="90" y="140" width="20" height="22" rx="4"/>
     <ellipse cx="100" cy="58" rx="26" ry="32" opacity="0.2"/>
     <ellipse cx="100" cy="46" rx="18" ry="22" opacity="0.15"/>`,

  'Chrom': // Brand of the Exalt (circle split design)
    `<circle cx="100" cy="96" r="52" fill="none" stroke="currentColor" stroke-width="10"/>
     <path d="M100 44 L100 148" stroke="currentColor" stroke-width="8" fill="none" opacity="0.7"/>
     <path d="M68 56 Q100 76 132 56" fill="none" stroke="currentColor" stroke-width="6" opacity="0.5"/>
     <circle cx="100" cy="96" r="14"/>`,

  'Ike': // Ragnell (heavy broad sword)
    `<rect x="86" y="26" width="28" height="100" rx="4"/>
     <polygon points="100,20 82,40 118,40"/>
     <rect x="68" y="124" width="64" height="14" rx="5"/>
     <rect x="84" y="136" width="32" height="28" rx="5"/>
     <rect x="90" y="46" width="20" height="70" rx="2" opacity="0.2"/>`,

  'Robin': // Open tome with magic
    `<rect x="50" y="60" width="100" height="90" rx="8"/>
     <rect x="56" y="66" width="88" height="78" rx="4" opacity="0.25"/>
     <path d="M100 60 L100 150" stroke="rgba(0,0,0,0.15)" stroke-width="3" fill="none"/>
     <circle cx="100" cy="44" r="16" opacity="0.5"/>
     <circle cx="100" cy="44" r="8" opacity="0.3"/>`,

  'Corrin': // Dragon fang/horn
    `<path d="M100 28 L74 98 L60 86 L80 150 L100 130 L120 150 L140 86 L126 98z"/>
     <circle cx="100" cy="100" r="14" opacity="0.3"/>`,

  'Byleth': // Crest of Flames
    `<circle cx="100" cy="96" r="52" fill="none" stroke="currentColor" stroke-width="8"/>
     <polygon points="100,50 108,80 138,82 114,102 122,132 100,114 78,132 86,102 62,82 92,80"/>
     <circle cx="100" cy="96" r="16" opacity="0.35"/>`,

  // ─── Mother/EarthBound ──────────────────────────
  'Ness': // Baseball cap + PSI sparkle
    `<path d="M56 96c0-30 20-54 44-54s44 24 44 54z"/>
     <rect x="44" y="90" width="112" height="14" rx="7"/>
     <polygon points="100,130 106,144 122,146 110,156 114,172 100,164 86,172 90,156 78,146 94,144" opacity="0.6"/>`,

  'Lucas': // Sunflower / PK love
    `<circle cx="100" cy="88" r="22"/>
     <ellipse cx="100" cy="58" rx="12" ry="16"/>
     <ellipse cx="128" cy="72" rx="12" ry="16" transform="rotate(45 128 72)"/>
     <ellipse cx="136" cy="96" rx="12" ry="16" transform="rotate(90 136 96)"/>
     <ellipse cx="124" cy="118" rx="12" ry="16" transform="rotate(135 124 118)"/>
     <ellipse cx="100" cy="118" rx="12" ry="16"/>
     <ellipse cx="76" cy="118" rx="12" ry="16" transform="rotate(45 76 118)"/>
     <ellipse cx="64" cy="96" rx="12" ry="16" transform="rotate(90 64 96)"/>
     <ellipse cx="72" cy="72" rx="12" ry="16" transform="rotate(135 72 72)"/>
     <rect x="94" y="132" width="12" height="36" rx="4"/>`,

  // ─── F-Zero ─────────────────────────────────────
  'Captain Falcon': // Falcon emblem
    `<path d="M100 30 L160 80 L148 90 L168 140 L100 108 L32 140 L52 90 L40 80z"/>
     <circle cx="100" cy="78" r="14" opacity="0.3"/>`,

  // ─── Sonic ──────────────────────────────────────
  'Sonic': // Ring with speed lines
    `<path d="M100 32a68 68 0 1 1-.01 0zm0 26a42 42 0 1 0 .01 0z" fill-rule="evenodd"/>
     <rect x="20" y="72" width="36" height="6" rx="3" opacity="0.4"/>
     <rect x="14" y="92" width="42" height="6" rx="3" opacity="0.3"/>
     <rect x="20" y="112" width="36" height="6" rx="3" opacity="0.4"/>`,

  // ─── Metal Gear ─────────────────────────────────
  'Snake': // Cardboard box with exclamation
    `<rect x="42" y="82" width="116" height="80" rx="6"/>
     <polygon points="42,82 60,58 156,58 158,82"/>
     <rect x="92" y="28" width="16" height="36" rx="5" opacity="0.7"/>
     <circle cx="100" cy="76" r="8" opacity="0.7"/>`,

  // ─── Pokemon Trainer variants ───────────────────
  'Diddy Kong': // Peanut gun / banana
    `<path d="M64 54 Q100 28 136 54 L130 72 Q100 52 70 72z"/>
     <ellipse cx="100" cy="100" rx="22" ry="46" transform="rotate(-15 100 100)"/>
     <ellipse cx="100" cy="100" rx="14" ry="38" transform="rotate(-15 100 100)" opacity="0.25"/>`,

  'Donkey Kong': // DK barrel
    `<ellipse cx="100" cy="100" rx="56" ry="62"/>
     <ellipse cx="100" cy="100" rx="56" ry="62" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="8"/>
     <rect x="94" y="38" width="12" height="124" rx="4" opacity="0.2"/>
     <rect x="44" y="94" width="112" height="12" rx="4" opacity="0.2"/>`,

  // ─── Others ─────────────────────────────────────
  'Ice Climbers': // Mountain with hammer
    `<polygon points="100,26 170,156 30,156"/>
     <polygon points="100,60 150,146 50,146" opacity="0.2"/>
     <rect x="82" y="100" width="10" height="56" rx="3" opacity="0.5"/>
     <rect x="68" y="88" width="38" height="18" rx="6" opacity="0.5"/>`,

  'Pit': // Palutena's Bow (split bow shape)
    `<path d="M48 56 Q72 28 100 56 Q128 28 152 56" fill="none" stroke="currentColor" stroke-width="10"/>
     <rect x="94" y="56" width="12" height="100" rx="4"/>
     <polygon points="100,50 88,66 112,66"/>`,

  'Dark Pit': // Dark bow + broken halo
    `<path d="M48 56 Q72 28 100 56 Q128 28 152 56" fill="none" stroke="currentColor" stroke-width="10"/>
     <rect x="94" y="56" width="12" height="100" rx="4"/>
     <polygon points="100,50 88,66 112,66"/>
     <path d="M62 44 A38 38 0 0 1 138 44" fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="12 8" opacity="0.4"/>`,

  'Palutena': // Staff with halo
    `<rect x="94" y="44" width="12" height="122" rx="4"/>
     <circle cx="100" cy="36" r="18"/>
     <circle cx="100" cy="36" r="10" opacity="0.3"/>
     <circle cx="100" cy="36" r="4" opacity="0.2"/>
     <path d="M56 28 A44 44 0 0 1 144 28" fill="none" stroke="currentColor" stroke-width="6" opacity="0.5"/>`,

  'Villager': // Leaf (Animal Crossing)
    `<path d="M100 28c48 18 78 66 64 118-10 30-42 34-64 18-22 16-54 12-64-18C22 94 52 46 100 28z"/>
     <line x1="100" y1="52" x2="100" y2="156" stroke="rgba(0,0,0,0.1)" stroke-width="4" fill="none"/>
     <line x1="78" y1="88" x2="100" y2="72" stroke="rgba(0,0,0,0.08)" stroke-width="3" fill="none"/>
     <line x1="122" y1="88" x2="100" y2="72" stroke="rgba(0,0,0,0.08)" stroke-width="3" fill="none"/>`,

  'Isabelle': // Bell with ribbon
    `<path d="M66 120c0-38 14-68 34-76v-8a8 8 0 0 1 0 0v8c20 8 34 38 34 76z"/>
     <ellipse cx="100" cy="124" rx="42" ry="12"/>
     <circle cx="100" cy="142" r="12"/>
     <circle cx="100" cy="30" r="8"/>
     <path d="M82 28 Q76 20 82 14" fill="none" stroke="currentColor" stroke-width="4" opacity="0.5"/>
     <path d="M118 28 Q124 20 118 14" fill="none" stroke="currentColor" stroke-width="4" opacity="0.5"/>`,

  'Mr. Game & Watch': // Bell (from the G&W game)
    `<rect x="70" y="52" width="60" height="80" rx="8"/>
     <circle cx="100" cy="52" r="30"/>
     <circle cx="100" cy="52" r="18" opacity="0.25"/>
     <rect x="94" y="18" width="12" height="12" rx="4"/>
     <rect x="92" y="132" width="16" height="30" rx="4"/>`,

  'R.O.B.': // Robot face (two eyes + antenna)
    `<rect x="48" y="72" width="104" height="72" rx="12"/>
     <circle cx="78" cy="108" r="18"/>
     <circle cx="122" cy="108" r="18"/>
     <circle cx="78" cy="108" r="8" opacity="0.35"/>
     <circle cx="122" cy="108" r="8" opacity="0.35"/>
     <rect x="92" y="32" width="16" height="40" rx="4"/>
     <circle cx="100" cy="28" r="10"/>`,

  'Pac-Man': // Classic pac shape
    `<path d="M100 32a68 68 0 1 1 0 136 68 68 0 0 1 0-136zm0 0L166 72v56z" fill-rule="evenodd"/>
     <circle cx="118" cy="62" r="8" opacity="0.4"/>`,

  'Mega Man': // Mega buster arm cannon
    `<circle cx="100" cy="80" r="32"/>
     <rect x="116" y="100" width="52" height="32" rx="16"/>
     <circle cx="170" cy="116" r="10" opacity="0.5"/>
     <rect x="84" y="116" width="32" height="48" rx="6"/>`,

  'Ryu': // Hadouken fireball
    `<circle cx="100" cy="90" r="42"/>
     <circle cx="100" cy="90" r="28" opacity="0.3"/>
     <circle cx="100" cy="90" r="14" opacity="0.2"/>
     <path d="M58 140 L78 120" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.5"/>
     <path d="M142 140 L122 120" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.5"/>`,

  'Ken': // Flaming uppercut / rising fist
    `<path d="M92 160 L92 100 Q92 72 78 56 L100 28 L122 56 Q108 72 108 100 L108 160z"/>
     <ellipse cx="100" cy="42" rx="28" ry="22" opacity="0.3"/>
     <ellipse cx="100" cy="32" rx="18" ry="16" opacity="0.2"/>`,

  'Little Mac': // Boxing glove
    `<ellipse cx="100" cy="86" rx="48" ry="44"/>
     <ellipse cx="100" cy="82" rx="40" ry="36" opacity="0.2"/>
     <rect x="82" y="126" width="36" height="36" rx="8"/>`,

  'Wii Fit Trainer': // Yoga tree pose
    `<circle cx="100" cy="36" r="18"/>
     <rect x="94" y="54" width="12" height="58" rx="4"/>
     <rect x="94" y="108" width="12" height="60" rx="4" transform="rotate(-5 100 138)"/>
     <rect x="94" y="108" width="12" height="52" rx="4" transform="rotate(25 100 134)"/>
     <rect x="56" y="64" width="40" height="10" rx="5" transform="rotate(-20 76 69)"/>
     <rect x="108" y="58" width="40" height="10" rx="5" transform="rotate(-80 128 63)"/>`,

  'Olimar': // Pikmin (sprout with leaf)
    `<circle cx="100" cy="118" r="28"/>
     <circle cx="100" cy="118" r="16" opacity="0.25"/>
     <rect x="96" y="56" width="8" height="62" rx="4"/>
     <ellipse cx="100" cy="46" rx="22" ry="14"/>`,

  'Duck Hunt': // Duck silhouette
    `<circle cx="100" cy="90" r="38"/>
     <ellipse cx="100" cy="140" rx="28" ry="16"/>
     <path d="M138 80 L170 68 L170 78 L140 88z"/>
     <circle cx="112" cy="80" r="6" opacity="0.35"/>
     <path d="M76 54 Q82 32 98 38" fill="none" stroke="currentColor" stroke-width="4" opacity="0.4"/>`,

  'Cloud': // Buster Sword
    `<rect x="84" y="20" width="32" height="110" rx="4"/>
     <rect x="78" y="20" width="44" height="24" rx="3" opacity="0.4"/>
     <rect x="64" y="128" width="72" height="16" rx="6"/>
     <rect x="86" y="142" width="28" height="30" rx="5"/>`,

  'Bayonetta': // Butterfly
    `<path d="M100 88 Q60 44 38 64 Q18 84 56 108z"/>
     <path d="M100 88 Q140 44 162 64 Q182 84 144 108z"/>
     <path d="M100 96 Q66 128 48 148 Q42 162 68 142 Q86 128 100 120z" opacity="0.7"/>
     <path d="M100 96 Q134 128 152 148 Q158 162 132 142 Q114 128 100 120z" opacity="0.7"/>
     <circle cx="100" cy="92" r="6"/>`,

  'Shulk': // Monado symbol
    `<circle cx="100" cy="96" r="54" fill="none" stroke="currentColor" stroke-width="12"/>
     <rect x="86" y="62" width="28" height="68" rx="6"/>
     <polygon points="100,46 90,66 110,66"/>
     <rect x="92" y="126" width="16" height="20" rx="4" opacity="0.6"/>`,

  'Inkling': // Squid silhouette
    `<ellipse cx="100" cy="100" rx="46" ry="38"/>
     <path d="M64 72 Q58 40 72 36 Q78 34 76 56" opacity="0.8"/>
     <path d="M84 66 Q82 38 92 32 Q96 30 94 52" opacity="0.8"/>
     <path d="M116 66 Q118 38 108 32 Q104 30 106 52" opacity="0.8"/>
     <path d="M136 72 Q142 40 128 36 Q122 34 124 56" opacity="0.8"/>
     <circle cx="86" cy="96" r="10" opacity="0.3"/>
     <circle cx="114" cy="96" r="10" opacity="0.3"/>`,

  'Simon': // Whip coil
    `<path d="M60 156 Q40 120 60 96 Q80 72 100 88 Q120 104 140 80 Q160 56 148 36" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
     <polygon points="148,36 164,24 158,48" opacity="0.7"/>`,

  'Richter': // Cross + whip
    `<rect x="84" y="32" width="32" height="100" rx="6"/>
     <rect x="56" y="62" width="88" height="32" rx="6"/>
     <path d="M56 156 Q48 132 66 122" fill="none" stroke="currentColor" stroke-width="6" opacity="0.4"/>`,

  'King K. Rool': // Crown + belly
    `<circle cx="100" cy="116" r="48"/>
     <circle cx="100" cy="116" r="34" opacity="0.2"/>
     <path d="M56 76l14-36 16 20 14-24 14 24 16-20 14 36z"/>
     <rect x="52" y="72" width="96" height="12" rx="4" opacity="0.5"/>`,

  'Joker': // Phantom Thief mask
    `<path d="M40 92 Q40 56 100 44 Q160 56 160 92 Q160 108 140 116 L130 104 Q100 116 70 104 L60 116 Q40 108 40 92z"/>
     <ellipse cx="76" cy="88" rx="16" ry="12" opacity="0.3"/>
     <ellipse cx="124" cy="88" rx="16" ry="12" opacity="0.3"/>`,

  'Hero': // DQ Slime
    `<path d="M100 36 Q44 36 36 108 Q36 160 100 164 Q164 160 164 108 Q156 36 100 36z"/>
     <circle cx="82" cy="96" r="10" opacity="0.3"/>
     <circle cx="118" cy="96" r="10" opacity="0.3"/>
     <path d="M88 118 Q100 130 112 118" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="3"/>`,

  'Banjo & Kazooie': // Jiggy puzzle piece
    `<circle cx="100" cy="76" r="22"/>
     <circle cx="72" cy="100" r="22"/>
     <circle cx="128" cy="100" r="22"/>
     <circle cx="100" cy="128" r="22"/>
     <rect x="78" y="78" width="44" height="48" rx="0"/>`,

  'Terry': // "GO" cap / power wave
    `<path d="M48 78c0-28 24-48 52-48s52 20 52 48z"/>
     <rect x="38" y="72" width="124" height="16" rx="8"/>
     <polygon points="52,120 100,96 148,120 148,160 52,160" opacity="0.6"/>
     <polygon points="66,134 100,114 134,134 134,152 66,152" opacity="0.3"/>`,

  'Min Min': // Ramen bowl with noodles
    `<ellipse cx="100" cy="120" rx="60" ry="36"/>
     <path d="M40 112 Q40 72 100 62 Q160 72 160 112" fill="none" stroke="currentColor" stroke-width="8"/>
     <path d="M72 92 Q84 72 96 92" fill="none" stroke="currentColor" stroke-width="5" opacity="0.5"/>
     <path d="M104 92 Q116 72 128 92" fill="none" stroke="currentColor" stroke-width="5" opacity="0.5"/>`,

  'Steve': // Pickaxe
    `<rect x="50" y="34" width="44" height="44" rx="4"/>
     <rect x="50" y="34" width="44" height="22" opacity="0.3"/>
     <rect x="88" y="52" width="12" height="110" rx="4" transform="rotate(0 94 107)"/>`,

  'Sephiroth': // One wing + Masamune
    `<rect x="96" y="16" width="8" height="168" rx="2"/>
     <polygon points="100,12 92,26 108,26"/>
     <path d="M108 60 Q132 52 160 68 Q172 78 164 92 Q148 112 120 100 Q108 94 108 80z"/>
     <path d="M108 70 Q128 64 148 76 Q156 84 150 92 Q138 104 120 96z" opacity="0.3"/>`,

  'Pyra/Mythra': // Aegis flame/light sword
    `<rect x="92" y="38" width="16" height="88" rx="4"/>
     <polygon points="100,30 88,50 112,50"/>
     <rect x="76" y="124" width="48" height="12" rx="4"/>
     <rect x="88" y="134" width="24" height="24" rx="4"/>
     <ellipse cx="100" cy="60" rx="30" ry="42" opacity="0.18"/>
     <ellipse cx="100" cy="54" rx="20" ry="30" opacity="0.14"/>
     <ellipse cx="100" cy="48" rx="12" ry="20" opacity="0.1"/>`,

  'Kazuya': // Devil Gene eye / lightning scar
    `<path d="M100 28 L46 100 L72 100 L56 172 L154 88 L118 88 L156 28z"/>
     <circle cx="100" cy="100" r="18" opacity="0.3"/>
     <circle cx="100" cy="100" r="8" opacity="0.2"/>`,

  'Sora': // Keyblade
    `<rect x="92" y="50" width="16" height="96" rx="4"/>
     <circle cx="100" cy="40" r="22" fill="none" stroke="currentColor" stroke-width="10"/>
     <rect x="72" y="142" width="56" height="14" rx="5"/>
     <rect x="68" y="132" width="14" height="30" rx="4"/>
     <rect x="118" y="132" width="14" height="30" rx="4"/>`,

  'Mii Fighters': // Mii face
    `<circle cx="100" cy="92" r="54"/>
     <circle cx="80" cy="82" r="10" opacity="0.3"/>
     <circle cx="120" cy="82" r="10" opacity="0.3"/>
     <ellipse cx="100" cy="110" rx="14" ry="8" opacity="0.2"/>`,
};

// ── Character-specific accent/secondary colors ───────────────────

const ACCENT_COLORS = {
  'Mario': '#0051a8',
  'Luigi': '#5b3a8c',
  'Peach': '#f5d300',
  'Daisy': '#ff6b35',
  'Rosalina & Luma': '#f5d300',
  'Bowser': '#f5a623',
  'Bowser Jr.': '#f5a623',
  'Yoshi': '#f5a623',
  'Dr. Mario': '#4169e1',
  'Wario': '#7b2d8e',
  'Piranha Plant': '#e60012',
  'Link': '#b08d57',
  'Zelda': '#f5d300',
  'Sheik': '#e60012',
  'Ganondorf': '#f5d300',
  'Young Link': '#b08d57',
  'Toon Link': '#f5d300',
  'Pikachu': '#e60012',
  'Pichu': '#e60012',
  'Jigglypuff': '#33cc77',
  'Mewtwo': '#5b3a8c',
  'Pokemon Trainer': '#ffffff',
  'Lucario': '#f5d300',
  'Greninja': '#e60012',
  'Incineroar': '#333333',
  'Kirby': '#e60040',
  'Meta Knight': '#f5d300',
  'King Dedede': '#e60012',
  'Fox': '#1a5632',
  'Falco': '#e60012',
  'Wolf': '#4b0082',
  'Samus': '#228b22',
  'Dark Samus': '#00bfff',
  'Zero Suit Samus': '#e60012',
  'Ridley': '#f5a623',
  'Marth': '#f5d300',
  'Lucina': '#f5d300',
  'Roy': '#f5a623',
  'Chrom': '#f5d300',
  'Ike': '#e60012',
  'Robin': '#f5d300',
  'Corrin': '#e60012',
  'Byleth': '#e60012',
  'Ness': '#f5d300',
  'Lucas': '#e60012',
  'Captain Falcon': '#f5d300',
  'Sonic': '#f5d300',
  'Snake': '#8b4513',
  'Ice Climbers': '#ff6b9d',
  'Pit': '#f5d300',
  'Dark Pit': '#e60012',
  'Palutena': '#f5d300',
  'Villager': '#8b4513',
  'Isabelle': '#e60012',
  'Mr. Game & Watch': '#666666',
  'R.O.B.': '#e60012',
  'Pac-Man': '#e60012',
  'Mega Man': '#f5d300',
  'Ryu': '#e60012',
  'Ken': '#f5d300',
  'Little Mac': '#f5d300',
  'Wii Fit Trainer': '#00bfff',
  'Olimar': '#228b22',
  'Duck Hunt': '#87ceeb',
  'Cloud': '#f5d300',
  'Bayonetta': '#e60012',
  'Shulk': '#00bfff',
  'Inkling': '#00bfff',
  'Simon': '#e60012',
  'Richter': '#00bfff',
  'King K. Rool': '#f5d300',
  'Joker': '#333333',
  'Hero': '#f5d300',
  'Banjo & Kazooie': '#e60012',
  'Terry': '#0057b8',
  'Min Min': '#228b22',
  'Steve': '#228b22',
  'Sephiroth': '#4b0082',
  'Pyra/Mythra': '#00bfff',
  'Kazuya': '#e60012',
  'Sora': '#4169e1',
  'Diddy Kong': '#f5d300',
  'Donkey Kong': '#e60012',
  'Mii Fighters': '#e60012',
};

// ── Roster ───────────────────────────────────────────────────────

const ROSTER = [
  [1, "Mario", "#e60012"],
  [2, "Donkey Kong", "#7c4b1e"],
  [3, "Link", "#00a651"],
  [4, "Samus", "#f5a623"],
  [4.1, "Dark Samus", "#4b0082"],
  [5, "Yoshi", "#7cc576"],
  [6, "Kirby", "#ffb7c5"],
  [7, "Fox", "#f7931e"],
  [8, "Pikachu", "#f5d300"],
  [9, "Luigi", "#00a651"],
  [10, "Ness", "#e60012"],
  [11, "Captain Falcon", "#0057b8"],
  [12, "Jigglypuff", "#ff69b4"],
  [13, "Peach", "#ff6b9d"],
  [13.1, "Daisy", "#f5a623"],
  [14, "Bowser", "#228b22"],
  [15, "Ice Climbers", "#87ceeb"],
  [16, "Sheik", "#7b68ee"],
  [17, "Zelda", "#c471ed"],
  [18, "Dr. Mario", "#e60012"],
  [19, "Pichu", "#f5d300"],
  [20, "Falco", "#0057b8"],
  [21, "Marth", "#4169e1"],
  [21.1, "Lucina", "#4169e1"],
  [22, "Young Link", "#00a651"],
  [23, "Ganondorf", "#4b0050"],
  [24, "Mewtwo", "#9b59b6"],
  [25, "Roy", "#e60012"],
  [25.1, "Chrom", "#4169e1"],
  [26, "Mr. Game & Watch", "#333333"],
  [27, "Meta Knight", "#1a1a6c"],
  [28, "Pit", "#f0f0f0"],
  [28.1, "Dark Pit", "#4b0082"],
  [29, "Zero Suit Samus", "#00bfff"],
  [30, "Wario", "#f5d300"],
  [31, "Snake", "#556b2f"],
  [32, "Ike", "#003366"],
  [33, "Pokemon Trainer", "#e60012"],
  [34, "Diddy Kong", "#e60012"],
  [35, "Lucas", "#f5a623"],
  [36, "Sonic", "#0057b8"],
  [37, "King Dedede", "#f5d300"],
  [38, "Olimar", "#e60012"],
  [39, "Lucario", "#4169e1"],
  [40, "R.O.B.", "#d3d3d3"],
  [41, "Toon Link", "#00a651"],
  [42, "Wolf", "#7b68ee"],
  [43, "Villager", "#7cc576"],
  [44, "Mega Man", "#00bfff"],
  [45, "Wii Fit Trainer", "#87ceeb"],
  [46, "Rosalina & Luma", "#00ced1"],
  [47, "Little Mac", "#228b22"],
  [48, "Greninja", "#1a1a6c"],
  [49, "Mii Brawler", "#f5a623"],
  [50, "Mii Swordfighter", "#f5a623"],
  [51, "Mii Gunner", "#f5a623"],
  [52, "Palutena", "#00a651"],
  [53, "Pac-Man", "#f5d300"],
  [54, "Robin", "#7b68ee"],
  [55, "Shulk", "#e60012"],
  [56, "Bowser Jr.", "#228b22"],
  [57, "Duck Hunt", "#8b4513"],
  [58, "Ryu", "#f0f0f0"],
  [59, "Ken", "#e60012"],
  [60, "Cloud", "#4169e1"],
  [61, "Corrin", "#d3d3d3"],
  [62, "Bayonetta", "#4b0082"],
  [63, "Inkling", "#ff6b35"],
  [64, "Ridley", "#7b2d8e"],
  [65, "Simon", "#8b4513"],
  [65.1, "Richter", "#4169e1"],
  [66, "King K. Rool", "#228b22"],
  [67, "Isabelle", "#f5d300"],
  [68, "Incineroar", "#e60012"],
  [69, "Piranha Plant", "#228b22"],
  [70, "Joker", "#e60012"],
  [71, "Hero", "#4169e1"],
  [72, "Banjo & Kazooie", "#f5a623"],
  [73, "Terry", "#e60012"],
  [74, "Byleth", "#1a1a6c"],
  [75, "Min Min", "#f5d300"],
  [76, "Steve", "#8b4513"],
  [77, "Sephiroth", "#d3d3d3"],
  [78, "Pyra/Mythra", "#e60012"],
  [79, "Kazuya", "#4b0050"],
  [80, "Sora", "#f5a623"],
];

// ── SVG generator ────────────────────────────────────────────────

function generateSVG(name, primaryColor, accent, emblemSVG) {
  const id = name.replace(/[^a-zA-Z0-9]/g, '_');
  const rgb = hexToRgb(primaryColor);
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  // Dark background with dual-tone gradient (primary → accent)
  const bgDark1 = darken(primaryColor, 0.88);
  const bgDark2 = darken(accent, 0.75);
  const bgMid = darken(primaryColor, 0.55);

  // Bright emblem for high contrast
  let embTop, embBot;
  if (brightness > 180) {
    embTop = darken(primaryColor, 0.05);
    embBot = lighten(primaryColor, 0.15);
  } else {
    embTop = lighten(primaryColor, 0.5);
    embBot = lighten(primaryColor, 0.78);
  }

  const glowColor = lighten(primaryColor, 0.3);
  const accentGlow = lighten(accent, 0.3);

  // Is this a stroke-based emblem (crosshair, etc.)?
  const hasStroke = emblemSVG.includes('stroke="currentColor"');
  const fillAttr = hasStroke
    ? `fill="url(#emb-${id})" stroke="url(#emb-${id})"`
    : `fill="url(#emb-${id})"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${bgDark1}"/>
      <stop offset="45%" stop-color="${bgMid}"/>
      <stop offset="100%" stop-color="${bgDark2}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="50%" cy="44%" r="52%">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="${accentGlow}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accentGlow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="emb-${id}" x1="80" y1="20" x2="140" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${embTop}"/>
      <stop offset="100%" stop-color="${embBot}"/>
    </linearGradient>
    <linearGradient id="accent-${id}" x1="0" y1="200" x2="200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="clip-${id}">
      <rect width="200" height="200" rx="28"/>
    </clipPath>
  </defs>

  <g clip-path="url(#clip-${id})">
    <rect width="200" height="200" fill="url(#bg-${id})"/>
    <ellipse cx="100" cy="88" rx="110" ry="100" fill="url(#glow-${id})"/>

    <!-- Accent color wash -->
    <rect width="200" height="200" fill="url(#accent-${id})"/>

    <!-- Emblem -->
    <g ${fillAttr} opacity="0.92">
      ${emblemSVG}
    </g>
  </g>

  <!-- Border with primary color -->
  <rect width="200" height="200" rx="28" fill="none" stroke="${primaryColor}" stroke-width="3" opacity="0.45"/>
</svg>`;
}

// ── Generate all icons ───────────────────────────────────────────

const generated = new Set();
const ALIASES = {
  'Mii Brawler': 'Mii Fighters',
  'Mii Swordfighter': 'Mii Fighters',
  'Mii Gunner': 'Mii Fighters',
};

let count = 0;

for (const [num, name, color] of ROSTER) {
  const fileName = ALIASES[name] || name;
  const safeFileName = fileName.replace(/\//g, '-');

  if (generated.has(safeFileName)) continue;
  generated.add(safeFileName);

  const lookupName = fileName === 'Mii Fighters' ? 'Mii Fighters' : name;
  const emblem = CHAR_EMBLEMS[lookupName];
  if (!emblem) {
    console.warn(`  [SKIP] No emblem for: ${lookupName}`);
    continue;
  }

  const accent = ACCENT_COLORS[lookupName] || darken(color, 0.3);
  const svg = generateSVG(name, color, accent, emblem);
  const outPath = path.join(outputDir, safeFileName + '.svg');
  fs.writeFileSync(outPath, svg, 'utf8');
  count++;
  console.log(`  [${count}] ${safeFileName}.svg`);
}

console.log(`\nDone! Generated ${count} unique character icons.`);

/**
 * Extract individual character stock icons from roster_full.png
 * and series badges from badges.jpg
 */
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const stockDir = path.join(__dirname, 'images', 'stock');
const badgeDir = path.join(__dirname, 'images', 'badges');
if (!fs.existsSync(stockDir)) fs.mkdirSync(stockDir, { recursive: true });
if (!fs.existsSync(badgeDir)) fs.mkdirSync(badgeDir, { recursive: true });

// SSBU fighter number order (how stock icons appear in sprite sheets)
// This matches the standard CSS order in SSBU
const STOCK_ORDER = [
  'Mario', 'Donkey Kong', 'Link', 'Samus', 'Dark Samus',
  'Yoshi', 'Kirby', 'Fox', 'Pikachu', 'Luigi',
  'Ness', 'Captain Falcon', 'Jigglypuff', 'Peach', 'Daisy',
  'Bowser', 'Ice Climbers', 'Sheik', 'Zelda', 'Dr. Mario',
  'Pichu', 'Falco', 'Marth', 'Lucina', 'Young Link',
  'Ganondorf', 'Mewtwo', 'Roy', 'Chrom', 'Mr. Game & Watch',
  'Meta Knight', 'Pit', 'Dark Pit', 'Zero Suit Samus', 'Wario',
  'Snake', 'Ike', 'Pokemon Trainer', 'Pokemon Trainer_Squirtle', 'Pokemon Trainer_Ivysaur',
  'Pokemon Trainer_Charizard', 'Diddy Kong', 'Lucas', 'Sonic', 'King Dedede',
  'Olimar', 'Lucario', 'R.O.B.', 'Toon Link', 'Wolf',
  'Villager', 'Mega Man', 'Wii Fit Trainer', 'Rosalina & Luma', 'Little Mac',
  'Greninja', 'Mii Brawler', 'Mii Swordfighter', 'Mii Gunner', 'Palutena',
  'Pac-Man', 'Robin', 'Shulk', 'Bowser Jr.', 'Duck Hunt',
  'Ryu', 'Ken', 'Cloud', 'Corrin', 'Bayonetta',
  'Inkling', 'Ridley', 'Simon', 'Richter', 'King K. Rool',
  'Isabelle', 'Incineroar', 'Piranha Plant', 'Joker', 'Hero',
  'Banjo & Kazooie', 'Terry', 'Byleth', 'Min Min', 'Steve',
  'Sephiroth', 'Pyra', 'Mythra', 'Kazuya', 'Sora',
];

// Characters that map to different stock icon names
const STOCK_ALIASES = {
  'Pokemon Trainer_Squirtle': null,  // skip
  'Pokemon Trainer_Ivysaur': null,   // skip
  'Pokemon Trainer_Charizard': null, // skip
  'Pyra': 'Pyra-Mythra',            // map both to same name
  'Mythra': null,                    // skip (Pyra already saved)
};

// Check if a cell has meaningful content (not all black)
function hasContent(img, x, y, w, h) {
  let bright = 0;
  const sampleStep = 4;
  for (let sy = y + 4; sy < y + h - 4; sy += sampleStep) {
    for (let sx = x + 4; sx < x + w - 4; sx += sampleStep) {
      const idx = (sy * img.bitmap.width + sx) * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      if (r + g + b > 60) bright++;
    }
  }
  return bright > 10;
}

// Make near-black pixels transparent
function removeBlackBg(img) {
  const { data, width, height } = img.bitmap;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    // If very dark, make transparent (threshold 25)
    if (r < 25 && g < 25 && b < 25) {
      data[idx + 3] = 0;
    }
  }
}

async function extractRoster() {
  console.log('=== Extracting stock icons from roster_full.png ===\n');
  const img = await Jimp.read(path.join(__dirname, 'images', 'characters', 'roster_full.png'));
  const { width, height } = img.bitmap;
  console.log(`  Image: ${width}x${height}`);

  const cols = 9;
  const cellW = Math.floor(width / cols);
  const rows = Math.round(height / cellW);
  const cellH = Math.floor(height / rows);
  console.log(`  Grid: ${cols}x${rows}, cell: ${cellW}x${cellH}\n`);

  let index = 0;
  let saved = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellW;
      const y = row * cellH;

      if (!hasContent(img, x, y, cellW, cellH)) continue;

      const name = STOCK_ORDER[index] || `unknown_${index}`;
      index++;

      // Check if we should skip this cell
      if (STOCK_ALIASES[name] === null) continue;

      const fileName = STOCK_ALIASES[name] || name;
      const safeName = fileName.replace(/\//g, '-');

      // Crop the cell
      const cell = img.clone().crop({ x, y, w: cellW, h: cellH });
      removeBlackBg(cell);

      const outPath = path.join(stockDir, safeName + '.png');
      await cell.write(outPath);
      saved++;
      console.log(`  [${saved}] ${safeName}.png  (row ${row}, col ${col})`);
    }
  }

  console.log(`\n  Saved ${saved} stock icons to images/stock/\n`);
}

async function extractBadges() {
  console.log('=== Extracting series badges from badges.jpg ===\n');
  const img = await Jimp.read(path.join(__dirname, 'images', 'characters', 'badges.jpg'));
  const { width, height } = img.bitmap;
  console.log(`  Image: ${width}x${height}`);

  // Detect grid - badges appear to be in rows of ~10
  const cols = 10;
  const cellW = Math.floor(width / cols);
  const rows = Math.round(height / cellW);
  const cellH = Math.floor(height / rows);
  console.log(`  Grid: ${cols}x${rows}, cell: ${cellW}x${cellH}\n`);

  // Series badge order (based on the image layout)
  // Row 1: Smash Bros, Bayonetta, Castlevania, DK, Dragon Quest, Duck Hunt, Kid Icarus, Kirby(?), Star Fox(?), Final Fantasy
  // These are approximate - we'll name by index for now
  const BADGE_ORDER = [
    'smash', 'bayonetta', 'castlevania', 'donkey-kong', 'dragon-quest', 'duck-hunt',
    'kid-icarus', 'kirby', 'star-fox', 'final-fantasy',
    'fire-emblem', 'icarus-alt', 'game-watch', 'animal-crossing', 'mother',
    'mario', 'metal-gear', 'xenoblade', 'mii', 'pac-man',
    'pikmin', 'sonic', 'splatoon', 'ice-climber', 'pokemon',
    'rob', 'f-zero', 'mega-man', 'punch-out', 'arms',
    'minecraft', 'street-fighter', 'wario', 'wii-fit', 'persona',
    'metroid', 'zelda', 'kingdom-hearts', 'tekken', 'yoshi',
  ];

  let index = 0;
  let saved = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellW;
      const y = row * cellH;

      if (!hasContent(img, x, y, cellW, cellH)) continue;

      const name = BADGE_ORDER[index] || `badge_${index}`;
      index++;

      const cell = img.clone().crop({ x, y, w: cellW, h: cellH });
      removeBlackBg(cell);

      const outPath = path.join(badgeDir, name + '.png');
      await cell.write(outPath);
      saved++;
      console.log(`  [${saved}] ${name}.png`);
    }
  }

  console.log(`\n  Saved ${saved} badges to images/badges/\n`);
}

(async () => {
  await extractRoster();
  await extractBadges();
  console.log('Done!');
})();

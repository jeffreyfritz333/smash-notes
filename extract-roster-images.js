/**
 * Extract character portraits from roster_images.webp
 * Corrected grid: 8 cols, starts at x=480, cellW=180, cellH=172
 * Order: standard SSBU minus Miis, PT split into 3 Pokemon
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, 'images', 'portraits');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Actual order in this sprite sheet:
// - Pokemon Trainer → Squirtle, Ivysaur, Charizard (3 cells)
// - No Mii Brawler, Swordfighter, Gunner
// - Pyra/Mythra combined in one cell
const IMAGE_ORDER = [
  // Row 0
  'Mario', 'Donkey Kong', 'Link', 'Samus', 'Dark Samus', 'Yoshi', 'Kirby', 'Fox',
  // Row 1
  'Pikachu', 'Luigi', 'Ness', 'Captain Falcon', 'Jigglypuff', 'Peach', 'Daisy', 'Bowser',
  // Row 2
  'Ice Climbers', 'Sheik', 'Zelda', 'Dr. Mario', 'Pichu', 'Falco', 'Marth', 'Lucina',
  // Row 3
  'Young Link', 'Ganondorf', 'Mewtwo', 'Roy', 'Chrom', 'Mr. Game & Watch', 'Meta Knight', 'Pit',
  // Row 4 (PT replaced by individual Pokemon)
  'Dark Pit', 'Zero Suit Samus', 'Wario', 'Snake', 'Ike', '_Squirtle', '_Ivysaur', '_Charizard',
  // Row 5
  'Diddy Kong', 'Lucas', 'Sonic', 'King Dedede', 'Olimar', 'Lucario', 'R.O.B.', 'Toon Link',
  // Row 6 (no Mii fighters, Palutena fills in)
  'Wolf', 'Villager', 'Mega Man', 'Wii Fit Trainer', 'Rosalina & Luma', 'Little Mac', 'Greninja', 'Palutena',
  // Row 7
  'Pac-Man', 'Robin', 'Shulk', 'Bowser Jr.', 'Duck Hunt', 'Ryu', 'Ken', 'Cloud',
  // Row 8
  'Corrin', 'Bayonetta', 'Inkling', 'Ridley', 'Simon', 'Richter', 'King K. Rool', 'Isabelle',
  // Row 9
  'Incineroar', 'Piranha Plant', 'Joker', 'Hero', 'Banjo & Kazooie', 'Terry', 'Byleth', 'Min Min',
  // Row 10 (partial)
  'Steve', 'Sephiroth', 'Pyra-Mythra', 'Kazuya', 'Sora',
];

// Map special names to the filename the app expects
const SAVE_AS = {
  '_Squirtle': 'Pokemon Trainer',   // Use Squirtle portrait for PT
  '_Ivysaur': null,                 // skip
  '_Charizard': null,               // skip
};

async function run() {
  const inputPath = path.join(__dirname, 'images', 'characters', 'roster_images.webp');
  const meta = await sharp(inputPath).metadata();
  console.log(`Image: ${meta.width}x${meta.height}`);

  const gridLeft = 480;
  const cellW = 180;
  const cellH = 172;
  const cols = 8;
  const rows = 11;

  console.log(`Grid: ${cols}x${rows}, cell ${cellW}x${cellH}, origin (${gridLeft}, 0)`);
  console.log(`Characters in image: ${IMAGE_ORDER.length}\n`);

  // Clean old test/row files
  fs.readdirSync(outDir).filter(f => f.startsWith('test_') || f.startsWith('row_')).forEach(f =>
    fs.unlinkSync(path.join(outDir, f)));

  let index = 0;
  let saved = 0;

  for (let row = 0; row < rows && index < IMAGE_ORDER.length; row++) {
    for (let col = 0; col < cols && index < IMAGE_ORDER.length; col++) {
      const name = IMAGE_ORDER[index];
      index++;

      // Check if we should skip or rename
      const fileName = SAVE_AS.hasOwnProperty(name) ? SAVE_AS[name] : name;
      if (fileName === null) continue;

      const x = gridLeft + col * cellW;
      const y = row * cellH;
      const w = Math.min(cellW, meta.width - x);
      const h = Math.min(cellH, meta.height - y);
      if (w < 20 || h < 20) continue;

      const safeName = fileName.replace(/\//g, '-');
      await sharp(inputPath)
        .extract({ left: x, top: y, width: w, height: h })
        .resize(200, 200, { fit: 'cover', position: 'centre' })
        .png()
        .toFile(path.join(outDir, safeName + '.png'));

      saved++;
      console.log(`  [${saved}] ${safeName}.png  (row ${row}, col ${col})`);
    }
  }

  console.log(`\nDone! Saved ${saved} portraits to images/portraits/`);
}

run().catch(console.error);

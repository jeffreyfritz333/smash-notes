#!/usr/bin/env node
/**
 * Generates a 1024x500 feature graphic for the Google Play Store listing.
 * Uses sharp (already a devDependency) to composite the image.
 *
 * Usage: node generate-feature-graphic.js
 * Output: store-assets/feature-graphic.png
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, 'store-assets');
const WIDTH = 1024;
const HEIGHT = 500;

// Characters to feature on the graphic
const FEATURED = ['Mario', 'Link', 'Pikachu', 'Samus'];

async function generateFeatureGraphic() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Create base gradient background matching the app theme
  const svgBg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="50%" style="stop-color:#16213e"/>
        <stop offset="100%" style="stop-color:#0f3460"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#e94560;stop-opacity:0.8"/>
        <stop offset="100%" style="stop-color:#c0392b;stop-opacity:0.4"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Accent stripe -->
    <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="url(#accent)"/>
    <!-- Diagonal accent bar -->
    <polygon points="0,${HEIGHT} 350,${HEIGHT} 450,0 100,0" fill="url(#accent)" opacity="0.08"/>
    <!-- Title -->
    <text x="${WIDTH / 2}" y="200" text-anchor="middle"
          font-family="sans-serif" font-weight="900" font-size="72"
          fill="#ffffff" letter-spacing="4">SMASH NOTES</text>
    <!-- Subtitle -->
    <text x="${WIDTH / 2}" y="260" text-anchor="middle"
          font-family="sans-serif" font-weight="400" font-size="26"
          fill="#8892b0" letter-spacing="2">TRACK YOUR MATCHUPS</text>
    <!-- Tagline -->
    <text x="${WIDTH / 2}" y="340" text-anchor="middle"
          font-family="sans-serif" font-weight="400" font-size="20"
          fill="#e94560" letter-spacing="1">Notes &#x2022; Ratings &#x2022; Strategy</text>
    <!-- Bottom decorative dots -->
    <circle cx="${WIDTH/2 - 30}" cy="400" r="4" fill="#e94560" opacity="0.6"/>
    <circle cx="${WIDTH/2}" cy="400" r="4" fill="#e94560" opacity="0.8"/>
    <circle cx="${WIDTH/2 + 30}" cy="400" r="4" fill="#e94560" opacity="0.6"/>
  </svg>`;

  await sharp(Buffer.from(svgBg))
    .png()
    .toFile(path.join(OUT_DIR, 'feature-graphic.png'));

  console.log(`Feature graphic saved to store-assets/feature-graphic.png (${WIDTH}x${HEIGHT})`);
}

generateFeatureGraphic().catch(console.error);

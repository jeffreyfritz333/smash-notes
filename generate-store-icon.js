#!/usr/bin/env node
/**
 * Generates a 512x512 app icon for the Google Play Store.
 * Output: store-assets/icon-512.png
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, 'store-assets');
const SIZE = 512;

async function generateIcon() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const svg = `
  <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#0f3460"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#e94560"/>
        <stop offset="100%" style="stop-color:#c0392b"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${SIZE}" height="${SIZE}" rx="90" fill="url(#bg)"/>

    <!-- Subtle glass shine -->
    <ellipse cx="${SIZE/2}" cy="140" rx="200" ry="120" fill="white" opacity="0.04"/>

    <!-- Accent border glow at bottom -->
    <rect x="60" y="${SIZE - 60}" width="${SIZE - 120}" height="4" rx="2" fill="url(#accent)" opacity="0.7" filter="url(#glow)"/>

    <!-- Notepad body -->
    <rect x="130" y="100" width="252" height="310" rx="20" fill="#16213e" stroke="#e94560" stroke-width="3" opacity="0.9"/>

    <!-- Notepad lines -->
    <line x1="165" y1="175" x2="347" y2="175" stroke="#8892b0" stroke-width="2" opacity="0.4"/>
    <line x1="165" y1="215" x2="347" y2="215" stroke="#8892b0" stroke-width="2" opacity="0.4"/>
    <line x1="165" y1="255" x2="347" y2="255" stroke="#8892b0" stroke-width="2" opacity="0.4"/>
    <line x1="165" y1="295" x2="300" y2="295" stroke="#8892b0" stroke-width="2" opacity="0.4"/>

    <!-- Smash cross / crosshair on notepad -->
    <line x1="256" y1="130" x2="256" y2="160" stroke="#e94560" stroke-width="4" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="240" y1="145" x2="272" y2="145" stroke="#e94560" stroke-width="4" stroke-linecap="round" filter="url(#glow)"/>

    <!-- Accent check marks on lines -->
    <polyline points="155,172 160,178 172,165" fill="none" stroke="#27ae60" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="155,212 160,218 172,205" fill="none" stroke="#e74c3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="155,252 160,258 172,245" fill="none" stroke="#f39c12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- SN text -->
    <text x="${SIZE/2}" y="450" text-anchor="middle"
          font-family="sans-serif" font-weight="900" font-size="48"
          fill="#e94560" letter-spacing="6" filter="url(#glow)">SMASH NOTES</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(OUT_DIR, 'icon-512.png'));

  console.log('Store icon saved to store-assets/icon-512.png (512x512)');
}

generateIcon().catch(console.error);

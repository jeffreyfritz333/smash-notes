const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'images/characters');
const outputDir = path.join(__dirname, 'images/characters_stencil');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

// Read a pixel's grayscale value (0-255) with bounds clamping
function getGray(data, x, y, w, h) {
  x = Math.max(0, Math.min(w - 1, x));
  y = Math.max(0, Math.min(h - 1, y));
  const idx = (y * w + x) * 4;
  return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
}

// Box blur pass to smooth before edge detection (thicker, softer lines)
function boxBlur(data, w, h, radius) {
  const out = new Uint8ClampedArray(data.length);
  const size = 2 * radius + 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.max(0, Math.min(w - 1, x + dx));
          const ny = Math.max(0, Math.min(h - 1, y + dy));
          const idx = (ny * w + nx) * 4;
          r += data[idx]; g += data[idx+1]; b += data[idx+2]; a += data[idx+3];
          count++;
        }
      }
      const oi = (y * w + x) * 4;
      out[oi]   = r / count;
      out[oi+1] = g / count;
      out[oi+2] = b / count;
      out[oi+3] = a / count;
    }
  }
  return out;
}

async function makeStencil(file) {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file.replace(/\.(jpg|jpeg)$/i, '.png'));

  const img = await Jimp.read(inputPath);
  const { width: w, height: h } = img.bitmap;

  // Flatten alpha onto white background
  const flat = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const si = i * 4;
    const alpha = img.bitmap.data[si + 3] / 255;
    flat[si]   = img.bitmap.data[si]   * alpha + 255 * (1 - alpha);
    flat[si+1] = img.bitmap.data[si+1] * alpha + 255 * (1 - alpha);
    flat[si+2] = img.bitmap.data[si+2] * alpha + 255 * (1 - alpha);
    flat[si+3] = 255;
  }

  // Blur to thicken edges (radius 2 = moderate thickness)
  const blurred = boxBlur(flat, w, h, 2);

  // Calligraphy-style Sobel: asymmetric weighting
  // Horizontal Sobel (detects vertical edges - thin in calligraphy)
  const Gx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  // Vertical Sobel (detects horizontal edges - thick in calligraphy)
  const Gy = [
    [-1, -2, -1],
    [ 0,  0,  0],
    [ 1,  2,  1]
  ];

  const edgeData = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = Math.max(0, Math.min(w - 1, x + kx));
          const ny = Math.max(0, Math.min(h - 1, y + ky));
          const idx = (ny * w + nx) * 4;
          const gray = 0.299 * blurred[idx] + 0.587 * blurred[idx+1] + 0.114 * blurred[idx+2];
          gx += gray * Gx[ky + 1][kx + 1];
          gy += gray * Gy[ky + 1][kx + 1];
        }
      }

      // Calligraphy: weight vertical strokes heavier (gy * 1.8) vs horizontal (gx * 0.6)
      const magnitude = Math.min(255, Math.sqrt(gx * gx * 0.36 + gy * gy * 3.24));

      // Threshold + invert: strong edges = dark, background = white
      const threshold = 18;
      const lineStrength = magnitude > threshold ? magnitude : 0;
      // Boost and clamp for visible dark lines
      const pixel = Math.max(0, 255 - Math.min(255, lineStrength * 2.5));

      const oi = (y * w + x) * 4;
      edgeData[oi]   = pixel;
      edgeData[oi+1] = pixel;
      edgeData[oi+2] = pixel;
      edgeData[oi+3] = 255;
    }
  }

  // Write output
  const out = new Jimp({ width: w, height: h });
  out.bitmap.data = Buffer.from(edgeData);
  await out.write(outputPath);
  console.log(`Done: ${file}`);
}

(async () => {
  for (const file of files) {
    await makeStencil(file);
  }
  console.log(`\nAll ${files.length} stencils saved to images/characters_stencil/`);
})();

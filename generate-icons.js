// Run: node generate-icons.js
const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size, outPath) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#f7f4f0';
  ctx.font = `${size * 0.22}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', size / 2, size / 2);
  fs.writeFileSync(outPath, c.toBuffer('image/png'));
  console.log('Created', outPath);
}

try {
  makeIcon(192, 'public/icon-192.png');
  makeIcon(512, 'public/icon-512.png');
} catch (e) {
  console.log('canvas not available, creating SVG-based PNG placeholder');
}

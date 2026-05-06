const sharp = require("sharp");
const path = require("path");

const SIZES = [16, 32, 80];
const BLUE = "#4A90D2";

async function generateIcon(size) {
  const fontSize = Math.round(size * 0.5);
  const supSize = Math.round(size * 0.28);
  const radius = Math.round(size * 0.18);
  const dX = Math.round(size * 0.22);
  const dY = Math.round(size * 0.62);
  const supX = Math.round(size * 0.58);
  const supY = Math.round(size * 0.38);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${BLUE}"/>
    <text x="${dX}" y="${dY}" font-family="system-ui, sans-serif" font-weight="800" font-size="${fontSize}" fill="white">D</text>
    <text x="${supX}" y="${supY}" font-family="system-ui, sans-serif" font-weight="800" font-size="${supSize}" fill="white">2</text>
  </svg>`;

  const outPath = path.join(__dirname, "..", "public", `word-addin-icon-${size}.png`);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log(`Created ${outPath}`);
}

async function main() {
  for (const s of SIZES) await generateIcon(s);
}

main().catch(console.error);

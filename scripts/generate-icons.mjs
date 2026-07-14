// Rasterises the app icon SVG into the PNG sizes the PWA manifest references.
// Run with `npm run generate-icons` after changing the artwork below.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

function icon(size, { maskable = false } = {}) {
  // Maskable icons need padding inside the safe zone; the plain icon fills more.
  const glyph = maskable ? size * 0.5 : size * 0.62;
  const radius = maskable ? 0 : size * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0f172a"/>
  <text x="50%" y="50%" dy="0.03em" text-anchor="middle" dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${glyph}" fill="#f8fafc">&#215;</text>
</svg>`;
}

function render(svg, size) {
  return new Resvg(svg, { fitTo: { mode: "width", value: size } })
    .render()
    .asPng();
}

const targets = [
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of targets) {
  writeFileSync(join(outDir, name), render(icon(size), size));
  console.log(`wrote ${name}`);
}

console.log("done");

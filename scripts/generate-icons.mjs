import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { deflateSync } from "node:zlib";

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "static", "icons");
const sizes = [32, 48, 128];
const supersampling = 4;

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, rgba) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0;
    rgba.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function insideRoundedRectangle(x, y, left, top, right, bottom, radius) {
  const clampedX = Math.max(left + radius, Math.min(right - radius, x));
  const clampedY = Math.max(top + radius, Math.min(bottom - radius, y));
  return Math.hypot(x - clampedX, y - clampedY) <= radius;
}

function mix(target, color, alpha) {
  const inverse = 1 - alpha;
  target[0] = Math.round(target[0] * inverse + color[0] * alpha);
  target[1] = Math.round(target[1] * inverse + color[1] * alpha);
  target[2] = Math.round(target[2] * inverse + color[2] * alpha);
  target[3] = Math.round(target[3] * inverse + color[3] * alpha);
}

function sampleLogo(x, y) {
  const pixel = [0, 0, 0, 0];

  if (insideRoundedRectangle(x, y, 4, 4, 252, 252, 44)) {
    const gradient = Math.max(0, Math.min(1, y / 256));
    pixel[0] = Math.round(16 - 5 * gradient);
    pixel[1] = Math.round(47 - 9 * gradient);
    pixel[2] = Math.round(69 - 11 * gradient);
    pixel[3] = 255;
  }

  const whiteSegments = [
    [132, 77, 78, 77],
    [78, 77, 64, 79],
    [64, 79, 52, 91],
    [52, 91, 52, 105],
    [52, 105, 63, 119],
    [63, 119, 78, 125],
    [78, 125, 115, 125],
    [115, 125, 127, 132],
    [127, 132, 137, 149],
    [137, 149, 160, 174]
  ];

  let shadowDistance = Infinity;
  let whiteDistance = Infinity;
  for (const segment of whiteSegments) {
    shadowDistance = Math.min(
      shadowDistance,
      distanceToSegment(x, y, segment[0], segment[1] + 3, segment[2], segment[3] + 3)
    );
    whiteDistance = Math.min(
      whiteDistance,
      distanceToSegment(x, y, segment[0], segment[1], segment[2], segment[3])
    );
  }

  const orangeShadow = distanceToSegment(x, y, 160, 177, 205, 79);
  const orangeDistance = distanceToSegment(x, y, 160, 174, 205, 76);

  if (shadowDistance <= 13 || orangeShadow <= 13) {
    mix(pixel, [0, 0, 0, 255], 0.18);
  }

  if (whiteDistance <= 10) {
    mix(pixel, [255, 255, 255, 255], 1);
  }

  if (orangeDistance <= 10) {
    mix(pixel, [255, 150, 47, 255], 1);
  }

  return pixel;
}

function render(size) {
  const highResolution = size * supersampling;
  const rgba = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const accumulated = [0, 0, 0, 0];

      for (let sy = 0; sy < supersampling; sy += 1) {
        for (let sx = 0; sx < supersampling; sx += 1) {
          const sourceX = ((x * supersampling + sx + 0.5) / highResolution) * 256;
          const sourceY = ((y * supersampling + sy + 0.5) / highResolution) * 256;
          const sample = sampleLogo(sourceX, sourceY);
          accumulated[0] += sample[0];
          accumulated[1] += sample[1];
          accumulated[2] += sample[2];
          accumulated[3] += sample[3];
        }
      }

      const samples = supersampling * supersampling;
      const offset = (y * size + x) * 4;
      rgba[offset] = Math.round(accumulated[0] / samples);
      rgba[offset + 1] = Math.round(accumulated[1] / samples);
      rgba[offset + 2] = Math.round(accumulated[2] / samples);
      rgba[offset + 3] = Math.round(accumulated[3] / samples);
    }
  }

  return encodePng(size, size, rgba);
}

export async function generateIcons() {
  await mkdir(outputDirectory, { recursive: true });

  for (const size of sizes) {
    await writeFile(path.join(outputDirectory, `icon${size}.png`), render(size));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await generateIcons();
}

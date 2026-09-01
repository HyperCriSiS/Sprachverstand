import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const expectedSizes = new Map([
  ["icon32.png", 32],
  ["icon48.png", 48],
  ["icon128.png", 128]
]);
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let value = 0; value < 256; value += 1) {
    let current = value;
    for (let bit = 0; bit < 8; bit += 1) {
      current = (current & 1) !== 0
        ? 0xedb88320 ^ (current >>> 1)
        : current >>> 1;
    }
    table[value] = current >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function validatePng(buffer, expectedSize, filePath) {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`${filePath}: ungültige PNG-Signatur`);
  }

  let offset = 8;
  let width;
  let height;
  let sawIend = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcOffset = dataEnd;
    const nextOffset = crcOffset + 4;

    if (nextOffset > buffer.length) {
      throw new Error(`${filePath}: abgeschnittener PNG-Block`);
    }

    const type = buffer.subarray(typeStart, dataStart).toString("ascii");
    const storedCrc = buffer.readUInt32BE(crcOffset);
    const calculatedCrc = crc32(buffer.subarray(typeStart, dataEnd));
    if (storedCrc !== calculatedCrc) {
      throw new Error(`${filePath}: CRC-Fehler im Block ${type}`);
    }

    if (type === "IHDR") {
      if (length !== 13) {
        throw new Error(`${filePath}: ungültiger IHDR-Block`);
      }
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
    }

    if (type === "IEND") {
      sawIend = true;
      offset = nextOffset;
      break;
    }

    offset = nextOffset;
  }

  if (!sawIend || offset !== buffer.length) {
    throw new Error(`${filePath}: ungültiges PNG-Ende`);
  }
  if (width !== expectedSize || height !== expectedSize) {
    throw new Error(
      `${filePath}: erwartet ${expectedSize}x${expectedSize}, erhalten ${width}x${height}`
    );
  }
}

const directories = process.argv.slice(2);
if (directories.length === 0) {
  directories.push(
    "dist/chromium/icons",
    "dist/edge/icons",
    "dist/opera/icons",
    "dist/firefox/icons"
  );
}

for (const directory of directories) {
  for (const [fileName, expectedSize] of expectedSizes) {
    const filePath = path.join(directory, fileName);
    const buffer = await readFile(filePath);
    validatePng(buffer, expectedSize, filePath);
    console.log(`OK ${filePath}`);
  }
}

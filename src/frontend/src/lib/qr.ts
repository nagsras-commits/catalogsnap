/**
 * Minimal deterministic QR code encoder (byte mode, EC level M).
 *
 * Native implementation with zero runtime dependencies and no network calls —
 * the store link is encoded locally and rendered to a canvas. Supports the
 * versions needed for typical storefront URLs (1–10, up to 213 bytes).
 */

const EC_CODEWORDS_PER_BLOCK: Record<number, number> = {
  1: 10,
  2: 16,
  3: 26,
  4: 18,
  5: 24,
  6: 16,
  7: 18,
  8: 22,
  9: 22,
  10: 26,
};
const EC_BLOCKS: Record<number, number> = {
  1: 1,
  2: 1,
  3: 1,
  4: 2,
  5: 2,
  6: 4,
  7: 4,
  8: 4,
  9: 5,
  10: 5,
};
const TOTAL_CODEWORDS: Record<number, number> = {
  1: 26,
  2: 44,
  3: 70,
  4: 100,
  5: 134,
  6: 172,
  7: 196,
  8: 242,
  9: 292,
  10: 346,
};
const ALIGNMENT_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const result = new Array<number>(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < ecCount; i++) {
      result[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return result;
}

function pickVersion(byteLength: number): number {
  for (let v = 1; v <= 10; v++) {
    const capacityBits = TOTAL_CODEWORDS[v] * 8;
    const ecBits = EC_CODEWORDS_PER_BLOCK[v] * EC_BLOCKS[v] * 8;
    const dataBits = capacityBits - ecBits;
    const needed = 4 + 8 + byteLength * 8;
    if (needed <= dataBits) return v;
  }
  throw new Error("Store link is too long to encode as a QR code.");
}

function buildDataCodewords(bytes: number[], version: number): number[] {
  const totalDataBits =
    TOTAL_CODEWORDS[version] * 8 -
    EC_CODEWORDS_PER_BLOCK[version] * EC_BLOCKS[version] * 8;
  const bits: number[] = [];

  const pushBits = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  pushBits(0b0100, 4); // byte mode
  pushBits(bytes.length, 8);
  for (const byte of bytes) pushBits(byte, 8);

  const terminator = Math.min(4, totalDataBits - bits.length);
  for (let i = 0; i < terminator; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j++) value = (value << 1) | bits[i + j];
    codewords.push(value);
  }

  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length * 8 < totalDataBits) {
    codewords.push(padBytes[padIndex % 2]);
    padIndex++;
  }
  return codewords;
}

function interleave(dataCodewords: number[], version: number): number[] {
  const numBlocks = EC_BLOCKS[version];
  const ecPerBlock = EC_CODEWORDS_PER_BLOCK[version];
  const totalData = dataCodewords.length;
  const shortBlockLen = Math.floor(totalData / numBlocks);
  const numLongBlocks = totalData % numBlocks;

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const len = shortBlockLen + (b >= numBlocks - numLongBlocks ? 1 : 0);
    const block = dataCodewords.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
  }

  const result: number[] = [];
  const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  return result;
}

function createMatrix(version: number): boolean[][] {
  const size = version * 4 + 17;
  return Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
}

function placeFinder(matrix: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= matrix.length || cc < 0 || cc >= matrix.length)
        continue;
      const inRing =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[rr][cc] = inRing || inCore;
    }
  }
}

function placeAlignment(matrix: boolean[][], version: number) {
  const centers = ALIGNMENT_CENTERS[version];
  for (const row of centers) {
    for (const col of centers) {
      if (matrix[row][col]) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isRing = Math.abs(r) === 2 || Math.abs(c) === 2;
          const isCore = r === 0 && c === 0;
          matrix[row + r][col + c] = isRing || isCore;
        }
      }
    }
  }
}

function placeTiming(matrix: boolean[][]) {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    const value = i % 2 === 0;
    if (!matrix[6][i]) matrix[6][i] = value;
    if (!matrix[i][6]) matrix[i][6] = value;
  }
}

function reserveFormat(matrix: boolean[][]) {
  const size = matrix.length;
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      matrix[8][i] = false;
      matrix[i][8] = false;
    }
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 1 - i] = false;
    matrix[size - 1 - i][8] = false;
  }
  matrix[size - 8][8] = true; // dark module
}

function placeData(matrix: boolean[][], codewords: number[]) {
  const size = matrix.length;
  const bits: number[] = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  }

  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (isReserved(row, cc, size)) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        matrix[row][cc] = bit;
        bitIndex++;
      }
    }
    upward = !upward;
  }
}

function isReserved(row: number, col: number, size: number): boolean {
  if (row === 6 || col === 6) return true;
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;
  return false;
}

function applyMask(matrix: boolean[][], version: number) {
  const size = matrix.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isReserved(row, col, size)) continue;
      if ((row + col) % 2 === 0) matrix[row][col] = !matrix[row][col];
    }
  }
  void version;
}

function placeFormatInfo(matrix: boolean[][]) {
  const size = matrix.length;
  // EC level M (0b00) + mask pattern 0 (0b000) => format bits.
  const formatBits = 0b101010000010010;
  const getBit = (i: number) => ((formatBits >> i) & 1) === 1;

  for (let i = 0; i <= 5; i++) matrix[8][i] = getBit(i);
  matrix[8][7] = getBit(6);
  matrix[8][8] = getBit(7);
  matrix[7][8] = getBit(8);
  for (let i = 9; i <= 14; i++) matrix[14 - i][8] = getBit(i);

  for (let i = 0; i <= 7; i++) matrix[size - 1 - i][8] = getBit(i);
  for (let i = 8; i <= 14; i++) matrix[8][size - 15 + i] = getBit(i);
  matrix[size - 8][8] = true;
}

/** Encode text into a boolean QR matrix (true = dark module). */
export function encodeQrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = pickVersion(bytes.length);
  const dataCodewords = buildDataCodewords(bytes, version);
  const finalCodewords = interleave(dataCodewords, version);

  const matrix = createMatrix(version);
  placeFinder(matrix, 0, 0);
  placeFinder(matrix, 0, matrix.length - 7);
  placeFinder(matrix, matrix.length - 7, 0);
  placeAlignment(matrix, version);
  placeTiming(matrix);
  reserveFormat(matrix);
  placeData(matrix, finalCodewords);
  applyMask(matrix, version);
  placeFormatInfo(matrix);
  return matrix;
}

/** Render a QR matrix to a canvas element at the given pixel size. */
export function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  pixelSize: number,
): void {
  const matrix = encodeQrMatrix(text);
  const modules = matrix.length;
  const quiet = 4;
  const total = modules + quiet * 2;
  const scale = Math.max(1, Math.floor(pixelSize / total));
  const size = total * scale;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (matrix[row][col]) {
        ctx.fillRect(
          (col + quiet) * scale,
          (row + quiet) * scale,
          scale,
          scale,
        );
      }
    }
  }
}

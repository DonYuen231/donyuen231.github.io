export interface PreprocessResult {
  crop: { x: number; y: number; w: number; h: number };
  scaled: Float64Array;
  scaledSize: { w: number; h: number };
  shift: { dx: number; dy: number };
  output: Float64Array;
}

const THRESHOLD = 0.1;
const GRID = 28;
const TARGET = 20;

export function inkFromAlpha(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Float64Array {
  const ink = new Float64Array(width * height);
  for (let i = 0; i < ink.length; i++) ink[i] = rgba[i * 4 + 3] / 255;
  return ink;
}

/** Area-average resize of a (sw x sh) region at (sx, sy) to (dw x dh). */
function areaResize(
  src: Float64Array,
  stride: number,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Float64Array {
  const out = new Float64Array(dw * dh);
  const xs = sw / dw;
  const ys = sh / dh;
  for (let dy = 0; dy < dh; dy++) {
    const y0 = dy * ys;
    const y1 = y0 + ys;
    for (let dx = 0; dx < dw; dx++) {
      const x0 = dx * xs;
      const x1 = x0 + xs;
      let sum = 0;
      for (let y = Math.floor(y0); y < Math.min(sh, Math.ceil(y1)); y++) {
        const wy = Math.min(y + 1, y1) - Math.max(y, y0);
        for (let x = Math.floor(x0); x < Math.min(sw, Math.ceil(x1)); x++) {
          const wx = Math.min(x + 1, x1) - Math.max(x, x0);
          sum += src[(sy + y) * stride + sx + x] * wx * wy;
        }
      }
      out[dy * dw + dx] = sum / (xs * ys);
    }
  }
  return out;
}

export function preprocess(
  ink: Float64Array,
  width: number,
  height: number,
): PreprocessResult | null {
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1,
    count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (ink[y * width + x] > THRESHOLD) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (count < 3) return null;

  const crop = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  const longest = Math.max(crop.w, crop.h);
  const sw = Math.max(1, Math.round((crop.w * TARGET) / longest));
  const sh = Math.max(1, Math.round((crop.h * TARGET) / longest));
  const scaled = areaResize(ink, width, crop.x, crop.y, crop.w, crop.h, sw, sh);

  const offX = Math.floor((GRID - sw) / 2);
  const offY = Math.floor((GRID - sh) / 2);
  const grid = new Float64Array(GRID * GRID);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++)
      grid[(y + offY) * GRID + x + offX] = scaled[y * sw + x];

  let mass = 0,
    mx = 0,
    my = 0;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const v = grid[y * GRID + x];
      mass += v;
      mx += v * x;
      my += v * y;
    }
  }
  const dx = mass > 0 ? Math.round(14 - mx / mass) : 0;
  const dy = mass > 0 ? Math.round(14 - my / mass) : 0;

  const output = new Float64Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
      output[ny * GRID + nx] = Math.min(1, Math.max(0, grid[y * GRID + x]));
    }
  }
  return {
    crop,
    scaled,
    scaledSize: { w: sw, h: sh },
    shift: { dx, dy },
    output,
  };
}

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  forward,
  parseModel,
  topGuess,
  type ModelMeta,
} from '../../src/components/mnist/model';
import {
  inkFromAlpha,
  preprocess,
} from '../../src/components/mnist/preprocess';

const N = 280;

function canvas(): Float64Array {
  return new Float64Array(N * N);
}

describe('preprocess', () => {
  it('returns null for an empty canvas and a single dot', () => {
    expect(preprocess(canvas(), N, N)).toBeNull();
    const dot = canvas();
    dot[100 * N + 100] = 1;
    expect(preprocess(dot, N, N)).toBeNull();
  });

  it('scales a 100x40 rectangle to 20x8 and centres it', () => {
    const ink = canvas();
    for (let y = 200; y < 240; y++)
      for (let x = 150; x < 250; x++) ink[y * N + x] = 1;
    const r = preprocess(ink, N, N)!;
    expect(r.scaledSize).toEqual({ w: 20, h: 8 });
    expect(r.output).toHaveLength(784);
    let m = 0,
      cx = 0,
      cy = 0;
    for (let i = 0; i < 784; i++) {
      m += r.output[i];
      cx += r.output[i] * (i % 28);
      cy += r.output[i] * Math.floor(i / 28);
    }
    expect(Math.abs(cx / m - 14)).toBeLessThanOrEqual(0.5 + 1e-9);
    expect(Math.abs(cy / m - 14)).toBeLessThanOrEqual(0.5 + 1e-9);
    for (const v of r.output) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('inkFromAlpha reads the alpha channel', () => {
    const rgba = new Uint8ClampedArray([9, 9, 9, 255, 0, 0, 0, 0]);
    expect(Array.from(inkFromAlpha(rgba, 2, 1))).toEqual([1, 0]);
  });
});

describe('integration: samples -> preprocess -> forward', () => {
  const meta = JSON.parse(
    readFileSync('public/models/mnist/model.json', 'utf8'),
  ) as ModelMeta;
  const bytes = readFileSync('public/models/mnist/weights.bin');
  const model = parseModel(
    meta,
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  const samples = JSON.parse(
    readFileSync('public/models/mnist/samples.json', 'utf8'),
  ) as {
    label: number;
    index: number;
    pixels: number[];
  }[];

  it('has 10 samples sorted by label', () => {
    expect(samples.map((s) => s.label)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  for (let k = 0; k < 10; k++) {
    it(`classifies sample ${k} after 10x upscale`, () => {
      const s = samples[k];
      const ink = canvas();
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          ink[y * N + x] =
            s.pixels[Math.floor(y / 10) * 28 + Math.floor(x / 10)];
      const r = preprocess(ink, N, N)!;
      expect(r).not.toBeNull();
      expect(topGuess(forward(model, r.output).probs).digit).toBe(s.label);
    });
  }
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  forward,
  parseModel,
  topGuess,
  type ModelMeta,
} from '../../src/components/mnist/model';

const meta = JSON.parse(
  readFileSync('public/models/mnist/model.json', 'utf8'),
) as ModelMeta;
const bytes = readFileSync('public/models/mnist/weights.bin');
const buffer = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength,
);
const fixtures = JSON.parse(
  readFileSync('tests/fixtures/mnist-fixtures.json', 'utf8'),
);

describe('parseModel', () => {
  it('throws when the buffer is 4 bytes short', () => {
    expect(() =>
      parseModel(meta, buffer.slice(0, buffer.byteLength - 4)),
    ).toThrow('weights.bin length mismatch');
  });

  it('parses the real weights', () => {
    const model = parseModel(meta, buffer);
    expect(model.W[0]).toHaveLength(784 * 128);
    expect(model.b[2]).toHaveLength(10);
  });
});

describe('forward', () => {
  const model = parseModel(meta, buffer);

  it('matches the 20 forward fixtures', () => {
    for (const f of fixtures.forward) {
      const { probs } = forward(model, f.pixels);
      expect(probs).toHaveLength(10);
      for (let i = 0; i < 10; i++)
        expect(Math.abs(probs[i] - f.probs[i])).toBeLessThan(1e-5);
      const argmax = f.probs.indexOf(Math.max(...f.probs));
      expect(topGuess(probs).digit).toBe(argmax);
    }
  });

  it('matches the backward fixture logits', () => {
    const b = fixtures.backward;
    const { logits, z, a } = forward(model, b.pixels);
    for (let i = 0; i < 10; i++)
      expect(Math.abs(logits[i] - b.logits[i])).toBeLessThan(1e-4);
    expect(z.map((v) => v.length)).toEqual([128, 64, 10]);
    expect(a.map((v) => v.length)).toEqual([784, 128, 64]);
  });
});

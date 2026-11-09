export interface ModelMeta {
  version: string;
  layers: number[];
  learningRate: number;
  testAccuracy: number;
  order: { name: 'W1' | 'b1' | 'W2' | 'b2' | 'W3' | 'b3'; shape: number[] }[];
}

/** W[l] is row-major (in, out): z[j] = sum_i x[i] * W[i * out + j] + b[j]. */
export interface Model {
  meta: ModelMeta;
  W: Float32Array[];
  b: Float32Array[];
}

/** a[0] = input (784), a[1] = relu(z[0]) (128), a[2] = relu(z[1]) (64); logits = z[2]. */
export interface ForwardResult {
  z: Float64Array[];
  a: Float64Array[];
  logits: Float64Array;
  probs: Float64Array;
}

export function parseModel(meta: ModelMeta, buffer: ArrayBuffer): Model {
  const total = meta.order.reduce(
    (sum, t) => sum + t.shape.reduce((p, n) => p * n, 1),
    0,
  );
  if (buffer.byteLength !== total * 4)
    throw new Error('weights.bin length mismatch');
  const view = new DataView(buffer);
  const tensors: Record<string, Float32Array> = {};
  let offset = 0;
  for (const { name, shape } of meta.order) {
    const count = shape.reduce((p, n) => p * n, 1);
    const data = new Float32Array(count);
    for (let i = 0; i < count; i++, offset += 4)
      data[i] = view.getFloat32(offset, true);
    tensors[name] = data;
  }
  return {
    meta,
    W: [tensors.W1, tensors.W2, tensors.W3],
    b: [tensors.b1, tensors.b2, tensors.b3],
  };
}

export async function loadModel(baseUrl = '/models/mnist/'): Promise<Model> {
  const [metaRes, weightsRes] = await Promise.all([
    fetch(`${baseUrl}model.json`),
    fetch(`${baseUrl}weights.bin`),
  ]);
  if (!metaRes.ok)
    throw new Error(`model.json failed to load (${metaRes.status})`);
  if (!weightsRes.ok)
    throw new Error(`weights.bin failed to load (${weightsRes.status})`);
  const meta = (await metaRes.json()) as ModelMeta;
  return parseModel(meta, await weightsRes.arrayBuffer());
}

export function forward(model: Model, x: ArrayLike<number>): ForwardResult {
  const { layers } = model.meta;
  const a: Float64Array[] = [Float64Array.from(x)];
  const z: Float64Array[] = [];
  for (let l = 0; l < model.W.length; l++) {
    const nIn = layers[l];
    const nOut = layers[l + 1];
    const W = model.W[l];
    const zl = new Float64Array(nOut);
    zl.set(model.b[l]);
    const input = a[l];
    for (let i = 0; i < nIn; i++) {
      const xi = input[i];
      if (xi === 0) continue;
      const row = i * nOut;
      for (let j = 0; j < nOut; j++) zl[j] += xi * W[row + j];
    }
    z.push(zl);
    if (l < model.W.length - 1) a.push(zl.map((v) => (v > 0 ? v : 0)));
  }
  const logits = z[z.length - 1];
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  const probs = new Float64Array(logits.length);
  let sum = 0;
  for (let j = 0; j < logits.length; j++) {
    probs[j] = Math.exp(logits[j] - max);
    sum += probs[j];
  }
  for (let j = 0; j < probs.length; j++) probs[j] /= sum;
  return { z, a, logits, probs };
}

export function topGuess(probs: ArrayLike<number>): {
  digit: number;
  p: number;
} {
  let digit = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[digit]) digit = i;
  return { digit, p: probs[digit] };
}

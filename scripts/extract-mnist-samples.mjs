// Extracts the 10 sample digits from the model export fixtures into a small public JSON file.
import { readFileSync, writeFileSync } from 'node:fs';

const fixtures = JSON.parse(
  readFileSync('tests/fixtures/mnist-fixtures.json', 'utf8'),
);
const samples = fixtures.samples
  .map(({ label, index, pixels }) => ({ label, index, pixels }))
  .sort((a, b) => a.label - b.label);
writeFileSync('public/models/mnist/samples.json', JSON.stringify(samples));
console.log(`wrote ${samples.length} samples`);

import { describe, expect, it } from 'vitest';

import { TNT } from '../tnt';
import { makeData } from './makeData';

describe('Multi RHS, random values', () => {
  it('Values between 0 and 1', () => {
    for (let i = 0; i < 1e2; i++) {
      const m = Math.ceil(Math.random() * 12) + 2;
      const n = Math.ceil(Math.random() * 12) + 2;
      const { inputs: X, outputs: b } = makeData(m, n, { outputColumns: n });
      const { Beta, metadata: e } = new TNT(X, b, {
        maxIterations: 4,
        earlyStopping: { minMSE: 1e-6 },
      });
      expect(e[0].mseMin).toBeLessThan(1e-4);
      expect(Beta.to1DArray().every(Number.isFinite)).toBeTruthy();
    }
  });

  it('Scaled Up A', () => {
    for (let i = 0; i < 1e2; i++) {
      const m = Math.ceil(Math.random() * 12) + 2;
      const n = Math.ceil(Math.random() * 12) + 2;
      const { inputs: X, outputs: Y } = makeData(m, n, {
        scaleX: 100,
        outputColumns: m,
      });
      const { metadata, maxIterations, Beta } = new TNT(X, Y, {
        maxIterations: 15,
        earlyStopping: { minMSE: 1e-4 },
      });
      expect(Beta.to1DArray().every(Number.isFinite)).toBeTruthy();
      const { mse, mseMin, iterations } = metadata[0];
      expect(mseMin).toBeLessThan(1e-4);
      expect(iterations).toBeLessThanOrEqual(maxIterations);
      expect(mse.length).toBeLessThanOrEqual(maxIterations + 1);
    }
  });
  it('Scaled Up B (on AX=>Y) to make large B', () => {
    for (let i = 0; i < 1e2; i++) {
      const m = Math.ceil(Math.random() * 12) + 2;
      const n = Math.ceil(Math.random() * 12) + 2;
      const { inputs: X, outputs: bigY } = makeData(m, n, {
        scaleB: 10,
        outputColumns: m,
        addNoise: true,
      });
      const {
        metadata,
        maxIterations,
        Beta: xBest,
      } = new TNT(X, bigY, {
        maxIterations: 4,
        earlyStopping: { minMSE: 1e-4 },
      });

      expect(xBest.to1DArray().every(Number.isFinite)).toBeTruthy();

      const { mse, mseMin, iterations } = metadata[0];
      expect(mseMin).toBeLessThan(0.1);
      expect(iterations).toBeLessThanOrEqual(maxIterations);
      expect(mse.length).toBeLessThanOrEqual(maxIterations + 1);
    }
  });
});

import { Matrix } from 'ml-matrix';
import { describe, expect, it } from 'vitest';

import { meanSquaredError } from '../meanSquaredError';

describe('meanSquaredError', () => {
  const X = new Matrix([
    [1, 2],
    [3, 4],
  ]);
  it('Returns the mean squared error single RHS', () => {
    const B = new Matrix([[1], [2]]);
    const Y = new Matrix([[5], [11]]);
    expect(meanSquaredError(X, Y, B)[0]).toBeCloseTo(0, 10);
  });
  it('Returns the mean squared error multi RHS', () => {
    const B = new Matrix([
      [1, 4],
      [2, 4],
    ]);
    const Y = new Matrix([
      [5, 14],
      [11, 32],
    ]);
    expect(meanSquaredError(X, Y, B)[0]).toBeCloseTo(0, 10);
    expect(meanSquaredError(X, Y, B)[1]).toBeCloseTo(10, 10);
  });
});

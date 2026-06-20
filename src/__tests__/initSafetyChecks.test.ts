import { Matrix } from 'ml-matrix';
import { describe, expect, it, vi } from 'vitest';

import { checkMatchingDimensions } from '../initSafetyChecks';

const m = 3;
const n = 4;
const p = 2;

describe('checkMatchingDimensions', () => {
  it('should return undefined', () => {
    const X = Matrix.random(m, n);
    const Y = Matrix.random(m, p);
    const B = Matrix.zeros(n, p);

    const fn = vi.fn().mockImplementation(checkMatchingDimensions);

    expect(fn(X, B, Y)).toBeUndefined();
  });

  it('should throw an error fot X, X', () => {
    const X = Matrix.random(m, n);
    const Y = Matrix.random(m, p);
    const B = Matrix.zeros(n - 1, p);
    expect(() => {
      checkMatchingDimensions(X, B, Y);
    }).toThrow();
  });
  it('should throw an error fot X, X', () => {
    const X = Matrix.random(m, n);
    const Y = Matrix.random(m, p - 1);
    const B = Matrix.zeros(n, p);
    expect(() => {
      checkMatchingDimensions(X, B, Y);
    }).toThrow();
  });

  it('should throw an error fot X, B', () => {
    const X = Matrix.random(m, n);
    const Y = Matrix.random(m - 1, p);
    const B = Matrix.zeros(n, p);
    expect(() => {
      checkMatchingDimensions(X, B, Y);
    }).toThrow();
  });
});

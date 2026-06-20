import { Matrix } from 'ml-matrix';
import { describe, expect, it } from 'vitest';

import { symmetricMul, symmetricMulUpperLower } from '../symmetricMul';

describe('symmetricMul', () => {
  it('Returns the XtX matrix', () => {
    const Xt = new Matrix([
      [1, 2, 3, 3],
      [4, 5, 6, 6],
      [7, 8, 9, 7],
    ]);
    const XtX = symmetricMul(Xt);
    expect(XtX.isSymmetric()).toBe(true);
    expect(XtX.get(0, 0)).toEqual(23);
    expect(XtX.get(0, 1)).toEqual(50);
    expect(XtX.get(2, 2)).toEqual(243);
  });

  it('Same matrix but U * Ut', () => {
    const U = new Matrix([
      [1, 2, 3],
      [0, 5, 6],
      [0, 0, 9],
    ]);
    const UtU = symmetricMul(U);
    const UtU2 = symmetricMulUpperLower(U);
    expect(UtU.to2DArray()).toEqual(UtU2.to2DArray());
  });
});

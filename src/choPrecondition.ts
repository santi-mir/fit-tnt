import type { Matrix } from 'ml-matrix';
import { CholeskyDecomposition } from 'ml-matrix';

import { PreconditionError } from './Errors';
import { getCriteria } from './getCholeskyCriteria';

/**
 * Do `A^T X += d*I` until XtX is positive definite and `L` is "nice".
 * **Mutates** XtA
 * @param XtX - Symmetric matrix from the normal equation.
 * @returns Cholesky Decomposition of XtA
 */
export function choleskyPrecondition(XtX: Matrix) {
  let choleskyDC = new CholeskyDecomposition(XtX);

  let diag = choleskyDC.lowerTriangularMatrix.diagonal();

  let it = 5; // increase epsilon
  let criteria = getCriteria(diag, -it);

  while (criteria.ratio < 1e-4 || !choleskyDC.isPositiveDefinite()) {
    if (!Number.isFinite(criteria.eps) || !it) {
      //includes isNaN
      throw new PreconditionError();
    }
    for (let i = 0; i < XtX.rows; i++) {
      XtX.set(i, i, XtX.get(i, i) + criteria.eps);
    }
    choleskyDC = new CholeskyDecomposition(XtX); //again
    diag = choleskyDC.lowerTriangularMatrix.diagonal();
    criteria = getCriteria(diag, 1 - it);
    it--;
  }

  return choleskyDC;
}

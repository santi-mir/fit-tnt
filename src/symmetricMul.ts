import { Matrix } from 'ml-matrix';

/**
 * Multiply a matrix by its transpose.
 * To calculate `XtA` pass `Xt`, to calculate `AXt` pass `A`.
 *
 * Uses symmetry and contiguity to increase speed.
 * @param Y - The matrix to multiply by its transpose.
 * @returns Square matrix, result of `Y * B^t`.
 */
export function symmetricMul(Y: Matrix) {
  const BYt = new Matrix(Y.rows, Y.rows);

  let d, terms;
  for (let i = 0; i < Y.rows; i++) {
    //row i
    d = 0;
    // set diagonal value
    for (let t = 0; t < Y.columns; t++) {
      d += Y.get(i, t) ** 2;
    }
    BYt.set(i, i, d);

    // row_i x all_prev_rows; filling up an L
    // but we set both: L and L'
    for (let j = 0; j < i; j++) {
      terms = 0;
      for (let k = 0; k < Y.columns; k++) {
        // dot prod
        terms += Y.get(i, k) * Y.get(j, k);
      }
      BYt.set(j, i, terms);
      BYt.set(i, j, terms);
    }
  }
  // BYt.add(BYt.transpose()); // no speed up, more memory.
  return BYt;
}

/**
 * Compute `U * L`.
 *
 * Take advantage of symmetry.
 * @param U - The upper triangular matrix to multiply by its transpose.
 * @returns `U * L`
 */
export function symmetricMulUpperLower(U: Matrix) {
  const R = new Matrix(U.rows, U.rows);

  let d, terms;
  for (let i = 0; i < U.rows; i++) {
    d = 0;
    for (let t = 0; t < U.columns; t++) {
      d += U.get(i, t) ** 2;
    }
    R.set(i, i, d);

    for (let j = 0; j < i; j++) {
      terms = 0;
      for (let k = i; k < U.columns; k++) {
        terms += U.get(i, k) * U.get(j, k);
      }
      R.set(j, i, terms);
      R.set(i, j, terms);
    }
  }
  return R;
}

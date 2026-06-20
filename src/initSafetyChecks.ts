import { AnyMatrix } from './types';

/**
 * Check that dimensionality of matrices matches.
 * @param X input data matrix
 * @param B solution matrix
 * @param Y results matrix
 */
export function checkMatchingDimensions(
  X: AnyMatrix,
  B: AnyMatrix,
  Y: AnyMatrix,
) {
  if (X.rows !== Y.rows) {
    throw new RangeError(
      `Rows of X and y must match. Found dim(X)=(${X.rows}, ${X.columns}) and dim(y)=(${Y.rows}, ${Y.columns})`,
    );
  }
  if (X.columns !== B.rows) {
    throw new RangeError(
      `Columns of X and rows of B must match. Found dim(X)=(${X.rows}, ${X.columns}) and dim(B)=(${B.rows}, ${B.columns})`,
    );
  }
  if (B.columns !== Y.columns) {
    throw new RangeError(
      `Columns of B and y must match. Found dim(B)=(${B.rows}, ${B.columns}) and dim(y)=(${Y.rows}, ${Y.columns})`,
    );
  }
}

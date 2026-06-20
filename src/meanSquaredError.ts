import { AnyMatrix } from './types';

/**
 * Calculate the mean squared error `||AB - B||^2`
 * @param X input data
 * @param Y output data
 * @param B current coefficients
 * @returns the mean squared error
 */
export function meanSquaredError(X: AnyMatrix, Y: AnyMatrix, B: AnyMatrix) {
  const Err: AnyMatrix = X.mmul(B).sub(Y);
  const { rows: samples, columns: coeffs } = Err;

  const result: number[] = new Array(B.columns).fill(0) as number[];
  if (Err.isColumnVector()) {
    return [Err.dot(Err) / samples];
  } else {
    // square of each number in the matrix, and add it up.
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < coeffs; j++) {
        result[j] += Err.get(i, j) ** 2;
      }
    }
    for (let v = 0; v < result.length; v++) {
      result[v] /= samples;
    }
  }
  return result;
}

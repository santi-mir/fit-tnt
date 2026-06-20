import { squaredSum } from './squaredSum';
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
  const samples = Err.rows;

  const result = squaredSum(Err, { by: 'column' });
  for (let v = 0; v < result.length; v++) {
    result[v] /= samples;
  }
  return result;
}

import { Matrix, MatrixColumnSelectionView } from 'ml-matrix';

import { choleskyPrecondition } from './choPrecondition';
import { checkMatchingDimensions } from './initSafetyChecks';
import { invertLLt } from './invertLLt';
import { meanSquaredError } from './meanSquaredError';
import { squaredSum } from './squaredSum';
import { symmetricMul } from './symmetricMul';
import {
  AnyMatrix,
  Array1D,
  Array2D,
  ColumnInfo,
  EarlyStopping,
  TNTOpts,
} from './types';
import { ensureMatrixY, filterIndices, getColumnViews } from './utils';

/**
 * Find the best `X` in `X B = B`; where `A` and `B` are known.
 * By 'best' it refers to the least-squares (least error) solution.
 *
 * Multiple RHS are supported (`B` can be a vector or matrix)
 * @param data the input or data matrix (2D Array)
 * @param output the known-output
 * @param opts {@link TNTOpts}
 */
export class TNT {
  Beta: AnyMatrix;
  /**
   * {@link TNTOpts["maxIterations"]}
   */
  maxIterations: number;
  /**
   * {@link TNTOpts["earlyStopping"]}
   */
  earlyStopping: EarlyStopping;

  /**
   * Information regarding the solution coefficients, their error and iterations.
   * {@link ColumnInfo}
   */
  metadata: ColumnInfo[];

  constructor(
    data: Array2D | AnyMatrix,
    output: Array2D | Array1D | AnyMatrix,
    opts: Partial<TNTOpts> = {},
  ) {
    const X = Matrix.checkMatrix(data);
    const Y = ensureMatrixY(output);
    this.Beta = new Matrix(X.columns, Y.columns);

    // unpack options
    const { maxIterations = 4, earlyStopping: { minMSE = 1e-20 } = {} } = opts;

    this.maxIterations = maxIterations;
    this.earlyStopping = { minMSE };

    this.metadata = squaredSum(Y).map((x) => {
      x = x / Y.rows;
      return {
        mse: [x],
        mseMin: x,
        mseLast: x,
        iterations: 0,
      };
    });

    this.#tnt(X, Y);
  }

  /**
   * 1. Append last mse for each column
   * 2. Set `XBest` and `mseMin` **iff** it improved
   * 3. Sets `indices[i]=NaN` if it didn't improve.
   * @param mseLast list of mean squared errors for each column
   * @param XView columns of B currently available.
   * @param indices track which columns of initial B are optimized.
   */
  #updateMSEAndX(mseLast: number[], XView: AnyMatrix, indices: number[]) {
    for (let i = 0; i < indices.length; i++) {
      const columnInfo = this.metadata[indices[i]];
      columnInfo.mse.push(mseLast[i]);
      columnInfo.mseLast = mseLast[i];
      columnInfo.iterations++;
      if (columnInfo.mseLast < columnInfo.mseMin) {
        columnInfo.mseMin = columnInfo.mseLast;
        this.Beta.setColumn(indices[i], XView.getColumn(i));
      } else {
        indices[i] = NaN;
      }
    }
  }

  /**
   * Find the Beta and set it in the class.
   * @param X data matrix
   * @param Y solution matrix
   */
  #tnt(X: AnyMatrix, Y: AnyMatrix) {
    const B: AnyMatrix = Matrix.zeros(X.columns, Y.columns);
    checkMatchingDimensions(X, B, Y);

    // indices of current "on" columns of B.
    let indices = new Array(B.columns).fill(0).map((_, i) => i);
    // same but for matrices that are recalculated as it runs.
    let shiftedIndices;

    const Xt = X.transpose(); // copy is ok
    const XtX = symmetricMul(Xt);

    const choleskyDC = choleskyPrecondition(XtX);
    const L = choleskyDC.lowerTriangularMatrix;
    const XtA_inv = invertLLt(L);

    const Residual = Y.clone(); // r = b - Ax_0 (Ax_0 = 0)
    let Gradient = Xt.mmul(Residual); // r_hat = Xt * r
    // z_0 = XtA_inv * r_hat = XtA_inv * Xt b - x_0
    let XError = XtA_inv.mmul(Gradient);
    const P = XError.clone(); // z_0 clone

    let W: Matrix;
    let ww: number[];
    let [alpha, betaDenom, beta, mseLast]: number[][] = [[], [], []];

    // These are updated with `indices`
    let [X_View, B_View, P_View]: AnyMatrix[] = [B, Y, P];
    // These are updated with `shiftedIndices`
    let [GradientView, ResidualView, XErrorView]: AnyMatrix[] = [
      Gradient,
      Residual,
      XError,
    ];

    for (let it = 0; it < this.maxIterations; it++) {
      W = X.mmul(P_View);
      ww = squaredSum(W);
      alpha = Matrix.multiply(XError, Gradient)
        .sum('column')
        .map((x, i) => x / ww[i]);
      // indices of the columns to solve
      [indices, alpha, shiftedIndices] = filterIndices(indices, alpha);
      // after removing NaNs alpha may be empty.
      if (alpha.length === 0) break;

      // view of columns to solve if needed
      if (indices.length < X_View.columns) {
        [X_View, B_View, P_View] = getColumnViews(indices, B, Y, P);
      }
      X_View.add(P_View.clone().mulRowVector(alpha)); //update x

      // With B updated, we need to narrow down again.
      mseLast = meanSquaredError(X, B_View, X_View);
      this.#updateMSEAndX(mseLast, X_View, indices);

      [indices, alpha, shiftedIndices] = filterIndices(
        indices,
        alpha,
        shiftedIndices,
      );
      // after removing NaNs indices may be empty
      if (indices.length === 0) break;

      if (indices.length < X_View.columns) {
        [X_View, B_View] = getColumnViews(indices, B, Y);
      }

      [GradientView, XErrorView, ResidualView] = getColumnViews(
        shiftedIndices,
        Gradient,
        XErrorView,
        ResidualView,
      );

      // using old error and gradient
      betaDenom = Matrix.multiply(XErrorView, GradientView).sum('column');
      ResidualView.sub(ResidualView.clone().mulRowVector(alpha)); // update residual

      Gradient = Xt.mmul(ResidualView); // new g
      XError = XtA_inv.mmul(Gradient); // new x_error
      beta = Matrix.multiply(XError, Gradient)
        .sum('column')
        .map((x, i) => x / betaDenom[i]);

      P_View = new MatrixColumnSelectionView(P, indices);
      P_View.mulRowVector(beta).add(XError); // update p
    }
  }
}

import { Matrix } from 'ml-matrix';

/** Options for generating data.  */
interface MakeDataOpts {
  /**
   * Whether to include a bias term in the generated data.
   * @default false
   */
  useBias: boolean;

  /**
   * Number of output/coefficient columns to generate.
   * @default 1
   */
  outputColumns: number;

  /**
   * Whether to add noise to the output data `B`.
   * If true, noise is added using 1/100 of the scaling factor of `X`.
   * @default true
   */
  addNoise: boolean;

  /**
   * Scale the input data (`X`) by this number.
   * @default 1 (no scaling)
   */
  scaleB: number;

  /**
   * Scale the coefficients (`A`) by this number.
   * @default 1 (no scaling)
   */
  scaleX: number;
}
/**
 * Make `A`, `B` and `X` matrices to use for testing purposes.
 * @param samples how many samples to use
 * @param coefficients how many `X` or `B` columns to use.
 * @param opts {@link MakeDataOpts}
 * @returns `A`, `B`, and `X`
 */
export function makeData(
  samples: number,
  coefficients: number, // do not include bias here.
  opts: Partial<MakeDataOpts> = {},
) {
  const {
    scaleB = 1,
    scaleX = 1,
    outputColumns = 1,
    useBias = false,
    addNoise = true,
  } = opts;

  // design matrix / input data
  const X = Matrix.random(samples, coefficients, {
    random: myRandom,
  });

  if (scaleX !== 1) {
    // before adding bias
    X.mul(scaleX);
  }

  if (useBias) {
    X.addColumn(Matrix.ones(samples, 1));
  }

  const B = Matrix.random(
    useBias ? coefficients + 1 : coefficients,
    outputColumns,
  );
  if (scaleB !== 1) {
    B.mul(scaleB);
  }

  const Y = X.mmul(B);
  if (addNoise) {
    Y.add(
      Matrix.random(samples, outputColumns, { random: myRandom }).mul(
        scaleB / 100,
      ),
    );
  }
  return { inputs: X, outputs: Y, coefficients: B };
}

/**
 * Random value with random sign.
 * @returns random value with random sign.
 */
function myRandom() {
  const randomSign = Math.random() > 0.5 ? -1 : 1;
  return Math.random() * randomSign;
}

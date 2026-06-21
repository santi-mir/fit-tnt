# TNT

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

<!--
[![DOI](https://zenodo.org/badge/DOI/[DOINUMBER]/zenodo.8189402.svg)](https://doi.org/[DOINUMBER]/zenodo.8189402) -->

> [!NOTE]
> If you read this in NPM's repository MathJax formulas won't render well. Use this [GitHub link instead](https://github.com/santi-mir/fit-tnt)).

Given a linear system of equations: $X \mathbf{\beta} = \mathbf{y}$, this software finds the optimal coefficients $\mathbf{\beta}$ through a variation of ordinary least squares. It supports multiple right-hand-sides.

The method follows the [TNT](https://ieeexplore.ieee.org/abstract/document/8425520) paper by J. M. Myre et al.

## Install and Use

```bash
npm i fit-tnt
```

```ts
import { TNT } from 'fit-tnt';

const X = [
  [1, 2, 3],
  [4, 5, 6],
]; // 2x3
const y = [6, 12]; // or [[6],[12]]

try {
  const { Beta, metadata } = new TNT(X, y);
} catch (e) {
  console.error(e);
}
```

A related method is [Ridge Regression](https://en.wikipedia.org/wiki/Ridge_regression).

## Documentation

- [Docs here](https://santi-mir.github.io/fit-tnt/modules.html)

## Comparison: TNT vs Pseudo-Inverse

- Matrix Shape: rows 500, columns 200
- Speed Up: **5.20**
- Inverting the shape below, TNT is slower.

  | (index)       | Avg Exec Time       | Avg Error           |
  | ------------- | ------------------- | ------------------- |
  | TNT           | 0.09470919929999999 | 0.04945702797110891 |
  | PseudoInverse | 0.49272041820000007 | 0.04945702797110894 |


<details>
<summary>Observations</summary>

- Speed. Best when these apply:

  - $\large\frac{\mathrm{rows}}{\mathrm{cols}} \geq 1$.
  - Data columns $\geq 10$. But it's worth trying in any case.

- Accuracy: it's frequently as accurate as QR or PseudoInverse but it will have larger error (normally still acceptable) with tricky matrices.

[For speed, see comparison here](#comparison-tnt-vs-pseudo-inverse).

_For calculations with non-zero intercept_, remember to push a $1$ to each row. The coefficient will be the last item in **XBest**.

A more thorough webpage to compare speed/accuracy will hopefully be included soon.

</details>

## Misc.

- In some cases it won't get to a low error, but [normalizing improves performance.](https://stats.stackexchange.com/questions/306019/in-linear-regression-why-do-we-often-have-to-normalize-independent-variables-pr)

<details>
<summary>
Theoretical Background
</summary>

A Linear System of Equations is denoted as $X \mathbf{\beta} = \mathbf{y}$.

In practice, exact solutions ($\mathbf{\beta}$) are a rare case rather than a common one.
Cost functions are designed with the goal of approximating the solution vector.

Least-Squares' one such method and involves minimising the sum of squared errors.
Formally, this is written as finding the arguments of $\mathbf{\beta}$ that minimise the squared norm:

$\large\mathrm{arg min}_\mathbf{\beta} \lVert X \mathbf{\mathbf{\beta}} - \mathbf{y} \rVert_2^2$

Taking derivatives and equating it to the zero-vector $\vec{0}$, we arrive to the normal equation $X^T X \mathbf{\beta} = X^T \mathbf{y}$

Just as the original case, this is _also a linear system of equations_. $S \mathbf{\beta} = \mathbf{y}$.

**If** the symmetric matrix $S$ is **positive definite** (hence $X$ has l.i. cols.) then:

1. It is invertible,
2. And can be factored as $\mathrm{Cholesky}(S) = L L^T$,
3. And we can solving the total system as _two triangular systems_, which is fast and simple.

The condition number $S=X^T X$ is $\kappa (X^T X) = \kappa (X)^2$. So it will fail for near-singular $S$.

_Preconditioning tries to reduce this problem_. Larger condition number also tends to slow the convergence of iterative methods.

**TNT**

The Conjugate Gradient for Normal Residual (CGNR) is a popular method for solving Sparse Least-Squares problems, where the design matrix has many zeros.

For wide $X$, where $\frac{n}{m} \gt 1$ calculating and factoring $X^T A$ becomes computationally demanding, given its $n^2$ separate elements. Here pseudo-inverse will be faster. TNT tends to be faster when $m \geq n$.

TNT preconditions $X^T X$ so that it has an inverse and a smaller condition number, then iteratively solves using CGNR.

Positive definite means that $\mathbf{\beta}^T M \mathbf{\beta} \gt 0$. In our case: $\mathbf{\beta}^T (X^T X) \mathbf{\beta} \gt 0$, and $(X \mathbf{\beta})^T (X \mathbf{\beta}) \gt 0$

The $(\ldots)$ are non-zero when the columns are linearly independent. If the columns of $X$ are linearly independent then it's invertible/non-singular, and $X^T X$ is invertible.

So we want to pre-condition $X^T X$ so that it is invertible, we also want to avoid tiny numbers in the diagonal of the decomposition.

</details>

<details>
<summary>
Algorithm Description
</summary>

**Note**: I used different letters here, and needs clean up.

1. Carry out product: $N=A^T\,A$ (`N` is Symmetric.)
2. [Cholesky Decomposition](https://en.wikipedia.org/wiki/Cholesky_decomposition) and factor: R, p = Cho(N)
3. `if !p: N = N + e\*I`, $\epsilon$ being a tiny number.
4. Residual $r_0 = A\,x_0 - b$
5. Gradient per coefficient ($r$), $g_0 = A^T r_0$
6. Error in the coefficients $z_0 = R^{-1}\,g_0$
7. Get $\alpha$ as `a = dot(z,g)/dot (r,r)`
8. Update $x$ as $x_{i+1}=x_{i} + a_i\times p_i$
9. Next residual $r_{i+1} = r_i - a_i \times r_i$
10. New gradient $g_{i+1} = A^T r_{i+1}$
11. New error in coefficients: $z_{i+1} = R^{-1}\,g_{i+1}$
12. Get $\beta$ `beta = dot(z_{i+1},g_{i+1})/dot (z_i,g_i)`

</details>

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/fit-tnt.svg
[npm-url]: https://www.npmjs.com/package/fit-tnt
[ci-image]: https://github.com/santi-mir/fit-tnt/actions/workflows/nodejs.yml/badge.svg
[ci-url]: https://github.com/santi-mir/fit-tnt/actions/workflows/nodejs.yml
[codecov-image]: https://img.shields.io/codecov/c/github/santi-mir/fit-tnt.svg
[codecov-url]: https://codecov.io/gh/santi-mir/fit-tnt
[download-image]: https://img.shields.io/npm/dm/fit-tnt.svg
[download-url]: https://www.npmjs.com/package/fit-tnt

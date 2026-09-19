# Codechef Starters 256 Div3

## REDBLUE

We want to maximize $S_{R} * C_{B} + S_{B} * C_{R}$

Re-writing in terms of only R -
$$
S_{R} * (n - C{R}) + (S - S_{R}) * C_{R}
n * S_{R} + S * C_{R} - 2 * S_{R} * C{R}
$$

Got stuck in contest here because if we maximize C_{R}, and as consequence S_{R} also increases as the array has positive values, we will increase the first two terms but the third term will decrease drastically.

Considered DP here but there is no clear "if we have a maximized value till index $(i - 1)$ then how we can construct the max value at $i-th$ index with it".

Here we had to think about fixing $C_{R}$ as a constant. Then the equation simplifies to $(n - 2 * C_{R}) * S_{R} + S * C_{R}$. Here everything is a constant except for $S_{R}$. So we can think of it as a line $a * S_{R} + b$. Line gets maximized when we maximize/minimize $S_{R}$ according to the slope $a$. So we need to sort the array and take a prefix or suffix. As the equation is symmetric in terms of blue and red, we can just sort and consider the prefix as red.

## FARSWAPLEX

Simple idea that I got from the very begining. Overcomplicated the implementation which lead to a faster solution but late submission costing rank.

## FARSWAP

The idea extends from the previous problem. When we are on index $i$, the only thing we care about is whether the number goes after $(i-1)th$ number or before which can be derived from the order in the input permutation.

So there is a DP solution to this with the states being -
1. The number from the permutation $1-N$ we are at
2. The position that where the number goes

$dp[i][j]$ = Number of ways in which $i-th$ number from the permutation goes in index $j$

Then the transitions becomes -
1. If $(i - 1)$ appears before $i$ in the input permutation, then $dp[i][j] = dp[i - 1][0] + dp[i - 1][1] + ... dp[i - 1][j - 1]$
2. If $(i - 1)$ appears after $i$ in the input permutation, then $dp[i][j] = dp[i - 1][j]$ (when i-th number is added to the permutation, the (i-1)th number shifts from j-th position) $+ dp[i - 1][j + 1] + ... dp[i - 1][i - 1]$

Got the wrong idea altogether in the live contest.

---

## Contest Analysis

| Problem | Analysis |
| --- | --- |
| BUSSEAT | Solved |
| FIXEDPTS | Solved |
| REDBLUE | Solved but no proof |
| FARSWAPLEX | Solved |
| FARSWAP | Wrong idea |

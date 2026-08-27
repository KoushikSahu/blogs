# Codechef Starters 252 Div2

## ODDEVEN7

Probably the greatest takeaway from this problem (and the contest even perhaps) is that I do not know the distinctions between subset, subsequence, subarray etc.

- Subarray: contiguous sequence in an array. Eg: {1, 2, 3} is subarray of {0, 1, 2, 3, 4, 5}
- Subset: collection of some elements from an array but not necessarily in the same order. Eg: {3, 1} is a subset of {0, 1, 2, 3, 4, 5}
- Subsequence: collection of some elements from an array but in the same order as they appear in the subarray. Eg: {1, 4, 5} is a subsequence of {0, 1, 2, 3, 4, 5}

Given an array of size $n$ -

Number of subarray:

Pick any index $i$ as the endpoint.  
The number of startpoints for that endpoint is $i$.  
So the total number of subarrays = $\sum_{i=1}^{n} i$ = $\frac{n(n+1)}{2}$

Number of subset:

For each index i there is two possibilities - pick it or don't pick it.  
So total number of subsets = $2^n$

Number of subsequences:

Number of subsequences = Number of subsets (just have it in sorted order) - 1 (for getting non-empty subsequences)

## SKIPONE

No takeaways. Very simple problem.

## MEXMAX7

Given condition is $|mex(B) - max(B)| \le 1$

$mex(B) > max(B)$ for contiguous subsequence starting with 0 where $mex(B) - max(B) = 1$. So we need all subsequence with contiguous elements starting with 0.  
For rest all case $mex(B) < max(B)$ but never equal. $max(B) - mex(B) = 1$ means a subsequence where all the elements are contiguous but minus the second to last element.

In this problem subsequence = subset because both MEX and MAX are order independent values.

We maintain the frequencies of the elements and operate on that. Each element can be picked up in $2^n - 1$ where n is the frequency. Minus one is for non-empty subsets.

Then the problem is just about implementing correctly - caching powers of 2 modulo given number, multiplying correctly and always taking modulos


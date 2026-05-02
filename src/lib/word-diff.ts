/**
 * Minimal word-level diff for the De-AI-ifier's optional diff view.
 * Returns an array of segments with type: "same" | "added" | "removed".
 */

interface DiffSegment {
  type: "same" | "added" | "removed";
  text: string;
}

export function computeWordDiff(original: string, rewritten: string): DiffSegment[] {
  const a = tokenize(original);
  const b = tokenize(rewritten);

  const lcs = longestCommonSubsequence(a, b);
  const result: DiffSegment[] = [];

  let ai = 0;
  let bi = 0;
  let li = 0;

  while (ai < a.length || bi < b.length) {
    if (li < lcs.length && ai < a.length && a[ai] === lcs[li]) {
      // Emit any added words before this common word
      const added: string[] = [];
      while (bi < b.length && b[bi] !== lcs[li]) {
        added.push(b[bi++]);
      }
      if (added.length > 0) push(result, "added", added.join(""));

      push(result, "same", a[ai]);
      ai++;
      bi++;
      li++;
    } else if (ai < a.length && (li >= lcs.length || a[ai] !== lcs[li])) {
      push(result, "removed", a[ai]);
      ai++;
    } else if (bi < b.length) {
      push(result, "added", b[bi]);
      bi++;
    }
  }

  return result;
}

function push(result: DiffSegment[], type: DiffSegment["type"], text: string) {
  const last = result[result.length - 1];
  if (last && last.type === type) {
    last.text += text;
  } else {
    result.push({ type, text });
  }
}

function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) || [];
}

function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // Space-optimized LCS — only keep two rows
  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);

  // First pass: compute lengths
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find actual LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

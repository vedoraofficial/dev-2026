import { NameMatchCategory } from './bank-verification.interface';

const HONORIFICS = new Set([
  'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'shri', 'smt', 'kumar', 'kumari', 'master',
]);

/**
 * Normalizes a name string:
 * - Lowercases
 * - Removes special characters and excessive whitespace
 * - Strips common Indian/English honorifics
 */
export function normalizeName(name: string): string[] {
  if (!name) return [];
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !HONORIFICS.has(token));
}

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Compares two names and calculates similarity score (0 to 100) and categorization.
 * Robust against token ordering (e.g., "Sharma Rahul" vs "Rahul Sharma").
 */
export function calculateNameMatch(
  inputName: string,
  bankRegisteredName: string,
): { score: number; result: NameMatchCategory } {
  const tokens1 = normalizeName(inputName);
  const tokens2 = normalizeName(bankRegisteredName);

  if (tokens1.length === 0 || tokens2.length === 0) {
    return { score: 0, result: 'NO_MATCH' };
  }

  const str1 = tokens1.join(' ');
  const str2 = tokens2.join(' ');

  // 1. Exact match after normalization
  if (str1 === str2) {
    return { score: 100, result: 'DIRECT' };
  }

  // 2. Token Set / Order-independent match
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  // Exact set match (e.g. "Rahul Sharma" vs "Sharma Rahul")
  if (set1.size === set2.size && [...set1].every((t) => set2.has(t))) {
    return { score: 98, result: 'GOOD' };
  }

  // Count token overlaps
  let matchedTokens = 0;
  for (const t1 of tokens1) {
    if (set2.has(t1)) {
      matchedTokens++;
    } else {
      // Check for partial/initial match (e.g. "R" vs "Rahul" or minor typo)
      const hasFuzzy = tokens2.some((t2) => {
        if (t1.length === 1 || t2.length === 1) {
          return t1[0] === t2[0];
        }
        const dist = levenshteinDistance(t1, t2);
        return dist <= 1 && Math.abs(t1.length - t2.length) <= 1;
      });
      if (hasFuzzy) matchedTokens += 0.8;
    }
  }

  const maxTokens = Math.max(tokens1.length, tokens2.length);
  const tokenScore = Math.min(100, Math.round((matchedTokens / maxTokens) * 100));

  // Also calculate Levenshtein distance on joined string
  const maxLen = Math.max(str1.length, str2.length);
  const editDist = levenshteinDistance(str1, str2);
  const stringScore = Math.max(0, Math.round(((maxLen - editDist) / maxLen) * 100));

  // Combined weighted score
  const finalScore = Math.max(tokenScore, Math.round(0.7 * tokenScore + 0.3 * stringScore));

  let result: NameMatchCategory = 'NO_MATCH';
  if (finalScore >= 95) result = 'DIRECT';
  else if (finalScore >= 80) result = 'GOOD';
  else if (finalScore >= 60) result = 'MODERATE';
  else if (finalScore >= 30) result = 'POOR';
  else result = 'NO_MATCH';

  return { score: finalScore, result };
}

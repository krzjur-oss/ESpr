export type SearchScope = 'all' | 'content' | 'title';
export type SearchMatchMode = 'all' | 'any';
export type SearchSourceFilter = 'all' | 'builtin' | 'custom';

export interface ParsedSearchQuery {
  phrases: string[];
  words: string[];
  allTerms: string[];
}

export interface AdvancedSearchOptions {
  query: string;
  scope: SearchScope;
  matchMode: SearchMatchMode;
  ignoreDiacritics: boolean;
}

export interface HighlightSegment {
  text: string;
  matched: boolean;
}

const POLISH_DIACRITIC_MAP: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
};

function mapChar(ch: string, ignoreDiacritics: boolean): string {
  const lower = ch.toLowerCase();
  if (!ignoreDiacritics) return lower;
  return POLISH_DIACRITIC_MAP[lower] ?? lower;
}

/**
 * Normalizes text while building a character index map back to the original string
 * so highlights always preserve original casing and Polish diacritics.
 */
function normalizeWithIndexMap(
  input: string,
  ignoreDiacritics: boolean
): { normalized: string; indexMap: number[] } {
  let normalized = '';
  const indexMap: number[] = [];

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === undefined) continue;
    const mapped = mapChar(ch, ignoreDiacritics);
    for (let j = 0; j < mapped.length; j++) {
      const mappedChar = mapped[j];
      if (mappedChar === undefined) continue;
      normalized += mappedChar;
      indexMap.push(i);
    }
  }

  return { normalized, indexMap };
}

export function normalizeSearchText(input: string, ignoreDiacritics = true): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch !== undefined) {
      out += mapChar(ch, ignoreDiacritics);
    }
  }
  return out;
}

export function parseSearchQuery(rawQuery: string, ignoreDiacritics: boolean): ParsedSearchQuery {
  const phrases: string[] = [];
  const remaining = rawQuery.replace(/"([^"]+)"/g, (_, phrase: string) => {
    const cleaned = normalizeSearchText(phrase.trim(), ignoreDiacritics).replace(/\s+/g, ' ');
    if (cleaned) {
      phrases.push(cleaned);
    }
    return ' ';
  });

  const words = remaining
    .split(/\s+/)
    .map((w) => normalizeSearchText(w.trim(), ignoreDiacritics))
    .filter((w) => w.length > 0);

  const uniqueTerms = Array.from(new Set([...phrases, ...words]));

  return {
    phrases,
    words,
    allTerms: uniqueTerms,
  };
}

export function scoreWniosekItemMatch(
  categoryLabel: string,
  categoryGroup: string,
  itemText: string,
  parsed: ParsedSearchQuery,
  options: AdvancedSearchOptions
): number {
  if (parsed.allTerms.length === 0) return 1;

  const normLabel = normalizeSearchText(categoryLabel, options.ignoreDiacritics);
  const normGroup = normalizeSearchText(categoryGroup, options.ignoreDiacritics);
  const normContent = normalizeSearchText(itemText, options.ignoreDiacritics);
  const normTitle = `${normLabel} ${normGroup}`;

  let targetText = '';
  if (options.scope === 'content') {
    targetText = normContent;
  } else if (options.scope === 'title') {
    targetText = normTitle;
  } else {
    targetText = `${normTitle} ${normContent}`;
  }

  let matchedCount = 0;
  let score = 0;

  for (const term of parsed.allTerms) {
    const inTarget = targetText.includes(term);
    if (!inTarget) {
      if (options.matchMode === 'all') {
        return 0;
      }
      continue;
    }

    matchedCount++;

    // Weight content matches higher than category title matches for faster formulation discovery
    if (options.scope !== 'title' && normContent.includes(term)) {
      score += parsed.phrases.includes(term) ? 60 : 25;
      // Extra boost if term appears as a whole word in content
      const idx = normContent.indexOf(term);
      const prevChar = idx > 0 ? normContent[idx - 1] : undefined;
      const beforeOk = prevChar === undefined || !/[a-z0-9]/.test(prevChar);
      if (beforeOk) score += 8;
    }
    if (options.scope !== 'content' && normTitle.includes(term)) {
      score += 12;
    }
  }

  if (matchedCount === 0) return 0;

  // Boost items matching more terms in 'any' mode
  return score + matchedCount * 15;
}

export function scoreTextMatch(
  fields: string[],
  parsed: ParsedSearchQuery,
  matchMode: SearchMatchMode,
  ignoreDiacritics: boolean
): number {
  if (parsed.allTerms.length === 0) return 1;
  const combined = normalizeSearchText(fields.join(' '), ignoreDiacritics);

  let matchedCount = 0;
  let score = 0;
  for (const term of parsed.allTerms) {
    if (combined.includes(term)) {
      matchedCount++;
      score += parsed.phrases.includes(term) ? 50 : 20;
    } else if (matchMode === 'all') {
      return 0;
    }
  }
  return matchedCount > 0 ? score + matchedCount * 10 : 0;
}

export function getHighlightSegments(
  text: string,
  terms: string[],
  ignoreDiacritics: boolean
): HighlightSegment[] {
  if (!text || terms.length === 0) {
    return [{ text, matched: false }];
  }

  const { normalized, indexMap } = normalizeWithIndexMap(text, ignoreDiacritics);
  const ranges: Array<[number, number]> = [];

  for (const rawTerm of terms) {
    const term = normalizeSearchText(rawTerm, ignoreDiacritics).trim();
    if (!term) continue;

    let startIndex = 0;
    while (startIndex < normalized.length) {
      const found = normalized.indexOf(term, startIndex);
      if (found === -1) break;
      const origStart = indexMap[found];
      const origEndBase = indexMap[found + term.length - 1];
      if (origStart !== undefined && origEndBase !== undefined) {
        ranges.push([origStart, origEndBase + 1]);
      }
      startIndex = found + term.length;
    }
  }

  if (ranges.length === 0) {
    return [{ text, matched: false }];
  }

  // Sort and merge overlapping highlight ranges
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: Array<[number, number]> = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [s, e] of merged) {
    if (s > cursor) {
      segments.push({ text: text.slice(cursor, s), matched: false });
    }
    segments.push({ text: text.slice(s, e), matched: true });
    cursor = e;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false });
  }

  return segments;
}

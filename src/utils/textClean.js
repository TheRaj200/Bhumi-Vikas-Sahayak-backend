// Running page headers such as "Rule 56   M.P. Bhumi Vikas Rules, 2012   78" or "Rule 62-65 ... 85".
const PAGE_HEADER_RE = /^\s*Rules?\s+\S+\s+M\.P\.\s*Bhumi\s+Vikas\s+Rules,\s*2012\s+\d+\s*$/i;
const PAGE_MARKER_RE = /^=====\s*PDF page\s+(\d+)\s*=====\s*$/;

export function isPageHeader(line) {
  return PAGE_HEADER_RE.test(line);
}

export function stripPageHeaders(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !isPageHeader(line))
    .join('\n');
}

/** Collapse all whitespace to single spaces. Used for quote matching on both sides. */
export function normalizeWhitespace(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeForMatch(text) {
  return normalizeWhitespace(stripPageHeaders(String(text ?? '')));
}

/** Split bhumi_vikas_rules_fulltext_by_page.txt into [{ page, text }]. */
export function splitPages(fulltext) {
  const pages = [];
  let current = null;
  for (const line of fulltext.split(/\r?\n/)) {
    const marker = line.match(PAGE_MARKER_RE);
    if (marker) {
      current = { page: Number(marker[1]), lines: [] };
      pages.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return pages.map((p) => ({ page: p.page, text: p.lines.join('\n') }));
}

export function containsDevanagari(text) {
  return /[\u0900-\u097F]/.test(String(text ?? ''));
}

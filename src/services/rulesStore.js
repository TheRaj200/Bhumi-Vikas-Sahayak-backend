import fs from 'node:fs';
import { config } from '../config.js';
import { normalizeForMatch, normalizeWhitespace, splitPages, stripPageHeaders } from '../utils/textClean.js';

// Inserted rules printed with their own number but stored inside the previous rule's text.
export const RULE_ALIASES = {
  '12-a': '12',
  '17-a': '17',
  '25(a)': '25',
  '25-a': '25',
  '26-a': '26',
  '42-a': '42',
  '42a': '42',
  '93(a)': '93',
  '93-a': '93',
};

const state = {
  loaded: false,
  source: 'jsonl',
  rules: [],
  byRule: new Map(),
  pages: [],
};

function buildRecord(raw) {
  const text_clean = stripPageHeaders(raw.text);
  return {
    rule: String(raw.rule),
    title: raw.title,
    part: raw.part,
    page_start: raw.page_start,
    page_end: raw.page_end,
    text: raw.text,
    text_clean,
    text_norm: normalizeWhitespace(text_clean),
  };
}

export function readRulesJsonl(filePath = config.paths.rulesJsonl) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (_err) {
    return [];
  }
}

export function readPages(filePath = config.paths.fulltextByPage) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return splitPages(fs.readFileSync(filePath, 'utf8')).map((p) => ({ ...p, norm: normalizeWhitespace(p.text) }));
  } catch (_err) {
    return [];
  }
}

/**
 * Load rules into memory. Prefers MongoDB `rules` collection when given docs; otherwise the JSONL file.
 * @param {{ mongoDocs?: object[] }} [opts]
 */
export function loadRules(opts = {}) {
  const useMongo = Array.isArray(opts.mongoDocs) && opts.mongoDocs.length > 0;
  const raw = useMongo ? opts.mongoDocs : readRulesJsonl();
  state.rules = raw.map(buildRecord);
  state.byRule = new Map(state.rules.map((r) => [r.rule.toLowerCase(), r]));
  state.pages = readPages();
  state.source = useMongo ? 'mongo' : 'jsonl';
  state.loaded = true;
  return { count: state.rules.length, source: state.source };
}

function ensureLoaded() {
  if (!state.loaded) loadRules();
}

export function rulesInfo() {
  ensureLoaded();
  return { count: state.rules.length, source: state.source };
}

export function listRules() {
  ensureLoaded();
  return state.rules;
}

/** Resolve a printed rule number (e.g. "56", "26-B", "17-a") to the parent record key. */
export function resolveRuleNumber(ruleNumber) {
  const key = String(ruleNumber).trim().toLowerCase();
  return RULE_ALIASES[key] ?? key;
}

export function getRule(ruleNumber) {
  ensureLoaded();
  return state.byRule.get(resolveRuleNumber(ruleNumber)) ?? null;
}

export function getPages() {
  ensureLoaded();
  return state.pages;
}

/** True when `quote` (whitespace-normalised) appears in the rule's text with page headers stripped. */
export function quoteInRule(ruleNumber, quote) {
  const rule = getRule(ruleNumber);
  if (!rule) return false;
  const q = normalizeForMatch(quote);
  return q.length > 0 && rule.text_norm.includes(q);
}

/**
 * PDF page on which `quote` appears, searching the rule's page range first.
 * Returns null if the quote is not found on a single page (e.g. it crosses a page break).
 */
export function findQuotePage(quote, ruleNumber) {
  ensureLoaded();
  const q = normalizeForMatch(quote);
  if (!q) return null;
  const rule = ruleNumber ? getRule(ruleNumber) : null;
  const inRange = rule
    ? state.pages.filter((p) => p.page >= rule.page_start && p.page <= rule.page_end)
    : state.pages;
  const hit = inRange.find((p) => p.norm.includes(q));
  return hit ? hit.page : null;
}

export function pdfUrl(page, lang = 'en') {
  return page ? `/pdf/${lang}.pdf#page=${page}` : `/pdf/${lang}.pdf`;
}

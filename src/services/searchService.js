import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rulesRepository } from '../repositories/rulesRepository.js';
import { pdfUrl } from './rulesStore.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const glossaryPath = path.resolve(dir, '../data/glossary.json');
let glossary = {};
try {
  glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8')).terms || {};
} catch (_e) {
  glossary = {};
}

function expandQuery(query) {
  let expanded = query.toLowerCase();
  for (const [hiTerm, enTerm] of Object.entries(glossary)) {
    if (expanded.includes(hiTerm.toLowerCase())) {
      expanded += ' ' + enTerm;
    }
  }
  return expanded;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function extractSnippets(text, tokens, maxSnippets = 3) {
  const sentences = text.split(/(?<=[.?!;:\n])\s+/);
  const matched = [];
  for (const s of sentences) {
    const sLower = s.toLowerCase();
    const hits = tokens.filter((t) => sLower.includes(t));
    if (hits.length > 0) {
      matched.push({ sentence: s.trim(), hitCount: hits.length });
    }
  }
  matched.sort((a, b) => b.hitCount - a.hitCount);
  return matched.slice(0, maxSnippets).map((m) => m.sentence.slice(0, 200));
}

export const searchService = {
  searchRules({ q, limit = 5, part = null }) {
    const allRules = rulesRepository.getAllRules();
    const expandedQuery = expandQuery(q);
    const queryTokens = tokenize(expandedQuery);

    if (queryTokens.length === 0) {
      return { query: q, total_matches: 0, hits: [] };
    }

    // Check if query explicitly mentions a rule number, e.g., "56", "rule 17", "21"
    const ruleNumMatch = q.match(/\b(?:rule\s*)?(\d{1,3}(?:-[a-z])?)\b/i);
    const targetRuleNum = ruleNumMatch ? rulesRepository.resolveAlias(ruleNumMatch[1]) : null;

    const scoredHits = [];

    for (const r of allRules) {
      if (part && r.part !== part) continue;

      let score = 0;
      const titleLower = r.title.toLowerCase();
      const textLower = r.text_clean.toLowerCase();

      // Exact rule number match boost
      if (targetRuleNum && r.rule.toLowerCase() === targetRuleNum) {
        score += 50;
      }

      for (const tok of queryTokens) {
        if (titleLower.includes(tok)) score += 5;
        if (textLower.includes(tok)) {
          // count frequency up to 10
          const count = (textLower.match(new RegExp(`\\b${tok}`, 'g')) || []).length;
          score += Math.min(count, 10) * 1.5;
        }
      }

      if (score > 0) {
        const snippets = extractSnippets(r.text_clean, queryTokens);
        scoredHits.push({
          rule: r.rule,
          title: r.title,
          part: r.part,
          page_start: r.page_start,
          page_end: r.page_end,
          score: Number(score.toFixed(2)),
          snippets: snippets.length > 0 ? snippets : [r.text_clean.slice(0, 150) + '...'],
          pdf_url: pdfUrl(r.page_start),
        });
      }
    }

    scoredHits.sort((a, b) => b.score - a.score);
    const hits = scoredHits.slice(0, limit);

    return {
      query: q,
      total_matches: scoredHits.length,
      hits,
    };
  },
};

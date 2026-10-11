import { config, isLlmConfigured } from '../config.js';
import { STRINGS } from '../constants/strings.js';
import { encodedRulesRepository } from '../repositories/encodedRulesRepository.js';
import { rulesRepository } from '../repositories/rulesRepository.js';
import { completeJson } from './llm.js';
import { findQuotePage, pdfUrl } from './rulesStore.js';
import { searchService } from './searchService.js';
import { allAmendmentWarnings } from './versionInfo.js';

const OUTSIDE_PATTERNS = [
  /property\s*tax/i,
  /संपत्ति\s*कर/i,
  /market\s*rate/i,
  /circle\s*rate/i,
  /बाजार\s*दर/i,
  /कलेक्टर\s*गाइडलाइन/i,
  /नामांतरण/i,
  /mutation/i,
  /water\s*bill/i,
  /बिजली\s*बिल/i,
  /electricity\s*bill/i,
];

function isOutsideRules(q) {
  return OUTSIDE_PATTERNS.some((pat) => pat.test(q));
}

function detectLang(q, requestedLang) {
  if (requestedLang === 'en' || requestedLang === 'hi') return requestedLang;
  return /[\u0900-\u097F]/.test(q) ? 'hi' : 'en';
}

function checkAmendment(q) {
  const qLower = q.toLowerCase();
  const warnings = allAmendmentWarnings();
  if (
    qLower.includes('500') ||
    qLower.includes('2(5)') ||
    qLower.includes('august 2026') ||
    qLower.includes('aug 2026') ||
    qLower.includes('अलग विकास') ||
    qLower.includes('separate development')
  ) {
    return warnings.find((w) => w.rule === '2(5)(c)') || null;
  }
  return null;
}

export const answerService = {
  async answerQuestion({ question, lang: requestedLang, context: _context }) {
    const start = Date.now();
    const lang = detectLang(question, requestedLang);
    const disclaimer = lang === 'hi' ? STRINGS.disclaimer.hi : STRINGS.disclaimer.en;
    const amendmentWarning = checkAmendment(question);

    // 1. Outside rules check
    if (isOutsideRules(question)) {
      return {
        question,
        lang,
        status: 'not_found',
        answer: lang === 'hi' ? STRINGS.not_found.hi : STRINGS.not_found.en,
        source_version: config.sourceVersion,
        evidence: [],
        related_encoded_rules: [],
        amendment_warning: null,
        disclaimer,
        latency_ms: Date.now() - start,
      };
    }

    // 2. Search relevant rules
    const searchRes = searchService.searchRules({ q: question, limit: 3 });

    if (searchRes.hits.length === 0 || searchRes.hits[0].score < 3) {
      return {
        question,
        lang,
        status: 'not_found',
        answer: lang === 'hi' ? STRINGS.not_found.hi : STRINGS.not_found.en,
        source_version: config.sourceVersion,
        evidence: [],
        related_encoded_rules: [],
        amendment_warning: null,
        disclaimer,
        latency_ms: Date.now() - start,
      };
    }

    // Prepare rule context excerpts
    const topHits = searchRes.hits.slice(0, 3);
    const excerpts = topHits.map((h) => {
      const fullRule = rulesRepository.findRuleByNumber(h.rule);
      return `[Rule ${h.rule} - ${h.title}]\n${(fullRule?.text_clean || '').slice(0, 3500)}`;
    }).join('\n\n---\n\n');

    let status = 'answered';
    let answerText = '';
    let evidenceList = [];

    // 3. LLM Generation if configured
    if (isLlmConfigured()) {
      try {
        const systemPrompt = `You are Bhumi Vikas Sahayak, an official regulatory assistant for the Madhya Pradesh Bhumi Vikas Rules, 2012 (consolidated to 6 March 2025).
Answer the user's question clearly, accurately, and concisely in ${lang === 'hi' ? 'Hindi' : 'English'}.
Strict Requirements:
1. Base your answer solely on the provided Rule Excerpts. Never invent fees, numbers, setbacks, or rules.
2. Clearly state the exact Rule number(s) in your answer.
3. If the provided excerpts do not contain the answer, return status "not_found".
4. If the question involves an ambiguous exception or requires officer discretion, return status "manual_review".
5. Return ONLY a valid JSON object matching this schema:
{
  "status": "answered" | "not_found" | "manual_review",
  "answer": "string",
  "quotes": [
    { "rule": "string", "clause": "string", "quote": "exact verbatim quote from excerpts" }
  ]
}`;

        const userPrompt = `Question: "${question}"\n\nRule Excerpts:\n${excerpts}`;
        const llmResult = await completeJson({ system: systemPrompt, user: userPrompt, maxTokens: 800 });

        if (llmResult?.status === 'not_found') {
          status = 'not_found';
          answerText = lang === 'hi' ? STRINGS.not_found.hi : STRINGS.not_found.en;
        } else {
          status = llmResult?.status || 'answered';
          answerText = llmResult?.answer || '';

          if (Array.isArray(llmResult?.quotes)) {
            for (const qItem of llmResult.quotes) {
              const rNum = String(qItem.rule || topHits[0].rule);
              const resolved = rulesRepository.resolveAlias(rNum);
              const quoteVerified = rulesRepository.checkQuoteInRule(resolved, qItem.quote);
              const page = findQuotePage(qItem.quote, resolved) || topHits[0].page_start;
              evidenceList.push({
                rule: rNum,
                clause: qItem.clause || rNum,
                page,
                quote: qItem.quote,
                quote_verified: quoteVerified,
                pdf_url: pdfUrl(page),
              });
            }
          }
        }
      } catch (_err) {
        // Fallback to evidence_only
        status = 'evidence_only';
        answerText = lang === 'hi' ? STRINGS.evidence_only.hi : STRINGS.evidence_only.en;
      }
    } else {
      // LLM not configured -> evidence_only
      status = 'evidence_only';
      answerText = lang === 'hi' ? STRINGS.evidence_only.hi : STRINGS.evidence_only.en;
    }

    // If evidence list is empty (fallback or evidence_only), populate from top search hit
    if (evidenceList.length === 0 && topHits.length > 0) {
      const top = topHits[0];
      const page = top.page_start;
      const snippet = top.snippets[0] || top.title;
      evidenceList.push({
        rule: top.rule,
        clause: top.rule,
        page,
        quote: snippet,
        quote_verified: rulesRepository.checkQuoteInRule(top.rule, snippet),
        pdf_url: pdfUrl(page),
      });
    }

    // 4. Resolve related encoded rule IDs
    const relatedEncodedRules = new Set();
    for (const ev of evidenceList) {
      const ids = encodedRulesRepository.getEncodedIdsForRule(ev.rule);
      ids.forEach((id) => relatedEncodedRules.add(id));
    }

    return {
      question,
      lang,
      status,
      answer: answerText,
      source_version: config.sourceVersion,
      evidence: evidenceList,
      related_encoded_rules: Array.from(relatedEncodedRules),
      amendment_warning: amendmentWarning,
      disclaimer,
      latency_ms: Date.now() - start,
    };
  },
};

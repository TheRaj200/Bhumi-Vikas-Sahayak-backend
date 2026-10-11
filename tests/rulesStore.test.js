import { describe, expect, it } from 'vitest';
import { findQuotePage, getRule, listRules, quoteInRule, resolveRuleNumber } from '../src/services/rulesStore.js';
import { isPageHeader, normalizeForMatch, splitPages } from '../src/utils/textClean.js';

describe('textClean', () => {
  it('detects running page headers', () => {
    expect(isPageHeader('Rule 56                           M.P. Bhumi Vikas Rules, 2012                       78')).toBe(true);
    expect(isPageHeader('Rule 62-65                       M.P. Bhumi Vikas Rules, 2012                      85')).toBe(true);
    expect(isPageHeader('56. Residential Buildings.-Open Spaces')).toBe(false);
  });

  it('normalises whitespace and strips headers', () => {
    const text = 'a   b\nRule 56   M.P. Bhumi Vikas Rules, 2012   78\n  c';
    expect(normalizeForMatch(text)).toBe('a b c');
  });

  it('splits pages', () => {
    const pages = splitPages('===== PDF page 1 =====\nx\n===== PDF page 2 =====\ny');
    expect(pages).toEqual([{ page: 1, text: 'x' }, { page: 2, text: 'y' }]);
  });
});

describe('rulesStore', () => {
  it('loads all 106 rule records', () => {
    expect(listRules()).toHaveLength(106);
  });

  it('keeps rule numbers as strings and finds 26-B', () => {
    const rule = getRule('26-B');
    expect(rule).not.toBeNull();
    expect(rule.rule).toBe('26-B');
  });

  it('resolves inserted rules to their parent', () => {
    expect(resolveRuleNumber('17-a')).toBe('17');
    expect(getRule('17-a').rule).toBe('17');
  });

  it('verifies quotes against the rule text, ignoring layout spaces', () => {
    expect(quoteInRule('56', 'Up to 9.0 meters 3.0 meters')).toBe(true);
    expect(quoteInRule('56', 'Up to 9.0 meters 4.0 meters')).toBe(false);
  });

  it('finds the PDF page of a quote', () => {
    expect(findQuotePage('4. Above 225.00 3.00', '56')).toBe(78);
  });
});

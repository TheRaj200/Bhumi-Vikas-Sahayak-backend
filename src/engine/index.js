import { INPUT_FIELDS } from '../constants/fields.js';
import { findQuotePage, pdfUrl, quoteInRule } from '../services/rulesStore.js';
import { evalCondition } from './conditions.js';
import { computeDerived } from './derived.js';
import { computeRequired } from './logic.js';
import { buildNextActions } from './nextActions.js';
import { getPath, isMissing } from './paths.js';
import { validateInputs } from './validateInputs.js';

export const ENGINE_READY = true;

function formatTemplate(tmpl, values, context = {}) {
  if (!tmpl) return '';
  return tmpl.replace(/\{([\w.]+)\}/g, (match, key) => {
    if (key === 'required') return context.required_value ?? match;
    if (key === 'calculated') return context.calculated_value ?? match;
    const val = getPath(values, key);
    return !isMissing(val) ? val : match;
  });
}

/**
 * Evaluate one check of one encoded rule.
 */
export function evaluateCheck(rule, check, inputs, opts = {}) {
  const derived = computeDerived(inputs || {});
  const allValues = { ...(inputs || {}), ...derived };
  const ruleDef = rule.definition || rule;
  const parentRule = String(ruleDef.parent_rule || ruleDef.rule_ref || ruleDef.rule || '');

  // 1. applies_when
  if (check.applies_when) {
    const appRes = evalCondition(check.applies_when, allValues);
    if (appRes.result === false) {
      return null; // not applicable
    }
    if (appRes.result === 'unknown') {
      return buildFinding({
        status: 'needs_information',
        missingInputs: appRes.missingFields,
        rule,
        check,
        allValues,
        parentRule,
      });
    }
  }

  // 2. required_inputs
  const missingInputs = [];
  if (Array.isArray(check.required_inputs)) {
    for (const reqField of check.required_inputs) {
      const v = getPath(allValues, reqField);
      if (isMissing(v)) {
        missingInputs.push(reqField);
      }
    }
  }

  if (missingInputs.length > 0) {
    return buildFinding({
      status: 'needs_information',
      missingInputs,
      rule,
      check,
      allValues,
      parentRule,
    });
  }

  // 3. Verification gate
  const isRuleEnabled = ruleDef.verification?.status === 'verified';
  if (!opts.testMode && !isRuleEnabled) {
    return buildFinding({
      status: 'manual_review',
      manualReasons: ['rule_not_verified'],
      requiredValue: null,
      rule,
      check,
      allValues,
      parentRule,
    });
  }

  // 4. Compute required / calculated logic
  const logicRes = computeRequired(check, ruleDef, allValues);
  if (logicRes.status === 'needs_information') {
    return buildFinding({
      status: 'needs_information',
      missingInputs: logicRes.missingFields || [],
      rule,
      check,
      allValues,
      parentRule,
    });
  }

  if (logicRes.status === 'manual_review') {
    return buildFinding({
      status: 'manual_review',
      manualReasons: [logicRes.reason || 'manual_review_required'],
      requiredValue: null,
      rule,
      check,
      allValues,
      parentRule,
    });
  }

  let requiredValue = logicRes.required ?? null;
  let calculatedValue = logicRes.calculated ?? null;
  let status = 'pass';
  const manualReasons = [];
  const notesEn = [...(check.notes_en || [])];
  const notesHi = [...(check.notes_hi || [])];
  const extraEvidence = [];

  if (logicRes.matchedRow?.quote) {
    extraEvidence.push({
      clause: check.source?.clause || parentRule,
      page: logicRes.matchedRow.page || check.source?.page,
      quote: logicRes.matchedRow.quote,
    });
  }

  // 5. Evaluate exceptions
  if (Array.isArray(check.exceptions)) {
    for (const exc of check.exceptions) {
      let applies = true;
      if (exc.when) {
        const excCond = evalCondition(exc.when, allValues, { required: requiredValue });
        applies = excCond.result === true;
      }
      if (applies) {
        if (exc.effect === 'not_applicable') {
          return null;
        }
        if (exc.effect === 'manual_review') {
          status = 'manual_review';
          manualReasons.push(exc.reason || 'exception_may_apply');
          if (exc.text_en) notesEn.push(exc.text_en);
          if (exc.text_hi) notesHi.push(exc.text_hi);
        } else if (exc.effect === 'note') {
          if (exc.text_en) notesEn.push(exc.text_en);
          if (exc.text_hi) notesHi.push(exc.text_hi);
        }
        if (exc.quote) {
          extraEvidence.push({
            clause: exc.id || check.source?.clause || parentRule,
            page: exc.page || check.source?.page,
            quote: exc.quote,
          });
        }
      }
    }
  }

  // 6. Compare & status resolution (if not manual_review)
  let enteredVal = null;
  let difference = null;

  if (check.kind === 'calculation') {
    if (status !== 'manual_review') status = 'calculated';
  } else if (check.kind === 'reference') {
    if (status !== 'manual_review') status = 'reference';
  } else if (check.kind === 'check' && status !== 'manual_review') {
    if (check.logic?.type === 'boolean_required') {
      enteredVal = logicRes.entered;
      status = enteredVal === logicRes.required ? 'pass' : 'potential_issue';
    } else if (check.logic?.type === 'allowed_values') {
      enteredVal = logicRes.entered;
      status = Array.isArray(logicRes.required) && logicRes.required.includes(enteredVal) ? 'pass' : 'potential_issue';
    } else if (check.compare) {
      enteredVal = getPath(allValues, check.compare.entered);
      if (isMissing(enteredVal)) {
        status = 'needs_information';
      } else if (requiredValue === null) {
        // e.g. unlimited height
        status = 'pass';
      } else {
        difference = Number((enteredVal - requiredValue).toFixed(2));
        const tol = 1e-9;
        switch (check.compare.operator) {
          case 'gte':
            status = enteredVal >= requiredValue - tol ? 'pass' : 'potential_issue';
            break;
          case 'lte':
            status = enteredVal <= requiredValue + tol ? 'pass' : 'potential_issue';
            break;
          case 'eq':
            status = Math.abs(enteredVal - requiredValue) <= tol ? 'pass' : 'potential_issue';
            break;
          default:
            status = 'pass';
        }
      }
    }
  }

  // Special case: amendment warning rules
  if (ruleDef.rule_id === 'R2_5_C_AMENDMENT_2026') {
    manualReasons.push('amendment_may_apply');
  }

  return buildFinding({
    status,
    requiredValue,
    calculatedValue,
    enteredValue: enteredVal,
    difference,
    manualReasons,
    notesEn,
    notesHi,
    extraEvidence,
    rule,
    check,
    allValues,
    parentRule,
  });
}

function buildFinding({
  status,
  requiredValue = null,
  calculatedValue = null,
  enteredValue = null,
  difference = null,
  missingInputs = [],
  manualReasons = [],
  notesEn = [],
  notesHi = [],
  extraEvidence = [],
  rule,
  check,
  allValues,
  parentRule,
}) {
  const ruleDef = rule.definition || rule;
  const context = { required_value: requiredValue, calculated_value: calculatedValue };

  // Build evidence list
  const evidenceList = [];
  if (check.source?.quote) {
    const quote = check.source.quote;
    const page = check.source.page || findQuotePage(quote, parentRule);
    evidenceList.push({
      rule: parentRule,
      clause: check.source.clause || parentRule,
      page,
      quote,
      quote_verified: quoteInRule(parentRule, quote),
      pdf_url: pdfUrl(page),
    });
  }

  if (Array.isArray(check.extra_quotes)) {
    for (const eq of check.extra_quotes) {
      const page = eq.page || findQuotePage(eq.quote, parentRule);
      evidenceList.push({
        rule: parentRule,
        clause: eq.clause || parentRule,
        page,
        quote: eq.quote,
        quote_verified: quoteInRule(parentRule, eq.quote),
        pdf_url: pdfUrl(page),
      });
    }
  }

  for (const ee of extraEvidence) {
    const page = ee.page || findQuotePage(ee.quote, parentRule);
    evidenceList.push({
      rule: parentRule,
      clause: ee.clause || parentRule,
      page,
      quote: ee.quote,
      quote_verified: quoteInRule(parentRule, ee.quote),
      pdf_url: pdfUrl(page),
    });
  }

  return {
    finding_id: `${ruleDef.rule_id}_${check.check_key}`,
    rule: parentRule,
    rule_id: ruleDef.rule_id,
    check_key: check.check_key,
    kind: check.kind,
    status,
    title_en: check.title_en,
    title_hi: check.title_hi,
    field_evaluated: check.compare?.entered || check.logic?.input || null,
    entered_value: enteredValue,
    required_value: status === 'needs_information' ? null : requiredValue,
    calculated_value: status === 'needs_information' ? null : calculatedValue,
    difference,
    unit: check.unit || null,
    explain_en: formatTemplate(check.explain_en, allValues, context),
    explain_hi: formatTemplate(check.explain_hi, allValues, context),
    notes_en: notesEn,
    notes_hi: notesHi,
    manual_reasons: manualReasons,
    missing_inputs: missingInputs.map((f) => {
      const def = INPUT_FIELDS[f];
      return {
        field: f,
        label_en: def?.label_en || f,
        label_hi: def?.label_hi || f,
        question_en: def?.question_en || null,
        question_hi: def?.question_hi || null,
      };
    }),
    overlay: check.overlay || null,
    evidence: evidenceList,
  };
}

/**
 * Run all (or selected) encoded rules against case inputs.
 */
export function evaluateCase(inputs, rules, opts = {}) {
  const findings = [];
  const rulesEvaluated = [];
  const missingMap = new Map();

  for (const rule of rules) {
    const ruleDef = rule.definition || rule;
    let applicable = false;

    for (const check of ruleDef.checks || []) {
      const finding = evaluateCheck(rule, check, inputs, opts);
      if (finding) {
        applicable = true;
        findings.push(finding);
        if (finding.missing_inputs) {
          for (const m of finding.missing_inputs) {
            missingMap.set(m.field, m);
          }
        }
      }
    }

    rulesEvaluated.push({
      rule_id: ruleDef.rule_id,
      rule: ruleDef.rule,
      version: rule.version || 1,
      verification_status: rule.verification?.status || ruleDef.verification?.status || 'unverified',
      applicable,
    });
  }

  const inputIssues = validateInputs(inputs);
  const missingInputsList = Array.from(missingMap.values());
  const nextActions = buildNextActions(findings, missingInputsList, inputIssues);

  const counts = {
    pass: findings.filter((f) => f.status === 'pass').length,
    potential_issue: findings.filter((f) => f.status === 'potential_issue').length,
    needs_information: findings.filter((f) => f.status === 'needs_information').length,
    manual_review: findings.filter((f) => f.status === 'manual_review').length,
    calculated: findings.filter((f) => f.status === 'calculated').length,
    reference: findings.filter((f) => f.status === 'reference').length,
  };

  let overallStatus = 'pass';
  if (counts.potential_issue > 0) overallStatus = 'potential_issue';
  else if (counts.needs_information > 0) overallStatus = 'needs_information';
  else if (counts.manual_review > 0) overallStatus = 'manual_review';

  return {
    overall_status: overallStatus,
    summary: counts,
    findings,
    missing_inputs: missingInputsList,
    input_issues: inputIssues,
    next_actions: nextActions,
    rules_evaluated: rulesEvaluated,
  };
}

/**
 * Run test cases for one rule in test mode.
 */
export function runRuleTests(rule, tests) {
  const results = [];
  let passed = 0;
  let failed = 0;
  const ruleDef = rule.definition || rule;

  for (const t of tests) {
    const check = ruleDef.checks.find((c) => c.check_key === t.check_key);
    const finding = evaluateCheck(rule, check, t.inputs, { testMode: true });

    let isPass = false;
    if (t.expected.status === 'not_applicable') {
      isPass = finding === null;
    } else if (finding && finding.status === t.expected.status) {
      isPass = true;
      if ('required_value' in t.expected && finding.required_value !== t.expected.required_value) {
        isPass = false;
      }
      if ('calculated_value' in t.expected && (finding.calculated_value ?? null) !== t.expected.calculated_value) {
        isPass = false;
      }
    }

    if (isPass) passed++;
    else failed++;

    results.push({
      test_name: t.name,
      check_key: t.check_key,
      kind: t.kind,
      pass: isPass,
      finding,
      expected: t.expected,
    });
  }

  return {
    total: tests.length,
    passed,
    failed,
    results,
  };
}

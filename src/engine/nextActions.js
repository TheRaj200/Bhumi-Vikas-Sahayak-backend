import { INPUT_FIELDS } from '../constants/fields.js';

export function buildNextActions(findings = [], missingInputs = [], issues = []) {
  const actions = [];
  let p = 1;

  // 1. Errors in inputs
  for (const issue of issues) {
    if (issue.severity === 'error') {
      actions.push({
        priority: p++,
        action_type: 'fix_input',
        target_field: issue.field,
        title_en: `Correct input: ${issue.field}`,
        title_hi: `इनपुट सही करें: ${issue.field}`,
        description_en: issue.message_en,
        description_hi: issue.message_hi,
      });
    }
  }

  // 2. Missing inputs
  for (const m of missingInputs) {
    const fieldDef = INPUT_FIELDS[m.field];
    actions.push({
      priority: p++,
      action_type: 'provide_input',
      target_field: m.field,
      title_en: `Provide missing input: ${fieldDef?.label_en || m.field}`,
      title_hi: `अनुपलब्ध विवरण दर्ज करें: ${fieldDef?.label_hi || m.field}`,
      description_en: m.question_en || `Please provide ${fieldDef?.label_en || m.field} to proceed with evaluation.`,
      description_hi: m.question_hi || `कृपया मूल्यांकन के लिए ${fieldDef?.label_hi || m.field} दर्ज करें।`,
    });
  }

  // 3. Potential issues (revise dimension)
  for (const f of findings) {
    if (f.status === 'potential_issue') {
      const diffText = f.difference !== null && f.difference !== undefined ? ` (Difference: ${f.difference} ${f.unit || ''})` : '';
      actions.push({
        priority: p++,
        action_type: 'revise_dimension',
        related_finding_id: f.finding_id,
        target_field: f.field_evaluated,
        title_en: `Revise proposed dimension: ${f.title_en}`,
        title_hi: `प्रस्तावित माप संशोधित करें: ${f.title_hi}`,
        description_en: `Proposed value does not satisfy rule requirement.${diffText}`,
        description_hi: `प्रस्तावित माप नियम की आवश्यकता को पूरा नहीं करता।${diffText}`,
      });
    }
  }

  // 4. Manual review / Amendment
  for (const f of findings) {
    if (f.status === 'manual_review') {
      const isAmend = f.manual_reasons?.includes('amendment_may_apply');
      actions.push({
        priority: p++,
        action_type: isAmend ? 'check_amendment' : 'human_review',
        related_finding_id: f.finding_id,
        title_en: isAmend ? `Verify recent amendment for ${f.rule}` : `Human review required: ${f.title_en}`,
        title_hi: isAmend ? `हालिया संशोधन की जाँच करें: ${f.rule}` : `अधिकारी समीक्षा आवश्यक: ${f.title_hi}`,
        description_en: f.notes_en?.[0] || 'This provision requires review by an authorized municipal officer.',
        description_hi: f.notes_hi?.[0] || 'इस प्रावधान के लिए अधिकृत नगर निगम अधिकारी द्वारा समीक्षा आवश्यक है।',
      });
    }
  }

  return actions;
}

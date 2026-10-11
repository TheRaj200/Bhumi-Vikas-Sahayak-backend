import { formulas } from './formulas/index.js';
import { getPath, isMissing } from './paths.js';

export function computeRequired(check, rule, values) {
  let logic = check.logic;
  if (!logic) return { required: null };

  if (logic.$ref_table) {
    const table = rule?.tables?.[logic.$ref_table] || rule?.definition?.tables?.[logic.$ref_table];
    if (!table) {
      return { status: 'manual_review', reason: 'table_reference_missing' };
    }
    logic = {
      type: 'range_table',
      input: table.input,
      rows: table.rows,
      value_key: logic.value_key,
      gap_policy: table.gap_policy,
    };
  }

  if (logic.type === 'constant') {
    return { required: logic.value };
  }

  if (logic.type === 'range_table') {
    const inputVal = getPath(values, logic.input);
    if (isMissing(inputVal)) {
      return { status: 'needs_information', missingFields: [logic.input] };
    }

    let matchedRow = null;
    for (const r of logic.rows) {
      const minOk = r.min === null || r.min === undefined ? true : r.min_inclusive ? inputVal >= r.min : inputVal > r.min;
      const maxOk = r.max === null || r.max === undefined ? true : r.max_inclusive ? inputVal <= r.max : inputVal < r.max;
      if (minOk && maxOk) {
        matchedRow = r;
        break;
      }
    }

    if (!matchedRow) {
      return { status: 'manual_review', reason: 'outside_table_range' };
    }

    let val = matchedRow.value;
    if (logic.value_key && val && typeof val === 'object') {
      val = val[logic.value_key];
    }

    return { required: val, matchedRow };
  }

  if (logic.type === 'lookup') {
    const inputVal = getPath(values, logic.input);
    if (isMissing(inputVal)) {
      return { status: 'needs_information', missingFields: [logic.input] };
    }
    const mapped = logic.map?.[inputVal];
    if (mapped === undefined || mapped === null) {
      return { status: 'manual_review', reason: logic.missing_key || 'lookup_key_missing' };
    }
    return { required: mapped };
  }

  if (logic.type === 'formula') {
    const fn = formulas[logic.formula_id];
    if (!fn) {
      return { status: 'manual_review', reason: 'unknown_formula' };
    }
    const res = fn(logic.params, values);
    if (res.status === 'calculated' || res.status === 'computed') {
      return { required: res.value, calculated: res.value };
    }
    return res;
  }

  if (logic.type === 'boolean_required') {
    const inputVal = getPath(values, logic.input);
    if (isMissing(inputVal)) {
      return { status: 'needs_information', missingFields: [logic.input] };
    }
    return { required: logic.required, entered: inputVal };
  }

  if (logic.type === 'allowed_values') {
    const inputVal = getPath(values, logic.input);
    if (isMissing(inputVal)) {
      return { status: 'needs_information', missingFields: [logic.input] };
    }
    return { required: logic.values, entered: inputVal };
  }

  if (logic.type === 'reference') {
    return { required: null, kind: 'reference' };
  }

  return { required: null };
}

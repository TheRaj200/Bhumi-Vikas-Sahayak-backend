import { getPath, isMissing } from './paths.js';

export function evalCondition(cond, values, context = {}) {
  if (!cond) return { result: true, missingFields: [] };

  if (cond.all) {
    let hasUnknown = false;
    const missing = [];
    for (const c of cond.all) {
      const res = evalCondition(c, values, context);
      if (res.result === false) return { result: false, missingFields: [] };
      if (res.result === 'unknown') {
        hasUnknown = true;
        missing.push(...res.missingFields);
      }
    }
    if (hasUnknown) return { result: 'unknown', missingFields: [...new Set(missing)] };
    return { result: true, missingFields: [] };
  }

  if (cond.any) {
    let hasUnknown = false;
    const missing = [];
    for (const c of cond.any) {
      const res = evalCondition(c, values, context);
      if (res.result === true) return { result: true, missingFields: [] };
      if (res.result === 'unknown') {
        hasUnknown = true;
        missing.push(...res.missingFields);
      }
    }
    if (hasUnknown) return { result: 'unknown', missingFields: [...new Set(missing)] };
    return { result: false, missingFields: [] };
  }

  if (cond.not) {
    const res = evalCondition(cond.not, values, context);
    if (res.result === 'unknown') return res;
    return { result: !res.result, missingFields: [] };
  }

  if (cond.field) {
    const fieldVal = getPath(values, cond.field);
    const missing = isMissing(fieldVal);

    if (cond.op === 'exists') {
      return { result: !missing, missingFields: [] };
    }

    if (missing) {
      if (cond.if_missing === 'false') {
        return { result: false, missingFields: [] };
      }
      return { result: 'unknown', missingFields: [cond.field] };
    }

    let targetVal = cond.value;
    if (targetVal && typeof targetVal === 'object' && targetVal.value_from === 'required') {
      const req = context.required;
      targetVal = req !== undefined && req !== null ? req * (targetVal.factor ?? 1) : undefined;
      if (isMissing(targetVal)) {
        return { result: 'unknown', missingFields: [] };
      }
    }

    let pass = false;
    switch (cond.op) {
      case 'eq':
        pass = fieldVal === targetVal;
        break;
      case 'ne':
        pass = fieldVal !== targetVal;
        break;
      case 'in':
        pass = Array.isArray(targetVal) && targetVal.includes(fieldVal);
        break;
      case 'not_in':
        pass = Array.isArray(targetVal) && !targetVal.includes(fieldVal);
        break;
      case 'lt':
        pass = fieldVal < targetVal;
        break;
      case 'lte':
        pass = fieldVal <= targetVal;
        break;
      case 'gt':
        pass = fieldVal > targetVal;
        break;
      case 'gte':
        pass = fieldVal >= targetVal;
        break;
      case 'is_true':
        pass = fieldVal === true;
        break;
      case 'is_false':
        pass = fieldVal === false;
        break;
      default:
        pass = false;
    }
    return { result: pass, missingFields: [] };
  }

  return { result: true, missingFields: [] };
}

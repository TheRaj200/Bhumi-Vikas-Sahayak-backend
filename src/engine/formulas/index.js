import { getPath, isMissing } from '../paths.js';

export const formulas = {
  rate_times_input(params, values) {
    const val = getPath(values, params.input);
    if (isMissing(val)) return { status: 'needs_information', value: null };
    const res = Number((val * params.rate).toFixed(params.round_to ?? 2));
    return { status: 'calculated', value: res };
  },

  rate_per_unit_or_part(params, values) {
    const val = getPath(values, params.input);
    if (isMissing(val)) return { status: 'needs_information', value: null };
    const units = Math.ceil(val);
    const res = units * params.rate;
    return { status: 'calculated', value: res };
  },

  building_permission_fee(params, values) {
    const area = getPath(values, params.area_input);
    const bType = getPath(values, 'building_type');
    const isHighRise = getPath(values, 'derived.is_high_rise');

    if (isMissing(area) || isMissing(bType) || isMissing(isHighRise)) {
      return { status: 'needs_information', value: null };
    }

    if (isHighRise) {
      const multInfo = params.high_rise?.multipliers?.[bType];
      if (!multInfo) {
        return { status: 'manual_review', value: null, reason: 'unlisted_building_type' };
      }
      const fee = params.high_rise.rate_per_sqm * area * multInfo.factor;
      return { status: 'calculated', value: Number(fee.toFixed(2)) };
    }

    // Normal (non-high rise)
    const multInfo = params.multipliers?.[bType];
    if (!multInfo) {
      return { status: 'manual_review', value: null, reason: 'unlisted_building_type' };
    }

    // Check slabs
    let matchedSlab = null;
    for (const slab of params.slabs) {
      const minOk = slab.min_exclusive ? area > slab.min : area >= slab.min;
      const maxOk = slab.max === null || slab.max === undefined ? true : area <= slab.max;
      if (minOk && maxOk) {
        matchedSlab = slab;
        break;
      }
    }

    if (!matchedSlab) {
      return { status: 'manual_review', value: null, reason: 'between_slabs_or_outside' };
    }

    const fee = matchedSlab.fee * multInfo.factor;
    return { status: 'calculated', value: Number(fee.toFixed(2)) };
  },

  development_permission_fee(params, values) {
    const areaHectare = getPath(values, params.area_input);
    const zone = getPath(values, 'land_use_zone');
    const pop = getPath(values, 'planning_area_population');

    if (isMissing(areaHectare) || isMissing(zone) || isMissing(pop)) {
      return { status: 'needs_information', value: null };
    }

    let targetGroup = null;
    for (const [groupName, zones] of Object.entries(params.zone_groups)) {
      if (zones.includes(zone)) {
        targetGroup = groupName;
        break;
      }
    }

    if (!targetGroup) {
      return { status: 'manual_review', value: null, reason: 'unlisted_zone' };
    }

    const rate = params.rates_per_hectare?.[targetGroup]?.[pop];
    if (rate === undefined || rate === null) {
      return { status: 'manual_review', value: null, reason: 'unlisted_population' };
    }

    const fee = areaHectare * rate;
    return { status: 'calculated', value: Number(fee.toFixed(2)) };
  },

  sanction_validity(params, values) {
    const grantedOn = getPath(values, 'permission.granted_on');
    if (isMissing(grantedOn)) {
      return { status: 'needs_information', value: null };
    }

    const parts = String(grantedOn).split('-');
    if (parts.length !== 3) {
      return { status: 'manual_review', value: null, reason: 'invalid_date' };
    }

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    const targetYear = y + (params.valid_years ?? 3);
    let targetDay = d;

    // Handle Feb 29 leap year
    if (m === 2 && d === 29) {
      const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
      if (!isLeap) targetDay = 28;
    }

    const mm = String(m).padStart(2, '0');
    const dd = String(targetDay).padStart(2, '0');
    const dateStr = `${targetYear}-${mm}-${dd}`;

    return { status: 'calculated', value: dateStr };
  },

  max_height_from_rule42(params, values) {
    const roadWidth = getPath(values, params.road_width_field || 'road_width_m');
    const plotArea = getPath(values, 'plot_area_sqm');
    const frontage = getPath(values, 'plot_width_m');

    if (isMissing(roadWidth) || isMissing(plotArea) || isMissing(frontage)) {
      return { status: 'needs_information', value: null };
    }

    let matchingRows = [];
    for (const r of params.rows) {
      if (roadWidth >= r.road_width_min_m && plotArea >= r.plot_area_min_sqm && frontage >= r.frontage_min_m) {
        matchingRows.push(r);
      }
    }

    if (matchingRows.length === 0) {
      return { status: 'computed', value: params.default_max_height_m ?? 12.5 };
    }

    // Check if any row has null max_height_m (no limit)
    const hasUnlimited = matchingRows.some((r) => r.max_height_m === null || r.max_height_m === undefined);
    if (hasUnlimited) {
      return { status: 'computed', value: null };
    }

    const maxHeight = Math.max(...matchingRows.map((r) => r.max_height_m));
    return { status: 'computed', value: maxHeight };
  },
};

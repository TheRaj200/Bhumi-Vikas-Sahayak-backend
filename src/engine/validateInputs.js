import { getPath, isMissing } from './paths.js';

export function validateInputs(inputs) {
  const issues = [];
  if (!inputs) return issues;

  const plotW = getPath(inputs, 'plot_width_m');
  const plotD = getPath(inputs, 'plot_depth_m');
  const plotArea = getPath(inputs, 'plot_area_sqm');

  const footW = getPath(inputs, 'proposed.footprint_width_m');
  const footD = getPath(inputs, 'proposed.footprint_depth_m');

  const front = getPath(inputs, 'proposed.front_setback_m');
  const rear = getPath(inputs, 'proposed.rear_setback_m');
  const left = getPath(inputs, 'proposed.side_setback_left_m');
  const right = getPath(inputs, 'proposed.side_setback_right_m');

  const height = getPath(inputs, 'proposed.building_height_m');
  const floors = getPath(inputs, 'proposed.floors');

  // Width check: left + footprint_w + right <= plot_width (+1% tolerance)
  if (!isMissing(left) && !isMissing(footW) && !isMissing(right) && !isMissing(plotW)) {
    const totalW = left + footW + right;
    if (totalW > plotW * 1.01) {
      issues.push({
        field: 'proposed.footprint_width_m',
        severity: 'error',
        message_en: `Left setback (${left}m) + footprint width (${footW}m) + right setback (${right}m) exceeds plot width (${plotW}m).`,
        message_hi: `बायां सेटबैक (${left}m) + फुटप्रिंट चौड़ाई (${footW}m) + दायां सेटबैक (${right}m) प्लॉट की चौड़ाई (${plotW}m) से अधिक है।`,
      });
    }
  }

  // Depth check: front + footprint_d + rear <= plot_depth (+1% tolerance)
  if (!isMissing(front) && !isMissing(footD) && !isMissing(rear) && !isMissing(plotD)) {
    const totalD = front + footD + rear;
    if (totalD > plotD * 1.01) {
      issues.push({
        field: 'proposed.footprint_depth_m',
        severity: 'error',
        message_en: `Front setback (${front}m) + footprint depth (${footD}m) + rear setback (${rear}m) exceeds plot depth (${plotD}m).`,
        message_hi: `सामने का सेटबैक (${front}m) + फुटप्रिंट गहराई (${footD}m) + पीछे का सेटबैक (${rear}m) प्लॉट की गहराई (${plotD}m) से अधिक है।`,
      });
    }
  }

  // Width x depth vs plot_area differs > 2% -> warning
  if (!isMissing(plotW) && !isMissing(plotD) && !isMissing(plotArea) && plotArea > 0) {
    const calcArea = plotW * plotD;
    const diffPct = Math.abs(calcArea - plotArea) / plotArea;
    if (diffPct > 0.02) {
      issues.push({
        field: 'plot_area_sqm',
        severity: 'warning',
        message_en: `Calculated area (${calcArea.toFixed(1)} sqm) differs from declared plot area (${plotArea} sqm) by ${(diffPct * 100).toFixed(1)}%.`,
        message_hi: `गणना किया गया क्षेत्रफल (${calcArea.toFixed(1)} वर्ग मी.) घोषित क्षेत्रफल (${plotArea} वर्ग मी.) से भिन्न है।`,
      });
    }
  }

  // Setbacks > plot dims
  if (!isMissing(plotW)) {
    if (!isMissing(left) && left >= plotW) {
      issues.push({ field: 'proposed.side_setback_left_m', severity: 'error', message_en: 'Left setback cannot be greater than plot width.', message_hi: 'बायां सेटबैक प्लॉट चौड़ाई से अधिक नहीं हो सकता।' });
    }
    if (!isMissing(right) && right >= plotW) {
      issues.push({ field: 'proposed.side_setback_right_m', severity: 'error', message_en: 'Right setback cannot be greater than plot width.', message_hi: 'दायां सेटबैक प्लॉट चौड़ाई से अधिक नहीं हो सकता।' });
    }
  }
  if (!isMissing(plotD)) {
    if (!isMissing(front) && front >= plotD) {
      issues.push({ field: 'proposed.front_setback_m', severity: 'error', message_en: 'Front setback cannot be greater than plot depth.', message_hi: 'सामने का सेटबैक प्लॉट गहराई से अधिक नहीं हो सकता।' });
    }
    if (!isMissing(rear) && rear >= plotD) {
      issues.push({ field: 'proposed.rear_setback_m', severity: 'error', message_en: 'Rear setback cannot be greater than plot depth.', message_hi: 'पीछे का सेटबैक प्लॉट गहराई से अधिक नहीं हो सकता।' });
    }
  }

  // Height / floors ratio check
  if (!isMissing(height) && !isMissing(floors) && floors > 0) {
    const mPerFloor = height / floors;
    if (mPerFloor < 2.0 || mPerFloor > 6.0) {
      issues.push({
        field: 'proposed.building_height_m',
        severity: 'warning',
        code: 'unit_suspect',
        message_en: `Average floor height (${mPerFloor.toFixed(1)}m per floor) is outside typical range (2m to 6m). Verify units.`,
        message_hi: `औसत मंज़िल ऊँचाई (${mPerFloor.toFixed(1)}m) सामान्य सीमा (2m से 6m) से बाहर है।`,
      });
    }
  }

  return issues;
}

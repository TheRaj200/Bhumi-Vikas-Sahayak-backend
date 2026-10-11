import { getPath, isMissing } from './paths.js';

export function computeDerived(inputs) {
  const derived = {};

  const plotWidth = getPath(inputs, 'plot_width_m');
  if (!isMissing(plotWidth)) {
    derived['derived.frontage_m'] = plotWidth;
  }

  const plotArea = getPath(inputs, 'plot_area_sqm');
  if (!isMissing(plotArea)) {
    derived['derived.plot_area_hectare'] = Number((plotArea / 10000).toFixed(6));
  }

  const builtUp = getPath(inputs, 'proposed.total_built_up_area_sqm');
  if (!isMissing(builtUp) && !isMissing(plotArea) && plotArea > 0) {
    derived['derived.far_achieved'] = Number((builtUp / plotArea).toFixed(4));
  }

  const trees = getPath(inputs, 'proposed.live_trees_count');
  if (!isMissing(trees) && !isMissing(derived['derived.plot_area_hectare']) && derived['derived.plot_area_hectare'] > 0) {
    derived['derived.trees_per_hectare'] = Number((trees / derived['derived.plot_area_hectare']).toFixed(2));
  }

  const left = getPath(inputs, 'proposed.side_setback_left_m');
  const right = getPath(inputs, 'proposed.side_setback_right_m');
  if (!isMissing(left) && !isMissing(right)) {
    derived['derived.side_setback_min_m'] = Math.min(left, right);
    derived['derived.side_setback_max_m'] = Math.max(left, right);
  }

  const road = getPath(inputs, 'road_width_m');
  const addRoads = getPath(inputs, 'additional_road_widths_m');
  if (!isMissing(road)) {
    const allRoads = [road, ...(Array.isArray(addRoads) ? addRoads.filter((r) => !isMissing(r)) : [])];
    derived['derived.max_road_width_m'] = Math.max(...allRoads);
  }

  const rear = getPath(inputs, 'proposed.rear_setback_m');
  if (!isMissing(rear) && !isMissing(left) && !isMissing(right)) {
    derived['derived.side_rear_min_m'] = Math.min(rear, left, right);
  }

  const front = getPath(inputs, 'proposed.front_setback_m');
  if (!isMissing(front) && !isMissing(rear) && !isMissing(left) && !isMissing(right)) {
    derived['derived.all_setbacks_min_m'] = Math.min(front, rear, left, right);
  }

  const footW = getPath(inputs, 'proposed.footprint_width_m');
  const footD = getPath(inputs, 'proposed.footprint_depth_m');
  if (!isMissing(footW) && !isMissing(footD) && !isMissing(plotArea) && plotArea > 0) {
    derived['derived.ground_coverage_pct'] = Number(((footW * footD / plotArea) * 100).toFixed(2));
  }

  const height = getPath(inputs, 'proposed.building_height_m');
  const floors = getPath(inputs, 'proposed.floors');
  if (!isMissing(height) && height > 30) {
    derived['derived.is_high_rise'] = true;
  } else if (!isMissing(floors) && floors > 10) {
    derived['derived.is_high_rise'] = true;
  } else if (!isMissing(height) && !isMissing(floors)) {
    if (height <= 30 && floors <= 10) {
      derived['derived.is_high_rise'] = false;
    }
  }

  return derived;
}

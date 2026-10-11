# Engine — implementation guide (for the backend dev's AI)

Spec: `docs/RULE_COMPILER.md`. Contract: `docs/API_CONTRACT.md` §7 (Finding, ComplianceResult).

Files to create (keep each small and pure):

| File | Exports | Notes |
|---|---|---|
| `paths.js` | `getPath(obj, 'proposed.front_setback_m')`, `isMissing(v)` | `null`, `undefined`, `''`, `NaN` = missing |
| `derived.js` | `computeDerived(inputs)` → `{ 'derived.far_achieved': 1.2, ... }` | Formulas in `src/constants/fields.js` `DERIVED_FIELDS`. Missing → key absent. `far_achieved` rounded to 4 dp. `is_high_rise`: true if floors > 10 or height > 30; false if height ≤ 30 and floors ≤ 10; else missing |
| `conditions.js` | `evalCondition(cond, values, required)` → `true \| false \| 'unknown'` + `missingFields` | Three-valued logic: `all` = false if any false, else unknown if any unknown; `any` = true if any true, else unknown if any unknown; `not` flips true/false, keeps unknown. Leaf `if_missing: "false"` → false when missing |
| `logic.js` | `computeRequired(check, rule, values)` → `{ required, row, status?, reason? }` | `constant`, `range_table` (+ `$ref_table` → `rule.definition.tables`), `lookup`, `allowed_values`, `boolean_required`, `reference`, `formula` |
| `formulas/index.js` | registry `{ formula_id: fn(params, values) }` | `rate_times_input`, `rate_per_unit_or_part` (ceil), `building_permission_fee`, `development_permission_fee`, `sanction_validity`, `max_height_from_rule42` |
| `validateInputs.js` | `validateInputs(inputs)` → `InputIssue[]` | Geometry: left + footprint_w + right ≤ plot_width (+1% tolerance) → error; front + footprint_d + rear ≤ plot_depth → error; width × depth vs plot_area differs > 2% → warning; setbacks > plot dims → error; height/floors ratio < 2 m or > 6 m per floor → warning `unit_suspect` |
| `nextActions.js` | `buildNextActions(findings, missingInputs, issues)` | F10. Priority 1: fix_input / provide_input for material fields; 2: revise_dimension for potential issues (with difference); 3: human_review / verify_rule / check_amendment |
| `index.js` | `evaluateCheck`, `evaluateCase`, `runRuleTests`, `ENGINE_READY` | Glue; builds Finding objects with evidence from `rulesStore` (`findQuotePage`, `pdfUrl`) |

Rules:

- Never compute a `required_value` for a rule that is not `enabled_for_checks` unless `testMode`.
- Evidence is always built from the rule JSON (`source`, `extra_quotes`, matched row `quote`) + `rulesStore` — never from the LLM.
- Round displayed numbers to 2 dp; compare with tolerance `1e-9` on unrounded values.
- `sanction_validity`: add years to the grant date; if the day does not exist (29 Feb) use the last day of that month. Output `calculated_value` = valid-until `YYYY-MM-DD`; steps include the 5-year limit date and whether it has expired as of `permission.as_of` (default today).
- `building_permission_fee`: slab where `min ≤ area ≤ max` (or `area > min` when `min_exclusive`); area between slabs → `manual_review`; × multiplier by `building_type`; high-rise uses `rate_per_sqm × area × factor`; unlisted type → `manual_review`.
- `development_permission_fee`: `rate_per_hectare × hectares` (pro-rata; exception note says part-hectare handling is unclear).
- `max_height_from_rule42`: highest `max_height_m` among rows where road (widest), plot area and frontage meet the minimums; `null` max = no upper limit (pass, `required_value: null`); no row met → `default_max_height_m`.
- When done: set `ENGINE_READY = true`, run `npm test` — every case in `src/rules/tests/` must pass.

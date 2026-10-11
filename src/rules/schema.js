import { z } from 'zod';
import { ALL_FIELD_PATHS } from '../constants/fields.js';

// Zod schema for encoded rule files and rule test files. Spec: docs/RULE_COMPILER.md

const fieldPath = z.string().refine((p) => ALL_FIELD_PATHS.has(p), { message: 'Unknown field path (see src/constants/fields.js)' });

const CONDITION_OPS = ['eq', 'ne', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists', 'is_true', 'is_false'];

const valueFromRequired = z.object({ value_from: z.literal('required'), factor: z.number().positive() }).strict();

const conditionValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number()])),
  valueFromRequired,
]);

const leafCondition = z
  .object({
    field: fieldPath,
    op: z.enum(CONDITION_OPS),
    value: conditionValue.optional(),
    // "unknown" (default): a missing field makes the condition unknown → needs_information.
    // "false": a missing field means the optional module is not used → condition is false.
    if_missing: z.enum(['unknown', 'false']).optional(),
  })
  .strict()
  .refine((c) => ['exists', 'is_true', 'is_false'].includes(c.op) || c.value !== undefined, {
    message: 'Condition needs a value for this op',
  });

export const conditionSchema = z.lazy(() =>
  z.union([
    leafCondition,
    z.object({ all: z.array(conditionSchema).min(1) }).strict(),
    z.object({ any: z.array(conditionSchema).min(1) }).strict(),
    z.object({ not: conditionSchema }).strict(),
  ]),
);

const rangeRow = z
  .object({
    min: z.number().nullable(),
    min_inclusive: z.boolean(),
    max: z.number().nullable(),
    max_inclusive: z.boolean(),
    value: z.union([z.number(), z.record(z.string(), z.number())]),
    label: z.string(),
    quote: z.string().optional(),
    page: z.number().int().positive().optional(),
  })
  .strict();

export const rangeTableSchema = z
  .object({
    type: z.literal('range_table'),
    input: fieldPath,
    gap_policy: z.literal('manual_review'),
    rows: z.array(rangeRow).min(1),
    value_key: z.string().optional(),
  })
  .strict();

const logicSchema = z.union([
  z.object({ type: z.literal('constant'), value: z.number() }).strict(),
  rangeTableSchema,
  z
    .object({
      type: z.literal('lookup'),
      input: fieldPath,
      map: z.record(z.string(), z.number()),
      missing_key: z.literal('manual_review'),
    })
    .strict(),
  z.object({ type: z.literal('formula'), formula_id: z.string().regex(/^[a-z0-9_]+$/), params: z.record(z.string(), z.any()) }).strict(),
  z.object({ type: z.literal('boolean_required'), input: fieldPath, required: z.boolean() }).strict(),
  z.object({ type: z.literal('allowed_values'), input: fieldPath, values: z.array(z.string()).min(1) }).strict(),
  z.object({ type: z.literal('reference') }).strict(),
  z.object({ $ref_table: z.string(), value_key: z.string() }).strict(),
]);

export const MANUAL_REASONS = [
  'rule_not_verified',
  'tests_failing',
  'exception_may_apply',
  'outside_table_range',
  'ambiguous',
  'amendment_may_apply',
  'conflict',
  'development_plan_may_override',
  'inconsistent_input',
];

const exceptionSchema = z
  .object({
    id: z.string(),
    text_en: z.string().min(1),
    text_hi: z.string().min(1),
    when: conditionSchema.optional(),
    effect: z.enum(['manual_review', 'note', 'not_applicable']),
    reason: z.enum(MANUAL_REASONS),
    quote: z.string().optional(),
    page: z.number().int().positive().optional(),
  })
  .strict();

const quoteRef = z.object({ clause: z.string(), page: z.number().int().positive(), quote: z.string().min(1) }).strict();

export const UNITS = ['m', 'sqm', 'ratio', 'INR', 'years', 'date', 'count', 'hectare', 'percent'];

const checkSchema = z
  .object({
    check_key: z.string().regex(/^[a-z0-9_]+$/),
    kind: z.enum(['check', 'calculation', 'reference']),
    title_en: z.string().min(1),
    title_hi: z.string().min(1),
    applies_when: conditionSchema.optional(),
    required_inputs: z.array(fieldPath),
    logic: logicSchema,
    compare: z.object({ entered: fieldPath, operator: z.enum(['gte', 'lte', 'eq']) }).strict().nullable(),
    unit: z.enum(UNITS).nullable(),
    overlay: z.object({ edge: z.enum(['front', 'rear', 'left', 'right', 'sides', 'sides_rear', 'all']) }).strict().nullable(),
    exceptions: z.array(exceptionSchema),
    notes_en: z.array(z.string()),
    notes_hi: z.array(z.string()),
    source: quoteRef,
    extra_quotes: z.array(quoteRef).optional(),
    explain_en: z.string().min(1),
    explain_hi: z.string().min(1),
  })
  .strict()
  .superRefine((c, ctx) => {
    const isAllowedValues = c.logic.type === 'allowed_values' || c.logic.type === 'boolean_required';
    if (c.kind === 'check' && !c.compare && !isAllowedValues) {
      ctx.addIssue({ code: 'custom', message: 'kind "check" needs compare (or allowed_values / boolean_required logic)' });
    }
    if (c.kind !== 'check' && c.compare) {
      ctx.addIssue({ code: 'custom', message: 'compare is only for kind "check"' });
    }
    if (c.kind === 'reference' && c.logic.type !== 'reference') {
      ctx.addIssue({ code: 'custom', message: 'kind "reference" needs logic.type "reference"' });
    }
  });

export const verificationSchema = z
  .object({
    status: z.enum(['unverified', 'verified', 'rejected']),
    verified_by: z.string().nullable(),
    verified_on: z.string().nullable(),
    checked_pdf_pages: z.array(z.number().int().positive()),
    notes: z.string(),
  })
  .strict();

export const encodedRuleSchema = z
  .object({
    rule_id: z.string().regex(/^R[0-9A-Z_]+$/),
    rule_ref: z.string().min(1),
    parent_rule: z.string().min(1),
    title_en: z.string().min(1),
    title_hi: z.string().min(1),
    topic: z.enum(['setback', 'far', 'height', 'fee', 'validity', 'clearance', 'lift', 'farm_house', 'amendment']),
    jurisdiction: z.string(),
    source_document: z.string(),
    source_version: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    related_rules: z.array(z.string()),
    interpretation_notes: z.string(),
    checks: z.array(checkSchema).min(1),
    tables: z.record(z.string(), rangeTableSchema).optional(),
    verification: verificationSchema,
  })
  .strict()
  .superRefine((rule, ctx) => {
    const keys = new Set();
    for (const check of rule.checks) {
      if (keys.has(check.check_key)) ctx.addIssue({ code: 'custom', message: `Duplicate check_key ${check.check_key}` });
      keys.add(check.check_key);
      if ('$ref_table' in check.logic) {
        const table = rule.tables?.[check.logic.$ref_table];
        if (!table) {
          ctx.addIssue({ code: 'custom', message: `${check.check_key}: unknown table ${check.logic.$ref_table}` });
        } else if (!table.rows.every((r) => typeof r.value === 'object' && check.logic.value_key in r.value)) {
          ctx.addIssue({ code: 'custom', message: `${check.check_key}: value_key ${check.logic.value_key} missing in some rows` });
        }
      }
    }
  });

export const ruleTestSchema = z
  .object({
    check_key: z.string(),
    name: z.string().min(1),
    kind: z.enum(['normal', 'boundary', 'missing_input', 'exception']),
    inputs: z.record(z.string(), z.any()),
    expected: z
      .object({
        status: z.enum(['pass', 'potential_issue', 'needs_information', 'manual_review', 'calculated', 'reference', 'not_applicable']),
        required_value: z.number().nullable().optional(),
        calculated_value: z.union([z.number(), z.string()]).nullable().optional(),
      })
      .strict(),
  })
  .strict();

export const ruleTestFileSchema = z.array(ruleTestSchema).min(1);

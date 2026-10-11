import { z } from 'zod';
import { ENUMS } from '../constants/fields.js';

// Request validation for every endpoint in docs/API_CONTRACT.md. Keep in sync with the contract.

const nullableEnum = (values) => z.enum(values).nullable().optional();
const len = (min, max) => z.number().min(min).max(max).nullable().optional();
const flag = z.boolean().nullable().optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional();

export const langSchema = z.enum(['en', 'hi']);

export const caseInputsSchema = z
  .object({
    plot_area_sqm: z.number().positive().max(10_000_000).nullable().optional(),
    plot_width_m: len(0.1, 10_000),
    plot_depth_m: len(0.1, 10_000),
    road_width_m: len(0.5, 500),
    road_facing_side: nullableEnum(ENUMS.road_facing_side),
    additional_road_widths_m: z.array(z.number().min(0.5).max(500)).max(4).optional(),
    land_use_zone: nullableEnum(ENUMS.land_use_zone),
    building_type: nullableEnum(ENUMS.building_type),
    building_form: nullableEnum(ENUMS.building_form),
    commercial_category: nullableEnum(ENUMS.commercial_category),
    planning_area_population: nullableEnum(ENUMS.planning_area_population),
    application_type: nullableEnum(ENUMS.application_type),
    in_existing_developed_area: flag,
    near_aerodrome: flag,
    proposed: z
      .object({
        building_height_m: len(0, 1000),
        floors: z.number().int().min(0).max(300).nullable().optional(),
        footprint_width_m: len(0, 10_000),
        footprint_depth_m: len(0, 10_000),
        front_setback_m: len(0, 1000),
        rear_setback_m: len(0, 1000),
        side_setback_left_m: len(0, 1000),
        side_setback_right_m: len(0, 1000),
        total_built_up_area_sqm: len(0, 100_000_000),
        entrance_width_m: len(0, 100),
        has_lift: flag,
        live_trees_count: z.number().int().min(0).max(1_000_000).nullable().optional(),
        gift_shop_area_sqm: len(0, 100_000),
      })
      .strict()
      .optional(),
    electric_line: z
      .object({
        present: flag,
        voltage_class: nullableEnum(ENUMS.voltage_class),
        vertical_clearance_m: len(0, 1000),
        horizontal_clearance_m: len(0, 1000),
      })
      .strict()
      .optional(),
    permission: z
      .object({
        type: nullableEnum(ENUMS.permission_type),
        granted_on: isoDate,
        execution_started: flag,
        as_of: isoDate,
      })
      .strict()
      .optional(),
  })
  .strict();

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
const ruleId = z.string().regex(/^R[0-9A-Z_]+$/, 'Invalid rule_id');
const label = z.string().trim().min(1).max(60);

export const questionRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(1000),
    lang: langSchema.optional(),
    inputs: caseInputsSchema.optional(),
    application_id: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(300),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const complianceCheckRequestSchema = z
  .object({
    inputs: caseInputsSchema,
    application_id: z.string().optional(),
    rule_ids: z.array(ruleId).max(50).optional(),
    test_mode: z.boolean().optional(),
    lang: langSchema.optional(),
  })
  .strict();

export const applicationCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    inputs: caseInputsSchema,
    is_sample: z.boolean().optional(),
  })
  .strict();

export const applicationUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    inputs: caseInputsSchema.optional(),
  })
  .strict()
  .refine((b) => b.title !== undefined || b.inputs !== undefined, { message: 'Send title and/or inputs' });

export const reviewEventCreateSchema = z
  .object({
    type: z.enum(['note', 'manual_decision']),
    rule_id: ruleId.optional(),
    finding_id: z.string().max(200).optional(),
    decision: z.enum(['accept_finding', 'needs_revision', 'escalate']).optional(),
    note: z.string().trim().min(1).max(1000),
    reviewer_label: label,
  })
  .strict()
  .refine((b) => b.type !== 'manual_decision' || b.decision, { message: 'manual_decision needs a decision' });

export const verificationRequestSchema = z
  .object({
    status: z.enum(['verified', 'rejected', 'unverified']),
    verified_by: label,
    checked_pdf_pages: z.array(z.number().int().min(1).max(200)).max(50),
    notes: z.string().max(2000).optional(),
    confirm_checked_against_pdf: z.literal(true),
  })
  .strict()
  .refine((b) => b.status !== 'verified' || b.checked_pdf_pages.length > 0, {
    message: 'List the PDF pages you checked',
  });

export const ruleTestCreateSchema = z
  .object({
    check_key: z.string().regex(/^[a-z0-9_]+$/),
    name: z.string().trim().min(1).max(200),
    kind: z.enum(['normal', 'boundary', 'missing_input', 'exception']),
    inputs: caseInputsSchema,
    expected: z
      .object({
        status: z.enum(['pass', 'potential_issue', 'needs_information', 'manual_review', 'calculated', 'reference', 'not_applicable']),
        required_value: z.number().nullable().optional(),
        calculated_value: z.union([z.number(), z.string()]).nullable().optional(),
      })
      .strict(),
  })
  .strict();

export const lookupTimingCreateSchema = z
  .object({
    case_label: z.string().trim().min(1).max(120),
    mode: z.enum(['manual', 'assisted']),
    seconds: z.number().positive().max(86_400),
    correct: z.boolean().nullable(),
    tester_label: label,
  })
  .strict();

export const idParamSchema = z.object({ id: z.string().trim().min(1).max(120) });
export const ruleIdParamSchema = z.object({ rule_id: ruleId });

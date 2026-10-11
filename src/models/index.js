import mongoose from 'mongoose';
import { toApiJson } from './plugins.js';

// Collections from PRD §14 (data model) + eval runs and lookup timings. Field docs: docs/DATA_MODEL.md

const { Schema } = mongoose;
const Mixed = Schema.Types.Mixed;
const timestamps = { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } };

const ruleSchema = new Schema(
  {
    rule: { type: String, required: true, unique: true },
    title: String,
    part: String,
    page_start: Number,
    page_end: Number,
    text: String,
    source_version: { type: String, required: true },
  },
  timestamps,
);
toApiJson(ruleSchema);

const verificationSchema = new Schema(
  {
    status: { type: String, enum: ['unverified', 'verified', 'rejected'], default: 'unverified' },
    verified_by: { type: String, default: null },
    verified_on: { type: String, default: null },
    checked_pdf_pages: { type: [Number], default: [] },
    notes: { type: String, default: '' },
  },
  { _id: false },
);

const encodedRuleSchema = new Schema(
  {
    rule_id: { type: String, required: true, unique: true },
    rule_ref: String,
    parent_rule: String,
    title_en: String,
    title_hi: String,
    topic: String,
    version: { type: Number, default: 1 },
    definition_hash: { type: String, required: true },
    definition: { type: Mixed, required: true },
    verification: { type: verificationSchema, default: () => ({}) },
    test_status: { type: String, enum: ['not_run', 'passing', 'failing'], default: 'not_run' },
    tests_total: { type: Number, default: 0 },
    tests_passed: { type: Number, default: 0 },
    last_tested_at: { type: Date, default: null },
  },
  timestamps,
);
toApiJson(encodedRuleSchema);

const ruleVersionSchema = new Schema(
  {
    rule_id: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    definition_hash: String,
    definition: Mixed,
    source_version: String,
    change_note: String,
  },
  timestamps,
);
ruleVersionSchema.index({ rule_id: 1, version: 1 }, { unique: true });
toApiJson(ruleVersionSchema);

const ruleTestSchema = new Schema(
  {
    rule_id: { type: String, required: true, index: true },
    check_key: { type: String, required: true },
    name: { type: String, required: true },
    kind: { type: String, enum: ['normal', 'boundary', 'missing_input', 'exception'], required: true },
    inputs: { type: Mixed, default: {} },
    expected: { type: Mixed, required: true },
    created_by: { type: String, enum: ['seed', 'user'], default: 'user' },
    seed_key: { type: String, default: null },
    last_run: { type: Mixed, default: null },
  },
  timestamps,
);
ruleTestSchema.index({ seed_key: 1 }, { unique: true, partialFilterExpression: { seed_key: { $type: 'string' } } });
toApiJson(ruleTestSchema);

const applicationSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    is_sample: { type: Boolean, default: false },
    sample_key: { type: String, default: null },
    inputs: { type: Mixed, default: {} },
    latest_check_id: { type: Schema.Types.Mixed, default: null },
  },
  timestamps,
);
applicationSchema.index({ sample_key: 1 }, { unique: true, partialFilterExpression: { sample_key: { $type: 'string' } } });
toApiJson(applicationSchema);

const complianceCheckSchema = new Schema(
  {
    check_run_id: { type: String, default: null, index: true },
    application_id: { type: Schema.Types.Mixed, default: null, index: true },
    run_at: { type: Date, required: true },
    engine_version: String,
    source_version: String,
    inputs: Mixed,
    rules_evaluated: Mixed,
    input_issues: Mixed,
    missing_inputs: Mixed,
    findings: Mixed,
    summary: Mixed,
    next_actions: Mixed,
    version: Mixed,
  },
  timestamps,
);
toApiJson(complianceCheckSchema);

const reviewEventSchema = new Schema(
  {
    application_id: { type: Schema.Types.Mixed, default: null, index: true },
    type: { type: String, enum: ['note', 'manual_decision', 'rule_verification'], required: true },
    rule_id: { type: String, default: null },
    finding_id: { type: String, default: null },
    decision: { type: String, enum: ['accept_finding', 'needs_revision', 'escalate', null], default: null },
    note: { type: String, maxlength: 1000, default: '' },
    reviewer_label: { type: String, maxlength: 60, required: true },
  },
  timestamps,
);
toApiJson(reviewEventSchema);

const questionLogSchema = new Schema(
  {
    question: { type: String, default: null }, // stored only when LOG_QUESTION_TEXT=true
    lang: String,
    status: String,
    evidence_rules: [String],
    ai_used: Boolean,
    latency_ms: Number,
    application_id: { type: Schema.Types.ObjectId, ref: 'Application', default: null },
  },
  timestamps,
);
toApiJson(questionLogSchema);

const evalRunSchema = new Schema(
  {
    run_at: { type: Date, required: true },
    total: Number,
    passed: Number,
    answer_key_complete: Boolean,
    items: Mixed,
  },
  timestamps,
);
toApiJson(evalRunSchema);

const lookupTimingSchema = new Schema(
  {
    case_label: { type: String, required: true, maxlength: 120 },
    mode: { type: String, enum: ['manual', 'assisted'], required: true },
    seconds: { type: Number, required: true, min: 0 },
    correct: { type: Boolean, default: null },
    tester_label: { type: String, required: true, maxlength: 60 },
  },
  timestamps,
);
toApiJson(lookupTimingSchema);

export const Rule = mongoose.model('Rule', ruleSchema, 'rules');
export const EncodedRule = mongoose.model('EncodedRule', encodedRuleSchema, 'encoded_rules');
export const RuleVersion = mongoose.model('RuleVersion', ruleVersionSchema, 'rule_versions');
export const RuleTest = mongoose.model('RuleTest', ruleTestSchema, 'rule_tests');
export const Application = mongoose.model('Application', applicationSchema, 'applications');
export const ComplianceCheck = mongoose.model('ComplianceCheck', complianceCheckSchema, 'compliance_checks');
export const ReviewEvent = mongoose.model('ReviewEvent', reviewEventSchema, 'review_events');
export const QuestionLog = mongoose.model('QuestionLog', questionLogSchema, 'question_logs');
export const EvalRun = mongoose.model('EvalRun', evalRunSchema, 'eval_runs');
export const LookupTiming = mongoose.model('LookupTiming', lookupTimingSchema, 'lookup_timings');

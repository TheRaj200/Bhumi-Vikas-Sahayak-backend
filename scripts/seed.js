import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config.js';
import { connectDb, disconnectDb } from '../src/db/connect.js';
import { Application, EncodedRule, Rule, RuleTest, RuleVersion } from '../src/models/index.js';
import { definitionHash, readEncodedRuleFiles, readRuleTestFile } from '../src/services/encodedRulesStore.js';
import { readRulesJsonl } from '../src/services/rulesStore.js';

// Idempotent seed (docs/RULE_COMPILER.md "Seed rule"):
// - rules: upsert all 106 records from the JSONL
// - encoded_rules: insert new; if definition changed → version+1, verification RESET, new rule_versions entry
// - rule_tests: upsert seed tests by seed_key; user-added tests are never touched
// - applications: insert sample cases once (user edits are kept)

const UNVERIFIED = { status: 'unverified', verified_by: null, verified_on: null, checked_pdf_pages: [], notes: '' };

async function seedRules() {
  const records = readRulesJsonl();
  await Rule.bulkWrite(
    records.map((r) => ({
      updateOne: {
        filter: { rule: String(r.rule) },
        update: {
          $set: {
            rule: String(r.rule),
            title: r.title,
            part: r.part,
            page_start: r.page_start,
            page_end: r.page_end,
            text: r.text,
            source_version: config.sourceVersion,
          },
        },
        upsert: true,
      },
    })),
  );
  return records.length;
}

async function seedEncodedRules() {
  const report = { created: [], changed: [], unchanged: [] };
  for (const def of readEncodedRuleFiles()) {
    const hash = definitionHash(def);
    const existing = await EncodedRule.findOne({ rule_id: def.rule_id });
    const meta = { rule_ref: def.rule_ref, parent_rule: def.parent_rule, title_en: def.title_en, title_hi: def.title_hi, topic: def.topic };

    if (!existing) {
      await EncodedRule.create({ rule_id: def.rule_id, ...meta, version: 1, definition_hash: hash, definition: def, verification: UNVERIFIED });
      await RuleVersion.create({ rule_id: def.rule_id, version: 1, definition_hash: hash, definition: def, source_version: def.source_version, change_note: 'Initial seed' });
      report.created.push(def.rule_id);
    } else if (existing.definition_hash !== hash) {
      const version = existing.version + 1;
      await EncodedRule.updateOne(
        { rule_id: def.rule_id },
        { $set: { ...meta, version, definition_hash: hash, definition: def, verification: UNVERIFIED, test_status: 'not_run', tests_passed: 0, last_tested_at: null } },
      );
      await RuleVersion.create({ rule_id: def.rule_id, version, definition_hash: hash, definition: def, source_version: def.source_version, change_note: 'Definition changed in file — verification reset' });
      report.changed.push(`${def.rule_id} (v${version}, verification reset)`);
    } else {
      report.unchanged.push(def.rule_id);
    }
  }
  return report;
}

async function seedRuleTests() {
  let upserted = 0;
  for (const def of readEncodedRuleFiles()) {
    let anyChanged = false;
    for (const t of readRuleTestFile(def.rule_id)) {
      const seed_key = `${def.rule_id}::${t.name}`;
      const existing = await RuleTest.findOne({ seed_key }).lean();
      const body = { rule_id: def.rule_id, check_key: t.check_key, name: t.name, kind: t.kind, inputs: t.inputs, expected: t.expected, created_by: 'seed', seed_key };
      const same = existing && JSON.stringify([existing.check_key, existing.kind, existing.inputs, existing.expected]) === JSON.stringify([t.check_key, t.kind, t.inputs, t.expected]);
      if (!same) {
        await RuleTest.updateOne({ seed_key }, { $set: { ...body, last_run: null } }, { upsert: true });
        anyChanged = true;
        upserted += 1;
      }
    }
    const tests_total = await RuleTest.countDocuments({ rule_id: def.rule_id });
    const update = { tests_total };
    if (anyChanged) Object.assign(update, { test_status: 'not_run', tests_passed: 0 });
    await EncodedRule.updateOne({ rule_id: def.rule_id }, { $set: update });
  }
  return upserted;
}

async function seedSampleApplications() {
  const samples = JSON.parse(fs.readFileSync(path.join(config.paths.dataDir, 'sample_applications.json'), 'utf8'));
  let inserted = 0;
  for (const s of samples) {
    const res = await Application.updateOne({ sample_key: s.sample_key }, { $setOnInsert: { ...s, is_sample: true } }, { upsert: true });
    if (res.upsertedCount) inserted += 1;
  }
  return { total: samples.length, inserted };
}

async function main() {
  if (!config.mongo.uri) {
    console.error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and add your Atlas connection string.');
    process.exit(1);
  }
  if (!(await connectDb())) process.exit(1);
  try {
    console.log(`rules: ${await seedRules()} upserted`);
    const enc = await seedEncodedRules();
    console.log(`encoded_rules: created ${enc.created.length}, changed ${enc.changed.length}, unchanged ${enc.unchanged.length}`);
    enc.changed.forEach((c) => console.log(`  changed: ${c}`));
    console.log(`rule_tests: ${await seedRuleTests()} upserted`);
    const apps = await seedSampleApplications();
    console.log(`applications: ${apps.inserted} new sample cases (${apps.total} total samples)`);
  } finally {
    await disconnectDb();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

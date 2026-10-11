import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const amendments = JSON.parse(fs.readFileSync(path.join(config.paths.dataDir, 'amendments.json'), 'utf8'));

function toWarning(a) {
  return {
    id: a.id,
    rule: a.rule,
    date: a.date,
    message_en: a.message_en,
    message_hi: a.message_hi,
    source_url: a.source_url,
    source_type: a.source_type,
    verified: a.verified,
  };
}

/** All known amendment warnings (for GET /api/meta). */
export function allAmendmentWarnings() {
  return amendments.map(toWarning);
}

export function amendmentTriggers() {
  return amendments.map((a) => ({ id: a.id, triggers: a.triggers }));
}

/** VersionInfo object from docs/API_CONTRACT.md, with the given warning ids attached. */
export function versionInfo(warningIds = []) {
  const ids = new Set(warningIds);
  return {
    rules_source: config.rulesSource,
    consolidated_to: config.sourceVersion,
    amendment_warnings: amendments.filter((a) => ids.has(a.id)).map(toWarning),
  };
}

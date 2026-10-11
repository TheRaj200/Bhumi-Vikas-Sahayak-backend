import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(backendRoot, '..');
const trackDir = process.env.DATA_DIR
  ? path.resolve(backendRoot, process.env.DATA_DIR)
  : path.join(projectRoot, 'bhopal-impact-lab-2026-problem-statements-main', 'track-1-bhumi-vikas-sahayak');

export const config = {
  port: Number(process.env.PORT) || 8000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  mongo: {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB || 'niyamsetu',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || '',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 30000,
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 1024,
  },

  logQuestionText: process.env.LOG_QUESTION_TEXT === 'true',

  contractVersion: '2.0',
  engineVersion: '1',
  sourceVersion: '2025-03-06',
  rulesSource: 'MP Bhumi Vikas Rules, 2012',

  paths: {
    backendRoot,
    trackDir,
    rulesJsonl: path.join(trackDir, 'data', 'bhumi_vikas_rules.jsonl'),
    rulesSampleJsonl: path.join(trackDir, 'data', 'bhumi_vikas_rules_sample.jsonl'),
    fulltextByPage: path.join(trackDir, 'data', 'bhumi_vikas_rules_fulltext_by_page.txt'),
    pdfEn: path.join(trackDir, 'resources', 'MP_Bhumi_Vikas_Rules_2012_upto_2025-03-06_EN.pdf'),
    pdfHi: path.join(trackDir, 'resources', 'MP_Bhumi_Vikas_Rules_2012_upto_2025-03-06_HI.pdf'),
    sampleQuestions: path.join(trackDir, 'resources', 'sample_questions.md'),
    encodedRulesDir: path.join(backendRoot, 'src', 'rules', 'encoded'),
    ruleTestsDir: path.join(backendRoot, 'src', 'rules', 'tests'),
    dataDir: path.join(backendRoot, 'src', 'data'),
    evalDir: path.join(backendRoot, 'eval'),
  },
};

export function isLlmConfigured() {
  return Boolean(config.anthropic.apiKey && config.anthropic.model);
}

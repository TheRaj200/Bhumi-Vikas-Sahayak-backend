import { createApp } from './app.js';
import { config, isLlmConfigured } from './config.js';
import { connectDb, isDbConnected } from './db/connect.js';
import { Rule } from './models/index.js';
import { loadEncodedRules } from './services/encodedRulesStore.js';
import { loadRules } from './services/rulesStore.js';

async function start() {
  await connectDb();

  const mongoDocs = isDbConnected() ? await Rule.find().lean() : [];
  const rules = loadRules({ mongoDocs });
  console.log(`[rules] ${rules.count} rules loaded from ${rules.source}`);

  const encoded = await loadEncodedRules();
  console.log(`[encoded-rules] ${encoded.count} loaded from ${encoded.source}`);

  if (!isLlmConfigured()) console.warn('[llm] ANTHROPIC_API_KEY / ANTHROPIC_MODEL not set — questions will return evidence_only.');

  createApp().listen(config.port, () => {
    console.log(`[server] Bhumi Vikas Sahayak API on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});

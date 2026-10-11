import Anthropic from '@anthropic-ai/sdk';
import { config, isLlmConfigured } from '../config.js';

// The ONLY file that talks to the LLM (Anthropic Claude). Everything else calls these functions.

export class LlmError extends Error {}

let client = null;

function getClient() {
  if (!isLlmConfigured()) throw new LlmError('LLM is not configured (ANTHROPIC_API_KEY / ANTHROPIC_MODEL).');
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropic.apiKey, timeout: config.anthropic.timeoutMs, maxRetries: 1 });
  }
  return client;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new LlmError('Model did not return JSON.');
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * Ask Claude for a JSON object. Temperature 0. Retries JSON parsing once.
 * @param {{ system: string, user: string, maxTokens?: number }} args
 * @returns {Promise<object>}
 */
export async function completeJson({ system, user, maxTokens = config.anthropic.maxTokens }) {
  const anthropic = getClient();
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await anthropic.messages.create({
        model: config.anthropic.model,
        max_tokens: maxTokens,
        temperature: 0,
        system,
        messages: [{ role: 'user', content: user }],
      });
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      return extractJson(text);
    } catch (err) {
      lastError = err;
      if (!(err instanceof SyntaxError) && !(err instanceof LlmError)) break;
    }
  }
  throw new LlmError(lastError?.message ?? 'LLM call failed.');
}

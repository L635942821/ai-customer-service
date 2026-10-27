import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * 模型 provider 配置。
 * 统一使用 OpenAI 兼容协议，一套代码同时支持：
 *  - Ollama 本地：baseURL = http://127.0.0.1:11434/v1
 *  - 任意 OpenAI 兼容云 API（通义 / DeepSeek / OpenAI 等）
 * 通过 server/.env 切换。
 */

const provider = process.env.PROVIDER ?? 'ollama';

const baseURL =
  process.env.BASE_URL ??
  (provider === 'openai'
    ? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
    : `${process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'}/v1`);

const apiKey =
  process.env.API_KEY ?? (provider === 'openai' ? process.env.OPENAI_API_KEY : undefined) ?? 'ollama';

const modelName =
  process.env.MODEL_NAME ??
  (provider === 'openai' ? process.env.OPENAI_MODEL ?? 'gpt-4o-mini' : 'qwen2.5:7b');

export const llm = createOpenAICompatible({
  name: provider,
  baseURL,
  apiKey,
});

export const chatModel = llm(modelName);

/** 该模型是否支持视觉（图片）输入。Ollama 的 qwen2.5 默认不支持，可用 qwen2.5-vl。 */
export const supportsVision = (process.env.SUPPORTS_VISION ?? 'false') === 'true';

export const modelInfo = { provider, modelName, supportsVision };

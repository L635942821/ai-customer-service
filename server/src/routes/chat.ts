import { Router, type Request, type Response } from 'express';
import { streamText, type CoreMessage } from 'ai';
import { chatModel, supportsVision, modelInfo } from '../config.js';
import { buildSystemPrompt } from '../prompts/system.js';
import { searchFaq } from '../knowledge/faq.js';

export const chatRouter = Router();

/** 客户端传入的消息格式（自定义，跨版本稳定）。 */
interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
  /** 图片 dataURL 列表（可选）。 */
  images?: string[];
  /** 文件提取出的文本（可选）。 */
  fileText?: string;
}

interface ChatRequestBody {
  messages: ClientMessage[];
  promptTemplateId?: string;
}

/** 把客户端消息转成 AI SDK 的 CoreMessage。 */
function toCoreMessages(messages: ClientMessage[]): CoreMessage[] {
  return messages.map((m) => {
    // 文件文本拼进用户消息
    let text = m.content;
    if (m.role === 'user' && m.fileText) {
      text = `${text}\n\n【用户上传文件内容】\n${m.fileText}`;
    }

    if (m.role === 'user' && supportsVision && m.images && m.images.length > 0) {
      // 视觉模型：以 parts 形式携带图片
      const parts: Array<
        | { type: 'text'; text: string }
        | { type: 'image'; image: string }
      > = [{ type: 'text', text }];
      for (const img of m.images) parts.push({ type: 'image', image: img });
      return { role: 'user' as const, content: parts };
    }

    // 非视觉模型：图片降级为占位说明，避免报错
    if (m.role === 'user' && m.images && m.images.length > 0) {
      text = `${text}\n\n（用户发送了 ${m.images.length} 张图片，当前模型不支持图片识别，请礼貌说明并引导用户用文字描述图片内容。）`;
    }
    return { role: m.role, content: text };
  });
}

chatRouter.post('/chat', async (req: Request, res: Response) => {
  const { messages, promptTemplateId } = req.body as ChatRequestBody;

  // SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (obj: unknown) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      send({ type: 'error', message: '消息不能为空' });
      res.end();
      return;
    }

    // 用最近一条用户消息做 FAQ 检索
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const faqContext = lastUser ? searchFaq(lastUser.content) : '';
    const system = buildSystemPrompt(promptTemplateId, faqContext);

    const result = streamText({
      model: chatModel,
      system,
      messages: toCoreMessages(messages),
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    // 使用 fullStream 以便显式捕获模型调用错误（textStream 会吞掉错误）
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        send({ type: 'delta', text: part.text });
      } else if (part.type === 'error') {
        const e = part.error;
        const msg =
          e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
        throw new Error(msg);
      }
    }
    send({ type: 'done' });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    console.error('[chat] error:', raw);
    // 把底层冗长的错误转成对用户友好的提示
    let friendly = raw;
    if (/ECONNREFUSED|fetch failed|ENOTFOUND|connect/i.test(raw)) {
      friendly =
        '无法连接到模型服务。请确认：① 使用 Ollama 时已启动并执行过 `ollama pull qwen2.5:7b`；② 或使用云 API 时在 server/.env 正确填写了 PROVIDER=openai 与 OPENAI_API_KEY。';
    } else if (/401|Unauthorized|invalid.?api.?key/i.test(raw)) {
      friendly = 'API Key 无效或未配置，请检查 server/.env 里的 OPENAI_API_KEY。';
    } else if (raw.length > 200) {
      friendly = raw.slice(0, 200) + '…';
    }
    send({ type: 'error', message: friendly });
  } finally {
    res.end();
  }
});

/** 供前端展示当前模型信息。 */
chatRouter.get('/model', (_req: Request, res: Response) => {
  res.json(modelInfo);
});

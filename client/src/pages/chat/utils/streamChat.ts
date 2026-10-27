import { chatStreamApi } from '../../../services/chat';
import type { ChatStreamHandlers, SendPayloadMessage } from '../../../services/types';
import type { Message } from '../types';

/**
 * 会话模块业务方法（与接口请求分离）：
 * 请求封装见 services/chat.ts，此处只做 payload 转换与 SSE 协议解析编排。
 */

/** 把内部 Message 转成后端需要的精简结构 */
export function toPayload(messages: Message[]): SendPayloadMessage[] {
  return messages
    .filter((m) => !m.error)
    .map((m) => {
      const images = (m.attachments ?? [])
        .filter((a) => a.kind === 'image' && a.dataUrl)
        .map((a) => a.dataUrl as string);
      const fileText = (m.attachments ?? [])
        .filter((a) => a.kind === 'text' && a.extractedText)
        .map((a) => `【${a.name}】\n${a.extractedText}`)
        .join('\n\n');
      const out: SendPayloadMessage = { role: m.role, content: m.content };
      if (images.length) out.images = images;
      if (fileText) out.fileText = fileText;
      return out;
    });
}

/**
 * 解析后端自定义 SSE 协议：
 *   data: {"type":"delta","text":"..."}
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"..."}
 */
async function readSse(res: Response, handlers: ChatStreamHandlers): Promise<void> {
  const body = res.body;
  if (!body) {
    handlers.onError('响应无数据流');
    return;
  }
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 按 SSE 事件分隔符 \n\n 切分
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const line = rawEvent.trim();
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        let evt: { type: string; text?: string; message?: string };
        try {
          evt = JSON.parse(jsonStr);
        } catch {
          continue;
        }
        if (evt.type === 'delta' && evt.text) {
          handlers.onDelta(evt.text);
        } else if (evt.type === 'done') {
          handlers.onDone();
          return;
        } else if (evt.type === 'error') {
          handlers.onError(evt.message ?? '未知错误');
          return;
        }
      }
    }
    handlers.onDone();
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    handlers.onError('流式读取中断');
  }
}

/** 业务方法：发起流式对话并驱动回调 */
export async function streamChat(
  messages: Message[],
  promptTemplateId: string,
  handlers: ChatStreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await chatStreamApi(
      { messages: toPayload(messages), promptTemplateId },
      signal,
    );
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    handlers.onError('无法连接后端服务，请确认 server 已启动');
    return;
  }

  if (!res.ok) {
    handlers.onError(`请求失败（HTTP ${res.status}）`);
    return;
  }
  await readSse(res, handlers);
}

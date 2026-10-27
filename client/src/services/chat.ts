import Requests from '../request';
import type { SendPayloadMessage } from './types';

/**
 * 会话模块接口请求。只放薄封装；SSE 仅发起 fetch 返回 Response，
 * 协议解析等业务方法见 pages/chat/utils/streamChat.ts。
 */

/** 提示词模板列表 */
export const getPromptsApi = <T>(): Promise<T[]> =>
  Requests.get<T[]>('/prompts', undefined, { silent: true }).then((res) =>
    res === false ? [] : (res.data ?? []),
  );

/** 流式对话：发起请求并返回原始 Response（SSE 解析在业务方法中） */
export const chatStreamApi = (
  body: { messages: SendPayloadMessage[]; promptTemplateId: string },
  signal: AbortSignal,
): Promise<Response> =>
  fetch(`${Requests.BaseUrl.dataService ?? ''}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

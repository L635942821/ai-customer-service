import { useCallback, useRef, useState } from 'react';
import type { Message, Attachment } from '../types';
import { streamChat } from '../utils/streamChat';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * 流式对话核心 hook —— 防卡顿方案：
 *  1. SSE delta 到达时只 push 进 bufferRef，不触发 React 渲染；
 *  2. 用单个 requestAnimationFrame 循环把缓冲区内容一次性 flush 到 state，
 *     将每秒几十次 setState 降为与浏览器刷新对齐的最多 60 次；
 *  3. 流式期间只更新最后一条 assistant 消息，历史消息配合 React.memo 不重渲染；
 *  4. AbortController 支持「停止生成」。
 */
export function useStreamChat(promptTemplateId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const bufferRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** RAF 循环：把缓冲区累积的文本合并写入最后一条 assistant 消息。 */
  const flush = useCallback(() => {
    rafRef.current = null;
    if (bufferRef.current.length === 0) return;
    const chunk = bufferRef.current.join('');
    bufferRef.current = [];
    const id = streamingIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
    );
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flush);
    }
  }, [flush]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // 把残余缓冲刷出并结束流式状态
    flush();
    const id = streamingIdRef.current;
    if (id) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)),
      );
    }
    streamingIdRef.current = null;
    setIsStreaming(false);
  }, [flush]);

  /** 发起一次流式请求（send / regenerate 共用） */
  const runStream = useCallback(
    (history: Message[], aiMsg: Message) => {
      streamingIdRef.current = aiMsg.id;
      bufferRef.current = [];
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      void streamChat(
        history,
        promptTemplateId,
        {
          onDelta: (t) => {
            bufferRef.current.push(t);
            scheduleFlush();
          },
          onDone: () => {
            if (rafRef.current != null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            flush();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsg.id
                  ? { ...m, streaming: false, content: m.content || '（无回复内容）' }
                  : m,
              ),
            );
            streamingIdRef.current = null;
            setIsStreaming(false);
          },
          onError: (message) => {
            if (rafRef.current != null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            flush();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsg.id ? { ...m, streaming: false, error: message } : m,
              ),
            );
            streamingIdRef.current = null;
            setIsStreaming(false);
          },
        },
        controller.signal,
      );
    },
    [promptTemplateId, scheduleFlush, flush],
  );

  const send = useCallback(
    (text: string, attachments: Attachment[]) => {
      if (isStreaming) return;
      const content = text.trim();
      if (!content && attachments.length === 0) return;

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content,
        createdAt: Date.now(),
        attachments: attachments.length ? attachments : undefined,
      };
      const aiMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        streaming: true,
      };

      const history = [...messages, userMsg];
      setMessages([...messages, userMsg, aiMsg]);
      runStream(history, aiMsg);
    },
    [isStreaming, messages, runStream],
  );

  /** 重新生成：截断该条 AI 回复及其后消息，基于其前最近的用户提问重发 */
  const regenerate = useCallback(
    (assistantMsgId: string) => {
      if (isStreaming) return;
      const idx = messages.findIndex((m) => m.id === assistantMsgId);
      if (idx < 0) return;
      let u = -1;
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          u = i;
          break;
        }
      }
      if (u < 0) return;
      const history = messages.slice(0, u + 1);
      const aiMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        streaming: true,
      };
      setMessages([...history, aiMsg]);
      runStream(history, aiMsg);
    },
    [isStreaming, messages, runStream],
  );

  const clear = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  /** 切换历史会话时载入消息（先中断当前流式） */
  const loadMessages = useCallback(
    (msgs: Message[]) => {
      stop();
      setMessages(msgs);
    },
    [stop],
  );

  return { messages, isStreaming, send, stop, clear, loadMessages, regenerate };
}

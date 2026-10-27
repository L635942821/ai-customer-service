import { useEffect, useRef, useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface Props {
  messages: Message[];
  isStreaming: boolean;
  onRegenerate?: (id: string) => void;
}

/**
 * 消息列表。
 * 防卡顿滚动：自动滚底合并进 requestAnimationFrame；
 * 用户手动上滚时暂停自动滚动并显示「回到底部」按钮。
 */
export function MessageList({ messages, isStreaming, onRegenerate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const stickToBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  // 内容变化时用 RAF 节流滚底（避免每个 token 都强制布局）
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      scrollToBottom();
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 60;
    stickToBottomRef.current = atBottom;
    setShowJump(!atBottom);
  };

  const jumpToBottom = () => {
    stickToBottomRef.current = true;
    setShowJump(false);
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto scroll-thin py-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-2xl">
              伟
            </div>
            <p className="text-sm">你好，我是小伟，有什么可以帮你的吗？</p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} onRegenerate={onRegenerate} />
          ))
        )}
      </div>

      {/* 上滚查看历史时出现：悬浮回到底部按钮（输入框始终固定底部，不随内容移动） */}
      {showJump && (
        <button
          onClick={jumpToBottom}
          className="jump-bottom absolute bottom-3 right-6 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-black/5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl transition-colors"
          title="回到底部"
        >
          <DownOutlined />
        </button>
      )}
    </div>
  );
}

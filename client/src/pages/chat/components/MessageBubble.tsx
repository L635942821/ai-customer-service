import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import copy from 'copy-to-clipboard';
import { message as antdMessage, Tooltip } from 'antd';
import {
  CopyOutlined,
  RedoOutlined,
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  SoundOutlined,
} from '@ant-design/icons';
import type { Message } from '../types';
import { AttachmentList } from './AttachmentPreview';

const ASSISTANT_NAME = '小伟';

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'assistant') {
    return (
      <div className="w-9 h-9 shrink-0 rounded-md bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
        伟
      </div>
    );
  }
  return (
    <div className="w-9 h-9 shrink-0 rounded-md bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-sm font-medium">
      我
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-5">
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
    </span>
  );
}

/** 回复操作栏小图标按钮（antd 图标 + antd Tooltip 提示） */
function IconBtn({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip title={title} placement="top">
      <button
        onClick={onClick}
        className={`w-8 h-8 rounded-md flex items-center justify-center text-[15px] transition-colors ${
          active ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'
        }`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

interface Props {
  message: Message;
  onRegenerate?: (id: string) => void;
}

/**
 * 单条消息气泡。使用 React.memo，流式期间历史消息 props 不变即不重渲染，
 * 仅最后一条 assistant 气泡因 content 变化而更新。
 * AI 回复完成后展示操作栏：复制 / 重新生成 / 喜欢 / 不喜欢 / 朗读。
 */
function MessageBubbleBase({ message, onRegenerate }: Props) {
  const isUser = message.role === 'user';
  const showTyping = message.streaming && message.content.length === 0;
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  // 组件卸载（切换/删除会话）时停止朗读
  useEffect(() => {
    return () => {
      if (speakingRef.current && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    copy(message.content);
    antdMessage.success('已复制到剪贴板');
  };

  /** 朗读：Web Speech API（免费离线）；再点一次停止 */
  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      antdMessage.warning('当前浏览器不支持朗读');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // 去掉 markdown 符号，朗读更自然
    const plain = message.content
      .replace(/```[\s\S]*?```/g, ' 代码块略 ')
      .replace(/[#>*`_|\\-]/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = 'zh-CN';
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const showActions = !isUser && !message.streaming && !message.error && !!message.content;

  return (
    <div className={`flex gap-2 px-4 py-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar role={message.role} />
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <span className="text-xs text-gray-400 mb-0.5 ml-1">{ASSISTANT_NAME}</span>
        )}
        <div className="flex flex-wrap gap-2 mb-1">
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentList attachments={message.attachments} />
          )}
        </div>
        {(message.content || showTyping || message.error) && (
          <div
            className={`relative px-3 py-2 rounded-lg break-words text-[15px] leading-relaxed ${
              isUser
                ? 'bg-wechat-green text-black rounded-tr-none'
                : message.error
                  ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none'
                  : 'bg-white text-black rounded-tl-none'
            }`}
          >
            {showTyping ? (
              <TypingDots />
            ) : message.error ? (
              <span className="whitespace-pre-wrap">{message.error}</span>
            ) : isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <div className="md-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {/* AI 回复操作栏：复制 / 重新生成 / 喜欢 / 不喜欢 / 朗读 */}
        {showActions && (
          <div className="flex items-center gap-1 mt-1 -ml-1">
            <IconBtn title="复制" onClick={handleCopy}>
              <CopyOutlined />
            </IconBtn>
            <IconBtn title="重新生成" onClick={() => onRegenerate?.(message.id)}>
              <RedoOutlined />
            </IconBtn>
            <IconBtn
              title={liked ? '取消喜欢' : '喜欢'}
              active={liked}
              onClick={() => {
                setLiked((v) => !v);
                if (!liked) setDisliked(false);
              }}
            >
              {liked ? <LikeFilled /> : <LikeOutlined />}
            </IconBtn>
            <IconBtn
              title={disliked ? '取消不喜欢' : '不喜欢'}
              active={disliked}
              onClick={() => {
                setDisliked((v) => !v);
                if (!disliked) setLiked(false);
              }}
            >
              {disliked ? <DislikeFilled /> : <DislikeOutlined />}
            </IconBtn>
            <IconBtn title={speaking ? '停止朗读' : '朗读'} active={speaking} onClick={toggleSpeak}>
              <SoundOutlined />
            </IconBtn>
          </div>
        )}
        <div className={`flex items-center gap-2 mt-0.5 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] text-gray-400 ml-1">
            {formatTime(message.createdAt)}
          </span>
          {!isUser && !message.streaming && !message.error && (
            <span className="text-[11px] text-gray-300">内容由 AI 生成，仅供参考</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleBase);

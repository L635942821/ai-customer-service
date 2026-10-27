import { useRef, useState, useEffect } from 'react';
import { Dropdown, Button, Tooltip, type MenuProps } from 'antd';
import {
  PlusOutlined,
  ArrowUpOutlined,
  PictureOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { Attachment } from '../types';
import { EmojiPanel } from './EmojiPanel';
import { AttachmentList } from './AttachmentPreview';
import { addRecentEmoji } from '../data/emoji';
import { uploadFileApi } from '../../../services/global';

interface Props {
  placeholder: string;
  isStreaming: boolean;
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  /** 'bottom' 聊天底部 | 'landing' 落地页居中 */
  variant?: 'bottom' | 'landing';
  draft?: string;
  draftNonce?: number;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export function InputBar({
  placeholder,
  isStreaming,
  onSend,
  onStop,
  variant = 'bottom',
  draft,
  draftNonce,
}: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);

  // 外部草稿填入（点击提示词时）
  useEffect(() => {
    if (draftNonce !== undefined && draft !== undefined) {
      setText(draft);
      textareaRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftNonce]);

  // 自适应高度
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [text]);

  // 点击外部关闭表情面板
  useEffect(() => {
    if (!showEmoji) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      // 点击触发按钮或面板内部不关闭，其余区域关闭
      if (emojiWrapRef.current?.contains(t)) return;
      if (emojiPanelRef.current?.contains(t)) return;
      setShowEmoji(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    addRecentEmoji(emoji);
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? text.length;
      const end = ta.selectionEnd ?? text.length;
      setText(text.slice(0, start) + emoji + text.slice(end));
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + emoji.length;
      });
    } else {
      setText((t) => t + emoji);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`「${file.name}」超过 10MB，已跳过`);
        continue;
      }
      if (file.type.startsWith('image/')) {
        const dataUrl = await readAsDataURL(file);
        added.push({
          id: uid(),
          kind: 'image',
          name: file.name,
          size: file.size,
          previewUrl: URL.createObjectURL(file),
          dataUrl,
        });
      } else {
        const form = new FormData();
        form.append('file', file);
        try {
          const res = await uploadFileApi(form);
          if (res === false) {
            added.push({ id: uid(), kind: 'file', name: file.name, size: file.size });
          } else {
            const data = res.data ?? {};
            added.push({
              id: uid(),
              kind: data.kind === 'text' ? 'text' : 'file',
              name: data.name ?? file.name,
              size: data.size ?? file.size,
              extractedText: data.extractedText,
            });
          }
        } catch {
          added.push({ id: uid(), kind: 'file', name: file.name, size: file.size });
        }
      }
    }
    setAttachments((prev) => [...prev, ...added]);
    setUploading(false);
    if (imgInputRef.current) imgInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    if (isStreaming) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText('');
    setAttachments([]);
    setShowEmoji(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ➕ 上传菜单（antd Dropdown）
  const uploadMenu: MenuProps = {
    items: [
      { key: 'image', icon: <PictureOutlined />, label: '上传图片' },
      { key: 'file', icon: <FileTextOutlined />, label: '上传文件' },
      { type: 'divider' },
      { key: 'limit', label: '单个文件不超过 10MB', disabled: true },
    ],
    onClick: (info) => {
      if (info.key === 'image') imgInputRef.current?.click();
      if (info.key === 'file') docInputRef.current?.click();
    },
  };

  const inner = (
    <>
      {attachments.length > 0 && (
        <div className="px-3 pt-2">
          <AttachmentList attachments={attachments} onRemove={removeAttachment} />
        </div>
      )}

      {/* 占位符 / 文本靠左上 */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={variant === 'landing' ? 2 : 1}
        placeholder={placeholder}
        className="block w-full resize-none bg-transparent border-none outline-none px-4 pt-3 pb-1 text-[15px] leading-relaxed text-left scroll-thin placeholder:text-gray-400"
      />

      {/* 底部控件行：左 表情/上传，右 发送/停止 */}
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-1">
          <div className="relative" ref={emojiWrapRef}>
            <Tooltip title="插入表情" placement="top">
              <Button
                type="text"
                className="!text-gray-500 hover:!text-gray-700"
                icon={<span className="text-lg leading-none">😊</span>}
                onClick={() => setShowEmoji((s) => !s)}
              />
            </Tooltip>
          </div>

          <Dropdown menu={uploadMenu} trigger={['click']} placement="topLeft">
            <Tooltip title="上传图片 / 文件（≤10MB）" placement="top">
              <Button
                type="text"
                className="!text-gray-500 hover:!text-gray-700"
                icon={uploading ? <LoadingOutlined /> : <PlusOutlined />}
              />
            </Tooltip>
          </Dropdown>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Tooltip title="停止生成" placement="top">
              <Button
                shape="circle"
                className="!bg-[#191919] !border-[#191919] hover:!bg-black"
                icon={<span className="block w-2.5 h-2.5 rounded-[2px] bg-white" />}
                onClick={onStop}
              />
            </Tooltip>
          ) : (
            <Tooltip title="发送（Enter）" placement="top">
              <Button
                shape="circle"
                type="primary"
                className="!bg-[#191919] !border-[#191919] hover:!bg-black disabled:!bg-gray-300 disabled:!border-gray-300"
                icon={<ArrowUpOutlined />}
                disabled={!text.trim() && attachments.length === 0}
                onClick={handleSend}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {variant === 'bottom' && (
        <div className="text-[11px] text-gray-400 px-4 pb-2">
          Enter 发送 · Shift+Enter 换行 · 点击 ➕ 上传图片或文件
        </div>
      )}

      <input
        ref={imgInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={docInputRef}
        type="file"
        multiple
        accept=".txt,.md,.json,.csv,.log,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </>
  );

  // 落地页：百炼式转圈流光边框；对话底部：白素卡片（无流光）
  // 表情面板作为卡片的兄弟节点悬浮在上方，避免被 glow-wrap 的 overflow:hidden 裁剪
  const emojiPortal = showEmoji && (
    <div ref={emojiPanelRef} className="absolute bottom-full left-2 mb-2 z-50">
      <EmojiPanel onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
    </div>
  );

  if (variant === 'landing') {
    return (
      <div className="relative w-full">
        {emojiPortal}
        <div className="glow-wrap">
          <div className="glow-inner">{inner}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative shrink-0 px-3 pb-3 pt-1">
      {emojiPortal}
      <div className="chat-input-card">{inner}</div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Input, Modal, message } from 'antd';
import type { ChatSession, Message, PromptTemplate } from './types';
import { LOCAL_PROMPTS, PLACEHOLDERS, SUGGESTIONS } from './data/prompts';
import { getHealthApi, getModelApi } from '../../services/global';
import { getPromptsApi } from '../../services/chat';
import { useStreamChat } from './hooks/useStreamChat';
import {
  loadSessions,
  persistSessions,
  removeSession,
  uid,
  upsertSession,
} from './store/history';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { InputBar } from './components/InputBar';
import { WelcomeHero } from './components/WelcomeHero';
import { PromptBar } from './components/PromptBar';

export default function ChatPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(LOCAL_PROMPTS);
  const [activeId, setActiveId] = useState('cs');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 桌面端侧栏收起/展开
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [model, setModel] = useState({ provider: '-', modelName: '-', supportsVision: false });
  const [connected, setConnected] = useState<boolean | null>(null);
  // 落地页输入框草稿（供建议/提示词点击填入）
  const [draft, setDraft] = useState('');
  const [draftNonce, setDraftNonce] = useState(0);
  // 历史会话
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // 已落盘的消息引用，避免保存 effect 死循环
  const savedRef = useRef<Message[] | null>(null);

  const { messages, isStreaming, send, stop, clear, loadMessages, regenerate } =
    useStreamChat(activeId);

  useEffect(() => {
    (async () => {
      try {
        const health = await getHealthApi();
        setConnected(health !== false);
      } catch {
        setConnected(false);
      }
      const info = await getModelApi();
      if (info) setModel(info);
      const p = await getPromptsApi<PromptTemplate>();
      if (p && p.length) setPrompts(p);
    })();
  }, []);

  /** 流式结束 / 消息变化后自动保存为历史会话（localStorage） */
  useEffect(() => {
    if (isStreaming) return;
    if (savedRef.current === messages) return;
    savedRef.current = messages;
    if (messages.length === 0) return;

    const id = currentSessionId ?? uid();
    const existing = sessions.find((s) => s.id === id);
    const autoTitle = (messages.find((m) => m.role === 'user')?.content || '新对话')
      .replace(/\s+/g, ' ')
      .slice(0, 24);
    const session: ChatSession = {
      id,
      title: existing?.titleEdited ? existing.title : autoTitle,
      titleEdited: existing?.titleEdited,
      templateId: activeId,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      messages,
    };
    const next = upsertSession(sessions, session);
    setSessions(next);
    persistSessions(next);
    if (!currentSessionId) setCurrentSessionId(id);
  }, [messages, isStreaming, sessions, currentSessionId, activeId]);

  /** 点击提示词：仅填入输入框（不自动发送），由用户点发送按钮/Enter 发送 */
  const fillPrompt = (text: string) => {
    setDraft(text);
    setDraftNonce((n) => n + 1);
  };

  /** 切换提示词模板：重放入场动画 + 引导提示 */
  const handleSelectTemplate = (id: string) => {
    setActiveId(id);
    const tpl = prompts.find((p) => p.id === id);
    if (tpl) message.success(`已切换角色：${tpl.emoji} ${tpl.name}`);
  };

  /** 开启新对话 */
  const startNewSession = () => {
    stop();
    clear();
    setCurrentSessionId(null);
    setSidebarOpen(false);
  };

  /** 切换历史会话 */
  const switchSession = (id: string) => {
    if (id === currentSessionId) {
      setSidebarOpen(false);
      return;
    }
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    stop();
    setActiveId(s.templateId);
    setCurrentSessionId(id);
    savedRef.current = s.messages; // 载入不算修改，不触发重复落盘
    loadMessages(s.messages);
    setSidebarOpen(false);
  };

  /** 删除历史会话（二次确认） */
  const deleteSession = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    Modal.confirm({
      title: '删除对话',
      content: `确定删除「${s?.title ?? ''}」吗？删除后不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const next = removeSession(sessions, id);
        setSessions(next);
        persistSessions(next);
        if (id === currentSessionId) startNewSession();
        message.success('已删除');
      },
    });
  };

  /** 批量删除历史会话（二次确认），onDone 在确认删除后回调（用于退出多选模式） */
  const deleteSessions = (ids: string[], onDone?: () => void) => {
    if (ids.length === 0) return;
    Modal.confirm({
      title: '批量删除对话',
      content: `确定删除选中的 ${ids.length} 个对话吗？删除后不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const next = sessions.filter((s) => !ids.includes(s.id));
        setSessions(next);
        persistSessions(next);
        if (currentSessionId && ids.includes(currentSessionId)) startNewSession();
        message.success(`已删除 ${ids.length} 个对话`);
        onDone?.();
      },
    });
  };

  /** 重命名历史会话 */
  const openRename = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setRenameValue(s.title);
    setRenameTarget(s);
  };
  const confirmRename = () => {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) {
      message.warning('名称不能为空');
      return;
    }
    const next = sessions.map((s) =>
      s.id === renameTarget.id ? { ...s, title, titleEdited: true } : s,
    );
    setSessions(next);
    persistSessions(next);
    setRenameTarget(null);
    message.success('重命名成功');
  };

  const placeholder = PLACEHOLDERS[activeId] ?? '请输入你的问题…';
  const isLanding = messages.length === 0;

  return (
    <div className="h-full flex bg-wechat-bg overflow-hidden">
      <Sidebar
        prompts={prompts}
        activeId={activeId}
        onSelect={handleSelectTemplate}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewSession={startNewSession}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
        onDeleteSessions={deleteSessions}
        onRenameSession={openRename}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <main className="flex-1 flex flex-col min-w-0 max-w-4xl mx-auto bg-wechat-bg md:border-x md:border-black/5">
        {/* <ChatHeader
          modelName={model.modelName}
          provider={model.provider}
          supportsVision={model.supportsVision}
          connected={connected}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        /> */}

        {isLanding ? (
          // 落地页：标题在上 → 流光输入框居中 → 建议在下
          <div
            key={activeId}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4 pb-10"
          >
            <WelcomeHero />
            <div className="w-full max-w-3xl hero-in hero-in-delay-1">
              <InputBar
                variant="landing"
                placeholder={placeholder}
                isStreaming={isStreaming}
                onSend={send}
                onStop={stop}
                draft={draft}
                draftNonce={draftNonce}
              />
            </div>
            <div className="hero-in hero-in-delay-2 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => fillPrompt(s.text)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-black/5 text-sm text-gray-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // 聊天页：消息列表 + 提示词横条 + 底部输入框
          <>
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              onRegenerate={regenerate}
            />
            <PromptBar onPick={fillPrompt} disabled={isStreaming} />
            <InputBar
              variant="bottom"
              placeholder={placeholder}
              isStreaming={isStreaming}
              onSend={send}
              onStop={stop}
              draft={draft}
              draftNonce={draftNonce}
            />
          </>
        )}
      </main>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名对话"
        open={!!renameTarget}
        onOk={confirmRename}
        onCancel={() => setRenameTarget(null)}
        okText="保存"
        cancelText="取消"
      >
        <Input
          value={renameValue}
          maxLength={30}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={confirmRename}
          placeholder="输入新的对话名称"
        />
      </Modal>
    </div>
  );
}

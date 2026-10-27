import type { ChatSession, Message } from '../types';

/**
 * 历史会话存储（localStorage）。
 * - 会话在流式结束 / 消息变化时自动落盘；
 * - 图片 dataURL / objectURL 刷新后即失效且体积大，落盘时只保留元信息；
 * - 侧栏按时间线分组：今天 / 7 天内 / 30 天内 / 更早按月份。
 */

const KEY = 'xiaowei.chat.sessions.v1';

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as ChatSession[]) : [];
  } catch {
    return [];
  }
}

/** 落盘前清洗：去掉流式标记与图片大字段，文本附件截断防超容量 */
function sanitizeMessages(messages: Message[]): Message[] {
  return messages.map((m) => ({
    ...m,
    streaming: false,
    attachments: m.attachments?.map((a) =>
      a.kind === 'image'
        ? { id: a.id, kind: a.kind, name: a.name, size: a.size }
        : { ...a, extractedText: a.extractedText?.slice(0, 20000) },
    ),
  }));
}

function write(list: ChatSession[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** 持久化；容量溢出时降级为去掉全部附件再试一次 */
export function persistSessions(list: ChatSession[]): void {
  const clean = list.map((s) => ({ ...s, messages: sanitizeMessages(s.messages) }));
  if (write(clean)) return;
  const slim = clean.map((s) => ({
    ...s,
    messages: s.messages.map((m) => ({ ...m, attachments: undefined })),
  }));
  if (write(slim)) return;
  console.warn('[history] localStorage 写入失败，本次历史未保存');
}

/** 新增或更新会话，保持列表按更新时间倒序 */
export function upsertSession(list: ChatSession[], session: ChatSession): ChatSession[] {
  const next = list.filter((s) => s.id !== session.id);
  return [session, ...next];
}

export function removeSession(list: ChatSession[], id: string): ChatSession[] {
  return list.filter((s) => s.id !== id);
}

export interface SessionGroup {
  label: string;
  sessions: ChatSession[];
}

/** 时间线分组：今天 / 7 天内 / 30 天内 / YYYY-MM */
export function groupByTimeline(sessions: ChatSession[]): SessionGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const DAY = 86400000;
  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  const groups: SessionGroup[] = [];
  const indexOf = (label: string) => groups.findIndex((g) => g.label === label);

  for (const s of sorted) {
    const t = s.updatedAt;
    let label: string;
    if (t >= startOfToday) label = '今天';
    else if (t >= startOfToday - 7 * DAY) label = '7 天内';
    else if (t >= startOfToday - 30 * DAY) label = '30 天内';
    else {
      const d = new Date(t);
      label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    let i = indexOf(label);
    if (i === -1) {
      groups.push({ label, sessions: [] });
      i = groups.length - 1;
    }
    groups[i].sessions.push(s);
  }
  return groups;
}

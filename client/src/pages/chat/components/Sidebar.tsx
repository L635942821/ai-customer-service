import { useState } from 'react';
import { Dropdown, Tooltip, type MenuProps } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  LeftOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { ChatSession, PromptTemplate } from '../types';
import { groupByTimeline } from '../store/history';

/** 品牌 Logo：仿阿里百炼的渐变立方体（内联 SVG，无外部资源依赖） */
function BrandLogo() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 shrink-0" aria-label="品牌标识">
      <defs>
        <linearGradient id="bl-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="bl-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="bl-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <path d="M16 2.5 L28.5 9.5 L16 16.5 L3.5 9.5 Z" fill="url(#bl-top)" />
      <path d="M3.5 9.5 L16 16.5 L16 29.5 L3.5 22.5 Z" fill="url(#bl-left)" />
      <path d="M28.5 9.5 L16 16.5 L16 29.5 L28.5 22.5 Z" fill="url(#bl-right)" />
    </svg>
  );
}

/** 多选入口图标：清单勾选字形（仿 DeepSeek 参考图，antd 无同款故内联 SVG） */
function MultiSelectIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="4" height="4" rx="1" />
      <line x1="9" y1="5" x2="14" y2="5" />
      <rect x="2" y="9" width="4" height="4" rx="1" />
      <line x1="9" y1="11" x2="14" y2="11" />
    </svg>
  );
}

interface Props {
  prompts: PromptTemplate[];
  activeId: string;
  onSelect: (id: string) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewSession: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onDeleteSessions: (ids: string[], onDone?: () => void) => void;
  onRenameSession: (id: string) => void;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** 左侧栏：新会话 + 历史对话（时间线分组、可删除/重命名）+ 提示词模板。移动端为抽屉。 */
export function Sidebar({
  prompts,
  activeId,
  onSelect,
  sessions,
  currentSessionId,
  onNewSession,
  onSwitchSession,
  onDeleteSession,
  onDeleteSessions,
  onRenameSession,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: Props) {
  const groups = groupByTimeline(sessions);
  // 多选删除模式
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const enterSelectMode = () => {
    setSelectMode(true);
    setSelected([]);
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected([]);
  };
  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const handleBatchDelete = () => onDeleteSessions(selected, exitSelectMode);

  return (
    <>
      {/* 移动端遮罩 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      <div className="relative shrink-0 flex">
      <aside
        className={`z-30 w-64 shrink-0 bg-wechat-sidebar border-r border-black/10 overflow-hidden
          fixed md:static inset-y-0 left-0 transition-all duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-[60px]' : 'md:w-64'}`}
      >
        {collapsed ? (
          /* 收起态：60px 图标栏（Logo + 新对话图标） */
          <div className="w-[60px] h-full flex flex-col items-center gap-2 pt-3">
            <BrandLogo />
            <Tooltip title="开启新对话" placement="right">
              <button
                onClick={onNewSession}
                className="mt-2 w-9 h-9 rounded-lg bg-white border border-black/10 text-gray-600 hover:text-blue-500 hover:border-blue-200 flex items-center justify-center transition-colors"
              >
                <PlusOutlined />
              </button>
            </Tooltip>

            <div className="w-8 border-t border-black/10 my-1" />

            {/* 提示词模板图标：保留 emoji，点击切换，Tooltip 提示 */}
            <div className="flex-1 min-h-0 overflow-y-auto scroll-thin w-full flex flex-col items-center gap-1 pb-2">
              {prompts.map((p) => (
                <Tooltip key={p.id} title={`${p.emoji} ${p.name}（点击切换）`} placement="right">
                  <button
                    onClick={() => onSelect(p.id)}
                    className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg transition-colors ${
                      p.id === activeId ? 'bg-white shadow-sm ring-1 ring-black/10' : 'hover:bg-black/5'
                    }`}
                  >
                    <span>{p.emoji}</span>
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        ) : (
        <div className="w-64 h-full flex flex-col">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-black/5">
          <BrandLogo />
          <span className="font-semibold text-gray-700">对话助手</span>
        </div>

        {!selectMode && (
        <div className="p-3">
          <Tooltip title="开启新对话" placement="right">
            <button
              onClick={onNewSession}
              className="w-full py-2 rounded-lg bg-white border border-black/10 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"
            >
              <PlusOutlined /> 开启新对话
            </button>
          </Tooltip>
        </div>
        )}

        {/* 历史对话：时间线分组 / 多选模式头部 */}
        {selectMode ? (
          <div className="h-12 flex items-center justify-between px-4">
            <span className="text-sm font-medium text-gray-700">已选择 {selected.length} 个对话</span>
            <Tooltip title="退出多选" placement="top">
              <button
                onClick={exitSelectMode}
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-gray-500 hover:bg-black/10"
              >
                <CloseOutlined />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="px-4 pb-1 text-xs text-gray-400 flex items-center justify-between">
            <span>对话历史</span>
            <span className="flex items-center gap-2">
              {sessions.length > 0 && <span>{sessions.length} 条</span>}
              {sessions.length > 0 && (
                <Tooltip title="多选删除" placement="top">
                  <button
                    onClick={enterSelectMode}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <MultiSelectIcon />
                  </button>
                </Tooltip>
              )}
            </span>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-2 pb-2">
          {groups.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-400 leading-relaxed">
              暂无历史记录。
              <br />
              发送消息后自动保存在本机，按时间线分组。
            </div>
          )}
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 pt-2 pb-1 text-xs text-gray-400">{g.label}</div>
              {g.sessions.map((s) => {
                const active = s.id === currentSessionId;
                const menu: MenuProps = {
                  items: [
                    { key: 'rename', icon: <EditOutlined />, label: '重命名' },
                    { type: 'divider' },
                    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                  ],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation();
                    if (key === 'rename') onRenameSession(s.id);
                    if (key === 'delete') onDeleteSession(s.id);
                  },
                };
                return (
                  <div
                    key={s.id}
                    onClick={() => (selectMode ? toggleSelect(s.id) : onSwitchSession(s.id))}
                    title={s.title}
                    className={`group w-full flex items-center gap-1 px-3 py-2.5 rounded-lg mb-0.5 cursor-pointer transition-colors ${
                      selectMode && selected.includes(s.id)
                        ? 'bg-blue-50 text-gray-800'
                        : active
                          ? 'bg-blue-100/80 text-blue-600'
                          : 'hover:bg-black/5 text-gray-700'
                    }`}
                  >
                    {selectMode && (
                      <span
                        className={`w-[18px] h-[18px] shrink-0 rounded-full flex items-center justify-center text-[11px] text-white transition-colors ${
                          selected.includes(s.id) ? 'bg-blue-500' : 'bg-white border border-gray-300'
                        }`}
                      >
                        {selected.includes(s.id) && <CheckOutlined />}
                      </span>
                    )}
                    <span className="flex-1 text-sm truncate">{s.title}</span>
                    {!selectMode && (
                    <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/10 ${
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <MoreOutlined />
                      </button>
                    </Dropdown>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {selectMode ? (
          <div className="p-3 border-t border-black/5 flex items-center justify-center">
            <button
              onClick={handleBatchDelete}
              disabled={selected.length === 0}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              <DeleteOutlined /> 删除{selected.length > 0 ? `(${selected.length})` : ''}
            </button>
          </div>
        ) : (
        <>
        {/* 提示词模板 */}
        <div className="px-4 pb-1 pt-2 text-xs text-gray-400 border-t border-black/5">
          提示词模板
        </div>
        <nav className="max-h-[220px] overflow-y-auto scroll-thin px-2 pb-2">
          {prompts.map((p) => {
            const active = p.id === activeId;
            return (
              <Tooltip
                key={p.id}
                title={`${p.desc}（点击切换并重播开场动画）`}
                placement="right"
              >
                <button
                  onClick={() => {
                    onSelect(p.id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-start gap-2 transition-colors ${
                    active ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5">{p.emoji}</span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm ${active ? 'text-green-600 font-medium' : 'text-gray-700'}`}
                    >
                      {p.name}
                    </span>
                    <span className="block text-xs text-gray-400 truncate">{p.desc}</span>
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </nav>

        <div className="p-3 border-t border-black/5 text-[11px] text-gray-400 leading-relaxed">
          提示：历史记录保存在本浏览器；模板作为会话角色设定发送，命中 FAQ 时自动注入知识库减少幻觉。
        </div>
        </>
        )}
        </div>
        )}
      </aside>

      {/* 桌面端收起/展开把手：贴侧栏右缘垂直居中的悬浮胶囊（antd 图标 + Tooltip） */}
      <Tooltip title={collapsed ? '展开侧栏' : '收起侧栏'} placement="right">
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 z-40
            w-6 h-14 rounded-full bg-white border border-black/10
            shadow-[0_2px_8px_rgba(0,0,0,0.12)] items-center justify-center text-[12px] text-gray-500
            hover:text-blue-500 hover:shadow-[0_4px_14px_rgba(0,0,0,0.16)] hover:scale-110
            active:scale-95 transition-all duration-200"
        >
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </Tooltip>
      </div>
    </>
  );
}

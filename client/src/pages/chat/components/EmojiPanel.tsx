import { useState } from 'react';
import { EMOJI_CATEGORIES, getRecentEmojis } from '../data/emoji';

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/** 微信式表情面板：分类 tab + 最近使用。 */
export function EmojiPanel({ onSelect, onClose }: Props) {
  const recent = getRecentEmojis();
  const tabs = recent.length
    ? [{ id: 'recent', name: '最近', icon: '🕘', emojis: recent }, ...EMOJI_CATEGORIES]
    : EMOJI_CATEGORIES;
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    /* 定位交由父级包裹层控制（避免被输入框 overflow:hidden 裁剪），此处只负责外观 */
    <div className="w-[340px] max-w-[92vw] bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-xs text-gray-400">选择表情</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          ✕
        </button>
      </div>
      <div className="h-52 overflow-y-auto scroll-thin p-2 grid grid-cols-8 gap-1">
        {current.emojis.map((e, i) => (
          <button
            key={`${e}-${i}`}
            onClick={() => onSelect(e)}
            className="w-9 h-9 flex items-center justify-center text-2xl rounded-lg hover:bg-gray-100"
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-black/5 bg-[#FAFAFA] overflow-x-auto scroll-thin">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 w-9 h-8 flex items-center justify-center text-lg rounded-md ${
              activeTab === t.id ? 'bg-white shadow-sm' : 'hover:bg-black/5'
            }`}
            title={t.name}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

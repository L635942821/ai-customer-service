import { Tooltip } from 'antd';
import { PROMPT_SHORTCUTS } from '../data/prompts';

interface Props {
  onPick: (text: string) => void;
  disabled?: boolean;
}

/** 对话区快捷提示词横条：点击填入输入框并立即生成对话。 */
export function PromptBar({ onPick, disabled }: Props) {
  return (
    <div className="shrink-0 px-3 pt-2">
      <div className="flex gap-2 overflow-x-auto scroll-thin pb-2">
        {PROMPT_SHORTCUTS.map((p) => (
          <Tooltip key={p.label} title={`点击发送：${p.text}`} placement="top">
            <button
              disabled={disabled}
              onClick={() => onPick(p.text)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5 text-[13px] text-gray-600 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

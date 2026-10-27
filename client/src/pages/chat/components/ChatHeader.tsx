interface Props {
  modelName: string;
  provider: string;
  supportsVision: boolean;
  connected: boolean | null;
  onToggleSidebar: () => void;
}

/** 顶部栏：客服名称「小伟」、在线状态、当前模型信息。 */
export function ChatHeader({
  modelName,
  provider,
  supportsVision,
  connected,
  onToggleSidebar,
}: Props) {
  return (
    <header className="h-14 shrink-0 bg-[#F7F7F7] border-b border-black/10 flex items-center px-4 gap-3">
      <button
        onClick={onToggleSidebar}
        className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500"
        title="菜单"
      >
        ☰
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm">
          伟
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-medium leading-tight truncate">小伟 · AI 智能客服</div>
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected === false ? 'bg-red-400' : 'bg-green-500'
              }`}
            />
            {connected === null
              ? '连接中…'
              : connected
                ? '在线'
                : '未连接后端'}
            <span className="text-gray-300">|</span>
            <span className="truncate">
              {provider}/{modelName}
              {supportsVision ? ' · 支持图片' : ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

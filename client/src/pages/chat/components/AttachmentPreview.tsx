import { useState } from 'react';
import type { Attachment } from '../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconOf(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['doc', 'docx'].includes(ext)) return '📄';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['pdf'].includes(ext)) return '📕';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  if (['txt', 'md', 'log', 'json'].includes(ext)) return '📃';
  return '📎';
}

/** 单个附件展示：图片缩略图（点击放大）或文件卡片。 */
export function AttachmentView({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove?: () => void;
}) {
  const [zoom, setZoom] = useState(false);

  if (attachment.kind === 'image' && attachment.previewUrl) {
    return (
      <>
        <div className="relative inline-block">
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            className="max-w-[160px] max-h-[160px] rounded-lg cursor-zoom-in object-cover border border-black/5"
            onClick={() => setZoom(true)}
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
        {zoom && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
            onClick={() => setZoom(false)}
          >
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="max-w-full max-h-full rounded-lg"
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-black/5 min-w-[180px]">
      <span className="text-2xl">{iconOf(attachment.name)}</span>
      <div className="min-w-0">
        <div className="text-sm truncate max-w-[150px]">{attachment.name}</div>
        <div className="text-xs text-gray-400">{formatSize(attachment.size)}</div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/** 附件列表。 */
export function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
}) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((a) => (
        <AttachmentView
          key={a.id}
          attachment={a}
          onRemove={onRemove ? () => onRemove(a.id) : undefined}
        />
      ))}
    </div>
  );
}

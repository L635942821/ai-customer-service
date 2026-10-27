export type Role = 'user' | 'assistant';

export type AttachmentKind = 'image' | 'text' | 'file';

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  size: number;
  /** 图片本地预览地址（objectURL 或 dataURL） */
  previewUrl?: string;
  /** 发送给后端的图片 dataURL */
  dataUrl?: string;
  /** 文本文件提取出的内容 */
  extractedText?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  attachments?: Attachment[];
  /** 该条消息是否处于流式生成中 */
  streaming?: boolean;
  /** 出错信息 */
  error?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  system: string;
}

/** 历史会话（localStorage 持久化，侧栏按时间线分组展示） */
export interface ChatSession {
  id: string;
  title: string;
  /** 用户手动重命名过（之后不再被首问自动覆盖） */
  titleEdited?: boolean;
  templateId: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

/**
 * 接口 DTO / 回调契约定义。
 * 与请求封装（services 下各模块文件）、业务方法（各页面模块的 utils）分离，单独成文件。
 */

/** 模型信息 */
export interface ModelInfo {
  provider: string;
  modelName: string;
  supportsVision: boolean;
}

/** 上传结果 */
export interface UploadResult {
  kind?: string;
  name?: string;
  size?: number;
  extractedText?: string;
}

/** 后端精简消息结构 */
export interface SendPayloadMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  fileText?: string;
}

/** SSE 流式回调契约 */
export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

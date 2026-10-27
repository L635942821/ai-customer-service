/** 统一响应信封：低层把 fetch 结果归一化为此结构，上层据此判定成功/失败 */
export interface RespVO<T = any> {
  /** 业务码（本项目=HTTP 状态码） */
  code: number;
  message?: string;
  data?: T;
  resCode?: number;
}

/** 请求选项：标准 RequestInit + 业务扩展 */
export interface IOptions extends RequestInit {
  /** 静默：失败不弹 antd message 提示（用于 health / model 等探测类请求） */
  silent?: boolean;
}

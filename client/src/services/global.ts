import Requests from '../request';
import type { ModelInfo, UploadResult } from './types';

/**
 * 公共（跨模块）接口请求。只放薄封装，不含业务解析逻辑。
 */

/** 健康检查（探测类，静默不弹错） */
export const getHealthApi = () => Requests.get('/health', undefined, { silent: true });

/** 当前模型信息（用于头部展示） */
export const getModelApi = (): Promise<ModelInfo | null> =>
  Requests.get<ModelInfo>('/model', undefined, { silent: true }).then((res) =>
    res === false ? null : (res.data ?? null),
  );

/** 上传附件（FormData，静默） */
export const uploadFileApi = (formData: FormData) =>
  Requests.post<UploadResult>('/upload', formData, { silent: true });

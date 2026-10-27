import { message } from 'antd';
import { ResponseCode } from './constants';
import type { IOptions, RespVO } from './types';
import { Requests as http } from './http';

/**
 * 业务请求单例（对齐参考封装的分层设计）：
 * - init(baseUrl, mode) 注入基地址与运行模式；
 * - checkedRequest 统一响应码判定 + 统一 antd message 报错 + 网络异常兜底；
 * - get / post / put / patch / delete 收敛 HTTP verb。
 * 与参考的差异：后端为裸 JSON + HTTP 状态码，故由 http.ts 归一化为 RespVO 后再判定；
 * 并新增 silent 选项，供探测类请求失败时不打扰用户。
 */
class RequestClass {
  private baseUrl: Record<string, string> = {};
  private mode = '';

  public init(url: Record<string, string> | string, mode = '') {
    this.baseUrl = typeof url === 'string' ? { dataService: url } : url;
    this.mode = mode;
  }

  public get BaseUrl() {
    return this.baseUrl;
  }

  /** 当前是否模拟环境 */
  public get Mode() {
    return this.mode === 'mock';
  }

  private async checkedRequest<T>(
    promise: Promise<RespVO<T>>,
    silent?: boolean,
  ): Promise<RespVO<T> | false> {
    try {
      const result = await promise;
      if (
        result.code === ResponseCode.SUCCESS ||
        result.code === ResponseCode.SUCCESS200 ||
        result.code === ResponseCode.SUCCESS201
      ) {
        return result;
      }
      if (result.code === ResponseCode.USER_NOT_LOGIN) {
        if (!silent) message.error('登录已失效，请重新登录');
        return false;
      }
      if (!silent) message.error(result.message ?? '请求出现错误，请稍后重试');
      return false;
    } catch (error) {
      if (!silent) message.error('网络异常，请稍后重试');
      return Promise.reject(error);
    }
  }

  private resolve(path: string, outputUrl?: string): string {
    const base = outputUrl ? this.baseUrl[outputUrl] : this.baseUrl.dataService;
    return `${base ?? ''}${path}`;
  }

  public async get<T>(
    path: string,
    params?: object,
    options?: IOptions,
    outputUrl?: string,
  ): Promise<RespVO<T> | false> {
    return this.checkedRequest<T>(
      http.get<T>(this.resolve(path, outputUrl), params, options),
      options?.silent,
    );
  }

  public async post<T>(
    path: string,
    body?: object | FormData,
    options?: IOptions,
    outputUrl?: string,
  ): Promise<RespVO<T> | false> {
    return this.checkedRequest<T>(
      http.post<T>(this.resolve(path, outputUrl), body, options),
      options?.silent,
    );
  }

  public async put<T>(
    path: string,
    body?: object,
    options?: IOptions,
    outputUrl?: string,
  ): Promise<RespVO<T> | false> {
    return this.checkedRequest<T>(
      http.put<T>(this.resolve(path, outputUrl), body, options),
      options?.silent,
    );
  }

  public async patch<T>(
    path: string,
    body?: object,
    options?: IOptions,
    outputUrl?: string,
  ): Promise<RespVO<T> | false> {
    return this.checkedRequest<T>(
      http.patch<T>(this.resolve(path, outputUrl), body, options),
      options?.silent,
    );
  }

  public async delete<T>(
    path: string,
    params?: object,
    options?: IOptions,
    outputUrl?: string,
  ): Promise<RespVO<T> | false> {
    return this.checkedRequest<T>(
      http.delete<T>(this.resolve(path, outputUrl), params, options),
      options?.silent,
    );
  }
}

const Requests = new RequestClass();

export default Requests;
export { Requests, ResponseCode };
export type { RespVO, IOptions };

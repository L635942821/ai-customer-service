import type { IOptions, RespVO } from './types';

/**
 * 低层 fetch 封装：只负责发请求 + 把响应归一化为 RespVO，
 * 不做业务码判定（判定在 index.ts 的 checkedRequest）。
 */

/** 拼接 query 参数 */
function buildUrl(url: string, params?: object): string {
  if (!params) return url;
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  if (!qs) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
}

/** 归一化：code=HTTP 状态码，data=响应体（JSON 解析失败则回退原文） */
async function normalize<T>(res: Response): Promise<RespVO<T>> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  if (res.ok) return { code: res.status, data: data as T, message: 'ok' };
  const body = data as { error?: string; message?: string } | null;
  const message = body?.error ?? body?.message ?? res.statusText ?? '请求失败';
  return { code: res.status, data: data as T, message };
}

/** 剥离业务扩展字段（silent），其余透传给 fetch */
function splitOptions(options?: IOptions) {
  const { silent, ...rest } = options ?? {};
  return { silent, rest };
}

export const Requests = {
  async get<T>(url: string, params?: object, options?: IOptions): Promise<RespVO<T>> {
    const { rest } = splitOptions(options);
    const res = await fetch(buildUrl(url, params), { method: 'GET', ...rest });
    return normalize<T>(res);
  },

  async post<T>(
    url: string,
    body?: object | FormData,
    options?: IOptions,
  ): Promise<RespVO<T>> {
    const { rest } = splitOptions(options);
    const isForm = body instanceof FormData;
    const res = await fetch(url, {
      method: 'POST',
      headers: isForm ? undefined : { 'Content-Type': 'application/json' },
      body: isForm ? (body as FormData) : JSON.stringify(body ?? {}),
      ...rest,
    });
    return normalize<T>(res);
  },

  async put<T>(url: string, body?: object, options?: IOptions): Promise<RespVO<T>> {
    const { rest } = splitOptions(options);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      ...rest,
    });
    return normalize<T>(res);
  },

  async patch<T>(url: string, body?: object, options?: IOptions): Promise<RespVO<T>> {
    const { rest } = splitOptions(options);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      ...rest,
    });
    return normalize<T>(res);
  },

  async delete<T>(url: string, params?: object, options?: IOptions): Promise<RespVO<T>> {
    const { rest } = splitOptions(options);
    const res = await fetch(buildUrl(url, params), { method: 'DELETE', ...rest });
    return normalize<T>(res);
  },
};

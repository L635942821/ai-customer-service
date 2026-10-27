/**
 * 响应码常量。
 * 本项目后端以 HTTP 状态码作为业务码（低层 http.ts 归一化），
 * 此处对齐参考封装的成功 / 失败语义。
 */
export enum ResponseCode {
  SUCCESS = 0,
  SUCCESS200 = 200,
  SUCCESS201 = 201,
  USER_NOT_LOGIN = 401,
  USER_UNAUTHORIZED = 403,
}

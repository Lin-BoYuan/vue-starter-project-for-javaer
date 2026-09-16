/**
 * 📖 配套教程：docs/03-typescript-for-java.md、docs/09-http.md
 * 与后端约定的"信封"结构：所有接口统一返回这个格式。
 *
 * ☕ Java 视角：等价于后端的统一响应体 Result<T> / R<T>：
 *   public class ApiResponse<T> { int code; String message; T data; }
 * 泛型 <T> 的写法和含义与 Java 完全一致。
 */
export interface ApiResponse<T = unknown> {
  /** 0 表示成功，401 未登录，其他为业务错误码 */
  code: number
  message: string
  data: T
}

/** 分页查询的公共参数 */
export interface PageQuery {
  /** 页码，从 1 开始 */
  page: number
  /** 每页条数 */
  pageSize: number
}

/** 分页响应的公共结构 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 登录表单参数 */
export interface LoginParams {
  username: string
  password: string
}

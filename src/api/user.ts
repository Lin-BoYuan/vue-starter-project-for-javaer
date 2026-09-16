/**
 * 📖 配套教程：docs/09-http.md
 * 用户与认证相关的 API：每个函数 ≈ 后端的一个 Controller 接口调用。
 *
 * ☕ Java 视角：这个文件相当于一个 FeignClient 接口——
 *   声明"调哪个接口、传什么参数、返回什么类型"，具体 HTTP 细节由 http.ts 统一处理。
 */
import type { LoginParams, PageQuery, PageResult } from '@/types/api'
import type { LoginResult, UserAccount, UserForm } from '@/types/models'
import { request } from './http'

/** 用户列表的查询条件：分页 + 搜索关键词 + 状态筛选（'' 表示全部） */
export type UserPageQuery = PageQuery & {
  keyword?: string
  status?: 0 | 1 | ''
}

/** 登录：POST /api/auth/login */
export function login(params: LoginParams): Promise<LoginResult> {
  return request<LoginResult>({ url: '/auth/login', method: 'post', data: params })
}

/** 退出登录：POST /api/auth/logout */
export function logout(): Promise<null> {
  return request<null>({ url: '/auth/logout', method: 'post' })
}

/** 获取当前登录用户信息：GET /api/auth/profile */
export function getProfile(): Promise<UserAccount> {
  return request<UserAccount>({ url: '/auth/profile', method: 'get' })
}

/** 修改当前用户资料：PUT /api/auth/profile（newPassword 有值表示改密码） */
export function updateProfile(data: {
  nickname: string
  email: string
  newPassword?: string
}): Promise<UserAccount> {
  return request<UserAccount>({ url: '/auth/profile', method: 'put', data })
}

/** 分页查询用户：GET /api/users?page=1&pageSize=10&keyword=xx */
export function getUserPage(query: UserPageQuery): Promise<PageResult<UserAccount>> {
  return request<PageResult<UserAccount>>({ url: '/users', method: 'get', params: query })
}

/** 新增用户：POST /api/users */
export function createUser(data: UserForm): Promise<UserAccount> {
  return request<UserAccount>({ url: '/users', method: 'post', data })
}

/** 修改用户：PUT /api/users/3 —— RESTful 风格：PUT + 路径参数 */
export function updateUser(id: number, data: Partial<UserForm>): Promise<UserAccount> {
  return request<UserAccount>({ url: `/users/${id}`, method: 'put', data })
}

/** 删除用户：DELETE /api/users/3 */
export function deleteUser(id: number): Promise<null> {
  return request<null>({ url: `/users/${id}`, method: 'delete' })
}

/**
 * 重置演示数据（教学辅助）：恢复 mock 数据库的种子数据。
 * 只在 mock 模式下有意义；对接真实后端后这个接口不存在，别在生产代码里调用它。
 */
export function resetMockData(): Promise<null> {
  return request<null>({ url: '/mock/reset', method: 'post' })
}

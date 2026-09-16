/**
 * 📖 配套教程：docs/09-http.md
 * 模拟后端的"Controller 层"：根据 请求方法 + 路径 路由到对应的处理函数。
 *
 * ☕ Java 视角：下面的 routes 表就是一张手写的 @GetMapping/@PostMapping 路由表：
 *   { method: 'GET',  pattern: /^\/users$/ } ≈ @GetMapping("/users")
 *   m[1] ≈ @PathVariable Long id
 * 真实项目里这些逻辑全部在 Spring Boot 里，前端 mock 只是为了本地自测。
 */
import type { ApiResponse, PageResult } from '@/types/api'
import type {
  Article,
  ArticleForm,
  DashboardStats,
  LoginResult,
  UserAccount,
  UserForm,
} from '@/types/models'
import { db, flushDb, resetMockDb } from './data'

/** 业务错误：抛出后由 dispatch 统一转成错误信封（≈ 后端抛 BusinessException 走全局异常处理器） */
export class MockError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message)
  }
}

/** mock 收到的"HTTP 请求"（由 adapter 从 axios 配置里拼装而来） */
export interface MockRequest {
  method: string
  /** 去掉 baseURL 后的路径，如 /users/3 */
  path: string
  /** URL 查询参数（?page=1&keyword=x），值统一转成了字符串 */
  query: Record<string, string>
  /** 请求体（POST/PUT 的 JSON），GET 请求为 null */
  body: unknown
  /** 请求头里的 Authorization: Bearer xxx */
  token: string | null
}

type MockHandler = (req: MockRequest, params: string[]) => unknown

interface MockRoute {
  method: string
  pattern: RegExp
  handler: MockHandler
  /** true = 需要登录才能访问（≈ 接口上的 @PreAuthorize） */
  auth?: boolean
}

/* ==================== 工具函数 ==================== */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requireString(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MockError(400, `参数 ${key} 不能为空`)
  }
  return value.trim()
}

function requireId(params: string[], name = 'id'): number {
  const id = Number(params[0])
  if (!Number.isInteger(id) || id <= 0) {
    throw new MockError(400, `非法的 ${name}`)
  }
  return id
}

function pageParams(req: MockRequest): { page: number; pageSize: number } {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
  return { page, pageSize }
}

/** 模拟网络延迟：让 loading 状态、骨架屏有"存在感" */
function latency(): Promise<void> {
  return sleep(200 + Math.floor(Math.random() * 400))
}

/* ==================== 认证接口 ==================== */

/** 统一演示密码：任何种子用户 + 123456 都能登录（仅 mock，真实系统密码必须加密存储在后端） */
const DEMO_PASSWORD = '123456'

function handleLogin(req: MockRequest): LoginResult {
  const body = (req.body ?? {}) as Record<string, unknown>
  const username = requireString(body, 'username')
  const password = requireString(body, 'password')

  const user = db.users.find((u) => u.username === username)
  if (!user || password !== DEMO_PASSWORD) {
    throw new MockError(400, '用户名或密码错误（演示密码：123456）')
  }
  if (user.status === 0) {
    throw new MockError(403, '该账号已被禁用')
  }

  const token = `mock-token-${user.id}-${Date.now()}`
  db.sessions[token] = user.id
  flushDb()
  // 返回给前端前剔除敏感字段的概念演示（这里没存密码，真实系统要注意）
  return { token, user: { ...user } }
}

function currentUser(req: MockRequest): UserAccount {
  const userId = req.token ? db.sessions[req.token] : undefined
  const user = userId !== undefined ? db.users.find((u) => u.id === userId) : undefined
  if (!user) throw new MockError(401, '登录已过期，请重新登录')
  return user
}

function handleProfile(req: MockRequest): UserAccount {
  return { ...currentUser(req) }
}

function handleUpdateProfile(req: MockRequest): UserAccount {
  const user = currentUser(req)
  const body = (req.body ?? {}) as Record<string, unknown>
  if (typeof body.nickname === 'string' && body.nickname.trim() !== '') {
    user.nickname = body.nickname.trim()
  }
  if (typeof body.email === 'string' && body.email.includes('@')) {
    user.email = body.email.trim()
  }
  // 改密码成功后要把该用户的所有会话作废（安全惯例：改密码后强制重新登录）
  if (typeof body.newPassword === 'string' && body.newPassword !== '') {
    delete db.sessions[req.token ?? '']
  }
  flushDb()
  return { ...user }
}

function handleLogout(req: MockRequest): null {
  if (req.token) delete db.sessions[req.token]
  flushDb()
  return null
}

/* ==================== 用户管理接口 ==================== */

function listUsers(req: MockRequest): PageResult<UserAccount> {
  const { page, pageSize } = pageParams(req)
  const keyword = req.query.keyword?.trim() ?? ''
  const status = req.query.status ?? ''

  let list = [...db.users] // 浅拷贝，避免排序/过滤影响原数据
  if (keyword) {
    list = list.filter((u) => u.username.includes(keyword) || u.nickname.includes(keyword))
  }
  if (status === '0' || status === '1') {
    list = list.filter((u) => u.status === Number(status))
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) // 新用户在前

  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total, page, pageSize }
}

function createUser(req: MockRequest): UserAccount {
  const body = (req.body ?? {}) as Record<string, unknown>
  const username = requireString(body, 'username')
  if (db.users.some((u) => u.username === username)) {
    throw new MockError(400, '用户名已存在')
  }
  const form = body as unknown as UserForm
  const user: UserAccount = {
    id: db.nextUserId++,
    username,
    nickname: form.nickname || username,
    email: form.email || '',
    role: form.role === 'admin' ? 'admin' : 'editor',
    status: form.status === 0 ? 0 : 1,
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  flushDb()
  return { ...user }
}

function updateUser(req: MockRequest, params: string[]): UserAccount {
  const id = requireId(params)
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new MockError(404, '用户不存在')
  const form = (req.body ?? {}) as Partial<UserForm>
  Object.assign(user, form)
  flushDb()
  return { ...user }
}

function deleteUser(req: MockRequest, params: string[]): null {
  const id = requireId(params)
  const index = db.users.findIndex((u) => u.id === id)
  if (index === -1) throw new MockError(404, '用户不存在')
  if (db.users[index]?.username === 'admin') {
    throw new MockError(400, '内置管理员账号不允许删除')
  }
  db.users.splice(index, 1)
  flushDb()
  return null
}

/* ==================== 文章接口 ==================== */

function listArticles(req: MockRequest): PageResult<Article> {
  const { page, pageSize } = pageParams(req)
  const keyword = req.query.keyword?.trim() ?? ''
  const category = req.query.category ?? ''
  const status = req.query.status ?? ''

  let list = [...db.articles]
  if (keyword) list = list.filter((a) => a.title.includes(keyword))
  if (category) list = list.filter((a) => a.category === category)
  if (status === 'draft' || status === 'published') {
    list = list.filter((a) => a.status === status)
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total, page, pageSize }
}

function getArticle(req: MockRequest, params: string[]): Article {
  const id = requireId(params)
  const article = db.articles.find((a) => a.id === id)
  if (!article) throw new MockError(404, '文章不存在')
  article.views += 1 // 每次进详情页阅读量 +1，细节感拉满
  flushDb()
  return { ...article }
}

function createArticle(req: MockRequest): Article {
  const form = (req.body ?? {}) as Partial<ArticleForm>
  if (!form.title || form.title.trim() === '') {
    throw new MockError(400, '文章标题不能为空')
  }
  const article: Article = {
    id: db.nextArticleId++,
    title: form.title.trim(),
    summary: form.summary ?? '',
    content: form.content ?? '',
    category: form.category || '随笔',
    status: form.status === 'published' ? 'published' : 'draft',
    views: 0,
    createdAt: new Date().toISOString(),
  }
  db.articles.push(article)
  flushDb()
  return { ...article }
}

function updateArticle(req: MockRequest, params: string[]): Article {
  const id = requireId(params)
  const article = db.articles.find((a) => a.id === id)
  if (!article) throw new MockError(404, '文章不存在')
  const form = (req.body ?? {}) as Partial<ArticleForm>
  Object.assign(article, form)
  flushDb()
  return { ...article }
}

function deleteArticle(req: MockRequest, params: string[]): null {
  const id = requireId(params)
  const index = db.articles.findIndex((a) => a.id === id)
  if (index === -1) throw new MockError(404, '文章不存在')
  db.articles.splice(index, 1)
  flushDb()
  return null
}

/* ==================== 仪表盘接口 ==================== */

function getDashboardStats(): DashboardStats {
  const now = new Date()
  // 计算最近 6 个月每月的发文量（数组方法 map/filter/reduce 的实战示范）
  const monthlyArticles = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const count = db.articles.filter((a) => a.createdAt.startsWith(month)).length
    return { month, count }
  })

  const recentArticles = [...db.articles]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return {
    totalUsers: db.users.length,
    totalArticles: db.articles.length,
    totalViews: db.articles.reduce((sum, a) => sum + a.views, 0),
    todayLogins: Object.keys(db.sessions).length,
    monthlyArticles,
    recentArticles,
  }
}

/* ==================== 路由表与分发 ==================== */

const routes: MockRoute[] = [
  { method: 'POST', pattern: /^\/auth\/login$/, handler: handleLogin },
  { method: 'POST', pattern: /^\/auth\/logout$/, handler: handleLogout, auth: true },
  { method: 'GET', pattern: /^\/auth\/profile$/, handler: handleProfile, auth: true },
  { method: 'PUT', pattern: /^\/auth\/profile$/, handler: handleUpdateProfile, auth: true },
  { method: 'POST', pattern: /^\/mock\/reset$/, handler: () => resetMockDb(), auth: true },

  { method: 'GET', pattern: /^\/dashboard\/stats$/, handler: getDashboardStats, auth: true },

  { method: 'GET', pattern: /^\/users$/, handler: listUsers, auth: true },
  { method: 'POST', pattern: /^\/users$/, handler: createUser, auth: true },
  { method: 'PUT', pattern: /^\/users\/(\d+)$/, handler: updateUser, auth: true },
  { method: 'DELETE', pattern: /^\/users\/(\d+)$/, handler: deleteUser, auth: true },

  { method: 'GET', pattern: /^\/articles$/, handler: listArticles, auth: true },
  { method: 'POST', pattern: /^\/articles$/, handler: createArticle, auth: true },
  { method: 'GET', pattern: /^\/articles\/(\d+)$/, handler: getArticle, auth: true },
  { method: 'PUT', pattern: /^\/articles\/(\d+)$/, handler: updateArticle, auth: true },
  { method: 'DELETE', pattern: /^\/articles\/(\d+)$/, handler: deleteArticle, auth: true },
]

/**
 * 模拟后端总入口：匹配路由 → 鉴权 → 执行 handler → 统一包成响应信封。
 * 对应真实后端的 DispatcherServlet + 拦截器 + Controller + 全局异常处理。
 */
export async function dispatch(req: MockRequest): Promise<ApiResponse> {
  await latency() // 模拟网络延迟

  for (const route of routes) {
    if (route.method !== req.method) continue
    const match = req.path.match(route.pattern)
    if (!match) continue

    if (route.auth && !req.token) {
      return { code: 401, message: '未登录或登录已过期', data: null }
    }
    try {
      const data = route.handler(req, match.slice(1))
      return { code: 0, message: 'ok', data }
    } catch (error) {
      if (error instanceof MockError) {
        return { code: error.code, message: error.message, data: null }
      }
      return { code: 500, message: 'mock 服务器内部错误', data: null }
    }
  }

  return { code: 404, message: `mock 接口不存在：${req.method} ${req.path}`, data: null }
}

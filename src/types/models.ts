/**
 * 📖 配套教程：docs/03-typescript-for-java.md
 * 业务模型定义：前端世界里"实体类"的对应物。
 *
 * ☕ Java 视角：interface ≈ Java 的实体类（DTO/POJO），
 *   区别：TS 的 interface 只在编译期存在，运行时会被完全擦除，
 *   不像 Java 反射还能拿到 class 信息。
 */

/** 角色：字面量联合类型，效果 ≈ Java 的 enum Role { ADMIN, EDITOR } */
export type UserRole = 'admin' | 'editor'

/** 账号状态：1 启用，0 禁用 */
export type UserStatus = 0 | 1

/** 用户账号（管理后台里的"用户"） */
export interface UserAccount {
  id: number
  username: string
  nickname: string
  email: string
  role: UserRole
  status: UserStatus
  /** 创建时间，ISO 8601 格式字符串，如 2026-09-01T10:00:00.000Z */
  createdAt: string
}

/** 新增/编辑用户时前端提交的表单（id、createdAt 由后端生成，不用传） */
export type UserForm = Omit<UserAccount, 'id' | 'createdAt'>
// ↑ Omit 是 TS 工具类型 ≈ "从 UserAccount 里剔除 id 和 createdAt 两个成员"，类似 Java 里手写一个 Form DTO

/** 文章状态：草稿 / 已发布 */
export type ArticleStatus = 'draft' | 'published'

/** 文章 */
export interface Article {
  id: number
  title: string
  /** 摘要（列表页展示） */
  summary: string
  /** 正文（详情/编辑页展示） */
  content: string
  /** 分类 */
  category: string
  status: ArticleStatus
  /** 阅读量 */
  views: number
  createdAt: string
}

/** 新增/编辑文章的表单 */
export type ArticleForm = Omit<Article, 'id' | 'views' | 'createdAt'>

/** 登录成功后的返回：令牌 + 当前用户信息 */
export interface LoginResult {
  token: string
  user: UserAccount
}

/** 仪表盘统计数据 */
export interface DashboardStats {
  totalUsers: number
  totalArticles: number
  totalViews: number
  todayLogins: number
  /** 最近 6 个月每月发文量（仪表盘的柱状图数据） */
  monthlyArticles: { month: string; count: number }[]
  /** 最新 5 篇文章 */
  recentArticles: Article[]
}

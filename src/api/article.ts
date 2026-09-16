/**
 * 📖 配套教程：docs/09-http.md
 * 文章相关 API。注意和 user.ts 的对称性——一套 CRUD 就长这样，
 * ☕ Java 视角：相当于 ArticleController 的前端镜像。
 */
import type { PageQuery, PageResult } from '@/types/api'
import type { Article, ArticleForm } from '@/types/models'
import { request } from './http'

/** 文章列表查询条件 */
export type ArticlePageQuery = PageQuery & {
  keyword?: string
  category?: string
  status?: 'draft' | 'published' | ''
}

/** 分页查询文章 */
export function getArticlePage(query: ArticlePageQuery): Promise<PageResult<Article>> {
  return request<PageResult<Article>>({ url: '/articles', method: 'get', params: query })
}

/** 根据 id 查文章详情：GET /api/articles/3（mock 里每次调用阅读量 +1） */
export function getArticleById(id: number): Promise<Article> {
  return request<Article>({ url: `/articles/${id}`, method: 'get' })
}

/** 新增文章 */
export function createArticle(data: ArticleForm): Promise<Article> {
  return request<Article>({ url: '/articles', method: 'post', data })
}

/** 修改文章 */
export function updateArticle(id: number, data: ArticleForm): Promise<Article> {
  return request<Article>({ url: `/articles/${id}`, method: 'put', data })
}

/** 删除文章 */
export function deleteArticle(id: number): Promise<null> {
  return request<null>({ url: `/articles/${id}`, method: 'delete' })
}

/**
 * 📖 配套教程：docs/09-http.md
 * axios 自定义适配器：把 axios 的请求"劫持"到本地 mock，根本不发真实 HTTP 请求。
 *
 * ☕ Java 视角：相当于给 OkHttp 换了一个"假 Call.Factory"，
 *   或者更贴切地——把 RestTemplate 换成一个直接调用本地 Service 的实现。
 *   上层代码（api/ 目录）完全无感知：切真实后端时只要去掉这个 adapter。
 *
 * axios 的请求流程：请求拦截器 → 转换请求体 → 【adapter 发请求】 → 转换响应体 → 响应拦截器
 * 我们替换的正是中间加粗的 adapter 环节。
 */
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { dispatch } from './server'

/**
 * 从 axios 配置里拼出 mock 需要的请求信息。
 * 注意：自定义 adapter 拿到的 url 还是相对路径，要自己拼 baseURL；
 * params 也还是对象（axios 默认 adapter 才会把它拼成 ?a=1&b=2 的查询串）。
 */
async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const baseURL = typeof config.baseURL === 'string' ? config.baseURL : ''
  const url = typeof config.url === 'string' ? config.url : ''
  let path = `${baseURL}${url}`

  // 去掉 "/api" 前缀：mock 路由表里写的是 /users 而不是 /api/users
  if (path.startsWith('/api')) path = path.slice(4)

  // 把 params 对象统一转成 Record<string, string>，方便 mock 处理
  const query: Record<string, string> = {}
  const params = config.params as Record<string, unknown> | undefined
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = String(value)
      }
    }
  }

  // config.data 在请求拦截器之后已经是 JSON 字符串了，要 parse 回对象
  let body: unknown = null
  if (typeof config.data === 'string' && config.data !== '') {
    try {
      body = JSON.parse(config.data)
    } catch {
      body = config.data
    }
  } else if (config.data) {
    body = config.data
  }

  // 解析 Authorization: Bearer xxx
  const authHeader = config.headers?.Authorization
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

  // 调用模拟后端（内部自带网络延迟）
  const data = await dispatch({ method: (config.method ?? 'get').toUpperCase(), path, query, body, token })

  // HTTP 状态码恒为 200，业务成败由信封里的 code 决定（很多国内后端团队就这么约定的）
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
  }
}

export default mockAdapter as AxiosAdapter

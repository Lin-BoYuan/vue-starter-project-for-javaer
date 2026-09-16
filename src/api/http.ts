/**
 * 📖 配套教程：docs/09-http.md（本章主角）
 * axios 统一封装：创建实例、请求拦截器、响应拦截器、统一错误处理。
 *
 * ☕ Java 视角：把 axios 实例想象成你封装过的 OkHttp/RestTemplate 客户端——
 *   请求拦截器 ≈ 统一加 token 的 ClientHttpRequestInterceptor
 *   响应拦截器 ≈ 统一解析响应体、处理 401 的 ResponseErrorHandler
 * 全项目的页面只跟这个封装打交道，以后换库（fetch/原生实现）只改这一个文件。
 */
import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import { getStorage, removeStorage } from '@/utils/storage'
import mockAdapter from '@/mock/adapter'

/** token 在 localStorage 里的 key（登录后写入，见 stores/user.ts） */
export const TOKEN_KEY = 'token'

/** 是否启用本地 mock：读 .env 里的 VITE_USE_MOCK，默认开启 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/** 业务错误：拦截器把所有失败统一转成这个类型，页面 catch 到的都是它 */
export class ApiError extends Error {
  constructor(
    /** 后端业务错误码（0 成功 / 401 未登录 / 400 参数错误 / 404 / 500 ...） */
    public code: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function createHttp(): AxiosInstance {
  const instance = axios.create({
    // 基础路径：所有请求的 URL 前缀。真实后端时配合 Vite 代理解决跨域（docs/09）
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10_000, // 10 秒没响应就报错
    // 核心开关：启用 mock 时，所有请求都不发出去，直接走本地模拟后端
    ...(USE_MOCK ? { adapter: mockAdapter } : {}),
  })

  /* ---------- 请求拦截器：出发前统一"安检" ---------- */
  instance.interceptors.request.use((config) => {
    // 从 localStorage 取 token 挂到请求头（真实系统这就是 JWT）
    const token = getStorage<string>(TOKEN_KEY, '')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  /* ---------- 响应拦截器：回来后统一"拆包裹" ---------- */
  instance.interceptors.response.use(
    (response) => {
      const body = response.data as ApiResponse
      // 成功：业务码为 0，什么都不用做，交给业务代码拆 data
      if (body.code === 0) return response

      // 401：登录过期 → 清掉本地 token，跳登录页（用整页跳转，避免循环依赖 router）
      if (body.code === 401) {
        removeStorage(TOKEN_KEY)
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
      // 其他业务错误：转成 ApiError 抛给业务代码
      return Promise.reject(new ApiError(body.code, body.message || '请求失败'))
    },
    (error: AxiosError) => {
      // 走到这里说明是 HTTP 层面的错误（超时、网络断开、真实后端的 4xx/5xx）
      const message =
        error.code === 'ECONNABORTED'
          ? '请求超时，请稍后重试'
          : error.response
            ? `请求失败（HTTP ${error.response.status}）`
            : '网络异常，请检查网络连接'
      return Promise.reject(new ApiError(error.response?.status ?? -1, message))
    },
  )

  return instance
}

export const http = createHttp()

/**
 * 业务代码统一使用的请求函数：发起请求并直接返回信封里的 data。
 * 用法：const user = await request<UserAccount>({ url: '/auth/profile' })
 * ☕ Java 视角：相当于泛型方法 <T> T request(...)，调用方不用自己强转。
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config)
  return response.data.data
}

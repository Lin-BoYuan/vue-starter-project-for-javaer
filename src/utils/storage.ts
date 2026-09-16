/**
 * 📖 配套教程：docs/05-composition-api.md（localStorage 的概念）、docs/09-http.md（token 存储）
 * localStorage 封装：浏览器内置的"小型 KV 数据库"，同一个域名下永久有效（关浏览器也不丢）。
 *
 * ☕ Java 视角：可以理解为一个浏览器自带的、无网络开销的 Redis（容量只有 ~5MB，
 *   且只能存字符串，所以这里用 JSON 序列化/反序列化）。
 */

const PREFIX = 'vue3-admin-tutorial:'

/** 读取：key 不存在或解析失败时返回 fallback（对应 Java 的 getOrDefault） */
export function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    // JSON 格式损坏等情况：兜底返回默认值，避免一个坏数据搞挂整个应用
    return fallback
  }
}

/** 写入：任意值都会先 JSON.stringify 成字符串 */
export function setStorage(key: string, value: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

/** 删除 */
export function removeStorage(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

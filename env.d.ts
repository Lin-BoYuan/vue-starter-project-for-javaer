/// <reference types="vite/client" />

// 📖 配套教程：docs/03-typescript-for-java.md、docs/02-project-setup.md
// 给 import.meta.env 声明类型：这样代码里写 import.meta.env.VITE_USE_MOCK
// 不仅有自动补全，写错变量名还会直接编译报错。
// ☕ Java 视角：相当于给配置项写一个 @ConfigurationProperties 类，让配置"有据可查"。

interface ImportMetaEnv {
  /** 是否启用本地 mock 后端 */
  readonly VITE_USE_MOCK?: string
  /** API 基础路径 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv & { BASE_URL: string }
}

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 📖 配套教程：docs/02-project-setup.md（Vite 是什么）、docs/09-http.md（代理与跨域）
// Vite 配置文件：☕ Java 视角 ≈ pom.xml + application.yml 的合体，
// 管着构建插件、路径别名、开发服务器等工程化配置。
export default defineConfig({
  plugins: [
    vue(), // 让 Vite 认识 .vue 单文件组件
    vueDevTools(), // 开发时右下角出现 Vue DevTools 悬浮按钮，调试组件树很好用
  ],
  resolve: {
    alias: {
      // 路径别名：import xxx from '@/api/http' 里的 @ 就代表 src 目录
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 开发服务器代理：把 /api 开头的请求转发给真实后端，解决浏览器跨域限制。
    // 仅在 VITE_USE_MOCK=false 时会真正被用到（docs/09-http.md 有完整讲解）。
    // ☕ Java 视角：类似 Nginx 的 location /api { proxy_pass http://backend; }
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 你的 Spring Boot 端口
        changeOrigin: true,
        // 如果后端接口没有 /api 前缀，用 rewrite 把前缀去掉：
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

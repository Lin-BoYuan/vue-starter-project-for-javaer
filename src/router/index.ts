// 📖 配套教程：docs/07-router.md
// 路由表：定义 "URL → 页面组件" 的映射关系。
// ☕ Java 视角：等价于 @GetMapping("/users") 这类注解路由，
//   只不过后端把 URL 映射到 Controller 方法，前端把 URL 映射到 .vue 页面组件。
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // createWebHistory：使用浏览器 History API 的路由模式（URL 里没有 # 号）
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 脚手架占位页：后续章节会替换成真实的登录页和后台布局
      path: '/',
      name: 'start',
      component: () => import('@/views/StartView.vue'),
    },
  ],
})

export default router

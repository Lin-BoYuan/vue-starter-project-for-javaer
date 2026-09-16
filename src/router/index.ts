// 📖 配套教程：docs/07-router.md（本章主角）
// 路由表：定义 "URL → 页面组件" 的映射关系。
// ☕ Java 视角：等价于 @GetMapping("/users") 这类注解路由——
//   后端把 URL 映射到 Controller 方法，前端把 URL 映射到 .vue 页面组件。
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

/**
 * TS 声明合并（declaration merging）：给 vue-router 的 meta 字段补充类型。
 * meta 是路由的"自定义备注"，等价于给接口加注解：
 *   meta: { requiresAuth: true } ≈ @PreAuthorize("isAuthenticated()")
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    /** 浏览器标签页标题 */
    title?: string
    /** 侧边栏菜单图标（本项目用 emoji，真实项目用 iconfont/svg） */
    icon?: string
  }
}

const routes: RouteRecordRaw[] = [
  // 登录页：不需要登录
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录' },
  },
  // 后台主布局：所有业务页面都是它的"子路由"，渲染在布局的 <RouterView /> 里
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard', // 访问 / 时自动跳到 /dashboard
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true, title: '仪表盘', icon: '📊' },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
        meta: { requiresAuth: true, title: '用户管理', icon: '👥' },
      },
      {
        path: 'articles',
        name: 'articles',
        component: () => import('@/views/articles/ArticleListView.vue'),
        meta: { requiresAuth: true, title: '文章管理', icon: '📝' },
      },
      {
        // 注意顺序：静态路径 articles/new 放在动态路径 articles/:id 前面更直观
        path: 'articles/new',
        name: 'article-new',
        component: () => import('@/views/articles/ArticleEditView.vue'),
        meta: { requiresAuth: true, title: '新建文章' },
      },
      {
        // 动态路由参数：:id 是占位符，访问 /articles/3 时在组件里用 useRoute().params.id 拿到 "3"
        path: 'articles/:id',
        name: 'article-detail',
        component: () => import('@/views/articles/ArticleDetailView.vue'),
        meta: { requiresAuth: true, title: '文章详情' },
      },
      {
        path: 'articles/:id/edit',
        name: 'article-edit',
        component: () => import('@/views/articles/ArticleEditView.vue'),
        meta: { requiresAuth: true, title: '编辑文章' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { requiresAuth: true, title: '个人设置', icon: '⚙️' },
      },
      {
        // 组件库对照页：与 /users 功能相同的 Element Plus 版（docs/12）
        path: 'element-demo/users',
        name: 'element-users',
        component: () => import('@/views/element-demo/ElementUsersView.vue'),
        meta: { requiresAuth: true, title: 'Element Plus 对照', icon: '🧩' },
      },
    ],
  },
  // 通配路由：以上都不匹配时兜底（正则语法，:pathMatch 接收任意路径）
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  // createWebHistory：HTML5 History 模式（URL 干净无 #）。
  // 部署时需要 Nginx 把所有路径都回退到 index.html（docs/13-build-deploy.md）
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/* ---------- 全局前置守卫：每次路由跳转前都会经过这里 ---------- */
// ☕ Java 视角：≈ Spring Security 的 Filter 链 / HandlerInterceptor 的 preHandle：
//   返回 true/undefined 放行；返回一个路由对象 = 重定向（相当于 response.sendRedirect）
router.beforeEach((to) => {
  const userStore = useUserStore()

  // 需要登录但没登录 → 去登录页，并记住"想来没来成"的地址，登录成功后跳回去
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // 已登录还去登录页 → 直接送进后台
  if (to.name === 'login' && userStore.isLoggedIn) {
    return { name: 'dashboard' }
  }
  // 返回 undefined/true 表示放行
})

/* ---------- 全局后置钩子：跳转完成后改浏览器标签页标题 ---------- */
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Mini 管理后台` : 'Mini 管理后台'
})

export default router

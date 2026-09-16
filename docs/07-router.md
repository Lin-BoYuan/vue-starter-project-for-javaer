# 第 7 章 · 路由与导航：Vue Router

> 🎯 **本章目标**：搞懂 SPA 的多页面机制——URL 怎么映射到组件、嵌套路由、动态参数、懒加载、编程式导航，以及最实用的**登录守卫**（本项目完整实现了 token 鉴权 + 登录后跳回原页面）。

**前置知识**：第 4-6 章。

---

## 1. 为什么只有一个 HTML 也能有多个页面

传统多页应用（MPA）：每次跳转 = 浏览器整页重新请求 HTML → 白屏 → 重新渲染，体验割裂。

SPA（单页应用）：**整站只有一个 HTML**，"换页"其实是 JS 在换组件。URL 变化靠 History API（`history.pushState`）——不发请求、不刷新，组件树换掉，地址栏跟着变。**Vue Router 就是管理"URL ↔ 组件"映射表的那位。**

> ☕ **Java 视角**：后端的 `DispatcherServlet` 把 URL 分发给 Controller 方法；Vue Router 把 URL 分发给**组件**。`/users` 路径在后端命中 `UserController#list`，在前端命中 `UsersView.vue`——同名不同物，各管各的（第 9 章讲它们如何配合）。

---

## 2. 路由表：项目的"URL 规划图"

> 🔍 主教材：`src/router/index.ts`（本章建议全文精读，注释齐全）。核心结构：

```typescript
const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },

  {
    path: '/',                                   // 布局路由（无页面，只有外壳）
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',                      // 访问 / 自动跳 /dashboard
    children: [                                  // ⭐ 嵌套路由：子页面渲染在布局的 <RouterView/> 里
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true, title: '仪表盘', icon: '📊' } },
      { path: 'articles/:id', name: 'article-detail',     // ⭐ 动态参数
        component: () => import('@/views/articles/ArticleDetailView.vue'),
        meta: { requiresAuth: true } },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', /* 404 兜底 */ },
]
```

四个关键概念：

| 概念 | 语法 | 说明 |
|---|---|---|
| **嵌套路由** | `children` | 布局是父，业务页是子；子组件渲染在父的 `<RouterView />` 里（见 `AdminLayout.vue`） |
| **动态参数** | `path: 'articles/:id'` | `:id` 是占位符；`/articles/3` → `route.params.id === '3'`（**是字符串**，本项目用 `Number()` 转） |
| **通配路由** | `/:pathMatch(.*)*` | 兜底 404，放路由表**最后** |
| **meta** | `meta: { requiresAuth: true }` | 自定义备注，给守卫/菜单用 ≈ 接口上的注解 |

**name 很重要**：`router.push({ name: 'article-detail', params: { id: 3 } })` 按名字跳转，URL 改了代码不用跟着改——比裸写字符串路径更可维护（≈ 常量代替魔法值）。

---

## 3. 懒加载：`() => import(...)` 的一个字之差

```typescript
component: () => import('@/views/UsersView.vue')   // ✅ 懒加载：访问该路由才下载这个 chunk
component: UsersView                                // ❌ 同步：打进主包，首屏变重
```

跑一下 `npm run build`，你会看到每个 View 一个独立 js 文件——这就是第 2 章见过的"按路由代码分割"。**本项目所有页面都是懒加载**，只有 `main.ts` 主链路（Vue 本体、路由、Pinia、Element Plus）在首屏包里。

---

## 4. 两种使用姿势：模板标签 vs 编程式

```vue
<!-- ① <RouterLink>：渲染成 <a>，但点击是"换组件"不是"发请求" -->
<RouterLink to="/users">用户管理</RouterLink>
<RouterLink :to="{ name: 'article-detail', params: { id: article.id } }">详情</RouterLink>
<!-- 当前路由匹配时自动获得 class：router-link-active（本项目侧边栏高亮就用它） -->

<!-- ② 编程式导航：逻辑代码里跳转 -->
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()   // 路由器实例：导航用
const route = useRoute()     // 当前路由信息：读参数用

router.push('/dashboard')                                  // 前进（留历史记录，可后退）
router.replace({ name: 'login' })                          // 替换（不留记录：登录/登出后用）
router.back()                                              // 后退（本项目 404 页"返回上一页"）

const id = Number(route.params.id)                          // 读动态参数（ArticleDetailView）
const redirect = route.query.redirect                       // 读查询参数 ?redirect=/xxx
</script>
```

> ☕ **Java 视角**：`router.push` ≈ `response.sendRedirect`，但发生在**浏览器内部**，不产生 HTTP 请求；`route` ≈ `@PathVariable + @RequestParam` 的合集。

---

## 5. 全局守卫：前端版的 Spring Security 过滤器

每次路由跳转（包括首次进入）都会先过 `beforeEach`。**本项目实现了完整登录态保护**：

```typescript
// src/router/index.ts
router.beforeEach((to) => {
  const userStore = useUserStore()    // ⚠️ 守卫里才创建 store（main.ts 里 Pinia 已先于路由安装）

  // 需要登录但没登录 → 去登录页，用 query 记住目的地
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // 已登录访问登录页 → 直接送进后台
  if (to.name === 'login' && userStore.isLoggedIn) {
    return { name: 'dashboard' }
  }
  // 返回 undefined/true = 放行
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Mini 管理后台` : 'Mini 管理后台'
})
```

> ☕ **Java 视角**：`beforeEach` ≈ `HandlerInterceptor#preHandle` / Spring Security 的 Filter 链——返回 true 放行，返回响应（路由对象）= 重定向。`to.meta.requiresAuth` ≈ `@PreAuthorize("isAuthenticated()")`，声明式、集中管控。

**登录后跳回原页面的闭环**（体验细节的精髓）：

```
访问 /users → 守卫拦截 → /login?redirect=/users
登录成功 → LoginView 读 route.query.redirect → router.replace(redirect)
```

> ⚠️ **安全边界**：前端路由守卫只是**体验层**（不让你看到无权页面）；真正数据安全靠**后端接口鉴权**——mock 里没带 token 的接口照样返回 401，就是这个意思。这句对后端同学是常识，对前端是常识，对全栈是常识×2。

---

## 6. 🔍 结合本项目源码（本章精读材料）

| 文件 | 看什么 |
|---|---|
| `src/router/index.ts` | ⭐ 路由表全貌：嵌套/动态/通配/meta/懒加载/守卫/标题 |
| `src/layouts/AdminLayout.vue` | `<RouterView />` 嵌套出口 + 侧边栏 `RouterLink` 高亮 |
| `src/views/LoginView.vue` | `useRoute()` 读 redirect query + `router.replace` 跳转 |
| `src/views/articles/ArticleDetailView.vue` | `useRoute().params.id` 读动态参数 |
| `src/views/articles/ArticleEditView.vue` | 一个组件服务 `articles/new` 和 `articles/:id/edit` 两条路由 |
| `src/views/NotFoundView.vue` | 通配路由的 404 页 + `router.back()` |

---

## ✏️ 动手练习

1. **菜单徽标**：给用户管理菜单加个角标显示"正在开发"——利用 `meta` 加个 `badge: 'WIP'` 字段（记得先在 `declare module 'vue-router'` 的 `RouteMeta` 里补类型，见第 3 章声明合并）。
2. **详情页直达刷新**：直接在地址栏访问 `/articles/8` 后按 F5，观察页面仍然正常——因为 History 模式下刷新会向服务器请求 `/articles/8`，但 Nginx 配了回退到 `index.html`（第 13 章动手配）。
3. **思考题**：为什么登出用 `router.replace` 而不是 `push`？（提示：登录页按"后退"会发生什么）

<details><summary>练习提示</summary>

3. replace 不留历史记录：登出后按后退不会回到"已登出状态的后台页"（否则守卫又会把你弹回登录页，形成尴尬循环）。

</details>

## 📌 本章小结

- SPA = 单 HTML + History API 换组件；Router 是 URL↔组件 的映射表。
- 嵌套路由 = 布局复用；`:id` 动态参数是字符串；meta 是路由的"注解"。
- 页面一律懒加载 `() => import()`；导航 `push/replace` 分清楚。
- `beforeEach` 守卫 = 前端版过滤器链，负责"体验上的鉴权"；**真正的鉴权永远在后端**。

**下一章** → [08-pinia.md](./08-pinia.md)：跨页面的全局状态——Pinia。

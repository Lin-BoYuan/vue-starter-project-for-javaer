# 第 13 章 · 构建部署与进阶路线

> 🎯 **本章目标**：完成最后一公里——理解 `npm run build` 产出什么、如何部署到 Nginx/Docker、前端安全常识，最后用一张 **80% 知识自测清单**验证学习成果，并给出后续进阶地图。

**前置知识**：第 1-12 章全部。

---

## 1. 构建产物：`npm run build` 到底做了什么

```bash
npm run build
# = type-check（vue-tsc 全量类型检查）++ build-only（vite build）并行执行

# 产物 dist/：
dist/index.html                  # 唯一的 HTML（还记得第 1 章的 SPA 吗）
dist/assets/index-XXXX.js        # 主包：Vue 本体 + 路由 + Pinia + Element Plus
dist/assets/UsersView-XXXX.js    # 每个路由页面独立 chunk（懒加载，第 7 章）
dist/assets/index-XXXX.css       # 抽取的全部 CSS
```

三个词概括 Vite 做的事：**转译**（TS→JS、Vue→JS、SCSS→CSS）、**压缩混淆**（变量名变 a/b/c）、**代码分割**（按路由/依赖切 chunk）。文件名里的 hash 是**缓存策略**：内容不变 hash 不变，浏览器可以永久缓存；发布新版本 hash 变化，用户自动拉新文件。

> ☕ **Java 视角**：`npm run build` ≈ `mvn package`；`dist/` ≈ `target/`；hash 文件名 ≈ 带版本号的构件。区别：前端产物是**纯静态文件**，不需要进程常驻——它只是被下载到用户浏览器执行。

---

## 2. 部署

### 2.1 Nginx（最常见）

```nginx
server {
    listen 80;
    server_name admin.example.com;
    root /var/www/vue3-admin-tutorial/dist;    # 构建产物目录
    index index.html;

    # ⭐ SPA 的灵魂配置：所有未知路径回退到 index.html
    # 否则用户直接访问 /users 或刷新页面会 404（服务器上并没有 /users 这个文件）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 接口反向代理（可选：同域部署时让前端后端同源，CORS 问题直接消失）
    location /api/ {
        proxy_pass http://localhost:8080;
    }

    # 静态资源长缓存（带 hash 的文件内容不会变）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> 这份配置就是第 7 章"History 模式需要服务端配合"和第 9 章"生产跨域"两个伏笔的答案。

### 2.2 Docker（后端同学的最爱）

```dockerfile
# 多阶段构建：阶段一构建，阶段二只拷贝产物（镜像从 1GB 缩到几十 MB）
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                 # ≈ 依赖 lock 的可复现安装
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
```

> ☕ **Java 视角**：`npm ci` ≈ `mvn -DskipTests package` 的确定性构建；多阶段构建 ≈ 用 JDK 镜像编译、JRE 镜像运行的套路——你在后端 Docker 化时见过完全一样的思想。

### 2.3 多环境

`.env.production` 里 `VITE_USE_MOCK=false` + `VITE_API_BASE_URL=https://api.example.com`（对接真实后端时改），`npm run build` 自动读取。**不同环境 = 不同 env 文件 + 各 build 一次**（≈ Maven profile）。

---

## 3. 前端安全常识（后端转来的人要补的课）

| 风险 | 一句话原理 | 本项目的防线 |
|---|---|---|
| **XSS**（脚本注入） | 用户输入的 HTML/JS 被当真执行 | Vue 模板插值 `{{ }}` **默认转义**——只要不用 `v-html` 渲染用户内容就基本安全 |
| **token 存储** | XSS 得手 → localStorage 里的 token 被偷 | localStorage（本项目用）简单但有 XSS 面；HttpOnly Cookie 更安全但要后端配合 CSRF 防护。**这是全栈权衡题，没有免费午餐** |
| **敏感信息进包** | `VITE_` 变量全人类可见 | 第 9 章铁律：只放非敏感配置 |
| **前端鉴权 ≠ 鉴权** | 路由守卫只是"藏页面" | 第 7 章铁律：接口必须自己验 token（mock 的 `auth: true` 演示了这条） |

---

## 4. ⭐ 80% 知识自测清单

全部打勾，说明你已掌握常用前端知识体系的核心。**每条都应能：讲概念 + 指出本项目源码位置 + 动手改出效果。**

### 三件套
- [ ] 能解释 SPA 与 MPA 的区别、浏览器渲染流程（第 1 章）
- [ ] ES6+ 语法：解构/展开/可选链/数组三件套/async-await（第 1 章）
- [ ] `Promise` 与 `CompletableFuture` 的对应与差异；**永远记得 await**（第 1 章）
- [ ] package.json / node_modules / npm scripts / 语义化版本（第 2 章）
- [ ] Vite 的两个身份：dev server（HMR）与打包器（第 2 章）
- [ ] TS：interface/联合类型/泛型/工具类型/收窄/声明合并（第 3 章）

### Vue 核心
- [ ] SFC 三段式；模板指令全家：`v-if/v-for/:x/@x/v-model`（第 4 章）
- [ ] `v-for` 的 `:key` 为什么不能用下标（第 4 章）
- [ ] Proxy 响应式原理；script 里 `.value` 模板里不用（第 5 章）
- [ ] ref vs reactive 的选型；computed 缓存；watch 副作用（第 5 章）
- [ ] 生命周期：`onMounted` 拉数据、`onUnmounted` 清定时器（第 5 章）
- [ ] props 单向数据流；emits 类型化；provide/inject ≈ IoC（第 6 章）
- [ ] composable 抽取时机与写法（第 6 章）

### 工程三大件
- [ ] 路由：嵌套/动态参数/meta/懒加载/beforeEach 守卫（第 7 章）
- [ ] 登录态闭环：守卫 → 登录 → redirect 跳回（第 7 章）
- [ ] Pinia：setup store / storeToRefs / 持久化（第 8 章）
- [ ] axios 封装：实例/双拦截器/错误归一 `ApiError`（第 9 章）
- [ ] mock 架构与一键切换真实后端（第 9 章）
- [ ] Vite 代理 vs 后端 CORS，同源策略到底拦谁（第 9 章）

### 实战与 UI
- [ ] 四大套路：三态渲染/列表页/表单校验/弹窗（第 10 章）
- [ ] scoped 原理；全局原子类与组件样式的分层（第 11 章）
- [ ] Flex 一维、Grid 二维；`flex:1`/`min-width:0`/`auto-fit`（第 11 章）
- [ ] CSS 变量 + `.dark` 暗色主题机制（第 11 章）
- [ ] 组件库三张表（Props/Events/Slots）；声明式 vs 命令式弹窗（第 12 章）
- [ ] 构建产物、hash 缓存、Nginx `try_files`、Docker 多阶段（本章）

---

## 5. 进阶路线图（学完本项目去哪）

| 方向 | 学什么 | 为什么 |
|---|---|---|
| **深挖 Vue** | 官方文档进阶篇：组合式函数模式、`defineExpose`、`<Suspense>`、`KeepAlive`、动画系统 | 本项目刻意绕过的"下一层" |
| **类型体操** | TS 官方 Handbook + type-challenges | Vue 源码和优秀库的类型大量使用 |
| **前端测试** | Vitest（单测，≈ JUnit）+ Vue Test Utils | 组件测试 ≈ Controller 层测试的思路 |
| **状态机与请求库** | TanStack Query（请求缓存/失效/重试） | 第 10 章手写套路的工业级替代品 |
| **SSR/元框架** | Nuxt | 需要 SEO/首屏时；≈ 前端的 Spring Boot 全家桶 |
| **Node 后端** | Express/NestJS | 前端技能栈顺手写 BFF，全栈再进一步 |
| **工程化** | ESLint 规则定制、CI/CD（GitHub Actions 部署 dist）、monorepo（pnpm workspace） | 团队协作必需 |

**建议顺序**：先把本项目重写一遍（不看文档）→ 读 Vue 官方文档进阶篇 → 挑一条业务方向（管理后台/移动端 H5/小程序）做一个真实项目。**前端没有"学完"，只有"又一个页面写完了"。**

---

## 6. 关于本项目

- 所有章节源码互链，练习答案藏在 `<details>` 里；
- 欢迎提 Issue/PR：文档勘误、练习补充、真实 Spring Boot 对接示例都是极好的贡献方向；
- 如果对你有帮助，GitHub 上点个 Star ⭐ 就是给下一个转全栈的 Java 同学指路。

## 📌 本章小结

- `dist/` 是纯静态文件；hash 文件名 = 缓存策略；Nginx `try_files` 是 SPA 部署的命门。
- 多阶段 Docker 构建和后端如出一辙；多环境靠 env 文件切换。
- 安全四课：XSS 默认转义、token 存储权衡、VITE_ 变量公开、守卫不是鉴权。
- 自测清单全绿 = 达成"80% 前端知识"目标，剩下的 20% 在真实项目里。

🎉 **恭喜通关。去写一个真实的项目吧——前端的一切知识，最终都为"把东西做出来"服务。**

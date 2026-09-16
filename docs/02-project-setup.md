# 第 2 章 · 工程化起步：Node、npm 与 Vite

> 🎯 **本章目标**：理解前端工程的"Maven 世界"——package.json、node_modules、npm 脚本、Vite 开发服务器，并把本项目在你机器上跑起来。

**前置知识**：第 1 章。

---

## 1. Node.js：后端同学的老朋友，前端的地基

Node.js = **跑在操作系统上的 JavaScript 运行时**（浏览器之外的 JS）。它让 JS 能读写文件、起 HTTP 服务器——于是：

- 前端的**构建工具**（Vite）、包管理器（npm）都用 Node 写、靠 Node 跑；
- 后端同学甚至可以直接用 Node 写后端（Express/NestJS 框架）。

> ☕ **Java 视角**：Node.js 之于 JS ≈ JVM 之于 Java。浏览器里的 JS 是"跑在用户沙箱里"，Node 里的 JS 是"跑在你服务器上"。

**安装**：去 `nodejs.org` 下载 LTS 版（或用 nvm 管理多版本，≈ jenv/sdkman）。验证：

```bash
node -v   # v22+ 或 v24+ 均可
npm -v    # npm 随 Node 一起装好
```

---

## 2. package.json：前端的 pom.xml

```jsonc
{
  "name": "vue3-admin-tutorial",
  "version": "0.1.0",
  "type": "module",                       // 使用 ESM 模块规范
  "scripts": {                            // ≈ mvn 的 lifecycle/goal
    "dev": "vite",                        // npm run dev → 启动开发服务器
    "build": "run-p type-check \"build-only {@}\" --",   // 并行：类型检查 + 打包
    "preview": "vite preview",            // 本地预览打包产物
    "lint": "run-s \"lint:*\""            // 串行执行所有 lint:* 脚本
  },
  "dependencies": {                       // ≈ <dependencies>（运行时需要）
    "vue": "^3.5.42",
    "pinia": "^4.0.3",
    "vue-router": "^5.3.1",
    "axios": "^1.x"
  },
  "devDependencies": {                    // ≈ <scope>provided/test：只在开发构建时用
    "typescript": "~6.0.0",
    "vite": "^8.2.2"
  }
}
```

**语义化版本**：`^3.5.42` = 允许升级小版本（3.x.x），`~6.0.0` = 只允许补丁版本（6.0.x）。锁版本靠 **package-lock.json**（≈ Maven 的 dependency 锁定），**必须提交到 git**。

常用命令对照表（背下来，肌肉记忆）：

| 前端 | 你熟悉的 Maven |
|---|---|
| `npm install` | `mvn install`（拉依赖到 node_modules） |
| `npm install axios` | 在 pom.xml 加依赖 + install |
| `npm run dev` | `mvn spring-boot:run` |
| `npm run build` | `mvn package` |
| `npm uninstall xxx` | 删 pom 里的依赖 |
| `node_modules/` | `~/.m2/repository`（但它是**每项目一份**，且默认提交 git 时要忽略） |

> 💡 **国内加速**：如果 npm 下载慢，`npm config set registry https://registry.npmmirror.com`（≈ 换阿里云 Maven 镜像）。

---

## 3. Vite：前端界的 spring-boot-devtools（Pro Max）

[Vite](https://cn.vite.dev) 是本项目的**构建工具 + 开发服务器**，两个身份：

1. **开发时**（`npm run dev`）：起一个本地服务器（本项目 5173 端口）。你改代码保存 → **浏览器不刷新也能看到效果**（HMR，热模块替换）。毫秒级启动：它不打包全部代码，浏览器请求哪个模块才现场编译哪个（原生 ESM 按需编译）。
2. **打包时**（`npm run build`）：把散装 JS/Vue 文件打优化、压缩、按路由代码分割，产出 `dist/` 目录的静态文件，扔给 Nginx 即可（第 13 章）。

`vite.config.ts` 是 Vite 的配置文件（≈ pom.xml + application.yml 的合体），本项目用到了三件事：

| 配置 | 作用 | 在本项目 |
|---|---|---|
| `plugins: [vue()]` | 让 Vite 认识 .vue 文件 | `vite.config.ts` |
| `resolve.alias` | `@` → `src` 目录 | `import x from '@/api/http'` |
| `server.proxy` | 开发服务器反向代理 `/api` | 对接真实后端时解决跨域（第 9 章） |

---

## 4. 本项目目录结构速览（🗺 建议对照着打开）

```
vue3-admin-tutorial/
├── index.html               # SPA 的唯一 HTML（body 里只有一个 <div id="app">）
├── package.json             # 依赖与脚本
├── vite.config.ts           # Vite 配置：插件、@ 别名、开发代理
├── tsconfig*.json           # TypeScript 编译配置（第 3 章）
├── .env.development         # 开发环境变量（≈ application-dev.yml）
├── .env.production          # 生产环境变量
├── docs/                    # 本教程
└── src/
    ├── main.ts              # 🚀 应用入口：createApp + 注册插件 + mount
    ├── App.vue              # 根组件（只放了一个 <RouterView/>）
    ├── router/index.ts      # 路由表 + 登录守卫（第 7 章）
    ├── stores/user.ts       # Pinia 全局状态：登录态（第 8 章）
    ├── api/                 # 接口层：http.ts 封装 + 各业务 api（第 9 章）
    ├── mock/                # 假后端：不发请求也能跑通全流程（第 9 章）
    ├── composables/         # 组合式函数：可复用逻辑（第 6 章）
    ├── components/          # 通用小组件（弹窗/分页条/统计卡…）
    ├── layouts/             # 后台整体布局（侧边栏+顶栏）
    ├── views/               # 页面级组件（每个 URL 对应一个）
    ├── constants/           # 常量（注入 key、文章分类）
    ├── types/               # TS 类型定义（第 3 章）
    ├── utils/               # 工具函数（localStorage、时间格式化）
    └── styles/              # 全局样式与 CSS 变量（第 11 章）
```

> ☕ **Java 视角**：这一套分层你会无比眼熟——`api/` ≈ Feign 客户端，`stores/` ≈ 单例 Service，`views/` ≈ 页面 Controller，`types/` ≈ DTO 包，`utils/` ≈ util 包。**前端的"架构感"和后端是相通的**，放心迁移你的工程直觉。

---

## 5. 把项目跑起来（三行命令）

```bash
npm install     # 第一次：下载依赖（node_modules 不会出现在 git 里）
npm run dev     # 启动开发服务器，默认 http://localhost:5173
npm run build   # 产出 dist/，验证类型与打包是否健康
```

登录账号：`admin` / `123456`（mock 数据，个人设置页还能一键重置）。

### 常用辅助脚本

| 命令 | 作用 |
|---|---|
| `npm run type-check` | 只做 TS 类型检查（≈ `mvn compile` 的编译报错） |
| `npm run lint` | ESLint + oxlint 静态检查并自动修复 |
| `npm run format` | Prettier 统一格式化（≈ 保存时自动格式化） |

> 🔍 **结合本项目**：`npm run build` 输出里每个路由页面都是独立 chunk（如 `UsersView-xxx.js`），因为路由表里用了 `() => import(...)` 懒加载——用户访问哪个页面才下载哪个页面的代码，首屏更快（第 7 章展开）。

---

## ✏️ 动手练习

1. 在 `package.json` 的 `scripts` 里加一条 `"hello": "echo hello frontend"`，然后 `npm run hello`。
2. 在 `.env.development` 里加一行 `VITE_MY_NAME=你的名字`，重启 dev server；临时在 `main.ts` 顶部 `console.log(import.meta.env.VITE_MY_NAME)` 验证浏览器 Console 能看到。
3. 把 `vite.config.ts` 里 `server.proxy` 的 target 改成 9999 端口，观察 dev server 输出（不用真后端，体会"改配置要重启"）。

## 📌 本章小结

- Node.js 是 JS 的 JVM；npm 是 Maven；`package.json` 是 pom.xml；`node_modules` 是每项目一份的 `.m2`。
- Vite = 开发服务器（HMR 热更新）+ 打包器（产出静态文件）。
- 本项目分层与后端一一对应，工程直觉可以平移。

**下一章** → [03-typescript-for-java.md](./03-typescript-for-java.md)：TypeScript——为 Java 程序员量身定制的"舒适区"。

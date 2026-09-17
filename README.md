# vue-starter-project-for-javaer 🎓

**给 Java 程序员的 Vue3 全栈入门——Mini 管理后台实战**

> 一个专为 **Java 后端转全栈** 程序员设计的 Vue3 教学项目：
> 一个功能完整、可运行的 Mini 管理后台 + 13 章与源码逐行互链的精读文档。
> 有 HTML/CSS/JS 三件套基础，精读完本项目即可掌握 **80% 以上的常用前端知识**。

![Vue3](https://img.shields.io/badge/Vue-3.5-42b883) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6) ![Vite](https://img.shields.io/badge/Vite-8-646cff) ![Pinia](https://img.shields.io/badge/Pinia-4-f7d336) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 为什么是这个项目

市面上 Vue 教程很多，但大多默认你"没有编程基础"或者"已经是前端"。本项目专为有 **Java/Spring 功底**的你定制：

- ☕ **全程 Java 类比**：每个前端概念都配一张"Java 视角"对照卡
  - `package.json` ↔ `pom.xml`，Vite 热更新 ↔ spring-boot-devtools
  - Vue3 响应式 Proxy ↔ Spring AOP 动态代理，`computed` ↔ 带缓存的视图
  - `provide/inject` ↔ IoC 容器，Pinia store ↔ 单例 `@Service`，路由守卫 ↔ Spring Security 过滤器
  - axios 拦截器 ↔ OkHttp Interceptor，`.env` ↔ `application-dev.yml`，Nginx ↔ 前端的 Tomcat
- 🏗 **代码即教材**：功能完整的登录鉴权 → 仪表盘 → 用户管理 → 文章管理 → 个人设置，每个源文件头部标注配套章节
- 🧪 **不需要后端**：内置一套"装在浏览器里的 mock 后端"（含 401/404/参数校验失败/网络延迟），全流程可玩；对接你的 Spring Boot 只改一个环境变量
- 🔀 **手写版 + 组件库版双实现**：同一个用户管理页，`/users` 是手写组件，`/element-demo/users` 是 Element Plus 重写版，对照读才知道组件库帮你封装了什么
- 📝 **13 章精读文档**：每章统一模板——本章目标 / ☕ Java 类比 / 源码导航表 / 动手练习（答案折叠）/ 自测小结

---

## 🚀 快速开始

```bash
git clone https://github.com/你的用户名/vue-starter-project-for-javaer.git
cd vue-starter-project-for-javaer
npm install
npm run dev        # 打开 http://localhost:5173
```

登录账号：**admin / 123456**（mock 数据，个人设置页可一键重置演示数据）

其他命令：

| 命令 | 作用 |
|---|---|
| `npm run build` | 类型检查 + 打包（产出 `dist/`） |
| `npm run lint` | ESLint/oxlint 静态检查 |
| `npm run format` | Prettier 格式化 |

---

## 🗺 学习路线图

按顺序精读，每章 30~60 分钟，读一章 → 对照源码 → 做练习：

| 章 | 文档 | 你将掌握 |
|---|---|---|
| 1 | [前端世界观与三件套地图](docs/01-frontend-overview.md) | 浏览器原理、ES6+ 与 Java 差异、Promise ≈ CompletableFuture |
| 2 | [工程化起步](docs/02-project-setup.md) | Node/npm/Vite ↔ Maven 全套对照、项目结构 |
| 3 | [TypeScript 速成](docs/03-typescript-for-java.md) | interface/泛型/工具类型，用 Java 直觉学 TS |
| 4 | [Vue 组件与模板语法](docs/04-vue-basics.md) | SFC、指令全家桶、v-model 真相（登录页为教材） |
| 5 | [响应式与组合式 API](docs/05-composition-api.md) | Proxy 响应式、ref/computed/watch、生命周期 |
| 6 | [组件通信与逻辑复用](docs/06-components-communication.md) | props/emits/v-model/插槽/provide-inject/composables |
| 7 | [路由与导航](docs/07-router.md) | 嵌套路由、动态参数、懒加载、**登录守卫** |
| 8 | [状态管理 Pinia](docs/08-pinia.md) | setup store、storeToRefs、登录态全景 |
| 9 | [网络请求与前后端联调](docs/09-http.md) ⭐ | axios 封装、mock 架构、**对接你的 Spring Boot**、CORS |
| 10 | [实战套路](docs/10-patterns.md) | 列表页/表单/弹窗/三态渲染四大套路 |
| 11 | [CSS 实战](docs/11-styling.md) | scoped、Flex/Grid、CSS 变量与暗色主题 |
| 12 | [组件库 Element Plus](docs/12-element-plus.md) | 双版本对照、声明式 vs 命令式、按需引入 |
| 13 | [构建部署与进阶路线](docs/13-build-deploy.md) | 打包产物、Nginx/Docker 部署、安全常识、**80% 自测清单** |

---

## 📚 知识覆盖地图（章节 ↔ 源码）

| 知识块 | 章节 | 源码入口 |
|---|---|---|
| HTML/CSS/JS 基础 | 1、11 | `index.html`、`src/styles/` |
| 工程化 | 2 | `package.json`、`vite.config.ts`、`.env.*` |
| TypeScript | 3 | `src/types/`、`env.d.ts` |
| 模板语法与表单 | 4 | `src/views/LoginView.vue` ⭐ |
| 响应式系统 | 5 | `src/views/DashboardView.vue`、`src/composables/` |
| 组件通信 | 6 | `src/components/`、`src/constants/keys.ts` |
| 路由 | 7 | `src/router/index.ts`、`src/layouts/AdminLayout.vue` |
| 状态管理 | 8 | `src/stores/user.ts` |
| 网络与联调 | 9 | `src/api/`、`src/mock/` |
| 页面套路 | 10 | `src/views/UsersView.vue` ⭐ |
| 样式与主题 | 11 | `src/styles/main.css`（含 `html.dark`） |
| 组件库 | 12 | `src/views/element-demo/ElementUsersView.vue` |
| 构建部署 | 13 | `dist/` 产物、`docs/13` 的 Nginx/Docker 配置 |

**功能页面 ↔ 知识点**：登录（表单/守卫/token）· 仪表盘（computed/CSS 图表/三态）· 用户管理（CRUD 全家桶）· 文章管理（动态路由/详情/编辑）· 个人设置（watch/store 同步）· 404（通配路由）

---

## 📁 目录结构

```
vue-starter-project-for-javaer/
├── docs/                      # 13 章精读文档（学习从这里开始）
├── src/                       # 全部业务源码
│   ├── api/                   #   接口层：axios 封装 + 各业务 API
│   ├── mock/                  #   浏览器里的模拟后端（教学核心）
│   ├── router/                #   路由表 + 登录守卫
│   ├── stores/                #   Pinia 全局状态
│   ├── composables/           #   组合式函数：useLoading / usePagination / useTheme
│   ├── components/            #   通用组件（弹窗/分页条/统计卡…）
│   ├── layouts/               #   后台布局（侧边栏 + 顶栏）
│   ├── views/                 #   页面（登录/仪表盘/用户/文章/设置/404）
│   ├── types/                 #   TS 类型定义
│   ├── utils/                 #   工具函数
│   ├── styles/                #   全局样式与 CSS 变量（含暗色主题）
│   ├── constants/             #   常量（注入 key、文章分类）
│   ├── App.vue                #   根组件（只放一个 <RouterView/>）
│   └── main.ts                #   🚀 应用入口：createApp + 注册插件
│
│  ── 根目录配置文件（每个都是什么？）──
├── index.html                 # SPA 唯一的 HTML：页面全部由 JS 画进 <div id="app">
├── package.json               # 项目清单：依赖与脚本 ≈ pom.xml
├── package-lock.json          # 依赖版本锁定：保证每个人装到完全相同的版本（必须提交）
├── vite.config.ts             # Vite 配置：插件、@ 别名、开发代理、按路由代码分割
├── tsconfig.json              # TS 配置入口（引用下面两个，≈ 父子 pom 的关系）
├── tsconfig.app.json          # 浏览器端代码的 TS 规则
├── tsconfig.node.json         # vite.config.ts 等构建脚本的 TS 规则
├── env.d.ts                   # 给 import.meta.env 补 TS 类型（第 3 章"声明合并"）
├── eslint.config.ts           # ESLint 代码检查规则
├── .oxlintrc.json             # oxlint（第二套更快的 lint）规则
├── .prettierrc.json           # Prettier 格式化规则
├── .editorconfig              # 跨编辑器统一缩进/换行风格
├── .vscode/                   # 团队 VSCode 推荐插件清单
├── .env.development           # 开发环境变量 ≈ application-dev.yml
├── .env.production            # 生产环境变量 ≈ application-prod.yml
├── .gitignore                 # 告诉 git 忽略哪些文件（见下方"本地生成物"）
├── .gitattributes             # 统一仓库换行符为 LF（跨平台协作必备）
├── public/                    # 原样拷贝的静态资源（favicon），不经打包处理
├── LICENSE                    # MIT 开源协议
└── README.md                  # 本文件

│  ── 本地生成物：clone 后做相应操作才会出现，已被 .gitignore 排除，不要提交 ──
├── node_modules/              # npm install 之后：依赖本体 ≈ 项目本地的 .m2 仓库（体积巨大）
├── dist/                      # npm run build 之后：部署用的静态产物（扔给 Nginx）
└── .eslintcache               # npm run lint 之后：lint 的加速缓存
```

> ☕ **Java 视角**：这份目录对照 pom.xml（package.json）→ 本地仓库（node_modules）→ target/（dist）→ application-dev.yml（.env.development）的映射，你一眼就能对上号。各配置文件的深入讲解在 [docs/02-project-setup.md](docs/02-project-setup.md)。

## 🧭 精读方法建议

1. 先按"快速开始"把项目跑起来，**用一遍所有功能**（登录 → 各页面 → 增删改 → 主题 → 登出）；
2. 按路线图读文档，每章读完打开"源码导航表"里的文件对着看；
3. 每章动手练习至少做一个——前端是手艺，光看不练等于没学；
4. 最后用第 13 章的自测清单打勾验收。

## 🤝 贡献

欢迎 Issue / PR：文档勘误、练习补充、真实 Spring Boot 对接示例、英文版翻译……只要对"转全栈的 Java 同学"有帮助的都好。

## 📄 License

[MIT](./LICENSE) © 2026 LinBoYuan

---

**如果这个项目帮到了你，点个 Star ⭐，给下一个转全栈的 Java 同学指条路。**

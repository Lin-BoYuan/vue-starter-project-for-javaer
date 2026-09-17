# AGENT.md

> 本文件是给 AI 编码助手（ZCode / Claude Code / Cursor / Copilot 等）的工作规范。
> 在本仓库内干活，请先通读并严格遵守，尤其是「工作流程」一节。

## 项目是什么

- **vue-starter-project-for-javaer**：给 Java 后端程序员转 Vue3 全栈的教学项目。
- 交付物 = 一套可运行的 Mini 管理后台（登录 / 仪表盘 / 用户 / 文章 / 个人设置）+ 13 章与源码逐行互链的精读文档（`docs/`）。
- 技术栈：Vue 3.5 · TypeScript 6 · Vite 8 · Pinia 4 · Vue Router · Element Plus · axios。
- **没有真实后端**：`src/mock/` 是装在浏览器里的 mock 后端（含 401 / 404 / 参数校验失败 / 网络延迟），登录账号 `admin / 123456`。

## 常用命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | 启动开发服务器（http://localhost:5173） |
| `npm run build` | 类型检查 + 打包（= `vue-tsc` + `vite build`） |
| `npm run lint` | oxlint + ESLint 静态检查（带 `--fix`） |
| `npm run format` | Prettier 格式化 `src/` |

Node 版本要求：`^22.18.0 || >=24.12.0`。

## 代码约定

- 全部业务代码在 `src/` 下，按 `api / mock / router / stores / composables / components / layouts / views / types / utils / styles / constants` 分层，不要乱放。
- **教学约定**：源文件头部有配套章节标注（如 `第 9 章`），文档与源码逐行互链。改了某个文件的行为后，检查 `docs/` 对应章节是否需要同步更新。
- TypeScript 严格模式：新代码要有明确类型，禁止滥用 `any`。
- 组件统一用 `<script setup lang="ts">` 组合式 API 写法。
- 提交前确保 `npm run lint` 和 `npm run build`（含类型检查）通过。
- `node_modules/`、`dist/`、`.eslintcache` 是本地生成物，已被 `.gitignore` 排除，不要提交。

## ⚠️ 工作流程（硬性要求）

1. **改完必验收**：每完成一轮文件修改，停下来向用户汇报——改了哪些文件、为什么改、怎么验证（给出可操作的验收方式，例如"跑 `npm run dev` 打开 XX 页面试试 YY"），然后**等用户确认**。
2. **验收通过才 commit**：用户明确说验收没问题后，才能 `git commit`。**绝不跳过验收擅自提交**。
3. **一轮验收 = 一次 commit**：一轮改动提交一次，不要把多轮改动混在一起；用户验收时提出问题，改完后重新请验收。
4. **commit message 规范**：`type: 中文描述`，type 取 `feat / fix / docs / refactor / style / test / chore`，风格参考现有提交历史。
5. 除非用户明确要求，不要 `git push`。

## 其他

- 面向读者的假设：读者有 Java/Spring 功底，文档与注释中尽量用 Java 类比解释前端概念。
- 不确定的事（比如要不要加新依赖、改公共结构）先问用户，别自作主张。

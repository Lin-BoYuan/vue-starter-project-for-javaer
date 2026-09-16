# 第 11 章 · CSS 实战：从盒模型到暗色主题

> 🎯 **本章目标**：补齐 CSS 的实战能力——Vue 的 scoped 样式原理、Flex/Grid 两大布局引擎、CSS 变量，以及本项目已经跑通的**暗色主题**机制。目标不是背属性，而是建立"看到布局就知道怎么拆"的条件反射。

**前置知识**：第 1 章（盒模型概念）。

---

## 1. Vue 的样式隔离：scoped 的原理

```vue
<style scoped>
.title { color: var(--color-primary); }
</style>
```

编译后（伪代码）：

```html
<h2 class="title" data-v-7ba5bd90>仪表盘</h2>
<style>
.title[data-v-7ba5bd90] { color: var(--color-primary); }   /* 选择器被加上"指纹" */
</style>
```

每个组件实例拿到唯一 hash，选择器变成"类名 + 指纹"——**同名 class 在不同组件里互不打架**。这解决了全局 CSS 的头号痛点（类名冲突），也是后端同学写前端最该先开的东西。

**深浅结合的实践**（本项目 `src/styles/`）：

| 层 | 文件 | 作用域 | 放什么 |
|---|---|---|---|
| 全局 | `styles/main.css` | 全站 | reset、CSS 变量、body 字体 |
| 全局 | `styles/common.css` | 全站 | 跨页面复用的 `.btn/.card/.data-table/.form-*` |
| 组件 | `<style scoped>` | 单组件 | 该组件私有的布局与微调 |

> ⚠️ **坑**：scoped 管不到"子组件的内部 DOM"。想给 `<el-table>` 之类的子组件内部改样式，需要 `:deep(.el-table__row)` 选择器。本项目尽量用子组件的 props/slot 解决，所以你只会在 docs 里遇到这个问题，代码里很少。

---

## 2. CSS 变量与暗色主题（本项目已实现，看懂它）

> 🔍 `src/styles/main.css` + `src/composables/useTheme.ts`

```css
:root {                       /* 根元素（html）上定义 = 全局可用 */
  --color-primary: #409eff;
  --color-bg-card: #ffffff;
}

html.dark {                   /* html 加 .dark 类后，同名变量被覆盖 */
  --color-bg-card: #1a1e27;
}
```

```css
/* 组件里"引用"变量而不是写死颜色 */
.card { background: var(--color-bg-card); }
```

```typescript
// 切换主题 = 给 html 切一个类，所有 var() 引用处瞬间换装
function applyToDocument(): void {
  document.documentElement.classList.toggle('dark', isDark.value)
}
```

> ☕ **Java 视角**：CSS 变量 ≈ **配置中心**（Nacos/Apollo）：样式代码不写死值，全引配置 key；换主题 = 换一份 profile 配置，业务代码零改动。这比"写两套样式表"优雅得多——Element Plus 的暗色主题（第 12 章）也是同样的 `.dark` 机制，所以两者能联动。

---

## 3. Flex：一维布局的万能钥匙

> 🔍 主教材：`src/layouts/AdminLayout.vue`——整个后台的骨架就是两层 Flex。

```css
.admin-layout {
  display: flex;            /* 子元素水平排列（主轴默认水平） */
  min-height: 100vh;
}
.sidebar {
  width: 220px;
  flex-shrink: 0;           /* ① 不许被压缩 */
}
.main-area {
  flex: 1;                  /* ② 吃掉剩余全部宽度 */
  min-width: 0;             /* ③ 经典修复：允许内部表格收缩而不撑破父容器 */
  display: flex;
  flex-direction: column;   /* 主轴换成垂直：顶栏在上、内容在下 */
}
.content { flex: 1; }       /* 内容区吃掉剩余高度 */
```

三行注释覆盖了 Flex 的核心心智：

| 属性 | 作用 | 记法 |
|---|---|---|
| `justify-content` | 主轴对齐 | `space-between` 两端、`center` 居中 |
| `align-items` | 交叉轴对齐 | `center` 垂直居中神器 |
| `gap` | 子元素间距 | 取代各种 margin hack |
| `flex: 1` | 弹性占位 | ≈ `width: calc(100% - 其余)` 的自动版 |
| `flex-direction: column` | 主轴换竖 | 一行切横竖 |

**高频布局配方**（全在本项目里出现过）：左右侧栏布局（上面）、居中卡片（登录页 `display:flex; align-items:center; justify-content:center`）、行内表单（UsersView `.toolbar`）、图表底对齐柱状图（BarChart `align-items: flex-end`）。

---

## 4. Grid：二维布局，一行顶十行

> 🔍 `src/views/DashboardView.vue` 的统计卡片区：

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));  /* ⭐ 响应式列数 */
  gap: 16px;
}
```

`repeat(auto-fit, minmax(200px, 1fr))` 翻译成人话：**"每列最窄 200px，能塞几列塞几列，剩余宽度平分"**——宽屏 4 列、中屏 2 列、窄屏 1 列，**零媒体查询**实现响应式。本项目仪表盘、个人设置页、弹窗表单的双列都是它。

`ProfileView.vue` 的 `.form-row` 是固定两列版：`grid-template-columns: 1fr 1fr`（≈ HTML 表格的两列，但只管布局）。

> **Flex vs Grid 选型**：一维流（一行/一列）用 Flex；二维网格（N 行 M 列）用 Grid。先 Grid 后 Flex，都是"display 一行 + 子项约束几行"的事。

---

## 5. 值得认识的 CSS 细节（本项目用到的全在这里）

| 写法 | 出处 | 一句话解释 |
|---|---|---|
| `box-sizing: border-box` | `main.css` 全局 | 宽高含 padding/border，告别"加了 padding 就爆宽" |
| `color-mix(in srgb, var(--c) 10%, transparent)` | 各处标签底色 | 用主色调出 10% 透明度的底，换主题自动跟 |
| `position: sticky; top: 0` | `AdminTopBar.vue` | 滚动吸顶（相对滚动容器，不脱离文档流） |
| `position: absolute + 父 relative` | 顶栏下拉菜单 | 子绝父相：下拉框贴着触发器定位 |
| `:hover / :focus / :disabled` | `common.css` | 伪类：状态驱动的样式，不用 JS |
| `transition: all .2s` | 按钮/主题 | 属性变化时平滑过渡（主题切换的"呼吸感"） |
| `@keyframes spin + animation` | `common.css` | 加载图标旋转：定义关键帧 → 引用 |
| `white-space: pre-wrap` | 文章详情 | 保留正文换行符渲染 |
| `text-overflow: ellipsis` | `common.css` 的 tag/table 配合 | 超长文字省略号 |
| `inset: 0` | 弹窗遮罩 | top/right/bottom/left 全 0 的简写 |
| `line-height: 1.8` | 文章正文 | 行高用倍数而非像素，随字号自适应 |
| `user-select: none / cursor: pointer` | 按钮 | 可点的"暗示"要给足 |

---

## 6. 一个组件的样式该写多长？（工程判断）

以 `PaginationBar.vue` 为例：结构十几行，样式五六十行——**前端页面大部分"代码量"其实是样式**。给后端的建议：

1. 先写结构（`<template>`），用公共 class 兜底（`.card .btn .form-input`），页面就能看；
2. 再写私有布局（Flex/Grid 的骨架几行）；
3. 微调（间距、色值）最后做，并且**优先改 CSS 变量**而不是散落的魔法值。

样式永远可以迭代，**结构先对**更重要——和"先让接口跑通再优化 SQL"一个道理。

---

## 7. 🔍 结合本项目源码（本章精读材料）

| 文件 | 看什么 |
|---|---|
| `src/styles/main.css` | ⭐ reset、CSS 变量、`.dark` 覆盖、`@import` 顺序 |
| `src/styles/common.css` | 全局原子类：btn/card/table/form/tag/loading 动画 |
| `src/layouts/AdminLayout.vue` | ⭐ Flex 两层布局 + 折叠侧栏的类切换动画 |
| `src/views/DashboardView.vue` | Grid `auto-fit` 响应式网格 |
| `src/views/LoginView.vue` | 渐变背景 + 居中卡片 |
| `src/components/BarChart.vue` | flex-end 底对齐 + transition 动画柱状图 |
| `src/components/ConfirmDialog.vue` | fixed 遮罩 + 弹窗居中 |
| `src/composables/useTheme.ts` | 主题的 JS 侧：类切换 + 持久化 |

---

## ✏️ 动手练习

1. **主题定制**：把 `--color-primary` 改成紫色 `#7c3aed`，刷新观察全站（按钮、标签、菜单高亮）跟着变——这就是变量化的复利。
2. **Grid 练习**：把仪表盘 `.charts-row` 改成"宽屏 2:1、窄屏单列"（提示：`grid-template-columns: 2fr 1fr` + 一个媒体查询 `@media (max-width: 768px)`）。
3. **思考题**：为什么 `.dark` 写在 `html` 上而不是 `body` 上？（提示：Element Plus 暗色也认 `html.dark`；且 html 是所有元素的祖先，选择器命中最稳）

## 📌 本章小结

- `scoped` = 编译期给选择器加指纹；全局原子类 + 组件私有样式分层。
- CSS 变量 = 前端的配置中心；暗色主题 = 换一组变量值。
- Flex 管一维、Grid 管二维；`flex:1`、`min-width:0`、`auto-fit/minmax` 是三大高频配方。
- 结构 > 布局 > 微调；先跑通再变美。

**下一章** → [12-element-plus.md](./12-element-plus.md)：企业级组件库的正确打开方式。

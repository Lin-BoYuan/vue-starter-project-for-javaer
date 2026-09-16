# 第 4 章 · Vue 组件与模板语法

> 🎯 **本章目标**：看懂 `.vue` 单文件组件（SFC）的三段式结构，掌握模板层的全部常用语法——插值、条件、循环、绑定、事件、表单。**以本项目的登录页为教材**，读完后你就能看懂本项目 80% 的 `<template>`。

**前置知识**：第 3 章（TS）。

---

## 1. SFC：单文件组件

Vue 把一个"组件"（页面上可复用的一块 UI + 它的逻辑 + 它的样式）装进一个 `.vue` 文件：

```vue
<script setup lang="ts">
// ① 逻辑区：TS 代码。setup 后缀 = 组合式 API 写法（下一章展开）
import { reactive } from 'vue'

const form = reactive({ username: '', password: '' })
function submit() { /* ... */ }
</script>

<template>
  <!-- ② 结构区：增强版 HTML。{{ }} 插值、指令都以 v- 开头 -->
  <form @submit.prevent="submit">
    <input v-model="form.username" />
    <button>登录（{{ form.username }}）</button>
  </form>
</template>

<style scoped>
/* ③ 样式区：scoped = 只作用于本组件（第 11 章讲原理） */
form { max-width: 400px; }
</style>
```

> ☕ **Java 视角**：一个组件 ≈ 一个"自带模板的自定义标签"。`<UserFormDialog />` 用起来的感觉，就像 Thymeleaf 的自定义 fragment，但它**带状态、带逻辑、可复用**。整个页面就是组件树的组装。

---

## 2. 模板语法全景（对着本项目源码读）

### 2.1 插值与绑定

| 语法 | 全称 | 作用 | 项目实例 |
|---|---|---|---|
| `{{ 表达式 }}` | 插值 | 输出文本（自动转义，防 XSS） | `{{ loading ? '登录中…' : '登 录' }}` |
| `:attr` / `v-bind:attr` | v-bind | 把**JS 表达式**绑到 HTML 属性 | `<img :src="user.avatar" />` |
| `@event` / `v-on:event` | v-on | 绑定事件处理函数 | `@click="openEdit(user)"` |
| `v-model` | — | 表单元素双向绑定 | `<input v-model="form.username">` |

> ⚠️ 模板里只能放**单个表达式**，不能写 `if` 语句块。逻辑都写在 `<script setup>` 里，模板保持"傻而直白"。

### 2.2 条件渲染：v-if vs v-show

```vue
<span v-if="errors.username" class="form-error">{{ errors.username }}</span>
<!-- v-else-if / v-else 也可接续；详见 LoginView.vue -->
```

| | `v-if` | `v-show` |
|---|---|---|
| false 时 | **DOM 里根本没有这个节点** | 节点在，只是 `display: none` |
| 开销 | 切换贵（重建 DOM） | 初次贵（永远渲染） |
| 场景 | 大部分场景（默认用它） | 频繁切换显隐的小元素 |

本项目仪表盘的"加载中 → 出错 → 正常"三态就是 `v-if / v-else-if / v-else` 链（`DashboardView.vue`）。

### 2.3 列表渲染：v-for + :key

```vue
<tr v-for="user in users" :key="user.id">
  <td>{{ user.id }}</td>
</tr>
```

- **`:key` 必须写**，且用稳定唯一值（id），**不要用数组下标**：Vue 靠 key 识别"哪个节点对应哪条数据"，下标在增删/排序时会导致错乱复用（经典面试题 + 经典线上 bug）。
- 需要"第几项"时：`v-for="(item, index) in list"`。
- 也可以遍历对象和数字：`v-for="n in 5"`。

> ☕ **Java 视角**：`v-for` ≈ Thymeleaf 的 `th:each`，但 key 机制让 Vue 能**精确增量更新** DOM，而不是整段重渲染。

### 2.4 v-model：双向绑定的真相

```vue
<input v-model="form.username" />
<!-- 等价于 ↓（v-model 只是这个的语法糖） -->
<input :value="form.username" @input="event => form.username = event.target.value" />
```

修饰符三件套：

| 修饰符 | 作用 | 项目实例 |
|---|---|---|
| `.trim` | 自动去首尾空格 | 用户搜索框 `v-model.trim="filters.keyword"` |
| `.number` | 值自动转数字 | 状态下拉 `v-model.number="form.status"`（select 的 value 是字符串！） |
| `.lazy` | input 事件改为 change | — |

不同元素绑定的东西不同：`input` ↔ 文本、`checkbox` ↔ 布尔、`radio` ↔ value、`select` ↔ 选中项。登录页把四种都集齐了，建议通读。

### 2.5 class 与 style 的动态绑定（高频！）

```vue
<!-- 对象语法：键=类名，值=布尔。true 才加 -->
<span class="tag" :class="user.status === 1 ? 'tag-success' : 'tag-danger'">

<!-- 基础 class 和动态 :class 可以共存，Vue 会合并 -->
<button class="page-btn" :class="{ active: p === page }">

<!-- 数组语法（较少用） -->
<p :class="[errorClass, { hidden: isHidden }]">

<!-- style 对象绑定 -->
<div :style="{ height: barHeight(count) }">
```

本项目 `PaginationBar.vue`、`StatCard.vue`、`BarChart.vue` 全是这三种写法的样板。

### 2.6 事件处理的常用姿势

```vue
<button @click="save">方法名</button>
<button @click="save(arg)">带参调用</button>
<button @keyup.enter="search">按键修饰符：回车才触发</button>
<form @submit.prevent="submit">.prevent：阻止默认行为（不刷新页面），≈ e.preventDefault()</form>
<div @click.self="close">.self：只有点到自己（不含子元素）才触发（ConfirmDialog 的遮罩关闭）</div>
```

> 💡 事件对象：方法名写法默认第一个参数是原生事件对象 `event`；内联调用需要时写 `@click="go($event)"`。

---

## 3. 组件的使用方式

`<script setup>` 里 import 进来的组件，**模板里直接当标签用**（自动注册，不用再声明）：

```vue
<script setup lang="ts">
import ConfirmDialog from '@/components/ConfirmDialog.vue'
</script>

<template>
  <ConfirmDialog :open="deleteTarget !== null" title="删除用户" @confirm="confirmDelete" />
</template>
```

命名约定：组件名用**大驼峰**（`ConfirmDialog`）；模板里写大驼峰 `<ConfirmDialog>` 或 kebab-case `<confirm-dialog>` 都行，本项目统一大驼峰。

---

## 4. 🔍 结合本项目源码（本章精读材料）

| 文件 | 看什么 |
|---|---|
| `src/views/LoginView.vue` | ⭐ 主教材：v-model 四种元素、`.prevent`、`v-if` 校验错误、`:disabled`、插值三元 |
| `src/views/DashboardView.vue` | `v-if/v-else-if/v-else` 三态链、`v-for` 组件列表、组件的 props 传递 |
| `src/views/UsersView.vue` | `v-for` 表格、`:class` 对象语法、`@click` 带参、`v-model.trim`/`.number` |
| `src/components/ConfirmDialog.vue` | `v-if` + `Teleport`、`@click.self` |
| `src/components/PaginationBar.vue` | `:class` 对象语法、`:disabled`、`@change` |
| `src/styles/common.css` | 模板里那些 class 名对应的全局样式 |

---

## ✏️ 动手练习

1. **登录页加"显示密码"**：在 `LoginView.vue` 加一个 checkbox（`v-model="showPassword"`），把密码框改成 `:type="showPassword ? 'text' : 'password'"`。
2. **给仪表盘文章列表加"无分类"标签**：当 `article.category === '随笔'` 时额外显示一个 `<span class="tag tag-warning">随笔</span>`（用 `v-if`）。
3. **思考题**：`v-for` 的列表如果用 `index` 当 key，在"删除中间一项"时会发生什么？（提示：后续项的 key 全部前移，Vue 会复用错误的 DOM）

<details><summary>练习提示</summary>

1. `<input v-model="showPassword" type="checkbox" />` + `:type` 三元。2. `<span v-if="article.category === '随笔'" class="tag tag-warning">随笔</span>`。3. Vue 按 key 对比发现"key=2 原来是 B 现在变成了 C"，就地更新文本而不是移动节点——如果行内有输入框等**自身状态**，状态会串行。

</details>

## 📌 本章小结

- SFC = `<script setup>`（逻辑）+ `<template>`（结构）+ `<style scoped>`（样式）。
- 指令口诀：**`:` 绑属性，`@` 绑事件，`v-if` 决定存在，`v-for` 复制节点，`v-model` 双向绑**。
- `:key` 用稳定 id；`v-model` 的 `.trim`/`.number` 修饰符是高频细节。
- 模板写表达式，逻辑进 script——保持模板可读。

**下一章** → [05-composition-api.md](./05-composition-api.md)：`<script setup>` 里的核心机制——响应式系统。

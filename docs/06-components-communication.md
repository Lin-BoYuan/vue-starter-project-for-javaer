# 第 6 章 · 组件通信与逻辑复用

> 🎯 **本章目标**：掌握 Vue 组件之间全部五种"对话方式"——props（父→子）、emits（子→父）、v-model（双向）、provide/inject（跨层注入）、Pinia store（全局，第 8 章），以及前端特色的逻辑复用方式：**组合式函数（composables）**。

**前置知识**：第 5 章。

---

## 1. props：父 → 子 传数据（只读！）

```vue
<!-- 子组件 StatCard.vue：类型式声明 props（TS 泛型写法，编辑器全类型） -->
<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon?: string                       // 可选 prop
  accent?: 'primary' | 'success' | 'warning' | 'danger'
}>()
</script>
```

```vue
<!-- 父组件 DashboardView.vue -->
<StatCard :label="card.label" :value="card.value" :icon="card.icon" :accent="card.accent" />
```

三条铁律：

1. **单向数据流**：子组件**不能改 props**。想改？让父组件改（数据权威在父）。
2. 要在子组件里"加工"props → 用 computed 派生。
3. prop 名在声明和 `:prop-name` 传参时用 camelCase，HTML 里 kebab-case 亦可（Vue 自动匹配）。

> ☕ **Java 视角**：props ≈ **构造函数参数 / 不可变 VO 的字段**。子组件是纯函数：`f(props) → 视图`。谁调用谁负责传参，组件越"傻"越可复用。

---

## 2. emits：子 → 父"喊话"

子组件不直接操作父组件的数据，而是**声明并触发事件**，父组件监听后自己处理：

```vue
<!-- 子组件 ConfirmDialog.vue -->
<script setup lang="ts">
const emit = defineEmits<{ confirm: []; cancel: [] }>()   // 事件名 + 参数元组的类型声明
</script>
<template>
  <button @click="emit('confirm')">确定</button>
</template>
```

```vue
<!-- 父组件 UsersView.vue：监听子组件事件 -->
<ConfirmDialog @confirm="confirmDelete" @cancel="deleteTarget = null" />
```

> ☕ **Java 视角**：emits ≈ **回调接口 / 观察者模式**。子组件发布事件，不关心谁听、听后干什么——控制反转，天然解耦。对比"子组件直接改父组件状态"（≈ 在别人的类里 setter 乱调），事件流是可预测的。

**完整数据流（以删除用户为例）**：

```
UsersView(父) 把 user 传给 ConfirmDialog(子)？否——只传 open/message。
子组件只 emit('confirm')；父组件收到后调 deleteUser(user.id)。
数据权威始终在父组件，子组件是无状态 UI。
```

---

## 3. defineModel：组件上的 v-model（双向）

在自定义组件上也能用 `v-model`（本项目在 el-dialog 上用了：`v-model="formOpen"`）。Vue 3.4+ 提供了 `defineModel` 宏：

```vue
<script setup lang="ts">
const visible = defineModel<boolean>()       // 声明一个 v-model
function close() { visible.value = false }   // 改它 = 发出 update:modelValue 事件
</script>
<template>
  <el-dialog v-model="visible">...</el-dialog>
</template>
```

父组件用 `<MyDialog v-model="open" />`——`open` 变了传下去，子组件改了自动传回来。**本质仍是 props + emits 的语法糖**，所以"单向数据流"并没有被破坏：是父子约定好共同维护同一个值。

---

## 4. slots：把"模板片段"传给子组件

props 传**数据**，slot 传**模板**（一段带上下文的 UI）。本项目 `ElementUsersView.vue` 里大量使用了 Element Plus 的插槽：

```vue
<!-- 使用别人的插槽（el-table 的列模板、el-dialog 的底部按钮） -->
<el-table-column label="操作">
  <template #default="{ row }">          <!-- #default = 默认插槽；{ row } = 插槽传回的数据 -->
    <el-button @click="openEdit(row)">编辑</el-button>
  </template>
</el-table-column>

<el-dialog>
  <template #footer>                     <!-- 具名插槽：内容渲染到弹窗底部 -->
    <el-button @click="formOpen = false">取消</el-button>
  </template>
</el-dialog>
```

自己定义插槽只要在子组件模板里放 `<slot />`（默认）或 `<slot name="footer" />`（具名）。

> ☕ **Java 视角**：slot ≈ **模板方法模式的钩子**：父类（组件）定好流程骨架，把某一步留空让调用方填内容。`{ row }` 这种带数据的插槽 ≈ 回调时把上下文传给 lambda。

---

## 5. provide / inject：跨层注入（前端版 IoC）

一层 props 传值很清晰，**穿透七八层**（布局 → 侧栏 → 顶栏 → …）就灾难了（术语：prop drilling）。provide/inject 让祖先"发布"，任意后代"注入"：

```typescript
// ① 定义 key（src/constants/keys.ts）
//    必须是同一个 Symbol 实例才能配对——所以放在公共模块里共享
export const THEME_KEY = Symbol('theme')

// ② 祖先 provide（src/layouts/AdminLayout.vue）
provide(THEME_KEY, { isDark, toggleTheme })

// ③ 后代 inject（src/components/AdminTopBar.vue）
const injected = inject(THEME_KEY, () => ({ isDark: ref(false), toggleTheme: () => {} }), true)
const { isDark, toggleTheme } = injected
```

> ☕ **Java 视角**：这就是 **Spring IoC** 的迷你版——`provide` ≈ `@Bean` 往容器注册，`inject` ≈ `@Autowired` 按类型取。区别：Vue 的"容器"是**组件树**（祖先=容器），不是全局容器；真正全局的依赖请用 Pinia（下一章）。

**克制使用**：provide/inject 隐式性太强（看模板看不出数据从哪来），适合"主题、当前用户、国际化"这类**环境性数据**；业务数据还是老老实实 props + emits。

---

## 6. 组合式函数（composables）：逻辑的复用与抽取

组件间的**状态**通信靠上面五种；组件内的**逻辑**复用靠组合式函数——就是一个"用了响应式 API 的普通函数"，约定以 `use` 开头：

```typescript
// src/composables/useLoading.ts —— 全项目最短的 composable
export function useLoading(initial = false) {
  const loading = ref(initial)                     // 状态
  async function run<T>(task: () => Promise<T>) {  // 行为
    loading.value = true
    try { return await task() } finally { loading.value = false }
  }
  return { loading, run }                          // 状态 + 行为打包给调用方
}
```

```typescript
// 任何页面一行接入
const { loading, run } = useLoading()
const result = await run(() => getUserPage(query))   // 期间 loading 自动 true
```

本项目的三个 composable（都值得通读）：

| 文件 | 职责 | 复用处 |
|---|---|---|
| `useLoading.ts` | loading 状态与异步操作绑定 | 登录页、仪表盘、用户、文章 |
| `usePagination.ts` | page/pageSize/total 三件套状态 | 用户、文章列表 |
| `useTheme.ts` | 暗色主题持久化 + 应用到 DOM | 布局、顶栏（模块级单例） |

> ☕ **Java 视角**：composable ≈ **可实例化的工具 Bean / 模板类**。每次 `useLoading()` 得到**独立实例**（≈ new）；`useTheme` 把状态放在模块顶层则 ≈ 单例。 mixin（Vue2 的复用方式，来源不明的隐式合并）已被它取代——就像 Java 里组合优于继承。

**什么时候抽 composable？** 同一段"状态+逻辑"组合出现在第二个组件时。过早抽象不如复制粘贴两遍再抽。

---

## 7. 🔍 结合本项目源码（本章精读材料）

| 文件 | 看什么 |
|---|---|
| `src/components/StatCard.vue` | 纯展示组件：props 进、渲染出，无状态 |
| `src/components/ConfirmDialog.vue` | emits 类型声明 + `@click.self` 关闭 |
| `src/views/UsersView.vue` | ⭐ 父子协作全景：三个子组件的 props/emits 事件流 |
| `src/components/UserFormDialog.vue` | watch(props.open) 初始化表单 + emit('save', form) 上报 |
| `src/views/element-demo/ElementUsersView.vue` | 使用第三方组件的 slots（#default/{ row }、#footer） |
| `src/constants/keys.ts` + `AdminLayout.vue` + `AdminTopBar.vue` | provide/inject 三件套 |
| `src/composables/` 全目录 | 三种 composable 的形态（实例型/单例型/纯状态型） |

---

## ✏️ 动手练习

1. **给 StatCard 加点击事件**：声明 `emits<{ click: [] }>()`，模板根元素 `@click="emit('click')"`；在仪表盘的"文章总数"卡上接 `@click="router.push('/articles')"`。
2. **抽一个 useTitle**：新建 `composables/useTitle.ts`，`useTitle(title)` 把 `document.title` 设为传入值（onUnmounted 恢复），替换 `router/index.ts` 里 afterEach 的手动设置。
3. **思考题**：ConfirmDialog 为什么设计成"只 emit 不自己关自己"？如果它在 `confirm` 后自己把 open 置 false，会破坏什么？

<details><summary>练习提示</summary>

3. open 是父组件的 prop（单向数据流）。子组件私改 prop 会让"数据权威"分裂：父组件的 deleteTarget 还是旧值，下次想打开同一个弹窗时若值没变，Vue 可能不触发 watch ——状态机就坏了。

</details>

## 📌 本章小结

- 通信选型口诀：**父子 props/emits，双向 defineModel，跨层 provide/inject，全局 Pinia**。
- 单向数据流是可维护性的根基：数据权威唯一，子组件纯函数化。
- slot 传模板 ≈ 模板方法钩子；`{ row }` 作用域插槽是表格组件的灵魂。
- composable 是"状态+逻辑"的复用单元，第二次用到时再抽。

**下一章** → [07-router.md](./07-router.md)：URL 与页面的映射——Vue Router。

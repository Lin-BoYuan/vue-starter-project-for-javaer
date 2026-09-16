# 第 12 章 · 组件库：Element Plus

> 🎯 **本章目标**：企业前端 90% 用组件库开发。本章以 Element Plus 为例：怎么接入、和手写方案的**逐项对照**（本项目特意保留了同一个页面的两种实现）、声明式与命令式两种弹窗范式，以及"为什么构建时警告 chunk 太大"。

**前置知识**：第 10-11 章。

---

## 1. 为什么企业都用组件库

手写一套表格/弹窗/日期选择器 = 几千行 CSS 和一堆边界情况（键盘导航、无障碍、虚拟滚动…）。组件库把这些"重体力活"产品化了：**你出数据和行为，它出 UI 和交互**。

> ☕ **Java 视角**：组件库 ≈ Spring 全家桶之于 JavaWeb——底层的 Servlet（原生 CSS/JS）值得懂，但生产没人裸写。**先手写后组件库**（本教程的顺序）的价值在于：你看得懂组件库封装掉的东西，出问题时知道往哪儿查。

主流选择：**Element Plus**（国内管理后台事实标准）、Ant Design Vue、Naive UI。学一个，其他照猫画虎。

---

## 2. 接入（本项目已配好，看两处）

```typescript
// src/main.ts —— 全量注册（教学项目图省事）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'                    // 组件样式
import 'element-plus/theme-chalk/dark/css-vars.css'     // 暗色主题（也是认 html.dark，和第 11 章方案联动）
app.use(ElementPlus)
```

> 💡 **真实项目的标准姿势是按需引入**：`unplugin-vue-components` 自动按用到的组件引代码——这正是你构建时看到 *"Some chunks are larger than 500 kB"* 警告的解药。全量注册后 Element Plus 全部进了首屏包。教学项目追求"看得懂"，企业项目追求"包更小"，两者都对。

---

## 3. ⭐ 同一页面的两种实现（本章核心资产）

本项目有一件大多数教程没有的东西：**功能完全相同的两个用户管理页**——

| | 手写版 | 组件库版 |
|---|---|---|
| 路由 | `/users` | `/element-demo/users` |
| 文件 | `views/UsersView.vue` | `views/element-demo/ElementUsersView.vue` |

**建议开着两个标签页对照读。** 逐项对照表：

| 能力 | 手写实现 | Element Plus 实现 |
|---|---|---|
| 表格 | `<table class="data-table">` + `v-for` | `<el-table :data="users">` + `<el-table-column>` |
| 列表行渲染 | `v-for="user in users"` | **组件内部遍历**（你只声明列） |
| 单元格自定义 | 直接写模板 | **作用域插槽** `<template #default="{ row }">` |
| 状态开关 | `.tag-btn` 按钮伪装 | `<el-switch :model-value="row.status === 1" />` |
| 角色标签 | `.tag .tag-warning` | `<el-tag type="warning">` |
| 分页 | `PaginationBar`（自研受控组件） | `<el-pagination layout="total, sizes, prev, pager, next">` |
| 删除确认 | `<ConfirmDialog>` 声明式 | `ElMessageBox.confirm()` 命令式 |
| 操作反馈 | 页面内错误条 | `ElMessage.error()` 全局吐司 |
| 表单弹窗 | `UserFormDialog` + 手写校验 | `<el-dialog>` + `<el-form :rules>` |
| 加载中 | 三态渲染 `v-if` | `v-loading` 指令（一行遮罩） |
| 搜索表单 | 手写 `.toolbar` 布局 | `<el-form inline>` |

关键代码段（组件库版）：

```vue
<!-- 表格：数据进去，UI 出来；列自定义走作用域插槽 -->
<el-table :data="users" v-loading="loading">
  <el-table-column prop="username" label="用户名" />
  <el-table-column label="角色">
    <template #default="{ row }">          <!-- row = 当前行数据，插槽传回 -->
      <el-tag :type="row.role === 'admin' ? 'warning' : 'info'">
        {{ row.role === 'admin' ? '管理员' : '编辑' }}
      </el-tag>
    </template>
  </el-table-column>
</el-table>
```

```typescript
// 表单校验：声明规则，框架自动执行（对比手写版逐字段 validate 函数）
const rules: FormRules<UserForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度 2 ~ 20 个字符', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}

// 通过组件 ref 拿实例、调方法——命令式 API 的常见形态
const formRef = ref<FormInstance>()
const valid = await formRef.value?.validate().catch(() => false)
if (!valid) return
```

> 💡 **组件 ref**（`ref<FormInstance>()` 绑在 `<el-form ref="formRef">` 上）是调用组件公开方法的标准通道——类似 Java 拿到对象的引用调它的方法，但前提是组件把方法"暴露"了出来（`defineExpose`）。

---

## 4. 声明式 vs 命令式：两种 UI 范式的交锋

| | 声明式（手写 ConfirmDialog / el-dialog + v-model） | 命令式（ElMessageBox.confirm / ElMessage） |
|---|---|---|
| 写法 | 模板里声明组件 + open prop | `await ElMessageBox.confirm(...)` 一行 |
| 状态 | 在父组件手里（可预测） | 框架内部（看不见） |
| 适合 | 复杂弹窗、需要表单/嵌套内容 | 简单确认、轻提示 |
| 心智 | Vue 的响应式正统 | jQuery 时代的"调一下就弹"复活版 |

实战结论：**轻提示用命令式（省代码），承载表单/复杂内容的弹窗用声明式（可控）**。本项目两种都写了一遍，就是让你有判断依据。

---

## 5. 组件库使用心法（迁移到任何组件库都成立）

1. **看官方文档的 Props/Events/Slots 三张表**——组件库的 API 面貌永远是这三样（props 传配置、events 收事件、slots 塞内容），第 6 章的知识直接平移。
2. **数据和行为仍然在你手里**：`el-table` 不管增删改查，`.vue` 页面的 fetchUsers/handleSave 一个不少——组件库只接管了"长相和交互"。
3. **别过度魔改**：深度覆盖组件库样式（`:deep()` 嵌套穿五层）是维护性灾难，能用主题变量/props 配置解决的别硬改 CSS。
4. **库是可替换的**：本项目 api/stores/composables 层对 Element Plus **零依赖**——换 Naive UI 只改 views 层。分层解耦的复利。

---

## 6. 🔍 结合本项目源码（本章精读材料）

| 文件 | 看什么 |
|---|---|
| `src/main.ts` | 全量注册 + 两个 css + 暗色联动 |
| `src/views/element-demo/ElementUsersView.vue` | ⭐ 对照主教材：表格/插槽/分页/弹窗/消息 |
| `src/views/UsersView.vue` | 手写版对照物（开着两屏对比读） |
| `src/components/ConfirmDialog.vue` vs `ElMessageBox` | 声明式与命令式弹窗范式 |
| `package.json` + 构建输出 | chunk 警告现场，理解按需引入的动机 |

---

## ✏️ 动手练习

1. **换肤**：给 el-button 换主色——引入 `--el-color-primary: var(--color-primary);` 到全局 CSS（Element Plus 的颜色也是 CSS 变量），看它和第 11 章自建变量如何打通。
2. **加一列**：给 el-table 加"注册时间"列并用 `formatDateTime` 格式化（对照手写版的写法，体会 `#default` 插槽）。
3. **思考题**：`v-loading` 指令一行顶手写三态渲染，那手写三态还有价值吗？（提示：表格内 loading ≠ 整页数据 loading；骨架屏、错误重试、空状态组件库给你了吗？）

<details><summary>练习提示</summary>

3. `v-loading` 只解决"转圈"。空状态（el-table 内置 empty 但样式有限）、错误重试、骨架屏仍要自己组织——三态渲染的**思维**不会过时，只是实现手段变多。

</details>

## 📌 本章小结

- 组件库 = UI 重体力活的外包；API 三张表：Props / Events / Slots。
- 同一页面的手写版和 EP 版是本章最大资产——**看得懂封装前，才驾驭得了封装后**。
- 轻提示命令式、复杂弹窗声明式；`v-loading` 省事，三态思维仍在。
- 业务逻辑层（api/stores）与组件库零耦合，库可替换——分层解耦的价值实证。

**下一章** → [13-build-deploy.md](./13-build-deploy.md)：最后一公里——构建、部署与你的下一步。

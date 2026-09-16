# 第 10 章 · 实战套路：真实页面的通用模式

> 🎯 **本章目标**：前 9 章学了所有"字"，本章教你"词组和句型"。管理后台 90% 的页面由四类套路拼成：**列表页、表单、弹窗、三态渲染**。读完本章，你应该能不看文档独立写出第 8 个类似的管理页面。

**前置知识**：第 5-9 章。

---

## 1. 套路一：三态渲染（每个页面都要有）

任何"页面里要展示后端数据"的地方，本质上都是三个状态：

```vue
<!-- 本项目 src/views/DashboardView.vue -->
<div v-if="loading && !stats" class="empty-state">          <!-- ① 加载中 -->
  <span class="loading-spinner"></span>
  <p>正在加载统计数据…</p>
</div>
<div v-else-if="errorMessage" class="empty-state">          <!-- ② 出错：必须给重试出口 -->
  <p>⚠️ {{ errorMessage }}</p>
  <button class="btn btn-primary" @click="loadStats">重试</button>
</div>
<template v-else-if="stats"> …正常内容… </template>          <!-- ③ 正常 -->
```

配套的样板代码（出现频率极高，值得背下来）：

```typescript
const stats = ref<DashboardStats | null>(null)   // 数据本体（null = 还没拿到）
const errorMessage = ref('')                     // 错误信息（'' = 没错）
const { loading, run } = useLoading()            // 加载标志（composable，第 6 章）

async function loadStats(): Promise<void> {
  errorMessage.value = ''                        // 每次先清错误
  try {
    stats.value = await run(getDashboardStats)   // run 自动管 loading
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '加载失败'  // 错误归一（第 9 章）
  }
}

onMounted(loadStats)                             // 进页面先拉一次
```

> 💡 **判断一个管理页面写得专业与否，先看它有没有 ②：** 只写 happy path 的页面，第一次网络抖动就会让用户白屏且无法自救。

---

## 2. 套路二：列表页（搜索 + 分页 + 表格 + CRUD）

> 🔍 完整体在 `src/views/UsersView.vue`，文章列表是它的复刻。骨架拆解：

```
┌──────────────────────────────────────────────┐
│ 页头：标题 + [＋新增] 按钮                      │
│ 错误条：v-if="errorMessage"（操作失败的提示位）  │
│ 搜索区：关键词输入(.trim + @keyup.enter) + 筛选下拉 + [搜索] │
│ 表格：v-for 行 + 状态开关 + 操作列（编辑/删除）   │
│ 分页条：PaginationBar（受控组件）               │
└──────────────────────────────────────────────┘
```

**数据流五步曲**（和后端的 Controller-Service 一样有固定形状）：

```typescript
const users = ref<UserAccount[]>([])              // ① 列表数据
const { page, pageSize, total, reset } = usePagination()   // ② 分页状态（composable）
const filters = reactive({ keyword: '', status: '' })      // ③ 筛选状态（与分页分离！）

async function fetchUsers(): Promise<void> {      // ④ 唯一的拉取入口
  const result = await run(() => getUserPage({
    page: page.value, pageSize: pageSize.value,   //    分页 + 筛选在请求时合并
    keyword: filters.keyword, status: filters.status,
  }))
  users.value = result.list
  total.value = result.total
}

function handleSearch(): void {                   // ⑤ 筛选变化：回第 1 页再查
  reset()
  fetchUsers()
}
function handlePageChange(p: number, s: number): void {
  page.value = p; pageSize.value = s
  fetchUsers()                                    //    翻页：只翻页不重置
}
```

**增删改之后的动作永远是同一句：`await fetchUsers()`** ——重新拉列表，简单粗暴、绝不过期。进阶玩法是"乐观更新"（先改本地再发请求，失败回滚），但先把笨办法写对。

> ☕ **Java 视角**：这套骨架 ≈ `GET /users?page&size&keyword` 的标准分页接口 + 前端的固定消费模板。你写过的 MyBatis-Plus `Page<T>` 查询，就是 `usePagination` 的后端镜像。

---

## 3. 套路三：表单与校验

> 🔍 手写版：`components/UserFormDialog.vue`；组件库版：第 12 章的 el-form rules。

**校验时机**：`blur`（失焦）校验单字段给即时反馈，`submit` 时全量校验做最终把关。本项目手写版：

```typescript
function validateUsername(): boolean {
  errors.username = form.username.trim() === '' ? '请输入用户名' : ''
  return errors.username === ''
}
async function handleSubmit(): Promise<void> {
  if (!validateUsername() || !validatePassword()) return   // ❌ 有错就拦下
  await run(() => userStore.login(form))
}
```

```vue
<input v-model="form.username" @blur="validateUsername" />
<span v-if="errors.username" class="form-error">{{ errors.username }}</span>
```

**表单初始化的固定招**：编辑弹窗"每次打开"都要重置/回填——用 `watch(() => props.open)`，第 6 章的 `UserFormDialog` 就是范本。**不要**在组件 created 时初始化一次就完事——第二次打开弹窗，上次的输入还在里面。

**提交防重复**：`:disabled="loading"`（或 `saving`）锁按钮，`useLoading` 免费赠送。**改密码/支付类操作再考虑加防抖节流，普通表单锁按钮就够了。**

**成功反馈三选一**：跳转详情页（文章编辑用）、toast 轻提示（Element Plus 的 `ElMessage.success`）、成功横幅自动消失（个人设置页用 watch + 定时器实现的 `successMessage`）。

---

## 4. 套路四：弹窗

**声明式**（本项目手写版 ConfirmDialog / UserFormDialog）：

- 弹窗组件只有 `open` prop 和 emits，**绝不自己管自己显隐**（第 6 章练习 3 的答案：数据权威在父）；
- `<Teleport to="body">` 脱离父容器，避免被父级的 `overflow: hidden` 裁剪、z-index 压盖；
- 遮罩 `@click.self` 关闭 + `:loading` 防重复确认。

**命令式**（Element Plus 的 `ElMessageBox.confirm`，见 `views/element-demo/ElementUsersView.vue`）：

```typescript
try {
  await ElMessageBox.confirm('确定删除吗？', '删除用户', { type: 'warning' })
} catch { return }        // 取消走 reject（Promise 化的 confirm）
await deleteUser(user.id)
```

两种范式各有拥趸：声明式可组合、样式可控；命令式少写一半代码。真实项目里随团队，**能看懂两种是底线**。

---

## 5. 散装但高频的小模式

| 模式 | 代码 | 出处 |
|---|---|---|
| watch 清理定时器 | `watch(msg, () => { timer = setTimeout(clear, 3000) })` + `onUnmounted(clearTimeout)` | `ProfileView.vue` |
| 枚举 → 展示映射 | `function roleText(r: UserRole) { return r === 'admin' ? '管理员' : '编辑' }` | `UsersView.vue` |
| 整页刷新数据 | 仪表盘"🔄 刷新"按钮复用 `loadStats` | `DashboardView.vue` |
| 保存后同步全局 | `await updateProfile(...)` 后 `await userStore.fetchProfile()` | `ProfileView.vue` |
| 登录后跳回原页 | 守卫写 `?redirect=` + 登录页读回 | 第 7 章 |
| 防抖（手写） | `clearTimeout(timer); timer = setTimeout(fn, 500)` | 练习预告 |

---

## 6. 🔍 精读顺序建议

1. `src/views/DashboardView.vue` —— 三态渲染 + 数据刷新
2. `src/views/UsersView.vue` —— ⭐ 列表页全家桶（本章主教材）
3. `src/components/UserFormDialog.vue` —— 表单初始化 + 校验 + 上报
4. `src/views/ProfileView.vue` —— 双表单 + 密码流 + 成功提示自动消失
5. `src/views/element-demo/ElementUsersView.vue` —— 同一页面用组件库重写（第 12 章对照）

---

## ✏️ 动手练习

1. **新页面实战**：给文章列表加"回收站"页面 `/articles/trash`（mock 加 `GET /articles/trash` 返回 status=draft 的文章也行，或者简单复用筛选）——不走文档，只看 UsersView 默写。
2. **搜索防抖**：给文章列表的关键词输入加 500ms 防抖自动搜索（不点搜索按钮）。
3. **思考题**：为什么"筛选变化"要 `reset()` 回第 1 页，而"翻页"不重置筛选？如果不 reset 会出现什么 bug？

<details><summary>练习提示</summary>

3. 若在第 3 页搜索"张三"且结果只有 1 页：后端返回空列表，用户以为"没有数据"——其实是"第 3 页没有数据"。UI 无辜，逻辑有罪。

</details>

## 📌 本章小结

- 四大套路：**三态渲染、列表页、表单校验、弹窗**——管理后台的乐高积木。
- 错误态必须给重试出口；提交必须防重复；表单每次打开必须重置。
- 操作成功后 `fetchXxx()` 重拉列表，先对再炫。
- 套路背熟后，**写新页面 = 组装，不是创作**——这就是工程化。

**下一章** → [11-styling.md](./11-styling.md)：CSS 实战——从盒模型到暗色主题。

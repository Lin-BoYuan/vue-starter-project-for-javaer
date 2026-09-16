# 第 3 章 · TypeScript 速成：写给 Java 程序员的"回家之路"

> 🎯 **本章目标**：用你已有的 Java 类型直觉，快速掌握 TS 中 95% 常用的类型能力，并看懂本项目的类型组织。好消息：**TS 的类型语法绝大部分和 Java 同构**，你会学得比想象中快得多。

**前置知识**：第 1、2 章。

---

## 1. TS 是什么，解决什么问题

第 1 章说过 JS 是动态类型——`function getUser(id)` 里 id 传字符串、传对象都不报错，直到运行时炸掉。TypeScript = **JS + 静态类型**，编译期把大部分低级错误拦下。

> ☕ **Java 视角**：TS 之于 JS ≈ 把 `Object` 乱飞的 JS 加上了编译期类型检查。学习成本极低——**类型标注的语法和 Java 几乎一样**。

```typescript
function getUser(id: number): Promise<User> { ... }
//              ^^^^^^^^ 参数类型        ^^^^^^^^^^^ 返回类型，和 Java 同款
```

**关键认知**：TS 只在编译期存在，**编译产物里没有类型信息**（类型擦除，比 Java 更彻底——Java 反射还能拿到注解和泛型签名，TS 运行时什么都查不到）。所以 TS 不能在运行时校验数据结构——接口返回的 JSON 还得靠人保证（见第 9 章的思考）。

---

## 2. 基础类型速查（和 Java 对照）

```typescript
// 基础类型（小写！Java 的 int/Integer 之争在 TS 里不存在）
const n: number = 42
const s: string = 'hello'
const b: boolean = true
const list: string[] = ['a', 'b']            // ≈ List<String>
const pair: [string, number] = ['age', 18]   // 固定长度元组

// 特殊类型
let u: undefined
let nn: null
let anything: unknown = fetchSomething()   // 未知类型：用之前必须先收窄/断言（安全的 any）
const ids: Array<number> = [1, 2]          // 泛型数组，和 Java 一样有泛型

// 对象类型
const user: { id: number; name: string } = { id: 1, name: 'a' }
```

### interface：≈ Java 的实体类/接口

```typescript
// 本项目 src/types/models.ts
interface UserAccount {
  id: number
  username: string
  role: UserRole
  createdAt: string
  nickname?: string          // ? = 可选字段（可能没有），读出来是 string | undefined
  readonly token: string     // readonly = 不可重新赋值 ≈ final
}
```

### 联合类型 & 字面量类型：≈ enum + 更灵活

```typescript
// 本项目 src/types/models.ts —— 只有这三种合法值，其他值编译报错
type UserRole = 'admin' | 'editor'
type ArticleStatus = 'draft' | 'published'

function publish(status: ArticleStatus) { ... }
publish('published')   // ✅
publish('pubshed')     // ❌ 编译期就报错——拼错字符串再也不是运行时事故
```

> ☕ **Java 视角**：这等价于 `enum UserRole { ADMIN, EDITOR }`，但**序列化时就是字符串**，和后端 JSON 里的值天然一致，不用写 `@JsonValue`。

### 类型别名 type vs interface

```typescript
type A = { x: number }      // type 能给联合、元组、基本类型起名
interface B { y: number }   // interface 只描述对象形状，可被 extends/implements
```

两者 90% 场景可互换。本项目的习惯：**对象/实体用 interface，联合/别名用 type**。

---

## 3. 泛型：和 Java 几乎无缝衔接

```typescript
// 函数泛型（≈ Java 的 <T> T foo(T t)）
function first<T>(list: T[]): T | undefined { return list[0] }

// 本项目 src/types/api.ts：统一响应信封，≈ 后端的 Result<T>
interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 本项目 src/types/api.ts：分页结果
interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
```

`ApiResponse<UserAccount>` 传入泛型实参后，`response.data.data` 在编辑器里就是 `UserAccount`——**自动补全和跳转全是真的**。

---

## 4. 工具类型（Utility Types）：TS 的"Apache Commons"

| 工具类型 | 含义 | ☕ Java 对应 |
|---|---|---|
| `Partial<T>` | 所有字段变可选 | 手写一个 XxxUpdateDTO |
| `Required<T>` | 所有字段变必填 | — |
| `Pick<T, K>` | 挑出部分字段 | 手写一个精简 VO |
| `Omit<T, K>` | 剔除部分字段 | 同上，换个方向 |
| `Record<K, V>` | 键值对集合 | `Map<K, V>` |

本项目 `src/types/models.ts` 里的真实例子：

```typescript
// 完整实体 UserAccount 有 id、createdAt 等后端生成的字段；
// 表单提交只需要"人填的那些"——一行派生，不用维护两份定义：
export type UserForm = Omit<UserAccount, 'id' | 'createdAt'>
```

这就是类型系统带来的**复利**：实体加字段，表单类型自动跟上。

---

## 5. TS 在 Vue 项目中的日常： narrowing（类型收窄）

联合类型用之前要"收窄"，TS 沿控制流自动判断（≈ Java 的 pattern matching instanceof）：

```typescript
function showError(error: unknown): string {
  if (error instanceof ApiError) return error.message   // 收窄成 ApiError
  return '未知错误'                                      // 剩余分支是 unknown
}

// 判空收窄（本项目 DashboardView.vue 的写法）
const stats = ref<DashboardStats | null>(null)
// stats.value 可能是 null，模板里用 v-if="stats" 收窄后，
// 内部使用 stats.monthlyArticles 就不再是 null

// 可选链 ?. 与空值合并 ?? 是收窄的快捷方式（本项目 stores/user.ts）
const isAdmin = computed(() => userInfo.value?.role === 'admin')
```

**断言（as）**：类型系统说服不了你时的"手动强制转换"，要克制使用：

```typescript
const select = event.target as HTMLSelectElement   // 你比编译器更懂时
const body = JSON.parse(raw) as MockDb             // JSON.parse 返回 unknown，需要断言
```

---

## 6. 本项目的类型组织（🔍 源码导航）

| 文件 | 看什么 |
|---|---|
| `src/types/api.ts` | 泛型信封 `ApiResponse<T>`、分页 `PageResult<T>`、`PageQuery`、`LoginParams` |
| `src/types/models.ts` | 实体 `UserAccount`/`Article`、字面量联合 `UserRole`/`UserStatus`、`Omit` 派生的 `UserForm`/`ArticleForm` |
| `env.d.ts` | **声明合并**：给 `import.meta.env` 补类型，让 `.env` 里的变量有自动补全 |
| `src/router/index.ts` | `declare module 'vue-router'`：给路由 `meta` 补类型（给第三方库的"打补丁"手法） |
| `src/constants/article.ts` | `as const` 断言：把数组锁成只读字面量元组 |
| `tsconfig.app.json` | `noUncheckedIndexedAccess: true`：数组/对象下标访问返回 `T \| undefined`，逼你处理越界（TS 严格模式红利） |

> ☕ **Java 视角**：`declare module` + `interface RouteMeta` ≈ 给第三方类库"扩展方法/增强元数据"。你会在很多成熟前端项目里见到这个手法。

---

## 7. 编辑器建议（体验翻倍）

用 **VSCode + 官方 Vue 插件（Vue - Official，旧名 Volar）**：

- 任何变量悬停看推导出的类型；
- `Ctrl+Space` 自动补全（组件 props、store 字段全有类型）；
- 改实体字段名后 `F2` 重命名，全项目联动。

类型即文档。**看不懂某个函数时，先看它的参数和返回类型，比看注释还准。**

---

## ✏️ 动手练习

1. 在 `src/types/models.ts` 给 `Article` 加一个 `tags?: string[]` 可选字段，观察哪些页面需要适配、哪些不用（可选字段的好处）。
2. 写一个泛型函数 `pickField<T, K extends keyof T>(obj: T, key: K): T[K]`，用 `pickField(user, 'nickname')` 调用，体会 `keyof`（≈ 反射拿到字段名，但零运行时成本）。
3. 把 `UserRole` 临时加一个 `'super'` 字面量，看 TS 编译器如何引导你把所有 switch/判断补全。

## 📌 本章小结

- TS = JS + 编译期类型；运行时完全擦除，运行时校验另请高明。
- `interface`/`type` ≈ 实体类；联合字面量 ≈ enum；泛型语法 ≈ Java 泛型；工具类型是免费的数据变换。
- 收窄（`instanceof`、`?.`、`if`）是日常；`as` 断言要克制。
- 类型即文档：类型写好，代码自解释。

**下一章** → [04-vue-basics.md](./04-vue-basics.md)：正式进入 Vue——组件与模板语法。

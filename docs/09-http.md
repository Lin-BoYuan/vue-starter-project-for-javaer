# 第 9 章 · 网络请求与前后端联调（全栈核心章）

> 🎯 **本章目标**：这是写给"后端转全栈"的你最重要的一章——前端如何封装 HTTP 客户端（axios）、如何统一处理 token 和错误，**mock 后端的完整架构**，以及把 mock 换成你的 Spring Boot 时的全部知识（代理、CORS、环境变量）。

**前置知识**：第 5-8 章。

---

## 1. 浏览器发请求的两条路：fetch 与 axios

| | 原生 `fetch` | axios |
|---|---|---|
| 来源 | 浏览器内置 | 第三方库（最流行） |
| JSON 处理 | 手动两步：`res.json()` | 自动 `JSON.stringify/parse` |
| 错误语义 | **HTTP 404/500 不报错**（要自己查 `res.ok`） | 非 2xx 自动抛异常（≈ RestTemplate 行为） |
| 拦截器/实例化 | 无，靠手写封装 | 内置拦截器、实例、超时 |

本项目选 axios（企业主流），但要理解：**封装前先懂原生**。本项目 mock 层恰好展示了一个 axios 请求的完整管道：

```
调用 api 函数 → 请求拦截器（加 token）→ 转换请求体 → 【adapter：真正发请求的地方】
→ 转换响应体 → 响应拦截器（拆包/错误处理）→ 业务代码拿到 data
```

> ☕ **Java 视角**：axios 实例 ≈ 封装好的 `RestTemplate/WebClient`；请求拦截器 ≈ OkHttp 的 `Interceptor` 统一加 Header；响应拦截器 ≈ `ResponseErrorHandler` + 反序列化。这一整套你在后端都写过。

---

## 2. axios 封装（🔍 主教材：`src/api/http.ts`）

### 2.1 创建实例

```typescript
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'   // 读 .env

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',   // 所有请求的 URL 前缀
  timeout: 10_000,
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),          // ⭐ mock 开关：见第 4 节
})
```

### 2.2 请求拦截器：统一带 token

```typescript
instance.interceptors.request.use((config) => {
  const token = getStorage<string>(TOKEN_KEY, '')
  if (token) config.headers.Authorization = `Bearer ${token}`   // JWT 标准姿势
  return config     // 必须返回 config，否则请求"消失"
})
```

> 为什么读 localStorage 而不是 Pinia store？见第 8 章 4 节的分析——保持 http 层不依赖 Vue 运行时。

### 2.3 响应拦截器：拆包 + 错误归一

国内团队常见约定：**HTTP 永远 200，业务成败看信封里的 `code`**。本项目 mock 也如此，所以拦截器承担四件事：

```typescript
instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse
    if (body.code === 0) return response                       // ① 成功：原样放行
    if (body.code === 401) {                                   // ② 登录过期
      removeStorage(TOKEN_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'                        //    整页跳转，避免循环依赖 router
      }
    }
    return Promise.reject(new ApiError(body.code, body.message || '请求失败'))  // ③ 业务错误
  },
  (error: AxiosError) => {                                     // ④ HTTP 层错误（超时/断网/4xx 5xx）
    const message = error.code === 'ECONNABORTED' ? '请求超时' : error.response ? `HTTP ${error.response.status}` : '网络异常'
    return Promise.reject(new ApiError(error.response?.status ?? -1, message))
  },
)
```

设计目标：**业务代码 catch 到的永远是同一种东西**——`ApiError`，有 code 有 message，页面只需要判断怎么展示，不用关心错误是哪一层产生的。

### 2.4 泛型 request：调用端零样板

```typescript
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config)
  return response.data.data        // 拆信封：业务直接拿到 data
}
```

---

## 3. API 模块：后端 Controller 的"前端镜像"

> 🔍 `src/api/user.ts`、`src/api/article.ts`、`src/api/dashboard.ts`

```typescript
// 每个函数 = 后端的一个接口。类型标注让"接口文档"活在代码里
export function getUserPage(query: UserPageQuery): Promise<PageResult<UserAccount>> {
  return request<PageResult<UserAccount>>({ url: '/users', method: 'get', params: query })
}

export function updateUser(id: number, data: Partial<UserForm>): Promise<UserAccount> {
  return request<UserAccount>({ url: `/users/${id}`, method: 'put', data })
}
```

两个 axios 细节：

- **GET 用 `params`**（axios 拼 `?page=1&keyword=x`），**POST/PUT 用 `data`**（JSON 请求体）——和 Postman 的 Params/Body 分区一模一样；
- URL 遵循 **RESTful**：`GET /users` 列表、`POST /users` 新增、`PUT /users/3` 修改、`DELETE /users/3` 删除。你的 Spring `@RestController` 大概率也是这么设计的。

---

## 4. Mock 层：一个"装在浏览器里的后端"

> 🔍 `src/mock/` 三件套。**这套设计是本项目的教学重点**：不发网络请求，却保留了完整的"请求-路由-鉴权-响应"语义，将来切真实后端零改造成本。

```
src/mock/
├── data.ts      # "数据库"：种子数据 + localStorage 持久化（≈ data.sql + 内存表）
├── server.ts    # "Controller 层"：路由表 + 处理函数 + 鉴权 + 业务错误（MockError ≈ BusinessException）
└── adapter.ts   # "网关"：axios 自定义 adapter，把请求劫持到本地 server，不发真实 HTTP
```

**adapter 是整个机关的钥匙**：`axios.create({ adapter: mockAdapter })` 替换了"真正发请求"的那一环。adapter 拿到请求配置，拼出 method/path/query/body/token，交给 `dispatch()`（模拟的 DispatcherServlet），返回响应信封。**还模拟了 200-600ms 网络延迟**——没有延迟，loading 状态和骨架屏永远闪不出来，等于没测。

```typescript
// server.ts 的路由表 ≈ 一张手写的 @RequestMapping 表
const routes: MockRoute[] = [
  { method: 'POST', pattern: /^\/auth\/login$/, handler: handleLogin },
  { method: 'GET',  pattern: /^\/users$/,       handler: listUsers,  auth: true },  // 需要登录
  { method: 'PUT',  pattern: /^\/users\/(\d+)$/, handler: updateUser, auth: true },  // m[1] ≈ @PathVariable
]
```

**演示账号**：`admin / 123456`（写死在 server.ts，教学用）。个人设置页的"重置演示数据"调 `POST /mock/reset` 恢复种子数据——你的胡乱 CRUD 永远能一键回炉。

> ☕ **Java 视角**：这套 mock 的价值，是让你**只写前端也能完整走通前后端联调的全流程**（包括 401、404、参数校验失败）。等你的 Spring Boot 就绪，把 `VITE_USE_MOCK` 改成 `false`，api 层一行不改。

---

## 5. 对接真实 Spring Boot：代理、CORS 与环境变量

### 5.1 开发环境：Vite 代理（推荐）

把 `.env.development` 改成 `VITE_USE_MOCK=false`，并在 `vite.config.ts` 确认代理：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',   // 你的 Spring Boot
      changeOrigin: true,
      // 后端没有 /api 前缀时，重写路径剥掉它：
      // rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

前端请求 `/api/users` → Vite dev server 转发到 `http://localhost:8080/api/users` → 浏览器看到的全是"同源请求"。

> ☕ **Java 视角**：Vite proxy ≈ Nginx 的 `location /api { proxy_pass ... }`。**为什么它能解决跨域？** 因为跨域是**浏览器的同源策略**拦的，服务器和服务器之间不存在跨域。让自家 dev server 当"二传手"，浏览器以为一直在和 5173 说话。

### 5.2 CORS：后端视角的正解

生产环境没有 Vite，前端部署在 `https://admin.example.com`，后端在 `https://api.example.com`——**浏览器直接拦**。此时要在后端开 CORS（Spring Boot 示例）：

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("https://admin.example.com")   // 明确允许的前端源，别用 *
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true);
    }
}
```

> 💡 **全栈必懂**：CORS 不是"请求被服务器拒绝了"，而是**浏览器**发起的协商——先发 OPTIONS 预检，服务器回应"我允许这个源"，浏览器才放行正式请求。你在 Network 面板看到的失败 CORS 请求，**服务器可能处理成功了**，只是浏览器不给 JS 看响应。后端同学常在这里翻车：接口明明 200，前端就是读不到。

### 5.3 环境变量（.env 文件）

| 文件 | 生效时机 | 本项目内容 |
|---|---|---|
| `.env.development` | `npm run dev` | `VITE_USE_MOCK=true`、`VITE_API_BASE_URL=/api` |
| `.env.production` | `npm run build` | 同上（开源演示用）；对接后端后改 `false` |

> ⚠️ **安全铁律**：只有 `VITE_` 前缀的变量会进浏览器包——**它对全世界可见**。后端的数据库密码、JWT 密钥永远别放 `.env`（它们属于后端的 `application.yml`）。

### 5.4 联调检查清单（真实实战顺序）

1. `VITE_USE_MOCK=false`，`npm run dev` 重启（env 改动要重启）；
2. Spring Boot 起在 8080，接口路径对齐（前缀 `/api` 或配 rewrite）；
3. F12 → Network 面板：看请求 URL、状态码、请求/响应体——**后端 debug 接口的肌肉记忆直接复用**；
4. 401 → 检查 `Authorization` 头；CORS 报错 → 回到 5.2；404 → 检查 proxy rewrite。

---

## 6. 🔍 结合本项目源码（本章精读材料）

| 文件 | 看什么 |
|---|---|
| `src/api/http.ts` | ⭐ 实例/双拦截器/ApiError/request 泛型 |
| `src/api/user.ts` | params vs data、RESTful 路径、类型即文档 |
| `src/mock/adapter.ts` | axios 管道被"劫持"的位置，params/data 的原始形态 |
| `src/mock/server.ts` | 路由表分发、鉴权、MockError、延迟模拟 |
| `src/mock/data.ts` | 种子数据 + localStorage 持久化 + resetMockDb |
| `vite.config.ts` + `.env.*` | 代理与环境变量的真实配置 |

---

## ✏️ 动手练习

1. **给 mock 加一个接口**：`GET /users/:id` 返回单个用户；在 `api/user.ts` 加 `getUser(id)`；在文章详情页随便找个位置 console.log 调一下（走通"加接口三步曲"）。
2. **断网演练**：DevTools → Network → Throttling 选 Offline，刷新仪表盘，观察错误三态与重试按钮——这就是拦截器④号分支的实战。
3. **思考题**：为什么 mock 里登录失败返回的是 `code: 400` 信封（HTTP 200），而真实后端通常直接返回 HTTP 401？两种约定下，前端拦截器各要怎么改？

<details><summary>练习提示</summary>

3. 若后端用 HTTP 状态码表意：错误会走响应拦截器的**第二个回调**（AxiosError 分支），需要在 error.response.status 上判断 401/403，信封 message 可能不在 body 里。两种约定没有对错，**团队统一即可**——这正是"响应拦截器统一归一化"存在的意义。

</details>

## 📌 本章小结

- axios 实例 + 双拦截器 ≈ 你封装过的 HTTP 客户端；错误归一成 `ApiError`，页面只管展示。
- GET 用 params、POST 用 data；RESTful 风格前后端天然对齐。
- mock = adapter 劫持 + 本地路由表 + 种子数据；`VITE_USE_MOCK` 一键切换真实后端。
- 开发跨域用 Vite 代理，生产跨域配后端 CORS；**同源策略是浏览器的，不是 HTTP 的**。

**下一章** → [10-patterns.md](./10-patterns.md)：把前 9 章串成"套路"——真实页面的通用模式。

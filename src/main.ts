// 📖 配套教程：docs/02-project-setup.md
// 应用入口：整个前端应用从这里启动。
//
// ☕ Java 视角：main.ts 相当于 Spring Boot 的启动类，
//   createApp(App) ≈ SpringApplication.run(App.class)，
//   app.use(...) ≈ 往容器里注册组件（这里注册了路由器和状态管理）。
import './styles/main.css'
// Element Plus 全量引入（教学项目图省事；真实项目建议按需引入，见 docs/12-element-plus.md）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus 的暗色主题：它和我们的暗色方案一样，都是给 <html> 加 .dark 类
import 'element-plus/theme-chalk/dark/css-vars.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册 Pinia（全局状态管理，类似把几个单例 Bean 放进容器）
app.use(createPinia())
// 注册 Vue Router（前端路由，类似 @RequestMapping 的 URL 映射）
app.use(router)
// 注册 Element Plus 组件库
app.use(ElementPlus)

app.mount('#app')

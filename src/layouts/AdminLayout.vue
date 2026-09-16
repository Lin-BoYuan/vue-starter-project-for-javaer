<!-- 📖 配套教程：docs/07-router.md（嵌套路由）、docs/11-styling.md（Flex 布局实战）、
     docs/06-components-communication.md（provide/inject）
     后台主布局：左边侧边栏 + 右边（顶栏 + 内容区）。
     所有业务页面都渲染在 <RouterView /> 里——这就是"嵌套路由"：布局是父，页面是子。 -->
<script setup lang="ts">
import { provide, ref } from 'vue'
import AdminTopBar from '@/components/AdminTopBar.vue'

/* ---------- 侧边栏折叠状态 ---------- */
const sidebarCollapsed = ref(false)

/* ---------- 主题：provide / inject 跨组件传递（IoC 演示） ---------- */
// ☕ Java 视角：provide ≈ 在容器里注册一个 @Bean，inject ≈ @Autowired 按类型注入。
// 好处：顶栏、设置页等深层组件不用一层层 props 往下传（prop drilling）。
import { useTheme } from '@/composables/useTheme'
import { THEME_KEY } from '@/constants/keys'
const { isDark, toggleTheme } = useTheme()

provide(THEME_KEY, { isDark, toggleTheme })

/* ---------- 侧边栏菜单（也可以用 router.options.routes 动态生成，这里直白优先） ---------- */
const menus = [
  { title: '仪表盘', icon: '📊', to: '/dashboard' },
  { title: '用户管理', icon: '👥', to: '/users' },
  { title: '文章管理', icon: '📝', to: '/articles' },
  { title: '个人设置', icon: '⚙️', to: '/profile' },
]
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">📚 Mini Admin</div>
      <nav class="sidebar-nav">
        <!-- RouterLink 渲染成 <a> 标签；当前路由匹配时会自动加 router-link-active 类 -->
        <RouterLink
          v-for="menu in menus"
          :key="menu.to"
          :to="menu.to"
          class="sidebar-item"
          :title="menu.title"
        >
          <span class="sidebar-icon">{{ menu.icon }}</span>
          <span class="sidebar-text">{{ menu.title }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- 右侧：顶栏 + 内容区 -->
    <div class="main-area">
      <AdminTopBar @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />
      <!-- 子路由（业务页面）渲染在这里 -->
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<!-- scoped：样式只作用于本组件（编译时给选择器加唯一 data 属性后缀） -->
<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex; /* 经典的"左右布局"就是一条 display: flex */
}

.sidebar {
  width: 220px;
  flex-shrink: 0; /* 不被压缩 */
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  transition: width 0.2s;
}

/* 折叠态：根元素有 .sidebar-collapsed 类时，侧边栏收窄、文字隐藏 */
.sidebar-collapsed .sidebar {
  width: 64px;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  gap: 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--border-radius);
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s;
}

.sidebar-item:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

/* router-link-active：RouterLink 在当前路由时自动添加的类，写它就有"高亮"效果 */
.sidebar-item.router-link-active {
  background: var(--color-primary);
  color: #fff;
}

.sidebar-text {
  overflow: hidden;
}

.sidebar-collapsed .sidebar-text {
  display: none;
}

.main-area {
  flex: 1; /* 占据剩余全部宽度 */
  min-width: 0; /* flex 子元素的经典修复：允许内容收缩，防止表格撑破布局 */
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
}
</style>

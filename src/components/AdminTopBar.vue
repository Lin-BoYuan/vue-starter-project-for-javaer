<!-- 📖 配套教程：docs/06-components-communication.md（inject 演示）、docs/08-pinia.md（跨组件读 store）
     后台顶栏：折叠按钮 + 主题切换 + 用户菜单。
     注意：主题状态不是 props 传进来的，而是 inject 注入的（布局 provide 的）；
     用户信息也不是请求来的，而是直接从 Pinia store 读的——两种"跨组件取数"的对照。 -->
<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

/* ---------- inject：拿到布局 provide 的主题状态 ---------- */
import { THEME_KEY } from '@/constants/keys'
const injected = inject(THEME_KEY, () => ({ isDark: ref(false), toggleTheme: () => {} }), true)
// ↑ 第三个参数 true：key 对不上时不报错，走默认值工厂函数（防御性写法）
// 解构成顶层变量后，isDark 在模板里会自动解包（不用写 .value）
const { isDark, toggleTheme } = injected

/* ---------- emit：子 → 父 通信，把"点击折叠按钮"告诉布局 ---------- */
const emit = defineEmits<{ toggleSidebar: [] }>() // 泛型写法声明事件及参数类型

/* ---------- store：读当前用户 ---------- */
const userStore = useUserStore()
const nickname = computed(() => userStore.userInfo?.nickname ?? '未登录')
const avatarText = computed(() => nickname.value.slice(0, 1))

/* ---------- 用户下拉菜单 ---------- */
const dropdownOpen = ref(false)
const router = useRouter()

async function handleLogout(): Promise<void> {
  dropdownOpen.value = false
  await userStore.logout()
  // 登出后回登录页（replace：不留下历史记录，浏览器后退不会回到后台）
  router.replace({ name: 'login' })
}

function goProfile(): void {
  dropdownOpen.value = false
  router.push({ name: 'profile' })
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="btn btn-sm" title="折叠/展开侧边栏" @click="emit('toggleSidebar')">☰</button>
    </div>

    <div class="topbar-right">
      <!-- 主题切换：点击后 isDark 翻转，html 根元素的 .dark 类随之增删 -->
      <button class="btn btn-sm" data-testid="theme-toggle" @click="toggleTheme()">
        {{ isDark ? '🌙' : '☀️' }}
      </button>

      <div class="user-menu">
        <button class="user-trigger" @click="dropdownOpen = !dropdownOpen">
          <span class="avatar">{{ avatarText }}</span>
          <span class="nickname">{{ nickname }}</span>
          <span class="caret">▾</span>
        </button>

        <!-- v-if：条件渲染，false 时连 DOM 都不存在 -->
        <div v-if="dropdownOpen" class="dropdown">
          <button class="dropdown-item" @click="goProfile">⚙️ 个人设置</button>
          <button class="dropdown-item" data-testid="logout-btn" @click="handleLogout">🚪 退出登录</button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky; /* 滚动时吸顶 */
  top: 0;
  z-index: 10;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-menu {
  position: relative; /* 让下拉框 absolute 定位以自己为基准 */
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  border-radius: var(--border-radius);
}

.user-trigger:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.caret {
  font-size: 10px;
  color: var(--color-text-secondary);
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 140px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  z-index: 20;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  font-size: var(--font-size-base);
}

.dropdown-item:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}
</style>

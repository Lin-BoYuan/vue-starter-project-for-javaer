/**
 * 📖 配套教程：docs/11-styling.md（CSS 变量与暗色主题）、docs/06-components-communication.md
 * useTheme：暗色主题开关。职责只有两个：
 *   1. 把"是否暗色"持久化到 localStorage
 *   2. 给 <html> 根元素加/去 .dark 类，让 CSS 变量整体切换（见 styles/main.css）
 *
 * 注意：isDark 定义在模块顶层——模块级单例，所有组件调用 useTheme() 共享同一份状态。
 * ☕ Java 视角：≈ 静态单例 Bean。真正企业级的多组件共享状态用 Pinia（docs/08-pinia.md），
 * 这里状态太简单，用单例 composable 反而更轻。
 */
import { ref } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

const THEME_KEY = 'theme'
const isDark = ref(getStorage<boolean>(THEME_KEY, false))

function applyToDocument(): void {
  document.documentElement.classList.toggle('dark', isDark.value)
}

export function useTheme() {
  // 页面刷新后第一次调用时，把存储的主题应用到 DOM
  applyToDocument()

  function toggleTheme(): void {
    isDark.value = !isDark.value
    setStorage(THEME_KEY, isDark.value)
    applyToDocument()
  }

  return { isDark, toggleTheme }
}

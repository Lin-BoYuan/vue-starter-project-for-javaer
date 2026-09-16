/**
 * 📖 配套教程：docs/08-pinia.md（本章主角）
 * 用户状态 store：token、当前用户信息、登录/登出动作。
 *
 * ☕ Java 视角：Pinia store ≈ 一个单例 @Component Bean：
 *   - ref 状态   ≈ Bean 的字段
 *   - computed  ≈ 派生 getter 方法
 *   - action    ≈ 业务方法
 * 任何组件 useUserStore() 拿到的都是同一个实例（IoC 容器的味道）。
 *
 * 为什么需要全局 store？登录状态几乎每个页面都要用（路由守卫、顶栏头像、接口鉴权），
 * 用 props 一层层传（prop drilling）太痛苦，所以放进"全局容器"。
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LoginParams } from '@/types/api'
import type { LoginResult, UserAccount } from '@/types/models'
import { TOKEN_KEY } from '@/api/http'
import * as userApi from '@/api/user'
import { getStorage, removeStorage, setStorage } from '@/utils/storage'

/** 用户信息在 localStorage 里的 key（token 的 key 复用 api/http.ts 的常量） */
const USER_KEY = 'user'

/**
 * defineStore 的"组合式函数写法"（setup store）：
 * 第一参数是 store 的唯一 id（调试工具里显示的名字），第二参数是一个 setup 函数。
 */
export const useUserStore = defineStore('user', () => {
  /* ---------- 状态 state ---------- */
  const token = ref<string>(getStorage(TOKEN_KEY, ''))
  const userInfo = ref<UserAccount | null>(getStorage<UserAccount | null>(USER_KEY, null))

  /* ---------- 派生 getters（computed） ---------- */
  const isLoggedIn = computed(() => token.value !== '')
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  // ↑ ?. 可选链：userInfo 可能是 null，等价于 Java 的 userInfo != null && ...，但更短

  /* ---------- 动作 actions ---------- */

  /** 登录：调接口 → 把 token 和用户信息同时写进 store 和 localStorage（刷新页面不丢） */
  async function login(params: LoginParams): Promise<void> {
    const result: LoginResult = await userApi.login(params)
    token.value = result.token
    userInfo.value = result.user
    setStorage(TOKEN_KEY, result.token)
    setStorage(USER_KEY, result.user)
  }

  /** 重新拉取当前用户信息（修改资料后调用） */
  async function fetchProfile(): Promise<UserAccount> {
    const user = await userApi.getProfile()
    userInfo.value = user
    setStorage(USER_KEY, user)
    return user
  }

  /** 清空本地会话（不调接口，纯前端状态清理） */
  function clearSession(): void {
    token.value = ''
    userInfo.value = null
    removeStorage(TOKEN_KEY)
    removeStorage(USER_KEY)
  }

  /** 登出：通知后端作废会话；无论接口成败都清空本地状态（finally 的经典用法） */
  async function logout(): Promise<void> {
    try {
      await userApi.logout()
    } finally {
      clearSession()
    }
  }

  return { token, userInfo, isLoggedIn, isAdmin, login, fetchProfile, clearSession, logout }
})

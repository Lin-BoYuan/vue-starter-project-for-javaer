<!-- 📖 配套教程：docs/04-vue-basics.md（本章主角：表单与 v-model）、docs/10-patterns.md（表单校验套路）
     登录页：v-model 双向绑定、简单校验、async 提交、loading 态、错误提示、登录后跳转。 -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import { useLoading } from '@/composables/useLoading'
import { useUserStore } from '@/stores/user'

/* ---------- 路由实例 ---------- */
const router = useRouter()
const route = useRoute()

/* ---------- 状态 ---------- */
// reactive：把整个表单对象变成响应式（ ≈ 一个会被自动监听的 POJO）
const form = reactive({
  username: 'admin',
  password: '',
  remember: true,
})

// 手写校验错误（真实项目会用表单库，docs/12 会见到 Element Plus 的 el-form 校验）
const errors = reactive({ username: '', password: '' })
const serverError = ref('')

// useLoading 组合式函数：loading 状态 + 自动开关
const { loading, run } = useLoading()

/* ---------- 校验：blur（失去焦点）时校验单个字段，提交时校验全部 ---------- */
function validateUsername(): boolean {
  errors.username = form.username.trim() === '' ? '请输入用户名' : ''
  return errors.username === ''
}

function validatePassword(): boolean {
  errors.password = form.password === '' ? '请输入密码' : ''
  return errors.password === ''
}

/* ---------- 提交 ---------- */
async function handleSubmit(): Promise<void> {
  serverError.value = ''
  if (!validateUsername() || !validatePassword()) return

  try {
    await run(() => useUserStore().login(form))
    // 登录成功 → 跳转。守卫把我们拦下时会带 ?redirect=/xxx，优先跳回那里
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' ? redirect : { name: 'dashboard' })
  } catch (error) {
    // request 封装把所有错误统一转成了 ApiError，这里只管展示
    serverError.value = error instanceof ApiError ? error.message : '登录失败，请稍后重试'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="login-title">📚 Mini 管理后台</h1>
      <p class="login-subtitle">Vue3 + TypeScript 教学项目</p>

      <!-- @submit.prevent：拦截表单默认提交行为（防止整页刷新），改走我们的 handleSubmit -->
      <form novalidate @submit.prevent="handleSubmit">
        <div class="form-item">
          <label class="form-label required" for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            class="form-input"
            type="text"
            placeholder="admin"
            autocomplete="username"
            data-testid="username-input"
            @blur="validateUsername"
          />
          <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
        </div>

        <div class="form-item">
          <label class="form-label required" for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            class="form-input"
            type="password"
            placeholder="123456"
            autocomplete="current-password"
            data-testid="password-input"
            @blur="validatePassword"
          />
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <!-- v-model 绑定 checkbox：勾选状态直接同步到 form.remember。
             教学演示：真实项目里会用这个值决定 token 存 localStorage（记住）
             还是 sessionStorage（关浏览器即失效），见 docs/09-http.md 的思考题 -->
        <label class="remember-row">
          <input v-model="form.remember" type="checkbox" />
          记住我
        </label>

        <!-- 服务端返回的错误（如"密码错误"） -->
        <div v-if="serverError" class="form-error server-error" data-testid="server-error">
          ⚠️ {{ serverError }}
        </div>

        <!-- :disabled 绑定 loading：请求进行中禁止重复点击 -->
        <button
          class="btn btn-primary login-btn"
          type="submit"
          :disabled="loading"
          data-testid="login-btn"
        >
          <span v-if="loading" class="loading-spinner spinner-sm"></span>
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </form>

      <p class="login-hint">演示账号：admin / 123456（mock 数据，随便玩）</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 线性渐变背景 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 32px;
}

.login-title {
  font-size: 22px;
  text-align: center;
}

.login-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin: 8px 0 24px;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
}

.server-error {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
}

.login-btn {
  width: 100%;
  justify-content: center;
  height: 40px;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border-width: 2px;
  border-top-color: #fff;
}

.login-hint {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>

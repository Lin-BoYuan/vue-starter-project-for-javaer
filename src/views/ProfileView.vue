<!-- 📖 配套教程：docs/05-composition-api.md（watch 与生命周期清理）、docs/08-pinia.md（store 与页面同步）
     个人设置：改资料、改密码、重置演示数据。
     看点：页面怎么和 Pinia store "对账"（保存后调 fetchProfile 同步全局状态）。 -->
<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import { resetMockData, updateProfile } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const userStore = useUserStore()
const router = useRouter()

/** computed 包一层：store 里的 userInfo 更新后，这里的显示自动跟着变 */
const me = computed(() => userStore.userInfo)
const roleText = computed(() => (me.value?.role === 'admin' ? '管理员' : '编辑'))

/* ---------- 成功提示：watch + 定时器自动消失（顺带演示组件卸载时清理定时器） ---------- */
const successMessage = ref('')
let hideTimer: number | undefined

// watch(数据源, 回调)：数据变化时执行副作用（这里是"3 秒后自动清空提示"）
watch(successMessage, (message) => {
  if (message === '') return
  if (hideTimer !== undefined) window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => (successMessage.value = ''), 3000)
})

// ☕ Java 视角：onUnmounted ≈ @PreDestroy——组件销毁前的"善后"回调
onUnmounted(() => {
  if (hideTimer !== undefined) window.clearTimeout(hideTimer)
})

/* ---------- 修改资料 ---------- */
const profileForm = reactive({
  nickname: userStore.userInfo?.nickname ?? '',
  email: userStore.userInfo?.email ?? '',
})
const profileErrors = reactive({ nickname: '', email: '' })
const savingProfile = ref(false)

function validateProfile(): boolean {
  profileErrors.nickname = profileForm.nickname.trim() === '' ? '昵称不能为空' : ''
  profileErrors.email =
    profileForm.email !== '' && !profileForm.email.includes('@') ? '邮箱格式不正确' : ''
  return !profileErrors.nickname && !profileErrors.email
}

async function saveProfile(): Promise<void> {
  if (!validateProfile()) return
  savingProfile.value = true
  try {
    await updateProfile({ nickname: profileForm.nickname.trim(), email: profileForm.email.trim() })
    await userStore.fetchProfile() // 关键：让全局 store 和后端保持一致（顶栏头像/昵称立刻更新）
    successMessage.value = '✅ 资料已保存'
  } catch (error) {
    successMessage.value = ''
    profileErrors.email = error instanceof ApiError ? error.message : '保存失败'
  } finally {
    savingProfile.value = false
  }
}

/* ---------- 修改密码 ---------- */
const passwordForm = reactive({ newPassword: '', confirmPassword: '' })
const passwordError = ref('')
const savingPassword = ref(false)

async function changePassword(): Promise<void> {
  if (passwordForm.newPassword.length < 6) {
    passwordError.value = '新密码至少 6 位'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  passwordError.value = ''
  savingPassword.value = true
  try {
    await updateProfile({
      nickname: profileForm.nickname.trim(),
      email: profileForm.email.trim(),
      newPassword: passwordForm.newPassword,
    })
    // 改密码后旧会话已作废：登出并回登录页重新登录
    await userStore.logout()
    router.replace({ name: 'login' })
  } catch (error) {
    passwordError.value = error instanceof ApiError ? error.message : '修改失败'
  } finally {
    savingPassword.value = false
  }
}

/* ---------- 重置演示数据（教学辅助） ---------- */
const resetOpen = ref(false)
const resetting = ref(false)

async function handleReset(): Promise<void> {
  resetting.value = true
  try {
    await resetMockData()
    resetOpen.value = false
    await userStore.logout() // 数据回炉，旧 token 也失效了，回登录页重新开始
    router.replace({ name: 'login' })
  } catch {
    resetOpen.value = false
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">个人设置</h2>
    </div>

    <div v-if="successMessage" class="success-banner" data-testid="success-banner">
      {{ successMessage }}
    </div>

    <div class="profile-grid">
      <!-- 账号信息（只读） -->
      <section class="card">
        <h3 class="section-title">账号信息</h3>
        <div class="me-header">
          <span class="me-avatar">{{ me?.nickname?.slice(0, 1) ?? '?' }}</span>
          <div>
            <p class="me-nickname">{{ me?.nickname }}</p>
            <p class="me-username mono">@{{ me?.username }}</p>
          </div>
        </div>
        <ul class="me-list">
          <li>
            <span>角色</span><span class="tag tag-warning">{{ roleText }}</span>
          </li>
          <li><span>状态</span><span class="tag tag-success">正常</span></li>
          <li>
            <span>邮箱</span><span class="mono">{{ me?.email || '-' }}</span>
          </li>
          <li>
            <span>注册时间</span
            ><span class="mono">{{ me ? formatDateTime(me.createdAt) : '-' }}</span>
          </li>
        </ul>
      </section>

      <!-- 修改资料 -->
      <section class="card">
        <h3 class="section-title">修改资料</h3>
        <form @submit.prevent="saveProfile">
          <div class="form-item">
            <label class="form-label required" for="nickname">昵称</label>
            <input
              id="nickname"
              v-model="profileForm.nickname"
              class="form-input"
              type="text"
              data-testid="nickname-input"
            />
            <span v-if="profileErrors.nickname" class="form-error">{{
              profileErrors.nickname
            }}</span>
          </div>
          <div class="form-item">
            <label class="form-label" for="email">邮箱</label>
            <input
              id="email"
              v-model="profileForm.email"
              class="form-input"
              type="email"
              data-testid="email-input"
            />
            <span v-if="profileErrors.email" class="form-error">{{ profileErrors.email }}</span>
          </div>
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="savingProfile"
            data-testid="save-profile-btn"
          >
            {{ savingProfile ? '保存中…' : '保存资料' }}
          </button>
        </form>
      </section>

      <!-- 修改密码 -->
      <section class="card">
        <h3 class="section-title">修改密码</h3>
        <form @submit.prevent="changePassword">
          <div class="form-item">
            <label class="form-label required" for="new-password">新密码</label>
            <input
              id="new-password"
              v-model="passwordForm.newPassword"
              class="form-input"
              type="password"
              placeholder="至少 6 位"
              data-testid="new-password-input"
            />
          </div>
          <div class="form-item">
            <label class="form-label required" for="confirm-password">确认新密码</label>
            <input
              id="confirm-password"
              v-model="passwordForm.confirmPassword"
              class="form-input"
              type="password"
              data-testid="confirm-password-input"
            />
            <span v-if="passwordError" class="form-error" data-testid="password-error">{{
              passwordError
            }}</span>
          </div>
          <button class="btn btn-primary" type="submit" :disabled="savingPassword">
            {{ savingPassword ? '提交中…' : '修改密码' }}
          </button>
          <p class="hint">修改成功后会强制重新登录。</p>
        </form>
      </section>

      <!-- 危险区 -->
      <section class="card danger-zone">
        <h3 class="section-title">演示数据</h3>
        <p class="hint">把用户/文章等数据恢复到初始状态（本项目教学辅助功能）。</p>
        <button
          class="btn btn-danger"
          :disabled="resetting"
          data-testid="reset-data-btn"
          @click="resetOpen = true"
        >
          {{ resetting ? '重置中…' : '🔄 重置演示数据' }}
        </button>
      </section>
    </div>

    <ConfirmDialog
      :open="resetOpen"
      title="重置演示数据"
      message="将清空你对演示数据的所有修改并退出登录，确定继续吗？"
      danger
      :loading="resetting"
      @confirm="handleReset"
      @cancel="resetOpen = false"
    />
  </div>
</template>

<style scoped>
.success-banner {
  padding: 10px 14px;
  margin-bottom: 16px;
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  color: var(--color-success);
}

/* 两列网格：窄屏自动变一列 */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.section-title {
  font-size: 16px;
  margin-bottom: 16px;
}

.me-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.me-avatar {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
}

.me-nickname {
  font-weight: 600;
}

.me-username {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.me-list {
  list-style: none;
}

.me-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--color-border);
}

.me-list li:last-child {
  border-bottom: none;
}

.hint {
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.danger-zone {
  border: 1px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
}

.mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
}
</style>

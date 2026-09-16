<!-- 📖 配套教程：docs/06-components-communication.md（watch 一节）、docs/10-patterns.md（表单套路）
     用户表单弹窗：新增和编辑共用一个组件（editingUser 为 null = 新增模式）。
     核心模式：watch 打开状态 → 每次打开时重置/回填表单，避免"上次的输入还残留着"。 -->
<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { UserAccount, UserForm } from '@/types/models'

const props = defineProps<{
  open: boolean
  /** 编辑时传入要改的用户；新增传 null */
  user: UserAccount | null
  /** 父组件提交中，禁用保存按钮 */
  loading?: boolean
}>()

const emit = defineEmits<{ save: [form: UserForm]; close: [] }>()

const isEdit = computed(() => props.user !== null)

/* ---------- 表单状态 ---------- */
function emptyForm(): UserForm {
  return { username: '', nickname: '', email: '', role: 'editor', status: 1 }
}

const form = reactive<UserForm>(emptyForm())
const errors = reactive({ username: '', nickname: '', email: '' })

/** 每次"打开"时初始化：编辑=显式拷贝需要的字段（避免把 id/createdAt 一起带进来），新增=清空 */
watch(
  () => props.open,
  (open) => {
    if (!open) return
    errors.username = errors.nickname = errors.email = ''
    const user = props.user
    Object.assign(
      form,
      user
        ? {
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            status: user.status,
          }
        : emptyForm(),
    )
  },
  { immediate: true }, // 组件创建时也执行一次
)

/* ---------- 校验 ---------- */
function validate(): boolean {
  errors.username = form.username.trim() === '' ? '请输入用户名' : ''
  errors.nickname = form.nickname.trim() === '' ? '请输入昵称' : ''
  errors.email = form.email !== '' && !form.email.includes('@') ? '邮箱格式不正确' : ''
  return !errors.username && !errors.nickname && !errors.email
}

function handleSave(): void {
  if (!validate()) return
  // 展开拷贝一份再上报：避免父组件拿到（并可能修改）本组件的内部状态
  emit('save', {
    ...form,
    username: form.username.trim(),
    nickname: form.nickname.trim(),
    email: form.email.trim(),
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-overlay" @click.self="emit('close')">
      <div class="dialog-box card" role="dialog" aria-modal="true">
        <h3 class="dialog-title">{{ isEdit ? '编辑用户' : '新增用户' }}</h3>

        <form @submit.prevent="handleSave">
          <div class="form-item">
            <label class="form-label required">用户名</label>
            <!-- 编辑模式下用户名不允许改（它是登录凭证） -->
            <input
              v-model="form.username"
              class="form-input"
              type="text"
              :disabled="isEdit"
              placeholder="登录账号"
            />
            <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
          </div>

          <div class="form-item">
            <label class="form-label required">昵称</label>
            <input v-model="form.nickname" class="form-input" type="text" placeholder="显示名称" />
            <span v-if="errors.nickname" class="form-error">{{ errors.nickname }}</span>
          </div>

          <div class="form-item">
            <label class="form-label">邮箱</label>
            <input
              v-model="form.email"
              class="form-input"
              type="email"
              placeholder="name@example.com"
            />
            <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
          </div>

          <div class="form-row">
            <div class="form-item">
              <label class="form-label">角色</label>
              <!-- v-model 绑定 select -->
              <select v-model="form.role" class="form-select">
                <option value="editor">编辑</option>
                <option value="admin">管理员</option>
              </select>
            </div>

            <div class="form-item">
              <label class="form-label">状态</label>
              <select v-model.number="form.status" class="form-select">
                <!-- select 的 value 是字符串，.number 修饰符自动转回数字 -->
                <option :value="1">启用</option>
                <option :value="0">禁用</option>
              </select>
            </div>
          </div>

          <div class="dialog-actions">
            <button class="btn" type="button" @click="emit('close')">取消</button>
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="loading"
              data-testid="user-form-save"
            >
              {{ loading ? '保存中…' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-box {
  width: 90%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-title {
  font-size: 16px;
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

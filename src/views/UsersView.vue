<!-- 📖 配套教程：docs/10-patterns.md（本章主角：CRUD 列表页完整套路）、
     docs/04-vue-basics.md（v-for 渲染表格）、docs/06-components-communication.md（组件组装）
     用户管理：搜索 + 分页 + 状态开关 + 新增/编辑弹窗 + 删除确认。
     这是全项目代码量最大的一页，建议对照 docs/10-patterns.md 逐段精读。 -->
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ApiError } from '@/api/http'
import { createUser, deleteUser, getUserPage, updateUser } from '@/api/user'
import type { UserPageQuery } from '@/api/user'
import { useLoading } from '@/composables/useLoading'
import { usePagination } from '@/composables/usePagination'
import { formatDateTime } from '@/utils/format'
import type { UserAccount, UserForm } from '@/types/models'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import UserFormDialog from '@/components/UserFormDialog.vue'

/* ---------- 列表状态 ---------- */
const users = ref<UserAccount[]>([])
const errorMessage = ref('')
const { loading, run } = useLoading()
// 分页三件套（页码/条数/总数）抽进了组合式函数，多页面可复用
const { page, pageSize, total, reset } = usePagination(10)

// 筛选条件（注意：只放筛选字段，分页字段在 usePagination 里）
const filters = reactive<{ keyword: string; status: 0 | 1 | '' }>({ keyword: '', status: '' })

/** 拉取列表：首次进入、翻页、搜索、增删改成功后都会调用它 */
async function fetchUsers(): Promise<void> {
  errorMessage.value = ''
  try {
    const result = await run(() =>
      getUserPage({
        page: page.value, // 组合式函数里的 ref 在 <script> 中要 .value（模板里不用）
        pageSize: pageSize.value,
        keyword: filters.keyword,
        status: filters.status,
      }),
    )
    users.value = result.list
    total.value = result.total
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '加载用户列表失败'
  }
}

onMounted(fetchUsers)

/* ---------- 搜索与分页 ---------- */
function handleSearch(): void {
  reset() // 筛选条件变了，回到第 1 页
  fetchUsers()
}

function handlePageChange(newPage: number, newSize: number): void {
  page.value = newPage
  pageSize.value = newSize
  fetchUsers()
}

/* ---------- 状态开关 ---------- */
async function toggleStatus(user: UserAccount): Promise<void> {
  try {
    await updateUser(user.id, { status: user.status === 1 ? 0 : 1 })
    await fetchUsers()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '操作失败'
  }
}

/* ---------- 删除（确认弹窗） ---------- */
const deleteTarget = ref<UserAccount | null>(null)
const deleteLoading = ref(false)

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await deleteUser(deleteTarget.value.id)
    deleteTarget.value = null // 先关弹窗
    await fetchUsers()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '删除失败'
  } finally {
    deleteLoading.value = false
  }
}

/* ---------- 新增 / 编辑（共用一个弹窗） ---------- */
const formOpen = ref(false)
const editingUser = ref<UserAccount | null>(null)
const saving = ref(false)

function openCreate(): void {
  editingUser.value = null
  formOpen.value = true
}

function openEdit(user: UserAccount): void {
  editingUser.value = user
  formOpen.value = true
}

async function handleSave(form: UserForm): Promise<void> {
  saving.value = true
  try {
    if (editingUser.value) {
      await updateUser(editingUser.value.id, form)
    } else {
      await createUser(form)
    }
    formOpen.value = false
    await fetchUsers()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '保存失败'
  } finally {
    saving.value = false
  }
}

/* ---------- 展示辅助：把枚举值映射成标签样式 ---------- */
function roleTag(role: UserAccount['role']): string {
  return role === 'admin' ? 'tag-warning' : 'tag-info'
}

function roleText(role: UserAccount['role']): string {
  return role === 'admin' ? '管理员' : '编辑'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <button class="btn btn-primary" data-testid="create-user-btn" @click="openCreate">＋ 新增用户</button>
    </div>

    <!-- 错误提示条：任何操作失败都显示在这里 -->
    <div v-if="errorMessage" class="error-banner" data-testid="error-banner">
      ⚠️ {{ errorMessage }}
      <button class="btn btn-sm" @click="errorMessage = ''">知道了</button>
    </div>

    <!-- 搜索区 -->
    <div class="card toolbar">
      <!-- v-model.trim：自动去首尾空格；@keyup.enter：回车即搜索 -->
      <input
        v-model.trim="filters.keyword"
        class="form-input search-input"
        type="text"
        placeholder="搜索用户名 / 昵称，回车确认"
        data-testid="search-input"
        @keyup.enter="handleSearch"
      />
      <select v-model.number="filters.status" class="form-select status-select" @change="handleSearch">
        <option value="">全部状态</option>
        <option :value="1">已启用</option>
        <option :value="0">已禁用</option>
      </select>
      <button class="btn" data-testid="search-btn" @click="handleSearch">🔍 搜索</button>
    </div>

    <!-- 列表 -->
    <div class="card">
      <div v-if="loading && users.length === 0" class="empty-state">
        <span class="loading-spinner"></span>
        <p>加载中…</p>
      </div>

      <table v-else class="data-table" data-testid="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>昵称</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td class="mono">{{ user.username }}</td>
            <td>{{ user.nickname }}</td>
            <td class="mono">{{ user.email || '-' }}</td>
            <td><span class="tag" :class="roleTag(user.role)">{{ roleText(user.role) }}</span></td>
            <td>
              <!-- 状态即按钮：点了直接切换（常见于开关类操作） -->
              <button
                class="tag tag-btn"
                :class="user.status === 1 ? 'tag-success' : 'tag-danger'"
                :title="user.status === 1 ? '点击禁用' : '点击启用'"
                :disabled="loading"
                @click="toggleStatus(user)"
              >
                {{ user.status === 1 ? '启用' : '禁用' }}
              </button>
            </td>
            <td class="mono">{{ formatDateTime(user.createdAt) }}</td>
            <td class="actions">
              <button class="btn btn-sm" data-testid="edit-user-btn" @click="openEdit(user)">编辑</button>
              <button class="btn btn-sm btn-danger" data-testid="delete-user-btn" @click="deleteTarget = user">
                删除
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="8">
              <p class="empty-state">没有符合条件的用户</p>
            </td>
          </tr>
        </tbody>
      </table>

      <PaginationBar :page="page" :page-size="pageSize" :total="total" @change="handlePageChange" />
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :open="deleteTarget !== null"
      title="删除用户"
      :message="`确定删除用户「${deleteTarget?.nickname ?? ''}」吗？此操作不可恢复。`"
      danger
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />

    <!-- 新增/编辑弹窗 -->
    <UserFormDialog :open="formOpen" :user="editingUser" :loading="saving" @save="handleSave" @close="formOpen = false" />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.status-select {
  width: auto;
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
}

.mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
}

/* 让 <button> 长得像 .tag：标签即按钮 */
.tag-btn {
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.tag-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
</style>

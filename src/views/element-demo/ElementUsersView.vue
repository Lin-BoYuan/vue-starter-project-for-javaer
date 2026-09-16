<!-- 📖 配套教程：docs/12-element-plus.md（本章主角）
     组件库对照页：和手写版 UsersView 功能完全一样，全部换用 Element Plus 组件。
     建议左右对照着读：手写版的 ConfirmDialog ↔ ElMessageBox.confirm、
     PaginationBar ↔ el-pagination、UserFormDialog ↔ el-dialog + el-form 校验规则。 -->
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ApiError } from '@/api/http'
import { createUser, deleteUser, getUserPage, updateUser } from '@/api/user'
import { formatDateTime } from '@/utils/format'
import { useLoading } from '@/composables/useLoading'
import { usePagination } from '@/composables/usePagination'
import type { UserAccount, UserForm } from '@/types/models'

const users = ref<UserAccount[]>([])
const errorMessage = ref('')
const { loading, run } = useLoading()
const { page, pageSize, total, reset } = usePagination(10)

const filters = reactive<{ keyword: string; status: 0 | 1 | '' }>({ keyword: '', status: '' })

async function fetchUsers(): Promise<void> {
  errorMessage.value = ''
  try {
    const result = await run(() =>
      getUserPage({
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword,
        status: filters.status,
      }),
    )
    users.value = result.list
    total.value = result.total
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '加载用户列表失败'
    ElMessage.error(errorMessage.value) // 组件库习惯：用全局消息提示代替页面内错误条
  }
}

onMounted(fetchUsers)

function handleSearch(): void {
  reset()
  fetchUsers()
}

function handlePageChange(newPage: number, newSize: number): void {
  page.value = newPage
  pageSize.value = newSize
  fetchUsers()
}

/* ---------- 状态开关：el-switch 直接改 ---------- */
async function toggleStatus(user: UserAccount): Promise<void> {
  try {
    await updateUser(user.id, { status: user.status === 1 ? 0 : 1 })
    await fetchUsers()
  } catch (error) {
    ElMessage.error(error instanceof ApiError ? error.message : '操作失败')
  }
}

/* ---------- 删除：ElMessageBox.confirm 是"命令式"弹窗（对比手写版的声明式 ConfirmDialog） ---------- */
async function askDelete(user: UserAccount): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除用户「${user.nickname}」吗？此操作不可恢复。`, '删除用户', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return // 用户点了取消（confirm 被 reject）
  }
  try {
    await deleteUser(user.id)
    ElMessage.success('删除成功')
    await fetchUsers()
  } catch (error) {
    ElMessage.error(error instanceof ApiError ? error.message : '删除失败')
  }
}

/* ---------- 新增 / 编辑：el-dialog + el-form 校验规则 ---------- */
const formOpen = ref(false)
const editingUser = ref<UserAccount | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>() // 组件 ref：拿到 el-form 实例来调 validate() 方法

const form = reactive<UserForm>({ username: '', nickname: '', email: '', role: 'editor', status: 1 })

// 校验规则：声明式配置，框架自动执行（对比手写版自己写的 validate 函数）
const rules: FormRules<UserForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度 2 ~ 20 个字符', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}

function openCreate(): void {
  editingUser.value = null
  Object.assign(form, { username: '', nickname: '', email: '', role: 'editor', status: 1 })
  formOpen.value = true
}

function openEdit(user: UserAccount): void {
  editingUser.value = user
  Object.assign(form, {
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    status: user.status,
  })
  formOpen.value = true
}

async function handleSave(): Promise<void> {
  // el-form 实例方法 validate()：返回 Promise，校验不过会 reject
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (editingUser.value) {
      await updateUser(editingUser.value.id, { ...form })
    } else {
      await createUser({ ...form })
    }
    formOpen.value = false
    ElMessage.success('保存成功')
    await fetchUsers()
  } catch (error) {
    ElMessage.error(error instanceof ApiError ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        用户管理 · Element Plus 版
        <el-tag size="small" type="info" style="margin-left: 8px">与手写版功能相同，对照阅读</el-tag>
      </h2>
      <el-button type="primary" @click="openCreate">＋ 新增用户</el-button>
    </div>

    <el-card shadow="never" class="toolbar">
      <!-- el-form 的 inline 模式：一行放多个表单项 -->
      <el-form inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model.trim="filters.keyword"
            placeholder="用户名 / 昵称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model.number="filters.status" style="width: 120px" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="users" v-loading="loading" data-testid="el-user-table">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="角色" width="100">
          <!-- 作用域插槽：拿到当前行数据自定义渲染（组件库表格的标准玩法） -->
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'warning' : 'info'">
              {{ row.role === 'admin' ? '管理员' : '编辑' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              :disabled="loading"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="askDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, sizes, prev, pager, next"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="(p: number) => handlePageChange(p, pageSize)"
        @size-change="(s: number) => handlePageChange(1, s)"
      />
    </el-card>

    <el-dialog
      v-model="formOpen"
      :title="editingUser ? '编辑用户' : '新增用户'"
      width="440px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="editingUser !== null" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="编辑" value="editor" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model.number="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>

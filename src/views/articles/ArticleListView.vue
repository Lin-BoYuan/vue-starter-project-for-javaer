<!-- 📖 配套教程：docs/10-patterns.md（列表页套路复现）
     文章列表：和用户管理同源的"搜索 + 筛选 + 分页 + 表格"结构，
     差异点：操作里多了"查看详情"——用 RouterLink 跳动态路由。 -->
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ApiError } from '@/api/http'
import { deleteArticle, getArticlePage } from '@/api/article'
import { useLoading } from '@/composables/useLoading'
import { usePagination } from '@/composables/usePagination'
import { formatDateTime, formatNumber } from '@/utils/format'
import { ARTICLE_CATEGORIES } from '@/constants/article'
import type { Article } from '@/types/models'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const articles = ref<Article[]>([])
const errorMessage = ref('')
const { loading, run } = useLoading()
const { page, pageSize, total, reset } = usePagination(10)

// filters 只存筛选字段（page/pageSize 在 usePagination 里），请求时再拼到一起
const filters = reactive<{ keyword: string; category: string; status: 'draft' | 'published' | '' }>({
  keyword: '',
  category: '',
  status: '',
})

async function fetchArticles(): Promise<void> {
  errorMessage.value = ''
  try {
    const result = await run(() =>
      getArticlePage({
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword,
        category: filters.category,
        status: filters.status,
      }),
    )
    articles.value = result.list
    total.value = result.total
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '加载文章列表失败'
  }
}

onMounted(fetchArticles)

function handleSearch(): void {
  reset()
  fetchArticles()
}

function handlePageChange(newPage: number, newSize: number): void {
  page.value = newPage
  pageSize.value = newSize
  fetchArticles()
}

/* ---------- 删除 ---------- */
const deleteTarget = ref<Article | null>(null)
const deleteLoading = ref(false)

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await deleteArticle(deleteTarget.value.id)
    deleteTarget.value = null
    await fetchArticles()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '删除失败'
  } finally {
    deleteLoading.value = false
  }
}

function statusTag(status: Article['status']): string {
  return status === 'published' ? 'tag-success' : 'tag-warning'
}

function statusText(status: Article['status']): string {
  return status === 'published' ? '已发布' : '草稿'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">文章管理</h2>
      <!-- 编程式导航的模板版：<RouterLink> 会渲染成 <a>，且不会整页刷新 -->
      <RouterLink class="btn btn-primary" :to="{ name: 'article-new' }">✍️ 新建文章</RouterLink>
    </div>

    <div v-if="errorMessage" class="error-banner" data-testid="error-banner">
      ⚠️ {{ errorMessage }}
      <button class="btn btn-sm" @click="errorMessage = ''">知道了</button>
    </div>

    <div class="card toolbar">
      <input
        v-model.trim="filters.keyword"
        class="form-input search-input"
        type="text"
        placeholder="搜索标题，回车确认"
        data-testid="article-search"
        @keyup.enter="handleSearch"
      />
      <select v-model="filters.category" class="form-select" @change="handleSearch">
        <option value="">全部分类</option>
        <!-- v-for 也可以遍历常量数组 -->
        <option v-for="category in ARTICLE_CATEGORIES" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      <select v-model="filters.status" class="form-select" @change="handleSearch">
        <option value="">全部状态</option>
        <option value="published">已发布</option>
        <option value="draft">草稿</option>
      </select>
      <button class="btn" @click="handleSearch">🔍 搜索</button>
    </div>

    <div class="card">
      <div v-if="loading && articles.length === 0" class="empty-state">
        <span class="loading-spinner"></span>
        <p>加载中…</p>
      </div>

      <table v-else class="data-table" data-testid="article-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>分类</th>
            <th>状态</th>
            <th>阅读量</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in articles" :key="article.id">
            <td>{{ article.id }}</td>
            <td>
              <RouterLink class="title-link" :to="`/articles/${article.id}`">
                {{ article.title }}
              </RouterLink>
            </td>
            <td><span class="tag tag-info">{{ article.category }}</span></td>
            <td><span class="tag" :class="statusTag(article.status)">{{ statusText(article.status) }}</span></td>
            <td>{{ formatNumber(article.views) }}</td>
            <td class="mono">{{ formatDateTime(article.createdAt) }}</td>
            <td class="actions">
              <RouterLink class="btn btn-sm" :to="`/articles/${article.id}/edit`">编辑</RouterLink>
              <button class="btn btn-sm btn-danger" @click="deleteTarget = article">删除</button>
            </td>
          </tr>
          <tr v-if="articles.length === 0">
            <td colspan="7">
              <p class="empty-state">没有符合条件的文章</p>
            </td>
          </tr>
        </tbody>
      </table>

      <PaginationBar :page="page" :page-size="pageSize" :total="total" @change="handlePageChange" />
    </div>

    <ConfirmDialog
      :open="deleteTarget !== null"
      title="删除文章"
      :message="`确定删除文章「${deleteTarget?.title ?? ''}」吗？此操作不可恢复。`"
      danger
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
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

.title-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
}

.title-link:hover {
  color: var(--color-primary);
}

.mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
</style>

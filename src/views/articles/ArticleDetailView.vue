<!-- 📖 配套教程：docs/07-router.md（动态路由参数）
     文章详情页：URL 形如 /articles/3，从路由参数里取 id 再查接口。
     ☕ Java 视角：route.params.id ≈ @PathVariable Long id。 -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError } from '@/api/http'
import { getArticleById } from '@/api/article'
import { useLoading } from '@/composables/useLoading'
import { formatDateTime, formatNumber } from '@/utils/format'
import type { Article } from '@/types/models'

const route = useRoute()

const article = ref<Article | null>(null)
const errorMessage = ref('')
const { loading, run } = useLoading()

async function loadArticle(): Promise<void> {
  errorMessage.value = ''
  // route.params.id 的类型是 string | string[]（一个参数名可以配多个段），
  // Number() 统一转成数字；非法 id（如 /articles/abc）会让接口返回 404
  const id = Number(route.params.id)
  try {
    article.value = await run(() => getArticleById(id))
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '加载文章失败'
  }
}

onMounted(loadArticle)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <RouterLink class="btn" :to="{ name: 'articles' }">← 返回列表</RouterLink>
      <!-- 有 id 才显示编辑按钮（新增/详情共用细节见 docs/07 的动态段讲解） -->
      <RouterLink v-if="article" class="btn btn-primary" :to="`/articles/${article.id}/edit`">
        ✏️ 编辑本文
      </RouterLink>
    </div>

    <div v-if="loading" class="card empty-state">
      <span class="loading-spinner"></span>
      <p>加载中…</p>
    </div>

    <div v-else-if="errorMessage" class="card empty-state" data-testid="detail-error">
      <p>⚠️ {{ errorMessage }}</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'articles' }">回列表看看</RouterLink>
    </div>

    <article v-else-if="article" class="card article-body">
      <header class="article-header">
        <h1 class="article-title" data-testid="detail-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span class="tag tag-info">{{ article.category }}</span>
          <span class="tag" :class="article.status === 'published' ? 'tag-success' : 'tag-warning'">
            {{ article.status === 'published' ? '已发布' : '草稿' }}
          </span>
          <span>👀 {{ formatNumber(article.views) }}</span>
          <span>🕒 {{ formatDateTime(article.createdAt) }}</span>
        </div>
      </header>

      <p class="article-summary">{{ article.summary }}</p>
      <!-- white-space: pre-wrap 让正文里的换行符正常显示（CSS 知识点） -->
      <div class="article-content">{{ article.content }}</div>
    </article>
  </div>
</template>

<style scoped>
.article-header {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.article-title {
  font-size: 24px;
  line-height: 1.4;
  margin-bottom: 12px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.article-summary {
  color: var(--color-text-secondary);
  border-left: 3px solid var(--color-primary);
  padding-left: 12px;
  margin-bottom: 16px;
  line-height: 1.7;
}

.article-content {
  line-height: 1.8;
  white-space: pre-wrap; /* 保留用户输入的换行和空格 */
}
</style>

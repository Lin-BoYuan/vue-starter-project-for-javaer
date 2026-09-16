<!-- 📖 配套教程：docs/07-router.md（多路由复用同一组件）、docs/10-patterns.md（表单套路）
     文章编辑页：一个组件服务两条路由——
       /articles/new      → 新建模式（articleId = null）
       /articles/:id/edit → 编辑模式（先按 id 加载原文回填表单）
     ☕ Java 视角：≈ 同一个 Controller 方法同时映射两个 URL。 -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import { createArticle, getArticleById, updateArticle } from '@/api/article'
import { useLoading } from '@/composables/useLoading'
import { ARTICLE_CATEGORIES } from '@/constants/article'
import type { ArticleForm } from '@/types/models'

const route = useRoute()
const router = useRouter()

/** URL 里有 :id 就是编辑模式；Number('3') → 3，Number(undefined) → NaN，用 isNaN 判断 */
const articleId = route.params.id ? Number(route.params.id) : null
const isEdit = computed(() => articleId !== null)

const form = reactive<ArticleForm>({
  title: '',
  summary: '',
  content: '',
  category: '前端',
  status: 'draft',
})

const errorMessage = ref('')
const titleError = ref('')
const { loading, run } = useLoading()
const saving = ref(false)

/* 编辑模式：进页面先加载原文回填 */
onMounted(async () => {
  if (articleId === null) return
  try {
    const article = await run(() => getArticleById(articleId))
    Object.assign(form, {
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      status: article.status,
    })
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '加载文章失败'
  }
})

function validateTitle(): boolean {
  titleError.value = form.title.trim() === '' ? '请输入标题' : ''
  return titleError.value === ''
}

async function handleSubmit(): Promise<void> {
  if (!validateTitle()) return
  saving.value = true
  errorMessage.value = ''
  try {
    const saved =
      articleId !== null
        ? await updateArticle(articleId, { ...form })
        : await createArticle({ ...form })
    // 保存成功 → 跳到详情页（新文章也能直接看到成果）
    router.push(`/articles/${saved.id}`)
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <RouterLink class="btn" :to="{ name: 'articles' }">← 返回列表</RouterLink>
    </div>

    <div v-if="errorMessage" class="error-banner">⚠️ {{ errorMessage }}</div>

    <form class="card editor-card" @submit.prevent="handleSubmit">
      <div class="form-item">
        <label class="form-label required" for="title">标题</label>
        <input
          id="title"
          v-model="form.title"
          class="form-input"
          type="text"
          placeholder="给文章起个名字"
          data-testid="article-title"
          @blur="validateTitle"
        />
        <span v-if="titleError" class="form-error">{{ titleError }}</span>
      </div>

      <div class="form-row">
        <div class="form-item">
          <label class="form-label" for="category">分类</label>
          <select id="category" v-model="form.category" class="form-select">
            <option v-for="category in ARTICLE_CATEGORIES" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div class="form-item">
          <span class="form-label">状态</span>
          <!-- radio 组：name 相同的 radio 互斥，v-model 绑定同一个值 -->
          <div class="radio-row">
            <label class="radio-item">
              <input v-model="form.status" type="radio" value="draft" />
              草稿
            </label>
            <label class="radio-item">
              <input v-model="form.status" type="radio" value="published" />
              发布
            </label>
          </div>
        </div>
      </div>

      <div class="form-item">
        <label class="form-label" for="summary">摘要</label>
        <input id="summary" v-model="form.summary" class="form-input" type="text" placeholder="列表页展示的一句话简介" />
      </div>

      <div class="form-item">
        <label class="form-label" for="content">正文</label>
        <textarea id="content" v-model="form.content" class="form-textarea" placeholder="支持换行，详情页会按原样显示"></textarea>
      </div>

      <div class="editor-actions">
        <button class="btn btn-primary" type="submit" :disabled="saving || loading" data-testid="article-save">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.error-banner {
  padding: 10px 14px;
  margin-bottom: 16px;
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
}

.editor-card {
  max-width: 760px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.radio-row {
  display: flex;
  gap: 16px;
  padding-top: 6px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
}
</style>

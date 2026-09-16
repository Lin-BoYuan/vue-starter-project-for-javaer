<!-- 📖 配套教程：docs/05-composition-api.md（生命周期与异步状态）、docs/10-patterns.md（Loading/错误/空状态套路）
     仪表盘：统计卡片 + 柱状图 + 最新文章。
     重点看三态渲染：加载中 → 出错（可重试）→ 正常数据，这是所有页面都会用到的套路。 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiError } from '@/api/http'
import { getDashboardStats } from '@/api/dashboard'
import { useLoading } from '@/composables/useLoading'
import { formatDateTime, formatNumber } from '@/utils/format'
import type { DashboardStats } from '@/types/models'
import BarChart from '@/components/BarChart.vue'
import StatCard from '@/components/StatCard.vue'

/* ---------- 异步状态三件套 ---------- */
const stats = ref<DashboardStats | null>(null)
const errorMessage = ref('')
const { loading, run } = useLoading()

/** 拉取统计数据：onMounted 首次调用 + 错误后"重试"按钮复用同一个函数 */
async function loadStats(): Promise<void> {
  errorMessage.value = ''
  try {
    stats.value = await run(getDashboardStats)
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '加载失败，请稍后重试'
  }
}

// ☕ Java 视角：onMounted ≈ @PostConstruct——组件"挂载"（第一次渲染进页面）后执行
onMounted(loadStats)

/* ---------- computed：从原始数据派生视图数据 ---------- */
// 给 computed 标注泛型：让 accent 保持字面量类型，否则会被放宽成 string，
// 传给 StatCard 的 accent prop（联合类型）时就对不上了
interface StatCardItem {
  label: string
  value: string
  icon: string
  accent: 'primary' | 'success' | 'warning' | 'danger'
}

const statCards = computed<StatCardItem[]>(() => {
  if (!stats.value) return []
  return [
    {
      label: '用户总数',
      value: formatNumber(stats.value.totalUsers),
      icon: '👥',
      accent: 'primary',
    },
    {
      label: '文章总数',
      value: formatNumber(stats.value.totalArticles),
      icon: '📝',
      accent: 'success',
    },
    {
      label: '总阅读量',
      value: formatNumber(stats.value.totalViews),
      icon: '👀',
      accent: 'warning',
    },
    {
      label: '在线会话',
      value: formatNumber(stats.value.todayLogins),
      icon: '🔑',
      accent: 'danger',
    },
  ]
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <button class="btn" :disabled="loading" data-testid="refresh-btn" @click="loadStats">
        {{ loading ? '刷新中…' : '🔄 刷新' }}
      </button>
    </div>

    <!-- 三态渲染之：加载中 -->
    <div v-if="loading && !stats" class="card empty-state">
      <span class="loading-spinner"></span>
      <p>正在加载统计数据…</p>
    </div>

    <!-- 三态渲染之：出错（带重试） -->
    <div v-else-if="errorMessage" class="card empty-state" data-testid="error-state">
      <p>⚠️ {{ errorMessage }}</p>
      <button class="btn btn-primary" @click="loadStats">重试</button>
    </div>

    <!-- 三态渲染之：正常 -->
    <template v-else-if="stats">
      <!-- 统计卡片：CSS Grid 四列布局（窄屏自动换行） -->
      <div class="stats-grid">
        <!-- v-for 遍历对象数组 + :key；组件名_kebab-case 写法 -->
        <StatCard
          v-for="card in statCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :accent="card.accent"
        />
      </div>

      <div class="charts-row">
        <section class="card">
          <h3 class="section-title">近 6 个月发文量</h3>
          <BarChart :data="stats.monthlyArticles" />
        </section>

        <section class="card">
          <h3 class="section-title">最新文章</h3>
          <!-- v-for + 空状态：列表可能为空，别忘了兜底 -->
          <ul v-if="stats.recentArticles.length > 0" class="recent-list">
            <li v-for="article in stats.recentArticles" :key="article.id" class="recent-item">
              <!-- RouterLink 动态拼接：/articles/3 -->
              <RouterLink class="recent-link" :to="`/articles/${article.id}`">
                {{ article.title }}
              </RouterLink>
              <span class="recent-meta">
                {{ article.category }} · {{ formatDateTime(article.createdAt) }}
              </span>
            </li>
          </ul>
          <p v-else class="empty-state">还没有文章，去「文章管理」写一篇吧～</p>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Grid：repeat(auto-fit, minmax(...)) 是"响应式列数"的惯用写法——
   空间够就 4 列，不够自动变 2 列、1 列，一行媒体查询都不用写 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.section-title {
  font-size: 16px;
  margin-bottom: 12px;
}

.recent-list {
  list-style: none;
}

.recent-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--color-border);
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
}

.recent-link:hover {
  color: var(--color-primary);
}

.recent-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>

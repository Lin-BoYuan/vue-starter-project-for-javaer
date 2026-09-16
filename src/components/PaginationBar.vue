<!-- 📖 配套教程：docs/06-components-communication.md（props/emits 综合演练）、docs/10-patterns.md（分页套路）
     分页条：受控组件——自己不改状态，只把"用户想要第几页"上报给父组件。
     ☕ Java 视角：≈ 一个没有副作用的无状态 EJB，输入参数、发事件，数据权威始终在父组件。 -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

/** 父组件同时接收页码和每页条数 */
const emit = defineEmits<{ change: [page: number, pageSize: number] }>()

/** 总页数：向上取整（21 条 / 每页 10 = 3 页） */
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

/** 当前展示哪几个页码按钮：以当前页为中心，最多 5 个 */
const visiblePages = computed<number[]>(() => {
  const start = Math.max(1, props.page - 2)
  const end = Math.min(totalPages.value, start + 4)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function go(target: number): void {
  // 边界防御：越界或重复点击不上报
  if (target < 1 || target > totalPages.value || target === props.page) return
  emit('change', target, props.pageSize)
}

/** 切换每页条数：永远回到第 1 页 */
function handleSizeChange(event: Event): void {
  // TS 的事件类型：event.target 是宽泛的 EventTarget，要访问 .value 需要断言成 HTMLSelectElement
  const select = event.target as HTMLSelectElement
  emit('change', 1, Number(select.value))
}
</script>

<template>
  <div v-if="total > 0" class="pagination">
    <span class="total-text">共 {{ total }} 条</span>

    <!-- :value 绑定当前条数，change 时上报 -->
    <select class="form-select size-select" :value="pageSize" @change="handleSizeChange">
      <option :value="10">10 条/页</option>
      <option :value="20">20 条/页</option>
      <option :value="50">50 条/页</option>
    </select>

    <button class="page-btn" :disabled="page <= 1" @click="go(page - 1)">‹</button>

    <!-- :class 的对象语法：键是类名，值是布尔——true 时加上该类 -->
    <button
      v-for="p in visiblePages"
      :key="p"
      class="page-btn"
      :class="{ active: p === page }"
      @click="go(p)"
    >
      {{ p }}
    </button>

    <button class="page-btn" :disabled="page >= totalPages" @click="go(page + 1)">›</button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  flex-wrap: wrap;
}

.total-text {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.size-select {
  width: auto;
  padding: 4px 8px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--color-bg-card);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  cursor: default;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

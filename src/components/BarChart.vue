<!-- 📖 配套教程：docs/05-composition-api.md（computed 一节）、docs/11-styling.md（Flex 布局）
     纯 CSS 柱状图：不用任何图表库，父元素定高、柱子按百分比撑高。
     想说明的重点：很多"看起来要引库"的效果，CSS + computed 就够了。 -->
<script setup lang="ts">
import { computed } from 'vue'

/**
 * 要在 <script> 里访问 props，就给 defineProps 一个变量接收；
 * 只是模板里用的话可以不接收。
 */
const props = defineProps<{
  data: { month: string; count: number }[]
}>()

/** 最大值作为柱高的 100% 基准（Math.max(...展开) 至少为 1，防止全 0 时除零） */
const maxValue = computed(() => Math.max(...props.data.map((d) => d.count), 1))

/** 把数量换算成高度百分比字符串 */
function barHeight(count: number): string {
  return `${Math.round((count / maxValue.value) * 100)}%`
}
</script>

<template>
  <div class="bar-chart">
    <!-- v-for 遍历数组；:key 建议用稳定的唯一值（不要用数组下标） -->
    <div v-for="item in data" :key="item.month" class="bar-column">
      <span class="bar-count">{{ item.count }}</span>
      <!-- 柱子轨道 + 填充：track 定高，fill 按百分比从底部撑起 -->
      <div class="bar-track">
        <div class="bar-fill" :style="{ height: barHeight(item.count) }"></div>
      </div>
      <!-- "2026-09" → "09月" -->
      <span class="bar-label">{{ item.month.slice(5) }}月</span>
    </div>
  </div>
</template>

<style scoped>
.bar-chart {
  display: flex;
  align-items: stretch; /* 列高拉满 */
  justify-content: space-around;
  gap: 8px;
  height: 200px;
  padding: 8px 0;
}

.bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 32px;
  flex: 1;
}

.bar-count {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 40px;
  display: flex;
  align-items: flex-end; /* 填充从底部往上长 */
  background: color-mix(in srgb, var(--color-border) 35%, transparent);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, var(--color-primary), var(--color-primary-dark));
  border-radius: 6px 6px 0 0;
  transition: height 0.4s ease; /* 数据变化时柱子平滑生长 */
}

.bar-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>

<!-- 📖 配套教程：docs/06-components-communication.md（props 一节）
     统计卡片：纯展示组件（props 进、渲染出，没有自己的业务逻辑）。
     ☕ Java 视角：≈ 一个只有构造入参的不可变 VO + 它的 JSP 渲染片段。
     组件复用：仪表盘里 new 四个，每个传不同的 label/value —— 这就是组件化的意义。 -->
<script setup lang="ts">
/**
 * defineProps 的"类型式"写法：直接写 TS 类型，编译器自动生成运行时校验。
 * （等价的"对象式"写法：defineProps({ label: { type: String, required: true }, ... })）
 */
defineProps<{
  /** 指标名称，如"用户总数" */
  label: string
  /** 指标值（父组件负责格式化好再传进来，组件保持"傻"一点更通用） */
  value: string | number
  /** 图标（emoji） */
  icon?: string
  /** 强调色主题 */
  accent?: 'primary' | 'success' | 'warning' | 'danger'
}>()
</script>

<template>
  <div class="stat-card card">
    <div class="stat-icon" :class="`accent-${accent ?? 'primary'}`">{{ icon ?? '📌' }}</div>
    <div class="stat-info">
      <div class="stat-value">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  border-radius: 12px;
}

/* 用 CSS 变量给不同 accent 主题着色（:class 动态绑定） */
.accent-primary {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.accent-success {
  background: color-mix(in srgb, var(--color-success) 14%, transparent);
}

.accent-warning {
  background: color-mix(in srgb, var(--color-warning) 14%, transparent);
}

.accent-danger {
  background: color-mix(in srgb, var(--color-danger) 14%, transparent);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
</style>

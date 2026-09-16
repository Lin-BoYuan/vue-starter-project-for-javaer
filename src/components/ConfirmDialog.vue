<!-- 📖 配套教程：docs/06-components-communication.md（emits 一节）、docs/10-patterns.md（弹窗套路）
     确认弹窗：删除等危险操作的通用"再想想"组件。
     数据流：父组件用 v-if 控制开关（open prop），本组件只发事件（confirm/cancel），
     绝不自己关自己——单向数据流，谁的数据谁做主。 -->
<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
  message: string
  /** 危险操作（如删除）时确认按钮显示为红色 */
  danger?: boolean
  /** 父组件正在执行确认动作时禁用按钮，防重复提交 */
  loading?: boolean
}>()

// 类型化的 emits 声明：['confirm', 'cancel'] 的 TS 版
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <!-- Teleport：把弹窗 DOM "传送"到 <body> 下，脱离父组件的 overflow/z-index 影响 -->
  <Teleport to="body">
    <!-- v-if 控制显隐；@click.self：只有点到遮罩本身（不是里面的弹窗）才关闭 -->
    <div v-if="open" class="dialog-overlay" @click.self="emit('cancel')">
      <div class="dialog-box card" role="dialog" aria-modal="true">
          <h3 class="dialog-title">{{ title ?? '确认操作' }}</h3>
          <p class="dialog-message">{{ message }}</p>
          <div class="dialog-actions">
            <button class="btn" @click="emit('cancel')">取消</button>
            <button
              class="btn"
              :class="danger ? 'btn-danger' : 'btn-primary'"
              :disabled="loading"
              data-testid="dialog-confirm"
              @click="emit('confirm')"
            >
              {{ loading ? '处理中…' : '确定' }}
            </button>
          </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0; /* top/right/bottom/left 全 0 的简写 */
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-box {
  width: 90%;
  max-width: 400px;
}

.dialog-title {
  font-size: 16px;
  margin-bottom: 10px;
}

.dialog-message {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

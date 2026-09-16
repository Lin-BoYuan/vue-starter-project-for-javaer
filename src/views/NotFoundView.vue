<!-- 📖 配套教程：docs/07-router.md（通配路由）
     404 页面：所有未匹配的 URL 都会落到这里（见 router/index.ts 的 /:pathMatch(.*)*）。
     用户点"返回首页"用 router.back() 沿历史原路返回——编程式导航的演示。 -->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="not-found">
    <h1 class="code">404</h1>
    <p>页面走丢了：您访问的地址不存在</p>
    <div class="actions">
      <button class="btn" @click="router.back()">← 返回上一页</button>
      <RouterLink class="btn btn-primary" to="/dashboard">回仪表盘</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

.code {
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  color: var(--color-primary);
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
</style>

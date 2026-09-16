<!-- 📖 配套教程：docs/04-vue-basics.md
     脚手架占位页，仅用于验证项目能跑起来，后续章节会被真实页面替换。 -->
<script setup lang="ts">
// 目前没有任何逻辑——先感受一下 .vue 文件的三段式结构：
// <script setup> 写逻辑（相当于 Controller），<template> 写结构（HTML），<style> 写样式（CSS）
</script>

<template>
  <main class="start-page">
    <h1>🚀 Vue3 + TypeScript 脚手架就绪</h1>
    <p>这是一个占位页面，后续章节将逐步替换为登录页和管理后台。</p>
    <p>运行 <code>npm run dev</code> 后访问本页即代表环境搭建成功。</p>
  </main>
</template>

<style scoped>
.start-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
</style>

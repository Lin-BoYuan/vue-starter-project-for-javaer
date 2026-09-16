<!-- 📖 配套教程：docs/04-vue-basics.md
     根组件：整个组件树的根。template 里只有 <RouterView />，
     意思是"当前 URL 匹配到哪个页面组件，就在这里渲染它"。
     ☕ Java 视角：可以把 App.vue 理解为 DispatcherServlet 的"画布"，
     具体画什么由路由（URL 映射）决定。 -->
<script setup lang="ts">
// <script setup> 是 Vue3 的组合式 API 写法，后面章节详细讲
</script>

<template>
  <RouterView />
</template>

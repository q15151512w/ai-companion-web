<template>
  <!-- 根组件：仅渲染路由出口，实际页面由路由决定 -->
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useTheme } from '@/composables/useTheme';

// 应用级主题初始化：读取本地存储的主题并应用到 body（与原生逻辑一致）
const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

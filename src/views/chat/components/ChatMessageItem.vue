<template>
  <!-- 单条聊天消息气泡 -->
  <div :class="['message', message.role]">
    <!-- 头像：用户 / AI（线性图标，颜色跟随头像渐变） -->
    <div class="message-avatar">
      <AppIcon :name="message.role === 'user' ? 'user' : 'bot'" :size="18" />
    </div>
    <!-- 消息内容：Vue 插值自动转义，等价于原生代码中的 escapeHtml 处理 -->
    <div class="message-content">{{ message.content }}</div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/common/AppIcon.vue';

defineProps({
  /** 消息对象：{ role: 'user' | 'assistant', content: string } */
  message: {
    type: Object,
    required: true
  }
});
</script>

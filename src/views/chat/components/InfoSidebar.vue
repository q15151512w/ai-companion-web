<template>
  <!-- 右侧项目介绍栏（REQ-06 动态化：请求 /project-info 实时渲染，失败/空数据用内置默认文案兜底） -->
  <aside class="info-sidebar">
    <div class="info-header">
      <h2><AppIcon name="book" :size="18" /> 项目介绍</h2>
    </div>

    <div class="info-content">
      <!-- 加载态：骨架屏 -->
      <div v-if="loading" class="info-section skeleton">
        <p class="skeleton-line"></p>
        <p class="skeleton-line"></p>
        <p class="skeleton-line short"></p>
      </div>

      <!-- 有数据：按后端返回顺序动态渲染 -->
      <template v-else-if="sections.length">
        <div
          v-for="section in sections"
          :key="section.id"
          class="info-section"
        >
          <h3>{{ section.icon }} {{ section.title }}</h3>

          <!-- paragraph：纯文本 -->
          <p v-if="section.content_type === 'paragraph'">{{ section.content }}</p>

          <!-- list：JSON 字符串数组 -->
          <ul v-else class="feature-list">
            <li v-for="(item, idx) in parseList(section.content)" :key="idx">{{ item }}</li>
          </ul>
        </div>
      </template>

      <!-- 兜底数据渲染：显示前端写死的内容（后端未能传递数据时） -->
      <template v-else>
        <div
          v-for="section in DEFAULT_SECTIONS"
          :key="section.title"
          class="info-section"
        >
          <!-- paragraph：纯文本 -->
          <p v-if="section.content_type === 'paragraph'">
            <strong>{{ section.content }}</strong>
          </p>

          <!-- list：数组 -->
          <template v-else>
            <h3><AppIcon :name="section.icon" :size="15" /> {{ section.title }}</h3>
            <ul class="feature-list">
              <li v-for="(item, idx) in section.content" :key="idx">{{ item }}</li>
            </ul>
          </template>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { getProjectInfo } from '@/api/modules/project';

// 接口数据与加载态
const sections = ref([]);
const loading = ref(true);

/**
 * 前端写死的兜底文案
 * 当后端未能成功返回数据（接口失败 / 空数组 / 非数组）时展示。
 * 结构与接口返回一致：{ icon, title, content_type, content }。
 */
const DEFAULT_SECTIONS = [
  {
    icon: 'message',
    title: '项目简介',
    content_type: 'paragraph',
    content: 'AI智能伴侣 是一款基于人工智能的情感陪伴应用，通过先进的自然语言处理技术，为你打造专属的虚拟伴侣体验。'
  },
  {
    icon: 'edit',
    title: '核心玩法',
    content_type: 'list',
    content: ['你可以为AI伴侣设置昵称和性格，她会以对应的人设与你进行自然、温馨的对话。', '无论是分享日常、倾诉心事，还是闲聊打发时间，她都能给你温暖的回应。']
  },
  {
    icon: 'sparkle',
    title: '特色功能',
    content_type: 'list',
    content: [
      '个性定制：自由设定伴侣昵称与性格，打造独一无二的专属伴侣',
      '智能对话：基于DeepSeek大模型，对话自然流畅，情感细腻',
      '会话记忆：自动保存聊天记录，随时回顾温馨时刻',
      '多会话管理：支持创建多个会话，体验不同风格的陪伴'
    ]
  },
  {
    icon: 'user',
    title: '适合人群',
    content_type: 'list',
    content: ['渴望情感交流的用户', 'AI技术爱好者', '日常解压与陪伴需求者']
  },
  {
    icon: 'star',
    title: '温馨提示',
    content_type: 'paragraph',
    content: '开启你的AI陪伴之旅，感受科技带来的温暖与关怀！'
  }
];

/** 将 list 类型的内容（JSON 字符串数组）解析为数组；失败时按空数组处理 */
function parseList(content) {
  try {
    const arr = JSON.parse(content);
    return Array.isArray(arr) ? arr : [];
  } catch (error) {
    return [];
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    // 实时请求，不缓存（文档 REQ-06 §8.4）
    const data = await getProjectInfo();
    // data 为数组才使用；null/非数组则走兜底
    sections.value = Array.isArray(data) ? data : [];
  } catch (error) {
    // 网络失败 / 超时 / 5xx：silent 请求，不弹提示，走兜底文案
    sections.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* 侧栏标题与小节标题：图标 + 文字对齐 */
.info-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-section h3 {
  display: flex;
  align-items: center;
  gap: 7px;
}

/* 加载态骨架屏（原内容样式沿用全局，此处仅补充加载占位） */
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}
.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: rgba(120, 120, 120, 0.15);
  animation: skeleton-blink 1.2s ease-in-out infinite;
}
.skeleton-line.short {
  width: 60%;
}
@keyframes skeleton-blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
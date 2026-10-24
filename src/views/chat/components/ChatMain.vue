<template>
  <!-- 中间主聊天区域 -->
  <main class="chat-container">
    <!-- 标题栏 -->
    <header class="chat-header">
      <div class="header-left">
        <h1>AI智能伴侣</h1>
        <span class="session-name">会话名称: {{ chatStore.currentSession || '' }}</span>
      </div>
      <!-- 用户信息 + 主题切换 -->
      <div class="header-actions">
        <span class="chat-user">
          <AppIcon name="user" :size="14" /> {{ userStore.username }}
        </span>
        <button class="btn-logout" :disabled="logoutLoading" @click="handleLogout">
          <AppIcon name="logout" :size="14" />
          {{ logoutLoading ? '退出中...' : '退出登录' }}
        </button>
        <ChatGlassControl />
        <ThemeSwitcher />
      </div>
    </header>

    <!-- 聊天消息区域 -->
    <div ref="messagesRef" class="chat-messages">
      <!-- 空状态 -->
      <div v-if="chatStore.messages.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <AppIcon name="message" :size="44" :stroke-width="1.5" />
        </div>
        <div class="empty-state-text">开始与AI伴侣对话吧~</div>
      </div>

      <!-- 消息列表 + 加载动画 -->
      <template v-else>
        <ChatMessageItem v-for="(msg, index) in chatStore.messages" :key="index" :message="msg" />

        <!-- AI 回复加载动画 -->
        <div v-if="chatStore.isLoading" class="message assistant">
          <div class="message-avatar">
            <AppIcon name="bot" :size="18" />
          </div>
          <div class="message-content">
            <LoadingDots />
          </div>
        </div>
      </template>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-container">
      <div class="chat-input-wrapper">
        <input
          v-model="inputText"
          class="chat-input"
          type="text"
          placeholder="请输入您要问的问题"
          autocomplete="off"
          @keypress.enter.prevent="handleSend"
        />
        <button class="btn btn-send" title="发送" @click="handleSend">
          <AppIcon name="send" :size="16" />
        </button>
      </div>
    </div>

    <!-- 退出确认弹层（替代 window.confirm） -->
    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="logout-confirm-mask" @click.self="cancelLogout">
        <div class="logout-confirm-card">
          <p class="logout-confirm-text">确定要退出登录吗？</p>
          <div class="logout-confirm-actions">
            <button class="btn btn-secondary" @click="cancelLogout">取消</button>
            <button class="btn btn-primary" :disabled="logoutLoading" @click="confirmLogout">
              {{ logoutLoading ? '退出中...' : '确定' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import ThemeSwitcher from '@/components/business/ThemeSwitcher.vue';
import ChatGlassControl from '@/components/business/ChatGlassControl.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import LoadingDots from '@/components/business/LoadingDots.vue';
import ChatMessageItem from './ChatMessageItem.vue';
import { useChatStore } from '@/stores/modules/chat';
import { useUserStore } from '@/stores/modules/user';
import { useChatGlass } from '@/composables/useChatGlass';

const chatStore = useChatStore();
const userStore = useUserStore();
const router = useRouter();
const { init: initChatGlass } = useChatGlass();

/** 输入框内容（组件内部 UI 状态，不属于全局业务状态） */
const inputText = ref('');

/** 消息滚动容器 */
const messagesRef = ref(null);

/** 退出确认弹窗 */
const showLogoutConfirm = ref(false);
const logoutLoading = ref(false);

/** 页面挂载：应用本地保存的聊天背景透明度（--chat-glass-alpha） */
onMounted(() => {
  initChatGlass();
});

/** 点击退出登录：显示确认弹窗 */
function handleLogout() {
  showLogoutConfirm.value = true;
}

/** 确认退出 */
async function confirmLogout() {
  logoutLoading.value = true;
  try {
    await userStore.logoutRemote();
    router.replace('/login');
  } catch {
    // 即使远端失败也本地退出并跳转
    router.replace('/login');
  } finally {
    logoutLoading.value = false;
  }
}

/** 取消退出 */
function cancelLogout() {
  showLogoutConfirm.value = false;
}

/**
 * 发送消息
 * 逻辑与原项目一致：trim 校验、清空输入框、调用 store 发送
 */
function handleSend() {
  const text = inputText.value.trim();
  if (!text || chatStore.isLoading) return;

  inputText.value = '';
  chatStore.sendMessage(text);
}

/** 消息更新或加载状态变化后，自动滚动到底部 */
watch(
  () => [chatStore.messages.length, chatStore.isLoading],
  async () => {
    await nextTick();
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  }
);
</script>

<style scoped>
/* 头部操作区：当前用户 + 退出登录（与主题切换器并排） */
.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.chat-user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid var(--border-color);
  background: none;
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: 9px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-logout:hover {
  color: #e53e3e;
  border-color: #e53e3e;
}

.btn-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 退出确认弹层 */
.logout-confirm-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.logout-confirm-card {
  background-color: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 28px 32px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.logout-confirm-text {
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: 22px;
  line-height: 1.5;
}

.logout-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 14px;
}

.logout-confirm-actions .btn {
  min-width: 90px;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.logout-confirm-actions .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.logout-confirm-actions .btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: #fff;
}

.logout-confirm-actions .btn-secondary {
  background-color: var(--bg-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.logout-confirm-actions .btn-secondary:hover {
  background-color: var(--border-color);
}
</style>

<template>
  <!-- 左侧边栏：新建会话 / 会话历史 / 伴侣信息 -->
  <aside class="sidebar">
    <!-- 侧边栏标题 -->
    <div class="sidebar-header">
      <h2>🤖 AI控制面板</h2>
    </div>

    <!-- 分割线 -->
    <hr class="divider" />

    <!-- 新建会话按钮 -->
    <button class="btn btn-primary btn-full" @click="handleNewSession">
      <span>✏️</span> 新建会话
    </button>

    <!-- 会话历史 -->
    <div class="session-section">
      <div class="session-section-head">
        <h3>会话历史</h3>
        <!-- 批量删除：常驻入口按钮，点击进入多选模式；无会话时提示 -->
        <template v-if="!batchMode">
          <button class="btn btn-batch" @click="handleStartBatch">批量删除</button>
        </template>
        <template v-else>
          <div class="head-actions">
            <button class="btn btn-small" @click="handleSelectAll">全选</button>
            <button class="btn btn-small" @click="exitBatchMode">取消</button>
          </div>
        </template>
      </div>

      <div class="session-list">
        <!-- 会话列表：由 store 中的 sessionList 渲染，高亮项随 currentSession 自动更新 -->
        <div v-for="sessionId in chatStore.sessionList" :key="sessionId" class="session-item">
          <!-- 仅多选模式下显示勾选框 -->
          <input
            v-if="batchMode"
            type="checkbox"
            :checked="selectedIds.has(sessionId)"
            class="session-check"
            @change="toggleSelect(sessionId, $event.target.checked)"
          />
          <button
            :class="[
              'session-btn',
              sessionId === chatStore.currentSession ? 'btn-active' : 'btn-secondary'
            ]"
            @click="chatStore.loadSession(sessionId)"
          >
            {{ sessionId }}
          </button>
          <!-- 多选模式隐藏单删按钮，避免误删 -->
          <button
            v-if="!batchMode"
            class="btn btn-icon"
            title="删除会话"
            @click.stop="chatStore.deleteSession(sessionId)"
          >
            ❌
          </button>
        </div>
      </div>

      <!-- 多选模式下：列表下方出现确认删除按钮 -->
      <div v-if="batchMode" class="batch-actions">
        <button
          class="btn btn-danger btn-full"
          :disabled="selectedIds.size === 0"
          @click="handleBatchDelete"
        >
          删除选中({{ selectedIds.size }})
        </button>
      </div>
    </div>

    <!-- 分割线 -->
    <hr class="divider" />

    <!-- 伴侣信息（只读展示，人设在创建会话时确定，不可修改） -->
    <div class="companion-section">
      <h3>伴侣信息</h3>

      <!-- 人设名称 -->
      <div class="form-group">
        <label>人设</label>
        <div class="companion-value">{{ matchedPresetName }}</div>
      </div>

      <!-- 昵称 -->
      <div class="form-group">
        <label>昵称</label>
        <div class="companion-value">{{ companionStore.nickName }}</div>
      </div>

      <!-- 性格 -->
      <div class="form-group">
        <label>性格</label>
        <div class="companion-value">{{ companionStore.nature }}</div>
      </div>

      <p class="companion-note">人设在创建会话时确定，创建后不可修改</p>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useChatStore } from '@/stores/modules/chat';
import { useCompanionStore } from '@/stores/modules/companion';

const chatStore = useChatStore();
const companionStore = useCompanionStore();

/** 多选模式下选中的会话 id 集合 */
const selectedIds = ref(new Set());
/** 是否处于多选模式（进入后才显示勾选框与底部确认按钮） */
const batchMode = ref(false);

/** 点击「批量删除」：无会话时提示，否则进入多选模式 */
function handleStartBatch() {
  if (!chatStore.sessionList.length) {
    window.alert('暂无会话可删除');
    return;
  }
  batchMode.value = true;
}

/** 多选模式下全选所有会话 */
function handleSelectAll() {
  selectedIds.value = new Set(chatStore.sessionList);
}

/** 退出多选模式（清空已选） */
function exitBatchMode() {
  selectedIds.value = new Set();
  batchMode.value = false;
}

/** 切换单个会话的勾选状态 */
function toggleSelect(sessionId, checked) {
  if (checked) {
    selectedIds.value.add(sessionId);
  } else {
    selectedIds.value.delete(sessionId);
  }
  // Set 不触发 Vue 响应式，用新实例替换以触发更新
  selectedIds.value = new Set(selectedIds.value);
}

/** 批量删除选中的会话（仅删除成功后才退出多选模式；取消弹窗/失败则保留勾选） */
async function handleBatchDelete() {
  if (selectedIds.value.size === 0) return;
  const ok = await chatStore.batchDeleteSessions([...selectedIds.value]);
  if (ok) {
    selectedIds.value = new Set();
    batchMode.value = false;
  }
}

/**
 * 新建会话：当前会话存在且无任何消息时提示，否则打开人设选择弹窗
 */
function handleNewSession() {
  if (chatStore.currentSession && chatStore.messages.length === 0) {
    window.alert('当前会话尚未开始，无需创建新会话');
    return;
  }
  chatStore.showNewSessionDialog = true;
}

/** 根据当前会话人设匹配预设名称；不匹配（自定义人设）时显示"自定义" */
const matchedPresetName = computed(() => {
  const matched = companionStore.presets.find(
    (p) => p.nick_name === companionStore.nickName && p.nature === companionStore.nature
  );
  return matched ? matched.name : '自定义';
});
</script>

<style scoped>
/* 会话历史标题行：标题与批量删除按钮同行 */
.session-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.session-section-head h3 {
  margin: 0;
}

/* 批量删除入口按钮 */
.btn-batch {
  padding: 9px 16px;
  font-size: 14px;
  border-radius: 8px;
  font-weight: 600;
  background: #d64545;
  color: #fff;
}
.btn-batch:hover {
  background: #c13131;
}

/* 多选模式下标题右侧「全选 / 取消」并排 */
.head-actions {
  display: flex;
  gap: 6px;
}

/* 会话项前的复选框 */
.session-check {
  margin-right: 8px;
  flex-shrink: 0;
  cursor: pointer;
}

/* 多选模式下：列表下方的确认删除按钮容器 */
.batch-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

/* 伴侣信息只读展示（人设在创建会话时确定，不可修改） */
.companion-value {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-color);
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-word;
}

.companion-note {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
  line-height: 1.5;
}
</style>
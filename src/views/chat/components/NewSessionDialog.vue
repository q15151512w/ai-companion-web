<template>
  <Teleport to="body">
    <div v-if="chatStore.showNewSessionDialog" class="modal-mask" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">新建会话</h3>
          <span class="modal-close" title="关闭" @click="close">
            <AppIcon name="x" :size="16" />
          </span>
        </div>

        <p class="modal-tip">选择一个伴侣人设，创建后不可修改</p>

        <!-- 预设列表标题行 + 显示全部开关 -->
        <div class="preset-grid-head">
          <span class="preset-grid-title">选择人设</span>
          <button
            v-if="companionStore.presets.length > 0"
            class="btn btn-link preset-toggle"
            @click="companionStore.toggleShowAll()"
          >
            {{ companionStore.showAllPresets ? '仅看推荐' : '显示全部' }}
          </button>
        </div>

        <!-- 预设列表：点击选中，选中后可再修改下方昵称/性格 -->
        <div v-if="companionStore.visiblePresets.length === 0" class="preset-placeholder">
          {{ companionStore.presetsError ? '预设加载失败' : '加载中...' }}
        </div>
        <div v-else class="preset-grid">
          <div
            v-for="preset in companionStore.visiblePresets"
            :key="preset.id"
            class="preset-card"
            :class="{ active: preset.id === selectedPresetId }"
            @click="selectPreset(preset)"
          >
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-nick">昵称：{{ preset.nick_name }}</span>
            <!-- 仅用户自定义预设（user_id 非空）显示删除按钮 -->
            <button
              v-if="preset.user_id != null"
              class="preset-del"
              title="删除该预设"
              @click.stop="handleDeletePreset(preset)"
            >
              <AppIcon name="trash" :size="13" />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="dialogNick">昵称</label>
          <input
            id="dialogNick"
            v-model="draftNick"
            type="text"
            :class="{ err: errors.nick }"
            placeholder="请输入昵称"
            @input="clearError('nick')"
          />
          <div v-if="errors.nick" class="field-error">{{ errors.nick }}</div>
        </div>

        <div class="form-group">
          <label for="dialogNature">性格</label>
          <textarea
            id="dialogNature"
            v-model="draftNature"
            rows="3"
            :class="{ err: errors.nature }"
            placeholder="请输入性格"
            @input="clearError('nature')"
          ></textarea>
          <div v-if="errors.nature" class="field-error">{{ errors.nature }}</div>
        </div>

        <!-- 底部操作区：新增预设按钮（独立一行）+ 取消/创建 -->
        <div class="modal-footer footer-split">
          <button class="btn btn-footer-add" @click="openPresetCreate">
            <AppIcon name="plus" :size="13" />
            新增预设
          </button>
          <div class="footer-actions">
            <button class="btn btn-secondary" @click="close">取消</button>
            <button
              class="btn btn-primary"
              :disabled="!draftNick.trim() || !draftNature.trim() || creating"
              @click="confirm"
            >
              {{ creating ? '创建中...' : '确认创建' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 新增预设弹窗 -->
  <PresetCreateDialog :visible="showPresetCreate" @update:visible="showPresetCreate = $event" />
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import PresetCreateDialog from './PresetCreateDialog.vue';
import { useChatStore } from '@/stores/modules/chat';
import { useCompanionStore } from '@/stores/modules/companion';

const chatStore = useChatStore();
const companionStore = useCompanionStore();

/** 选中的预设 id（预设未加载完成时为空字符串） */
const selectedPresetId = ref('');
/** 昵称草稿：选中预设后预填，允许用户自定义 */
const draftNick = ref('');
/** 性格草稿 */
const draftNature = ref('');
/** 用户是否已手动修改草稿（避免预设加载完成时覆盖用户输入） */
const touched = ref(false);
/** 行内校验错误 */
const errors = reactive({ nick: '', nature: '' });
/** 创建中 loading */
const creating = ref(false);

/** 是否打开「新增预设」弹窗 */
const showPresetCreate = ref(false);

/** 打开「新增预设」弹窗 */
function openPresetCreate() {
  showPresetCreate.value = true;
}

/** 删除自定义预设：确认后调用 store，删除成功自动刷新列表 */
async function handleDeletePreset(preset) {
  if (!window.confirm(`确定要删除预设「${preset.name}」吗？`)) return;
  try {
    await companionStore.deletePreset(preset.id);
  } catch (error) {
    // 删除失败已在 store / request 统一提示
  }
}

/** 清除指定字段错误 */
function clearError(field) {
  errors[field] = '';
}

/** 根据当前会话人设匹配预设，返回匹配项或 null */
function matchCurrentPreset() {
  return (
    companionStore.visiblePresets.find(
      (p) => p.nick_name === companionStore.nickName && p.nature === companionStore.nature
    ) || null
  );
}

/** 初始化草稿：默认选中与当前人设匹配的预设，否则第一个可见预设 */
function initForm() {
  touched.value = false;
  errors.nick = '';
  errors.nature = '';
  creating.value = false;
  const matched = matchCurrentPreset() || companionStore.visiblePresets[0] || null;
  if (matched) {
    selectedPresetId.value = matched.id;
    draftNick.value = matched.nick_name;
    draftNature.value = matched.nature;
  } else {
    // 预设尚未加载完成时，用当前人设兜底
    selectedPresetId.value = '';
    draftNick.value = companionStore.nickName;
    draftNature.value = companionStore.nature;
  }
}

/** 选择预设：预填昵称与性格，用户可再自行修改 */
function selectPreset(preset) {
  selectedPresetId.value = preset.id;
  draftNick.value = preset.nick_name;
  draftNature.value = preset.nature;
  errors.nick = '';
  errors.nature = '';
}

/** 确认创建：先校验，再调用 store */
async function confirm() {
  errors.nick = '';
  errors.nature = '';
  let valid = true;
  if (!draftNick.value.trim()) {
    errors.nick = '请输入昵称';
    valid = false;
  }
  if (!draftNature.value.trim()) {
    errors.nature = '请输入性格';
    valid = false;
  }
  if (!valid) return;

  creating.value = true;
  try {
    await chatStore.createNewSession({
      nick_name: draftNick.value.trim(),
      nature: draftNature.value.trim()
    });
    chatStore.showNewSessionDialog = false;
  } catch (error) {
    // 创建失败（如网络错误）已在 request.js 统一提示，保持弹窗打开让用户重试
  } finally {
    creating.value = false;
  }
}

/** 关闭弹窗 */
function close() {
  chatStore.showNewSessionDialog = false;
}

// 弹窗打开时重置表单
watch(
  () => chatStore.showNewSessionDialog,
  (visible) => {
    if (visible) initForm();
  }
);

// 预设加载完成且用户未修改草稿时，补一次初始化（覆盖打开弹窗时预设为空的情况）
watch(
  () => companionStore.presets.length,
  (count) => {
    if (chatStore.showNewSessionDialog && !touched.value && count > 0) {
      initForm();
    }
  }
);
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  width: 420px;
  max-width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  background-color: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.modal-title {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 6px;
  transition: color 0.2s ease, background 0.2s ease;
}

.modal-close:hover {
  color: var(--primary-color);
}

.modal-tip {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.preset-placeholder {
  padding: 24px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

/* 预设网格标题行：标题 + 显示全部开关 */
.preset-grid-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.preset-grid-title {
  font-size: 13px;
  color: var(--text-secondary);
}
.preset-toggle {
  padding: 2px 0;
  font-size: 12px;
  color: var(--primary-color);
  background: none;
  border: none;
  cursor: pointer;
}
.preset-toggle:hover {
  text-decoration: underline;
}

.preset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.preset-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 calc(50% - 4px);
  min-width: 150px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-color);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.preset-card:hover {
  border-color: var(--primary-color);
}

.preset-card.active {
  border-color: var(--primary-color);
  background-color: rgba(255, 107, 157, 0.15);
}

.preset-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.preset-nick {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 用户自定义预设的删除按钮：默认隐藏，卡片 hover 时显示 */
.preset-card {
  position: relative;
}
.preset-del {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: rgba(229, 72, 77, 0.12);
  color: #e53e3e;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
}
.preset-card:hover .preset-del {
  opacity: 1;
}
.preset-del:hover {
  background: #e53e3e;
  color: #fff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.modal-footer .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 底部拆分为上下两行：上一行「新增预设」按钮，下一行取消/创建 */
.footer-split {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

/* 新增预设入口按钮（靠左） */
.btn-footer-add {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  font-size: 13px;
  border: 1px dashed var(--primary-color);
  background: none;
  color: var(--primary-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-footer-add:hover {
  background-color: rgba(255, 107, 157, 0.1);
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 行内校验：输入框红框 + 红字提示 */
.form-group input.err,
.form-group textarea.err {
  border-color: #e53e3e;
  background: rgba(229, 72, 77, 0.08);
}

.field-error {
  font-size: 12px;
  color: #e53e3e;
  margin-top: 6px;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
</style>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-mask" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">新增人设</h3>
          <span class="modal-close" title="关闭" @click="close">
            <AppIcon name="x" :size="16" />
          </span>
        </div>

        <p class="modal-tip">保存后将出现在预设列表，可供后续新建会话时选择</p>

        <div class="form-group">
          <label for="presetName">预设名称</label>
          <input
            id="presetName"
            v-model="draftName"
            type="text"
            :class="{ err: errors.name }"
            placeholder="请输入预设名称（如：温柔姐姐）"
            @input="clearError('name')"
          />
          <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
        </div>

        <div class="form-group">
          <label for="presetNick">昵称</label>
          <input
            id="presetNick"
            v-model="draftNick"
            type="text"
            :class="{ err: errors.nick }"
            placeholder="请输入伴侣昵称"
            @input="clearError('nick')"
          />
          <div v-if="errors.nick" class="field-error">{{ errors.nick }}</div>
        </div>

        <div class="form-group">
          <label for="presetGender">性别（可选）</label>
          <select id="presetGender" v-model="draftGender" class="preset-select">
            <option value="">不标注</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>

        <div class="form-group">
          <label for="presetNature">性格</label>
          <textarea
            id="presetNature"
            v-model="draftNature"
            rows="3"
            :class="{ err: errors.nature }"
            placeholder="请输入伴侣性格描述"
            @input="clearError('nature')"
          ></textarea>
          <div v-if="errors.nature" class="field-error">{{ errors.nature }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="close">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!draftName.trim() || !draftNick.trim() || !draftNature.trim() || creating"
            @click="confirm"
          >
            {{ creating ? '保存中...' : '确认保存' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { useCompanionStore } from '@/stores/modules/companion';

const props = defineProps({
  /** 是否可见（由父组件控制） */
  visible: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible']);

const companionStore = useCompanionStore();

/** 表单草稿 */
const draftName = ref('');
const draftNick = ref('');
const draftNature = ref('');
const draftGender = ref('');
/** 行内校验错误 */
const errors = reactive({ name: '', nick: '', nature: '' });
/** 保存中 loading */
const creating = ref(false);

/** 清除指定字段错误 */
function clearError(field) {
  errors[field] = '';
}

/** 弹窗打开时重置表单 */
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      draftName.value = '';
      draftNick.value = '';
      draftNature.value = '';
      draftGender.value = '';
      errors.name = '';
      errors.nick = '';
      errors.nature = '';
      creating.value = false;
    }
  }
);

/** 确认保存：先校验，再调用 store */
async function confirm() {
  errors.name = '';
  errors.nick = '';
  errors.nature = '';
  let valid = true;
  if (!draftName.value.trim()) {
    errors.name = '请输入预设名称';
    valid = false;
  }
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
    await companionStore.createPreset({
      name: draftName.value.trim(),
      nick_name: draftNick.value.trim(),
      nature: draftNature.value.trim(),
      gender: draftGender.value || undefined
    });
    close();
  } catch (error) {
    // 创建失败已在 store / request 统一提示，保持弹窗打开让用户重试
  } finally {
    creating.value = false;
  }
}

/** 关闭弹窗 */
function close() {
  emit('update:visible', false);
}
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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea,
.preset-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
}

.preset-select {
  cursor: pointer;
}

.form-group input:focus,
.form-group textarea:focus,
.preset-select:focus {
  outline: none;
  border-color: var(--primary-color);
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
</style>
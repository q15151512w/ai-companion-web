<template>
  <div ref="rootRef" class="glass-control" :class="{ open }">
    <!-- 透明度触发按钮：当前值以百分比显示 -->
    <button
      class="glass-toggle"
      :title="`聊天背景透明度：${percent}%（点击调节）`"
      @click.stop="open = !open"
    >
      <AppIcon name="sunset" :size="16" />
      <span class="glass-value">{{ percent }}%</span>
    </button>

    <!-- 弹出滑块面板 -->
    <Transition name="drop">
      <div v-if="open" class="glass-panel">
        <span class="glass-label">背景透明度</span>
        <input
          v-model.number="opacityValue"
          class="glass-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          @input="onInput"
        />
        <div class="glass-percent">{{ percent }}%</div>
        <div class="glass-hint">调低可透出 MP4 背景</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { useChatGlass } from '@/composables/useChatGlass';

const { opacity, setOpacity } = useChatGlass();
const open = ref(false);
const rootRef = ref(null);

/** 滑块用 0~100 的整数，与 0~1 的透明度互转 */
const opacityValue = ref(Math.round((opacity.value || 0) * 100));

/** 内部同步：滑块变化 → 实时写入透明度 */
function onInput() {
  setOpacity(opacityValue.value / 100);
}

watch(opacity, (val) => {
  opacityValue.value = Math.round((val || 0) * 100);
});

const percent = computed(() => Math.round((opacity.value || 0) * 100));

/** 点击外部 / ESC 关闭面板 */
function onDocClick(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) {
    open.value = false;
  }
}
function onEsc(e) {
  if (e.key === 'Escape') open.value = false;
}
onMounted(() => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onEsc);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onEsc);
});
</script>

<style scoped>
.glass-control {
  position: relative;
}

/* 触发按钮：胶囊形，玻璃图标 + 百分比 */
.glass-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1.5px solid var(--border-color);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--text-secondary);
  border-radius: 17px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.glass-toggle:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.glass-value {
  font-variant-numeric: tabular-nums;
  min-width: 30px;
  text-align: center;
}

/* 弹出面板 */
.glass-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 190px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(18px) saturate(1.6);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.glass-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.glass-slider {
  width: 100%;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.glass-percent {
  text-align: right;
  font-size: 12px;
  color: var(--primary-color);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.glass-hint {
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.75;
}

/* 下拉展开动画 */
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
  transform-origin: top right;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.94);
}

/* 黑夜 / 国风主题配色 */
body.theme-dark .glass-toggle {
  background: rgba(30, 38, 51, 0.6);
  border-color: #3a4659;
  color: #cbd5e1;
}
body.theme-dark .glass-toggle:hover {
  color: #ff6b9d;
  border-color: #ff6b9d;
}
body.theme-dark .glass-panel {
  background: rgba(26, 33, 48, 0.9);
  border-color: #3a4659;
}
body.theme-dark .glass-label,
body.theme-dark .glass-hint {
  color: #cbd5e1;
}

body.theme-wuxia .glass-toggle {
  background: rgba(26, 20, 14, 0.6);
  border-color: rgba(212, 175, 55, 0.45);
  color: #e8c06a;
}
body.theme-wuxia .glass-panel {
  background: rgba(30, 14, 11, 0.92);
  border-color: rgba(212, 175, 55, 0.4);
}
body.theme-wuxia .glass-label,
body.theme-wuxia .glass-hint {
  color: #f6e8d3;
}
</style>
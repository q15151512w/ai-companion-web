<template>
  <!-- 主题下拉选择器：点击展开玻璃面板，直接选择目标主题（国风为限定项） -->
  <div ref="rootRef" class="theme-select" :class="{ open }">
    <button
      class="theme-toggle"
      :class="{ dark: isDark, dawn: isDawn, wuxia: isWuxia }"
      :aria-label="'当前主题：' + currentName + '，点击选择主题'"
      @click.stop="open = !open"
    >
      <span class="theme-icon">
        <AppIcon :name="THEME_ITEMS[theme]?.icon || 'blossom'" :size="16" />
      </span>
      <span class="theme-name">{{ currentName }}</span>
      <span class="theme-caret" :class="{ flip: open }">
        <AppIcon name="chevronDown" :size="13" />
      </span>
    </button>

    <!-- 下拉面板 -->
    <Transition name="drop">
      <ul v-if="open" class="theme-menu" role="listbox">
        <li v-for="item in visibleItems" :key="item.key">
          <button
            class="theme-option"
            :class="[
              item.key,
              { active: item.key === theme, wuxia: item.key === 'wuxia' }
            ]"
            role="option"
            :aria-selected="item.key === theme"
            @click="select(item.key)"
          >
            <span class="option-icon">
              <AppIcon :name="item.icon" :size="16" />
            </span>
            <span class="option-name">{{ item.name }}</span>
            <!-- 国风限定徽标 -->
            <span v-if="item.key === 'wuxia'" class="option-badge">限定</span>
            <span v-else-if="item.key === theme" class="option-check">
              <AppIcon name="check" :size="14" />
            </span>
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useTheme } from '@/composables/useTheme';
import AppIcon from '@/components/common/AppIcon.vue';

const { theme, applyTheme } = useTheme();
const open = ref(false);
const rootRef = ref(null);

const props = defineProps({
  /**
   * 是否展示"限定国风"选项
   * 国风为登录后才可解锁的限定主题，登录页传 false 隐藏该选项
   */
  showWuxia: {
    type: Boolean,
    default: true
  }
});

/** 主题清单：名称 + 图标（国风为限定主题） */
const THEME_ITEMS = [
  { key: 'light', name: '默认', icon: 'blossom' },
  { key: 'dawn', name: '黎明', icon: 'sunrise' },
  { key: 'dark', name: '黑夜', icon: 'moon' },
  { key: 'wuxia', name: '限定国风', icon: 'sword' }
];

/** 实际展示的选项（登录页隐藏国风） */
const visibleItems = computed(() => THEME_ITEMS.filter((t) => t.key !== 'wuxia' || props.showWuxia));

const currentName = computed(() => THEME_ITEMS.find((t) => t.key === theme.value)?.name || '默认');
const isDark = computed(() => theme.value === 'dark');
const isDawn = computed(() => theme.value === 'dawn');
const isWuxia = computed(() => theme.value === 'wuxia');

/** 选择主题：立即应用并收起面板 */
function select(key) {
  if (key !== theme.value) {
    applyTheme(key);
  }
  open.value = false;
}

/** 点击组件外部 / ESC 关闭下拉 */
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
.theme-select {
  position: relative;
}

/* 触发按钮：胶囊形，图标 + 主题名 + 下拉箭头 */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px 0 11px;
  border-radius: 17px;
  border: none;
  cursor: pointer;
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  box-shadow: 0 4px 14px rgba(255, 107, 157, 0.35);
  transition:
    box-shadow 0.25s ease,
    background 0.45s ease,
    border-color 0.45s ease;
}

/* 黎明模式：暖橙渐变 */
.theme-toggle.dawn {
  background: linear-gradient(135deg, #ffb37c, #ff8a5c);
  box-shadow: 0 4px 14px rgba(255, 138, 92, 0.4);
}

/* 黑夜模式：暗夜蓝 */
.theme-toggle.dark {
  background: linear-gradient(135deg, #3a475c, #1e2633);
  border: 1px solid #3a4659;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}

/* 国风模式：暗夜红 + 鎏金描边 + 楷体字 */
.theme-toggle.wuxia {
  background: linear-gradient(135deg, #48120e, #1e0f0c);
  border: 1px solid rgba(212, 175, 55, 0.55);
  box-shadow: 0 4px 14px rgba(192, 57, 43, 0.4);
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: 14px;
}

.theme-toggle:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
}

.theme-icon,
.theme-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.theme-caret {
  transition: transform 0.25s ease;
  opacity: 0.85;
}
.theme-caret.flip {
  transform: rotate(180deg);
}

/* ============ 下拉面板：玻璃拟态浮层 ============ */
.theme-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 158px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px) saturate(1.6);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 12px 36px rgba(31, 23, 42, 0.18);
  z-index: 100;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 9px;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background 0.18s ease, color 0.18s ease;
  text-align: left;
}

.theme-option:hover {
  background: rgba(255, 107, 157, 0.12);
  color: var(--primary-color);
}

.theme-option.active {
  color: var(--primary-color);
  font-weight: 600;
  background: rgba(255, 107, 157, 0.1);
}

.option-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  flex-shrink: 0;
}

.option-name {
  flex: 1;
}

.option-check {
  display: inline-flex;
  color: var(--primary-color);
}

/* 国风限定项：鎏金描边 + 朱砂文字 + 限定徽标 */
.theme-option.wuxia {
  border: 1px solid rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg, rgba(72, 18, 14, 0.06), rgba(212, 175, 55, 0.08));
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: 14px;
  color: #a93226;
}

.theme-option.wuxia:hover {
  background: linear-gradient(135deg, rgba(72, 18, 14, 0.12), rgba(212, 175, 55, 0.14));
  color: #7b241c;
}

.theme-option.wuxia.active {
  background: linear-gradient(135deg, rgba(72, 18, 14, 0.16), rgba(212, 175, 55, 0.16));
  color: #7b241c;
}

.theme-option.wuxia .option-check {
  color: #d4af37;
}

.option-badge {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 7px;
  font-size: 10px;
  line-height: 1.5;
  letter-spacing: 1px;
  color: #f8e8c8;
  background: linear-gradient(135deg, #a93226, #7b241c);
  border: 1px solid rgba(212, 175, 55, 0.55);
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

/* 黑夜主题下的下拉面板配色 */
body.theme-dark .theme-menu {
  background: rgba(26, 33, 48, 0.82);
  border-color: #3a4659;
}
body.theme-dark .theme-option {
  color: #f1f5f9;
}
body.theme-dark .theme-option:hover,
body.theme-dark .theme-option.active {
  background: rgba(255, 107, 157, 0.14);
  color: #ff6b9d;
}

/* 国风主题下的下拉面板配色 */
body.theme-wuxia .theme-menu {
  background: rgba(30, 14, 11, 0.85);
  border-color: rgba(212, 175, 55, 0.4);
}
body.theme-wuxia .theme-option {
  color: #f6e8d3;
}
body.theme-wuxia .theme-option:hover,
body.theme-wuxia .theme-option.active {
  background: rgba(212, 175, 55, 0.14);
  color: #e8c06a;
}

/* 黎明主题下的下拉面板配色 */
body.theme-dawn .theme-menu {
  background: rgba(255, 250, 242, 0.82);
  border-color: rgba(255, 209, 163, 0.8);
}
</style>

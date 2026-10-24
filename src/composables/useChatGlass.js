import { ref, watch } from 'vue';
import { getItem, setItem } from '@/utils/storage';

/**
 * 聊天主面板透明度组合式函数（Composable）
 * - 模块级单例状态，全局共享同一份透明度
 * - 值持久化到 localStorage（本地偏好），刷新后保持
 * - 通过 CSS 变量 --chat-glass-alpha 驱动 .chat-container 的背景透明度，
 *   数值约定为「不透明白色占比」0~1：越大面板越不透明（越遮住 MP4 背景），越小越通透。
 */

// localStorage 存储键
const CHAT_GLASS_KEY = 'ai-companion-chat-glass';

/** 默认透明度（轻量主题：0.38） */
const DEFAULT_OPACITY = 0.38;

/** 透明度范围：[0, 1] */
const MIN_OPACITY = 0;
const MAX_OPACITY = 1;

// 模块级响应式状态（单例，跨组件共享）
const opacity = ref(DEFAULT_OPACITY);

// 读取本地存储中的偏好（模块加载时初始化一次）
const saved = getItem(CHAT_GLASS_KEY);
if (saved !== null) {
  const parsed = Number(saved);
  if (!Number.isNaN(parsed)) {
    opacity.value = Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, parsed));
  }
}

/** 把当前透明度写入 CSS 变量（作用于 html 根元素，.chat-container 引用它） */
function applyOpacity() {
  document.documentElement.style.setProperty('--chat-glass-alpha', String(opacity.value));
  // 透明度为 0（完全通透）时，给 body 加 class 以彻底关闭毛玻璃模糊，
  // 让 MP4 背景 100% 透出（否则 blur 仍会让背景雾化发糊）
  document.body.classList.toggle('chat-glass-clear', opacity.value <= 0);
  setItem(CHAT_GLASS_KEY, String(opacity.value));
}

export function useChatGlass() {
  /** 透明度（0~1，越大越不透明） */
  function setOpacity(value) {
    // 注意：不能用 `Number(value) || DEFAULT`，否则 0（合法的最小值）会被当成 falsy 回退到默认值
    const numeric = Number(value);
    const safe = Number.isNaN(numeric) ? DEFAULT_OPACITY : numeric;
    const clamped = Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, safe));
    opacity.value = clamped;
    applyOpacity();
  }

  /** 切换「是否通透」（快捷开关） */
  function toggleTransparent() {
    setOpacity(opacity.value >= 0.5 ? MIN_OPACITY : DEFAULT_OPACITY);
  }

  /** 初始化：应用本地偏好到 CSS 变量 */
  function init() {
    applyOpacity();
  }

  return {
    opacity,
    setOpacity,
    toggleTransparent,
    init
  };
}
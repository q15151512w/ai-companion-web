import { ref } from 'vue';
import { getItem, setItem } from '@/utils/storage';

/**
 * 主题切换组合式函数（Composable）
 * - 使用模块级单例状态，保证全局共享同一份主题状态
 * - 主题持久化到 localStorage，刷新页面后保持
 * - 四态主题：默认（light）/ 黎明（dawn）/ 黑夜（dark）/ 国风武侠（wuxia），按钮循环切换
 */

// localStorage 存储键
const THEME_KEY = 'ai-companion-theme';

/** 主题循环顺序：默认 → 黎明 → 黑夜 → 国风 → 默认 */
const THEME_CYCLE = ['light', 'dawn', 'dark', 'wuxia'];

// 模块级响应式状态（单例，跨组件共享）
const theme = ref('light');

export function useTheme() {
  /**
   * 应用主题
   * @param {'light' | 'dawn' | 'dark' | 'wuxia'} value 主题名称
   */
  function applyTheme(value) {
    theme.value = value;
    // 各主题通过 body 上的类控制（.theme-dawn / .theme-dark / .theme-wuxia，与全局样式约定一致）
    document.body.classList.toggle('theme-dark', value === 'dark');
    document.body.classList.toggle('theme-dawn', value === 'dawn');
    document.body.classList.toggle('theme-wuxia', value === 'wuxia');
    // 持久化主题到本地存储
    setItem(THEME_KEY, value);
  }

  /** 初始化主题：读取本地存储并应用（兼容旧版 light/dark 存值） */
  function initTheme() {
    const savedTheme = getItem(THEME_KEY, 'light');
    applyTheme(THEME_CYCLE.includes(savedTheme) ? savedTheme : 'light');
  }

  /** 循环切换：默认 → 黎明 → 黑夜 → 国风 */
  function toggleTheme() {
    const index = THEME_CYCLE.indexOf(theme.value);
    applyTheme(THEME_CYCLE[(index + 1) % THEME_CYCLE.length]);
  }

  return {
    theme,
    applyTheme,
    initTheme,
    toggleTheme
  };
}

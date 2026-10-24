import { computed, ref, watch } from 'vue';
import { LOGIN_MEDIA } from '@/config/loginMedia';

/**
 * 主题动态背景加载器（Composable）
 *
 * 按候选链依次尝试加载，某一级失败（404 / 格式不支持等触发 error 事件）自动降级到下一级：
 * 本地视频（public/materials/login/）→ 本地动图 → 阿里云 OSS 直链 → null（CSS 渐变兜底）
 *
 * 动图（gif / webp / apng）用 <img> 渲染，其余按 <video> 处理：
 * 模板中根据 source.isImage 决定渲染标签，两个标签都需绑定 @error="onError"。
 *
 * @param {import('vue').Ref<string>} themeRef 当前主题（响应式，切换主题自动重试新主题的素材链）
 */
// 动图扩展名（其余一律按视频对待）
const IMAGE_EXT = /\.(gif|webp|apng)(\?.*)?$/i;

export function useThemeVideo(themeRef) {
  /** 当前候选源下标（越界即素材链耗尽） */
  const index = ref(0);

  /** 候选源列表：本地视频 → 本地动图 → OSS 直链 */
  const sources = computed(() => {
    const media = LOGIN_MEDIA[themeRef.value] || {};
    return [media.local, media.localImage, media.video].filter(Boolean).map((url) => ({
      url,
      isImage: IMAGE_EXT.test(url)
    }));
  });

  /** 当前生效素材（null = 全部失败，退回 CSS 渐变） */
  const source = computed(() => sources.value[index.value] || null);

  /** 是否配置了任何素材（用于决定是否触发国风过场等展示逻辑） */
  const hasMedia = computed(() => sources.value.length > 0);

  // 主题切换：从头尝试新主题的素材链
  watch(themeRef, () => {
    index.value = 0;
  });

  /** 当前素材加载失败：降级到下一候选源 */
  function onError() {
    index.value = Math.min(index.value + 1, sources.value.length);
  }

  return { source, sources, hasMedia, onError };
}

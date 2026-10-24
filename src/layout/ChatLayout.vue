<template>
  <!-- 三栏应用外壳：左侧会话栏 + 中间聊天区 + 右侧项目介绍 -->
  <div class="app-container">
    <!-- 主题动态背景：与登录页同款素材，透过玻璃面板形成统一风格（本地物料优先，逐级降级） -->
    <div :key="theme" class="theme-video-bg">
      <video
        v-if="bgSource && !bgSource.isImage"
        :key="bgSource.url"
        :src="bgSource.url"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        @error="onBgMediaError"
      ></video>
      <img
        v-else-if="bgSource"
        :key="bgSource.url"
        :src="bgSource.url"
        alt=""
        @error="onBgMediaError"
      />
    </div>

    <!-- 左翼：会话栏（可收缩，边缘悬浮箭头切换，状态记忆到 localStorage） -->
    <div class="panel-wing left" :class="{ collapsed: leftCollapsed }">
      <SessionSidebar />
    </div>
    <ChatMain />
    <!-- 右翼：项目介绍栏（可收缩） -->
    <div class="panel-wing right" :class="{ collapsed: rightCollapsed }">
      <InfoSidebar />
    </div>
    <NewSessionDialog />

    <!-- 边缘悬浮收缩/展开按钮：玻璃质感，始终垂直居中贴边 -->
    <button
      class="wing-toggle left"
      :class="{ collapsed: leftCollapsed }"
      :title="leftCollapsed ? '展开会话面板' : '收起会话面板'"
      @click="toggleLeft"
    >
      <AppIcon :name="leftCollapsed ? 'chevronRight' : 'chevronLeft'" :size="16" />
    </button>
    <button
      class="wing-toggle right"
      :class="{ collapsed: rightCollapsed }"
      :title="rightCollapsed ? '展开介绍面板' : '收起介绍面板'"
      @click="toggleRight"
    >
      <AppIcon :name="rightCollapsed ? 'chevronLeft' : 'chevronRight'" :size="16" />
    </button>

    <!-- 国风限定·入梦江湖过场：切换到国风主题时，顶层全屏播放武侠视频 + 大字书法 -->
    <Transition name="showcase">
      <div v-if="wuxiaShow" class="wuxia-showcase" @click="closeShowcase">
        <video
          v-if="showcaseSource && !showcaseSource.isImage"
          :key="`showcase-${showcaseKey}-${showcaseSource.url}`"
          class="showcase-video"
          :src="showcaseSource.url"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          @error="onShowcaseMediaError"
        ></video>
        <img
          v-else-if="showcaseSource"
          :key="`showcase-${showcaseKey}-${showcaseSource.url}`"
          class="showcase-video"
          :src="showcaseSource.url"
          alt=""
          @error="onShowcaseMediaError"
        />
        <!-- 朱砂纱幕：让文字在视频上可读，同时保留画面全貌 -->
        <div class="showcase-veil"></div>
        <!-- 剑光扫过 -->
        <div class="showcase-slash"></div>
        <!-- 主标题：书法大字逐字浮现 -->
        <div class="showcase-title">
          <span v-for="(ch, i) in SHOWCASE_CHARS" :key="i" :style="{ animationDelay: 0.55 + i * 0.28 + 's' }">
            {{ ch }}
          </span>
        </div>
        <p class="showcase-sub">国 风 · 限 定 主 题 已 开 启</p>
        <div class="showcase-sword">
          <AppIcon name="sword" :size="22" :stroke-width="1.6" />
        </div>
        <p class="showcase-hint">点击任意处进入江湖</p>
      </div>
    </Transition>

    <!-- 登录归家欢迎过场：登录成功首次进入时全屏播放主题视频 + 大字欢迎主人回家 -->
    <Transition name="welcome">
      <div v-if="welcomeShow" class="welcome-overlay" @click="closeWelcome">
        <!-- 主题素材：与登录页/聊天页同款（本地物料优先），完整铺满视口 -->
        <video
          v-if="bgSource && !bgSource.isImage"
          :key="`welcome-${bgSource.url}`"
          class="welcome-video"
          :src="bgSource.url"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          @error="onBgMediaError"
        ></video>
        <img
          v-else-if="bgSource"
          :key="`welcome-${bgSource.url}`"
          class="welcome-video"
          :src="bgSource.url"
          alt=""
          @error="onBgMediaError"
        />
        <!-- 暖夜纱幕：仅上下边缘压暗保文字可读，中部画面完整透出 -->
        <div class="welcome-veil"></div>
        <!-- 主标题：逐字浮现 -->
        <div class="welcome-title">
          <span
            v-for="(ch, i) in WELCOME_CHARS"
            :key="i"
            :style="{ animationDelay: 0.15 + i * 0.22 + 's' }"
          >
            {{ ch }}
          </span>
        </div>
        <p class="welcome-sub">Home Sweet Home · 旅途辛苦了</p>
        <p class="welcome-hint">点击任意处继续</p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import SessionSidebar from '@/views/chat/components/SessionSidebar.vue';
import ChatMain from '@/views/chat/components/ChatMain.vue';
import InfoSidebar from '@/views/chat/components/InfoSidebar.vue';
import NewSessionDialog from '@/views/chat/components/NewSessionDialog.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { useCompanionStore } from '@/stores/modules/companion';
import { useChatStore } from '@/stores/modules/chat';
import { useTheme } from '@/composables/useTheme';
import { useThemeVideo } from '@/composables/useThemeVideo';
import { getItem, setItem } from '@/utils/storage';

const companionStore = useCompanionStore();
const chatStore = useChatStore();
const { theme } = useTheme();

/* ==================== 侧栏收缩状态（localStorage 持久化） ==================== */
const WING_KEY = 'ai-companion-wings';

/** 左右两翼收缩状态（true = 已收起） */
const leftCollapsed = ref(getItem(WING_KEY)?.left === true);
const rightCollapsed = ref(getItem(WING_KEY)?.right === true);

function toggleLeft() {
  leftCollapsed.value = !leftCollapsed.value;
  setItem(WING_KEY, { left: leftCollapsed.value, right: rightCollapsed.value });
}

function toggleRight() {
  rightCollapsed.value = !rightCollapsed.value;
  setItem(WING_KEY, { left: leftCollapsed.value, right: rightCollapsed.value });
}

/** 主题动态背景（与登录页共用同一份素材配置）：本地物料 → 本地动图 → OSS 直链 → 渐变 */
const { source: bgSource, onError: onBgMediaError } = useThemeVideo(theme);

/* ==================== 国风限定·入梦江湖过场 ==================== */
/** 过场主标题（逐字浮现） */
const SHOWCASE_CHARS = ['入', '梦', '江', '湖'];

/** 是否展示国风过场 */
const wuxiaShow = ref(false);

/** 过场视频 remount key（每次切换重新播放） */
const showcaseKey = ref(0);

/** 过场自动关闭定时器 */
let showcaseTimer = null;

/** 国风过场素材：固定走 wuxia 主题的候选链（与主背景同样的降级策略） */
const {
  source: showcaseSource,
  hasMedia: showcaseHasMedia,
  onError: onShowcaseMediaError
} = useThemeVideo(computed(() => 'wuxia'));

/** 切换到国风主题时触发：全屏播放武侠素材 + 大字过场（首次进入聊天页不触发） */
watch(theme, (next, prev) => {
  if (next === 'wuxia' && prev && prev !== 'wuxia' && showcaseHasMedia.value) {
    showcaseKey.value++;
    wuxiaShow.value = true;
    clearTimeout(showcaseTimer);
    // 6.5s 后自动收场（也可点击跳过）
    showcaseTimer = setTimeout(closeShowcase, 6500);
  }
});

/** 收场：淡出过场，露出国风主题的聊天界面 */
function closeShowcase() {
  wuxiaShow.value = false;
  clearTimeout(showcaseTimer);
}

/* ==================== 登录归家欢迎过场 ==================== */
/** 过场主标题（逐字浮现） */
const WELCOME_CHARS = ['欢', '迎', '主', '人', '回', '家'];

/** 登录成功标记的 sessionStorage 键（与 LoginView 约定一致，刷新页面不重播） */
const WELCOME_KEY = 'ai-companion-welcome';

/** 是否展示归家欢迎过场 */
const welcomeShow = ref(false);

/** 过场自动关闭定时器 */
let welcomeTimer = null;

/** 收场：淡出过场，露出聊天界面 */
function closeWelcome() {
  welcomeShow.value = false;
  clearTimeout(welcomeTimer);
}

onBeforeUnmount(() => {
  clearTimeout(showcaseTimer);
  clearTimeout(welcomeTimer);
});

// 应用初始化（与原项目 init() 逻辑一致）：
// 1. 加载预设列表
// 2. 加载会话列表（若列表非空，自动加载第一个会话）
// 3. 若仍无当前会话，则打开新建会话弹窗，让用户选择首个会话的人设
onMounted(async () => {
  // 登录成功首次进入：播放"欢迎主人回家"归家过场（标记一次性消费，刷新不重播）
  if (sessionStorage.getItem(WELCOME_KEY) === '1') {
    sessionStorage.removeItem(WELCOME_KEY);
    welcomeShow.value = true;
    // 6.5s 后自动收场（也可点击跳过）
    welcomeTimer = setTimeout(closeWelcome, 6500);
  }
  await companionStore.loadPresets();
  await chatStore.loadSessionList();
  if (!chatStore.currentSession) {
    chatStore.showNewSessionDialog = true;
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap');
/* ==================== 侧栏收缩翼 ==================== */
/* 包裹左右侧栏：宽度动画收放，内部面板固定宽度避免被压缩变形 */
.panel-wing {
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
  position: relative;
  z-index: 5;
}
/* 翼宽与内部面板一致（侧栏 260px / 介绍栏 320px） */
.panel-wing.left {
  width: 260px;
}
.panel-wing.right {
  width: 320px;
}
.panel-wing.collapsed {
  width: 0;
  opacity: 0;
  pointer-events: none;
}

/* 边缘悬浮箭头按钮：玻璃质感圆片，垂直居中贴边 */
.wing-toggle {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  width: 30px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px) saturate(1.5);
  -webkit-backdrop-filter: blur(14px) saturate(1.5);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(31, 23, 42, 0.12);
  transition:
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease,
    left 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.wing-toggle.left {
  left: 12px;
}
.wing-toggle.right {
  right: 12px;
}
/* 收起状态下按钮贴到屏幕最边缘 */
.wing-toggle.left.collapsed {
  left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.wing-toggle.right.collapsed {
  right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.wing-toggle:hover {
  background: rgba(255, 255, 255, 0.8);
  color: var(--primary-color);
  box-shadow: 0 6px 20px rgba(31, 23, 42, 0.18);
}

/* 黑夜/国风主题下的玻璃按钮配色 */
body.theme-dark .wing-toggle {
  background: rgba(30, 38, 51, 0.6);
  border-color: #3a4659;
  color: #cbd5e1;
}
body.theme-dark .wing-toggle:hover {
  background: rgba(36, 46, 64, 0.85);
  color: #ff6b9d;
}
body.theme-wuxia .wing-toggle {
  background: rgba(26, 20, 14, 0.6);
  border-color: rgba(212, 175, 55, 0.45);
  color: #e8c06a;
}
body.theme-wuxia .wing-toggle:hover {
  background: rgba(26, 20, 14, 0.85);
  color: #d4553a;
}

/* 窄屏：隐藏收缩按钮并收起两翼，聊天区占满 */
@media (max-width: 900px) {
  .panel-wing,
  .panel-wing.left,
  .panel-wing.right {
    display: none;
  }
  .wing-toggle {
    display: none;
  }
}

/* 主题视频背景：固定铺满视口，置于三栏玻璃面板之下 */
.theme-video-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  animation: videoBgFadeIn 0.9s ease both;
}
.theme-video-bg video,
.theme-video-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
@keyframes videoBgFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
/* 视频之上的柔光遮罩：统一色调并保证面板内容可读性（随主题换色） */
.theme-video-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 244, 232, 0.35) 0%, rgba(255, 214, 228, 0.22) 100%);
}
body.theme-dawn .theme-video-bg::after {
  background: linear-gradient(135deg, rgba(255, 247, 236, 0.35) 0%, rgba(255, 201, 168, 0.22) 100%);
}
body.theme-dark .theme-video-bg::after {
  background: linear-gradient(135deg, rgba(13, 10, 26, 0.55) 0%, rgba(42, 15, 30, 0.4) 100%);
}
/* 国风主题：暗夜红纱 + 血色晕染，保证玻璃面板内容可读 */
body.theme-wuxia .theme-video-bg::after {
  background: linear-gradient(135deg, rgba(18, 8, 7, 0.55) 0%, rgba(72, 18, 14, 0.42) 100%);
}

/* ==================== 国风限定·入梦江湖过场 ==================== */
/* 顶层全屏覆盖：视频完整呈现（cover 铺满），点按任意处收场 */
.wuxia-showcase {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #120807;
  overflow: hidden;
}
.showcase-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
/* 朱砂纱幕：上下压暗保文字可读，中部尽量透出画面全貌 */
.showcase-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(18, 8, 7, 0.72) 0%, rgba(18, 8, 7, 0.1) 32%, rgba(18, 8, 7, 0.08) 62%, rgba(18, 8, 7, 0.78) 100%),
    radial-gradient(ellipse at center, transparent 40%, rgba(72, 18, 14, 0.35) 100%);
}

/* 剑光扫过：一道鎏金斜光划破画面 */
.showcase-slash {
  position: absolute;
  top: -20%;
  left: -35%;
  width: 55%;
  height: 150%;
  transform: rotate(24deg);
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.55), rgba(255, 244, 214, 0.85), rgba(212, 175, 55, 0.55), transparent);
  filter: blur(6px);
  animation: slashSweep 1.5s cubic-bezier(0.22, 0.9, 0.3, 1) 0.15s both;
  pointer-events: none;
}
@keyframes slashSweep {
  from {
    transform: rotate(24deg) translateX(-60vw);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  to {
    transform: rotate(24deg) translateX(230vw);
    opacity: 0;
  }
}

/* 主标题：书法大字，鎏金渐变 + 逐字破屏浮现 */
.showcase-title {
  position: relative;
  display: flex;
  gap: 18px;
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: clamp(64px, 12vw, 148px);
  font-weight: 400;
  line-height: 1;
  color: #f8e8c8;
  text-shadow:
    0 0 24px rgba(212, 175, 55, 0.55),
    0 4px 30px rgba(0, 0, 0, 0.7),
    0 0 80px rgba(192, 57, 43, 0.4);
}
.showcase-title span {
  display: inline-block;
  opacity: 0;
  animation: charBreakIn 0.9s cubic-bezier(0.2, 1.1, 0.3, 1) both;
  /* 鎏金流光字面 */
  background: linear-gradient(180deg, #fdf3d7 8%, #e8c06a 38%, #c0392b 62%, #e8c06a 88%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 18px rgba(212, 175, 55, 0.45)) drop-shadow(0 3px 22px rgba(0, 0, 0, 0.75));
}
@keyframes charBreakIn {
  from {
    opacity: 0;
    transform: translateY(46px) scale(2.1) rotate(-8deg);
    filter: blur(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0);
    filter: blur(0);
  }
}

/* 副标题：细描金小字，字距拉开 */
.showcase-sub {
  position: relative;
  margin-top: 26px;
  font-size: 15px;
  letter-spacing: 10px;
  color: rgba(232, 192, 106, 0.9);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
  opacity: 0;
  animation: subRise 1s ease 1.9s both;
}
@keyframes subRise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 交叉剑徽记：鎏金描边 + 呼吸光晕 */
.showcase-sword {
  position: relative;
  margin-top: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1px solid rgba(212, 175, 55, 0.55);
  color: #e8c06a;
  background: rgba(30, 14, 11, 0.5);
  box-shadow: 0 0 26px rgba(212, 175, 55, 0.35);
  opacity: 0;
  animation: subRise 1s ease 2.2s both, swordBreath 3s ease-in-out 3.2s infinite;
}
@keyframes swordBreath {
  0%, 100% {
    box-shadow: 0 0 22px rgba(212, 175, 55, 0.28);
  }
  50% {
    box-shadow: 0 0 40px rgba(212, 175, 55, 0.6);
  }
}

/* 底部提示：呼吸闪烁 */
.showcase-hint {
  position: absolute;
  bottom: 34px;
  font-size: 12px;
  letter-spacing: 4px;
  color: rgba(246, 232, 211, 0.65);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  opacity: 0;
  animation: hintBlink 2.2s ease 2.8s infinite;
}
@keyframes hintBlink {
  0%, 100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.9;
  }
}

/* 过场整体出入：入场墨色淡入 + 收场鎏金淡出 */
.showcase-enter-active {
  transition: opacity 0.5s ease;
}
.showcase-leave-active {
  transition: opacity 0.8s ease;
}
.showcase-enter-from,
.showcase-leave-to {
  opacity: 0;
}

/* ==================== 登录归家欢迎过场 ==================== */
/* 顶层全屏覆盖：主题视频完整铺满，点按任意处收场 */
.welcome-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* 视频加载期间的暖夜底色 */
  background: #140c1c;
  overflow: hidden;
}
/* 主题视频：cover 铺满视口，画面完整呈现 */
.welcome-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
/* 暖夜纱幕：仅上下边缘压暗保文字可读，中部画面完整透出 */
.welcome-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(20, 12, 28, 0.68) 0%, rgba(20, 12, 28, 0.12) 30%, rgba(20, 12, 28, 0.1) 62%, rgba(20, 12, 28, 0.72) 100%),
    radial-gradient(ellipse at center, transparent 40%, rgba(20, 12, 28, 0.28) 100%);
}

/* 主标题：书法大字，粉金流光渐变 + 逐字浮现 */
.welcome-title {
  position: relative;
  display: flex;
  gap: clamp(8px, 2vw, 26px);
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: clamp(56px, 11vw, 132px);
  font-weight: 400;
  line-height: 1;
}
.welcome-title span {
  display: inline-block;
  opacity: 0;
  animation: welcomeCharIn 0.85s cubic-bezier(0.2, 1.1, 0.3, 1) both;
  /* 粉金流光字面 */
  background: linear-gradient(180deg, #fff0f6 8%, #ffa8c9 40%, #e86a9e 66%, #ffd9a0 95%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
@keyframes welcomeCharIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(1.9);
    filter: blur(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0) drop-shadow(0 0 18px rgba(255, 130, 170, 0.45)) drop-shadow(0 3px 22px rgba(0, 0, 0, 0.7));
  }
}

/* 副标题：小字拉距，晚风般轻起 */
.welcome-sub {
  position: relative;
  margin-top: 28px;
  font-size: 14px;
  letter-spacing: 8px;
  color: rgba(255, 220, 232, 0.88);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.7);
  opacity: 0;
  animation: welcomeRise 0.9s ease 1.6s both;
}
@keyframes welcomeRise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 底部提示：呼吸闪烁 */
.welcome-hint {
  position: absolute;
  bottom: 34px;
  font-size: 12px;
  letter-spacing: 4px;
  color: rgba(255, 235, 242, 0.6);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
  opacity: 0;
  animation: welcomeBlink 2.2s ease 2.4s infinite;
}
@keyframes welcomeBlink {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.9;
  }
}

/* 过场整体出入：暖夜淡入 + 轻柔淡出 */
.welcome-enter-active {
  transition: opacity 0.4s ease;
}
.welcome-leave-active {
  transition: opacity 0.7s ease;
}
.welcome-enter-from,
.welcome-leave-to {
  opacity: 0;
}
</style>

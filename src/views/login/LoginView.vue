<template>
  <!-- 登录页：登录 / 注册 / 找回密码（三步），背景与表单跟随全局主题（粉色/暗夜） -->
  <div class="login-page">
    <!-- 背景图层（跟随全局主题：亮色=粉色，暗色=暗夜） -->
    <div class="bg-scene">
      <div class="bg-theme pink" :class="{ active: !isDark }"></div>
      <div class="bg-theme night" :class="{ active: isDark }"></div>
      <!-- 主题动态背景：本地物料优先，加载失败自动降级（视频/动图）到下方渐变图层 -->
      <video
        v-if="loginSource && !loginSource.isImage"
        :key="loginSource.url"
        class="bg-video"
        :src="loginSource.url"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        @error="onLoginMediaError"
      ></video>
      <img
        v-else-if="loginSource"
        :key="loginSource.url"
        class="bg-video"
        :src="loginSource.url"
        alt=""
        @error="onLoginMediaError"
      />
      <!-- 素材之上的柔光纱幕：统一色调并保证登录卡片可读 -->
      <div v-if="loginSource" class="bg-video-veil"></div>
    </div>

    <!-- 背景装饰：花朵散乱各自独立 + 文字斜着数条，随主题换色 -->
    <span class="flower-layer" :class="isDark ? 'theme-night' : 'theme-pink'">
      <span
        v-for="(flower, i) in themeFlowers"
        :key="'f' + i"
        class="bg-flower"
        :class="'fl' + (i + 1)"
        v-text="flower"
      ></span>
      <span
        v-for="(word, i) in themeWords"
        :key="'w' + i"
        class="bg-word"
        :class="'wd' + (i + 1)"
        v-text="word"
      ></span>
    </span>

    <div class="login-card">
      <!-- 品牌区 -->
      <div class="brand">
        <div class="logo">🌸</div>
        <h1>AI智能伴侣</h1>
        <p>{{ subTitle }}</p>
        <p class="brand-en">{{ slogan }}</p>
      </div>

      <!-- Tab 切换 -->
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'login' }" @click="switchTab('login')">
          登录<span class="line"></span>
        </div>
        <div class="tab" :class="{ active: activeTab === 'register' }" @click="switchTab('register')">
          注册<span class="line"></span>
        </div>
        <div class="tab" :class="{ active: activeTab === 'reset' }" @click="switchTab('reset')">
          找回密码<span class="line"></span>
        </div>
      </div>

      <!-- ============ 登录 ============ -->
      <div v-show="activeTab === 'login'" class="panel">
        <div class="field">
          <label><i>*</i>用户名</label>
          <input
            v-model.trim="loginForm.username"
            class="input"
            :class="{ err: errors.login.username }"
            placeholder="请输入用户名"
            @input="clearError('login', 'username')"
          />
          <div v-if="errors.login.username" class="msg">{{ errors.login.username }}</div>
        </div>

        <div class="field">
          <label><i>*</i>密码</label>
          <div class="input-wrap">
            <input
              v-model="loginForm.password"
              class="input"
              :class="{ err: errors.login.password }"
              :type="showPwd.login ? 'text' : 'password'"
              placeholder="请输入密码（6-20位，字母+数字）"
              @input="clearError('login', 'password')"
              @keypress.enter="submitLogin"
            />
            <button type="button" class="eye" @click="showPwd.login = !showPwd.login">
              {{ showPwd.login ? '🙈' : '👁' }}
            </button>
          </div>
          <div v-if="errors.login.password" class="msg">{{ errors.login.password }}</div>
        </div>

        <!-- 后端错误（用户名或密码错误等）：行内红字展示 -->
        <div v-if="errors.login.form" class="form-error">{{ errors.login.form }}</div>

        <button class="btn" :disabled="loginLoading" @click="submitLogin">
          {{ loginLoading ? '登录中...' : '登录' }}
        </button>
        <div class="links">
          <a @click="switchTab('register')">没有账号？去注册</a>
          <a @click="switchTab('reset')">忘记密码？</a>
        </div>
      </div>

      <!-- ============ 注册 ============ -->
      <div v-show="activeTab === 'register'" class="panel">
        <div class="field">
          <label><i>*</i>用户名</label>
          <input
            v-model.trim="registerForm.username"
            class="input"
            :class="{ err: errors.register.username || usernameCheck.status === 'taken' }"
            placeholder="请输入用户名"
            @input="onUsernameInput"
            @blur="checkUsernameNow"
          />
          <!-- 实时可用性提示：检查中 / 可用 / 已占用 -->
          <div v-if="usernameCheck.status === 'checking'" class="msg username-checking">检查中...</div>
          <div v-else-if="usernameCheck.status === 'available'" class="msg username-ok">
            ✓ 用户名可用
          </div>
          <div v-else-if="usernameCheck.status === 'taken'" class="msg username-taken">
            ✗ 该用户名已被注册
          </div>
          <div v-else-if="errors.register.username" class="msg">{{ errors.register.username }}</div>
        </div>

        <div class="field">
          <label><i>*</i>密码</label>
          <div class="input-wrap">
            <input
              v-model="registerForm.password"
              class="input"
              :class="{ err: errors.register.password }"
              :type="showPwd.register ? 'text' : 'password'"
              placeholder="6-20位，需包含字母和数字"
              @input="clearError('register', 'password')"
              @blur="validateRegisterPassword"
            />
            <button type="button" class="eye" @click="showPwd.register = !showPwd.register">
              {{ showPwd.register ? '🙈' : '👁' }}
            </button>
          </div>
          <div v-if="errors.register.password" class="msg">{{ errors.register.password }}</div>
        </div>

        <div class="field">
          <label><i>*</i>确认密码</label>
          <div class="input-wrap">
            <input
              v-model="registerForm.password2"
              class="input"
              :class="{ err: errors.register.password2 }"
              :type="showPwd.register2 ? 'text' : 'password'"
              placeholder="请再次输入密码"
              @input="clearError('register', 'password2')"
              @blur="validateRegisterPassword2"
            />
            <button type="button" class="eye" @click="showPwd.register2 = !showPwd.register2">
              {{ showPwd.register2 ? '🙈' : '👁' }}
            </button>
          </div>
          <div v-if="errors.register.password2" class="msg">{{ errors.register.password2 }}</div>
        </div>

        <!-- 性别（可选，默认未知；用于优先推荐异性伴侣预设） -->
        <div class="field">
          <label>性别</label>
          <div class="input-wrap">
            <select v-model="registerForm.gender" class="input">
              <option value="">未知</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="field">
          <label><i>*</i>密保问题</label>
          <div class="input-wrap">
            <select
              v-model="registerForm.question"
              class="input"
              :class="{ err: errors.register.question }"
              @change="clearError('register', 'question')"
            >
              <option value="">请选择密保问题（用于找回密码）</option>
              <option v-for="q in SECURITY_QUESTIONS" :key="q" :value="q">{{ q }}</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
          <div v-if="errors.register.question" class="msg">{{ errors.register.question }}</div>
        </div>

        <div class="field">
          <label><i>*</i>密保答案</label>
          <input
            v-model.trim="registerForm.answer"
            class="input"
            :class="{ err: errors.register.answer }"
            placeholder="请输入密保答案"
            @input="clearError('register', 'answer')"
          />
          <div v-if="errors.register.answer" class="msg">{{ errors.register.answer }}</div>
        </div>

        <!-- 后端错误（用户名已注册等）：行内红字展示 -->
        <div v-if="errors.register.form" class="form-error">{{ errors.register.form }}</div>

        <button class="btn" :disabled="registerLoading" @click="submitRegister">
          {{ registerLoading ? '注册中...' : '注册' }}
        </button>
        <div class="links">
          <a @click="switchTab('login')">已有账号？去登录</a>
        </div>
      </div>

      <!-- ============ 找回密码（三步） ============ -->
      <div v-show="activeTab === 'reset'" class="panel">
        <!-- 步骤条 -->
        <div class="steps">
          <div class="step" :class="stepClass(1)">
            <div class="dot">{{ resetStep > 1 ? '✓' : '1' }}</div>
            <span>验证用户名</span>
          </div>
          <div class="step-line" :class="{ done: resetStep > 1 }"></div>
          <div class="step" :class="stepClass(2)">
            <div class="dot">{{ resetStep > 2 ? '✓' : '2' }}</div>
            <span>密保验证</span>
          </div>
          <div class="step-line" :class="{ done: resetStep > 2 }"></div>
          <div class="step" :class="stepClass(3)">
            <div class="dot">3</div>
            <span>重置密码</span>
          </div>
        </div>

        <!-- 步骤一：验证用户名 -->
        <div v-show="resetStep === 1" class="rstep">
          <div class="field">
            <label><i>*</i>用户名</label>
            <input
              v-model.trim="resetForm.username"
              class="input"
              :class="{ err: errors.reset.username }"
              placeholder="请输入要找回的账号用户名"
              @input="clearError('reset', 'username')"
            />
            <div v-if="errors.reset.username" class="msg">{{ errors.reset.username }}</div>
          </div>
          <button class="btn" :disabled="resetLoading1" @click="submitResetStep1">
            {{ resetLoading1 ? '校验中...' : '下一步' }}
          </button>
          <div class="links"><a @click="switchTab('login')">返回登录</a></div>
        </div>

        <!-- 步骤二：密保验证 -->
        <div v-show="resetStep === 2" class="rstep">
          <div class="q-box">🔑 密保问题：<b>{{ resetQuestion }}</b></div>
          <div class="field">
            <label><i>*</i>密保答案</label>
            <input
              v-model.trim="resetForm.answer"
              class="input"
              :class="{ err: errors.reset.answer }"
              placeholder="请输入密保答案"
              @input="clearError('reset', 'answer')"
            />
            <div v-if="errors.reset.answer" class="msg">{{ errors.reset.answer }}</div>
          </div>
          <div class="row">
            <button class="btn ghost" @click="resetStep = 1">上一步</button>
            <button class="btn" :disabled="resetLoading2" @click="submitResetStep2">
              {{ resetLoading2 ? '校验中...' : '下一步' }}
            </button>
          </div>
        </div>

        <!-- 步骤三：重置密码 -->
        <div v-show="resetStep === 3" class="rstep">
          <div class="field">
            <label><i>*</i>新密码</label>
            <div class="input-wrap">
              <input
                v-model="resetForm.password"
                class="input"
                :class="{ err: errors.reset.password }"
                :type="showPwd.reset ? 'text' : 'password'"
                placeholder="6-20位，需包含字母和数字"
                @input="clearError('reset', 'password')"
                @blur="validateResetPassword"
              />
              <button type="button" class="eye" @click="showPwd.reset = !showPwd.reset">
                {{ showPwd.reset ? '🙈' : '👁' }}
              </button>
            </div>
            <div v-if="errors.reset.password" class="msg">{{ errors.reset.password }}</div>
          </div>

          <div class="field">
            <label><i>*</i>确认新密码</label>
            <div class="input-wrap">
              <input
                v-model="resetForm.password2"
                class="input"
                :class="{ err: errors.reset.password2 }"
                :type="showPwd.reset2 ? 'text' : 'password'"
                placeholder="请再次输入新密码"
                @input="clearError('reset', 'password2')"
                @blur="validateResetPassword2"
              />
              <button type="button" class="eye" @click="showPwd.reset2 = !showPwd.reset2">
                {{ showPwd.reset2 ? '🙈' : '👁' }}
              </button>
            </div>
            <div v-if="errors.reset.password2" class="msg">{{ errors.reset.password2 }}</div>
          </div>

          <div class="row">
            <button class="btn ghost" @click="resetStep = 2">上一步</button>
            <button class="btn" :disabled="resetLoading3" @click="submitResetStep3">
              {{ resetLoading3 ? '重置中...' : '确认重置' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 顶部主题切换（粉色/暗夜 全局一键切换） -->
    <div class="theme-switcher-top">
      <ThemeSwitcher />
    </div>

    <!-- 轻提示 -->
    <transition name="toast">
      <div v-if="toastMsg" class="login-toast">{{ toastMsg }}</div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/modules/user';
import { checkUsername as apiCheckUsername } from '@/api/modules/auth';
import ThemeSwitcher from '@/components/business/ThemeSwitcher.vue';
import { useTheme } from '@/composables/useTheme';
import { useThemeVideo } from '@/composables/useThemeVideo';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { theme } = useTheme();

/** 是否暗夜模式（背景/花朵/文字/slogan 跟随） */
const isDark = computed(() => theme.value === 'dark');

/** 主题动态背景：本地物料 → 本地动图 → OSS 直链 → 渐变，逐级降级 */
const { source: loginSource, onError: onLoginMediaError } = useThemeVideo(theme);

/** 登录成功标记：写入 sessionStorage，聊天页挂载时读取并播放"欢迎主人回家"过场 */
const WELCOME_KEY = 'ai-companion-welcome';
function markWelcomeHome() {
  sessionStorage.setItem(WELCOME_KEY, '1');
}

/** 登录成功后回跳地址（从路由 query 读取，默认聊天主页） */
const redirect = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/'
);

/** 品牌 slogan：跟随主题 */
const SLOGANS = {
  pink: 'Meet Your AI Companion',
  night: 'The Night Falls'
};
const slogan = computed(() => (isDark.value ? SLOGANS.night : SLOGANS.pink));

/**
 * 背景装饰：随主题切换花种与文案
 * - 粉色：温柔粉系花朵 + 甜蜜文案
 * - 暗夜：暗紫冷色花朵 + 暗黑文案
 */
const THEME_FLOWERS = {
  pink: ['🌸', '🌷', '🌺', '🌼', '🌹', '🌸', '🌷', '🌺'],
  night: ['🥀', '🪷', '🌹', '🥀', '🌹', '🪷', '🌹', '🥀']
};
const THEME_WORDS = {
  pink: ['Sweet Dreams', 'Warm & Cozy', 'Chase Your Heart', 'Stay Soft', 'Love Yourself'],
  night: ['The Night Falls', 'Star Crossed', 'Dark Beauty', 'Midnight Bloom', 'Shadow Rose']
};

const themeFlowers = computed(() => THEME_FLOWERS[isDark.value ? 'night' : 'pink']);
const themeWords = computed(() => THEME_WORDS[isDark.value ? 'night' : 'pink']);

/** 密保问题选项（与后端约定的枚举文本） */
const SECURITY_QUESTIONS = [
  '你最喜欢的城市是哪里？',
  '你的第一只宠物叫什么名字？',
  '你小学班主任的姓氏是？',
  '你最喜欢的一部电影是？',
  '你出生的城市是哪座？'
];

/* ---------------- 状态 ---------------- */
const activeTab = ref('login');
const resetStep = ref(1);
const subTitleMap = {
  login: '欢迎回来，请登录',
  register: '创建你的专属账号',
  reset: '通过密保问题找回密码'
};
const subTitle = computed(() => subTitleMap[activeTab.value]);

const loginForm = reactive({ username: '', password: '' });
const registerForm = reactive({ username: '', gender: '', password: '', password2: '', question: '', answer: '' });
const resetForm = reactive({ username: '', answer: '', password: '', password2: '' });
const resetQuestion = ref('');

/** 各面板错误提示 { login: {}, register: {}, reset: {} } */
const errors = reactive({ login: {}, register: {}, reset: {} });
/** 密码明文可见开关 */
const showPwd = reactive({ login: false, register: false, register2: false, reset: false, reset2: false });

const loginLoading = ref(false);
const registerLoading = ref(false);
const resetLoading1 = ref(false);
const resetLoading2 = ref(false);
const resetLoading3 = ref(false);

/* ---------------- 工具 ---------------- */
function clearError(panel, field) {
  errors[panel][field] = '';
}
function validPwd(v) {
  return /^[a-zA-Z0-9]{6,20}$/.test(v) && /[a-zA-Z]/.test(v) && /\d/.test(v);
}

/**
 * 注册·密码失焦校验：光标离开密码框时立即提示格式错误
 * - 通过则清除错误提示
 */
function validateRegisterPassword() {
  const pw = registerForm.password;
  if (!pw) {
    errors.register.password = '请输入密码';
    return;
  }
  if (!validPwd(pw)) {
    errors.register.password = '密码需为6-20位，且同时包含字母和数字';
    return;
  }
  errors.register.password = '';
}

/**
 * 注册·确认密码失焦校验：光标离开确认密码框时提醒两次密码是否一致
 * - 密码尚未填写时提示先填密码
 * - 一致则清除错误提示
 */
function validateRegisterPassword2() {
  const pw = registerForm.password;
  const pw2 = registerForm.password2;
  if (!pw) {
    errors.register.password2 = '请先填写密码';
    return;
  }
  if (pw2 !== pw || !pw2) {
    errors.register.password2 = '两次输入的密码不一致';
    return;
  }
  errors.register.password2 = '';
}
/**
 * 找回密码·新密码失焦校验：光标离开密码框时立即提示格式错误
 * - 通过则清除错误提示（与注册密码失焦校验逻辑一致）
 */
function validateResetPassword() {
  const pw = resetForm.password;
  if (!pw) {
    errors.reset.password = '请输入新密码';
    return;
  }
  if (!validPwd(pw)) {
    errors.reset.password = '密码需为6-20位，且同时包含字母和数字';
    return;
  }
  errors.reset.password = '';
}

/**
 * 找回密码·确认新密码失焦校验：光标离开确认密码框时提醒两次密码是否一致
 * - 密码尚未填写时提示先填密码
 * - 一致则清除错误提示
 */
function validateResetPassword2() {
  const pw = resetForm.password;
  const pw2 = resetForm.password2;
  if (!pw) {
    errors.reset.password2 = '请先填写新密码';
    return;
  }
  if (pw2 !== pw || !pw2) {
    errors.reset.password2 = '两次输入的密码不一致';
    return;
  }
  errors.reset.password2 = '';
}
function stepClass(n) {
  return { active: resetStep.value === n, done: resetStep.value > n };
}

const toastMsg = ref('');
let toastTimer = null;
function showToast(text) {
  toastMsg.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg.value = '';
  }, 2600);
}

/** 切换 Tab 时重置表单与错误（与原生需求一致） */
function switchTab(tab) {
  activeTab.value = tab;
  errors.login = {};
  errors.register = {};
  errors.reset = {};
  loginForm.password = '';
  registerForm.password = '';
  registerForm.password2 = '';
  registerForm.answer = '';
  registerForm.question = '';
  registerForm.gender = '';
  resetForm.answer = '';
  resetForm.password = '';
  resetForm.password2 = '';
  if (tab === 'reset') resetStep.value = 1;
  // 切回注册 Tab 时重置用户名可用性状态
  resetUsernameCheck();
}

/* ---------------- 注册：用户名实时可用性校验 ---------------- */
/** 用户名可用性状态：idle 未检查 / checking 检查中 / available 可用 / taken 已占用 */
const usernameCheck = reactive({ status: 'idle' });
let checkUsernameTimer = null;
let checkUsernameSeq = 0;

/** 重置用户名检查状态 */
function resetUsernameCheck() {
  clearTimeout(checkUsernameTimer);
  checkUsernameTimer = null;
  usernameCheck.status = 'idle';
}

/** 输入时防抖检查（500ms 内停止输入才发请求） */
function onUsernameInput() {
  clearError('register', 'username');
  const name = registerForm.username.trim();
  if (!name) {
    resetUsernameCheck();
    return;
  }
  // 输入变化后先清空之前的"已占用/可用"结论
  if (usernameCheck.status === 'available' || usernameCheck.status === 'taken') {
    usernameCheck.status = 'idle';
  }
  clearTimeout(checkUsernameTimer);
  checkUsernameTimer = setTimeout(() => doCheckUsername(), 500);
}

/** 失焦时立即检查 */
function checkUsernameNow() {
  clearTimeout(checkUsernameTimer);
  checkUsernameTimer = null;
  if (!registerForm.username.trim()) {
    resetUsernameCheck();
    return;
  }
  doCheckUsername();
}

/** 执行用户名可用性检查（用序号防止旧响应覆盖新结果） */
async function doCheckUsername() {
  const name = registerForm.username.trim();
  if (!name) return;
  const seq = ++checkUsernameSeq;
  usernameCheck.status = 'checking';
  try {
    const data = await apiCheckUsername(name);
    // 仅当结果仍对应最新一次输入时才更新
    if (seq !== checkUsernameSeq) return;
    usernameCheck.status = data.available ? 'available' : 'taken';
  } catch (error) {
    if (seq !== checkUsernameSeq) return;
    // 检查接口失败：静默恢复 idle，提交时由后端兜底校验
    usernameCheck.status = 'idle';
  }
}

/* ---------------- 登录 ---------------- */
async function submitLogin() {
  errors.login = {};
  const username = loginForm.username;
  const password = loginForm.password;
  if (!username) {
    errors.login.username = '请输入用户名';
    return;
  }
  if (!password) {
    errors.login.password = '请输入密码';
    return;
  }
  loginLoading.value = true;
  try {
    await userStore.login({ username, password });
    markWelcomeHome();
    showToast('登录成功，进入聊天主页');
    router.push(redirect.value);
  } catch (error) {
    // 认证接口错误由 request.js 直接 reject，此处行内展示后端 message（如"用户名或密码错误"）
    errors.login.form = error?.response?.data?.message || '登录失败，请稍后重试';
  } finally {
    loginLoading.value = false;
  }
}

/* ---------------- 注册（成功自动登录） ---------------- */
async function submitRegister() {
  errors.register = {};
  const { username, password, password2, question, answer, gender } = registerForm;
  if (!username) {
    errors.register.username = '请输入用户名';
    return;
  }
  // 实时校验已确认用户名被占用：阻止提交
  if (usernameCheck.status === 'taken') {
    errors.register.form = '该用户名已被注册，请更换';
    return;
  }
  if (!validPwd(password)) {
    errors.register.password = '密码需为6-20位，且同时包含字母和数字';
    return;
  }
  if (password2 !== password || !password2) {
    errors.register.password2 = '两次输入的密码不一致';
    return;
  }
  if (!question) {
    errors.register.question = '请选择密保问题';
    return;
  }
  if (!answer) {
    errors.register.answer = '请输入密保答案';
    return;
  }
  registerLoading.value = true;
  try {
    await userStore.register({ username, password, question, answer, gender });
    markWelcomeHome();
    showToast('注册成功，已自动登录');
    router.push(redirect.value);
  } catch (error) {
    // 认证接口错误由 request.js 直接 reject，此处行内展示后端 message（如"该用户名已被注册"）
    errors.register.form = error?.response?.data?.message || '注册失败，请稍后重试';
  } finally {
    registerLoading.value = false;
  }
}

/* ---------------- 找回密码（三步） ---------------- */
async function submitResetStep1() {
  errors.reset = {};
  const username = resetForm.username;
  if (!username) {
    errors.reset.username = '请输入用户名';
    return;
  }
  resetLoading1.value = true;
  try {
    const question = await userStore.getSecurityQuestion(username);
    resetQuestion.value = question;
    resetStep.value = 2;
  } catch (error) {
    // 后端 message（如"该用户名不存在"）显示在用户名输入框下方
    errors.reset.username = error?.response?.data?.message || '校验失败，请重试';
  } finally {
    resetLoading1.value = false;
  }
}

async function submitResetStep2() {
  errors.reset.answer = '';
  const answer = resetForm.answer;
  if (!answer) {
    errors.reset.answer = '请输入密保答案';
    return;
  }
  resetLoading2.value = true;
  try {
    await userStore.verifySecurityAnswer(resetForm.username, answer);
    resetStep.value = 3;
  } catch (error) {
    // 后端 message（如"密保答案错误，请重试"）显示在答案输入框下方
    errors.reset.answer = error?.response?.data?.message || '校验失败，请重试';
  } finally {
    resetLoading2.value = false;
  }
}

async function submitResetStep3() {
  errors.reset.password = '';
  errors.reset.password2 = '';
  const p = resetForm.password;
  const p2 = resetForm.password2;
  if (!validPwd(p)) {
    errors.reset.password = '密码需为6-20位，且同时包含字母和数字';
    return;
  }
  if (p2 !== p || !p2) {
    errors.reset.password2 = '两次输入的密码不一致';
    return;
  }
  resetLoading3.value = true;
  try {
    await userStore.resetPassword(resetForm.username, p);
    showToast('密码已重置，请登录');
    // 重置成功：切回登录 Tab，用户名自动填入，不自动登录
    activeTab.value = 'login';
    loginForm.username = resetForm.username;
    loginForm.password = '';
    resetForm.answer = '';
    resetForm.password = '';
    resetForm.password2 = '';
    resetStep.value = 1;
    errors.reset = {};
  } catch (error) {
    // 后端 message（如"请先完成密保验证"）显示在新密码输入框下方
    errors.reset.password = error?.response?.data?.message || '重置失败，请重试';
  } finally {
    resetLoading3.value = false;
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');

/* ============ 页面容器（透明，背景由 .bg-theme 图层控制） ============ */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 44px 20px;
  background: transparent;
}

/* ============ 背景图层（三主题，opacity 交叉淡入淡出） ============ */
.bg-scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.bg-theme {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.9s ease;
}
.bg-theme.active {
  opacity: 1;
}

/* 主题视频背景：铺满视口盖在渐变图层之上（失败时移除，渐变即兜底） */
.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
/* 视频柔光纱幕：压暗四角统一色调，保证登录卡片与背景装饰可读 */
.bg-video-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 42%, rgba(20, 12, 26, 0.35) 100%),
    linear-gradient(180deg, rgba(20, 12, 26, 0.28) 0%, transparent 26%, transparent 74%, rgba(20, 12, 26, 0.36) 100%);
}

/* 主题① 甜蜜粉（默认）：桃色+粉色渐变 */
.bg-theme.pink {
  background: linear-gradient(135deg, #fff0f5 0%, #ffe3ec 55%, #ffd6e4 100%);
}
.bg-theme.pink::before,
.bg-theme.pink::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
}
.bg-theme.pink::before {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(255, 107, 157, 0.18), transparent 70%);
  top: -120px;
  right: -80px;
}
.bg-theme.pink::after {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(255, 143, 171, 0.15), transparent 70%);
  bottom: -100px;
  left: -90px;
}

/* 主题② 黑夜使者·亚索：暗黑火焰 */
.bg-theme.night {
  background: linear-gradient(135deg, #0d0a1a 0%, #2a0f1e 55%, #4a1020 100%);
}
.bg-theme.night::before {
  content: '';
  position: fixed;
  bottom: -140px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 94, 58, 0.32), transparent 65%);
  pointer-events: none;
}
.bg-theme.night::after {
  content: '';
  position: fixed;
  top: -120px;
  right: -80px;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.35), transparent 70%);
  pointer-events: none;
}

/* ============ 背景装饰：文字 + 花朵成组（随主题换花种与文案） ============ */
.flower-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  /* 换主题时重放淡入 */
  animation: flowerFadeIn 0.9s ease both;
}
/* 花朵：逐朵散乱独立摆放（不排一排，位置由 .fl1~.flN 决定） */
.bg-flower {
  position: fixed;
  pointer-events: none;
  line-height: 1;
  opacity: 0.85;
  font-size: 24px;
  animation: floatY 6s ease-in-out infinite;
}
/* 文字：斜着错落数条（各自旋转倾置，位置由 .wd1~.wdN 决定） */
.bg-word {
  position: fixed;
  pointer-events: none;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  letter-spacing: 1px;
  white-space: nowrap;
  opacity: 0.7;
  font-size: 18px;
  transform: rotate(-8deg);
}
/* 各主题花朵光晕与文字配色（贴合背景色调） */
.flower-layer.theme-pink .bg-flower { filter: drop-shadow(0 4px 8px rgba(255, 107, 157, 0.3)); }
.flower-layer.theme-pink .bg-word { color: #d87093; }
.flower-layer.theme-night .bg-flower { filter: drop-shadow(0 4px 8px rgba(124, 58, 237, 0.35)); }
.flower-layer.theme-night .bg-word { color: #b39ddb; }
@keyframes flowerFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 兜底位置（默认按 pink 摆放） */
.fl1 { top: 8%;  left: 6%; }
.fl2 { top: 20%; right: 10%; }
.fl3 { top: 34%; left: 12%; }
.fl4 { bottom: 12%; right: 8%; }
.fl5 { bottom: 24%; left: 9%; }
.fl6 { top: 46%; right: 14%; }
.fl7 { bottom: 6%;  left: 20%; }
.fl8 { bottom: 32%; right: 18%; }
.wd1 { top: 14%;  left: 4%; }
.wd2 { top: 40%; right: 5%; transform: rotate(6deg); }
.wd3 { bottom: 18%; left: 5%; transform: rotate(-12deg); }
.wd4 { bottom: 40%; right: 4%; transform: rotate(9deg); }
.wd5 { top: 60%;  left: 10%; transform: rotate(-5deg); }

/* 各主题花朵位置不同，营造不同氛围 */
.flower-layer.theme-pink .fl1 { top: 8%;  left: 6%; font-size: 26px; }
.flower-layer.theme-pink .fl2 { top: 22%; right: 10%; font-size: 20px; }
.flower-layer.theme-pink .fl3 { top: 38%; left: 12%; font-size: 28px; }
.flower-layer.theme-pink .fl4 { bottom: 14%; right: 8%; font-size: 22px; }
.flower-layer.theme-pink .fl5 { bottom: 26%; left: 9%; font-size: 18px; }
.flower-layer.theme-pink .fl6 { top: 50%; right: 14%; font-size: 24px; }
.flower-layer.theme-pink .fl7 { bottom: 6%;  left: 20%; font-size: 26px; }
.flower-layer.theme-pink .fl8 { bottom: 32%; right: 18%; font-size: 16px; }
/* 各主题文字错位（位置 + 旋转角各不同） */
.flower-layer.theme-pink .wd1 { top: 14%;  left: 4%;  font-size: 20px; transform: rotate(-10deg); }
.flower-layer.theme-pink .wd2 { top: 38%;  right: 6%; font-size: 16px; transform: rotate(7deg); }
.flower-layer.theme-pink .wd3 { bottom: 18%; left: 5%; font-size: 21px; transform: rotate(-14deg); }
.flower-layer.theme-pink .wd4 { bottom: 36%; right: 5%; font-size: 15px; transform: rotate(11deg); }
.flower-layer.theme-pink .wd5 { top: 62%;  left: 12%; font-size: 17px; transform: rotate(-6deg); }

.flower-layer.theme-night .wd1 { top: 12%;  left: 4%; font-size: 18px; transform: rotate(-8deg); }
.flower-layer.theme-night .wd2 { top: 34%;  right: 4%; font-size: 20px; transform: rotate(6deg); }
.flower-layer.theme-night .wd3 { bottom: 12%; left: 6%; font-size: 19px; transform: rotate(-12deg); }
.flower-layer.theme-night .wd4 { bottom: 36%; right: 5%; font-size: 17px; transform: rotate(9deg); }
.flower-layer.theme-night .wd5 { top: 56%;  left: 12%; font-size: 16px; transform: rotate(-4deg); }

/* 黑夜：分布更散、偏暗部角落 */
.flower-layer.theme-night .fl1 { top: 10%; left: 5%; font-size: 22px; }
.flower-layer.theme-night .fl2 { top: 28%; right: 5%; font-size: 26px; }
.flower-layer.theme-night .fl3 { top: 44%; left: 8%; font-size: 24px; }
.flower-layer.theme-night .fl4 { bottom: 12%; right: 6%; font-size: 26px; }
.flower-layer.theme-night .fl5 { bottom: 30%; left: 6%; font-size: 20px; }
.flower-layer.theme-night .fl6 { top: 62%; right: 10%; font-size: 22px; }
.flower-layer.theme-night .fl7 { bottom: 5%;  left: 15%; font-size: 28px; }
.flower-layer.theme-night .fl8 { bottom: 40%; right: 14%; font-size: 18px; }

@keyframes floatY {
  0%,
  100% {
    transform: translateY(0) rotate(-6deg);
  }
  50% {
    transform: translateY(-16px) rotate(8deg);
  }
}

.login-card {
  width: 430px;
  max-width: 100%;
  background: var(--sidebar-bg);
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
  padding: 36px 38px 30px;
  position: relative;
  z-index: 2;
  animation: rise 0.5s ease both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ============ 品牌区 ============ */
.brand {
  text-align: center;
  margin-bottom: 22px;
}
.brand .logo {
  width: 62px;
  height: 62px;
  margin: 0 auto 10px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
  box-shadow: var(--shadow-lg);
}
.brand h1 {
  font-size: 22px;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}
.brand p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 5px;
}
/* 花体英文 slogan */
.brand .brand-en {
  font-family: 'Great Vibes', 'Brush Script MT', cursive;
  font-size: 26px;
  color: var(--primary-color);
  margin-top: 8px;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(255, 107, 157, 0.2);
}

/* ============ Tab ============ */
.tabs {
  display: flex;
  border-bottom: 1.5px solid var(--border-color);
  margin-bottom: 24px;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 11px 0 13px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
  position: relative;
  transition: color 0.2s;
  user-select: none;
}
.tab .line {
  position: absolute;
  left: 50%;
  bottom: -1.5px;
  width: 0;
  height: 2.5px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
  transform: translateX(-50%);
  transition: width 0.28s ease;
}
.tab.active {
  color: var(--primary-color);
  font-weight: 600;
}
.tab.active .line {
  width: 64%;
}
.tab:hover {
  color: var(--primary-color);
}

/* ============ 表单 ============ */
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 7px;
  font-weight: 500;
}
.field label i {
  color: var(--primary-color);
  font-style: normal;
  margin-right: 2px;
}
.input-wrap {
  position: relative;
}
.input {
  width: 100%;
  padding: 11px 14px;
  font-size: 14px;
  border-radius: 10px;
  border: 1.5px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-primary);
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  font-family: inherit;
}
.input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.14);
}
.input.err {
  border-color: #e53e3e;
  background: rgba(229, 72, 77, 0.08);
}
.input::placeholder {
  color: var(--text-secondary);
}
.eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-secondary);
  padding: 4px;
  line-height: 1;
}
.eye:hover {
  color: var(--primary-color);
}
select.input {
  appearance: none;
  cursor: pointer;
}
.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
  font-size: 12px;
}
.msg {
  font-size: 12px;
  color: #e53e3e;
  margin-top: 6px;
  animation: shake 0.3s ease;
}

/* 用户名实时可用性提示 */
.username-checking {
  color: var(--text-secondary);
  animation: none;
}
.username-ok {
  color: #2fa96e;
  animation: none;
}
.username-taken {
  color: #e53e3e;
  animation: none;
}

/* 表单级错误（后端返回：用户名或密码错误 / 该用户名已被注册等） */
.form-error {
  font-size: 13px;
  color: #e53e3e;
  background: rgba(229, 72, 77, 0.08);
  border: 1px solid rgba(229, 72, 77, 0.35);
  border-radius: 8px;
  padding: 9px 12px;
  margin-bottom: 12px;
  text-align: center;
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

/* ============ 按钮 ============ */
.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 6px;
  text-indent: 6px;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  box-shadow: var(--shadow-lg);
  transition:
    transform 0.15s,
    filter 0.2s,
    opacity 0.2s;
  margin-top: 6px;
}
.btn:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}
.btn:active {
  transform: translateY(1px);
}
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.btn.ghost {
  background: none;
  box-shadow: none;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-indent: 2px;
  border: 1.5px solid var(--border-color);
}
.btn.ghost:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}
.links {
  display: flex;
  justify-content: center;
  gap: 22px;
  margin-top: 18px;
  font-size: 13px;
}
.links a {
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: none;
}
.links a:hover {
  text-decoration: underline;
}
.row {
  display: flex;
  gap: 12px;
}
.row .btn {
  letter-spacing: 2px;
  text-indent: 2px;
  margin-top: 0;
}

/* ============ 步骤条 ============ */
.steps {
  display: flex;
  align-items: center;
  margin-bottom: 26px;
  padding: 0 6px;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: none;
  width: 72px;
}
.step .dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--border-color);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s;
}
.step span {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.step.active .dot {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.4);
}
.step.active span {
  color: var(--primary-color);
  font-weight: 600;
}
.step.done .dot {
  background: #2fa96e;
  color: #fff;
}
.step.done span {
  color: #2fa96e;
}
.step-line {
  flex: 1;
  height: 2px;
  background: var(--border-color);
  margin: 0 2px 20px;
  border-radius: 2px;
}
.step-line.done {
  background: #2fa96e;
}
.q-box {
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.08), rgba(255, 107, 157, 0.05));
  border: 1.5px dashed var(--primary-color);
  border-radius: 12px;
  padding: 13px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--text-primary);
}
.q-box b {
  color: var(--primary-color);
}

/* ============ Toast ============ */
.login-toast {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: #2fa96e;
  color: #fff;
  padding: 10px 22px;
  border-radius: 12px;
  font-size: 14px;
  z-index: 100;
  box-shadow: var(--shadow-lg);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px);
}
</style>

<!-- 非 scoped：暗色模式下登录页覆盖（与全局暗色层次配色一致） -->
<style>
body.theme-dark .login-card {
  background-color: #1a2130;
  border: 1px solid #2e3949;
}
body.theme-dark .login-card .brand h1 {
  color: #f1f5f9;
}
body.theme-dark .login-card .brand p {
  color: #94a3b8;
}
body.theme-dark .login-card .tabs {
  border-bottom-color: #2e3949;
}
body.theme-dark .login-card .tab {
  color: #94a3b8;
}
body.theme-dark .login-card .tab.active {
  color: #fbcfe8;
}
body.theme-dark .login-card .input {
  background-color: #242e40;
  color: #f1f5f9;
  border-color: #3a4659;
}
body.theme-dark .login-card .input.err {
  border-color: #fc8181;
  background-color: rgba(229, 62, 62, 0.12);
}
body.theme-dark .login-card .input:focus {
  border-color: #fbcfe8;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.25);
}
body.theme-dark .login-card .input::placeholder {
  color: #7c8ba0;
}
body.theme-dark .login-card .field label {
  color: #94a3b8;
}
body.theme-dark .login-card .msg {
  color: #fc8181;
}
/* 暗色下用户名可用性提示 */
body.theme-dark .login-card .username-checking {
  color: #94a3b8;
}
body.theme-dark .login-card .username-ok {
  color: #68d391;
}
body.theme-dark .login-card .username-taken {
  color: #fc8181;
}
body.theme-dark .login-card .btn.ghost {
  color: #94a3b8;
  border-color: #3a4659;
}
body.theme-dark .login-card .btn.ghost:hover {
  color: #fbcfe8;
  border-color: #fbcfe8;
}
body.theme-dark .login-card .q-box {
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.18), rgba(255, 107, 157, 0.08));
  border-color: #b83280;
}
body.theme-dark .login-card .q-box b {
  color: #fbcfe8;
}
body.theme-dark .login-card .steps .step span {
  color: #94a3b8;
}
body.theme-dark .login-card .steps .step .dot {
  background-color: #242e40;
  color: #94a3b8;
}
body.theme-dark .login-card .steps .step.active span {
  color: #fbcfe8;
}
body.theme-dark .login-card .steps .step.done span {
  color: #68d391;
}
body.theme-dark .login-card .steps .step-line {
  background-color: #242e40;
}
body.theme-dark .login-card .eye {
  color: #94a3b8;
}
body.theme-dark .login-card .eye:hover {
  color: #fbcfe8;
}
body.theme-dark .login-card .links a {
  color: #fbcfe8;
}
body.theme-dark .login-card select.input {
  background-color: #242e40;
}
body.theme-dark .login-card select.input option {
  background-color: #242e40;
  color: #f1f5f9;
}
body.theme-dark .login-card .select-arrow {
  color: #94a3b8;
}

/* 顶部主题切换器 positioning */
.theme-switcher-top {
  position: fixed;
  top: 18px;
  right: 22px;
  z-index: 20;
}
</style>

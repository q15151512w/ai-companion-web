import { defineStore } from 'pinia';
import {
  login as apiLogin,
  register as apiRegister,
  getSecurityQuestion,
  verifyAnswer,
  resetPassword,
  logout as apiLogout
} from '@/api/modules/auth';
import { getItem, setItem, removeItem } from '@/utils/storage';
import { useChatStore } from './chat';
import { useCompanionStore } from './companion';

/**
 * 登录态相关常量（存储键）
 * 供 user store 与 request.js 拦截器共用，保证 key 一致。
 */
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

/**
 * 用户 Store
 * 负责：登录 / 注册 / 退出登录，以及 token 与用户信息的本地持久化。
 * 登录态通过 token 维持，退出时仅清除登录态（不影响会话等业务数据）。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    /** 访问令牌 */
    token: getItem(TOKEN_KEY, ''),
    /** 当前用户信息 { id, username } */
    userInfo: parseUser()
  }),

  getters: {
    /** 是否已登录（有无 token 判定） */
    isLoggedIn: (state) => !!state.token,
    /** 当前用户名（便捷访问） */
    username: (state) => state.userInfo?.username || ''
  },

  actions: {
    /**
     * 登录
     * @param {{ username: string, password: string }} payload
     */
    async login(payload) {
      const data = await apiLogin(payload); // { token, user }
      this.setSession(data);
    },

    /**
     * 注册并自动登录
     * @param {{ username, password, question, answer, gender? }} payload
     *        gender 可选：male-男，female-女，不传则为未设置
     */
    async register(payload) {
      const data = await apiRegister(payload); // { token, user }
      this.setSession(data);
    },

    /** 登录成功后写入 token 与用户信息（内存 + localStorage） */
    setSession({ token, user }) {
      this.token = token;
      this.userInfo = user || null;
      setItem(TOKEN_KEY, token);
      if (user) {
        setItem(USER_KEY, JSON.stringify(user));
      } else {
        removeItem(USER_KEY);
      }
    },

    /** 本地退出：清除登录态并重置业务数据（防止切换账号后旧数据短暂残留） */
    logout() {
      this.token = '';
      this.userInfo = null;
      removeItem(TOKEN_KEY);
      removeItem(USER_KEY);
      // 清空会话数据，避免下一用户看到上一用户的会话列表
      const chatStore = useChatStore();
      chatStore.reset();
      const companionStore = useCompanionStore();
      companionStore.nickName = '小甜甜';
      companionStore.nature = '活泼开朗的东北姑娘';
    },

    /**
     * 退出登录（先通知后端，再清本地登录态）
     */
    async logoutRemote() {
      try {
        await apiLogout();
      } catch (error) {
        // 即使后端注销失败也继续本地退出
        console.warn('服务端退出失败:', error);
      }
      this.logout();
    },

    /**
     * 找回密码·第一步：校验用户名并获取密保问题
     * @param {string} username
     * @returns {Promise<string>} 密保问题文本
     */
    async getSecurityQuestion(username) {
      const data = await getSecurityQuestion({ username });
      return data?.question || '';
    },

    /**
     * 找回密码·第二步：校验密保答案
     */
    async verifySecurityAnswer(username, answer) {
      await verifyAnswer({ username, answer });
    },

    /**
     * 找回密码·第三步：重置密码
     */
    async resetPassword(username, newPassword) {
      await resetPassword({ username, new_password: newPassword });
    }
  }
});

/** 从 localStorage 读取并解析用户信息（容错处理） */
function parseUser() {
  try {
    const raw = getItem(USER_KEY, null);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('解析用户信息失败:', error);
    return null;
  }
}

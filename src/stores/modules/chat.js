import { defineStore } from 'pinia';
import {
  getSessionList,
  createSession,
  getSessionDetail,
  deleteSession,
  batchDeleteSessions
} from '@/api/modules/session';
import { sendChatMessage } from '@/api/modules/chat';
import { useCompanionStore } from './companion';

/**
 * 聊天 Store
 * 负责：会话列表、当前会话、消息记录、发送消息等核心业务
 */
export const useChatStore = defineStore('chat', {
  state: () => ({
    /** 会话 id 列表 */
    sessionList: [],
    /** 当前会话 id */
    currentSession: null,
    /** 当前会话的消息列表 [{ role: 'user' | 'assistant', content: string }] */
    messages: [],
    /** 是否正在等待 AI 回复 */
    isLoading: false,
    /** 新建会话弹窗是否可见（人设在弹窗中选定） */
    showNewSessionDialog: false
  }),

  actions: {
    /**
     * 加载会话列表
     * 若当前没有激活的会话，则自动加载第一个会话
     */
    async loadSessionList() {
      try {
        const sessions = await getSessionList();
        this.sessionList = sessions || [];

        // 首次进入时自动加载第一个会话（原生逻辑：无当前会话才加载）
        if (this.sessionList.length > 0 && !this.currentSession) {
          await this.loadSession(this.sessionList[0]);
        }
      } catch (error) {
        console.error('加载会话列表失败:', error);
        this.sessionList = [];
      }
    },

    /**
     * 加载指定会话的消息与伴侣信息
     * @param {string} sessionId 会话 id
     */
    async loadSession(sessionId) {
      try {
        const data = await getSessionDetail(sessionId);
        const companionStore = useCompanionStore();

        this.currentSession = sessionId;
        this.messages = data.messages || [];
        companionStore.nickName = data.nick_name || companionStore.nickName;
        companionStore.nature = data.nature || companionStore.nature;
      } catch (error) {
        console.error('加载会话失败:', error);
      }
    },

    /**
     * 创建新会话
     * 人设由调用方（新建会话弹窗）选定，创建后不可修改。
     * @param {Object} persona 人设信息
     * @param {string} persona.nick_name 伴侣昵称
     * @param {string} persona.nature 伴侣性格
     */
    async createNewSession(persona) {
      try {
        const sessionId = await createSession({
          nick_name: persona.nick_name,
          nature: persona.nature
        });

        this.currentSession = sessionId;
        this.messages = [];

        // 同步当前会话的人设（侧栏展示区使用）
        const companionStore = useCompanionStore();
        companionStore.nickName = persona.nick_name;
        companionStore.nature = persona.nature;

        // 刷新会话列表（此时已有 currentSession，不会误触发自动加载）
        await this.loadSessionList();
      } catch (error) {
        console.error('创建会话失败:', error);
      }
    },

    /**
     * 删除会话
     * @param {string} sessionId 会话 id
     */
    async deleteSession(sessionId) {
      if (!window.confirm(`确定要删除会话 "${sessionId}" 吗？`)) return;

      try {
        await deleteSession(sessionId);

        // 删除的是当前会话：重置状态，并自动加载剩余的第一个会话
        if (sessionId === this.currentSession) {
          this.currentSession = null;
          this.messages = [];

          const sessions = await getSessionList();
          if (sessions && sessions.length > 0) {
            await this.loadSession(sessions[0]);
          }
          this.sessionList = sessions || [];
        } else {
          // 删除的不是当前会话：仅刷新列表
          await this.loadSessionList();
        }
      } catch (error) {
        console.error('删除会话失败:', error);
      }
    },

    /**
     * 批量删除会话
     * @param {string[]} sessionIds 待删除的会话 id 数组
     * @returns {Promise<boolean>} 删除成功返回 true；取消弹窗或失败返回 false
     */
    async batchDeleteSessions(sessionIds) {
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) return false;
      if (!window.confirm(`确定要删除选中的 ${sessionIds.length} 个会话吗？`)) return false;

      try {
        await batchDeleteSessions(sessionIds);

        // 若当前会话被删除，重置状态并自动加载剩余的第一个会话
        if (sessionIds.includes(this.currentSession)) {
          this.currentSession = null;
          this.messages = [];

          const sessions = await getSessionList();
          if (sessions && sessions.length > 0) {
            await this.loadSession(sessions[0]);
          }
          this.sessionList = sessions || [];
        } else {
          // 仅刷新列表
          await this.loadSessionList();
        }
        return true;
      } catch (error) {
        console.error('批量删除会话失败:', error);
        return false;
      }
    },

    /**
     * 重置所有会话状态（退出登录 / 切换账号时调用，防止旧数据短暂泄露）
     */
    reset() {
      this.sessionList = [];
      this.currentSession = null;
      this.messages = [];
      this.isLoading = false;
      this.showNewSessionDialog = false;
    },

    /**
     * 发送消息给 AI 伴侣
     * @param {string} text 用户输入的消息内容
     */
    async sendMessage(text) {
      this.isLoading = true;
      // 先展示用户消息，再请求 AI 回复
      this.messages.push({ role: 'user', content: text });

      try {
        // 人设由后端从会话文件读取，发送消息时无需（也不允许）再传昵称/性格
        const reply = await sendChatMessage({
          session_name: this.currentSession,
          message: text
        });

        this.messages.push({ role: 'assistant', content: reply });
      } catch (error) {
        console.error('发送消息失败:', error);
        // 请求失败时移除刚添加的用户消息（与原生逻辑一致）
        this.messages.pop();
      } finally {
        this.isLoading = false;
      }
    }
  }
});

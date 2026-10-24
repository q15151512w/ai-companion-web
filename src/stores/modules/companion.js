import { defineStore } from 'pinia';
import { getPresetList, createPreset, deletePreset } from '@/api/modules/preset';
import { useUserStore } from './user';

/**
 * 伴侣信息 Store
 * 负责：当前会话的人设（昵称、性格）展示，以及预设列表的加载与展示。
 * 预设展示支持按用户异性偏好过滤：男用户默认只显示女性预设，女用户默认只显示男性预设，
 * 并提供一个「显示全部」开关切换回所有预设。
 * 人设由创建会话时确定，创建后不可修改，因此不再提供人设切换逻辑。
 */
export const useCompanionStore = defineStore('companion', {
  state: () => ({
    /** 当前昵称 */
    nickName: '小甜甜',
    /** 当前性格 */
    nature: '活泼开朗的东北姑娘',
    /** 预设列表（全量，由后端返回，含 gender 字段） */
    presets: [],
    /** 是否展示所有预设（true=显示全部；false=按异性偏好过滤） */
    showAllPresets: false,
    /** 预设列表是否加载失败（用于界面显示"加载失败"） */
    presetsError: false
  }),

  getters: {
    /**
     * 展示给用户的预设列表：
     * - 若 showAllPresets 为 true → 返回全部
     * - 否则按当前用户性别过滤（异性优先）：男用户看女性预设、女用户看男性预设
     * - 用户性别为空（未设置）→ 视为「未知」，直接返回全部（兜底）
     */
    visiblePresets: (state) => {
      if (state.showAllPresets || !state.presets.length) return state.presets;
      const gender = useUserStore().userInfo?.gender;
      // 未设置性别 → 显示全部
      if (!gender) return state.presets;
      const target = gender === 'male' ? 'female' : 'male';
      return state.presets.filter((p) => p.gender === target);
    }
  },

  actions: {
    /**
     * 加载预设列表
     */
    async loadPresets() {
      try {
        this.presetsError = false;
        this.presets = await getPresetList();
      } catch (error) {
        console.error('加载预设列表失败:', error);
        this.presets = [];
        this.presetsError = true;
      }
    },

    /**
     * 切换「显示全部 / 按性别推荐」开关
     */
    toggleShowAll() {
      this.showAllPresets = !this.showAllPresets;
    },

    /**
     * 新增自定义预设（归属当前用户）
     * @param {Object} persona 预设法信息
     * @param {string} persona.name 预设名称
     * @param {string} persona.nick_name 伴侣昵称
     * @param {string} persona.nature 伴侣性格
     * @param {string} [persona.gender] 伴侣性别
     * 创建成功后重新加载预设列表
     */
    async createPreset(persona) {
      try {
        await createPreset(persona);
        await this.loadPresets();
      } catch (error) {
        console.error('新增预设失败:', error);
        throw error;
      }
    },

    /**
     * 删除自定义预设（仅当前用户自定义预设可删）
     * @param {string|number} id 待删除的预设 id
     * 删除成功后重新加载预设列表
     */
    async deletePreset(id) {
      try {
        await deletePreset(id);
        await this.loadPresets();
      } catch (error) {
        console.error('删除预设失败:', error);
        throw error;
      }
    }
  }
});

import request from '@/api/request';

/**
 * 预设相关接口
 */

/**
 * 获取伴侣预设列表（系统内置 + 当前用户自定义）
 * @returns {Promise<Array<{ id: string|number, name: string, nick_name: string, nature: string, gender?: string }>>}
 *          预设数组
 */
export function getPresetList() {
  return request.get('/presets');
}

/**
 * 新增自定义预设（归属当前用户）
 * @param {Object} data 请求体
 * @param {string} data.name 预设名称
 * @param {string} data.nick_name 伴侣昵称
 * @param {string} data.nature 伴侣性格
 * @param {string} [data.gender] 伴侣性别：male-男，female-女（可空）
 * @returns {Promise<Object>} 新建的预设对象
 */
export function createPreset(data) {
  return request.post('/presets', data);
}

/**
 * 删除自定义预设（仅当前用户自定义预设允许删除）
 * @param {string|number} id 预设 id
 * @returns {Promise<Object>} 删除结果
 */
export function deletePreset(id) {
  return request.delete(`/presets/${id}`);
}

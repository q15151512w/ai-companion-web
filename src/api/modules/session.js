import request from '@/api/request';

/**
 * 会话相关接口
 */

/**
 * 获取会话 id 列表
 * @returns {Promise<string[]>} 会话 id 数组
 */
export function getSessionList() {
  return request.get('/sessions');
}

/**
 * 创建新会话
 * @param {Object} data 请求体
 * @param {string} data.nick_name 伴侣昵称
 * @param {string} data.nature 伴侣性格
 * @returns {Promise<string>} 新会话 id
 */
export function createSession(data) {
  return request.post('/sessions', data);
}

/**
 * 获取会话详情
 * @param {string} sessionId 会话 id
 * @returns {Promise<{ messages: Array, nick_name: string, nature: string }>} 会话详情
 */
export function getSessionDetail(sessionId) {
  return request.get(`/sessions/${sessionId}`);
}

/**
 * 删除会话
 * @param {string} sessionId 会话 id
 */
export function deleteSession(sessionId) {
  return request.delete(`/sessions/${sessionId}`);
}

/**
 * 批量删除会话
 * @param {string[]} sessionIds 待删除的会话 id 数组
 * @returns {Promise<{ deleted: string[], not_found: string[] }>} 删除结果
 */
export function batchDeleteSessions(sessionIds) {
  return request.delete('/sessions', { data: { session_names: sessionIds } });
}

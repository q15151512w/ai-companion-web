import request from '@/api/request';

/**
 * 聊天相关接口
 */

/**
 * 发送消息给 AI 伴侣
 * @param {Object} data 请求体
 * @param {string} data.session_name 会话 id（服务端据此自动加载聊天记录并保存）
 * @param {string} data.message 用户消息内容
 * @returns {Promise<string>} AI 回复内容
 *
 * 注意：人设（昵称/性格）由创建会话时确定，后端只认会话文件里存的人设，
 * 因此发送消息时不再传递 nick_name / nature。
 */
export function sendChatMessage(data) {
  return request.post('/chat', data);
}

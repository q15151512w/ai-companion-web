import request from '@/api/request';

/**
 * 用户认证相关接口
 * 登录态采用 Token 鉴权：登录/注册成功后端返回 token，前端存储后由
 * 请求拦截器统一携带在 Authorization 头中（见 request.js）。
 */

/**
 * 注册账号（注册成功即自动登录，返回 token 与用户信息）
 * @param {Object} data
 * @param {string} data.username 用户名
 * @param {string} data.password 密码（6-20位，需含字母和数字）
 * @param {string} data.question 密保问题
 * @param {string} data.answer 密保答案
 * @returns {Promise<{ token: string, user: { id: number, username: string } }>}
 */
export function register(data) {
  return request.post('/auth/register', data);
}

/**
 * 账号登录
 * @param {Object} data
 * @param {string} data.username 用户名
 * @param {string} data.password 密码
 * @returns {Promise<{ token: string, user: { id: number, username: string } }>}
 */
export function login(data) {
  return request.post('/auth/login', data);
}

/**
 * 找回密码·第一步：校验用户名存在，并返回其密保问题
 * @param {Object} data
 * @param {string} data.username 用户名
 * @returns {Promise<{ question: string }>} 密保问题文本
 */
export function getSecurityQuestion(data) {
  return request.post('/auth/question', data);
}

/**
 * 找回密码·第二步：校验密保答案
 * @param {Object} data
 * @param {string} data.username 用户名
 * @param {string} data.answer 密保答案
 * @returns {Promise<null>} 校验通过即 code 200
 */
export function verifyAnswer(data) {
  return request.post('/auth/check-answer', data);
}

/**
 * 找回密码·第三步：重置密码
 * @param {Object} data
 * @param {string} data.username 用户名
 * @param {string} data.new_password 新密码
 * @returns {Promise<null>} 重置成功即 code 200
 */
export function resetPassword(data) {
  return request.post('/auth/reset-password', data);
}

/**
 * 检查用户名是否可用（注册页实时校验）
 * @param {string} username 待检查的用户名
 * @returns {Promise<{ username: string, available: boolean }>}
 */
export function checkUsername(username) {
  return request.get('/auth/check-username', { params: { username } });
}

/**
 * 退出登录（可选：通知后端失效当前 token）
 */
export function logout() {
  return request.post('/auth/logout');
}

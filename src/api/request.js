import axios from 'axios';
import { getItem, removeItem } from '@/utils/storage';

/**
 * 统一请求封装
 * - 集中处理接口基础地址、超时时间
 * - 请求拦截器统一携带 Token（登录态鉴权）
 * - 响应拦截器统一解包后端返回结构 { code, message, data }
 * - 统一错误提示（网络异常 / 业务错误），调用方无需重复处理
 */

// 登录态存储键（需与 stores/modules/user.js 保持一致）
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * 认证相关接口路径（登录 / 注册 / 找回密码）
 * 这些接口的错误由表单页行内展示（红字提示），不走全局 alert，也不清登录态。
 */
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/question',
  '/auth/check-answer',
  '/auth/reset-password'
];

/** 判断请求是否为认证接口 */
function isAuthRequest(config) {
  const url = config?.url || '';
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

// 创建 axios 实例
const request = axios.create({
  // 接口基础地址，由环境变量控制（见 .env.* 文件）
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  // 请求超时时间（毫秒）
  timeout: 30000
});

// 请求拦截器：统一携带 Token（Authorization: Bearer <token>）
request.interceptors.request.use(
  (config) => {
    const token = getItem(TOKEN_KEY, '');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一解包与错误处理
request.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 后端约定：code === 200 表示成功，其余视为业务错误
    if (res.code !== 200) {
      // 统一提示后端返回的错误信息；silent 请求（如项目介绍兜底）静默不弹
      if (!response.config?.silent) {
        window.alert(res.message || '请求失败，请重试');
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    }

    // 成功时直接返回业务数据（data 字段），调用方无需再解包
    return res.data;
  },
  (error) => {
    const status = error.response?.status;
    const authRequest = isAuthRequest(error.config);

    // 认证接口的错误（401 用户名或密码错误 / 404 用户名不存在 / 409 用户名已注册等）：
    // 不弹 alert、不清登录态，由登录/注册/找回密码表单行内红字展示
    if (authRequest) {
      return Promise.reject(error);
    }

    // 未登录 / 令牌过期：清除本地登录态并跳回登录页
    if (status === 401) {
      removeItem(TOKEN_KEY);
      removeItem(USER_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    // 网络错误 / 超时等统一处理；silent 请求静默不弹
    const message = error.response?.data?.message || error.message || '网络异常，请稍后重试';
    if (!error.config?.silent) {
      window.alert(message);
    }
    return Promise.reject(error);
  }
);

export default request;

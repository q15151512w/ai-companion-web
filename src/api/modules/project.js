import request from '@/api/request';

/**
 * 项目介绍相关接口（REQ-06 项目介绍动态化）
 * 无需认证，主页右侧栏每次进入实时请求，不做本地缓存。
 */

/**
 * 获取项目介绍内容
 * @returns {Promise<Array<{ id: number, icon: string, title: string, content_type: 'paragraph'|'list', content: string }>>}
 * 按后端返回顺序渲染；data 为空或请求失败时由调用方使用内置默认文案兜底。
 */
export function getProjectInfo() {
  // silent：请求失败时由调用方用内置默认文案兜底，全局拦截器不弹错误提示
  return request.get('/project-info', { silent: true });
}
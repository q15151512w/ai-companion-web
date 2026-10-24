import { createRouter, createWebHistory } from 'vue-router';
import { getItem } from '@/utils/storage';

/**
 * 路由配置
 * - 使用 History 模式（生产环境需在 Nginx 中配置 try_files 支持，见 README）
 * - 路由组件使用懒加载，按需分包
 * - 登录校验：/ 需登录，未登录跳转 /login；已登录访问 /login 则回到主页
 */

// 登录态存储键（需与 stores/modules/user.js 保持一致）
const TOKEN_KEY = 'token';

const routes = [
  {
    path: '/login',
    name: 'login',
    // 登录页（登录 / 注册 / 找回密码）
    component: () => import('@/views/login/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    name: 'chat',
    // 路由懒加载：ChatLayout 为三栏应用外壳
    component: () => import('@/layout/ChatLayout.vue'),
    meta: { title: 'AI智能伴侣', requiresAuth: true }
  },
  // 兜底路由：未匹配的路径重定向到首页
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫：登录态校验（对齐接口文档 §2.6）
router.beforeEach((to, from, next) => {
  // 登录态存储键（需与 stores/modules/user.js 保持一致）
  const token = getItem(TOKEN_KEY, '');

  // 访问登录页：已登录则直接进聊天主页，未登录放行
  if (to.path === '/login') {
    if (token) return next('/');
    return next();
  }

  // 访问其他页面：未登录跳登录页
  if (!token) return next('/login');

  next();
});

// 全局后置守卫：根据路由 meta 同步页面标题
router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
});

export default router;

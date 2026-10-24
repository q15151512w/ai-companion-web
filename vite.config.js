import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite 配置
 * 文档：https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  // 加载当前模式（development / production）下的 .env 变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue()],

    resolve: {
      // 路径别名：@ 指向 src 目录，避免深层相对路径
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    server: {
      // 开发服务器端口
      port: 5173,
      // 开发环境代理：将 /api移除 开头的请求转发到后端服务，解决跨域
      // 后端地址可通过 .env.development 的 VITE_BACKEND_URL 配置
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };
});

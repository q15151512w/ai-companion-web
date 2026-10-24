import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './stores';

// 全局样式（由原项目 style.css 迁移而来，保持视觉完全一致）
import '@/assets/styles/index.scss';

const app = createApp(App);

// 注册 Pinia 状态管理
app.use(pinia);
// 注册 Vue Router 路由
app.use(router);

app.mount('#app');

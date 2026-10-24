// 统一创建并导出 Pinia 实例，供 main.js 注册使用
// 若需在组件外（如 API 模块、工具函数）访问 store，可 import 本文件中的 pinia
import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

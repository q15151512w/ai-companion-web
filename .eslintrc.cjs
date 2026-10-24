/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    // Vue3 官方推荐规则
    'plugin:vue/vue3-recommended',
    // ESLint 内置推荐规则
    'eslint:recommended',
    // 关闭与 Prettier 冲突的格式化规则（格式化统一交给 Prettier）
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // 开发期保留 console 便于调试，生产环境建议开启警告
    'no-console': 'off',
    // 根组件 App 为单单词，关闭多单词组件命名限制
    'vue/multi-word-component-names': 'off'
  }
}

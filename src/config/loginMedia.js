/**
 * 登录页 / 聊天页动态背景素材配置
 *
 * 加载优先级：本地物料包（public/materials/login/）→ 阿里云 OSS 直链 → 内置 CSS 渐变
 * - local：本地视频（mp4 / webm，放 public/materials/login/ 下，文件名见目录内 README）
 * - localImage：本地动图兜底（gif / webp / apng，视频缺失或加载失败时以 <img> 显示）
 * - video：阿里云 OSS 直链（旧素材，链接已过期，保留作最后兜底，可随时清空）
 *
 * 注意：本地文件扩展名与下方配置不一致时（如 light.webm），改这里的 local 字段即可；
 * 开发模式下放好文件刷新页面即生效，生产部署需重新构建（或将文件放入部署目录的 materials/login/）。
 */
export const LOGIN_MEDIA = {
  /** 默认主题 */
  light: {
    local: '/materials/login/light.mp4',
    localImage: '/materials/login/light.gif',
    video: 'https://apengjiang.oss-cn-chengdu.aliyuncs.com/dawn.mp4'
  },
  /** 黎明主题（剑光） */
  dawn: {
    local: '/materials/login/dawn.mp4',
    localImage: '/materials/login/dawn.gif',
    video:
      'https://apengjiang.oss-cn-chengdu.aliyuncs.com/%E3%80%90%E5%93%B2%E9%A3%8E%E5%A3%81%E7%BA%B8%E3%80%91%E4%BA%8C%E6%AC%A1%E5%85%83%E5%B0%91%E5%A5%B3-%E5%89%91%E5%85%89.mp4'
  },
  /** 黑夜主题（剑客） */
  dark: {
    local: '/materials/login/dark.mp4',
    localImage: '/materials/login/dark.gif',
    video:
      'https://apengjiang.oss-cn-chengdu.aliyuncs.com/%E3%80%90%E5%93%B2%E9%A3%8E%E5%A3%81%E7%BA%B8%E3%80%91%E5%89%91-%E5%89%91%E5%AE%A2-%E5%A5%BD%E7%9C%8B.mp4'
  },
  /** 国风限定·武侠主题（不良人·仙侠红） */
  wuxia: {
    local: '/materials/login/wuxia.mp4',
    localImage: '/materials/login/wuxia.gif',
    video:
      'https://apengjiang.oss-cn-chengdu.aliyuncs.com/%E3%80%90%E5%93%B2%E9%A3%8E%E5%A3%81%E7%BA%B8%E3%80%91grill-%E4%B8%8D%E8%89%AF%E4%BA%BA.mp4'
  }
};

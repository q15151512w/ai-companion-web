/**
 * localStorage 封装
 * 提供统一的读取 / 写入方法，并对异常做了容错处理
 */

/**
 * 读取本地存储
 * @param {string} key 存储键
 * @param {*} defaultValue 默认值（键不存在或读取失败时返回）
 * @returns {*} 存储值
 */
export function getItem(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? defaultValue : value;
  } catch (error) {
    console.warn('读取本地存储失败:', error);
    return defaultValue;
  }
}

/**
 * 写入本地存储
 * @param {string} key 存储键
 * @param {*} value 存储值（会转为字符串）
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('写入本地存储失败:', error);
  }
}

/**
 * 移除本地存储项
 * @param {string} key 存储键
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('移除本地存储失败:', error);
  }
}

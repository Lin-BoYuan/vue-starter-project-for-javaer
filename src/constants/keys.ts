/**
 * 📖 配套教程：docs/06-components-communication.md（provide/inject 一节）
 * provide/inject 的注入 key。
 *
 * 为什么用 Symbol 且放在公共模块？因为 Symbol('theme') 每次调用都会生成一个
 * 全局唯一的值——provide 和 inject 必须拿到【同一个】key 才能配对。
 * 所以把 key 定义在一个模块里，两边都 import 它（这也顺便说明了 import 的意义：
 * 模块代码只会执行一次，导出值被所有引用方共享）。
 */
export const THEME_KEY = Symbol('theme')

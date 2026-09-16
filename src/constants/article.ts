/**
 * 📖 配套教程：docs/03-typescript-for-java.md（as const 一节）
 * 文章分类常量。
 *
 * `as const`（const 断言）：把数组锁成"只读字面量元组"，
 * 配合 typeof[number] 还能反推出联合类型——比 Java 的 String[] 常量类强得多。
 *
 * const ARTICLE_CATEGORIES = ['前端', '后端', ...] as const
 * type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]  // '前端' | '后端' | ...
 */
export const ARTICLE_CATEGORIES = ['前端', '后端', '数据库', '随笔'] as const

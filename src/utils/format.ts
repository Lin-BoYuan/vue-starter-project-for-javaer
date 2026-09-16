/**
 * 📖 配套教程：docs/05-composition-api.md（在 computed 中使用的工具函数）
 * 格式化工具：没有引第三方库（如 dayjs），让读者看清底层写法；
 * 真实项目里通常会用 dayjs 这类成熟库。
 */

/**
 * 把 ISO 时间字符串格式化为 "2026-09-16 10:30"。
 * ☕ Java 视角：相当于 DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")，
 * 注意 JS 的月份是 0~11，所以 getMonth() 要 +1（经典大坑）。
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-' // 非法时间兜底
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

/** 数字加千分位：12345 -> "12,345"（相当于 Java 的 String.format("%,d", n)） */
export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

/**
 * 📖 配套教程：docs/06-components-communication.md（组合式函数一节）、docs/10-patterns.md（分页一节）
 * usePagination：分页三件套状态（页码/每页条数/总数）。
 * 只管"状态"，不管"怎么请求"——请求逻辑留在页面里，一眼能看懂数据流。
 */
import { ref } from 'vue'

export function usePagination(defaultPageSize = 10) {
  const page = ref(1)
  const pageSize = ref(defaultPageSize)
  const total = ref(0)

  /** 搜索条件变化时调用：回到第 1 页重新查 */
  function reset(): void {
    page.value = 1
  }

  return { page, pageSize, total, reset }
}

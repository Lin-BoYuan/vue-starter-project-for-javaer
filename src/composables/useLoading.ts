/**
 * 📖 配套教程：docs/06-components-communication.md（组合式函数一节）
 * useLoading：把"加载中"状态和异步操作绑在一起的组合式函数（composable）。
 *
 * ☕ Java 视角：composable ≈ 一个可复用的工具组件/切面——
 *   谁调用 useLoading()，谁就获得一套独立的 loading 状态（类似 new 一个实例）。
 * 用法：
 *   const { loading, run } = useLoading()
 *   const data = await run(() => getUserPage(query))
 */
import { ref } from 'vue'

export function useLoading(initial = false) {
  const loading = ref(initial)

  /**
   * 执行异步函数：执行期间 loading = true，无论成功失败结束后都恢复 false。
   * 错误不在这里吞掉，而是继续往外抛，由调用方决定怎么提示用户（见 docs/10-patterns.md）。
   */
  async function run<T>(task: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await task()
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}

/**
 * 📖 配套教程：docs/09-http.md
 * 仪表盘统计 API。
 */
import type { DashboardStats } from '@/types/models'
import { request } from './http'

/** 获取仪表盘统计数据：GET /api/dashboard/stats */
export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>({ url: '/dashboard/stats', method: 'get' })
}

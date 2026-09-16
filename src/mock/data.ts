/**
 * 📖 配套教程：docs/09-http.md
 * 模拟后端的"数据库"：种子数据 + localStorage 持久化。
 *
 * ☕ Java 视角：这个文件相当于数据库里的初始数据（data.sql）+ 一张内存表。
 * 真实项目中这些数据在 MySQL 里；前端一般不持有数据库，
 * 这里只是为了让你不启动后端也能完整体验 CRUD。
 */
import type { Article, UserAccount } from '@/types/models'

interface MockDb {
  users: UserAccount[]
  articles: Article[]
  /** token -> userId 的会话表（真实系统里对应 Redis/数据库里的 session 或 JWT） */
  sessions: Record<string, number>
  /** 自增主键（真实数据库里通常是 AUTO_INCREMENT） */
  nextUserId: number
  nextArticleId: number
}

const STORAGE_KEY = 'mock-db'

/** 生成 n 天前的 ISO 时间字符串，让演示数据的时间戳看起来比较"新" */
function daysAgo(n: number, hour = 9): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, n % 60, 0, 0)
  return d.toISOString()
}

/** 种子数据：第一次打开项目时初始化进 localStorage */
function createSeedDb(): MockDb {
  const users: UserAccount[] = [
    {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      email: 'admin@example.com',
      role: 'admin',
      status: 1,
      createdAt: daysAgo(180),
    },
    {
      id: 2,
      username: 'zhangsan',
      nickname: '张三',
      email: 'zhangsan@example.com',
      role: 'editor',
      status: 1,
      createdAt: daysAgo(160),
    },
    {
      id: 3,
      username: 'lisi',
      nickname: '李四',
      email: 'lisi@example.com',
      role: 'editor',
      status: 1,
      createdAt: daysAgo(120),
    },
    {
      id: 4,
      username: 'wangwu',
      nickname: '王五',
      email: 'wangwu@example.com',
      role: 'editor',
      status: 0,
      createdAt: daysAgo(90),
    },
    {
      id: 5,
      username: 'zhaoliu',
      nickname: '赵六',
      email: 'zhaoliu@example.com',
      role: 'editor',
      status: 1,
      createdAt: daysAgo(60),
    },
    {
      id: 6,
      username: 'sunqi',
      nickname: '孙七',
      email: 'sunqi@example.com',
      role: 'editor',
      status: 0,
      createdAt: daysAgo(30),
    },
    {
      id: 7,
      username: 'zhouba',
      nickname: '周八',
      email: 'zhouba@example.com',
      role: 'admin',
      status: 1,
      createdAt: daysAgo(20),
    },
    {
      id: 8,
      username: 'wujiu',
      nickname: '吴九',
      email: 'wujiu@example.com',
      role: 'editor',
      status: 1,
      createdAt: daysAgo(10),
    },
  ]

  const articles: Article[] = [
    {
      id: 1,
      title: 'Vue3 组合式 API 入门',
      summary: 'ref、reactive、computed 一文讲透。',
      content: '（正文内容……）',
      category: '前端',
      status: 'published',
      views: 1024,
      createdAt: daysAgo(150),
    },
    {
      id: 2,
      title: 'Spring Boot 常用注解速查',
      summary: '@Component、@Bean、@Autowired 的区别。',
      content: '（正文内容……）',
      category: '后端',
      status: 'published',
      views: 2048,
      createdAt: daysAgo(120),
    },
    {
      id: 3,
      title: 'MySQL 索引优化实战',
      summary: '从 EXPLAIN 开始排查慢查询。',
      content: '（正文内容……）',
      category: '数据库',
      status: 'published',
      views: 866,
      createdAt: daysAgo(95),
    },
    {
      id: 4,
      title: 'TypeScript 类型体操入门',
      summary: 'Partial、Pick、Omit 到底怎么用。',
      content: '（正文内容……）',
      category: '前端',
      status: 'published',
      views: 1580,
      createdAt: daysAgo(75),
    },
    {
      id: 5,
      title: 'Redis 缓存穿透与雪崩',
      summary: '高并发下的缓存三大经典问题。',
      content: '（正文内容……）',
      category: '数据库',
      status: 'published',
      views: 990,
      createdAt: daysAgo(50),
    },
    {
      id: 6,
      title: 'Vite 为什么快',
      summary: '按需编译与原生 ESM 的秘密。',
      content: '（正文内容……）',
      category: '前端',
      status: 'draft',
      views: 0,
      createdAt: daysAgo(30),
    },
    {
      id: 7,
      title: 'Docker 部署 Spring Boot',
      summary: '从 Dockerfile 到 docker-compose。',
      content: '（正文内容……）',
      category: '后端',
      status: 'published',
      views: 1320,
      createdAt: daysAgo(12),
    },
    {
      id: 8,
      title: '前端如何优雅地对接后端接口',
      summary: 'axios 封装、拦截器与统一错误处理。',
      content: '（正文内容……）',
      category: '前端',
      status: 'draft',
      views: 0,
      createdAt: daysAgo(3),
    },
  ]

  return { users, articles, sessions: {}, nextUserId: 9, nextArticleId: 9 }
}

/** 从 localStorage 加载；第一次访问或数据损坏时用种子数据兜底 */
function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockDb
  } catch {
    // 数据损坏则重新播种
  }
  const seed = createSeedDb()
  saveDb(seed)
  return seed
}

function saveDb(db: MockDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

/** 全局唯一的"数据库实例"（模块级单例：整个应用共用一份） */
export const db = loadDb()

/** 供"个人设置"页调用的重置按钮：清空所有演示改动，恢复种子数据 */
export function resetMockDb(): void {
  const seed = createSeedDb()
  Object.assign(db, seed)
  saveDb(db)
}

/** 保存（每个写操作后调用一次，等价于事务提交 commit） */
export function flushDb(): void {
  saveDb(db)
}

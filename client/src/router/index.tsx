import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { lazyLoad } from './lazy';

/**
 * 全局路由表（唯一定义处）。
 * 新增页面步骤：
 *   1) 在 src/pages/<module>/ 建 index.tsx（默认导出页面组件）；
 *   2) 在下方 children 中追加一行 { path, element: lazyLoad(...) }。
 * 跳转/兜底等业务逻辑内聚在各页面组件内部，本表只做「路径 → 组件」映射。
 */
export function routerConfig(): RouteObject[] {
  return [
    {
      path: '/',
      children: [
        // 首页索引：由 IndexPage 组件内部重定向到 /chat
        { index: true, element: lazyLoad(() => import('../pages')) },
        // AI 会话
        { path: 'chat', element: lazyLoad(() => import('../pages/chat')) },
        // 工单
        { path: 'work-order', element: lazyLoad(() => import('../pages/work-order')) },
        // 表单列表
        { path: 'form-list', element: lazyLoad(() => import('../pages/form-list')) },
        // 我要反馈
        { path: 'feedback', element: lazyLoad(() => import('../pages/feedback')) },
        // 未匹配路由兜底：复用 IndexPage 重定向回 /chat
        { path: '*', element: lazyLoad(() => import('../pages')) },
      ],
    },
  ];
}

/** 路由实例（history 模式） */
export const router = createBrowserRouter(routerConfig());

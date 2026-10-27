import React, {
  Suspense,
  type FunctionComponent,
  type LazyExoticComponent,
} from 'react';
import { Spin } from 'antd';

/**
 * 路由懒加载公共工具。
 * 单独成文件（不放进 router/index.tsx），避免各模块 routes 反向引用根路由造成循环依赖。
 */

/** 统一的 Suspense 加载态包装器 */
export function LoadingComponent({
  element,
}: {
  element: LazyExoticComponent<FunctionComponent>;
}) {
  const Component = element;
  return (
    <Suspense
      fallback={
        <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
          <Spin size="large" />
          <span className="text-sm">页面加载中…</span>
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

/**
 * 一行生成「懒加载 + Suspense」的路由 element。
 * 用法：{ path: 'chat', element: lazyLoad(() => import('./index')) }
 */
export function lazyLoad(factory: () => Promise<{ default: FunctionComponent }>) {
  return <LoadingComponent element={React.lazy(factory)} />;
}

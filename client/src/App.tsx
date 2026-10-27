import { RouterProvider } from 'react-router-dom';
import { router } from './router';

/**
 * 应用入口：只挂载路由实例，不含任何业务逻辑。
 * 路由表与懒加载配置见 src/router.tsx，页面实现见 src/pages/*。
 */
export default function App() {
  return <RouterProvider router={router} />;
}

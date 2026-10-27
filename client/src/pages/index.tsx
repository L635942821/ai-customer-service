import { Navigate } from 'react-router-dom';

/**
 * 首页索引页：本站主界面即 AI 会话页，故直接重定向到 /chat。
 * 跳转逻辑内聚在页面组件内部，使路由表（router.tsx）保持纯声明式映射。
 */
export default function IndexPage() {
  return <Navigate to="/chat" replace />;
}

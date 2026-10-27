import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Requests from './request';
import './index.scss';

// 请求层初始化：基地址（Vite 已代理 /api → server）+ 运行模式
Requests.init({ dataService: '/api' });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

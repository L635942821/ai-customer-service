import { defineConfig, loadEnv, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

/**
 * Vite 配置
 * - 环境配置：loadEnv 读取 .env.[mode]，通过 define 注入前端全局常量
 * - 服务配置：host/port/open + /api 代理到后端（默认 :3001）
 * - CSS 框架：Tailwind CSS（通过 postcss.config.js 生效）
 * - 打包 & 图片处理：手动分包、小图片内联为 base64、图片资源命名归类
 * - 产物压缩：同时生成 gzip 与 brotli 压缩文件，利于线上直出
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:3001';

  const plugins: PluginOption[] = [
    react(),
    // gzip 压缩产物（.gz）
    viteCompression({
      ext: '.gz',
      algorithm: 'gzip',
      threshold: 10240, // 大于 10KB 才压缩
      deleteOriginFile: false,
    }),
    // brotli 压缩产物（.br），压缩率更高
    viteCompression({
      ext: '.br',
      algorithm: 'brotliCompress',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ];

  return {
    plugins,
    // 注入到前端的环境变量（以 VITE_ 开头自动暴露，这里再补充运行期常量）
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version ?? '1.0.0'),
    },
    server: {
      host: true, // 允许局域网访问
      port: Number(env.VITE_PORT ?? 5173),
      open: false,
      proxy: {
        // 前端所有 /api 请求转发到后端，规避跨域
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // 小于 4KB 的图片/资源内联为 base64，减少请求数
      assetsInlineLimit: 4096,
      // 图片等静态资源单独归类命名，便于 CDN 缓存
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? '';
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(name)) {
              return 'assets/img/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
              return 'assets/font/[name]-[hash][extname]';
            }
            if (/\.css$/i.test(name)) {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          // 手动分包：把体积较大的第三方库拆出来，利用浏览器缓存
          manualChunks: {
            react: ['react', 'react-dom'],
            markdown: ['react-markdown', 'remark-gfm'],
          },
        },
      },
      // 生产环境移除 console/debugger
      minify: 'esbuild',
      cssMinify: true,
      chunkSizeWarningLimit: 1000,
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // website/api는 CORS 헤더를 안 내려주므로, 로컬 개발 중엔 Vite dev 서버가 /api를
  // 백엔드로 프록시해서 브라우저 입장에서 same-origin으로 보이게 한다.
  // (배포 후에는 vercel.json의 rewrite가 같은 역할을 한다 — README 참고.)
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.API_PROXY_TARGET;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: proxyTarget
        ? {
            '/api': { target: proxyTarget, changeOrigin: true },
          }
        : undefined,
    },
  };
});

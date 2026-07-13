import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: true, // LAN의 다른 기기(모바일 실기기)에서 접속 가능하게 노출

    // [dev server proxy] 브라우저가 백엔드로 직접 요청 : 모바일 LAN 접속 시 CORS 에러 발생
    // 브라우저 : Vite 서버에 요청 <-> Vite(Node) 서버 : 실제 백엔드 전달은 가 대신 처리 
    // 개발서버에서만 동작
    proxy: {
      // '/api'로 시작하는 REST 요청을 백엔드로 전달 (localhost:5173/api ~ -> https://api.camnect.site/api ~)
      '/api': {
        target: 'https://api.camnect.site',
        changeOrigin: true, // 백엔드로 나가는 요청의 Host 헤더를 target 기준으로 변경
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // [dev proxy] 백엔드가 모바일 LAN Origin/Referer를 거절하여 403 발생
            // Vite가 백엔드로 전달할 때 브라우저 출처 헤더 제거
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
      // STOMP/WebSocket 경로 전달 (VITE_SOCKET_URL의 경로와 일치)
      '/ws-stomp': {
        target: 'https://api.camnect.site',
        changeOrigin: true,
        ws: true, // WebSocket 프로토콜 업그레이드 프록시 지원
      },
    },
  },
})

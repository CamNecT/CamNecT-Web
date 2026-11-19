// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router';
import { queryClient } from './api/queryClient';
import './styles/global.css'

// Service Worker 등록 (브라우저 실행 시) -> 푸시알림 받기 위해
if (window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker 등록 성공', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker 등록 실패:', error);
      });
  })
}

// StrictMode는 개발 중 Effect의 설정/정리를 추가 실행해 부수효과 문제를 찾는다.
// 현재는 useStompChat 정리 단계가 /leave를 보내 미읽음 구분선이 사라지므로 비활성화
// 다시 켤 조건: 구독 재설정 중에는 /leave가 전송되지 않고, 미읽음 구분선이 유지되며,
// 실제 채팅방 이탈 시에만 /leave가 전송되는 것을 개발 환경에서 확인할 것
const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      {/* <StrictMode> */}
      <RouterProvider router={router} />
      {/* </StrictMode> */}
    </QueryClientProvider>
  )
};

const start = async () => {
  renderApp();
};

start();

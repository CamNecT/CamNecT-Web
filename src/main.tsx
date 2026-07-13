import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router';
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

const queryClient = new QueryClient(); // 서버 데이터 저장소 -> 저장 / 캐싱 / 관리

const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    </QueryClientProvider>
  )
};

const start = async () => {
  renderApp();
};

start();

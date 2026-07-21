// 지금 이 페이지가 홈 화면에 설치되어 standalone(PWA)으로 실행 중인지 확인.
export const isStandalone = () =>
  // 표준 방법: 브라우저가 현재 standalone 모드인지 확인
  window.matchMedia('(display-mode: standalone)').matches ||
  // 구형 iOS Safari 전용 값
  (window.navigator as { standalone?: boolean }).standalone === true;

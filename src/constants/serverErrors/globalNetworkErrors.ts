// 전역 offline 팝업의 사용자 문구만 관리한다.
// 오류 판별이나 팝업 노출 여부는 각각 판별 유틸과 App 계층의 책임이다.
export const GLOBAL_OFFLINE_POPUP_MESSAGE = {
  title: '인터넷 연결을 확인해 주세요',
  content: '현재 네트워크에 연결되어 있지 않습니다.\n연결 후 다시 시도해 주세요.',
  button: '다시 확인',
} as const;

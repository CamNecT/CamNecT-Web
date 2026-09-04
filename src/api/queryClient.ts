import { QueryClient } from '@tanstack/react-query';

// 서버 데이터 저장소 -> 저장 / 캐싱 / 관리
// axios interceptor or 일반 util함수에서 접근하기 위해 분리
export const queryClient = new QueryClient(); 
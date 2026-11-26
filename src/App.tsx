import { useEffect, useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';
import GlobalOfflineBanner from './components/GlobalOfflineBanner';
import { ScrollToTop } from './components/ScrollToTop';
import { useUnreadCountQuery } from './hooks/useChatQuery';
import { useGlobalNetworkStatus } from './hooks/useGlobalNetworkStatus';
import { useSocketInitializer } from './hooks/useSocketInitializer';
import { useAuthStore } from './store/useAuthStore';
import './styles/global.css';

const defaultTitle = 'CamNect(캠넥트) | 건국대 학생·동문 커뮤니티';

const activityTabTitles = new Map([
  ['external', '대외활동'],
  ['job', '취업정보'],
  ['study', '건국대 스터디'],
  ['club', '건국대 동아리'],
]);

const sectionTitles = {
  '/home/notices': '알림',
  '/community': '건국대 커뮤니티',
  '/activity/internal': '건국대 동아리·스터디',
  '/activity/write': '건국대 동아리·스터디',
  '/activity/edit': '건국대 동아리·스터디',
  '/activity/external': '대외활동·취업정보',
  '/activity/recruit': '팀원 모집',
  '/alumni': '건국대 동문 찾기',
  '/chat': '건국대 동문과의 커피챗',
  '/schedule': '일정',
  '/me': '마이페이지',
  '/shop': '기프티콘 샵',
  '/login': '로그인',
  '/signup': '회원가입',
  '/find-account': '계정 찾기',
  '/admin/post/external': '대외활동',
  '/admin/post/job': '취업정보',
  '/admin': '관리자',
};

const getPageTitle = (pathname: string, search: string) => {
  const path = pathname.toLowerCase().replace(/\/+$/, '');

  if (path === '/activity') {
    const tab = new URLSearchParams(search).get('tab');
    const label = activityTabTitles.get(tab ?? '') ?? '대외활동';
    return `${label} | CamNect`;
  }

  if (matchPath('/activity/:activityId/recruit-write/*', path)) {
    return '팀원 모집 | CamNect';
  }

  const section = Object.entries(sectionTitles).find(([prefix]) =>
    path === prefix || path.startsWith(`${prefix}/`),
  );
  return section ? `${section[1]} | CamNect` : defaultTitle;
};

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { pathname, search } = useLocation();

  useEffect(() => {
    document.title = getPageTitle(pathname, search);
  }, [pathname, search]);

  // 앱이 켜질 때 로컬스토리지에 저장된 로그인 정보를 불러옵니다.
  useEffect(() => {
    const check = () => {
      if (useAuthStore.persist.hasHydrated()) {
        setIsLoaded(true);
      } else {
        useAuthStore.persist.onFinishHydration(() => setIsLoaded(true));
      }
    };
    check();
  }, []);

  useSocketInitializer(); //todo 여기서부터 호출하는 이유?
  useUnreadCountQuery();

  // 브라우저 연결 상태를 구독하고 전역 offline 팝업을 렌더링하는 UI 진입점을 담당한다.
  // 구체적인 API 실패 문구와 재시도 정책은 각 도메인 호출부에서 결정한다.
  useGlobalNetworkStatus();
  // 로그인 정보를 다 불러오기 전까지는 아무것도 보여주지 않습니다 (로그아웃 튕김 방지)
  if (!isLoaded) return null;

  return (
    // 전역 레이아웃 적용 (반응형)
    <div className="w-full max-w-[var(--app-mobile-max-width)] mx-auto min-h-[100dvh] bg-white relative shadow-lg">
      <ScrollToTop/>
      <Outlet/>
      <GlobalOfflineBanner />
    </div>
  );
}
export default App;

import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

// 루트 route의 render/loader/action 오류가 일반 화면을 깨뜨릴 때 제공하는 최종 안전망이다.
// fallback 자체의 실패를 피하기 위해 프로젝트 store, custom hook, API client에 의존하지 않는다.
const ERROR_FALLBACK_CONTENT = {
  notFound: {
    title: '페이지를 찾을 수 없어요',
    description: '요청한 페이지가 없거나 주소가 변경되었어요.',
  },
  unexpected: {
    title: '문제가 발생했어요',
    description: '페이지를 불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해 주세요.',
  },
} as const;

export function GlobalErrorFallback() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const content = isNotFound
    ? ERROR_FALLBACK_CONTENT.notFound
    : ERROR_FALLBACK_CONTENT.unexpected;

  useEffect(() => {
    // 존재하지 않는 경로는 예상 가능한 라우팅 결과이므로 runtime 오류 로그에서 제외한다.
    if (import.meta.env.DEV && !isNotFound) {
      console.error('[GlobalErrorBoundary]', error);
    }
  }, [error, isNotFound]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.assign(import.meta.env.BASE_URL);
  };

  return (
    // App 자체가 렌더링되지 못한 상황에서도 동작해야 하므로 전역 store나 공통 UI에 의존하지 않는다.
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col items-center justify-center bg-white px-[25px] text-center shadow-lg">
      <section role="alert" aria-live="assertive" className="w-full">
        <h1 className="text-[22px] font-bold leading-[140%] tracking-[-0.55px] text-[#202023]">
          {content.title}
        </h1>
        <p className="mt-[12px] whitespace-pre-line text-[15px] font-medium leading-[150%] tracking-[-0.375px] text-[#646464]">
          {content.description}
        </p>

        <div className="mt-[32px] flex w-full flex-col gap-[10px]">
          {!isNotFound && (
            <button
              type="button"
              className="h-[50px] w-full rounded-[25px] bg-primary text-[16px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={handleReload}
            >
              새로고침
            </button>
          )}
          <button
            type="button"
            className="h-[50px] w-full rounded-[25px] border border-primary bg-white text-[16px] font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={handleGoHome}
          >
            홈으로 가기
          </button>
        </div>
      </section>
    </main>
  );
}

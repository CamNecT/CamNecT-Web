import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import graphic1 from '../../assets/image/onboarding1.webp';
import graphic2 from '../../assets/image/onboarding2.webp';
import graphic3 from '../../assets/image/onboarding3.webp';
import Button from '../../components/Button';
import ButtonWhite from '../../components/ButtonWhite';
import { useAuthStore } from '../../store/useAuthStore';
import { FirstSplashPage } from './FirstSplashPage';

const ONBOARDING_DATA = [
  {
    title: "동문과의 커피챗",
    description: "동기부터 선배까지\n관심사로 연결된 동문들과 바로 시작하는 커피챗",
    icon: graphic1,
  },
  {
    title: "대외활동 탐색",
    description: "복잡한 검색은 그만\n대외활동 찾기와 팀 매칭까지 한 번에",
    icon: graphic2,
  },
  {
    title: "검증된 커뮤니티",
    description: "인증된 동문 정보,\n확인부터 질문까지 간편하게",
    icon: graphic3,
  },
];

const AUTO_ADVANCE_DELAY = 5000;
const SCROLL_SETTLE_DELAY = 150;
const SLIDE_COUNT = ONBOARDING_DATA.length;
// 첫 장 앞에 마지막 장, 마지막 장 뒤에 첫 장을 복제 (양방향 순환)
const TRACK_SLIDES = [ONBOARDING_DATA[SLIDE_COUNT - 1], ...ONBOARDING_DATA, ONBOARDING_DATA[0]];

// 트랙 위치를 점 표시와 전환 예약에 쓰는 원본 인덱스로 변환
const getSlideIndex = (scrollLeft: number, clientWidth: number) => {
  const nearestPosition = Math.round(scrollLeft / clientWidth);
  const trackIndex = Math.min(SLIDE_COUNT + 1, Math.max(0, nearestPosition));
  return (trackIndex + SLIDE_COUNT - 1) % SLIDE_COUNT;
};

// 스플래시 이후 기능 소개 슬라이드를 보여주는 온보딩 진입 화면
export const OnboardingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 기기의 동작 줄이기 설정 확인 (자동 전환에 사용)
  const reduceMotion = useReducedMotion();
  // 가로 스크롤 영역 참조 (화면 너비 조회·슬라이드 이동)
  const carouselRef = useRef<HTMLElement | null>(null);

  // 터치·스크롤 진행 상태와 정착 타이머 (자동 전환과 제스처 충돌 방지)
  const isTouching = useRef(false);
  const isSettling = useRef(false);
  const scrollSettleTimer = useRef<number>(undefined);
  // 마지막으로 정착한 장과 자동 전환 예정 시각 (터치 중에도 시각 유지)
  const settledSlide = useRef({ index: 0, advanceAt: 0 });
  const [showSplash, setShowSplash] = useState(true);
  
  // 스크롤 중 화면에 가장 가까운 장 (활성 점 표시)
  const [currentIndex, setCurrentIndex] = useState(0);
  // 터치하거나 스크롤하는 동안 자동 전환 예약 보류
  const [isInteracting, setIsInteracting] = useState(false);

  // 트랙 칸 번호를 가로 스크롤 좌표로 변환해 이동
  const scrollToTrackPosition = useCallback((index: number, behavior: ScrollBehavior = 'auto') => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollTo({ left: index * carousel.clientWidth, behavior });
  }, []);

  // 복제 화면에 도착하면 다음 스와이프를 받을 수 있도록 원본 위치로 이동
  const restoreLoopPosition = (carousel: HTMLElement) => {
    const { scrollLeft, clientWidth } = carousel;
    if (!clientWidth) return;

    if (scrollLeft <= 1) {
      scrollToTrackPosition(SLIDE_COUNT, 'instant');
    } else if (scrollLeft >= (SLIDE_COUNT + 1) * clientWidth - 1) {
      scrollToTrackPosition(1, 'instant');
    }
  };

  // 스크롤이 멈추면 도착한 장과 자동 전환 예정 시각 확정
  const settleScroll = (carousel: HTMLElement) => {
    isSettling.current = true;
    setIsInteracting(true);
    window.clearTimeout(scrollSettleTimer.current);
    if (isTouching.current) return;

    // 다음 터치가 정착 타이머를 취소할 수 있으므로 복제본 위치를 먼저 보정
    restoreLoopPosition(carousel);
    // 손을 뗀 뒤에도 관성 스크롤이 이어져 마지막 스크롤 이벤트 이후 정착 판단
    scrollSettleTimer.current = window.setTimeout(() => {
      const { scrollLeft, clientWidth } = carousel;
      if (clientWidth) {
        const index = getSlideIndex(scrollLeft, clientWidth);
        // 다른 장에 정착한 경우에만 5초를 다시 계산
        if (index !== settledSlide.current.index) {
          settledSlide.current = { index, advanceAt: performance.now() + AUTO_ADVANCE_DELAY };
        }
      }
      isSettling.current = false;
      setIsInteracting(false);
    }, SCROLL_SETTLE_DELAY);
  };

  // 손을 뗀 뒤 스크롤 진행 여부에 따라 자동 전환 재예약
  const finishTouch = (carousel: HTMLElement) => {
    isTouching.current = false;
    if (isSettling.current) {
      settleScroll(carousel);
    } else {
      // 누르기만 한 경우 남은 시간으로 바로 자동 전환 예약
      setIsInteracting(false);
    }
  };

  // 로그인된 유저라면 온보딩을 건너뛰고 홈으로 이동
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // 스플래시 종료 후 첫 장 배치와 자동 전환 시각 초기화
  useLayoutEffect(() => {
    if (showSplash) return;

    settledSlide.current = { index: 0, advanceAt: performance.now() + AUTO_ADVANCE_DELAY };
    // 화면을 그리기 전에 1번 원본 위치로 이동 (트랙 첫 칸은 마지막 장 복제본)
    scrollToTrackPosition(1, 'instant');
  }, [showSplash, scrollToTrackPosition]);

  // 온보딩을 벗어나면 스크롤 정착 타이머 정리
  useEffect(() => () => window.clearTimeout(scrollSettleTimer.current), []);

  // 자동 전환 예약 (터치 해제 후 남은 시간만 대기, 만료 시 즉시 전환)
  useEffect(() => {
    if (showSplash || isInteracting || reduceMotion) return;

    const { index, advanceAt } = settledSlide.current;
    const timer = window.setTimeout(() => {
      // 다음 장의 트랙 위치 (앞쪽 복제본 1칸 + 다음 장 1칸)
      if (!isTouching.current && !isSettling.current) scrollToTrackPosition(index + 2);
    }, Math.max(0, advanceAt - performance.now()));

    return () => window.clearTimeout(timer);
  }, [showSplash, isInteracting, reduceMotion, scrollToTrackPosition]);

  if (showSplash) {
    return <FirstSplashPage />;
  }

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      {/* 문구·이미지 선택을 막고, 바깥 스크롤 영역에서 스와이프 처리 */}
      <section
        ref={carouselRef}
        aria-label="기능 소개"
        tabIndex={0}
        className="absolute inset-x-0 top-0 bottom-[240px] flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain select-none motion-safe:scroll-smooth [-webkit-touch-callout:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onContextMenu={(event) => event.preventDefault()}
        onTouchStart={({ currentTarget }) => {
          isTouching.current = true;
          window.clearTimeout(scrollSettleTimer.current);
          restoreLoopPosition(currentTarget);
          setIsInteracting(true);
        }}
        onTouchEnd={({ currentTarget, touches }) => {
          if (touches.length === 0) finishTouch(currentTarget);
        }}
        onTouchCancel={({ currentTarget }) => finishTouch(currentTarget)}
        onScroll={({ currentTarget }) => {
          const { scrollLeft, clientWidth } = currentTarget;
          if (!clientWidth) return;

          setCurrentIndex(getSlideIndex(scrollLeft, clientWidth));
          settleScroll(currentTarget);
        }}
      >
        {TRACK_SLIDES.map(({ title, description, icon }, index) => (
          <article key={index} aria-hidden={index !== currentIndex + 1} className="pointer-events-none relative w-full shrink-0 snap-start snap-always">
            <div className="absolute top-[60px] z-10 w-full px-[25px] text-center">
              <h1 className="text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-[#202023] whitespace-pre-line">
                {title}
              </h1>
              <p className="mt-[10px] text-[16px] font-medium text-[#A1A1A1] tracking-[-0.4px] leading-[140%] whitespace-pre-line">
                {description}
              </p>
            </div>
            <div className="absolute inset-x-0 top-[160px] bottom-0 z-0 flex items-center justify-center">
              <img src={icon} alt="온보딩 설명 아이콘 이미지" draggable={false} className="w-[70%] h-[70%] object-contain" />
            </div>
          </article>
        ))}
      </section>

      {/* 하단 영역 (페이지네이션 + 버튼) */}
      <div className="absolute bottom-[60px] w-full px-[25px] flex flex-col items-center z-10">
        <div className="flex gap-[8px] mb-[40px]" role="group" aria-label="소개 화면 선택">
          {ONBOARDING_DATA.map(({ title }, index) => (
            <button
              key={title}
              type="button"
              aria-label={`${index + 1}번째 화면, ${title}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              className={`relative w-[8px] h-[8px] cursor-pointer rounded-full transition-colors duration-300 before:absolute before:-inset-x-1 before:-inset-y-4 focus-visible:outline-2 focus-visible:outline-primary ${
                index === currentIndex ? 'bg-primary' : 'bg-gray-200'
              }`}
              onClick={() => {
                const carousel = carouselRef.current;
                if (!carousel) return;

                scrollToTrackPosition(index + 1);
                settleScroll(carousel);
              }}
            />
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="w-full flex flex-col gap-[12px] items-center">
          <Button
            className="!h-[50px] w-full max-w-[var(--app-mobile-max-width)]"
            onClick={() => navigate("/login")}
            label="로그인" 
          />
          <ButtonWhite
            className="!h-[50px] w-full max-w-[var(--app-mobile-max-width)]"
            onClick={() => navigate("/home")}
            label="먼저 둘러보기" 
          />
        </div>
      </div>
    </div>
  );
};

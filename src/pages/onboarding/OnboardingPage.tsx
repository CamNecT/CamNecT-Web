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
const TRACK_SLIDES = [ONBOARDING_DATA[SLIDE_COUNT - 1], ...ONBOARDING_DATA, ONBOARDING_DATA[0]];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const reduceMotion = useReducedMotion();
  const carouselRef = useRef<HTMLElement | null>(null);
  const isTouching = useRef(false);
  const scrollSettleTimer = useRef<number>(undefined);
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const scrollToTrackPosition = useCallback((index: number, behavior: ScrollBehavior = 'auto') => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollTo({ left: index * carousel.clientWidth, behavior });
  }, []);

  const settleScroll = (carousel: HTMLElement) => {
    setIsInteracting(true);
    window.clearTimeout(scrollSettleTimer.current);
    if (isTouching.current) return;

    scrollSettleTimer.current = window.setTimeout(() => {
      const { scrollLeft, clientWidth } = carousel;
      if (!clientWidth) return;

      // 양 끝의 복제 화면에 도착하면 같은 내용의 원본 위치로 즉시 옮긴다.
      if (scrollLeft <= 1) {
        scrollToTrackPosition(SLIDE_COUNT, 'instant');
      } else if (scrollLeft >= (SLIDE_COUNT + 1) * clientWidth - 1) {
        scrollToTrackPosition(1, 'instant');
      }
      setIsInteracting(false);
    }, SCROLL_SETTLE_DELAY);
  };

  const finishTouch = (carousel: HTMLElement) => {
    isTouching.current = false;
    settleScroll(carousel);
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

  useLayoutEffect(() => {
    if (!showSplash) scrollToTrackPosition(1, 'instant');
  }, [showSplash, scrollToTrackPosition]);

  useEffect(() => () => window.clearTimeout(scrollSettleTimer.current), []);

  useEffect(() => {
    if (showSplash || isInteracting || reduceMotion) return;

    const timer = window.setTimeout(() => {
      if (!isTouching.current) scrollToTrackPosition(currentIndex + 2);
    }, AUTO_ADVANCE_DELAY);

    return () => window.clearTimeout(timer);
  }, [showSplash, isInteracting, reduceMotion, currentIndex, scrollToTrackPosition]);

  if (showSplash) {
    return <FirstSplashPage />;
  }

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      <section
        ref={carouselRef}
        aria-label="기능 소개"
        tabIndex={0}
        className="absolute inset-x-0 top-0 bottom-[240px] flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain select-none motion-safe:scroll-smooth [-webkit-touch-callout:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onContextMenu={(event) => event.preventDefault()}
        onTouchStart={() => {
          isTouching.current = true;
          window.clearTimeout(scrollSettleTimer.current);
          setIsInteracting(true);
        }}
        onTouchEnd={({ currentTarget, touches }) => {
          if (touches.length === 0) finishTouch(currentTarget);
        }}
        onTouchCancel={({ currentTarget }) => finishTouch(currentTarget)}
        onScroll={({ currentTarget }) => {
          const { scrollLeft, clientWidth } = currentTarget;
          if (!clientWidth) return;

          const nearestPosition = Math.round(scrollLeft / clientWidth);
          const trackIndex = Math.min(SLIDE_COUNT + 1, Math.max(0, nearestPosition));
          setCurrentIndex((trackIndex + SLIDE_COUNT - 1) % SLIDE_COUNT);
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

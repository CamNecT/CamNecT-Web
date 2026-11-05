import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import graphic1 from '../../assets/image/onboarding1.png';
import graphic2 from '../../assets/image/onboarding2.png';
import graphic3 from '../../assets/image/onboarding3.png';
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

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // 3초마다 페이지 전환 (스플래시가 끝난 후 작동)
  useEffect(() => {
    if (showSplash) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ONBOARDING_DATA.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [showSplash]);

  if (showSplash) {
    return <FirstSplashPage />;
  }

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      {/* 텍스트 영역 */}
      <div className="absolute top-[60px] w-full px-[25px] text-center transition-all duration-500 z-10">
        <h1 className="text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-[#202023] whitespace-pre-line">
          {ONBOARDING_DATA[currentIndex].title}
        </h1>
        <p className="mt-[10px] text-[16px] font-medium text-[#A1A1A1] tracking-[-0.4px] leading-[140%] whitespace-pre-line">
          {ONBOARDING_DATA[currentIndex].description}
        </p>
      </div>

      {/* 이미지/SVG 영역 */}
      <div className="absolute top-[160px] bottom-[240px] left-0 right-0 flex items-center justify-center transition-opacity duration-500 z-0">
        <img 
          src={ONBOARDING_DATA[currentIndex].icon} 
          alt="온보딩 설명 아이콘 이미지" 
          className="w-[70%] h-[70%] object-contain"
        />
      </div>

      {/* 하단 영역 (페이지네이션 + 버튼) */}
      <div className="absolute bottom-[60px] w-full px-[25px] flex flex-col items-center z-10">
        {/* 페이지네이션 도트 */}
        <div className="flex gap-[8px] mb-[40px]">
          {ONBOARDING_DATA.map((_, index) => (
            <div
              key={index}
              className={`w-[8px] h-[8px] rounded-full transition-colors duration-300 ${
                index === currentIndex ? "bg-primary" : "bg-gray-200"
              }`}
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
            onClick={() => navigate("/signup")}
            label="회원가입" 
          />
        </div>
      </div>
    </div>
  );
};

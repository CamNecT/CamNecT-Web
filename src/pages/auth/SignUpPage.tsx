import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ProfileOnboardingResponse } from '../../api-types/authApiTypes';
import PopUp from '../../components/Pop-up';
import { useAuthStore } from '../../store/useAuthStore';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { LoginHeader } from '../../layouts/headers/LoginHeader';
import { EmailVerificationStep } from './EmailVerificationStep';
import { InterestsStep } from './InterestsStep';
import { ProfileStep } from './ProfileStep';
import { SchoolCompletion } from './SchoolCompletion';
import { SchoolStandByStep } from './SchoolStandByStep';
import { SchoolVerificationStep } from './SchoolVerificationStep';
import { TermsStep } from './TermsStep';
import { UserInfoStep } from './UserInfoStep';

// 회원가입 단계별 페이지
export const SignUpPage = () => {

  // 파라미터로 단계별 구현
  // 전역 상태로 뒤로가도 상황 기억
  // navigate로 뒤로가기 구현
  
  const navigate = useNavigate();
  // 회원가입 단계별 쿼리파라미터
  const [searchParams] = useSearchParams();
  const step = Number(searchParams.get('step')) || 1;

  const signupToken = useAuthStore((state) => state.signupToken);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [onboardingNotice, setOnboardingNotice] = useState<'login' | 'error' | null>(null);

  // 4단계부터는 인증 토큰이 있어야 진행할 수 있다.
  // 가입용 TEMP 만료(clearSignupToken)와 정식 ACCESS 만료(clearClientSession) 모두
  // 두 토큰이 비어 있는 상태로 끝나므로, 어느 단계에 있든 여기서 재로그인으로 안내한다.
  // (토큰 없이 남으면 각 단계의 "다시 시도해 주세요" 안내가 무한히 반복된다)
  const isAuthExpired = step >= 4 && !signupToken && !accessToken;

  // 화면 이동 함수
  const goToStep = (nextStep: number) => {
    navigate(`/signup?step=${nextStep}`);
  };

  const handleOnboardingComplete = (status: ProfileOnboardingResponse['status']) => {
    if (status === 'ADMIN_PENDING') {
      goToStep(7);
      return;
    }

    if (status === 'ACTIVE') {
      // 계정 승인 상태와 현재 브라우저의 정식 세션 보유 여부는 별개
      // 온보딩 응답은 토큰을 발급하지 않으므로 TEMP만 있으면 재로그인이 필요
      const { isAuthenticated, accessToken, refreshToken } = useAuthStore.getState();

      if (isAuthenticated && accessToken && refreshToken) {
        goToStep(8);
      } else {
        setOnboardingNotice('login');
      }
      return;
    }

    // 예상하지 못한 계정 상태를 승인 완료로 취급 X
    setOnboardingNotice('error');
  };

  const goBack = () => {
    if (step === 1) {
      navigate('/login');
    } else {
      goToStep(step - 1);
    }
  }

  if (isAuthExpired) {
    return (
      <div className="fixed inset-0 bg-white z-[9999]">
        <PopUp
          isOpen={true}
          type="confirm"
          title="인증이 만료되었습니다"
          content="다시 로그인해 주세요."
          buttonText="로그인하러 가기"
          onClick={() => navigate('/login', { replace: true })}
        />
      </div>
    );
  }

  return (
    <>
      {step < 8 ? (
        <HeaderLayout
          headerSlot={
            <LoginHeader onBack={goBack} />
          }
        >
            {step === 1 && <TermsStep onNext = {() => goToStep(2)} />}
            {step === 2 && <UserInfoStep onNext = {() => goToStep(3)} />}
            {step === 3 && <EmailVerificationStep onNext = {() => goToStep(4)} />}
            {step === 4 && <SchoolVerificationStep onNext = {() => goToStep(5)} />}
            {step === 5 && <ProfileStep onNext = {() => goToStep(6)} />}
            {step === 6 && <InterestsStep onComplete={handleOnboardingComplete} />}
            {step === 7 && <SchoolStandByStep/>}
        </HeaderLayout>
      ) : (
        <SchoolCompletion />
      )}
      <PopUp
        isOpen={onboardingNotice !== null}
        type={onboardingNotice === 'login' ? 'confirm' : 'error'}
        title={onboardingNotice === 'login' ? '승인이 완료되었습니다' : '계정 상태를 확인해 주세요'}
        content={onboardingNotice === 'login' ? '다시 로그인해 주세요.' : '가입을 계속 진행할 수 없습니다. 관리자에게 문의해 주세요.'}
        buttonText={onboardingNotice === 'login' ? '로그인하러 가기' : '확인'}
        onClick={() => {
          if (onboardingNotice === 'login') {
            navigate('/login', { replace: true });
          } else {
            setOnboardingNotice(null);
          }
        }}
      />
    </>
  );
};

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import PopUp from "../../components/Pop-up";
import { useAuthRedirect } from "../../hooks/useAuthRedirect";
import { useAuthStore } from "../../store/useAuthStore";
import { LastSplashPage } from "../onboarding/LastSplashPage";

const Logo = ({ className }: { className?: string }) => {
    return (
        <svg width="300" height="66" viewBox="0 0 300 66" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M44.2147 42.959C43.2673 42.4915 42.1405 42.8263 41.5647 43.7234C39.0323 47.6845 34.6487 50.3 29.6706 50.3C21.8259 50.3 15.4672 43.8119 15.4672 35.8076C15.4672 34.9421 15.5415 34.1018 15.6839 33.2805C15.8325 32.415 15.4734 31.5369 14.7366 31.0757L6.09312 25.6237C4.95387 24.9035 3.44932 25.4531 3.02829 26.7482C2.09955 29.5974 1.59185 32.6425 1.59185 35.8076C1.59185 40.4509 2.67537 44.8353 4.59476 48.7143C4.82385 49.1818 4.87338 49.7251 4.73717 50.2241L1.57946 61.741C1.13986 63.333 2.5825 64.805 4.14277 64.3565L15.3433 61.1471C15.8449 61.0018 16.3773 61.0524 16.8417 61.2988C20.6867 63.3204 25.0517 64.4575 29.6706 64.4575C39.9982 64.4575 49.0317 58.7465 53.9107 50.2747C54.5298 49.207 54.115 47.8235 53.0191 47.2865L44.2209 42.959H44.2147Z" stroke="#00C56C" strokeWidth="3" strokeMiterlimit="10"/>
          <path d="M29.6706 21.3216C34.1224 21.3216 38.0912 23.4127 40.6978 26.6789C41.3603 27.5065 42.5181 27.715 43.4097 27.1527L56.3687 18.9842C57.7061 18.1376 57.6751 16.1413 56.313 15.3389L30.7108 0.284289C30.0669 -0.0947629 29.2744 -0.0947629 28.6304 0.284289L3.03446 15.3389C1.67232 16.1413 1.64136 18.1376 2.97874 18.9842L15.9377 27.1527C16.8293 27.715 17.9871 27.5065 18.6496 26.6789C21.2563 23.4127 25.2251 21.3216 29.6768 21.3216H29.6706Z" fill="#00C56C"/>
          <path d="M57.3469 41.2028C57.3469 31.6001 63.91 24.335 72.5782 24.335C76.417 24.335 79.6985 25.788 82.1132 28.315V25.0931H91.1529V57.3124H82.1132V54.0905C79.6985 56.6175 76.417 58.0705 72.5782 58.0705C63.91 58.0705 57.3469 50.8054 57.3469 41.2028ZM82.1132 41.2028C82.1132 36.6541 78.8317 33.2427 74.3738 33.2427C69.9158 33.2427 66.6962 36.6541 66.6962 41.2028C66.6962 45.7514 69.9777 49.1628 74.3738 49.1628C78.7698 49.1628 82.1132 45.7514 82.1132 41.2028Z" fill="#00C56C"/>
          <path d="M98.3351 25.0862H107.375V28.1186C109.728 25.5916 112.761 24.3281 116.353 24.3281C120.749 24.3281 124.216 26.2866 126.135 29.5717C128.674 26.1602 132.265 24.3281 136.785 24.3281C143.657 24.3281 148.239 29.0663 148.239 36.2682V57.3056H139.199V39.048C139.199 35.5733 137.032 33.2358 133.751 33.2358C130.222 33.2358 127.807 35.6365 127.807 39.1743V57.3056H118.767V39.048C118.767 35.5733 116.6 33.2358 113.319 33.2358C109.79 33.2358 107.375 35.6365 107.375 39.1743V57.3056H98.3351V25.0862Z" fill="#00C56C"/>
          <path d="M155.422 13.7148H165.08L182.85 40.3748V13.7148H192.447V57.3058H182.726L165.018 30.6458V57.3058H155.422V13.7148Z" fill="#00C56C"/>
          <path d="M198.205 41.2028C198.205 31.6001 205.511 24.335 215.232 24.335C224.953 24.335 232.259 31.5369 232.259 41.3923C232.259 42.2767 232.197 43.3507 232.011 44.172H207.864C208.855 47.8362 211.765 50.1736 215.542 50.1736C218.452 50.1736 220.804 48.9101 222.105 47.1412H231.764C229.411 53.6483 223.095 58.0705 215.294 58.0705C205.511 58.0705 198.205 50.8054 198.205 41.2028ZM207.926 38.044H222.6C221.671 34.5062 218.823 32.2319 215.232 32.2319C211.641 32.2319 208.917 34.5062 207.926 38.044Z" fill="#00C56C"/>
          <path d="M235.602 41.2028C235.602 31.6001 242.908 24.335 252.629 24.335C261.112 24.335 267.861 29.9576 268.913 37.7913H259.316C258.449 35.0748 255.787 33.2427 252.629 33.2427C248.171 33.2427 244.89 36.6541 244.89 41.2028C244.89 45.7514 248.171 49.1628 252.629 49.1628C255.787 49.1628 258.449 47.3308 259.316 44.6142H268.913C267.861 52.4479 261.112 58.0705 252.629 58.0705C242.908 58.0705 235.602 50.8054 235.602 41.2028Z" fill="#00C56C"/>
          <path d="M276.962 47.0779V33.4952H272.256V25.0929H274.857C276.591 25.0929 277.457 24.2085 277.457 22.4396V16.6274H286.002V25.0929H296.342V33.4952H286.002V46.1935C286.002 47.836 287.116 48.91 288.664 48.91C290.398 48.91 291.45 47.6465 291.45 45.5617H299.499C299.499 52.7005 295.041 57.3123 288.107 57.3123C281.172 57.3123 276.962 53.2059 276.962 47.0779Z" fill="#00C56C"/>
        </svg>
    );
}

const Divider = () => {
  return (
    <svg width="1" height="14" viewBox="0 0 1 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="14" fill="#ECECEC"/>
    </svg>
  )
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const setUserLogin = useAuthStore((state) => state.setUserLogin); // 회원가입 중 로그인도 포함
  const { handleRedirect } = useAuthRedirect(); // 리다이렉트 훅 추가

  const [showPassword, setShowPassword] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const [popUpConfig, setPopUpConfig] = useState<{ title: string; content: string } | null>(null);

  const [showSplash, setShowSplash] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login, // .mutate시에 실행 할 함수

    // data : 서버의 response (AxiosResponse)
    onSuccess: (data) => {
      const { accessToken, userId, role, nextStep } = data;
      
      // 모든 로그인 성공 시 토큰과 유저 정보 저장 (AccessToken 필수)
      setUserLogin(accessToken, {
        id: String(userId),
        role,
        nextStep
      });

      if (nextStep === 'HOME') {
        setShowSplash(true); 
      } else {
        // 회원가입 단계가 남은 경우 해당 단계로 리다이렉트
        handleRedirect(role, nextStep);
      }
    },
    onError: (error: AxiosError) => {
      const status = error.response?.status;
      
      if (status === 401) {
        setPopUpConfig({ title: "로그인 실패", content: "아이디 또는 비밀번호가 일치하지 않습니다." });
      }
      else if (status === 404) {
        setPopUpConfig({ title: "로그인 실패", content: "아이디가 존재하지 않습니다." });
      }
      else {
        setPopUpConfig({ title: "오류", content: "문제가 발생했습니다." });
      }
    }
  })

  const handleLogin = () => {
    if(!(id && password)) {
      setPopUpConfig({ title: "아이디와 비밀번호를 입력해주세요", content: "" });
      return;
    }

    const trimmedId = id.trim();
    const trimmedPassword = password.trim();

    // 서버에 요청
    // 브라우저에서 입력한 값을 props에 전송 -> TanStackQuery가 login 함수에 props 전달
    loginMutation.mutate({ username: trimmedId, password: trimmedPassword });
  }

  useEffect(() => {

    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        navigate("/home");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSplash, navigate]);

  if (showSplash) {
    return <LastSplashPage />;
  }

  return (
    <div className="w-full min-h-[100dvh] bg-white px-[25px] flex flex-col items-center overflow-y-auto hide-scrollbar">
      {/* 상단 로고 영역: 마진 대신 div로 확실하게 상단 공간 확보 */}
      <div className="pt-[160px] w-full max-w-[300px] flex-none">
        <Logo className="w-full h-auto" />
      </div>

      {/* 가변 공간: min-h를 두어 화면이 작아져도 로고와 폼이 절대 겹치지 않게 함 */}
      <div className="flex-1 min-h-[60px]" />

      <div className="flex flex-col max-w-[335px] w-full gap-[20px] mb-[40px] flex-none">
        <input type="text" placeholder="아이디를 입력해주세요" aria-label="아이디"
          className="w-full h-[48px] rounded-[5px] border-[1px] border-gray-150 
          placeholder:text-gray-650 placeholder:text-r-14 placeholder:tracking-[-0.56px] pl-[15px] pr-[15px] pt-[14px] pb-[14px] outline-none"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        {/* 비밀번호 입력 */}
        <div className="relative w-full h-[48px]">
          <input type={showPassword ? "text" : "password"} placeholder="비밀번호를 입력해주세요" aria-label="비밀번호"
            className="w-full h-[48px] rounded-[5px] border-[1px] border-gray-150 
            placeholder:text-gray-650 placeholder:text-r-14 placeholder:tracking-[-0.56px] pl-[15px] pr-[50px] pt-[14px] pb-[14px] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button type="button"
              onClick={() => setShowPassword(!showPassword)} aria-label="비밀번호 표시/숨김" aria-pressed={showPassword}
              className="absolute right-[16px] top-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              <Icon
                name={showPassword ? "visible" : "visible_off"}
                className={showPassword ? "w-[24px] h-[24px]" : "w-[22px] h-[20px]"}
              />
          </button>
        </div>
      </div>

      <Button label="로그인" className="w-full mb-[60px] flex-none" onClick={handleLogin} loading={loginMutation.isPending} />
      
      <div className="max-w-[201px] w-full h-[17px] flex justify-between items-center flex-none">
        <button className="text-gray-650 text-r-12 tracking-[-0.24px]" onClick={() => navigate("/find-account/id")}>아이디 찾기</button>
        <Divider/>
        <button className="text-gray-650 text-r-12 tracking-[-0.24px]" onClick={() => navigate("/find-account/password")}>비밀번호 찾기</button>
        <Divider/>
        <button className="text-gray-650 text-r-12 tracking-[-0.24px]" onClick={() => navigate("/signup")}>회원가입</button>
      </div>

      {/* 하단 패딩 영역: 스크롤 시 여백을 보장하기 위해 명시적인 div 사용 */}
      <div className="pb-[105px] flex-none" />

      {popUpConfig && (
        <PopUp
          isOpen={true}
          type="confirm"
          title={popUpConfig.title}
          content={popUpConfig.content}
          onClick={() => setPopUpConfig(null)}
        />
      )}

    </div>
  );
};

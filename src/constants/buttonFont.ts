// 버튼 전용 폰트 토큰 모음
// - Button / ButtonWhite 의 font prop 에서만 사용한다 (기본값 'sb-18')
// - 글씨(text-*)는 Button base 에 두지 않고 여기서만 관리한다
//   → 콜사이트마다 글씨 토큰이 항상 딱 하나만 적용되어 twMerge 글씨 충돌이 없다
// - 각 항목 주석 = 그 폰트를 쓰는 버튼(문구) → 어느 사이즈용인지 바로 파악 가능
// - 값에 tracking 이 함께 묶인 항목은 원래 디자인에서 자간이 지정돼 있던 폰트다
export const BUTTON_FONT = {
  // 기존 기본 버튼(로그인 · 회원가입 스텝 등 전체)
  'sb-18': 'text-sb-18 tracking-[-0.72px]',

  // sb-18인데 자간이 없는 버전 · 구매하기(상점 하단바)
  'sb-18-flat': 'text-sb-18',

  // 팀원 신청하기(모집 상세) · 비밀번호 변경하기(비밀번호 변경)
  'sb-16-hn': 'text-sb-16-hn',

  // 커피챗 요청하기(동문 커피챗 버튼)
  'sb-14': 'text-sb-14',

  // 팝업 확인 버튼(확인 · 네, 확인했습니다)
  'b-14-hn': 'text-b-14-hn',

  // 인증요청 · 인증하기 · 중복확인 · 재발송 등 입력창 옆 소형 버튼(구 SmallButton)
  'm-16': 'text-m-16 tracking-[-0.4px]',

  // 모집글 작성(외부활동 상세)
  'm-16-hn': 'text-m-16-hn',

  // 커피챗 보내기(팔로워 목록)
  'm-12-hn': 'text-m-12-hn',

  // 구매하기(커뮤니티 잠긴 질문 카드)
  'r-14': 'text-r-14',

  // 미리보기(학교 인증서류)
  'r-12': 'text-r-12',

  // 프로필 수정하기(마이페이지)
  'SB-14-hn': 'text-SB-14-hn',
} as const;

export type ButtonFont = keyof typeof BUTTON_FONT;

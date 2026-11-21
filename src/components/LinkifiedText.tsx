import Linkify from "linkify-react";
import type { Opts } from "linkifyjs";

type LinkifiedTextProps = {
    text: string;
    linkClassName?: string;
};

// https:// 없이 입력한 주소(naver.com 등)에 허용할 도메인 끝자리
// 전부 허용하면 README.md(.md), main.py(.py) 같은 파일명까지 링크가 되므로 흔한 끝자리만 허용
const ALLOWED_TLDS_WITHOUT_PROTOCOL = new Set([
    "com", "net", "org", "kr", "io", "co", "me", "dev", "app", "ai", "so", "ly", "gg",
]);

// "https://"처럼 "이름://"으로 시작하는지 확인
const hasProtocol = (value: string) => /^[a-z][a-z\d+.-]*:\/\//i.test(value);

// 링크 검증 함수
const validateLink = (value: string, type: string): boolean => {
    // 이메일 등 다른 종류를 제외하고 웹 주소만 허용
    if (type !== "url") return false;

    const withProtocol = hasProtocol(value);

    try {
        // 브라우저의 URL 해석 결과를 기준으로 프로토콜과 인증 정보 확인
        // naver.com처럼 프로토콜이 없으면 new URL이 실패하므로 https://를 붙여 해석
        const url = new URL(withProtocol ? value : `https://${value}`);

        // HTTP·HTTPS만 허용하고, 도메인 혼동을 유발할 수 있는 인증 정보 포함 주소 제외
        // 예: https://school.example@attacker.example의 실제 목적지는 attacker.example
        const isSafe =
            (url.protocol === "http:" || url.protocol === "https:") &&
            url.username === "" &&
            url.password === "";
        if (!isSafe) return false;

        // 프로토콜을 직접 쓴 주소는 사용자가 링크로 의도한 것이므로 끝자리 검사 생략
        if (withProtocol) return true;

        // 프로토콜이 없으면 도메인 끝자리가 허용 목록에 있을 때만 링크로 변환
        const tld = url.hostname.split(".").pop() ?? "";
        return ALLOWED_TLDS_WITHOUT_PROTOCOL.has(tld);
    } catch {
        // 주소 분석 실패 시 링크 변환만 생략해 화면 오류 방지
        return false;
    }
};

// 하이퍼링크 변환 공용 컴포넌트
export const LinkifiedText = ({
    text,
    linkClassName = "text-primary", // 기본 : primary 색상
}: LinkifiedTextProps) => {
    const options: Opts = {
        validate: validateLink,
        // 프로토콜 없이 입력한 주소의 실제 이동 주소에 https:// 적용 (기본값은 http)
        defaultProtocol: "https",
        // 현재 화면을 유지한 채 새 탭으로 이동
        target: "_blank",
        // 원래 창과의 연결 차단(noopener), 방문 출처 전달 방지(noreferrer)
        rel: "noopener noreferrer",
        // 링크 구분용 밑줄과 긴 URL의 화면 넘침 방지, 화면별 색상 적용
        className: `underline underline-offset-2 [overflow-wrap:anywhere] ${linkClassName}`,
    };

    // 사용자 입력은 문자열로 전달해 HTML 실행 방지
    // 기본 Fragment로 추가 DOM 없이 텍스트와 링크만 출력해 기존 문단 구조 유지
    return (
        <Linkify options={options}>{text}</Linkify>
    );
};

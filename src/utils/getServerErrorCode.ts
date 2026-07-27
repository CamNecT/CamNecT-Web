import type { AxiosError } from "axios";

// 서버 에러 응답에서 사용하는 최소 구조
type ServerErrorResponse = {
    code?: string | number;
};

// AxiosError에서 서버 error code 값을 문자열로 꺼내는 함수
export const getServerErrorCode = (error: AxiosError): string | undefined => {
    const errorData = error.response?.data as ServerErrorResponse | undefined;
    const errorCode = errorData?.code;

    return errorCode !== undefined ? String(errorCode) : undefined;
};

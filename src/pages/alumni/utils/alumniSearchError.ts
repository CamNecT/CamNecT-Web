import axios from 'axios';
import { getServerErrorCode } from '../../../utils/getServerErrorCode';

type AlumniSearchErrorConfig = { title: string; content: string };

// /api/alumni의 코드만 다룹니다. 프로필·팔로우·커피챗 오류 의미와 섞지 않습니다.
const CODE_MESSAGES: Partial<Record<string, AlumniSearchErrorConfig>> = {
  '40000': {
    title: '검색 조건을 확인해 주세요',
    content: '검색 조건이 올바르지 않습니다. 검색어나 태그를 변경한 뒤 다시 시도해 주세요.',
  },
  '41302': {
    title: '동문찾기를 이용할 수 없어요',
    content: '이용이 정지된 계정입니다. 관리자에게 문의해 주세요.',
  },
};
const AUTH_CODES = new Set(['40100', '41103', '41104', '41106']);

export const getAlumniSearchError = (error: unknown): AlumniSearchErrorConfig | null => {
  if (axios.isCancel(error)) return null;
  const axiosError = axios.isAxiosError(error) ? error : undefined;
  const code = axiosError ? getServerErrorCode(axiosError) : undefined;
  const status = axiosError?.response?.status;
  if (code && Object.hasOwn(CODE_MESSAGES, code)) return CODE_MESSAGES[code] ?? null;
  if ((code && AUTH_CODES.has(code)) || status === 401) {
    return {
      title: '로그인이 필요합니다',
      content: '로그인 정보가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.',
    };
  }
  return {
    title: '동문 목록을 불러오지 못했어요',
    content: code === '50000' || (status !== undefined && status >= 500)
      ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      : axiosError && !axiosError.response
        ? '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
        : status === 403
          ? '동문 목록을 조회할 권한이 없습니다.'
          : '잠시 후 다시 시도해 주세요.',
  };
};

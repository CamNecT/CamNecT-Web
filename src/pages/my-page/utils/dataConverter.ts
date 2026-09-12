import type { EducationItem, CareerItem, CertificateItem } from "../../../types/mypage/mypageTypes";
import type { EducationRequest, ExperienceRequest, CertificateRequest } from "../../../api-types/userInfoApiTypes";

// ===== UI → API 변환 함수 =====

/**
 * UI의 EducationItem을 API의 EducationRequest로 변환
 * @param education UI 학력 데이터
 */
export const convertEducationToRequest = (
  education: EducationItem
): EducationRequest => {
  if (!education.institutionId || !education.campusId) {
    throw new Error('학교와 캠퍼스 선택 정보가 없습니다.');
  }
  // LocalDate 형식: YYYY-MM-DD
  // 연도만 수집 시 -01-01 형식으로 변환
  const startDate = `${education.startYear}-01-01`;
  const endDate = education.endYear ? `${education.endYear}-01-01` : null;

  return {
    institutionId: education.institutionId,
    campusId: education.campusId,
    startDate,
    endDate,
    status: education.status,
  };
};

/**
 * UI의 CareerItem을 API의 ExperienceRequest로 변환
 */
export const convertCareerToRequest = (career: CareerItem): ExperienceRequest => {
  // LocalDate 형식: YYYY-MM-DD
  // 연도+월 수집 시 일은 -01로 설정
  const startDate = `${career.startYear}-${String(career.startMonth).padStart(2, '0')}-01`;
  
  let endDate: string | null = null;
  let isCurrent = true;
  
  if (career.endYear && career.endMonth) {
    // 종료 날짜: 연도+월 → 일은 -01
    endDate = `${career.endYear}-${String(career.endMonth).padStart(2, '0')}-01`;
    isCurrent = false;
  }

  return {
    companyName: career.organization,
    startDate,
    endDate,
    isCurrent,
    responsibilities: career.positions || [],
  };
};

/**
 * UI의 CertificateItem을 API의 CertificateRequest로 변환
 */
export const convertCertificateToRequest = (certificate: CertificateItem): CertificateRequest => {
  // LocalDate 형식: YYYY-MM-DD
  // 연도+월 수집 시 일은 -01로 설정
  const acquiredDate = `${certificate.acquiredYear}-${String(certificate.acquiredMonth).padStart(2, '0')}-01`;

  return {
    certificateName: certificate.name,
    acquiredDate,
  };
};

// ===== 학교 이름 → institutionId 매핑 헬퍼 =====

/**
 * 학교 이름으로 institutionId를 찾는 헬퍼 함수
 * 실제로는 학교 검색 API 결과에서 매핑해야 함
 */
export interface InstitutionMapping {
  schoolName: string;
  institutionId: number;
}

/**
 * 학교 이름 목록을 institutionId 매핑으로 변환
 * @param educations 학력 목록
 * @param institutionMappings 학교명-ID 매핑 정보
 */
export const mapSchoolNamesToIds = (
  institutionMappings: InstitutionMapping[]
): Map<string, number> => {
  const mapping = new Map<string, number>();
  
  institutionMappings.forEach(m => {
    mapping.set(m.schoolName, m.institutionId);
  });
  
  return mapping;
};

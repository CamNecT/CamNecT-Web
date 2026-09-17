// ===== 전공 관련 타입 =====

export interface MajorData {
  id: number;
  code: string;
  nameKor: string;
  nameEng: string;
}

export interface MajorResponse {
  status: number;
  message: string;
  data: MajorData;
}

export interface MajorRequest {
  institutionId: number;
  majorId: number;
}

// ===== 대학 관련 타입 =====

export interface Campus {
  campusId: number;
  campusName: string;
  fullCampusName: string;
  campusRelation: string;
  campusOrder: number;
  region: string;
}

// 대학 정보
export interface Institution {
  id: number;
  code: string;
  nameKor: string;
  nameEng: string;
  campuses: Campus[];
}

// 대학 검색 요청
export interface InstitutionSearchRequest {
  keyword: string;
}

// 대학 검색 응답
export interface InstitutionSearchResponse {
  status: number;
  message: string;
  data: {
    institutions: Institution[];
  };
}

// 대학 단건 조회 요청
export interface InstitutionRequest {
  institutionId: number;
}

// 대학 단건 조회 응답
export interface InstitutionResponse {
  status: number;
  message: string;
  data: Institution;
}

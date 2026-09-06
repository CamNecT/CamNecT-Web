import type { CaseDetail, CaseListItem } from '../api-types/reportApiTypes';

// 로컬 프리뷰용 목업 데이터 (reportApi.ts를 이 파일 내용의 reportApi.mock.ts로 덮어쓸 때만 사용됨)
// 최신 스펙(래핑된 응답 / evidenceImageKeys 배열 / case 구조 / evidenceId별 증거) 기준

export const MOCK_CASES: CaseListItem[] = [
  {
    caseId: 10,
    targetKey: 'COMMUNITY:1001',
    targetAuthor: { userId: 42, name: '홍길동', status: 'ACTIVE' },
    targetId: 1001,
    targetType: 'COMMUNITY',
    reportCount: 3,
    status: 'RECEIVED',
    decidedCategory: null,
    appliedPenalty: null,
    createdAt: '2026-08-01T10:10:10',
    updatedAt: '2026-08-02T14:22:01',
  },
  {
    caseId: 11,
    targetKey: 'USER:88',
    targetAuthor: { userId: 88, name: '김철수', status: 'ACTIVE' },
    targetId: 88,
    targetType: 'USER',
    reportCount: 1,
    status: 'RESOLVED',
    decidedCategory: 'INSULT_DEFAMATION',
    appliedPenalty: 'WARNING',
    createdAt: '2026-07-30T09:00:00',
    updatedAt: '2026-08-01T11:00:00',
  },
  {
    caseId: 12,
    targetKey: 'CHAT:501',
    targetAuthor: { userId: 15, name: '이영희', status: 'ACTIVE' },
    targetId: 501,
    targetType: 'CHAT',
    reportCount: 1,
    status: 'REJECTED',
    decidedCategory: null,
    appliedPenalty: null,
    createdAt: '2026-07-28T09:00:00',
    updatedAt: '2026-07-29T09:00:00',
  },
];

export const MOCK_CASE_DETAILS: Record<number, CaseDetail> = {
  10: {
    ...MOCK_CASES[0],
    moderationReason: null,
    processedByAdminId: null,
    processedAt: null,
    submissions: [
      {
        reportId: 501,
        reporterId: 7,
        submittedCategory: 'INSULT_DEFAMATION',
        title: '욕설이 포함된 게시글입니다',
        context: '본문 두 번째 문단에서 특정 사용자를 모욕합니다.',
        hasEvidence: true,
        evidenceCount: 2,
        evidence: [
          { evidenceId: 9001, originalFilename: 'evidence-1.png', contentType: 'image/png', fileSize: 245810, sortOrder: 0 },
          { evidenceId: 9002, originalFilename: 'evidence-2.png', contentType: 'image/png', fileSize: 190500, sortOrder: 1 },
        ],
        createdAt: '2026-08-01T10:10:10',
      },
      {
        reportId: 502,
        reporterId: 12,
        submittedCategory: 'FALSE_INFORMATION',
        title: '허위 정보 신고',
        context: '행사 일정이 실제와 다르게 안내되어 있습니다.',
        hasEvidence: false,
        evidenceCount: 0,
        evidence: [],
        createdAt: '2026-08-01T15:00:00',
      },
      {
        reportId: 503,
        reporterId: 20,
        submittedCategory: 'INSULT_DEFAMATION',
        title: '동일 게시글 재신고',
        context: '이미 삭제 요청된 게시글인데 아직도 노출됩니다.',
        hasEvidence: false,
        evidenceCount: 0,
        evidence: [],
        createdAt: '2026-08-02T08:20:00',
      },
    ],
    existingPenalties: [
      {
        penaltyId: 301,
        caseId: 3,
        targetKey: 'COMMUNITY:220',
        penaltyType: 'WARNING',
        suspensionEndDate: null,
        reason: '이전 욕설 신고 승인',
        active: false,
        createdAt: '2026-06-01T10:00:00',
      },
      {
        penaltyId: 305,
        caseId: 7,
        targetKey: 'COMMUNITY:1001',
        penaltyType: 'SUSPENDED_7_DAYS',
        suspensionEndDate: '2026-07-10T00:00:00',
        reason: '반복적 욕설 재발',
        active: false,
        createdAt: '2026-07-03T10:00:00',
      },
    ],
  },
  11: {
    ...MOCK_CASES[1],
    moderationReason: '운영 정책 위반 확인',
    processedByAdminId: 1,
    processedAt: '2026-08-01T11:00:00',
    submissions: [
      {
        reportId: 601,
        reporterId: 33,
        submittedCategory: 'INSULT_DEFAMATION',
        title: '지속적인 욕설',
        context: '커피챗 중 지속적으로 욕설을 사용했습니다.',
        hasEvidence: false,
        evidenceCount: 0,
        evidence: [],
        createdAt: '2026-07-30T09:00:00',
      },
    ],
    existingPenalties: [
      {
        penaltyId: 402,
        caseId: 11,
        targetKey: 'USER:88',
        penaltyType: 'WARNING',
        suspensionEndDate: null,
        reason: '운영 정책 위반 확인',
        active: false,
        createdAt: '2026-08-01T11:00:00',
      },
    ],
  },
  12: {
    ...MOCK_CASES[2],
    moderationReason: '신고 내용만으로 위반을 확인하기 어려움',
    processedByAdminId: 1,
    processedAt: '2026-07-29T09:00:00',
    submissions: [
      {
        reportId: 701,
        reporterId: 5,
        submittedCategory: 'HARASSMENT_THREAT',
        title: '채팅방 내 협박',
        context: '상대방이 신고자를 협박하는 메시지를 보냈습니다.',
        hasEvidence: false,
        evidenceCount: 0,
        evidence: [],
        createdAt: '2026-07-28T09:00:00',
      },
    ],
    existingPenalties: [],
  },
};

// 사용자 승인 신고 누적 건수 (targetUserId 기준)
export const MOCK_REPORT_COUNTS: Record<number, number> = {
  42: 2,
  88: 1,
  15: 0,
};
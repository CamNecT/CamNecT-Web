import type { ReportItem } from '../api-types/reportApiTypes';

export const MOCK_REPORTS: ReportItem[] = [
  {
    reportId: 381,
    reporterId: 10,
    reportedUserId: 52,
    reportedPostId: 1043,
    postType: 'COMMUNITY',
    reportCategory: 'INSULT_DEFAMATION',
    title: '욕설이 포함된 게시글입니다.',
    context:
      '요청 보냈습니다. 확인 부탁드립니다! 댓글 내용 길어짐 댓글 내댓글 내댓글 내댓글 내용 길어짐 댓글 내댓글 내댓글 내댓글 내용 길어짐 댓글 내댓글 내댓글 내댓글 내',
    evidenceImageUrls: [
      'https://placehold.co/300x300?text=evidence-1',
      'https://placehold.co/300x300?text=evidence-2',
      'https://placehold.co/300x300?text=evidence-3',
    ],
    status: 'RECEIVED',
    appliedPenalty: null,
    createdAt: '2025-10-31T00:00:00',
    updatedAt: '2025-10-31T00:00:00',
  },
  {
    reportId: 382,
    reporterId: 11,
    reportedUserId: 60,
    reportedPostId: 2001,
    postType: 'COMMUNITY',
    reportCategory: 'FALSE_INFORMATION',
    title: '허위 정보 게시글입니다.',
    context: '요청 보냈습니다. 확인 부탁드립니다! 댓글 내용 길어짐 댓글 내댓글 내댓글 내댓글 내용 길어짐',
    evidenceImageUrls: [],
    status: 'RESOLVED',
    appliedPenalty: 'WARNING',
    createdAt: '2025-10-30T00:00:00',
    updatedAt: '2025-10-30T00:00:00',
  },
  {
    reportId: 383,
    reporterId: 12,
    reportedUserId: 71,
    reportedPostId: 3005,
    postType: 'COMMUNITY_COMMENT',
    reportCategory: 'INAPPROPRIATE_PROFILE',
    title: '부적절한 프로필 신고',
    context: '요청 보냈습니다. 확인 부탁드립니다! 댓글 내용 길어짐',
    evidenceImageUrls: ['https://placehold.co/300x300?text=evidence-1'],
    status: 'REJECTED',
    appliedPenalty: null,
    createdAt: '2025-10-30T00:00:00',
    updatedAt: '2025-10-30T00:00:00',
  },
];

export const MOCK_REPORT_COUNTS: Record<number, number> = {
  52: 2,
  60: 1,
  71: 0,
};
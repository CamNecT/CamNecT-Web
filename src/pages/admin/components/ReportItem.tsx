import type { CaseListItem } from '../../../api-types/reportApiTypes';
import { formatDotDate } from '../../../utils/formatDate';
import StatusBadge from '../components/StatusBadge';
import {
  getReportCategoryLabel,
  getReportStatusBadgeLabel,
  getReportStatusVariant,
  getReportTargetTypeLabel,
} from '../utils/reportMapper';

type ReportItemProps = {
  caseItem: CaseListItem;
  onClick: () => void;
};

export const ReportItem = ({ caseItem, onClick }: ReportItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start gap-[8px] pt-[15px] pb-[15px] px-[25px] text-left border-b border-gray-150"
    >
      {/* 상태/타입 배지 및 날짜 */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-[5px]">
          <StatusBadge
            label={getReportStatusBadgeLabel(caseItem.status)}
            variant={getReportStatusVariant(caseItem.status)}
          />
          <StatusBadge label={getReportTargetTypeLabel(caseItem.targetType)} variant="type" />
        </div>
        <span className="text-r-12-hn text-gray-650">{formatDotDate(caseItem.createdAt)}</span>
      </div>

      {/* 대상자 이름 · 접수 건수 (한 줄) */}
      <div className="text-m-16-hn text-gray-900">
        {caseItem.targetAuthor.name} ·{' '}
        <span className="text-primary">{caseItem.reportCount}건</span>
      </div>

      {/* 확정 사유 (처리 완료된 case만 값이 있음) */}
      {caseItem.decidedCategory && (
        <div className="text-r-12-hn text-gray-650">
          {getReportCategoryLabel(caseItem.decidedCategory)}
        </div>
      )}
    </button>
  );
};
import type { ReportItem as ReportItemType } from '../../../api-types/reportApiTypes';
import StatusBadge from '../components/StatusBadge';
import { formatDotDate } from '../../../utils/formatDate';
import {
  getReportCategoryLabel,
  getReportStatusBadgeLabel,
  getReportStatusVariant,
  getReportTargetTypeLabel,
} from '../utils/reportMapper';

type ReportItemProps = {
  report: ReportItemType;
  onClick: () => void;
};

export const ReportItem = ({ report, onClick }: ReportItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start gap-[8px] pt-[15px] pb-[20px] px-[25px] text-left border-b border-gray-150"
    >
      {/* 상태/타입 배지 및 날짜 */}
      <div className="flex w-full items-center justify-between pb-[3px]">
        <div className="flex items-center gap-[5px]">
          <StatusBadge
            label={getReportStatusBadgeLabel(report.status)}
            variant={getReportStatusVariant(report.status)}
          />
          <StatusBadge label={getReportTargetTypeLabel(report.postType)} variant="type" />
        </div>
        <span className="text-r-12-hn text-gray-650">{formatDotDate(report.createdAt)}</span>
      </div>

      {/* 신고 제목 */}
      <div className="text-sb-16-hn text-gray-900">{report.title}</div>

      {/* 신고 상세 내용*/}
      <div className="text-r-14-hn text-gray-750 w-full line-clamp-2">
        {report.context}
      </div>

      {/* 신고 사유 */}
      <span className="text-r-12-hn text-gray-650 pt-[2px]">
        {getReportCategoryLabel(report.reportCategory)}
      </span>
    </button>
  );
};
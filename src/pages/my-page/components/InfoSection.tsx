import { type EducationItem, type CareerItem, type CertificateItem, EDUCATION_STATUS_KR } from "../../../types/mypage/mypageTypes";
import BaseSection from "./BaseSection";
import Icon from "../../../components/Icon";
import { formatEducationSchoolName } from "../../../constants/institutionCampusMapping";

type InfoType = "education"|"career"|"certificate";
type InfoItem = EducationItem|CareerItem|CertificateItem;

interface InfoItemDisplay {
    period: string;
    mainText: string;
    status?: string;
    position?: string[];
}

export default function InfoSection({
    type,
    items,
    isEdit,
    onEditClick
}: {
    type: InfoType;
    items: InfoItem[];
    isEdit: boolean;
    onEditClick?: () => void;
}) {
    

    const title: Record<InfoType, string> = {
        education: "학력",
        career: "경력",
        certificate: "자격증"
    };
    const emptyText: Record<InfoType, string> = {
        education: "아직 학력 정보가 등록되지 않았어요!",
        career: "아직 경력 정보가 등록되지 않았어요!",
        certificate: "아직 등록된 자격증 및 보유 기술이 없어요!"
    };
    const editStatement = <button onClick={onEditClick}
                            className="text-R-12-hn text-gray-650 flex items-center gap-[2px]">
                                수정하기
                                <Icon name="arrow_right" className="w-[10px] h-[10px] block shrink-0"/>
                            </button>
    const displayItems = makeDisplayItems(type, items);
    return (
        <BaseSection title={title[type]} right={isEdit ? editStatement : undefined}>
        <div className="text-R-14 flex flex-col gap-[15px]">
            {displayItems.length === 0 ? (
            <div className="text-gray-650">{emptyText[type]}</div>
            ) : (
                    displayItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-[3px]">
                            <div className="text-r-12-hn text-gray-650">{item.period}</div>
                            {type === "career" ? (
                                <div className="flex gap-[5px]">
                                    <div className="text-r-16-hn text-gray-900 w-[120px]">{item.mainText}</div>
                                    {item.position && item.position.length > 0 && (
                                        <div className="flex-1 flex flex-col gap-[3px]">
                                            {item.position.map((position, positionIdx) => (
                                                <div key={positionIdx} className="text-r-14-hn text-gray-750">
                                                    - {position}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-[5px]">
                                    <span className="text-r-16-hn text-gray-900">{item.mainText}</span>
                                    {item.status && <span className="text-r-14-hn text-gray-750">{item.status}</span>}
                                    
                                </div>
                            )}
                            
                        </div>
                    ))
                )}
            </div>
        </BaseSection>
    );
}

//학력, 경력, 자격증 데이터 정리
function makeDisplayItems(type: InfoType, items: InfoItem[]): InfoItemDisplay[] {
    if (type === "education") {
        return (items as EducationItem[])
            .slice()
            .sort((a, b) => b.startYear - a.startYear)
            .map((e) => ({
                period: `${e.startYear}${e.endYear ? `-${e.endYear}` : '-현재'}`,
                mainText: formatEducationSchoolName(e.school, e.campusName, e.campusId),
                status: EDUCATION_STATUS_KR[e.status]
            }));
    }

    if (type === "career") {
        return (items as CareerItem[])
            .slice()
            .sort((a, b) => b.startYear - a.startYear)
            .map((c) => ({
                period: `${c.startYear}.${String(c.startMonth).padStart(2, '0')}-${
                    c.endYear && c.endMonth 
                        ? `${c.endYear}.${String(c.endMonth).padStart(2, '0')}`
                        : '현재'
                }`,
                mainText: c.organization,
                position: c.positions || []
            }));
    }

    return (items as CertificateItem[])
        .slice()
        .sort((a, b) => b.acquiredYear - a.acquiredYear)
        .map((x) => ({
            period: `${x.acquiredYear}.${String(x.acquiredMonth || 1).padStart(2, '0')}`,
            mainText: x.name
        }));
}

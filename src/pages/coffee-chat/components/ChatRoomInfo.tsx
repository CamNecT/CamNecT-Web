import { useNavigate } from "react-router-dom";
import type { ChatUser } from "../../../types/coffee-chat/coffeeChatTypes";
import { formatFullDateWithDay } from "../../../utils/formatDate";

interface ChatRoomInfoProps {
    partner: ChatUser;
    requestInfo: {
        createdAt: string;
        tags: string[];
        content: string;
    }
}

const formatStudentLabel = (studentId?: string) => {
    const normalized = studentId?.trim() ?? "";
    if (!normalized) return "";
    return !isNaN(Number(normalized)) && normalized.length >= 2
        ? `${normalized.slice(2, 4)}학번`
        : normalized;
};

// 요청분야와 요청내용 연동 완료
export const ChatRoomInfo = ({ partner, requestInfo }: ChatRoomInfoProps) => {
    const navigate = useNavigate();
    const studentLabel = formatStudentLabel(partner.studentId);
    const partnerName = partner.name?.trim() || "알 수 없음";
    const partnerMajor = partner.major?.trim() || "";
    const requestTags = requestInfo.tags ?? [];
    const partnerTags = partner.tags ?? [];

    return (
        <div className="flex flex-col gap-[10px] px-[25px]">
            <section className="flex flex-col items-center gap-[40px]">
                <div className="flex flex-col gap-[20px]">
                    <div 
                        className="flex flex-col items-center gap-[15px] cursor-pointer"
                        onClick={() => navigate(`/alumni/profile/${partner.id}`)}
                    >
                        <div className="shrink-0">
                            {partner.profileImg ? (
                                <img src={partner.profileImg} alt="프로필 이미지" className="w-[84px] h-[84px] rounded-full object-cover" />
                            ) : (
                                <div className="w-[84px] h-[84px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    <span className="text-gray-700 text-[36px] font-bold">{partnerName.charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-[7px]">
                            <h3 className="text-b-18-hn text-gray-900 text-center tracking-[-0.72px]">
                                {partnerName}
                            </h3>
                            <p className="text-r-12-hn text-gray-750 text-center tracking-[-0.48px]">
                                {[partnerMajor, studentLabel].filter(Boolean).join(' ')}
                            </p>
                        </div>
                    </div>
                    <div className="w-full flex flex-wrap gap-[5px] justify-center">
                        {partnerTags.map((tag) => (
                            <span
                                key={tag}
                                className="flex justify-center items-center rounded-[3px] border border-primary bg-green-50 px-[5px] py-[3px] text-R-12-hn text-primary"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 요청 날짜 표시 영역 */}
            <p className="text-r-12 text-gray-750 text-center tracking-[-0.24px] my-[10px]">
                {requestInfo.createdAt ? formatFullDateWithDay(requestInfo.createdAt) : ""}
            </p>

            <section className="flex flex-col gap-[15px] p-[25px] rounded-[20px] border border-gray-150">
                <div className="flex flex-col gap-[7px]">
                    <p className="text-sb-16 text-gray-900 tracking-[-0.64px]">요청 분야</p>
                    <div className="flex flex-wrap gap-[10px]">
                        {requestTags.map((tag) => (
                            <span
                                key={tag}
                                className="flex justify-center items-center rounded-[3px] border border-primary bg-white px-[8px] py-[4px] text-R-12-hn text-primary"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-[7px]">
                    <p className="text-sb-16 text-gray-900 tracking-[-0.64px]">요청 내용</p>
                    <p className="text-r-14 text-gray-750 tracking-[-0.56px] whitespace-pre-wrap">{requestInfo.content || '요청 내용이 없습니다.'}</p>
                </div>
            </section>
        </div>
    )
}

import { useNavigate } from "react-router-dom";
import { formatTimeAgo } from "../../utils/formatDate";
import type { TeamRecruitPost } from '../../types/activityPage/activityPageTypes';
import PressableMotion from "../PressableMotion";

export const RecruitPost = (post: TeamRecruitPost) => {
    const navigate = useNavigate();
    return (
        <PressableMotion
            as="button"
            intensity="soft"
            className="flex flex-col items-start gap-[10px] px-[25px] py-[20px] border-b border-gray-150 text-left"
            onClick={() => navigate(`/activity/recruit/${post.id}`)}
        >
            {/* Tag */}
            <span
                className={`flex justify-center items-center px-[10px] py-[4px] rounded-[5px] text-r-12-hn border ${
                    post.recruitNow ? 'text-primary border-primary' : 'text-gray-650 border-gray-650'
                }`}
            >
                {post.recruitNow ? "모집 중" : "완료"}
            </span>

            {/* Title & Content */}
            <div className="w-full flex flex-col gap-[5px]">
                <span className="text-b-16-hn text-gray-900 truncate">
                    {post.title}
                </span>
                <div className="text-r-14-hn text-gray-750">
                    {post.authorName}
                    {post.activityName ? ` | ${post.activityName}` : ""}
                </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-[5px] text-r-12-hn text-gray-650">
                <div className="flex items-center gap-[3px]">
                    <svg viewBox="0 0 11 12" fill="none" className="w-[11px] h-[12px] block shrink-0">
                        <path 
                            d="M9.22867 0.697692C9.962 0.775908 10.5 1.3558 10.5 2.03286V11.5L5.5 9.20853L0.5 11.5V2.03286C0.5 1.3558 1.03733 0.775908 1.77133 0.697692C4.24879 0.434103 6.75121 0.434103 9.22867 0.697692Z" 
                            stroke="#A1A1A1" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span>{post.bookmarkCount}</span>
                </div>
                <span>|</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
        </PressableMotion>
    );
};

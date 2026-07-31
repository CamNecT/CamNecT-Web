import { useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import Category from '../../../components/Category';
import Icon from '../../../components/Icon';
import PressableMotion from '../../../components/PressableMotion';


type RecommendBoxProps = {
    userId: string;
    name: string;
    profileImage?: string;
    major: string;
    studentId: string;
    intro: string;
    categories: string[];
    onSelect?: () => void;
    onRequestChat?: () => void;
};

function RecommendBox({
    userId,
    name,
    profileImage,
    major,
    studentId,
    intro,
    categories,
    onSelect,
    onRequestChat,
}: RecommendBoxProps) {
    const navigate = useNavigate();
    const formattedStudentId = !isNaN(Number(studentId)) && studentId?.length >= 2 
        ? `${studentId.length >= 4 ? studentId.slice(2, 4) : studentId.slice(0, 2)}학번`
        : studentId;

    return (
        <Card
            width="100%"
            height="auto"
            className="flex min-h-[206px] flex-col gap-[20px] rounded-[10px] border-[#ECECEC] p-[15px]"
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (!onSelect) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect();
                }
            }}
        >
            {/* 1그룹: 프로필/이름/학과/학번 + 더보기 아이콘 */}
            <section className="flex justify-between">
                <div className="flex items-center">
                    <div className="flex items-center gap-[13px]">
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt={`${name} 프로필`}
                                className="h-[60px] w-[60px] shrink-0 rounded-full object-cover"
                            />
                        ) : (
                            <div
                                className="h-[60px] w-[60px] shrink-0 rounded-full bg-[#D5D5D5]"
                                aria-hidden
                            />
                        )}

                        <div className="flex min-w-0 flex-col gap-[3px]">
                            <div className="text-sb-16-hn text-[color:var(--ColorBlack,#202023)]">
                                {name}
                            </div>
                            <div className="text-r-14 text-[color:var(--ColorGray2,#A1A1A1)]">
                                {major} {formattedStudentId}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pt-[9px]">
                    <PressableMotion
                        as="button"
                        intensity="soft"
                        type="button"
                        className="flex items-center justify-center"
                        onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/alumni/profile/${userId}`);
                        }}
                        aria-label={`${name} 프로필 더보기`}
                    >
                        <Icon name="arrow_right" className="h-6 w-6" />
                    </PressableMotion>
                </div>
            </section>

            {/* 2그룹: 카테고리와 소개글 */}
            <div className="flex min-w-0 flex-col gap-[10px] pl-[7px]">
                <div className="flex flex-wrap gap-[3px]">
                    {categories.map((category, index) => (
                        <Category key={`${name}-${category}-${index}`} label={category} />
                    ))}
                </div>

                <p className="line-clamp-2 text-r-14 text-[color:var(--ColorGray3,#646464)]">
                    {intro}
                </p>
            </div>

            {/* 3그룹: 커피챗 요청 버튼 */}
            <PressableMotion
                as="button"
                type="button"
                className={`flex w-full items-center justify-center rounded-[10px] bg-[var(--ColorMain,#00C56C)] py-[10px]${
                    onRequestChat ? ' cursor-pointer' : ''
                }`}
                onClick={(event) => {
                    event.stopPropagation();
                    onRequestChat?.();
                }}
                aria-label={`${name} 커피챗 요청하기`}
            >
                <span className="text-sb-14 text-[color:var(--ColorWhite,#FFF)]">커피챗 요청하기</span>
            </PressableMotion>
        </Card>
    );
}

export type { RecommendBoxProps };
export default RecommendBox;

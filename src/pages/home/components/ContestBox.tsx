import Card from '../../../components/Card';


type Contest = {
    id: string;
    title: string;
    posterImgUrl?: string;
    organizer: string;
    location: string;
    deadline: string;
    views: number;
    comments: number;
    isHot?: boolean;
    isClosingSoon?: boolean;
};

type ContestBoxProps = {
    contests: Contest[];
    onTitleClick?: () => void;
    onItemClick?: (contest: Contest) => void;
};

const ContestBox = ({ contests, onTitleClick, onItemClick }: ContestBoxProps) => {
    return (
        <div className="flex flex-col gap-[10px]">
            <div
                className="flex items-center gap-[5px]"
                onClick={onTitleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onTitleClick?.();
                }}
            >
                {/*TODO: 주목받은 공모전 글씨 클릭 시 공모전 페이지 라우터 연결*/}
                <span className="text-sb-20 text-black">주목받은 공모전</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M8.25 4.5L15.75 12L8.25 19.5"
                        stroke="#646464"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <div className="flex overflow-x-auto gap-[10px] pb-[4px]">
                {/*TODO: 공모전 카드 클릭 시 공모전 상세페이지 라우터 연결*/}
                {contests.map((contest) => (
                    <Card
                        key={`${contest.title}-${contest.organizer}`}
                        width="158px"
                        height="200px"
                        className="flex-shrink-0 overflow-hidden rounded-[10px] border-[#ECECEC] bg-[#FCFCFC]"
                        onClick={() => onItemClick?.(contest)}
                    >
                        <div className="relative w-full flex justify-center">
                            {contest.posterImgUrl ? (
                                <img
                                    src={contest.posterImgUrl}
                                    alt={`${contest.title} 포스터`}
                                    className="h-[128px] w-full object-cover"
                                />
                            ) : (
                                <div
                                    className="h-[128px] w-full shrink-0 bg-gray-300"
                                    aria-hidden
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-[3px] p-[15px]">
                            <p className="truncate text-m-16 text-black">
                                {contest.title}
                            </p>
                            <p className="truncate text-r-12 text-gray-650">
                                {contest.organizer}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export type { Contest, ContestBoxProps };
export default ContestBox;

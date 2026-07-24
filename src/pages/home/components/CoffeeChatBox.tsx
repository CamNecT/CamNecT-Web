import Icon from '../../../components/Icon';
import PressableMotion from '../../../components/PressableMotion';

type CoffeeChatRequest = {
    name: string;
    major: string;
    studentId: string;
};

type CoffeeChatBoxProps = {
    coffeeChatCount?: number;
    teamRecruitCount?: number;
    onViewAll?: () => void;
    onSelectCoffeeChat?: () => void;
    onSelectTeamRecruit?: () => void;
};

type RequestSummaryItem = {
    id: 'coffee-chat' | 'team-recruitment';
    title: string;
    count: number;
    description: string;
    onClick?: () => void;
};

const CoffeeChatBox = ({
    coffeeChatCount = 0,
    teamRecruitCount = 0,
    onViewAll,
    onSelectCoffeeChat,
    onSelectTeamRecruit,
}: CoffeeChatBoxProps) => {
    const notificationItems: RequestSummaryItem[] = [
        {
            id: 'coffee-chat',
            title: '커피챗 요청',
            count: coffeeChatCount,
            description:
                coffeeChatCount === 0
                    ? '먼저 커피챗을 신청해 보세요!'
                    : '최근 여러 학우가 커피챗을 요청했어요.',
            onClick: onSelectCoffeeChat,
        },
        {
            id: 'team-recruitment',
            title: '팀원 모집',
            count: teamRecruitCount,
            description:
                teamRecruitCount === 0
                    ? '우리 팀에 맞는 인재를 찾아보세요'
                    : '방금 새로운 팀원 지원이 도착했어요.',
            onClick: onSelectTeamRecruit,
        },
    ];

    return (
        <section
            className="flex w-full flex-col items-center justify-center gap-[20px] rounded-[15px] border border-gray-150 bg-white px-[22px] py-[20px]"
            aria-labelledby="coffee-chat-heading"
        >
            <div className="flex w-full flex-col gap-[25px]">
                <p id="coffee-chat-heading" className="text-sb-18 text-gray-900">
                    새로운 요청이 <span className="text-primary">{coffeeChatCount}건</span> 도착했어요!
                </p>

                <ul className="flex flex-col gap-[25px]">
                    {notificationItems.map((item) => (
                        <li key={item.id} className="px-[6px]">
                            <button
                                type="button"
                                onClick={item.onClick}
                                className="flex w-full cursor-pointer items-center justify-between text-left"
                                aria-label={`${item.title} ${item.count}건: ${item.description}`}
                            >
                                <span className="flex min-w-0 flex-col gap-[3px]">
                                    <span className="text-sb-14 text-gray-900">
                                        {item.title} <span className="text-gray-900">·</span>{' '}
                                        <span className="text-primary">{item.count}건</span>
                                    </span>
                                    <span className="truncate text-r-12 text-gray-750">
                                        {item.description}
                                    </span>
                                </span>
                                <Icon name="more" className="h-6 w-6 shrink-0" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <PressableMotion
                as="button"
                type="button"
                className="flex w-full cursor-pointer items-center justify-center rounded-[7px] bg-primary px-[10px] py-[10px]"
                onClick={onViewAll}
            >
                <span className="text-sb-14 text-white">커피챗으로 이동</span>
            </PressableMotion>
        </section>
    );
};

export type { CoffeeChatRequest, CoffeeChatBoxProps };
export default CoffeeChatBox;

import Card from '../../../components/Card';
import PressableMotion from '../../../components/PressableMotion';

// TODO: 백엔드 커피챗 요청 데이터와 페이지 이동 핸들러(onViewAll)를 연결해야 합니다.

type CoffeeChatRequest = {
    name: string;
    major: string;
    studentId: string;
};

type CoffeeChatBoxProps = {
    requests: CoffeeChatRequest[];
    totalCount?: number;
    onViewAll?: () => void;
};

const EmptyCoffeeChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="269" height="217" viewBox="0 0 269 217" fill="none" className="overflow-visible">
        <g filter="url(#emptyCoffeeChatShadow)">
            <path d="M50.0001 132.936C49.9644 146.568 59.501 158.469 72.9909 160.489C82.2482 161.877 91.6001 162.949 101.038 163.707L100.934 203.272L135.751 168.637C138.113 166.303 141.277 164.961 144.596 164.885C160.797 164.479 176.959 163.116 192.999 160.803C206.499 158.854 216.098 147.011 216.134 133.362L216.268 82.0908C216.303 68.4423 206.767 56.5494 193.277 54.529C173.416 51.5609 153.365 50.0477 133.284 50.0015C112.905 49.9482 92.8631 51.3867 73.2689 54.2151C59.7685 56.1649 50.1699 68.0163 50.1342 81.6563L50.0001 132.928L50.0001 132.936Z" fill="#00C56C" />
            <path d="M50.0001 132.936C49.9644 146.568 59.501 158.469 72.9909 160.489C82.2482 161.877 91.6001 162.949 101.038 163.707L100.934 203.272L135.751 168.637C138.113 166.303 141.277 164.961 144.596 164.885C160.797 164.479 176.959 163.116 192.999 160.803C206.499 158.854 216.098 147.011 216.134 133.362L216.268 82.0908C216.303 68.4423 206.767 56.5494 193.277 54.529C173.416 51.5609 153.365 50.0477 133.284 50.0015C112.905 49.9482 92.8631 51.3867 73.2689 54.2151C59.7685 56.1649 50.1699 68.0163 50.1342 81.6563L50.0001 132.928L50.0001 132.936Z" fill="url(#emptyCoffeeChatGreenGradient)" />
            <foreignObject x="111.759" y="67.8501" width="174.268" height="161.439">
                <div
                    style={{
                        backdropFilter: 'blur(2px)',
                        clipPath: 'url(#emptyCoffeeChatBlurClip)',
                        height: '100%',
                        width: '100%',
                    }}
                />
            </foreignObject>
            <g filter="url(#emptyCoffeeChatInnerShadow)" data-figma-bg-blur-radius="4">
                <path d="M281.893 155.221C281.857 168.853 272.258 180.704 258.758 182.654C249.493 183.993 240.136 185.016 230.694 185.724L230.591 225.29L195.956 190.473C193.607 188.126 190.449 186.768 187.131 186.675C170.932 186.184 154.777 184.737 138.75 182.34C125.26 180.32 115.723 168.427 115.759 154.778L115.893 103.507C115.929 89.8584 125.528 78.0155 139.028 76.0657C158.904 73.2015 178.962 71.7932 199.043 71.8521C219.422 71.9054 239.457 73.4487 259.036 76.3796C272.526 78.4 282.062 90.3014 282.027 103.941L281.893 155.213L281.893 155.221Z" fill="#ECFFE1" fillOpacity="0.7" />
                <path d="M281.893 155.221C281.857 168.853 272.258 180.704 258.758 182.654C249.493 183.993 240.136 185.016 230.694 185.724L230.591 225.29L195.956 190.473C193.607 188.126 190.449 186.768 187.131 186.675C170.932 186.184 154.777 184.737 138.75 182.34C125.26 180.32 115.723 168.427 115.759 154.778L115.893 103.507C115.929 89.8584 125.528 78.0155 139.028 76.0657C158.904 73.2015 178.962 71.7932 199.043 71.8521C219.422 71.9054 239.457 73.4487 259.036 76.3796C272.526 78.4 282.062 90.3014 282.027 103.941L281.893 155.213L281.893 155.221Z" fill="url(#emptyCoffeeChatSubGradient)" fillOpacity="0.2" />
            </g>
        </g>
        <defs>
            <filter id="emptyCoffeeChatShadow" x="0" y="0" width="332.027" height="275.29" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="25" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.00114543 0 0 0 0 0.772048 0 0 0 0 0.423113 0 0 0 0.2 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5899_1909" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5899_1909" result="shape" />
            </filter>
            <filter id="emptyCoffeeChatInnerShadow" x="111.759" y="67.8501" width="174.268" height="161.439" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="5.15" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_5899_1909" />
            </filter>
            <clipPath id="emptyCoffeeChatBlurClip" transform="translate(-111.759 -67.8501)">
                <path d="M281.893 155.221C281.857 168.853 272.258 180.704 258.758 182.654C249.493 183.993 240.136 185.016 230.694 185.724L230.591 225.29L195.956 190.473C193.607 188.126 190.449 186.768 187.131 186.675C170.932 186.184 154.777 184.737 138.75 182.34C125.26 180.32 115.723 168.427 115.759 154.778L115.893 103.507C115.929 89.8584 125.528 78.0155 139.028 76.0657C158.904 73.2015 178.962 71.7932 199.043 71.8521C219.422 71.9054 239.457 73.4487 259.036 76.3796C272.526 78.4 282.062 90.3014 282.027 103.941L281.893 155.213L281.893 155.221Z" />
            </clipPath>
            <linearGradient id="emptyCoffeeChatGreenGradient" x1="327.432" y1="74.0734" x2="7.32203" y2="203.96" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ECFFE1" stopOpacity="0" />
                <stop offset="1" stopColor="#ECFFE1" />
            </linearGradient>
            <linearGradient id="emptyCoffeeChatSubGradient" x1="240.441" y1="97.2245" x2="137.596" y2="213.494" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00C56C" stopOpacity="0" />
                <stop offset="1" stopColor="#00C56C" />
            </linearGradient>
        </defs>
    </svg>
);

const CoffeeChatBox = ({ requests, totalCount, onViewAll }: CoffeeChatBoxProps) => {
    const requestCount = typeof totalCount === 'number' ? totalCount : requests.length;
    const visibleRequests = requests.slice(0, 3);

    if (requestCount === 0) {
        return (
            <div className="relative h-[300px] w-full overflow-hidden rounded-[15px] border border-[#E4E4E4] bg-white [container-type:inline-size]">
                <div className="absolute -right-[13px] -bottom-[8px] h-[217px] w-[269px]" aria-hidden>
                    <EmptyCoffeeChatIcon />
                </div>
                <p
                    className="relative z-[1] ml-[22px] mt-[20px] whitespace-nowrap font-semibold leading-[25.2px] text-gray-650"
                    style={{ fontSize: 'clamp(15px, 5.5cqw, 18px)' }}
                >
                    커피챗 요청이 아직 도착하지 않았어요!
                </p>
            </div>
        );
    }

    return (
        <Card
            width="100%"
            height="auto"
            className="flex min-h-[299px] flex-col justify-between gap-[20px] rounded-[15px] border-[#E4E4E4] px-[22px] py-[20px] shadow-none"
        >
            <div className="flex flex-col gap-[24px]">
                <p className="text-sb-18 text-gray-900">
                    커피챗 요청이 <span className="text-primary">{requestCount}건</span> 도착했어요!
                </p>

                <div className="flex flex-col gap-[15px] px-[6px]">
                    {visibleRequests.map((request) => {
                        const shortStudentId = request.studentId?.slice(2, 4) ?? '';
                        return (
                            <div
                                key={`${request.name}-${request.studentId}`}
                                className="flex min-h-[40px] items-center justify-between"
                            >
                                <div className="flex min-w-0 flex-col gap-[3px]">
                                    <span className="text-sb-14 text-gray-900">{request.name}</span>
                                    <span className="truncate text-r-12 text-gray-750">
                                        {request.major} {shortStudentId}학번
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center"
                                    onClick={() => {
                                        // TODO: 요청확인 클릭 시 커피챗 요청 상세 라우터 연결 예정
                                    }}
                                    aria-label={`${request.name} 커피챗 요청 확인`}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                                        <path d="M9.5 6L16.5 12L9.5 18" stroke="#A1A1A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <PressableMotion
                as="button"
                type="button"
                className="flex w-full cursor-pointer items-center justify-center rounded-[7px] bg-primary px-[10px] py-[10px]"
                onClick={onViewAll}
            >
                <span className="text-sb-14 text-white">전체보기</span>
            </PressableMotion>
        </Card>
    );
};

export type { CoffeeChatRequest, CoffeeChatBoxProps };
export default CoffeeChatBox;

import { useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';

type PointBoxProps = {
    points?: number;
};

// 홈 1/2-2: 포인트 박스 UI
const PointBox = ({ points = 0 }: PointBoxProps) => {
    const navigate = useNavigate();
    const formattedPoints = points.toLocaleString();

    return (
        //TODO: 쿠폰교환 페이지 라우터 연결
        <Card
                width="100%"
                height="135px"
                className="relative flex flex-[181_181_0] flex-col justify-between cursor-pointer rounded-[15px] border-none bg-gray-900! px-[16px] py-[13px] overflow-hidden [container-type:inline-size]"
                onClick={() => navigate('/shop')}
            >
                {/* 포인트/CTA 텍스트 */}
                <div className="flex flex-col gap-[8px]">
                    <span className="text-sb-18 text-primary tracking-[-0.04em]">
                        {formattedPoints} P
                    </span>
                    <span className="text-m-14 tracking-[-0.04em] text-[var(--color-gray-150)]">
                        쿠폰 교환하기
                    </span>
                </div>

                {/* 카드 배경 장식 */}
                <div
                    aria-hidden
                    className="absolute top-[27px] right-[clamp(8px,8cqw,28px)] h-[90.951px] w-[123.244px] opacity-70 drop-shadow-[0_0_25.2px_rgba(236,255,225,0.30)]"
                >
                    <svg width="143" height="121" viewBox="0 0 143 121" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.7" filter="url(#filter0_d_1718_6773)">
                        <path d="M138.986 91.7616C140.095 94.2837 138.954 97.2257 136.438 98.343C138.962 97.2438 141.901 98.3927 143.011 100.915L152.374 122.207L97.4033 146.38L88.0402 125.088C86.9312 122.566 88.0721 119.622 90.5884 118.505C88.0642 119.605 85.1244 118.457 84.0151 115.935L54.7449 49.3733L109.715 25.2002L138.986 91.7616Z" fill="#00C56C" />
                        <path d="M138.986 91.7616C140.095 94.2837 138.954 97.2257 136.438 98.343C138.962 97.2438 141.901 98.3927 143.011 100.915L152.374 122.207L97.4033 146.38L88.0402 125.088C86.9312 122.566 88.0721 119.622 90.5884 118.505C88.0642 119.605 85.1244 118.457 84.0151 115.935L54.7449 49.3733L109.715 25.2002L138.986 91.7616Z" fill="url(#paint0_linear_1718_6773)" />
                        <foreignObject x="23.8" y="24.3559" width="113.814" height="123.79">
                            <div
                                style={{
                                    backdropFilter: 'blur(0.7px)',
                                    clipPath: 'url(#bgblur_0_1718_6773_clip_path)',
                                    height: '100%',
                                    width: '100%',
                                }}
                            />
                        </foreignObject>
                        <g filter="url(#filter1_i_1718_6773)" data-figma-bg-blur-radius="1.4">
                            <path d="M87.7316 146.746L74.0067 127.967C72.381 125.743 72.8613 122.623 75.0781 120.991C72.8497 122.608 69.7318 122.119 68.1057 119.895L25.2 61.1901L73.6822 25.7559L116.588 84.4608C118.213 86.685 117.733 89.8031 115.517 91.4356C117.745 89.8196 120.863 90.3088 122.489 92.533L136.214 111.312L87.7316 146.746Z" fill="#ECFFE1" fillOpacity="0.8" />
                        </g>
                        <path d="M113.999 92.2439L78.3504 118.298" stroke="white" strokeDasharray="1 1" />
                    </g>
                    <defs>
                        <filter id="filter0_d_1718_6773" x="1.14441e-05" y="0.00019455" width="177.574" height="171.946" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="12.6" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0.925531 0 0 0 0 1 0 0 0 0 0.882418 0 0 0 0.3 0" />
                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1718_6773" />
                            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1718_6773" result="shape" />
                        </filter>
                        <filter id="filter1_i_1718_6773" x="23.8" y="24.3559" width="113.814" height="123.79" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="5.35" />
                            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
                            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1718_6773" />
                        </filter>
                        <clipPath id="bgblur_0_1718_6773_clip_path" transform="translate(-23.8 -24.3559)"><path d="M87.7316 146.746L74.0067 127.967C72.381 125.743 72.8613 122.623 75.0781 120.991C72.8497 122.608 69.7318 122.119 68.1057 119.895L25.2 61.1901L73.6822 25.7559L116.588 84.4608C118.213 86.685 117.733 89.8031 115.517 91.4356C117.745 89.8196 120.863 90.3088 122.489 92.533L136.214 111.312L87.7316 146.746Z" />
                        </clipPath><linearGradient id="paint0_linear_1718_6773" x1="61.887" y1="89.6341" x2="238.121" y2="71.1519" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#ECFFE1" stopOpacity="0" />
                            <stop offset="1" stopColor="#ECFFE1" />
                        </linearGradient>
                    </defs>
                    </svg>

                </div>
        </Card>
    );
};

export default PointBox;

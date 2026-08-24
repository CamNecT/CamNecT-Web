import { type Portfolio } from "../../../types/portfolio/portfolioTypes";
import Icon from "../../../components/Icon";
import BaseSection from "./BaseSection";
import { useNavigate } from "react-router-dom";
import replaceImg from "../../../assets/image/replaceImg.png"

const REPLACE_IMAGE = replaceImg;

export default function PortfolioSection({
    portfolios,
    isEdit = false,
}: {
    portfolios: Portfolio[];
    isEdit?: boolean;
}) {
    const navigate = useNavigate();
    const handlePortfolioClick = (portfolioId: string) => {
        if (isEdit) {
            navigate(`/me/portfolio/${portfolioId}?edit=true`);
        } else {
            navigate(`/me/portfolio/${portfolioId}`);
        }
    };
    return (
        <BaseSection
            title="포트폴리오"
            right={
                <button onClick={() => navigate("/me/portfolio")}
                    className="text-R-12-hn text-gray-650 flex items-center gap-[2px]"
                >
                    전체보기
                    <Icon name="arrow_right" className="w-[10px] h-[10px] block shrink-0"/>
                </button>
            }
        >
            <div
                className={[
                "flex gap-[5px] overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                ].join(" ")}
            >
                {portfolios.length === 0 ? (
                <div className="text-R-14 text-gray-650">
                    아직 포트폴리오가 등록되지 않았어요!
                </div>
                ) : (
                portfolios.map((p) => {
                    const thumbnail = typeof p.portfolioThumbnail === "string" ? p.portfolioThumbnail : URL.createObjectURL(p.portfolioThumbnail);

                    return (
                    <button
                        key={p.portfolioId}
                        type="button"
                        className="w-[160px] shrink-0 flex flex-col justify-center items-start gap-[5px]"
                        onClick={() => handlePortfolioClick(p.portfolioId)}
                    >
                        <div className="w-[160px] h-[90px] overflow-hidden rounded-[12px] relative">
                        <img
                            src={thumbnail}
                            alt={p.title}
                            onError={(e) => {
                                e.currentTarget.onerror = null; //이미지 깨짐 방지
                                e.currentTarget.src = REPLACE_IMAGE;
                            }}
                            className="h-full w-full object-cover"
                        />

                        {isEdit && (
                            <>
                                <div className="absolute inset-0 bg-black/60"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                        <path d="M28.1033 7.47838L30.915 4.66505C31.5011 4.07892 32.2961 3.74963 33.125 3.74963C33.9539 3.74963 34.7489 4.07892 35.335 4.66505C35.9211 5.25117 36.2504 6.04614 36.2504 6.87505C36.2504 7.70396 35.9211 8.49892 35.335 9.08505L17.6367 26.7834C16.7555 27.664 15.6689 28.3113 14.475 28.6667L10 30L11.3333 25.525C11.6888 24.3311 12.3361 23.2445 13.2167 22.3634L28.1033 7.47838ZM28.1033 7.47838L32.5 11.875M30 23.3334V31.25C30 32.2446 29.6049 33.1984 28.9017 33.9017C28.1984 34.605 27.2446 35 26.25 35H8.75C7.75544 35 6.80161 34.605 6.09835 33.9017C5.39509 33.1984 5 32.2446 5 31.25V13.75C5 12.7555 5.39509 11.8017 6.09835 11.0984C6.80161 10.3951 7.75544 10 8.75 10H16.6667" 
                                            stroke="white" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </>
                        )}
                        </div>

                        <div className="w-full text-left px-[10px] text-M-14 text-gray-750 truncate">{p.title}</div>
                    </button>
                    );
                })
                )}
            </div>
        </BaseSection>
    );
}

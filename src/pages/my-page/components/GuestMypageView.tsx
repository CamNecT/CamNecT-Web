import { useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultProfileImg from "../../../assets/image/defaultProfileImg.png";
import Button from "../../../components/Button";
import GuestLoginModal from "../../../components/guest/GuestLoginModal";
import { FullLayout } from "../../../layouts/FullLayout";
import { MainHeader } from "../../../layouts/headers/MainHeader";
import InfoSection from "./InfoSection";
import PortfolioSection from "./PortfolioSection";

// 비회원 마이페이지
export const GuestMypageView = () => {
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const openLoginModal = () => setIsLoginModalOpen(true);

    return (
        <>
            <FullLayout
                headerSlot={
                <MainHeader
                    title="마이페이지"
                    // 회원 마이페이지와 같은 위치의 메뉴 아이콘 (사이드바 기능이 모두 회원 전용이라 로그인 안내)
                    leftAction={{ icon: "menu", onClick: openLoginModal, ariaLabel: "메뉴" }}
                />
                }
            >
                <div className="w-full bg-white border-t border-gray-150">
                    {/* 프로필 */}
                    <section className="px-[25px] pt-[40px] pb-[33px] flex flex-col gap-[20px]">
                        <div className="flex flex-1 flex-col gap-[22px]">
                            <div className="w-full flex items-start gap-[33px]">
                                <img
                                src={defaultProfileImg}
                                alt="기본 프로필"
                                className="h-[84px] w-[84px] shrink-0 rounded-full object-cover"
                                />
                                <div className="w-full flex flex-col gap-[6px] pt-[17px]">
                                    <div className="text-B-18-hn text-gray-900">CamNect</div>
                                    <div className="text-R-12-hn text-gray-750">전공 미입력</div>
                                </div>
                            </div>

                            <div className="flex flex-1 items-start">
                                <button
                                    type="button"
                                    className="flex flex-col justify-center items-start gap-[7px] pl-[3px] pt-[3px] min-w-[51px]"
                                    onClick={openLoginModal}
                                >
                                    <div className="flex justify-start items-align gap-[3px]">
                                        <span className="text-R-14-hn text-gray-900">팔로잉</span>
                                        <span className="text-SB-14-hn text-gray-900">0</span>
                                    </div>
                                    <div className="flex justify-start items-align gap-[3px] w-[117px]">
                                        <span className="text-R-14-hn text-gray-900">팔로워</span>
                                        <span className="text-SB-14-hn text-gray-900">0</span>
                                    </div>
                                </button>

                                <p className="min-h-[63px] leading-[1.5] text-R-14 text-gray-650">
                                    아직 자기소개가 입력되지 않았습니다.
                                </p>
                            </div>
                        </div>
                        <Button
                            label="로그인 페이지로 이동"
                            font="SB-14-hn"
                            className="h-[40px] max-w-none rounded-[6px] bg-gray-900"
                            onClick={() => navigate("/login")}
                        />
                    </section>

                    {/*divider*/}
                    <div className="w-full h-[10px] bg-gray-150"/>

                    <div className="flex flex-col gap-[30px] py-[30px] px-[25px]">
                        <PortfolioSection portfolios={[]} onViewAll={openLoginModal} />
                        <InfoSection type="education" items={[]} isEdit={false} />
                        <InfoSection type="career" items={[]} isEdit={false} />
                        <InfoSection type="certificate" items={[]} isEdit={false} />
                    </div>
                </div>
            </FullLayout>

            <GuestLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
};

export default GuestMypageView;
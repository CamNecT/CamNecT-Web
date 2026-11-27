import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import GuestLoginModal from '../../../components/guest/GuestLoginModal';
import Icon from '../../../components/Icon';
import { TermsModal } from '../../../components/TermsModal';
import { Logo } from '../../../layouts/headers/HomeHeader';
import CommunityBox from './CommunityBox';
import ContestBox, { type Contest } from './ContestBox';
import PointBox from './PointBox';

const activityPath = '/activity?tab=external';

const previewLinks = [
    {
        to: '/community?tab=info',
        title: '정보게시판 둘러보기',
        description: '동문들의 다양한 정보글을 확인할 수 있어요',
    },
    {
        to: activityPath,
        title: '대외활동 둘러보기',
        description: '관심 있는 활동을 함께할 팀원을 찾아보세요',
    },
];

export const GuestHomeView = ({ contests }: { contests: Contest[] }) => {
    const navigate = useNavigate();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [activeTerms, setActiveTerms] = useState<'service' | 'privacy' | null>(null);
    const openLogin = () => setIsLoginOpen(true);

    return (
        <>
            <section className="bg-primary px-[25px] pb-[70px] pt-[22px]">
                <div className="flex items-center justify-between">
                    <span role="img" aria-label="캠넥트 로고" className="text-white [&_svg]:h-[27px] [&_svg]:w-[128px] [&_path]:fill-white">
                        <Logo />
                    </span>
                    <button type="button" aria-label="알림" onClick={openLogin} className="-my-3 -mr-3 grid size-12 place-items-center rounded-[5px] text-white active:bg-white/15">
                        <Icon name="bell_notification" size={24} />
                    </button>
                </div>
                <div className="mt-[36px] flex flex-col gap-1 px-[5px]">
                    <h1 className="text-b-20 text-white">캠퍼스 그 이상의 연결, 캠넥트</h1>
                    <p className="text-r-16 text-[#F0F0F0]">비회원은 일부 콘텐츠 열람이 제한될 수 있어요</p>
                </div>
            </section>

            <div className="relative -mt-[32px] flex flex-col gap-[20px] px-[25px]">
                <Card width="100%" height="auto" className="flex flex-col gap-[20px] rounded-[15px] border-[#E4E4E4] px-[22px] py-[20px]">
                    <h2 className="text-sb-18 text-gray-900">캠넥트를 미리 만나보세요</h2>
                    <div className="flex flex-col gap-[17px] px-[6px]">
                        {previewLinks.map(({ to, title, description }) => (
                            <Link key={to} to={to} className="flex min-h-11 items-center justify-between gap-2">
                                <span className="flex min-w-0 flex-col gap-[3px]">
                                    <span className="text-sb-14 text-gray-900">{title}</span>
                                    <span className="text-r-12 text-gray-750">{description}</span>
                                </span>
                                <Icon name="arrow_right" size={24} color="#A1A1A1" className="shrink-0" />
                            </Link>
                        ))}
                    </div>
                    <Button
                        type="button"
                        label="로그인하고 캠넥트 시작하기"
                        font="sb-14"
                        className="h-10 max-w-none rounded-[7px] bg-gray-900"
                        onClick={() => navigate('/login')}
                    />
                </Card>
                <div className="flex gap-[20px]">
                    {/* 비회원 응답의 포인트는 null이므로 쿠폰 진입만 보여준다. */}
                    <PointBox points={null} onClick={openLogin} />
                    <CommunityBox />
                </div>
            </div>

            <section className="px-[25px] pt-[40px]">
                <ContestBox
                    contests={contests}
                    onTitleClick={() => navigate(activityPath)}
                    onItemClick={(contest) => navigate(`/activity/external/${contest.id}`)}
                    onMoreClick={() => navigate(activityPath)}
                />
            </section>

            <footer className="flex flex-wrap justify-center gap-x-[12px] px-[25px] pb-[35px] pt-[70px] text-r-12 text-gray-750">
                <button type="button" className="min-h-11" onClick={() => setActiveTerms('service')}>이용약관</button>
                <button type="button" className="min-h-11" onClick={() => setActiveTerms('privacy')}>개인정보처리방침</button>
                <a className="inline-flex min-h-11 items-center" href="https://forms.gle/pS8UMuVxyCAYbMVB6" target="_blank" rel="noreferrer">고객지원</a>
            </footer>

            {activeTerms && <TermsModal isOpen type={activeTerms} onClose={() => setActiveTerms(null)} />}
            <GuestLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
};

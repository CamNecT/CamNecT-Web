import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PortfolioEditModal from './components/PortfolioEditModal';
import BottomSheetModal from '../../components/BottomSheetModal/BottomSheetModal';
import ModalIcon from '../../components/BottomSheetModal/Icon';
import PopUp from '../../components/Pop-up';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPortfolioDetail, togglePortfolioFavorite, togglePortfolioPublic, deletePortfolio } from '../../api/portfolioApi';
import type { PortfolioAsset } from '../../api-types/portfolioApiTypes';
import defaultProfileImg from "../../assets/image/defaultProfileImg.png";
import replaceImg from "../../assets/image/replaceImg.png";
import { getFileName } from '../../utils/getFileName';

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;
const REPLACE_IMAGE = replaceImg;

type PortfolioDetailPageProps = {
    ownerId?: string | number;
    isMine?: boolean;
    portfolioId?: string | number;
};

export const PortfolioDetailPage = ({
    ownerId: ownerIdProp,
    isMine: isMineProp,
    portfolioId: portfolioIdProp,
}: PortfolioDetailPageProps) => {
    const authUser = useAuthStore(state => state.user);
    const meUserId = authUser?.id ? parseInt(authUser.id) : null;

    const [searchParams] = useSearchParams();
    const ownerIdParam = searchParams.get('ownerId');
    const portfolioUserId: number = 
        (typeof ownerIdProp === 'number' ? ownerIdProp : (ownerIdProp ? parseInt(ownerIdProp) : null)) ??
        (ownerIdParam ? parseInt(ownerIdParam) : meUserId) ?? 
        0;

    const isMineParam = searchParams.get('isMine');
    const isMine = isMineProp ?? (isMineParam ? isMineParam === 'true' : portfolioUserId === meUserId);

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { portfolioId: portfolioIdParam } = useParams();
    const portfolioId: number | null = 
        (typeof portfolioIdProp === 'number' ? portfolioIdProp : (portfolioIdProp ? parseInt(portfolioIdProp) : null)) ??
        (portfolioIdParam ? parseInt(portfolioIdParam) : null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(() => 
        new URLSearchParams(window.location.search).get('edit') === 'true'
    );
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('edit') === 'true') {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['portfolioDetail', portfolioUserId, portfolioId],
        queryFn: () => getPortfolioDetail(meUserId!, portfolioUserId, portfolioId!),
        enabled: !!meUserId && !!portfolioId,
    });

    const isMineAPI = data?.data.isMine ?? isMine;
    const author = data?.data.data.author ?? null;
    const portfolio = data?.data.data.portfolio ?? null;
    const assets = data?.data.data.portfolioAssets ?? [];

    // 작성자 정보 (fallback 처리)
    const resolvedAuthor = author ?? {
        name: "알 수 없음",
        profileImageUrl: DEFAULT_PROFILE_IMAGE,
        majorName: "",
        studentNo: "",
    };

    //asset 타입 분류 (type 필드로 구분)
    const imageAssets = useMemo(() => 
        assets.filter((a: PortfolioAsset) => 
            a.type.startsWith('image/')
        ).sort((a, b) => a.sortOrder - b.sortOrder),
        [assets]
    );

    const pdfAssets = useMemo(() => 
        assets.filter((a: PortfolioAsset) => 
            a.type === 'application/pdf'
        ).sort((a, b) => a.sortOrder - b.sortOrder),
        [assets]
    );

    // 날짜 파싱 
    const parseDate = (dateStr: string) => {
        const [year, month] = dateStr.split('-').map(Number);
        return { year, month };
    };

    const handleTogglePublic = async () => {
        if (!portfolio || !meUserId) return;
        setIsMenuOpen(false);
        await togglePortfolioPublic(meUserId, portfolioUserId, portfolio.portfolioId);
        queryClient.invalidateQueries({ queryKey: ['portfolioDetail', portfolioUserId, portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolioList', portfolioUserId] });
    };

    const handleToggleFavorite = async () => {
        if (!portfolio || !meUserId) return;
        setIsMenuOpen(false);
        await togglePortfolioFavorite(meUserId, portfolioUserId, portfolio.portfolioId);
        queryClient.invalidateQueries({ queryKey: ['portfolioDetail', portfolioUserId, portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolioList', portfolioUserId] });
    };

    const handleDelete = async () => {
        if (!portfolio || !meUserId) return;
        await deletePortfolio(meUserId, portfolioUserId, portfolio.portfolioId);
        queryClient.invalidateQueries({ queryKey: ['portfolioList', portfolioUserId] });
        navigate(-1);
    };

    const handleSave = () => {
        queryClient.invalidateQueries({ queryKey: ['portfolioDetail', portfolioUserId, portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolioList', portfolioUserId] });
        setIsModalOpen(false);
    };

    // 로딩 중
    if (isLoading) {
        return (
            <PopUp
                type="loading"
                isOpen={true}
            />
        );
    }

    // 에러 발생
    if (isError) {
        return (
            <PopUp
                type="error"
                title="일시적 오류"
                content="잠시 후 다시 시도해주세요."
                isOpen={true}
                rightButtonText='확인'
                onClick={() => window.location.reload()}
            />
        );
    }

    // 데이터 없음
    if (!portfolio) {
        return (
            <PopUp
                type="error"
                title='포트폴리오를 찾을 수 없습니다'
                content='요청하신 포트폴리오가 존재하지 않습니다.'
                isOpen={true}
                rightButtonText='돌아가기'
                onClick={() => navigate(-1)}
            />
        );
    }

    if (!isMineAPI && !portfolio.isPublic) {
        return (
            <PopUp
                type="confirm"
                title='이 포트폴리오는 비공개로 설정되어 있습니다'
                content='작성자가 내용을 수정 중이거나\n비공개로 설정하여 상세 내용을 보실 수 없습니다.'
                isOpen={true}
                buttonText='확인'
                onClick={() => navigate(-1)}
            />
        );
    }

    const startDate = parseDate(portfolio.startDate);
    const endDate = parseDate(portfolio.endDate);

    return (
        <div className="min-h-dvh bg-white">
            <HeaderLayout
                headerSlot = {
                    <MainHeader
                        title={portfolio.title}
                        rightActions={
                            isMine
                                ? [{icon: "more_menu", onClick: () => setIsMenuOpen(true), style: { width: 18, height: 18 },}]
                                : []
                        }
                    />
                }
            >
                <div className="w-full h-full">
                    {/* 콘텐츠 */}
                    <div className="border-t border-gray-150 pb-[20px]">
                        {/* 작성자 정보 */}
                            <div className="px-[25px] py-[20px] flex items-center gap-[15px]">
                                {resolvedAuthor.profileImageUrl && (
                                    <img
                                        src={resolvedAuthor.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                                        alt={resolvedAuthor.name}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null; //이미지 깨짐 방지
                                            e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                                        }}
                                        className="w-[40px] h-[40px] rounded-full object-cover"
                                    />
                                )}
                                <div className = "flex flex-col gap-[6px] flex-1">
                                    <div className="text-b-18-hn text-gray-900">{resolvedAuthor.name}</div>
                                    <div className="text-r-14-hn text-gray-750">
                                        {resolvedAuthor.majorName} {resolvedAuthor.studentNo ? `${resolvedAuthor.studentNo.slice(2,4)}학번` : ""}
                                    </div>
                                </div>
                            </div>

                            <div className="px-[25px] pb-[40px] flex flex-col gap-[20px]">
                                {/* 제목 및 내용 */}
                                <div className="flex flex-col gap-[15px]">
                                    <span className="text-sb-16-hn text-gray-900 whitespace-pre-line break-keep [overflow-wrap:anywhere]">{portfolio.title}</span>
                                    <div className="text-r-14 text-gray-750 whitespace-pre-wrap break-keep [overflow-wrap:anywhere]">
                                        {portfolio.description}
                                    </div>
                                </div>

                                {/* 프로젝트 정보 */}
                                <div className="flex flex-col gap-[7px]">
                                    {/* 프로젝트 기간 */}
                                    <div className="flex items-center gap-[10px]">
                                        <span className="text-m-14-hn text-gray-750 min-w-[77px]">프로젝트 기간</span>
                                        <span className="text-r-12-hn text-gray-650">
                                            {startDate.year}.{String(startDate.month).padStart(2, '0')} - {endDate.year}.{String(endDate.month).padStart(2, '0')}
                                        </span>
                                    </div>

                                    {/* 프로젝트 역할 */}
                                    <div className="flex items-center gap-[10px]">
                                        <span className="text-m-14-hn text-gray-750 min-w-[77px]">프로젝트 역할</span>
                                        <span className="text-r-12-hn text-gray-650 whitespace-pre-line break-keep [overflow-wrap:anywhere]">{portfolio.assignedRole[0] || ""}</span>
                                    </div>

                                    {/* 사용 기술 */}
                                    <div className="flex items-center gap-[10px]">
                                        <span className="text-m-14-hn text-gray-750 min-w-[77px]">사용 기술</span>
                                        <span className="text-r-12-hn text-gray-650 whitespace-pre-line break-keep [overflow-wrap:anywhere]">{portfolio.techStack[0] || ""}</span>
                                    </div>
                                </div>
                            </div>

                    {/* 대표이미지 */}
                    <div className="flex flex-col gap-[3px]">
                            <div>
                                <img
                                    src={portfolio.thumbnailUrl ?? REPLACE_IMAGE}
                                    alt={portfolio.title}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null; //이미지 깨짐 방지
                                        e.currentTarget.src = REPLACE_IMAGE;
                                    }}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        {imageAssets.length > 0 && (
                            <div className="flex flex-col gap-[3px]">
                                {imageAssets.map((asset: PortfolioAsset) => (
                                    <img
                                        key={asset.assetId}
                                        src={asset.fileUrl}
                                        alt={`Portfolio asset ${asset.assetId}`}
                                        className="w-full h-full object-cover"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-full px-[10px] py-[10px] flex flex-col gap-[8px]">
                        {/* PDF 파일 목록 */}
                        {pdfAssets.length > 0 && (
                            <div className="w-full flex flex-col gap-[8px]">
                                {pdfAssets.map((asset: PortfolioAsset) => (
                                    <a
                                        key={asset.assetId}
                                        href={asset.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-[10px] p-[15px] bg-gray-100 rounded-[10px] text-r-14-hn text-gray-750"
                                    >
                                        <ModalIcon name='folder' className='w-[20px] h-[20px]' />
                                        <span className="flex-1 text-r-14-hn text-gray-750 truncate">
                                            {getFileName(asset.fileUrl) || '첨부파일'}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Problem & Solution */}
                    {portfolio.review && (
                    <div>
                        <div className="w-full h-[10px] mt-[40px] mb-[30px] bg-gray-300"/>
                        <div className="px-[25px] flex flex-col gap-[8px]">
                            <span className="text-m-14-hn text-gray-750">Problem & Solution</span>
                            <div className="text-r-12 text-gray-650 whitespace-pre-wrap break-keep [overflow-wrap:anywhere]">
                                {portfolio.review}
                            </div>
                        </div>
                    </div>
                    )}
                    </div>
                </div>
            </HeaderLayout>

            {/* 수정 모달 */}
            {isMineAPI && isModalOpen && (
                <PortfolioEditModal
                    key={`edit-${portfolioId}`}
                    isOpen={true}
                    onClose={() => setIsModalOpen(false)}
                    userId={portfolioUserId}
                    portfolioId={portfolioId!}
                    onSave={handleSave}
                />
            )}

            {/* 메뉴 BottomModal */}
            {isMine && (
                <>
                    <BottomSheetModal
                        isOpen={isMenuOpen}
                        onClose={() => setIsMenuOpen(false)}
                        height="auto"
                    >
                        <div className="px-[25px] pb-[40px]">
                            {/* 프로젝트 수정 */}
                            <button
                                onClick={() => {setIsMenuOpen(false); setIsModalOpen(true);}}
                                className="w-full flex items-center gap-[15px] pl-[10px] py-[15px] border-b border-gray-200"
                            >
                                <ModalIcon name='writing'/>
                                <span className="text-m-16-hn text-gray-750">프로젝트 수정</span>
                            </button>

                            {/* 프로젝트 비공개 */}
                            <button
                                onClick={handleTogglePublic}
                                className="w-full flex items-center gap-[15px] pl-[10px] py-[15px] border-b border-gray-150"
                                >
                                    <ModalIcon name={portfolio.isPublic ? "visible_off" : "visible"} />
                                    <span className="text-m-16-hn text-gray-750">
                                        {portfolio.isPublic ? "프로젝트 비공개" : "프로젝트 공개"}
                                    </span>
                            </button>


                            {/* 주요 프로젝트 지정 및 해제 */}
                            <button
                                onClick={handleToggleFavorite}
                                className="w-full flex items-center gap-[15px] pl-[10px] py-[15px] border-b border-gray-150"
                            >
                                <ModalIcon name='favorites_stroke'/>
                                <span className="text-m-16-hn text-gray-750">{portfolio.isFavorite ? "주요 프로젝트 지정 해제" : "주요 프로젝트로 지정"}</span>
                            </button>

                            {/* 삭제 */}
                            <button
                                onClick={() => {setIsMenuOpen(false); setShowDeleteWarning(true);}}
                                className="w-full flex items-center gap-[15px] pl-[10px] py-[15px]"
                            >
                                <ModalIcon name='trash' className='text-red'/>
                                <span className="text-m-16-hn text-red">삭제</span>
                            </button>
                        </div>
                    </BottomSheetModal>

                    {showDeleteWarning && (
                        <PopUp
                            type="warning"
                            title='포트폴리오를 삭제하시겠습니까?'
                            content='삭제할 시 복구할 수 없습니다.'
                            isOpen={true}
                            leftButtonText='삭제하기'
                            onLeftClick={() => {
                                setShowDeleteWarning(false);
                                handleDelete();
                            }}
                            onRightClick={() => setShowDeleteWarning(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
}

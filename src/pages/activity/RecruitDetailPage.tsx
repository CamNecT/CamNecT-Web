import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applyRecruitment, closeRecruitment, getRecruitmentDetail, toggleRecruitmentBookmark } from '../../api/activityApi';
import defaultProfileImg from "../../assets/image/defaultProfileImg.png";
import BottomSheetModal from '../../components/BottomSheetModal/BottomSheetModal';
import BottomSheetIcon from '../../components/BottomSheetModal/Icon';
import Icon from '../../components/Icon';
import PopUp from '../../components/Pop-up';
import SaveToggle from '../../layouts/BottomChat/components/SaveToggle';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { formatOnlyDate, formatTimeAgo } from '../../utils/formatDate';
import TeamApplyModal from './components/TeamApplyModal';

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;

type OptionId = 'copy-url' | 'report-post' | 'edit-post';

type OptionItem = {
    id: OptionId;
    icon: 'writing' | 'link' | 'report';
    label: string;
};

export const RecruitDetailPage = () => {
    const { recruitId } = useParams<{recruitId: string}>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const authUser = useAuthStore((state) => state.user);
    
    const userId = authUser?.id ? parseInt(authUser.id) : null;
    const recruitmentId = recruitId ? parseInt(recruitId) : null;

    const [isOptionOpen, setIsOptionOpen] = useState(false);
    const [isStopRecruitPopupOpen, setIsStopRecruitPopupOpen] = useState(false);
    const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isDuplicateApplyPopup, setIsDuplicateApplyPopup] = useState(false);
    const [isApplyFailPopupOpen, setIsApplyFailPopupOpen] = useState(false);
    const [isApplySuccessPopupOpen, setIsApplySuccessPopupOpen] = useState(false);

    const getHttpStatus = (err: unknown): number | undefined => {
        if (axios.isAxiosError(err)) return err.response?.status;
        return undefined;
    };

    //상세 조회
    const {
        data: detailResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['recruitmentDetail', recruitmentId],
        queryFn: () => getRecruitmentDetail(userId!, recruitmentId!),
        enabled: !!userId && !!recruitmentId,
    });

    const recruitDetail = detailResponse?.data;
    const [isBookmarked, setIsBookmarked] = useState(recruitDetail?.isBookmarked ?? false);

    //북마크 상태 동기화
    useState(() => {
        if (recruitDetail) setIsBookmarked(recruitDetail.isBookmarked);
    });

    //북마크 토글
    const bookmarkMutation = useMutation({
        mutationFn: () => toggleRecruitmentBookmark(userId!, recruitmentId!),
        onMutate: () => {
            setIsBookmarked((prev) => !prev);
        },
        onError: () => {
            setIsBookmarked((prev) => !prev);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recruitmentDetail', recruitmentId] });
        },
    });

    //모집 중지
    const closeMutation = useMutation({
        mutationFn: () => closeRecruitment(userId!, recruitmentId!),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recruitmentDetail', recruitmentId] });
    },
  });

    //팀원 신청
    const applyMutation = useMutation({
        mutationFn: (content: string) =>
        applyRecruitment(userId!, recruitmentId!, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recruitmentDetail', recruitmentId] });
        },
        onError: (error: unknown) => {
            // 400 에러: 이미 지원한 경우
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number } };
                if (axiosError.response?.status === 400) {
                setIsDuplicateApplyPopup(true);
                }
            }
        },
    });

    if (isLoading) {
        return (
            <PopUp
                type="loading"
                isOpen={true}
            />
        );
    }

    if (isError || !recruitDetail) {
        return (
            <PopUp
                type="error"
                title="일시적 오류"
                content="잠시 후 다시 시도해주세요."
                isOpen={true}
                rightButtonText="확인"
                onClick={() => navigate(-1)}
            />
        );
    }

    const { recruitment, isMine  } = recruitDetail;
    const isRecruitNow = recruitment.recruitStatus === 'RECRUITING';

    const optionItems: OptionItem[] = isMine
        ? [
            { id: 'edit-post', icon: 'writing', label: '게시글 수정' },
        ]
        : [
            { id: 'copy-url', icon: 'link', label: 'URL 복사' },
            { id: 'report-post', icon: 'report', label: '게시글 신고' },
        ];

    const handleOptionClick = async (item: OptionItem) => {
        if (item.id === 'copy-url') {
            const postUrl = `${window.location.origin}/activity/team-recruit/${recruitmentId}`;
            try {
                await navigator.clipboard.writeText(postUrl);
            } catch {
                const textarea = document.createElement('textarea');
                textarea.value = postUrl;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
        }
        if (item.id === 'report-post') setIsReportPopupOpen(true);
        if (item.id === 'edit-post') {
            navigate(`/activity/${recruitment.activityId}/recruit-write/${recruitmentId}`);
        }
        setIsOptionOpen(false);
    };

    const statusLabel = isRecruitNow ? '모집 중' : '모집 완료';
    const activityName = recruitDetail.activityTitle;

    return (
        <HeaderLayout
            headerSlot={
                <MainHeader
                    title='팀원 모집'
                    rightActions={[
                        { icon: 'more_menu', onClick: () => setIsOptionOpen(true), ariaLabel: '게시글 옵션 열기' },
                    ]}
                />
            }
        >
        <div className='flex w-full justify-center bg-white pb-[70px]'>
            <div className='flex w-full flex-col'>
                <section className='flex flex-col gap-[30px] px-[25px] pt-[25px]'>
                    {/* 모집 상태 배지 & 제목 */}
                    <div className='flex flex-col items-start gap-[15px]'>
                        <div
                            className={`inline-flex min-w-[68px] items-center justify-center rounded-full border px-[12px] py-[4px] text-r-16-hn ${
                            isRecruitNow
                                ? 'border-primary text-primary'
                                : 'border-gray-650 text-gray-650'
                            }`}
                        >
                            {statusLabel}
                        </div>
                        <div className='flex flex-col gap-[13px] w-full'>
                            <div className='text-b-24-hn text-gray-900'>
                                {recruitment.title}
                            </div>
                            <div className="flex items-center gap-[5px] text-r-12-hn text-gray-650">
                                <div className="flex items-center gap-[2px]">
                                    <Icon name='bookmark_stroke' className='w-[12px] h-[12px]'/>
                                    <span>{recruitment.bookmarkCount}</span>
                                </div>
                                <span>|</span>
                                <span>{formatTimeAgo(recruitment.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 작성자 정보 */}
                    <div className='flex justify-between gap-[10px] border-b border-gray-150 pb-[15px]'>
                        <button
                            type='button'
                            disabled={isMine}
                            className='flex items-center text-left'
                            onClick={() =>
                                navigate(`/alumni/profile/${recruitment.userId}`, {
                                    state: {
                                        author: {
                                                name: recruitDetail.author.name,
                                                major: recruitDetail.author.majorName,
                                                studentId: recruitDetail.author.studentNo,
                                                profileImageUrl: recruitDetail.author.profileImageUrl,
                                        },
                                    },
                                })
                            }
                        >
                            <div className='flex items-center gap-[10px]'>
                                <div className='h-[32px] w-[32px] rounded-full overflow-hidden'>
                                    <img 
                                        src={recruitDetail.author.profileImageUrl ?? DEFAULT_PROFILE_IMAGE}
                                        alt={`${recruitDetail.author.name} 프로필`}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null; //이미지 깨짐 방지
                                            e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                                        }}
                                        className='h-full w-full object-cover'
                                    />
                                </div>
                                <div className='flex flex-col gap-[3px]'>
                                    <div className='text-b-14-hn text-gray-900'>
                                        {recruitDetail.author.name}
                                    </div>
                                    <div className='text-r-12-hn text-gray-750'>
                                        {recruitDetail.author.majorName} {recruitDetail.author.studentNo.slice(2,4)}학번
                                    </div>
                                </div>
                            </div>
                        </button>
                        {!isMine && (<button
                            className='inline-flex items-center justify-center rounded-[10px] border border-primary p-[10px] text-m-12-hn text-primary break-keep'
                            onClick={() =>
                                navigate(`/alumni/profile/${recruitment.userId}?coffeeChat=1`, {
                                    state: {
                                        author: {
                                            name: recruitDetail.author.name,
                                            major: recruitDetail.author.majorName,
                                            studentId: recruitDetail.author.studentNo,
                                            profileImageUrl: recruitDetail.author.profileImageUrl,
                                        },
                                    },
                                })
                            }
                        >
                            커피챗 보내기
                        </button>)}
                    </div>

                    <div className='flex flex-col gap-[12px] py-[10px]'>
                        <div className='flex'>
                            <span className='min-w-[100px] text-sb-16-hn text-gray-750'>공고</span>
                            <button
                                className='text-r-16-hn text-primary underline text-left'
                                onClick={() => navigate(`/activity/external/${recruitment.activityId}`)}
                            >
                                {activityName}
                            </button>
                        </div>

                        {/* 모집 정보 */}
                        <div className='flex text-gray-750'>
                            <span className='min-w-[100px] text-sb-16-hn'>
                            모집 마감일
                            </span>
                            <span className='text-r-16-hn'>
                            {formatOnlyDate(recruitment.recruitDeadline)}
                            </span>
                        </div>
                        <div className='flex text-gray-750'>
                            <span className='min-w-[100px] text-sb-16-hn'>
                                모집 인원
                            </span>
                            <span className='text-r-16-hn'>
                                {recruitment.recruitCount}인
                            </span>
                        </div>
                    </div>

                    {/* 모집 내용 */}
                    <div className='flex py-[20px]'>
                        <p className='text-r-16 text-gray-750 whitespace-pre-line'>
                            {recruitment.content}
                        </p>
                    </div>
                </section>
            </div>
        </div>

        {/* 하단 버튼 */}
        <div className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-150 shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)]'>
            <div
                className='mx-auto flex w-full max-w-[720px] items-center gap-[15px] px-[25px] pt-[15px] pb-[calc(15px+env(safe-area-inset-bottom,0px))]'
            >
                {isRecruitNow ? (
                    isMine ? (
                        <button
                            type="button"
                            onClick={() => setIsStopRecruitPopupOpen(true)}
                            className="flex-1 py-[15px] rounded-[10px] bg-[#FFEFEF] text-red text-sb-16-hn active:scale-95 active:brightness-95 transition"
                        >
                            모집 완료하기
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsApplyModalOpen(true)}
                            className="flex-1 py-[15px] rounded-[10px] bg-primary text-white text-sb-16-hn active:scale-95 active:brightness-95 transition"
                        >
                            팀원 신청하기
                        </button>
                    )
                ) : (
                    <button
                        type="button"
                        disabled
                        className="flex-1 py-[15px] rounded-[10px] bg-gray-650 text-white text-sb-16-hn"
                    >
                        팀원 모집 종료
                    </button>
                )}

                <div className='flex shrink-0 items-center'>
                    <SaveToggle width={24} height={24} isActive={isBookmarked} onToggle={() => bookmarkMutation.mutate()} />
                </div>
            </div>
        </div>

        <BottomSheetModal isOpen={isOptionOpen} onClose={() => setIsOptionOpen(false)} height='auto'>
            <div className='flex min-h-[150px] flex-col px-[clamp(16px,6vw,25px)] pt-[30px]'>
                <div className='flex flex-col divide-y divide-gray-150'>
                    {optionItems.map((item) => (
                        <button
                            key={item.id}
                            type='button'
                            onClick={() => handleOptionClick(item)}
                            className='flex items-center gap-[15px] py-[15px] text-left'
                        >
                            <BottomSheetIcon name={item.icon} />
                            <span className='text-m-16-hn text-gray-750'>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </BottomSheetModal>

        <PopUp
            isOpen={isStopRecruitPopupOpen}
            type='info'
            title='모집을 완료하시겠습니까?'
            content={'모집 완료 후에는 다시 모집 중 상태로\n변경할 수 없습니다.'}
            onLeftClick={() => setIsStopRecruitPopupOpen(false)}
            onRightClick={() => {
                setIsStopRecruitPopupOpen(false);
                closeMutation.mutate();
            }}
        />

        <PopUp
            isOpen={isReportPopupOpen}
            type='confirm'
            title='현재 제작 중이에요!'
            content='유저분들이 더 즐겁게 소통할 수 있도록\n꼼꼼히 준비해서 돌아올게요.'
            onClick={() => setIsReportPopupOpen(false)}
        />

        <PopUp
            isOpen={isDuplicateApplyPopup}
            type='confirm'
            title='이미 신청하셨습니다!'
            content='중복 신청은 불가능합니다.'
            onClick={() => setIsDuplicateApplyPopup(false)}
        />

        <PopUp
            isOpen={isApplyFailPopupOpen}
            type="confirm"
            title="신청 실패"
            content="잠시 후 다시 시도해 주세요."
            onClick={() => setIsApplyFailPopupOpen(false)}
        />

        <PopUp
            isOpen={isApplySuccessPopupOpen}
            type="confirm"
            title="신청 성공"
            content="팀원 모집 신청이 발송되었습니다."
            onClick={() => setIsApplySuccessPopupOpen(false)}
        />

        <TeamApplyModal
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            activityName={activityName}
            onSubmit={async (payload) => {
                try {
                    await applyMutation.mutateAsync(payload.message);
                    setIsApplySuccessPopupOpen(true);
                    return true;
                } catch (e: unknown) {
                    const status = getHttpStatus(e);
                    if (status === 400) {
                        setIsDuplicateApplyPopup(true);
                        return false;
                    }
                    setIsApplyFailPopupOpen(true);
                    return false;
                }
            }}
        />
        </HeaderLayout>
    );
};

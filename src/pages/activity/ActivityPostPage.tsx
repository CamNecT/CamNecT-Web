import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Category from '../../components/Category';
import BottomSheetIcon from '../../components/BottomSheetModal/Icon';
import PopUp from '../../components/Pop-up';
import BottomSheetModal from '../../components/BottomSheetModal/BottomSheetModal';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import BottomReact from './components/BottomReact';
import type { ActivityPostStatus } from '../../types/activityPage/activityPageTypes';
import { formatPostDisplayDate } from './utils/post';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTags, getActivityDetail, deleteActivity, toggleActivityBookmark, closeActivity } from '../../api/activityApi';
import { mapDetailToActivityPost } from './utils/activityMapper';
import defaultProfileImg from "../../assets/image/defaultProfileImg.png"
import ImagePopUp from '../../components/ImagePopUp';
import ReportModal from '../../components/report/ReportModal';

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;

type OptionId = 'copy-url' | 'report-post' | 'edit-post' | 'delete-post';

type OptionItem = {
  id: OptionId;
  icon: 'writing' | 'trash' | 'link' | 'report';
  label: string;
};

const ActivityPostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const userRole = authUser?.role;
  const isAdmin = userRole === 'ADMIN';
  const userId = authUser?.id ? parseInt(authUser.id) : null;
  const activityId = postId ? parseInt(postId) : null;

  const { data: detailResponse, isLoading, isError } = useQuery({
    queryKey: ['activityDetail', activityId],
    queryFn: () => getActivityDetail(userId!, activityId!),
    enabled: !!userId && !!activityId,
  });

  const { data: tagData } = useQuery({
    queryKey: ['tags', 'DEFAULT'],
    queryFn: () => getTags('DEFAULT'),
    staleTime: 1000 * 60 * 10,
  });

  const tagIdToNameMap = useMemo(() => {
    const map = new Map<number, string>();
    tagData?.data.forEach(cat =>
      cat.tags.forEach(tag => map.set(tag.id, tag.name))
    );
    return map;
  }, [tagData]);

  if (isLoading || !tagData) {
    return (
      <PopUp
        type="loading"
        isOpen={true}
      />
    );
  }

  if (isError || !detailResponse?.data) {
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

  const selectedPost = mapDetailToActivityPost(detailResponse.data, tagIdToNameMap);

  return (
    <ActivityPostContent 
      key={selectedPost.id} 
      selectedPost={selectedPost}
      isMine={detailResponse.data.isMine}
      isAdmin={isAdmin}
      activityId={activityId!}
      userId={userId!}
      initialIsBookmarked={detailResponse.data.isBookmarked}
      initialStatus={detailResponse.data.activity.status}
    />
  );
};

type ActivityPostContentProps = {
  selectedPost: ReturnType<typeof mapDetailToActivityPost>;
  isMine: boolean;
  isAdmin: boolean;
  activityId: number;
  userId: number;
  initialIsBookmarked: boolean;
  initialStatus: 'OPEN' | 'CLOSED';
};

const ActivityPostContent = ({ 
  selectedPost,
  isMine,
  isAdmin,
  activityId,
  userId,
  initialIsBookmarked,
  initialStatus,
 }: ActivityPostContentProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ActivityPostStatus>(initialStatus);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isCloseRecruitPopupOpen, setIsCloseRecruitPopupOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  
  //북마크 토글
  const bookmarkMutation = useMutation({
    mutationFn: () => toggleActivityBookmark(userId, activityId),
    onMutate: () => {
      setIsBookmarked((prev) => !prev);
    },
    onError: () => {
      setIsBookmarked((prev) => !prev); //낙관적 업데이트
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityDetail', activityId] });
    },
  });

  //삭제 -> 동아리/스터디에서만 사용됨
  const deleteMutation = useMutation({
    mutationFn: () => deleteActivity(userId, activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityList'] });
      navigate(-1);
    },
  });

  //모집 중지
  const closeMutation = useMutation({
    mutationFn: () => closeActivity(userId, activityId),
    onSuccess: () => {
      setStatus('CLOSED');
      queryClient.invalidateQueries({ queryKey: ['activityDetail', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activityList'] });
    },
  });

  const optionItems: OptionItem[] = isAdmin
  ? [
      { id: 'delete-post', icon: 'trash', label: '게시글 삭제' },
    ]
    : isMine
      ? [
          { id: 'edit-post', icon: 'writing', label: '게시글 수정' },
          { id: 'delete-post', icon: 'trash', label: '게시글 삭제' },
        ]
      : [
          { id: 'copy-url', icon: 'link', label: 'URL 복사' },
          { id: 'report-post', icon: 'report', label: '게시글 신고' },
        ];

  const handleOptionClick = async (item: OptionItem) => {
    if (item.id === 'copy-url') {
      const postUrl = `${window.location.origin}/activity/post/${activityId}`;
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
    if (item.id === 'report-post') setIsReportModalOpen(true);
    if (item.id === 'edit-post') navigate(`/activity/edit/${activityId}`, {replace:true});
    if (item.id === 'delete-post') setIsDeletePopupOpen(true);
    setIsOptionOpen(false);
  };

  const statusLabel = status === 'CLOSED' ? '모집 완료' : '모집 중';


  return (
    <HeaderLayout
      headerSlot={
        <MainHeader
          title='대외활동'
          leftAction={{onClick: () => navigate(-1)}}
          rightActions={[
            { icon: 'more_menu', onClick: () => setIsOptionOpen(true), ariaLabel: '게시글 옵션 열기' },
          ]}
        />
      }
    >
      <div className='flex w-full justify-center bg-white'>
         <div className='flex w-full max-w-[720px] flex-col pb-[90px] sm:px-[25px]'>
           <section className='flex flex-col gap-[35px] border-b border-[#ECECEC] px-5 pb-[30px] pt-[22px] sm:px-[25px]'>
             <div className='flex flex-col items-start gap-[20px]'>
               <div
                className={`inline-flex min-w-[68px] items-center justify-center rounded-[30px] border px-[12px] py-[4px] text-r-16 ${
                  status === 'CLOSED'
                    ? 'border-[var(--ColorGray2,#A1A1A1)] text-[var(--ColorGray2,#A1A1A1)]'
                    : 'border-[var(--ColorMain,#00C56C)] text-[var(--ColorMain,#00C56C)]'
                }`}
              >
                {statusLabel}
              </div>
              <div className='flex flex-col gap-[13px]'>
                <div className='text-[24px] font-bold leading-[130%] text-black'>
                  {selectedPost.title}
                </div>
                <div className='flex flex-wrap items-center gap-[10px] text-[12px] text-[var(--ColorGray3,#646464)]'>
                  <div className='flex items-center gap-[3px]'>
                    <svg viewBox='0 0 11 12' fill='none' className='w-[11px] h-[12px]'>
                      <path 
                        d='M9.22867 0.697692C9.962 0.775908 10.5 1.3558 10.5 2.03286V11.5L5.5 9.20853L0.5 11.5V2.03286C0.5 1.3558 1.03733 0.775908 1.77133 0.697692C4.24879 0.434103 6.75121 0.434103 9.22867 0.697692Z' 
                        stroke='#646464' 
                        strokeLinecap='round' 
                        strokeLinejoin='round'
                      />
                    </svg>
                    <span>{selectedPost.saveCount}</span>
                  </div>
                  <span className='text-[var(--ColorGray2,#A1A1A1)]'>
                    {formatPostDisplayDate(selectedPost.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex justify-between gap-[12px] border-b border-[#ECECEC] pb-[15px] sm:flex-row sm:items-center '>
              <button
                type='button'
                disabled={isMine}
                className='flex items-center text-left'
                onClick={() =>
                  navigate(`/alumni/profile/${selectedPost.author.id}`, {
                    state: {
                      author: {
                        name: selectedPost.author.name,
                        major: selectedPost.author.major,
                        studentId: selectedPost.author.studentId,
                        profileImageUrl: selectedPost.author.profileImageUrl,
                      },
                    },
                  })
                }
              >
                <div className='flex items-center gap-[10px]'>
                  <img
                    src={selectedPost.author.profileImageUrl ?? DEFAULT_PROFILE_IMAGE}
                    alt={`${selectedPost.author.name} 프로필`}
                    onError={(e) => {
                      e.currentTarget.onerror = null; //이미지 깨짐 방지
                      e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                    }}
                    className='h-[32px] w-[32px] rounded-full object-cover'
                  />
                  <div className='flex flex-col gap-[4px]'>
                    <div className='text-[14px] font-semibold text-[var(--ColorBlack,#202023)]'>
                      {selectedPost.author.name}
                    </div>
                    <div className='text-[12px] text-[var(--ColorGray3,#646464)]'>
                      {selectedPost.author.major} {selectedPost.author.studentId.slice(2,4)}학번
                    </div>
                  </div>
                </div>
              </button>
              {!isMine && (<button
                type='button'
                className='inline-flex items-center justify-center rounded-[10px] border border-[var(--ColorMain,#00C56C)] px-[10px] py-[6px] text-[12px] font-normal text-[var(--ColorMain,#00C56C)]'
                onClick={() =>
                  navigate(`/alumni/profile/${selectedPost.author.id}?coffeeChat=1`, {
                    state: {
                      author: {
                        name: selectedPost.author.name,
                        major: selectedPost.author.major,
                        studentId: selectedPost.author.studentId,
                        profileImageUrl: selectedPost.author.profileImageUrl,
                      },
                    },
                  })
                }
              >
                커피챗 보내기
              </button>)}
            </div>

            <div className='flex flex-col gap-[20px]'>
              <div className='text-[16px] leading-[160%] text-[var(--ColorGray3,#646464)] whitespace-pre-wrap break-keep [overflow-wrap:anywhere]'>
                {selectedPost.content}
              </div>
              {selectedPost.postImages && selectedPost.postImages.length > 0 && (
                <div className='mt-[30px] -mr-5 overflow-x-auto sm:-mr-[25px]'>
                  <div className='flex w-max gap-[5px] pr-[20px]'>
                    {selectedPost.postImages.map((imageUrl: string, index: number) => {
                      const imageKey = `${selectedPost.id}-image-${index + 1}`;
                      if (failedImages[imageKey]) {
                        return (
                          <div
                            key={imageKey}
                            className='h-[150px] w-[150px] shrink-0 rounded-[5px] bg-[#D9D9D9]'
                            aria-label='이미지 불러오기 실패'
                          />
                        );
                      }
                      return (
                        <img
                          key={imageKey}
                          src={imageUrl}
                          alt={`${selectedPost.title} 이미지 ${index + 1}`}
                          className='h-[150px] w-[150px] shrink-0 rounded-[5px] object-cover'
                          onClick={() => setSelectedImageUrl(imageUrl)}
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [imageKey]: true }))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              <div className='flex flex-wrap gap-[5px]'>
                {selectedPost.categories.map((category: string) => (
                  <Category key={category} label={category} />
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>

      <BottomReact
        isMine={isMine}
        status={status}
        isBookmarked={isBookmarked}
        onBookmarkToggle={() => bookmarkMutation.mutate()}
        onOpenCompletePopup={() => setIsCloseRecruitPopupOpen(true)}
      />

      <BottomSheetModal isOpen={isOptionOpen} onClose={() => setIsOptionOpen(false)} height='auto'>
        <div className='flex min-h-[200px] flex-col px-[clamp(16px,6vw,25px)] pt-[30px]'>
          <div className='flex flex-col divide-y divide-[var(--ColorGray1,#ECECEC)]'>
            {optionItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => handleOptionClick(item)}
                className='flex items-center gap-[15px] py-[15px] text-left'
              >
                <BottomSheetIcon name={item.icon} />
                <span className='text-[16px] font-medium text-[var(--ColorGray3,#646464)]'>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheetModal>

      <PopUp
        isOpen={isCloseRecruitPopupOpen}
        type='info'
        title='모집을 완료하시겠습니까?'
        content={'모집 완료 후에는 다시 모집 중 상태로 변경할 수 없습니다.'}
        onLeftClick={() => setIsCloseRecruitPopupOpen(false)}
        onRightClick={() => {setIsCloseRecruitPopupOpen(false); closeMutation.mutate();}}
      />

      <PopUp
        isOpen={isDeletePopupOpen}
        type='warning'
        title='정말 삭제하시겠습니까?'
        content='삭제된 내용은 복구 불가능합니다.'
        onLeftClick={() => {setIsDeletePopupOpen(false); deleteMutation.mutate();}}
        onRightClick={() => setIsDeletePopupOpen(false)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedUserId={Number(selectedPost.author.id)}
        reportedUserName={selectedPost.author.name}
        reportedPostId={activityId}
        postType="ACTIVITY"
      />

      <ImagePopUp
        isOpen={Boolean(selectedImageUrl)}
        imageUrl={selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
      />
    </HeaderLayout>
  );
};

export default ActivityPostPage;

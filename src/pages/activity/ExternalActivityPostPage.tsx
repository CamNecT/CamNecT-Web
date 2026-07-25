import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { type ActivityDetailResponse } from '../../api-types/activityApiTypes';
import { closeAdminActivity, getActivityDetail, getTags, toggleActivityBookmark } from '../../api/activityApi';
import replaceImg from "../../assets/image/replaceImg.png";
import BottomSheetModal from '../../components/BottomSheetModal/BottomSheetModal';
import BottomSheetIcon from '../../components/BottomSheetModal/Icon';
import Category from '../../components/Category';
import Icon from '../../components/Icon';
import PopUp from '../../components/Pop-up';
import { RecruitPost } from '../../components/posts/RecruitPost';
import SaveToggle from '../../layouts/BottomChat/components/SaveToggle';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { formatOnlyDate } from '../../utils/formatDate';
import { mapDetailToActivityPost, mapRecruitmentItemToTeamRecruitPost } from './utils/activityMapper';

const REPLACE_IMAGE = replaceImg;

type OptionId = 'copy-url' | 'report-post' | 'edit-post' | 'close-post';

type OptionItem = {
    id: OptionId;
    icon: 'writing' | 'close' | 'link' | 'report';
    label: string;
};

type TabType = 'detail' | 'team';

export const ExternalActivityPostPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const authUser = useAuthStore(state => state.user);
    const userId = authUser?.id ? parseInt(authUser.id) : null;
    const activityId = postId ? parseInt(postId) : null;

    const [activeTab, setActiveTab] = useState<TabType>('detail');
    const [isOptionOpen, setIsOptionOpen] = useState(false);
    const [isClosePopupOpen, setIsClosePopupOpen] = useState(false);
    const [isCloseAgainPopupOpen, setIsCloseAgainPopupOpen] = useState(false);
    const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);

  //상세 조회
  const {
    data: detailResponse,
    isLoading,
    isError,
  } = useQuery<ActivityDetailResponse>({
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

  const selectedPost = useMemo(() => {
    if (!detailResponse?.data) return null;
    return mapDetailToActivityPost(detailResponse.data, tagIdToNameMap);
  }, [detailResponse, tagIdToNameMap]);

  //팀원 모집 중지
  const closeMutation = useMutation({
    mutationFn: () => closeAdminActivity(activityId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityDetail', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activityList'] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => toggleActivityBookmark(userId!, activityId!),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['activityDetail', activityId] });

      const prev = queryClient.getQueryData<typeof detailResponse>([
        'activityDetail',
        activityId,
      ]);

      if (prev?.data) {
        queryClient.setQueryData(['activityDetail', activityId], {
          ...prev,
          data: {
            ...prev.data,
            isBookmarked: !prev.data.isBookmarked,
          },
        });
      }

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['activityDetail', activityId], ctx.prev);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activityDetail', activityId] });
    },
  });

  //팀원 모집 데이터
  const teamRecruits = useMemo(() => {
    if (!detailResponse?.data?.recruitmentList) return [];
    return detailResponse.data.recruitmentList.map(mapRecruitmentItemToTeamRecruitPost);
  }, [detailResponse]);

  const isMine = detailResponse?.data?.isMine ?? false;

  const canCloseRecruit = isMine && selectedPost?.status === 'OPEN';

  const optionItems: OptionItem[] = isMine
    ? [
        { id: 'edit-post', icon: 'writing', label: '게시글 수정' },
        { id: 'close-post', icon: 'close', label: '모집 중지하기' },
      ]
    : [
        { id: 'copy-url', icon: 'link', label: 'URL 복사' },
        { id: 'report-post', icon: 'report', label: '게시글 신고' },
      ];

  const handleOptionClick = async (item: OptionItem) => {
    if (item.id === 'copy-url') {
      const postUrl = `${window.location.origin}/activity/external/${activityId}`;
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
      if (selectedPost?.tab === 'external') navigate(`/admin/post/external/${activityId}`);
      else navigate(`/admin/post/job/${activityId}`);
    }
    if (item.id === 'close-post') {
      if (canCloseRecruit) setIsClosePopupOpen(true);
      else setIsCloseAgainPopupOpen(true);
    };
    setIsOptionOpen(false);
  };

  if (isLoading) {
    return (
      <PopUp
        type="loading"
        isOpen={true}
      />
    );
  }

  if (isError || !selectedPost || !detailResponse?.data) {
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

  const thumbnailUrl = selectedPost.thumbnailUrl ?? selectedPost.postImages?.[0];

  const renderDetailTab = () => (
    <div className='flex flex-col px-[25px] py-[30px]'>
      {selectedPost.context && (
        <div className='flex flex-col gap-[20px]'>
          {selectedPost.contextTitle && (
            <span className='text-b-16-hn text-gray-900 whitespace-pre-wrap break-keep [overflow-wrap:anywhere]'>{selectedPost.contextTitle}</span>
          )}
          <p className='text-r-14 text-gray-900 whitespace-pre-wrap break-keep [overflow-wrap:anywhere]'>
            {selectedPost.context}
          </p>
        </div>
      )}
    </div>
  );

  const renderTeamTab = () => (
    <div className='flex flex-col justify-center'>
      {teamRecruits.length === 0 ? (
        <span className='py-[40px] text-center text-r-14-hn text-gray-650'>
          아직 팀원 모집 글이 없습니다.
        </span>
      ) : (
        teamRecruits.map((recruit) => <RecruitPost key={recruit.id} {...recruit} />)
      )}
      <div className='w-full flex justify-end px-[15px] py-[15px]'>
        <button
          className='w-[150px] flex items-center justify-center gap-[7px] px-[15px] py-[10px] rounded-[3px] bg-primary text-white text-m-16-hn z-30 active:scale-95 active:brightness-95 transition'
          onClick={() => navigate(`/activity/${activityId}/recruit-write`)}
        >
          <Icon name='writing' />
          팀원 모집하기
        </button>
      </div>
    </div>
  );

  //팀원 모집 탭의 카운트: API recruitmentList 사용
  const recruitCount = detailResponse?.data?.recruitmentList?.length ?? teamRecruits.length;

  //화면에 표시할 북마크 상태는 캐시 값 그대로 사용
  const isBookmarkedView = detailResponse.data.isBookmarked;

  //연타/중복 요청 막기
  const handleToggleBookmark = () => {
    if (bookmarkMutation.isPending) return;
    bookmarkMutation.mutate();
  };

    return (
        <HeaderLayout
            headerSlot={
                <header
                    className='sticky left-0 right-0 top-0 z-50 min-h-[48px] flex items-center justify-between bg-white pl-[25px] pr-[10px] py-[10px]'
                    style={{
                        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
                        top: 'env(safe-area-inset-top, 0px)',
                    }}
                >
                    <button type='button' onClick={() => navigate(-1)} aria-label='뒤로 가기' className='z-10'>
                        <Icon name='arrow_left'/>
                    </button>
                    <span className='absolute left-1/2 -translate-x-1/2 text-center text-sb-20 text-gray-900'>대외활동</span>
                    <div className='flex items-center gap-[10px] z-10'>
                        <SaveToggle 
                        width={24} 
                        height={24} 
                        isActive={isBookmarkedView} 
                        onToggle={() => handleToggleBookmark()}
                        />
                        <button type='button' onClick={() => setIsOptionOpen(true)} aria-label='게시글 옵션 열기'>
                            <Icon name='more_menu'/>
                        </button>
                    </div>
                </header>
            }
        >
        <div className='flex w-full justify-center bg-white'>
            <div className='flex w-full max-w-[720px] flex-col'>
                {/* 썸네일 이미지 */}
                    <div className='relative min-h-[200px] max-h-[600px]'>
                        <img
                            src={thumbnailUrl ?? REPLACE_IMAGE}
                            alt={selectedPost.title}
                            onError={(e) => {
                                e.currentTarget.onerror = null; //이미지 깨짐 방지
                                e.currentTarget.src = REPLACE_IMAGE;
                            }}
                            className='w-full h-full object-contain rounded-none'
                        />
                    </div>

                {/* 헤더 정보 */}
                <section className='flex flex-col gap-[20px] px-[25px] py-[30px]'>
                    <div className='flex flex-col gap-[10px]'>
                        {/* 카테고리 태그 */}
                        <div className='flex flex-wrap gap-[5px]'>
                        {selectedPost.categories.map((category: string) => (
                            <Category key={category} label={category} />
                        ))}
                        </div>

                        {/* 제목 */}
                        <span className='text-b-28 text-gray-900'>
                            {selectedPost.title}
                        </span>

                        {/* 주최자 정보 */}
                        <div className='flex items-center'>
                            <span className='text-r-18 text-gray-750 pr-[5px]'>
                                {selectedPost.organizer || '주최자 정보 없음'}
                            </span>
                            <Icon name='bookmark_stroke' className='w-[15px] h-[15px]'/>
                            <span className='text-r-12 text-gray-650'>
                                {selectedPost.saveCount}
                            </span>
                        </div>
                    </div>

                    {/* 기본 정보 */}
                    <div className='pb-[10px] flex flex-col gap-[2px] text-r-14-hn text-gray-750'>
                    
                    {selectedPost.tab === "external" ? (
                        <>
                            {selectedPost.target && (
                                <span>
                                    모집 대상 : {selectedPost.target}
                                </span>
                            )}
                            {selectedPost.applyPeriod && (
                                <span>
                                    접수 기간 : {formatOnlyDate(selectedPost.applyPeriod.start)} ~ {formatOnlyDate(selectedPost.applyPeriod.end)}
                                </span>
                            )}
                            {selectedPost.announceDate && (
                                <span>
                                    결과 발표 : {formatOnlyDate(selectedPost.announceDate)}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            {selectedPost.target && (
                                <span>
                                    채용 형태 : {selectedPost.target}
                                </span>
                            )}
                            {selectedPost.applyPeriod && (
                                <span>
                                    접수 기간 : {formatOnlyDate(selectedPost.applyPeriod.start)} ~ {formatOnlyDate(selectedPost.applyPeriod.end)}
                                </span>
                            )}
                        </>
                    )}
                    </div>

                    {/* 공식 홈페이지 버튼 */}
                    {selectedPost.applyUrl && (() => {
                    //URL에 프로토콜이 없으면 https:// 추가
                    const url = selectedPost.applyUrl;
                    const finalUrl = url.startsWith('http://') || url.startsWith('https://') 
                      ? url 
                      : `https://${url}`;
                    
                    return (
                      <a
                        href={finalUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='px-[40px] py-[15px] text-center flex items-center justify-center w-full rounded-full bg-primary text-white text-b-16-hn active:scale-95 active:brightness-95 transition'
                      >
                        공식 홈페이지에서 신청하기
                      </a>
                    );
                  })()}
                </section>

                {/* 탭 */}
                <div className='flex border-b border-[#ECECEC]'>
                    <button
                    type='button'
                    onClick={() => setActiveTab('detail')}
                    className={`flex-1 py-[15px] transition-colors border-b-2 ${
                        activeTab === 'detail'
                        ? 'border-gray-900 text-gray-900 text-b-16-hn'
                        : 'border-transparent text-gray-650 text-r-16-hn'
                    }`}
                    >
                    상세 정보
                    </button>
                    <button
                    type='button'
                    onClick={() => setActiveTab('team')}
                    className={`flex-1 py-[15px] transition-colors border-b-2 ${
                        activeTab === 'team'
                        ? 'border-gray-900 text-gray-900 text-b-16-hn'
                        : 'border-transparent text-gray-650 text-r-16-hn'
                    }`}
                    >
                    팀원 모집 ({recruitCount})
                    </button>
                </div>

            {/* 탭 컨텐츠 */}
            {activeTab === 'detail' ? renderDetailTab() : renderTeamTab()}
            </div>
        </div>


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
            isOpen={isClosePopupOpen}
            type='info'
            title='모집을 중지하시겠습니까?'
            content='중지 후에는 다시 모집 중 상태로 변경할 수 없습니다.'
            onLeftClick={() => setIsClosePopupOpen(false)}
            onRightClick={() => {
              setIsClosePopupOpen(false);
              closeMutation.mutate();
            }}
        />

        <PopUp
            isOpen={isCloseAgainPopupOpen}
            type='confirm'
            title='모집 마감 완료'
            content='이미 모집이 중지되어 있습니다.'
            onClick={() => setIsCloseAgainPopupOpen(false)}
        />

        <PopUp
            isOpen={isReportPopupOpen}
            type='confirm'
            title='현재 제작 중이에요!'
            content='유저분들이 더 즐겁게 소통할 수 있도록\n꼼꼼히 준비해서 돌아올게요!'
            onClick={() => setIsReportPopupOpen(false)}
        />
        </HeaderLayout>
    );
};

export default ExternalActivityPostPage;

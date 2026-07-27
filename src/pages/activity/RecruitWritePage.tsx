import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HeaderLayout } from '../../layouts/HeaderLayout';
import { EditHeader } from '../../layouts/headers/EditHeader';
import PopUp from '../../components/Pop-up';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import { useAuthStore } from '../../store/useAuthStore';
import { createRecruitment, getRecruitmentDetail, updateRecruitment } from '../../api/activityApi';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const RecruitWritePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { activityId, recruitId } = useParams();
    const authUser = useAuthStore((state) => state.user)
    const userId = authUser?.id ? parseInt(authUser.id) : null;
    const recruitmentId = recruitId ? parseInt(recruitId) : null;
    const activityIdNum = activityId ? parseInt(activityId) : null;
    const isEditMode = Boolean(recruitId);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    //수정 모드: 기존 데이터 로드
    const { data: editDetailResponse, isLoading: isLoadingEdit, isError: isErrorEdit } = useQuery({
        queryKey: ['recruitmentDetail', recruitmentId],
        queryFn: () => getRecruitmentDetail(userId!, recruitmentId!),
        enabled: isEditMode && !!userId && !!recruitmentId,
    });

    const existingRecruit = editDetailResponse?.data?.recruitment;

    const initialValues = useMemo(() => {
    if (!existingRecruit) return null;
    const d = new Date(existingRecruit.recruitDeadline);
    return {
      title: existingRecruit.title,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      teamNumber: existingRecruit.recruitCount,
      description: existingRecruit.content,
    };
  }, [existingRecruit]);


    const [title, setTitle] = useState(() => initialValues?.title ?? '');
    const [year, setYear] = useState(() => initialValues?.year ?? currentYear);
    const [month, setMonth] = useState(() => initialValues?.month ?? 1);
    const [day, setDay] = useState(() => initialValues?.day ?? 1);
    const [teamNumber, setTeamNumber] = useState(() => initialValues?.teamNumber ?? 1);
    const [description, setDescription] = useState(() => initialValues?.description ?? '');
    
    const [showWarning, setShowWarning] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showDayDropdown, setShowDayDropdown] = useState(false);

    const maxLength = 300;

    // 선택된 연도/월에 따른 일수 계산
    const daysInMonth = useMemo(() => {
        return new Date(year, month, 0).getDate();
    }, [year, month]);

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const isFormValid = title.trim() !== '' && description.trim() !== '';

    //등록/수정
    const submitMutation = useMutation({
        mutationFn: async () => {
        if (!userId || !activityIdNum) throw new Error('필수 값 누락');

        const payload = {
            activityId: activityIdNum,
            title: title.trim(),
            recruitDeadline: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            recruitCount: teamNumber,
            content: description.trim(),
        };

        if (isEditMode && recruitmentId) {
            return updateRecruitment(userId, recruitmentId, payload);
        }
        return createRecruitment(userId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recruitmentDetail'] });
            navigate(-1);
        },
    });

    const handleClose = () => {
        setShowWarning(true);
    };

    const handleSubmit = () => {
        if (!isFormValid) return;
        setIsConfirmOpen(true);
    };

    const handleIncrement = () => {
        setTeamNumber(prev => (prev < 20 ? prev + 1 : 20));
    };

    const handleDecrement = () => {
        setTeamNumber(prev => (prev > 1 ? prev - 1 : 1));
    };

    if (isEditMode && isLoadingEdit) {
        return (
        <PopUp
            type="loading"
            isOpen={true}
        />
        );
    }

    if (isErrorEdit) {
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

    return (
        <>
            <HeaderLayout
                headerSlot={
                    <EditHeader
                        title='팀원 모집'
                        leftAction={{ onClick: handleClose }}
                        rightElement={
                            <button
                                type='button'
                                onClick={handleSubmit}
                                disabled={!isFormValid || submitMutation.isPending}
                                className={`text-b-16-hn transition-colors ${
                                isFormValid ? 'text-primary' : 'text-gray-650'
                                }`}
                            >
                                {submitMutation.isPending ? '저장 중...' : '완료'}
                            </button>
                            }
                    />
                }
            >
                <div className='flex w-full h-full justify-center bg-white'>
                    <div className='w-full flex flex-col gap-[20px] px-[25px] py-[20px]'>
                        {/* 제목 */}
                        <div className='flex flex-col gap-[10px]'>
                            <input
                                type='text'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder='제목'
                                className='w-full p-[15px] border-b border-gray-650 text-b-18-hn text-gray-900 placeholder:text-gray-650 focus:outline-none'
                            />
                        </div>

                        {/* 모집 마감일 */}
                        <div className='flex flex-col gap-[10px]'>
                            <span className='text-sb-14-hn text-gray-750'>
                            모집 마감일
                            </span>
                            <div className='flex flex-wrap gap-[10px]'>
                                {/* 연도 */}
                                <div className='flex-1 relative'>
                                    <button
                                    type='button'
                                    onClick={() => setShowYearDropdown(!showYearDropdown)}
                                    className='w-full min-w-[113px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between gap-[5px] focus:outline-none'
                                    >
                                        <span className='text-r-16-hn text-gray-750'>{year}년</span>
                                        <Icon 
                                            name='toggleDown' 
                                            className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {showYearDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {years.map((y) => (
                                        <button
                                            key={y}
                                            type='button'
                                            onClick={() => {
                                                setYear(y);
                                                const dim = new Date(y, month, 0).getDate();
                                                setDay((d) => Math.min(d, dim));
                                                setShowYearDropdown(false);
                                            }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                year === y ? 'text-primary' : 'text-gray-650'
                                            }`}
                                        >
                                            {y}년
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>

                                {/* 월 */}
                                <div className='flex-1 relative'>
                                    <button
                                    type='button'
                                    onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                                    className='w-full min-w-[86px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'
                                    >
                                        <span className='text-r-16-hn text-gray-750'>{month}월</span>
                                        <Icon 
                                            name='toggleDown' 
                                            className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {showMonthDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {MONTHS.map((m) => (
                                        <button
                                            key={m}
                                            type='button'
                                            onClick={() => {
                                                setMonth(m);
                                                const dim = new Date(year, m, 0).getDate();
                                                setDay((d) => Math.min(d, dim));
                                                setShowMonthDropdown(false);
                                            }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                month === m ? 'text-primary' : 'text-gray-650'
                                            }`}
                                        >
                                            {m}월
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>

                                {/* 일 */}
                                <div className='flex-1 relative'>
                                    <button
                                    type='button'
                                    onClick={() => setShowDayDropdown(!showDayDropdown)}
                                    className='w-full min-w-[89px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'
                                    >
                                        <span className='text-r-16-hn text-gray-750'>{day}일</span>
                                        <Icon 
                                            name='toggleDown' 
                                            className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showDayDropdown ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {showDayDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {days.map((d) => (
                                        <button
                                            key={d}
                                            type='button'
                                            onClick={() => {
                                            setDay(d);
                                            setShowDayDropdown(false);
                                            }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                            day === d ? 'text-primary' : 'text-gray-650'
                                            }`}
                                        >
                                            {d}일
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 모집 인원 */}
                        <div className='flex flex-col gap-[10px]'>
                            <span className='text-sb-14-hn text-gray-750'>
                            모집 인원
                            </span>
                            <div className='flex items-center justify-between h-[52px] px-[15px] border border-gray-150 rounded-[5px]'>
                                <button
                                    type='button'
                                    onClick={handleDecrement}
                                    className='flex items-center justify-center w-[32px] h-[32px] text-[20px] text-gray-750'
                                >
                                    −
                                </button>
                                <span className='text-r-16-hn text-gray-750'>
                                    {teamNumber}인
                                </span>
                                <button
                                    type='button'
                                    onClick={handleIncrement}
                                    className='flex items-center justify-center w-[32px] h-[32px] text-[20px] text-gray-750'
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* 모집 내용 */}
                        <div className='flex flex-col gap-[10px]'>
                            <span className='text-sb-14-hn text-gray-750'>
                            모집 내용
                            </span>
                            <Card width='100%' height={200} className='px-[15px] py-[15px]'>
                            <textarea
                                value={description}
                                onChange={(e) => {
                                const value = e.target.value.slice(0, maxLength);
                                    setDescription(value);
                                }}
                                placeholder='팀원 모집 시 내용을 입력해주세요.&#10;(예: 기획 분야 or 개발자분을 구합니다.)'
                                className='h-full w-full resize-none bg-transparent outline-none text-r-16-hn text-gray-750 placeholder:text-gray-650'
                            />
                            </Card>
                            <div className='flex justify-end text-r-12-hn text-gray-650'>
                                {description.length}/{maxLength}
                            </div>
                        </div>
                    </div>
                </div>
            </HeaderLayout>

            <PopUp
                isOpen={showWarning}
                type='warning'
                title={isEditMode ? '수정을 취소하고 나가시겠습니까?' : '작성을 취소하고 나가시겠습니까?'}
                content={isEditMode ? '저장하지 않을 시 변경사항이 삭제됩니다.' : '취소된 내용은 복구할 수 없습니다.'}
                leftButtonText='나가기'
                onLeftClick={() => {
                    setShowWarning(false);
                    navigate(-1);
                }}
                onRightClick={() => setShowWarning(false)}
            />

            <PopUp 
                isOpen={isConfirmOpen} 
                type='info' 
                title={isEditMode ? '모집글을 수정하시겠습니까?' : '모집글을 등록하시겠습니까?'} 
                content={isEditMode ? '수정된 내용으로 저장됩니다.' : '모집글은 등록 후 삭제할 수 없습니다.'}
                onLeftClick={() => setIsConfirmOpen(false)}
                onRightClick={() => {
                    setIsConfirmOpen(false);
                    submitMutation.mutate();
                }}
                isActionPending={submitMutation.isPending} />
        </>
    );
};
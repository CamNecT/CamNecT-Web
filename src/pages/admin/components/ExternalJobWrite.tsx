import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from '../../../components/Icon';
import PopUp from '../../../components/Pop-up';
import Card from '../../../components/Card';
import { HeaderLayout } from '../../../layouts/HeaderLayout';
import { EditHeader } from '../../../layouts/headers/EditHeader';
import FilterHeader from '../../../components/FilterHeader';
import TagsFilterModal from '../../../components/TagsFilterModal';
import { getTags } from '../../../api/activityApi';
import { mapApiTagCategoryToUiTagCategory } from '../../activity/utils/activityMapper';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  createAdminActivity,
  updateAdminActivity,
  getActivityDetail,
  getActivityThumbnailPresignUrl,
} from '../../../api/activityApi';
import type { ActivityCategory, ActivityAdminCreateRequest, ActivityAdminUpdateRequest } from '../../../api-types/activityApiTypes';
import { uploadFileToS3 } from '../../../utils/s3Upload';
import { useFileUpload } from '../../../hooks/useFileUpload';
import replaceImg from "../../../assets/image/replaceImg.png"

const REPLACE_IMAGE = replaceImg;

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/webp', 'image/png']);

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const clampDay = (day: number, year: number, month: number) => Math.min(day, daysInMonth(year, month));
const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;


type PostType = 'external' | 'job';

interface ExternalJobWritePageProps {
    type: PostType;
}

const typeToCategory: Record<PostType, ActivityCategory> = {
  external: 'EXTERNAL',
  job: 'RECRUITMENT',
};

export const ExternalJobWrite = ({ type }: ExternalJobWritePageProps) => {
    const navigate = useNavigate();
    const { postId } = useParams();
    const queryClient = useQueryClient();
    const { prepareFile, revokeUrl } = useFileUpload({
        maxSizeMB: 10,
        allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });
    const isEditMode = Boolean(postId);
    const activityId = postId ? parseInt(postId) : null;

    const authUser = useAuthStore((state) => state.user);
    const userId = authUser?.id ? parseInt(authUser.id) : null;

    //기존 데이터 로드
    const { data: editDetailResponse, isLoading: isLoadingEdit, isError: isErrorEdit} = useQuery({
        queryKey: ['activityDetail', activityId],
        queryFn: () => getActivityDetail(userId!, activityId!),
        enabled: isEditMode && !!userId && !!activityId,
    });

    const editPost = editDetailResponse?.data;
    const currentYear = new Date().getFullYear();

    //초기값
    const initialValues = useMemo(() => {
        if (!editPost) return null;
        const { activity, tagIds } = editPost;

        const startDate = activity.applyStartDate ? new Date(activity.applyStartDate) : null;
        const endDate = activity.applyEndDate ? new Date(activity.applyEndDate) : null;
        const announceDate = type === 'external' && activity.resultAnnounceDate
        ? new Date(activity.resultAnnounceDate) : null;

        return {
            title: activity.title,
            tags: tagIds,
            organizer: activity.organizer ?? '',
            target: activity.targetDescription ?? '',
            applyUrl: activity.officialUrl ?? '',
            contextTitle: activity.contextTitle ?? '',
            context: activity.context ?? '',
            thumbnailUrl: activity.thumbnailUrl ?? null,
            thumbnailKey: activity.thumbnailUrl ? activity.thumbnailUrl.split('/').pop() ?? null : null,
            startYear: startDate?.getFullYear() ?? currentYear,
            startMonth: startDate ? startDate.getMonth() + 1 : 1,
            startDay: startDate?.getDate() ?? 1,
            endYear: endDate?.getFullYear() ?? currentYear,
            endMonth: endDate ? endDate.getMonth() + 1 : 12,
            endDay: endDate?.getDate() ?? 31,
            announceYear: announceDate?.getFullYear() ?? currentYear,
            announceMonth: announceDate ? announceDate.getMonth() + 1 : 1,
            announceDay: announceDate?.getDate() ?? 1,
        };
    }, [editPost, type, currentYear]);

    //태그 목록 조회
    const { data: tagData } = useQuery({
        queryKey: ['tags', 'DEFAULT'],
        queryFn: () => getTags('DEFAULT'),
        staleTime: 1000 * 60 * 10,
    });

    const tagNameToIdMap = useMemo(() => {
        const map = new Map<string, number>();
        tagData?.data.forEach((cat) => {
            cat.tags.forEach((tag) => {
                if (!map.has(tag.name)) {  // 이미 있으면 건너뜀
                    map.set(tag.name, tag.id);
                }
            });
        });
        return map;
    }, [tagData]);

    const tagIdToNameMap = useMemo(() => {
        const map = new Map<number, string>();
        tagData?.data.forEach((cat) => {
        cat.tags.forEach((tag) => map.set(tag.id, tag.name));
        });
        return map;
    }, [tagData]);

    const tagCategories = useMemo(() => tagData?.data.map(mapApiTagCategoryToUiTagCategory) ?? [], [tagData]);

    const allTags = useMemo(() => tagCategories.flatMap((c) => c.tags), [tagCategories]);

    //날짜 초기값
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    //공통
    const [title, setTitle] = useState(() => initialValues?.title ?? '');
    const [selectedTags, setSelectedTags] = useState<number[]>(() => initialValues?.tags ?? []);
    const [organizer, setOrganizer] = useState(() => initialValues?.organizer ?? '');
    const [target, setTarget] = useState(() => initialValues?.target ?? '');
    const [applyUrl, setApplyUrl] = useState(() => initialValues?.applyUrl ?? '');
    const [contextTitle, setContextTitle] = useState(() => initialValues?.contextTitle ?? '');
    const [context, setContext] = useState(() => initialValues?.context ?? '');

    const [startYear, setStartYear] = useState(() => initialValues?.startYear ?? currentYear);
    const [startMonth, setStartMonth] = useState(() => initialValues?.startMonth ?? 1);
    const [startDay, setStartDay] = useState(() => initialValues?.startDay ?? 1);
    
    const [endYear, setEndYear] = useState(() => initialValues?.endYear ?? currentYear);
    const [endMonth, setEndMonth] = useState(() => initialValues?.endMonth ?? 12);
    const [endDay, setEndDay] = useState(() => initialValues?.endDay ?? 31);

    const [showStartYearDropdown, setShowStartYearDropdown] = useState(false);
    const [showStartMonthDropdown, setShowStartMonthDropdown] = useState(false);
    const [showStartDayDropdown, setShowStartDayDropdown] = useState(false);
    const [showEndYearDropdown, setShowEndYearDropdown] = useState(false);
    const [showEndMonthDropdown, setShowEndMonthDropdown] = useState(false);
    const [showEndDayDropdown, setShowEndDayDropdown] = useState(false);
    
    //external
    const [announceYear, setAnnounceYear] = useState(() => initialValues?.announceYear ?? currentYear);
    const [announceMonth, setAnnounceMonth] = useState(() => initialValues?.announceMonth ?? 1);
    const [announceDay, setAnnounceDay] = useState(() => initialValues?.announceDay ?? 1);
    const [showAnnounceYearDropdown, setShowAnnounceYearDropdown] = useState(false);
    const [showAnnounceMonthDropdown, setShowAnnounceMonthDropdown] = useState(false);
    const [showAnnounceDayDropdown, setShowAnnounceDayDropdown] = useState(false);
    
    //썸네일 
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(() => initialValues?.thumbnailUrl ?? null);
    const [isThumbnailRemoved, setIsThumbnailRemoved] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isCancelWarningOpen, setIsCancelWarningOpen] = useState(false);
    const [isFileErrorOpen, setIsFileErrorOpen] = useState(false);
    const [fileErrorMessage, setFileErrorMessage] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const startDays = useMemo(
        () => Array.from({ length: daysInMonth(startYear, startMonth) }, (_, i) => i + 1),
        [startYear, startMonth],
    );

    const endDayOptions = useMemo(() => {
        const max = new Date(endYear, endMonth, 0).getDate();
        const min = endYear === startYear && endMonth === startMonth ? startDay : 1;
        return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    }, [endYear, endMonth, startYear, startMonth, startDay]);

    
    const announceDayOptions = useMemo(() => {
        const max = new Date(announceYear, announceMonth, 0).getDate();
        const min =
            announceYear === startYear && announceMonth === startMonth ? startDay : 1;
        return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    }, [announceYear, announceMonth, startYear, startMonth, startDay]);


    const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];

        // 타입 체크
        if (!ALLOWED_TYPES.has(file.type)) {
            setFileErrorMessage('이미지는 webp / jpeg / png 형식만 업로드 가능합니다.');
            setIsFileErrorOpen(true);
            e.target.value = '';
            return;
        }

        // 용량 체크
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setFileErrorMessage(`이미지가 파일 용량 제한을 초과합니다. (최대 ${MAX_SIZE_MB}MB)`);
            setIsFileErrorOpen(true);
            e.target.value = '';
            return;
        }

        const prepared = prepareFile(file);
            if (!prepared) {
            setFileErrorMessage('파일을 업로드할 수 없어요. 형식/용량을 확인해주세요.');
            setIsFileErrorOpen(true);
            e.target.value = '';
            return;
        }

        // 기존 미리보기 정리
        if (thumbnailPreview) {
            revokeUrl(thumbnailPreview);
        }

        setThumbnailFile(prepared.file);
        setThumbnailPreview(prepared.previewUrl);
        setExistingThumbnailUrl(null);
        setIsThumbnailRemoved(false);
        e.target.value = '';
    };

    const handleRemoveThumbnail = () => {
        if (thumbnailPreview) {
            revokeUrl(thumbnailPreview);
        }
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setExistingThumbnailUrl(null);
        setIsThumbnailRemoved(true);
    };

    const displayThumbnail = thumbnailPreview ?? existingThumbnailUrl;

    // 타입별 설정
    const config = useMemo(() => {
        if (type === 'external') {
            return {
                title: '대외활동',
                field1Label: '모집 대상',
                field1Placeholder: '내용 입력',
                field2Label: '수상 발표',
                imageLabel: '대표 이미지',
                contentLabel: '공모전 개요',
                contentPlaceholder: '공모전 개요 입력',
                detailLabel: '공모전 상세 정보',
                detailPlaceholder: '공모전 상세 입력',
            };
        } else {
            return {
                title: '취업정보',
                field1Label: '채용 형태',
                field1Placeholder: '내용 입력',
                field2Label: '급여',
                imageLabel: '대표 이미지',
                contentLabel: '취업 정보 개요',
                contentPlaceholder: '취업 정보 개요 입력',
                detailLabel: '취업 정보 상세',
                detailPlaceholder: '취업 정보 상세 입력',
            };
        }
    }, [type]);

    const isSubmitEnabled = 
        title.trim().length > 0 &&
        selectedTags.length > 0 &&
        organizer.trim().length > 0 &&
        target.trim().length > 0 &&
        applyUrl.trim().length > 0 &&
        contextTitle.trim().length > 0 &&
        context.trim().length > 0 &&
        (thumbnailFile !== null || existingThumbnailUrl !== null) &&
        (type === 'job' || (announceYear > 0 && announceMonth > 0 && announceDay > 0));

    const confirmTitle = isEditMode ? '게시글을 수정하시겠습니까?' : '게시글을 등록하시겠습니까?';
    const confirmContent = isEditMode ? '수정된 내용으로 저장됩니다.' : '등록 후에는 삭제할 수 없습니다.';

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!userId) throw new Error('로그인이 필요합니다.');

            const category: ActivityCategory = typeToCategory[type];

            // 썸네일 업로드
            let thumbnailKey: string | null = null;
            if (thumbnailFile) {
                const presignRes = await getActivityThumbnailPresignUrl(userId, {
                    contentType: thumbnailFile.type,
                    size: thumbnailFile.size,
                    originalFilename: thumbnailFile.name,
                });
                await uploadFileToS3(
                    presignRes.data.uploadUrl,
                    thumbnailFile,
                    presignRes.data.requiredHeaders,
                );
                thumbnailKey = presignRes.data.fileKey;
            } else if (isThumbnailRemoved) {
                thumbnailKey = "";
            }

            const payload: ActivityAdminCreateRequest = {
                category,
                title: title.trim(),
                tagIds: selectedTags,
                organizer: organizer.trim(),
                targetDescription: target.trim(),
                applyStartDate: toDateStr(startYear, startMonth, startDay),
                applyEndDate: toDateStr(endYear, endMonth, endDay),
                resultAnnounceDate: type === 'external' 
                    ? toDateStr(announceYear, announceMonth, announceDay)
                    : null,
                officialUrl: applyUrl.trim(),
                thumbnailKey,
                contextTitle: contextTitle.trim(),
                content: context.trim(),
            };

            if (isEditMode && activityId) {
                const updatePayload: ActivityAdminUpdateRequest = {
                    ...payload,
                };
                return updateAdminActivity(userId, activityId, updatePayload);
            }
            return createAdminActivity(userId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activityList'] });
            if (isEditMode && activityId) {
                queryClient.invalidateQueries({ queryKey: ['activityDetail', activityId] });
            }
            navigate(-1);
        },
    });

    const handleSubmit = () => {
        if (!isSubmitEnabled) return;
        setIsConfirmOpen(true);
    };

    const handleConfirm = () => {
        setIsConfirmOpen(false);
        submitMutation.mutate();
    };

    const handleCancelClick = () => {
        if (!isEditMode && !isSubmitEnabled) {
            navigate(-1);
            return;
        }
        setIsCancelWarningOpen(true);
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
        <HeaderLayout
            headerSlot={
                <EditHeader
                    title={config.title}
                    leftAction={{ onClick: handleCancelClick }}
                    rightElement={
                        <button
                            type='button'
                            className={`text-b-16-hn transition-colors ${
                                    isSubmitEnabled && !submitMutation.isPending ? 'text-primary' : 'text-gray-650'
                                    }`}
                            onClick={handleSubmit}
                            disabled={!isSubmitEnabled || submitMutation.isPending}
                            >
                        {submitMutation.isPending ? '저장 중...' : '완료'}
                        </button>
                    }
                />
            }
            >
            <div className='flex h-full w-full flex-col bg-white border-t border-gray-150'>
                <section className='flex w-full flex-col px-[25px] py-[10px] gap-[30px] border-t border-gray-150'>
                    <div className='flex flex-col'>
                        {/* 제목 입력 */}
                        <div
                            className='flex w-full flex-col p-[10px]'
                        >
                            <input
                            id='activity-title'
                            name='title'
                            type='text'
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder='제목'
                            className='w-full text-b-18 text-gray-900 placeholder:text-gray-650 focus:outline-none'
                            />
                        </div>

                        {/* 태그 입력 */}
                        <div className='w-full flex flex-col px-[10px] py-[6px] border-t border-b border-gray-650'>
                            <FilterHeader
                                activeFilters={selectedTags.map(id => tagIdToNameMap.get(id) ?? '').filter(Boolean)}
                                onOpenFilter={() => setIsFilterOpen(true)}
                                onRemoveFilter={(tagName) => {
                                    const tagId = tagNameToIdMap.get(tagName);
                                    if (tagId) setSelectedTags((prev) => prev.filter((id) => id !== tagId));
                                }} 
                            />
                        </div>
                    </div>

                    {/* 주최 */}
                    <div className='flex flex-col gap-[10px]'>
                        <label className='text-sb-16-hn text-gray-900'>주최</label>
                        <input
                            type='text'
                            value={organizer}
                            onChange={(e) => setOrganizer(e.target.value)}
                            placeholder='주최 기관/단체 입력'
                            className='w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] text-r-16-hn text-gray-750 placeholder:text-gray-650 focus:outline-none' />
                    </div>

                    {/* Field 1 (모집 대상 or 채용 형태) */}
                    <div className='flex flex-col gap-[10px]'>
                        <label className='text-sb-16-hn text-gray-900'>{config.field1Label}</label>
                        <input
                        type='text'
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder={config.field1Placeholder}
                        className='w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] text-r-16-hn text-gray-750 placeholder:text-gray-650 focus:outline-none' />
                    </div>

                    <div className='flex flex-col gap-[20px]'>
                        {/* 접수 기간 - 시작일 */}
                        <div className='flex flex-col gap-[10px]'>
                            <label className='text-sb-16-hn text-gray-900'>접수 기간</label>
                            <span className='text-r-14-hn text-gray-650'>시작일</span>
                            <div className='flex gap-[10px] flex-wrap'>
                                <div className='flex-1 relative'>
                                    <button type='button' onClick={() => setShowStartYearDropdown(!showStartYearDropdown)}
                                    className='w-full min-w-[113px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                        <span className='text-r-16-hn text-gray-750'>{startYear}년</span>
                                        <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showStartYearDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showStartYearDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {years.map((y) => (
                                        <button key={y} type='button' onClick={() => { 
                                            setStartYear(y);
                                            setStartDay((d) => clampDay(d, y, startMonth));
                                            if (endYear < y) {
                                                setEndYear(y);
                                                setEndMonth(startMonth);
                                                setEndDay(startDay);
                                            } else if (endYear === y && endMonth < startMonth) {
                                                setEndMonth(startMonth);
                                                setEndDay(startDay);
                                            } else if (endYear === y && endMonth === startMonth && endDay < startDay) {
                                                setEndDay(startDay);
                                            }

                                            // announce도 동일 (external만)
                                            if (type === 'external') {
                                                if (announceYear < y) {
                                                setAnnounceYear(y);
                                                setAnnounceMonth(startMonth);
                                                setAnnounceDay(startDay);
                                                } else if (announceYear === y && announceMonth < startMonth) {
                                                setAnnounceMonth(startMonth);
                                                setAnnounceDay(startDay);
                                                } else if (announceYear === y && announceMonth === startMonth && announceDay < startDay) {
                                                setAnnounceDay(startDay);
                                                }
                                            }
                                            setShowStartYearDropdown(false);
                                         }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${startYear === y ? 'text-primary' : 'text-gray-650'}`}>
                                            {y}년
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>

                                <div className='flex-1 relative'>
                                    <button type='button' onClick={() => setShowStartMonthDropdown(!showStartMonthDropdown)}
                                    className='w-full min-w-[86px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                        <span className='text-r-16-hn text-gray-750'>{startMonth}월</span>
                                        <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showStartMonthDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showStartMonthDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {MONTHS.map((m) => (
                                        <button key={m} type='button'
                                            onClick={() => {
                                                setStartMonth(m);
                                                setStartDay((d) => clampDay(d, startYear, m));
                                                if (endYear === startYear && endMonth < m) {
                                                    setEndMonth(m);
                                                    setEndDay(startDay);
                                                } else if (endYear === startYear && endMonth === m && endDay < startDay) {
                                                    setEndDay(startDay);
                                                }

                                                if (type === 'external') {
                                                    if (announceYear === startYear && announceMonth < m) {
                                                    setAnnounceMonth(m);
                                                    setAnnounceDay(startDay);
                                                    } else if (announceYear === startYear && announceMonth === m && announceDay < startDay) {
                                                    setAnnounceDay(startDay);
                                                    }
                                                }
                                                setShowStartMonthDropdown(false);
                                            }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${startMonth === m ? 'text-primary' : 'text-gray-650'}`}>
                                            {m}월
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>

                                <div className='flex-1 relative'>
                                    <button type='button' onClick={() => setShowStartDayDropdown(!showStartDayDropdown)}
                                    className='w-full min-w-[89px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                        <span className='text-r-16-hn text-gray-750'>{startDay}일</span>
                                        <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showStartDayDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showStartDayDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {startDays.map((d) => (
                                        <button key={d} type='button' 
                                        onClick={() => { 
                                            setStartDay(d); 
                                            if (endYear === startYear && endMonth === startMonth && endDay < d) {
                                                setEndDay(d);
                                            }
                                            if (type === 'external' && announceYear === startYear && announceMonth === startMonth && announceDay < d) {
                                                setAnnounceDay(d);
                                            }
                                            setShowStartDayDropdown(false); 
                                        }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${startDay === d ? 'text-primary' : 'text-gray-650'}`}>
                                            {d}일
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 접수 기간 - 마감일 */}
                        <div className='flex flex-col gap-[10px]'>
                            <span className='text-r-14-hn text-gray-650'>마감일</span>
                            <div className='flex gap-[10px] flex-wrap'>
                                <div className='flex-1 relative'>
                                    <button type='button' onClick={() => setShowEndYearDropdown(!showEndYearDropdown)}
                                    className='w-full min-w-[113px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                        <span className='text-r-16-hn text-gray-750'>{endYear}년</span>
                                        <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showEndYearDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showEndYearDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {years.filter((y) => y >= startYear).map((y) => (
                                        <button key={y} type='button' 
                                        onClick={() => { 
                                            setEndYear(y);
                                            setEndDay(d => clampDay(d, y, endMonth));
                                            setShowEndYearDropdown(false); 
                                        }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${endYear === y ? 'text-primary' : 'text-gray-650'}`}>
                                            {y}년
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>

                                <div className='flex-1 relative'>
                                    <button type='button' onClick={() => setShowEndMonthDropdown(!showEndMonthDropdown)}
                                    className='w-full min-w-[86px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                        <span className='text-r-16-hn text-gray-750'>{endMonth}월</span>
                                        <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showEndMonthDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showEndMonthDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {MONTHS.filter((m) => (endYear === startYear ? m >= startMonth : true)).map((m) => (
                                        <button key={m} type='button' 
                                            onClick={() => { 
                                                setEndMonth(m); 
                                                setEndDay(d => clampDay(d, endYear, m));
                                                setShowEndMonthDropdown(false); 
                                            }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${endMonth === m ? 'text-primary' : 'text-gray-650'}`}>
                                            {m}월
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>

                                <div className='flex-1 relative'>
                                    <button type='button' onClick={() => setShowEndDayDropdown(!showEndDayDropdown)}
                                    className='w-full min-w-[89px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                        <span className='text-r-16-hn text-gray-750'>{endDay}일</span>
                                        <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showEndDayDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showEndDayDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                        {endDayOptions.map((d) => (
                                        <button key={d} type='button' onClick={() => { setEndDay(d); setShowEndDayDropdown(false); }}
                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${endDay === d ? 'text-primary' : 'text-gray-650'}`}>
                                            {d}일
                                        </button>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/*수상 발표*/}
                    {type === 'external' && (
                        <div className='flex flex-col gap-[10px]'>
                            <label className='text-sb-16-hn text-gray-900'>{config.field2Label}</label>
                            <div className='flex gap-[10px] flex-wrap'>
                                <div className='flex-1 relative'>
                                <button type='button' onClick={() => setShowAnnounceYearDropdown(!showAnnounceYearDropdown)}
                                    className='w-full min-w-[113px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                    <span className='text-r-16-hn text-gray-750'>{announceYear}년</span>
                                    <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showAnnounceYearDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showAnnounceYearDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                    {years.filter((y) => y >= startYear).map((y) => (
                                        <button key={y} type='button' 
                                        onClick={() => { 
                                            setAnnounceYear(y);
                                            setAnnounceDay(d => clampDay(d, y, announceMonth));
                                            setShowAnnounceYearDropdown(false); 
                                        }}
                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${announceYear === y ? 'text-primary' : 'text-gray-650'}`}>
                                        {y}년
                                        </button>
                                    ))}
                                    </div>
                                )}
                            </div>

                            <div className='flex-1 relative'>
                                <button type='button' onClick={() => setShowAnnounceMonthDropdown(!showAnnounceMonthDropdown)}
                                    className='w-full min-w-[86px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                    <span className='text-r-16-hn text-gray-750'>{announceMonth}월</span>
                                    <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showAnnounceMonthDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showAnnounceMonthDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                    {MONTHS.filter((m) => (announceYear === startYear ? m >= startMonth : true)).map((m) => (
                                        <button key={m} type='button' 
                                        onClick={() => { 
                                            setAnnounceMonth(m);
                                            setAnnounceDay(d => clampDay(d, announceYear, m));
                                            setShowAnnounceMonthDropdown(false); 
                                        }}
                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${announceMonth === m ? 'text-primary' : 'text-gray-650'}`}>
                                        {m}월
                                        </button>
                                    ))}
                                    </div>
                                )}
                            </div>

                            <div className='flex-1 relative'>
                                <button type='button' onClick={() => setShowAnnounceDayDropdown(!showAnnounceDayDropdown)}
                                    className='w-full min-w-[89px] h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none'>
                                    <span className='text-r-16-hn text-gray-750'>{announceDay}일</span>
                                    <Icon name='arrow_down' className={`w-[24px] h-[24px] transition-transform ${showAnnounceDayDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showAnnounceDayDropdown && (
                                    <div className='absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto mt-1'>
                                    {announceDayOptions.map((d) => (
                                        <button key={d} type='button' onClick={() => { setAnnounceDay(d); setShowAnnounceDayDropdown(false); }}
                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${announceDay === d ? 'text-primary' : 'text-gray-650'}`}>
                                        {d}일
                                        </button>
                                    ))}
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 지원 URL */}
                    <div className='flex flex-col gap-[10px]'>
                        <label className='text-sb-16-hn text-gray-900'>공식 홈페이지 URL</label>
                        <input
                        type='text'
                        value={applyUrl}
                        onChange={(e) => setApplyUrl(e.target.value)}
                        placeholder='공식 홈페이지 링크 입력'
                        className='w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] text-r-16-hn text-gray-750 placeholder:text-gray-650 focus:outline-none' />
                    </div>

                    {/* 썸네일 */}
                    <div className='flex flex-col gap-[10px]'>
                        <label className='text-sb-16-hn text-gray-900'>{config.imageLabel}</label>
                        
                        {displayThumbnail  ? (
                        <div className='relative w-full h-[200px]'>
                            <img 
                                src={displayThumbnail ?? REPLACE_IMAGE} 
                                alt='썸네일' 
                                className='w-full h-full rounded-[12px] object-cover' 
                                onError={(e) => {
                                    e.currentTarget.onerror = null; //이미지 깨짐 방지
                                    e.currentTarget.src = REPLACE_IMAGE;
                                }}
                            />
                            <button type='button' aria-label='사진 삭제'
                                className='absolute top-[10px] right-[10px] w-[32px] h-[32px] bg-black/50 rounded-full flex items-center justify-center'
                                onClick={handleRemoveThumbnail}
                            >
                            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none'>
                                <path d='M6 18L18 6M6 6L18 18' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                            </svg>
                            </button>
                        </div>
                        ) : (
                        <button type='button' className='w-full p-[15px] flex items-center justify-center rounded-[5px] bg-gray-150 gap-[10px]'
                            onClick={() => fileInputRef.current?.click()}>
                            <Icon name='image'/>
                            <span className='text-r-16 text-gray-650 whitespace-pre-line'>{'대표이미지 추가\n(png, webp, jpeg)'}</span>
                        </button>
                        )}
                        
                        <input ref={fileInputRef} type='file' accept='image/png, image/webp, image/jpeg'
                        className='hidden' onChange={handleThumbnailChange} />
                    </div>

                    {/* 개요 */}
                    <div className='flex flex-col gap-[10px]'>
                        <label className='text-sb-16-hn text-gray-900'>{config.contentLabel}</label>
                        <Card width='100%' height={100} className='px-[15px] py-[15px]'>
                        <textarea 
                            value={contextTitle} 
                            onChange={(e) => setContextTitle(e.target.value)}
                            placeholder={config.contentPlaceholder}
                            className='h-full w-full resize-none bg-transparent outline-none text-r-16-hn text-gray-750 placeholder:text-gray-650' />
                        </Card>
                    </div>

                    {/* 상세 정보 */}
                    <div className='flex flex-col gap-[10px]'>
                        <label className='text-sb-16-hn text-gray-900'>{config.detailLabel}</label>
                        <Card width='100%' height={200} className='px-[15px] py-[15px]'>
                        <textarea value={context} onChange={(e) => setContext(e.target.value)}
                            placeholder={config.detailPlaceholder}
                            className='h-full w-full resize-none bg-transparent outline-none text-r-16-hn text-gray-750 placeholder:text-gray-650' />
                        </Card>
                    </div>
                </section>
            </div>

        <PopUp
            isOpen={isConfirmOpen}
            type='info'
            title={confirmTitle}
            content={confirmContent}
            onLeftClick={() => setIsConfirmOpen(false)}
            onRightClick={handleConfirm}
        />
        <PopUp
            isOpen={isCancelWarningOpen}
            type='warning'
            title='변경사항이 있습니다.\n나가시겠습니까?'
            content='저장하지 않을 시 변경사항이 삭제됩니다.'
            leftButtonText='나가기'
            onLeftClick={() => { setIsCancelWarningOpen(false); navigate(-1); }}
            onRightClick={() => setIsCancelWarningOpen(false)}
        />

        <PopUp
            isOpen={isFileErrorOpen}
            type="error"
            title="업로드할 수 없는 파일"
            content={fileErrorMessage}
            rightButtonText="확인"
            onClick={() => setIsFileErrorOpen(false)}
        />

        <TagsFilterModal
            isOpen={isFilterOpen}
            tags={selectedTags.map(id => tagIdToNameMap.get(id) ?? '').filter(Boolean)}
            onClose={() => setIsFilterOpen(false)}
            onSave={(tagNames) => {
                const tagIds = tagNames
                    .map(name => tagNameToIdMap.get(name))
                    .filter((id): id is number => id !== undefined);
                setSelectedTags(tagIds);
                setIsFilterOpen(false);
            }}
            categories={tagCategories}
            allTags={allTags}
        />
        </HeaderLayout>
    );
};
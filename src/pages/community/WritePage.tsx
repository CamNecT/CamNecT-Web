import type { AxiosError } from 'axios';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CommunityUploadPresignItemResponse } from '../../api-types/communityApiTypes';
import { createCommunityPost, getCommunityPostDetail, postCommunityUploadPresign, updateCommunityPost } from '../../api/community';
import BoardTypeToggle from '../../components/BoardTypeToggle';
import BottomSheetModal from '../../components/BottomSheetModal/BottomSheetModal';
import FilterHeader from '../../components/FilterHeader';
import Icon from '../../components/Icon';
import PopUp from '../../components/Pop-up';
import TagsFilterModal from '../../components/TagsFilterModal';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useTagList } from '../../hooks/useTagList';
import { EmptyLayout } from '../../layouts/EmptyLayout';
import { useAuthStore } from '../../store/useAuthStore';
import type { CommunityPostDetail } from '../../types/community';
import { mapToCommunityPostDetail } from '../../utils/communityMapper';
import { mapToCommunityPost } from './utils/post';
import { getFileName } from '../../utils/getFileName';

//TODO: 사진 미리보기 개수 제한이나 파일 크기 제한을 정책으로 추가할지 결정 필요
const boardTypes = ['정보', '질문'] as const;
type BoardType = (typeof boardTypes)[number];

export const WritePage = () => {
    const navigate = useNavigate();
    const { postId } = useParams();
    const isEditMode = Boolean(postId);
    const { filterCategories, filterTags, mapTagNamesToIds, mapTagIdToName, mapTagIdsToNames } = useTagList();

    const [editPost, setEditPost] = useState<CommunityPostDetail | null>(null);
    const didInitEditRef = useRef(false);
    // 수정 전 첨부파일 목록과 비교해서 변경 여부를 판단하기 위해 보관한다.
    const originalAttachmentKeysRef = useRef<string[]>([]);

    const initialBoardType = (editPost?.boardType as BoardType | undefined) ?? null;
    const initialTitle = editPost?.title ?? '';
    const initialContent = editPost?.content ?? '';

    // 페이지 공통 상태: 게시판/입력/모달/미리보기
    // 게시판 선택 모달 상태
    const [isBoardOpen, setIsBoardOpen] = useState(false);
    // 게시판 타입: 확정/임시 선택
    const [boardType, setBoardType] = useState<BoardType | null>(initialBoardType);
    const [draftBoardType, setDraftBoardType] = useState<BoardType | null>(initialBoardType);
    // 입력 폼 상태
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const isKeyboardUp = window.innerHeight - viewportHeight > 100;
    // 완료 확인 모달 상태
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 작성 취소 경고 팝업 상태
    const [isCancelWarningOpen, setIsCancelWarningOpen] = useState(false);
    const [errorPopUp, setErrorPopUp] = useState<{ title: string; content: string } | null>(null);
    type AttachmentItem = {
        id: string;
        file: File;
        previewUrl: string;
        kind: 'image' | 'pdf';
    };
    const [existingAttachments, setExistingAttachments] = useState(
        editPost?.attachments ?? []
    );
    const [newAttachments, setNewAttachments] = useState<AttachmentItem[]>([]);
    // 숨김 파일 input 제어
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { prepareFile, revokeUrl } = useFileUpload({
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    });
    const userId = useAuthStore((state) => state.user?.id);

    const [selectedTags, setSelectedTags] = useState<string[]>(
        editPost?.categories ?? [],
    );
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // sortOrder 기준으로 정렬된 기존 첨부파일 키 목록을 만든다.
    const getSortedAttachments = (
        attachments: NonNullable<CommunityPostDetail['attachments']>,
    ) => attachments.slice().sort((a, b) => a.sortOrder - b.sortOrder);

    const getSortedAttachmentKeys = (
        attachments: NonNullable<CommunityPostDetail['attachments']>,
    ) =>
        getSortedAttachments(attachments).map((attachment) => attachment.fileKey);

    // 첨부파일 순서/구성이 수정 전과 같은지 확인한다.
    const areAttachmentKeysEqual = (left: string[], right: string[]) =>
        left.length === right.length && left.every((key, index) => key === right[index]);

    const openBoardSelector = () => {
        setDraftBoardType(boardType);
        setIsBoardOpen(true);
    };

    const closeBoardSelector = (shouldApply: boolean) => {
        if (shouldApply && draftBoardType) {
            setBoardType(draftBoardType);
        }
        setIsBoardOpen(false);
    };

    const boardLabel = boardType ?? '게시판';
    const boardLabelColor = boardType
        ? 'var(--ColorMain, #00C56C)'
        : 'var(--ColorGray2, #A1A1A1)';
    const isQuestionBoard = boardType === '질문';
    const confirmTitle = isEditMode
        ? `${boardType ?? '게시글'}을 수정하시겠습니까?`
        : '게시글을 등록하시겠습니까?';
    const confirmContent = isQuestionBoard
        ? '답변 채택 후 게시물의\n수정 및 삭제가 불가능 합니다.'
        : isEditMode
            ? '수정된 내용으로 저장됩니다.'
            : '등록 후에도 수정/삭제가 가능합니다.';
    const isSubmitEnabled =
        Boolean(boardType) &&
        title.trim().length > 0 &&
        content.trim().length > 0 &&
        selectedTags.length > 0;
    const hasDraftContent =
        title.trim().length > 0 ||
        content.trim().length > 0 ||
        existingAttachments.length > 0 ||
        newAttachments.length > 0 ||
        Boolean(boardType) ||
        selectedTags.length > 0;

    // 이미지 업로드 전 가로/세로 사이즈 측정
    const getImageSize = (file: File) =>
        new Promise<{ width: number; height: number }>((resolve) => {
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                resolve({ width: image.width, height: image.height });
                URL.revokeObjectURL(url);
            };
            image.onerror = () => {
                resolve({ width: 0, height: 0 });
                URL.revokeObjectURL(url);
            };
            image.src = url;
        });

    // Presign 발급 → S3 PUT → 서버에 넘길 첨부 메타 생성
    const uploadAttachments = async (
        attachments: { file: File; kind: 'image' | 'pdf' }[],
        ownerId: number,
    ) => {
        if (attachments.length === 0) return [];

        const images = attachments.filter((item) => item.kind === 'image');
        const orderedAttachments =
            images.length > 0
                ? [images[0], ...attachments.filter((item) => item !== images[0])]
                : attachments;

        const presignItems = orderedAttachments.map((item) => ({
            contentType: item.file.type || 'application/octet-stream',
            size: item.file.size,
            originalFilename: item.file.name,
        }));

        let presignResponse;
        try {
            presignResponse = await postCommunityUploadPresign({
                params: { userId: ownerId },
                body: { items: presignItems },
            });
        } catch (error) {
            const status = (error as AxiosError)?.response?.status;
            if (status === 429) {
                const limitError = new Error('UPLOAD_LIMIT_EXCEEDED');
                limitError.name = 'UploadLimitError';
                throw limitError;
            }
            throw error;
        }

        const presignedItems: CommunityUploadPresignItemResponse[] =
            presignResponse.data.items ?? [];
        if (presignedItems.length !== orderedAttachments.length) {
            throw new Error('Presign 응답 개수가 업로드 파일 수와 일치하지 않습니다.');
        }

        const sizes = await Promise.all(
            orderedAttachments.map(async (item) => {
                if (item.kind !== 'image') return { width: 0, height: 0 };
                return getImageSize(item.file);
            }),
        );

        await Promise.all(
            presignedItems.map((presigned, index) => {
                const attachment = orderedAttachments[index];
                const headers = {
                    'Content-Type': attachment.file.type || 'application/octet-stream',
                    ...(presigned.requiredHeaders ?? {}),
                };
                return fetch(presigned.uploadUrl, {
                    method: 'PUT',
                    headers,
                    body: attachment.file,
                }).then((response) => {
                    if (!response.ok) {
                        throw new Error(`S3 업로드 실패: ${response.status}`);
                    }
                });
            }),
        );

        return presignedItems.map((item, index) => ({
            fileKey: item.fileKey,
            width: sizes[index].width,
            height: sizes[index].height,
            fileSize: orderedAttachments[index].file.size,
        }));
    };

    // 모바일 키보드 높이에 맞춰 하단 사진 영역 위치 업데이트
    useEffect(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        const updateHeight = () => {
            setViewportHeight(viewport.height);
        };

        updateHeight();
        viewport.addEventListener('resize', updateHeight);
        viewport.addEventListener('scroll', updateHeight);

        return () => {
            viewport.removeEventListener('resize', updateHeight);
            viewport.removeEventListener('scroll', updateHeight);
        };
    }, []);

    useEffect(() => {
        didInitEditRef.current = false;
        originalAttachmentKeysRef.current = [];
        setEditPost(null);
    }, [postId]);

    useEffect(() => {
        if (!isEditMode || !postId) return;
        const numericUserId = Number(userId);
        if (!Number.isFinite(numericUserId)) return;
        getCommunityPostDetail({ postId, params: { userId: numericUserId } })
            .then((response) => {
                setEditPost(mapToCommunityPostDetail(response.data, mapTagIdToName));
            })
            .catch(() => {
                setEditPost(mapToCommunityPost(postId));
            });
    }, [isEditMode, postId, userId, mapTagIdToName]);

    useEffect(() => {
        if (!isEditMode || !editPost || didInitEditRef.current) return;
        const mappedTags = editPost.tagIds
            ? mapTagIdsToNames(editPost.tagIds)
            : editPost.categories ?? [];
        const needsTags = Boolean(editPost.tagIds && editPost.tagIds.length > 0);
        if (needsTags && mappedTags.length === 0) return;
        const nextBoardType = editPost.boardType as BoardType;
        setBoardType(nextBoardType);
        setDraftBoardType(nextBoardType);
        setTitle(editPost.title);
        setContent(editPost.content);
        setSelectedTags(mappedTags);
        setExistingAttachments(editPost.attachments ?? []);
        setNewAttachments([]);
        originalAttachmentKeysRef.current = getSortedAttachmentKeys(editPost.attachments ?? []);
        didInitEditRef.current = true;
    }, [isEditMode, editPost, mapTagIdsToNames]);

    // 파일 선택 -> object URL 생성 -> 미리보기 상태에 추가
    const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const nextAttachments = Array.from(files)
            .map((file) => {
                const prepared = prepareFile(file);
                if (!prepared) return null;
                const kind: AttachmentItem['kind'] =
                    file.type === 'application/pdf' ? 'pdf' : 'image';
                return { id: prepared.id, file, previewUrl: prepared.previewUrl, kind };
            })
            .filter(
                (attachment): attachment is AttachmentItem => attachment !== null,
            );

        setNewAttachments((prev) => [...nextAttachments, ...prev]);
        event.target.value = '';
    };

    // 개별 미리보기 삭제 + object URL 해제
    const handleRemoveAttachment = (id: string) => {
        setNewAttachments((prev) => {
            const target = prev.find((attachment) => attachment.id === id);
            if (target) {
                if (target.previewUrl) {
                    revokeUrl(target.previewUrl);
                }
            }
            return prev.filter((attachment) => attachment.id !== id);
        });
    };

    // 완료 버튼 -> 확인 모달 오픈
    const handleSubmit = () => {
        setIsConfirmOpen(true);
    };

    // 확인 모달에서 "네" 클릭 시 메인으로 이동
    // 작성/수정 확정 처리
    const handleConfirm = async () => {
        // TODO: 수정 모드인 경우 변경된 데이터만 전송
        if (!userId) {
            console.warn('로그인 정보가 없습니다. 다시 로그인해 주세요.');
            return;
        }
        if (isSubmitting) return;
        const numericUserId = Number(userId);
        if (!Number.isFinite(numericUserId)) {
            console.warn('로그인 정보가 올바르지 않습니다. 다시 로그인해 주세요.');
            return;
        }

        const isQuestionBoard = boardType === '질문';
        const boardCode = isQuestionBoard ? 'QUESTION' : 'INFO';
        const tagIds = mapTagNamesToIds(selectedTags);

        setIsSubmitting(true);
        try {
            const uploadedAttachments = await uploadAttachments(
                newAttachments.map((attachment) => ({
                    file: attachment.file,
                    kind: attachment.kind,
                })),
                numericUserId,
            );
            if (isEditMode && postId) {
                const currentExistingAttachments = getSortedAttachments(existingAttachments);
                const currentExistingAttachmentKeys = currentExistingAttachments.map(
                    (attachment) => attachment.fileKey,
                );
                // 변경 없음은 null, 전체 삭제는 빈 배열, 유지/추가는 모두 fileKey로 전달한다.
                const hasAttachmentChanges =
                    newAttachments.length > 0 ||
                    !areAttachmentKeysEqual(
                        originalAttachmentKeysRef.current,
                        currentExistingAttachmentKeys,
                    );
                const attachments = hasAttachmentChanges
                    ? [
                        ...currentExistingAttachments.map((attachment) => ({
                            fileKey: attachment.fileKey,
                            width: attachment.width,
                            height: attachment.height,
                            fileSize: attachment.fileSize,
                        })),
                        ...uploadedAttachments.map((attachment) => ({
                            fileKey: attachment.fileKey,
                            width: attachment.width,
                            height: attachment.height,
                            fileSize: attachment.fileSize,
                        })),
                    ]
                    : null;

                await updateCommunityPost({
                    postId,
                    params: { userId: numericUserId },
                    body: {
                        title: title.trim(),
                        content: content.trim(),
                        anonymous: false,
                        tagIds,
                        attachments,
                    },
                });
                // 저장 후 뒤로가기로 수정 페이지에 다시 돌아오지 않도록 히스토리를 교체한다.
                navigate(`/community/post/${postId}`, { replace: true });
                return;
            }

            const response = await createCommunityPost({
                body: {
                    boardCode,
                    title: title.trim(),
                    content: content.trim(),
                    anonymous: false,
                    tagIds,
                    attachments: uploadedAttachments,
                },
            });
            const nextPostId = response.data.postId;
            // 작성 후 뒤로가기로 글쓰기 페이지에 다시 돌아오지 않도록 히스토리를 교체한다.
            navigate(`/community/post/${nextPostId}`, { replace: true });
        } catch (error) {
            if (error instanceof Error && error.name === 'UploadLimitError') {
                setErrorPopUp({
                    title: '작성 오류',
                    content: '업로드 가능한 파일 개수 제한을 초과했습니다.',
                });
                return;
            }
            console.error('게시글 업로드/등록에 실패했습니다.', error);
        } finally {
            setIsSubmitting(false);
            setIsConfirmOpen(false);
        }
    };

    const handleCancelClick = () => {
        if (hasDraftContent) {
            setIsCancelWarningOpen(true);
            return;
        }
        navigate(-1);
    };

    const handleCancelConfirm = () => {
        setIsCancelWarningOpen(false);
        navigate(-1);
    };

    const handleCancelDismiss = () => {
        setIsCancelWarningOpen(false);
    };

    return (
        <EmptyLayout>
            <div className='flex w-full flex-col bg-white overflow-hidden' style={{ height: `${viewportHeight}px` }}>
                {/* 상단 헤더: 뒤로가기, 게시판 선택, 완료 버튼 */}
                <header
                    className='flex w-full shrink-0 items-center justify-between bg-white'
                    style={{
                        padding: '10px 25px',
                        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
                    }}
                >
                    <button
                        type='button'
                        aria-label='작성 취소'
                        onClick={handleCancelClick}
                        className='flex items-center'
                    >
                        <Icon name='x' />
                    </button>

                    <div className='flex items-center' style={{ gap: '13px' }}>
                        {!isEditMode ? (
                            <button
                                type='button'
                                onClick={openBoardSelector}
                                className='flex text-r-16'
                                style={{ color: boardLabelColor }}
                            >
                                {boardLabel}
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    width='22'
                                    height='22'
                                    viewBox='0 0 22 22'
                                    fill='none'
                                >
                                    <path
                                        d='M17.875 7.5625L11 14.4375L4.125 7.5625'
                                        stroke='#A1A1A1'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                            </button>
                        ) : (
                            <span className='text-r-16' style={{ color: boardLabelColor }}>
                                {boardLabel}
                            </span>
                        )}
                        <button
                            type='button'
                            className='text-b-16-hn'
                            style={{
                                color: isSubmitEnabled
                                    ? 'var(--ColorMain, #00C56C)'
                                    : 'var(--ColorGray2, #A1A1A1)',
                            }}
                            onClick={handleSubmit}
                            disabled={!isSubmitEnabled}
                        >
                            완료
                        </button>
                    </div>
                </header>

                {/* 글쓰기 본문 영역 */}
                <section className='flex w-full flex-1 flex-col px-[25px] overflow-y-auto'>
                    {/* 제목 입력 */}
                    <div
                        className='flex w-full flex-col'
                        style={{
                            padding: '10px 10px',
                            borderBottom: '1px solid var(--ColorGray2, #A1A1A1)',
                        }}
                    >
                        <input
                            id='community-title'
                            name='title'
                            type='text'
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder='제목'
                            className='w-full border-none bg-transparent p-0 text-b-18 outline-none placeholder:text-gray-650'
                            style={{
                                color: title ? 'var(--ColorBlack, #202023)' : 'var(--ColorGray2, #A1A1A1)',
                            }}
                        />
                    </div>

                    {/* 필터 선택 */}
                    <div
                        className='flex w-full flex-col'
                        style={{
                            padding: '6px 10px',
                            borderBottom: '1px solid var(--ColorGray2, #A1A1A1)',
                        }}
                    >
                        <FilterHeader
                            activeFilters={selectedTags}
                            onOpenFilter={() => setIsFilterOpen(true)}
                            onRemoveFilter={(tag) =>
                                setSelectedTags((prev) => prev.filter((item) => item !== tag))
                            }
                        />
                    </div>

                    {/* 내용 입력 */}
                    <div className='flex w-full flex-1 flex-col' style={{ padding: isKeyboardUp ? '10px 10px 20px' : '15px 10px 40px' }}>
                        <textarea
                            id='community-content'
                            name='content'
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder='내용을 적어주세요'
                            className='min-h-[160px] w-full flex-1 border-none bg-transparent p-0 text-[16px] font-normal leading-[140%] tracking-[-0.64px] outline-none placeholder:text-gray-650'
                            style={{
                                fontWeight: 400,
                                color: content
                                    ? 'var(--ColorGray3, #646464)'
                                    : 'var(--ColorGray2, #A1A1A1)',
                            }}
                        />
                    </div>
                </section>

                {/* 하단 사진 추가/미리보기 영역 */}
                <div className='w-full shrink-0 bg-white'>
                    <div className='flex w-full px-[25px]' style={{ paddingBottom: isKeyboardUp ? '10px' : '25px' }}>
                        <div className='flex w-full items-center overflow-x-auto' style={{ gap: '12px' }}>
                            {/* 사진 추가 버튼 */}
                            <button
                                type='button'
                                className='flex flex-col items-center justify-center rounded-[12px] flex-shrink-0'
                                style={{ 
                                    background: 'var(--ColorGray1, #ECECEC)', 
                                    gap: isKeyboardUp ? '4px' : '10px',
                                    width: isKeyboardUp ? '100px' : '128px',
                                    height: isKeyboardUp ? '80px' : '128px'
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    width={isKeyboardUp ? '24' : '30'}
                                    height={isKeyboardUp ? '24' : '30'}
                                    viewBox='0 0 30 30'
                                    fill='none'
                                >
                                <path
                                    d='M8.53375 7.71852C8.30874 8.07466 8.00852 8.37725 7.65417 8.60506C7.29982 8.83287 6.89991 8.98039 6.4825 9.03727C6.0075 9.10477 5.53625 9.17727 5.065 9.25602C3.74875 9.47477 2.8125 10.6335 2.8125 11.9673V22.4998C2.8125 23.2457 3.10882 23.9611 3.63626 24.4885C4.16371 25.016 4.87908 25.3123 5.625 25.3123H24.375C25.1209 25.3123 25.8363 25.016 26.3637 24.4885C26.8912 23.9611 27.1875 23.2457 27.1875 22.4998V11.9673C27.1875 10.6335 26.25 9.47477 24.935 9.25602C24.4634 9.17744 23.9909 9.10452 23.5175 9.03727C23.1003 8.98022 22.7006 8.83262 22.3465 8.60481C21.9924 8.37701 21.6924 8.07451 21.4675 7.71852L20.44 6.07352C20.2092 5.69864 19.8915 5.38489 19.5138 5.15881C19.1361 4.93274 18.7094 4.80101 18.27 4.77477C16.0916 4.65776 13.9084 4.65776 11.73 4.77477C11.2906 4.80101 10.8639 4.93274 10.4862 5.15881C10.1085 5.38489 9.79077 5.69864 9.56 6.07352L8.53375 7.71852Z'
                                    stroke='#A1A1A1'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                <path
                                    d='M20.625 15.9375C20.625 17.4293 20.0324 18.8601 18.9775 19.915C17.9226 20.9699 16.4918 21.5625 15 21.5625C13.5082 21.5625 12.0774 20.9699 11.0225 19.915C9.96763 18.8601 9.375 17.4293 9.375 15.9375C9.375 14.4457 9.96763 13.0149 11.0225 11.96C12.0774 10.9051 13.5082 10.3125 15 10.3125C16.4918 10.3125 17.9226 10.9051 18.9775 11.96C20.0324 13.0149 20.625 14.4457 20.625 15.9375ZM23.4375 13.125H23.4475V13.135H23.4375V13.125Z'
                                    stroke='#A1A1A1'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                                <span
                                    className='font-normal leading-[140%] tracking-[-0.64px]'
                                    style={{ 
                                        color: 'var(--ColorGray2, #A1A1A1)',
                                        fontSize: isKeyboardUp ? '13px' : '16px'
                                    }}
                                >
                                    파일추가
                                </span>
                        </button>
                        {/* 기존 이미지 미리보기 */}
                        {existingAttachments.map((attachment, index) => (
                            <div
                                key={`existing-${index}`}
                                className='relative flex-shrink-0'
                                style={{ 
                                    width: isKeyboardUp ? '130px' : '170px', 
                                    height: isKeyboardUp ? '80px' : '128px' 
                                }}
                            >
                                {attachment.fileKey.endsWith('.pdf') ? (
                                    <div className='flex h-full w-full flex-col items-center justify-center rounded-[12px] border border-[#ECECEC] bg-white text-center'
                                        style={{ gap: '6px', padding: '10px' }}
                                    >
                                        <span className='text-b-14-hn text-gray-900'>PDF</span>
                                        <span className='text-r-12 text-gray-650 line-clamp-2'>
                                            {getFileName(attachment.downloadUrl)}
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={attachment.downloadUrl}
                                        alt='existing'
                                        style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                                    />
                                )}
                                <button
                                    type='button'
                                    aria-label='파일 삭제'
                                    className='absolute'
                                    style={{ top: '10px', right: '10px' }}
                                    onClick={() => setExistingAttachments((prev) => prev.filter((_, i) => i !== index))}
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>
                                        <path d='M6 18L18 6M6 6L18 18' stroke='#646464' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {/* 새 파일 미리보기 */}
                        {newAttachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className='relative flex-shrink-0'
                                style={{ 
                                    width: isKeyboardUp ? '130px' : '170px', 
                                    height: isKeyboardUp ? '80px' : '128px' 
                                }}
                            >
                                {attachment.kind === 'image' ? (
                                    <img
                                        src={attachment.previewUrl}
                                        alt='preview'
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '12px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <div
                                        className='flex h-full w-full flex-col items-center justify-center rounded-[12px] border border-[#ECECEC] bg-white text-center'
                                        style={{ gap: '6px', padding: '10px' }}
                                    >
                                        <span className='text-b-14-hn text-gray-900'>PDF</span>
                                        <span className='text-r-12 text-gray-650 line-clamp-2'>
                                            {attachment.file.name}
                                        </span>
                                    </div>
                                )}
                                <button
                                    type='button'
                                    aria-label='파일 삭제'
                                    className='absolute'
                                    style={{ top: '10px', right: '10px' }}
                                    onClick={() => handleRemoveAttachment(attachment.id)}
                                >
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='24'
                                        height='24'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <path
                                            d='M6 18L18 6M6 6L18 18'
                                            stroke='#646464'
                                            strokeWidth='1.5'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {/* 숨김 파일 input */}
                        <input
                            ref={fileInputRef}
                            id='community-photos'
                            name='photos'
                            type='file'
                            accept='image/*,application/pdf'
                            multiple
                            className='hidden'
                            onChange={handleAttachmentChange}
                        />
                    </div>
                </div>
            </div>
            </div>

            {/* 게시판 선택 모달 */}
            {!isEditMode && (
                <BottomSheetModal isOpen={isBoardOpen} onClose={() => closeBoardSelector(true)} height='235px'>
                    <div
                        className='flex w-full flex-col'
                        style={{
                            padding: '10px 24px 56px',
                            background: 'var(--Color_Gray_B, #FCFCFC)',
                            gap: '20px',
                        }}
                    >
                        <div className='flex flex-col' style={{ gap: '20px' }}>
                            <span className='text-b-18' style={{ color: 'var(--ColorBlack, #202023)' }}>
                                게시판 선택
                            </span>

                            <div className='flex flex-col' style={{ gap: '20px' }}>
                                {boardTypes.map((type) => (
                                    <div
                                        key={type}
                                        className='flex items-center justify-between'
                                        style={{ padding: '0 12px' }}
                                    >
                                        <span className='text-m-16' style={{ color: 'var(--ColorGray3, #646464)' }}>
                                            {type}
                                        </span>
                                        <BoardTypeToggle
                                            label={type}
                                            selected={draftBoardType === type}
                                            onClick={() => setDraftBoardType(type)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </BottomSheetModal>
            )}

            {/* 완료 확인 모달 */}
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
                title={'작성된 내용이 있습니다.\n삭제하시겠습니까?'}
                content='삭제된 내용은 복구 불가능 합니다.'
                onLeftClick={handleCancelConfirm}
                onRightClick={handleCancelDismiss}
            />
            {errorPopUp && (
                <PopUp
                    isOpen={true}
                    type='confirm'
                    title={errorPopUp.title}
                    content={errorPopUp.content}
                    onClick={() => setErrorPopUp(null)}
                />
            )}

            <TagsFilterModal
                isOpen={isFilterOpen}
                tags={selectedTags}
                onClose={() => setIsFilterOpen(false)}
                onSave={(next) => {
                    setSelectedTags(next);
                    setIsFilterOpen(false);
                }}
                categories={filterCategories}
                allTags={filterTags}
            />
        </EmptyLayout>
    );
};

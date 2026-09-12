import { Fragment, useEffect, useRef } from 'react';
import Icon from '../../../components/Icon';
import type { CommentItem as CommentItemType } from '../../../types/community';

type CommentItemProps = {
  comment: CommentItemType;
  isReply?: boolean;
  isQuestionPost: boolean;
  isAdopted: boolean;
  adoptedCommentId?: string;
  showAdoptButton: boolean;
  isHighlighted: boolean;
  isEditing: boolean;
  editingContent: string;
  onEditingChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onOpenCommentOptions: (comment: CommentItemType) => void;
  onOpenAdoptPopup: (comment: CommentItemType) => void;
  onReplyClick: (comment: CommentItemType) => void;
  formatDate: (value: string) => string;
  renderReply: (comment: CommentItemType) => React.ReactNode;
};

const CommentItem = ({
  comment,
  isReply = false,
  isQuestionPost,
  isAdopted,
  adoptedCommentId,
  showAdoptButton,
  isHighlighted,
  isEditing,
  editingContent,
  onEditingChange,
  onSaveEdit,
  onCancelEdit,
  onOpenCommentOptions,
  onOpenAdoptPopup,
  onReplyClick,
  formatDate,
  renderReply,
}: CommentItemProps) => {
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 편집 모드에서 textarea 높이를 자동으로 맞춤
  useEffect(() => {
    if (!isEditing) return;
    const textarea = editTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editingContent, isEditing]);

  // 채택된 댓글 표시 여부 계산
  const isAdoptedComment = isQuestionPost && isAdopted && adoptedCommentId === comment.id;
  // 삭제 여부를 본문 문구로 추측하지 않고 author=null을 변환한 명시적 상태로 판단한다.
  const isDeletedComment = Boolean(comment.isDeleted);
  const replyItems =
    comment.replies && comment.replies.length > 0
      ? comment.replies.map((reply) => renderReply(reply))
      : null;
  if (isDeletedComment) {
    // 삭제된 루트 스레드에도 새 대댓글 작성이 허용되므로 답글 버튼과 기존 답글은 유지한다.
    return (
      <Fragment>
        <div
          className={`flex flex-col border-b border-[var(--ColorGray1,#ECECEC)] ${
            isReply
              ? 'bg-[var(--Color_Gray_B,#FCFCFC)]'
              : isHighlighted
                ? 'bg-[var(--ColorSub2,#F2FCF8)]'
                : isAdoptedComment
                  ? 'bg-[var(--ColorSub2,#F2FCF8)]'
                  : ''
          }`}
        >
        <div
          id={`comment-${comment.id}`}
          className='flex gap-[10px]'
          style={{
            padding: '20px 25px',
            paddingLeft: isReply ? '35px' : '25px',
          }}
          >
            {isReply ? <Icon name='reply' className='h-6 w-6 shrink-0' /> : null}
            <div className='flex flex-col gap-[10px]'>
              <div className='select-text text-[16px] leading-[160%] text-[var(--ColorGray2,#A1A1A1)]'>
                {comment.content}
              </div>
              {!isReply ? (
                <button
                  type='button'
                  className='w-fit text-m-12 text-[var(--ColorGray2,#A1A1A1)]'
                  onClick={() => onReplyClick(comment)}
                >
                  답글 달기
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {replyItems}
      </Fragment>
    );
  }
  return (
    <Fragment>
      <div
        className={`flex flex-col border-b border-[var(--ColorGray1,#ECECEC)] ${
          isReply
            ? 'bg-[var(--Color_Gray_B,#FCFCFC)]'
            : isHighlighted
              ? 'bg-[var(--ColorSub2,#F2FCF8)]'
              : isAdoptedComment
                ? 'bg-[var(--ColorSub2,#F2FCF8)]'
                : ''
        }`}
      >
        <div
          id={`comment-${comment.id}`}
          className={`flex gap-[10px] ${
            isReply ? 'py-[15px] pl-[35px] pr-[25px]' : 'px-[25px] pb-[20px] pt-[17px]'
          }`}
        >
          {isReply ? <Icon name='reply' className='h-6 w-6 shrink-0' /> : null}
          <div className={`flex w-full flex-col ${isReply ? 'pt-1' : ''}`}>
            <div className='flex items-start justify-between gap-[12px]'>
              <div>
                <div className='text-[14px] font-semibold text-[var(--ColorBlack,#202023)]'>
                  {comment.author.name}
                </div>
                <div className='text-[12px] text-[var(--ColorGray3,#646464)]'>
                  {comment.author.major}
                  {comment.author.studentId ? ` · ${comment.author.studentId}학번` : ''}
                </div>
              </div>
              {comment.content !== '삭제된 댓글입니다.' ? (
                <button
                  type='button'
                  className='shrink-0'
                  onClick={() => onOpenCommentOptions(comment)}
                  aria-label='댓글 옵션 열기'
                >
                  <Icon name='more_menu' className='h-6 w-6' />
                </button>
              ) : null}
            </div>

            {isEditing ? (
              <textarea
                ref={editTextareaRef}
                value={editingContent}
                onChange={(event) => onEditingChange(event.target.value)}
                rows={1}
                maxLength={5000}
                className='mt-[5px] min-h-[24px] w-full select-text resize-none rounded-[10px] border border-[var(--ColorGray1,#ECECEC)] bg-white p-[10px] text-[16px] leading-[160%] text-[var(--ColorGray3,#646464)] focus:outline-none'
              />
            ) : (
              <div className='mt-[5px] select-text whitespace-pre-wrap text-[16px] leading-[160%] text-[var(--ColorGray3,#646464)]'>
                {comment.content}
              </div>
            )}

            <div className='mt-[15px] flex items-center justify-between text-[12px] font-medium text-[var(--ColorGray2,#A1A1A1)]'>
              {isEditing ? (
                <div className='flex w-full items-center justify-between'>
                  <button
                    type='button'
                    className='flex h-[20px] w-[20px] items-center justify-center'
                    onClick={onCancelEdit}
                    aria-label='댓글 수정 취소'
                  >
                    <svg
                      className='h-4 w-4'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M7 21L21 7M7 7L21 21'
                        stroke='var(--ColorRed,#FF3838)'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                  <button
                    type='button'
                    className='flex h-[20px] w-[20px] items-center justify-center'
                    onClick={onSaveEdit}
                    aria-label='댓글 수정 저장'
                  >
                    <svg
                      className='h-4 w-4'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M4 12L9 17L20 6'
                        stroke='var(--ColorMain,#00C56C)'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className='flex items-center gap-[10px]'>
                    {!isReply ? (
                      <button
                        type='button'
                        className={`text-m-12 ${
                          isHighlighted
                            ? 'text-[var(--ColorRed,#FF5A5A)]'
                            : 'text-[var(--ColorGray2,#A1A1A1)]'
                        }`}
                        onClick={() => onReplyClick(comment)}
                      >
                        {isHighlighted ? '답글 취소' : '답글 달기'}
                      </button>
                    ) : null}
                    {showAdoptButton ? (
                      <button
                        type='button'
                        className='inline-flex items-center justify-center gap-[7px] rounded-[5px] border border-[var(--ColorMain,#00C56C)] px-[8px] py-[4px] text-m-14 text-[var(--ColorMain,#00C56C)]'
                        onClick={() => onOpenAdoptPopup(comment)}
                      >
                        <Icon
                          name='checkCircle'
                          className='h-5 w-5 text-[var(--ColorMain,#00C56C)]'
                        />
                        채택하기
                      </button>
                    ) : null}
                    {isAdoptedComment ? (
                      <span className='inline-flex items-center gap-[7px] rounded-[5px] border border-[var(--ColorMain,#00C56C)] px-[10px] py-[4px] text-r-12 text-[var(--ColorMain,#00C56C)]'>
                        <Icon
                          name='checkCircle'
                          className='h-[16px] w-[16px] text-[var(--ColorMain,#00C56C)]'
                        />
                        채택된 댓글
                      </span>
                    ) : null}
                  </div>
                  <span>{formatDate(comment.createdAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {replyItems}
    </Fragment>
  );
};

export type { CommentItemProps };
export default CommentItem;

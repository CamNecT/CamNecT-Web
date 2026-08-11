import { type CommunityPostItem } from "../../types/mypage/mypageTypes";
import { formatTimeAgo } from "../../utils/formatDate";
import Category from "../Category";
import Icon from "../Icon";
import { Link } from "react-router-dom";
import replaceImg from "../../assets/image/replaceImg.png"

const REPLACE_IMAGE = replaceImg;

type CommunityPostProps = {
    post: CommunityPostItem;
};

export const CommunityPost = ({post}: CommunityPostProps) => {
    // accessStatus가 GRANTED가 아니면 보호된 미리보기와 썸네일을 렌더링하지 않는다.
    const isLocked = post.accessStatus !== 'GRANTED';
    // 익명 응답(author=null)은 가짜 프로필 대신 익명 텍스트만 표시한다.
    const authorName = post.author?.name ?? '익명';
    const lockedMessage = post.accessStatus === 'LOGIN_REQUIRED'
        ? '로그인 후 열람 가능'
        : post.accessStatus === 'INSUFFICIENT_POINTS'
            ? '포인트가 부족합니다'
            : '구매 후 열람 가능';
    if (post.boardCode === "INFO") {
        return (
            <Link key={post.postId} to={`/community/post/${post.postId}`} className='block'>
                <article
                className='flex flex-col px-[25px] pt-[15px]'
                style={{
                    gap: '10px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid var(--ColorGray2,rgb(239, 239, 239))',
                }}
                >
                    <div className='flex flex-wrap items-center' style={{ gap: '5px' }}>
                        {post.tags.map((category) => (
                        <Category key={category} label={category} className='h-[20px] px-[6px]' />
                        ))}
                    </div>

                    <div className='flex flex-col' style={{ gap: '7px' }}>
                        <div className='flex' style={{ gap: '12px' }}>
                            <div className='flex flex-1 flex-col' style={{ gap: '5px' }}>
                                <div className='flex items-center gap-[6px]'>
                                    <span className='text-sb-14 text-gray-900'>{authorName}</span>
                                    {post.author ? (
                                        <span className='text-r-12 text-gray-750'>
                                        · {post.author.majorName}
                                        {post.author.studentNo
                                            ? ` ${post.author.studentNo.slice(2, 4)}학번`
                                            : ''}
                                        </span>
                                    ) : null}
                                </div>

                                <div className='text-sb-16-hn leading-[150%] text-gray-900'>{post.title}</div>

                                {isLocked ? (
                                    <div className='text-r-12 text-[var(--ColorMain,#00C56C)]'>
                                        {lockedMessage}
                                    </div>
                                ) : (
                                    <div className='line-clamp-2 whitespace-pre-wrap text-r-16 text-gray-750'>
                                        {post.preview}
                                    </div>
                                )}
                            </div>

                            {!isLocked && post.thumbnailUrl && (
                                <div className='h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[8px] bg-[var(--ColorGray1,#D5D5D5)]'>
                                <img
                                    src={post.thumbnailUrl}
                                    alt=''
                                    className='h-full w-full object-cover'
                                    onError={(e) => {
                                        e.currentTarget.onerror = null; //이미지 깨짐 방지
                                        e.currentTarget.src = REPLACE_IMAGE;
                                    }}
                                />
                                </div>
                            )}
                        </div>

                        <div className='flex items-center gap-[10px] text-r-12 text-gray-650'>
                            <span className='flex items-center gap-[4px]'>
                                <Icon name='thumbs_up_stroke' className='h-[12px] w-[12px]' />
                                {post.likeCount}
                            </span>
                            <span className='flex items-center gap-[4px]'>
                                <Icon name='comment' className='h-[12px] w-[12px]' />
                                {post.commentCount}
                            </span>
                            <span className='flex items-center gap-[4px]'>
                                <Icon name='bookmark_stroke' className='h-[12px] w-[12px]' />
                                {post.bookmarkCount}
                            </span>
                            <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                    </div>
                </article>
            </Link>
        )
    }
    return (
        <Link key={post.postId} to={`/community/post/${post.postId}`} className='block'>
            <article
            className='flex flex-col px-[25px] pt-[15px]'
            style={{
                gap: '10px',
                paddingBottom: '15px',
                borderBottom: '1px solid var(--ColorGray2,rgb(239, 239, 239))',
            }}
            >
                <div className='flex flex-wrap items-center gap-[5px]'>
                    <span
                    className={`inline-flex h-[22px] items-center justify-center rounded-[5px] border px-[10px] text-r-12 ${
                        post.acceptedBadge
                        ? 'border-[var(--ColorGray2,#A1A1A1)] text-[var(--ColorGray2,#A1A1A1)]'
                        : 'border-[var(--ColorMain,#00C56C)] text-[var(--ColorMain,#00C56C)]'
                    }`}
                    >
                    {post.acceptedBadge ? '채택 완료' : '채택 전'}
                    </span>
                    {post.tags.map((category) => (
                    <Category key={category} label={category} className='h-[20px] px-[6px]' />
                    ))}
                </div>

                <div className='flex flex-col' style={{ gap: '7px' }}>
                    <div className='flex' style={{ gap: '12px' }}>
                        <div className='flex flex-1 flex-col' style={{ gap: '7px' }}>
                            <div className='flex items-center gap-[6px]'>
                                <span className='text-sb-14 text-gray-900'>{authorName}</span>
                                {post.author ? (
                                    <span className='text-r-12 text-gray-750'>
                                        · {post.author.majorName}
                                        {post.author.studentNo
                                        ? ` ${post.author.studentNo.slice(2, 4)}학번`
                                        : ''}
                                    </span>
                                ) : null}
                            </div>

                            <div className='text-sb-16-hn leading-[150%] text-gray-900'>{post.title}</div>

                            {isLocked ? (
                            <div className='text-r-12 text-[var(--ColorMain,#00C56C)]'>
                                {lockedMessage}
                            </div>
                            ) : (
                            <div className='line-clamp-2 whitespace-pre-wrap text-r-16 text-gray-750'>
                                {post.preview}
                            </div>
                            )}
                        </div>
                    </div>

                    <div className='flex items-center gap-[10px] text-r-12 text-gray-650'>
                        <span>답변 {post.answerCount}</span>
                        <span className='h-[14px] w-0 border-l border-[var(--ColorGray2,#A1A1A1)]' aria-hidden />
                        <span>북마크 {post.bookmarkCount}</span>
                        <span className='h-[14px] w-0 border-l border-[var(--ColorGray2,#A1A1A1)]' aria-hidden />
                        <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                </div>
            </article>
        </Link>
    );
};

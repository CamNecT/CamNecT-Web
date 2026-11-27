import Icon from '../../../components/Icon';
import { formatPostDisplayDate } from '../utils/post';

type PostMetadataProps = {
  likes: number;
  comments?: number;
  bookmarks: number;
  createdAt: string;
};

export const PostMetadata = ({ likes, comments, bookmarks, createdAt }: PostMetadataProps) => (
  <div className='flex flex-wrap items-center gap-[10px] text-r-12 text-gray-750'>
    <div className='flex items-center gap-[5px]'>
      <span className='flex items-center gap-[3px]'>
        <Icon name='thumbs_up_stroke' size={14} color='currentColor' />
        <span className='sr-only'>좋아요 </span>
        {likes}
      </span>
      <span className='flex items-center gap-[3px]'>
        <Icon name='comment' size={14} color='currentColor' />
        <span className='sr-only'>댓글 </span>
        {comments}
      </span>
      <span className='flex items-center gap-[3px]'>
        <Icon name='bookmark_stroke' size={14} color='currentColor' />
        <span className='sr-only'>북마크 </span>
        {bookmarks}
      </span>
    </div>
    <time className='text-[var(--ColorGray2,#A1A1A1)]'>
      {formatPostDisplayDate(createdAt)}
    </time>
  </div>
);

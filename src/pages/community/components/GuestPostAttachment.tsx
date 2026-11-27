import { useQuery } from '@tanstack/react-query';
import { getCommunityAttachmentDownload } from '../../../api/community';

type Props = {
  postId: string;
  attachmentId: number;
  fileKey: string;
  onOpenImage: (url: string) => void;
  onError: (error: unknown) => void;
};

export const GuestPostAttachment = ({ postId, attachmentId, fileKey, onOpenImage, onError }: Props) => {
  const isPdf = fileKey.toLowerCase().endsWith('.pdf');
  const download = useQuery({
    queryKey: ['communityAttachment', 'guest', postId, attachmentId],
    queryFn: ({ signal }) => getCommunityAttachmentDownload(postId, attachmentId, signal),
    enabled: !isPdf,
    retry: false,
    staleTime: (query) => {
      const expiresAt = Date.parse(query.state.data?.expiresAt ?? '');
      return Math.max(0, expiresAt - query.state.dataUpdatedAt) || 0;
    },
  });

  const open = async () => {
    let ticket = download.data;
    // 만료된 주소를 열면 저장소에서 거절하므로 클릭 시 만료 여부를 다시 확인한다.
    if (!ticket || !(Date.parse(ticket.expiresAt) > Date.now())) {
      const { data, error } = await download.refetch({ cancelRefetch: false });
      if (error || !data) {
        onError(error);
        return;
      }
      ticket = data;
    }

    if (isPdf) window.location.assign(ticket.downloadUrl);
    else onOpenImage(ticket.downloadUrl);
  };

  return (
    <button
      type='button'
      disabled={download.isFetching}
      onClick={() => void open()}
      aria-label={isPdf ? 'PDF 첨부 열기' : '첨부 이미지 열기'}
      className='flex size-[150px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[5px] border border-[#ECECEC] bg-white p-[10px] text-center'
    >
      {!isPdf && download.data ? (
        <img src={download.data.downloadUrl} alt='' className='size-full object-cover' />
      ) : (
        <>
          <span className='text-b-14-hn text-gray-900'>{isPdf ? 'PDF' : '이미지'}</span>

        </>
      )}
    </button>
  );
};

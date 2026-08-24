import Icon from './Icon';

type ImagePopUpProps = {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

const ImagePopUp = ({ isOpen, imageUrl, onClose }: ImagePopUpProps) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
      role='dialog'
      aria-modal='true'
    >
      <div className='flex h-full w-full items-center justify-center px-[25px] py-[max(25px,env(safe-area-inset-top))]'>
        <div className='flex w-full max-h-[calc(100dvh-50px)] flex-col pb-[25px] rounded-[20px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.16)]'>
          <div className='flex h-[44px] items-center justify-end px-[25px] py-[10px]'>
            <button type='button' aria-label='닫기' onClick={onClose}>
              <Icon name='x' className='h-[24px] w-[24px]' />
            </button>
          </div>
          <div className='flex items-center'>
            <img
              src={imageUrl}
              alt='첨부 이미지'
              className='w-full object-contain'
              style={{ maxHeight: 'calc(100dvh - 50px - 44px)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePopUp;

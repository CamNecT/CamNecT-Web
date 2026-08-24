import Icon from '../../components/Icon';

interface LoginHeaderProps {
  onBack: () => void;
}

export const LoginHeader = ({ onBack }: LoginHeaderProps) => {
  return (
    <header
      className='relative sticky left-0 right-0 top-0 z-50 inline-flex w-full items-center bg-white px-[25px] py-0 [container-type:inline-size]'
      style={{
        height: 'calc(50px + env(safe-area-inset-top, 0px))',
        minHeight: 'calc(50px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      role='banner'
    >
      <div className='z-10 flex w-[28px] items-center justify-start'>
        <button
          type='button'
          className='flex items-center justify-center'
          onClick={onBack}
          aria-label='뒤로 가기'
        >
          <Icon name='arrow_left' style={{ width: 'clamp(24px, 7.467cqw, 28px)', height: 'clamp(24px, 7.467cqw, 28px)' }} />
        </button>
      </div>
    </header>
  );
};

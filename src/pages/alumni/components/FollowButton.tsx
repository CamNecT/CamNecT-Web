import PressableMotion from '../../../components/PressableMotion';

type FollowButtonProps = {
  isFollowing: boolean;
  isPending?: boolean;
  onClick: () => void;
};

const FollowButton = ({ isFollowing, isPending = false, onClick }: FollowButtonProps) => {
  return (
    <PressableMotion
      as='button'
      intensity='soft'
      type='button'
      onClick={onClick}
      disabled={isPending}
      // 요청 중에는 중복 클릭을 막기 위해 비활성화합니다.
      className={`flex items-center justify-center border border-[var(--ColorMain,#00C56C)] [width:clamp(54px,18cqw,62px)] [height:clamp(22px,7cqw,25px)] [padding:clamp(2px,1cqw,3px)_clamp(5px,2cqw,7px)] [gap:clamp(3px,1.5cqw,5px)] rounded-[clamp(4px,1.6cqw,6px)] ${isFollowing ? 'bg-[var(--ColorMain,#00C56C)]' : 'bg-transparent'
        } ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {isFollowing ? (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='9'
          height='9'
          viewBox='0 0 17 15'
          fill='none'
          aria-hidden
        >
          <path
            d='M0.75 7.97222L6.75 13.75L15.75 0.75'
            stroke='#FFFFFF'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ) : (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='10'
          height='10'
          viewBox='0 0 10 10'
          fill='none'
          aria-hidden
        >
          <path
            d='M8 2.75V4.25M8 4.25V5.74999M8 4.25H9.5M8 4.25H6.5M5.375 2.1875C5.375 2.63505 5.19721 3.06427 4.88074 3.38074C4.56427 3.69721 4.13505 3.875 3.6875 3.875C3.23995 3.875 2.81072 3.69721 2.49426 3.38074C2.17779 3.06427 2 2.63505 2 2.1875C2 1.73995 2.17779 1.31072 2.49426 0.994257C2.81072 0.67779 3.23995 0.5 3.6875 0.5C4.13505 0.5 4.56427 0.67779 4.88074 0.994257C5.19721 1.31072 5.375 1.73995 5.375 2.1875ZM0.5 8.61749V8.56249C0.5 7.71712 0.835825 6.90636 1.4336 6.30859C2.03137 5.71082 2.84212 5.375 3.6875 5.375C4.53288 5.375 5.34363 5.71082 5.9414 6.30859C6.53918 6.90636 6.875 7.71712 6.875 8.56249V8.61699C5.91274 9.19654 4.81031 9.50189 3.687 9.49999C2.5215 9.49999 1.431 9.17749 0.5 8.61699V8.61749Z'
            stroke='#00C56C'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      )}
      <span
        className={`font-normal leading-normal [font-size:clamp(9px,2.8cqw,10px)] ${isFollowing ? 'text-[color:var(--ColorWhite,#FFF)]' : 'text-[color:var(--ColorMain,#00C56C)]'
          }`}
      >
        {isFollowing ? '팔로잉' : '팔로우'}
      </span>
    </PressableMotion>
  );
};

export default FollowButton;

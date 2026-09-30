import defaultImg from '../../../assets/image/defaultProfileImg.png';
import Button from '../../../components/Button';
import Category from '../../../components/Category';
import type { AlumniProfile } from '../../../types/alumni/alumniTypes';
import FollowButton from './FollowButton';

type ProfileOverviewSectionProps = {
  profile: AlumniProfile;
  isFollowing: boolean;
  followerCount: number;
  isFollowPending: boolean;
  canRequestCoffeeChat: boolean;
  onFollowToggle: () => void;
  onCoffeeChatClick: () => void;
};

const ProfileOverviewSection = ({
  profile,
  isFollowing,
  followerCount,
  isFollowPending,
  canRequestCoffeeChat,
  onFollowToggle,
  onCoffeeChatClick,
}: ProfileOverviewSectionProps) => (
  <>
    <section className='flex flex-col [padding:clamp(32px,10cqw,40px)_clamp(18px,7cqw,25px)_0] [gap:clamp(18px,6cqw,24px)]'>
      <div className='grid items-start [grid-template-columns:auto_minmax(0,1fr)] [column-gap:clamp(24px,6cqw,32px)] [row-gap:clamp(14px,4.5cqw,20px)]'>
        <img
          src={profile.profileImage ?? defaultImg}
          alt={`${profile.author.name} 프로필`}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = defaultImg;
          }}
          className='h-[clamp(64px,22.4cqw,84px)] w-[clamp(64px,22.4cqw,84px)] shrink-0 rounded-full object-cover'
        />

        <div className='flex min-w-0 flex-1 flex-col [gap:clamp(10px,3.5cqw,14px)]'>
          <div className='flex items-start justify-between [gap:clamp(10px,3.5cqw,14px)]'>
            <div className='flex flex-col'>
              <div className='text-sb-18 tracking-[-0.04em] text-[color:var(--ColorBlack,#202023)]'>
                {profile.author.name}
              </div>
              <div className='text-r-12 text-[color:var(--ColorGray3,#646464)]'>
                {profile.author.major} {profile.author.studentId}학번
              </div>
            </div>

            <FollowButton
              isFollowing={isFollowing}
              isPending={isFollowPending}
              onClick={onFollowToggle}
            />
          </div>

          <div className='flex flex-wrap [gap:clamp(3px,1.5cqw,5px)]'>
            {profile.categories.map((category) => (
              <Category key={category} label={category} />
            ))}
          </div>
        </div>

        {profile.privacy.showFollowStats ? (
          <div className='flex flex-col [gap:clamp(6px,2.2cqw,8px)] [grid-column:1/2] [grid-row:2/3]'>
            <div className='flex flex-col [gap:clamp(2px,2cqw,4px)] [padding:11px_clamp(2px,1cqw,3px)] pl-[3px]'>
              <div className='flex items-center [gap:clamp(2px,1cqw,3px)]'>
                <span className='text-r-14 text-[color:var(--ColorBlack,#202023)]'>팔로잉</span>
                <span className='text-sb-14 text-[color:var(--ColorBlack,#202023)]'>
                  {profile.followingCount}
                </span>
              </div>
              <div className='flex items-center [gap:clamp(2px,1cqw,3px)]'>
                <span className='text-r-14 text-[color:var(--ColorBlack,#202023)]'>팔로워</span>
                <span className='text-sb-14 text-[color:var(--ColorBlack,#202023)]'>
                  {followerCount}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div aria-hidden className='h-full [grid-column:1/2] [grid-row:2/3]' />
        )}

        <p className='line-clamp-3 whitespace-pre-line text-r-14 text-[color:var(--ColorGray2,#A1A1A1)] [padding-top:clamp(8px,3cqw,11px)] [grid-column:2/3] [grid-row:2/3]'>
          {profile.intro}
        </p>
      </div>
    </section>

    {canRequestCoffeeChat && (
      <section className='flex [padding:0_clamp(18px,7cqw,25px)_clamp(24px,8cqw,30px)]'>
        <Button
          label='커피챗 요청하기'
          font='sb-14'
          type='button'
          className='h-auto w-full max-w-none rounded-[clamp(8px,2.8cqw,10px)] bg-[var(--ColorMain,#00C56C)] py-[10px]'
          onClick={onCoffeeChatClick}
        />
      </section>
    )}
  </>
);

export default ProfileOverviewSection;

import { useState } from 'react';
import defaultProfile from '../../../assets/image/defaultProfileImg.png';
import Card from '../../../components/Card';
import Category from '../../../components/Category';
import FilterIcon from '../../../components/FilterIcon';
import GuestContentBlur from '../../../components/guest/GuestContentBlur';
import GuestLoginModal from '../../../components/guest/GuestLoginModal';
import Icon from '../../../components/Icon';
import { FullLayout } from '../../../layouts/FullLayout';
import { MainHeader } from '../../../layouts/headers/MainHeader';

const PreviewCard = () => (
  <Card width='100%' height='223px' className='flex flex-col gap-[20px] rounded-[10px] p-[15px]'>
    <div className='flex items-start gap-[13px]'>
      <img src={defaultProfile} alt='' className='size-[60px] shrink-0 rounded-full bg-gray-100 object-contain' />
      <div className='flex min-w-0 flex-1 flex-col gap-[3px] self-center'>
        <span className='text-sb-16-hn text-gray-900'>우리 학교 동문</span>
        <span className='text-r-14 text-gray-650'>전공이 설정되지 않았어요</span>
      </div>
      <Icon name='arrow_right' size={24} className='mt-[9px] shrink-0 text-gray-650' />
    </div>
    <div className='flex flex-1 flex-col gap-[10px] pl-[7px]'>
      <div className='flex gap-[3px]'>
        {['전공', '관심사'].map((label) => (
          <Category
            key={label}
            label={label}
            className='px-[7px] text-gray-750'
            style={{ borderColor: '#A1A1A1', background: '#ECECEC' }}
          />
        ))}
      </div>
      <span className='h-5' />
    </div>
    <span className='grid h-10 shrink-0 place-items-center rounded-[10px] bg-[#C8C8C8] text-sb-14 text-white'>
      커피챗 요청하기
    </span>
  </Card>
);

export const GuestAlumniSearch = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const openLogin = () => setIsLoginOpen(true);

  return (
    <FullLayout headerSlot={<MainHeader title='동문 탐색' leftIcon='empty' />}>
      <div className='mx-auto w-full max-w-[720px]'>
        <div className='px-[25px] pt-[20px]'>
          <button
            type='button'
            onClick={openLogin}
            className='flex min-h-10 w-full items-center gap-[15px] rounded-[30px] bg-gray-150 px-[19px] text-left text-r-16 text-gray-650'
          >
            <Icon name='search' size={20} className='shrink-0 text-gray-750' />
            동문 이름, 태그로 검색
          </button>
          <div className='mt-[10px] flex items-center justify-between'>
            <FilterIcon onClick={openLogin} largeTouchTarget className='-ml-3' />
            <button type='button' onClick={openLogin} className='flex min-h-11 items-center text-r-14 text-gray-650'>
              추천순
              <Icon name='arrow_down' size={20} />
            </button>
          </div>
        </div>

        <GuestContentBlur
          className='mt-[11px] min-h-[487px] w-full'
          overlayClassName='justify-start pt-[122px]'
          description='로그인 후 우리 학교 동문들을 만나보세요!'
        >
          {/* 샘플 카드는 비회원 API나 실제 동문 프로필에 연결하지 않는다. */}
          <div className='flex flex-col gap-[15px] px-[25px]'>
            <PreviewCard />
            <PreviewCard />
          </div>
        </GuestContentBlur>
      </div>
      <GuestLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </FullLayout>
  );
};

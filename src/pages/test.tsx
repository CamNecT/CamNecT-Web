import { useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ButtonWhite from '../components/ButtonWhite';
import Category from '../components/Category';
import CheckBoxToggle from '../components/Toggle/CheckBoxToggle';
import SaveToggle from '../components/Toggle/SaveToggle';
import OnOffToggle from '../components/Toggle/OnOffToggle';
import Icon from '../components/Icon';
import Input from '../components/Input';
import PaginationDots from '../components/PaginationDots';
import Toggle from '../components/Toggle/Toggle';
import Card from '../components/Card';
import { Tabs } from '../components/Tabs';

// 공통컴포넌트 사용 테스트 페이지
function TestPage() {

  const tabs = [
    { id: 'tab1', label: '공모전' },
    { id: 'tab2', label: '동아리' },
    { id: 'tab3', label: '스터디' },
    { id: 'tab4', label: '탭 4' },
    { id: 'tab5', label: '탭 5' },
    { id: 'tab6', label: '탭 6' },
  ];
  const cards = [
    { title: 'Card 1', desc: '홈 화면 요약' },
    { title: 'Card 2', desc: '일정/알림 피드' },
    { title: 'Card 3', desc: '메시지/채팅 카드' },
    { title: 'Card 4', desc: '설정 및 상태' },
  ];

  const cardsAsItems = cards.map((card, idx) => (
    <Card
      key={card.title}
      width='100%'
      height='100%'
      className='flex flex-col items-center justify-center gap-2 text-gray-800 text-R-16'
    >
      <div className='text-SB-18 text-primary'>{card.title}</div>
      <div className='text-R-14 text-gray-750'>{card.desc}</div>
      <div className='text-R-12 text-gray-650'>카드 {idx + 1} / {cards.length}</div>
    </Card>
  ));

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [onOffValue, setOnOffValue] = useState(false);

  return (
    <main className='relative flex flex-col items-center justify-center w-screen h-screen gap-6'>
      <section>
        <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab}>
          <div className='text-R-14 text-gray-750'>
            {activeTab === 'tab1' && '탭 1 내용입니다.'}
            {activeTab === 'tab2' && '탭 2 내용입니다.'}
            {activeTab === 'tab3' && '탭 3 내용입니다.'}
            {activeTab === 'tab4' && '탭 4 내용입니다.'}
            {activeTab === 'tab5' && '탭 5 내용입니다.'}
            {activeTab === 'tab6' && '탭 6 내용입니다.'}
          </div>
        </Tabs>
      </section>

      <div className='flex items-center gap-4'>
        <div className='relative inline-block'>
          <Icon name='bell_notification' />
          <Badge />
        </div>
        <Icon name='search' />
        <Icon name='Navigation_coffee_chat_stroke' />
        <Icon name='back' />
        <Icon name='arrow_right' />
        <Icon name='bookmark_stroke' />
        <Icon name='settings' />
        <Icon name='more_menu' />
        <Icon name='send' />
        <Icon name='writing' />
        <Icon name='cancel' />
      </div>

      <div className='flex items-center gap-3'>
        <Toggle aria-label='토글 예시' />
        <CheckBoxToggle aria-label='체크박스 예시' />
        <SaveToggle aria-label='저장 토글 예시' />
        <div className='flex items-center gap-2'>
          <OnOffToggle
            aria-label='On Off 토글 예시'
            toggled={onOffValue}
            onToggle={setOnOffValue}
          />
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <section className='flex flex-col items-center gap-3'>
          <PaginationDots
            items={cardsAsItems}
            trackWidth={325}
            trackHeight={206}
            count={cardsAsItems.length}
            activeColor='var(--color-primary)'
            inactiveColor='var(--color-gray-150)'
          />
        </section>

        <section className='flex flex-col items-center gap-3 w-[325px]'>
          <Input label='기본 입력' placeholder='내용을 입력하세요' />
          <Input
            label='짧은 입력'
            width={325}
            height={181}
            placeholder='짧게 입력'
            className='text-R-14'
          />
        </section>
      </div>

      <section className='flex flex-wrap items-center justify-center gap-2'>
        <Category label='디자인컨버전스학부' />
        <Category label='컴퓨터공학부' />
        <Category label='공과대학' />
      </section>

      <div className='flex flex-col items-center gap-2'>
        <Button label='예시 버튼' />
        <ButtonWhite label='회원가입' />
      </div>
    </main>
  );
}

export default TestPage;

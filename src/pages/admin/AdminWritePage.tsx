import { MainHeader } from '../../layouts/headers/MainHeader';
import { useState } from 'react';
import Icon from '../../components/Icon';
import { Tabs, type TabItem } from '../../components/Tabs';
import ExternalTab from '../activity/tabs/ExternalTab';
import JobTab from '../activity/tabs/JobTab';
import type { ActivityPostTab } from '../../types/activityPage/activityPageTypes';
import { AdminFullLayout } from '../../layouts/AdminFullLayout';
import ClubTab from '../activity/tabs/ClubTab';
import StudyTab from '../activity/tabs/StudyTab';

const tabItems: TabItem[] = [
  { id: 'club', label: '동아리' },
  { id: 'study', label: '스터디' },
  { id: 'external', label: '대외활동' },
  { id: 'job', label: '취업정보' },
];

export const AdminWritePage = () => {
  const [activeTab, setActiveTab] = useState<ActivityPostTab>('club')
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const renderTab = () => {
    if (activeTab === 'club') return <ClubTab searchQuery={searchQuery} />;
    if (activeTab === 'study') return <StudyTab searchQuery={searchQuery} />;
    if (activeTab === 'external') return <ExternalTab searchQuery={searchQuery} isAdmin={true}/>;
    return <JobTab searchQuery={searchQuery} isAdmin={true}/>;
  };

  return (
    <AdminFullLayout
      headerSlot={
        <div className='sticky top-0 z-50 bg-white'>
          {isSearchOpen ? (
            <div className='px-[25px]'>
              <div className='mx-auto flex w-full min-w-0 max-w-[720px] items-center gap-[15px] py-[10px]'>
                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  aria-label='검색 닫기'
                  className='flex h-[28px] w-[28px] shrink-0 items-center justify-center'
                >
                  <Icon name='search' className='h-[24px] w-[24px]' style={{ color: 'var(--ColorBlack,#202023)' }} />
                </button>
                <input
                  type='text'
                  enterKeyHint='search'
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='제목, 내용, 태그, 검색'
                  className='w-0 min-w-0 flex-1 bg-transparent text-r-16 text-[var(--ColorBlack,#202023)] placeholder:text-[var(--ColorGray2,#A1A1A1)] focus:outline-none'
                />
                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  aria-label='검색 닫기'
                  className='flex h-[24px] w-[24px] shrink-0 items-center justify-center'
                >
                  <Icon
                    name='x'
                    className='h-[24px] w-[24px]'
                    style={{ color: 'var(--ColorGray4,#A1A1A1)' }}
                  />
                </button>
              </div>
            </div>
          ) : (
            <MainHeader
              title='대외활동 등록'
              leftIcon='empty'
              rightActions={[
                {
                  icon: 'search',
                  onClick: () => setIsSearchOpen(true),
                  ariaLabel: '검색 열기',
                },
              ]}
            />
          )}
          <Tabs tabs={tabItems} activeId={activeTab} onChange={(id) => setActiveTab(id as ActivityPostTab)} />
        </div>
      }
    >
      <div>{renderTab()}</div>
    </AdminFullLayout>
  );
};

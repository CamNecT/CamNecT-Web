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
        isSearchOpen ? (
          <div className='bg-white top-0 z-50 sticky'>
            <div className='px-[25px]'>
              <div className='mx-auto flex w-full max-w-[720px] items-center gap-[15px] py-[10px]'>
                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  aria-label='검색 닫기'
                >
                  <Icon name='search' className='h-[28px] w-[28px]' />
                </button>
                <input
                  type='text'
                  enterKeyHint='search'
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='제목, 내용, 태그, 검색'
                  className='flex-1 bg-transparent text-r-16 text-[var(--ColorBlack,#202023)] placeholder:text-[var(--ColorGray2,#A1A1A1)] focus:outline-none'
                />
              </div>
            </div>
          </div>
        ) : (
          <MainHeader
            title='대외활동 등록'
            rightActions={[
              {
                icon: 'search',
                onClick: () => setIsSearchOpen(true),
                ariaLabel: '검색 열기',
              },
            ]}
          />
        )
      }
    >
      <div className='bg-white'>
        <Tabs tabs={tabItems} activeId={activeTab} onChange={(id) => setActiveTab(id as ActivityPostTab)} />
      </div>
      <div>{renderTab()}</div>
    </AdminFullLayout>
  );
};

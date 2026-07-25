import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Tabs, type TabItem } from '../../components/Tabs';
import { FullLayout } from '../../layouts/FullLayout';
import { MainHeader } from '../../layouts/headers/MainHeader';
import ClubTab from './tabs/ClubTab';
import ExternalTab from './tabs/ExternalTab';
import JobTab from './tabs/JobTab';
import StudyTab from './tabs/StudyTab';
import type { ActivityPostTab } from '../../types/activityPage/activityPageTypes';

const tabItems: TabItem[] = [
  { id: 'club', label: '동아리' },
  { id: 'study', label: '스터디' },
  { id: 'external', label: '대외활동' },
  { id: 'job', label: '취업정보' },
];

const isActivityPostTab = (tab: string | null): tab is ActivityPostTab =>
  tabItems.some((item) => item.id === tab);

export const ActivityPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ActivityPostTab>(
    isActivityPostTab(initialTab) ? initialTab : 'club',
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isActivityPostTab(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab, searchParams]);

  const handleTabChange = (id: string) => {
    if (!isActivityPostTab(id)) return;
    setActiveTab(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    });
  };

  const renderTab = () => {
    if (activeTab === 'club')
      return <ClubTab searchQuery={searchQuery} />;
    if (activeTab === 'study')
      return <StudyTab searchQuery={searchQuery} />;
    if (activeTab === 'external')
      return <ExternalTab searchQuery={searchQuery} />;
    return <JobTab searchQuery={searchQuery} />;
  };

  return (
    <FullLayout
      headerSlot={
        <div className='sticky top-0 z-50 bg-white'>
          {isSearchOpen ? (
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='제목 검색'
                  className='flex-1 bg-transparent text-r-16 text-[var(--ColorBlack,#202023)] placeholder:text-[var(--ColorGray2,#A1A1A1)] focus:outline-none'
                />
              </div>
            </div>
          ) : (
            <MainHeader
              title='대외활동'
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
          <Tabs tabs={tabItems} activeId={activeTab} onChange={handleTabChange} />
        </div>
      }
    >
      <div>{renderTab()}</div>
    </FullLayout>
  );
};

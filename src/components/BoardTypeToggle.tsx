import PressableMotion from './PressableMotion';

type BoardTypeToggleProps = {
  selected: boolean;
  onClick: () => void;
  label: string;
};

// 정렬/선택 상태를 보여주는 라디오형 토글
const BoardTypeToggle = ({ selected, onClick, label }: BoardTypeToggleProps) => {
  return (
    <PressableMotion
      as='button'
      intensity='soft'
      type='button'
      aria-pressed={selected}
      aria-label={`${label} 선택`}
      onClick={onClick}
      className='flex items-center justify-center'
    >
      {selected ? (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>
          <circle cx='12' cy='12' r='9.5' stroke='#00C56C' strokeWidth='5' />
        </svg>
      ) : (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>
          <circle cx='12' cy='12' r='11.5' stroke='#A1A1A1' />
        </svg>
      )}
    </PressableMotion>
  );
};

export default BoardTypeToggle;

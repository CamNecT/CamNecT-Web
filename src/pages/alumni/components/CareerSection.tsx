import type { AlumniProfile } from '../../../types/alumni/alumniTypes';

type CareerSectionProps = {
  items: AlumniProfile['careerItems'];
};

const CareerSection = ({ items }: CareerSectionProps) => (
  <div className='flex flex-col gap-[10px]'>
    <div className='text-SB-18 text-gray-900'>경력</div>
    <div className='h-0 border border-gray-150' />
    <div className='text-R-14 flex flex-col gap-[15px]'>
      {items.map((item) => (
        <div key={item.id} className='flex items-start gap-[10px]'>
          <div className='w-[98px] shrink-0 text-r-12-hn text-gray-650'>
            {item.period}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='break-words text-r-16-hn text-gray-900'>{item.company}</div>
            {item.tasks.length > 0 ? (
              <div className='mt-[6px] flex flex-col gap-[3px]'>
              {item.tasks.map((task, index) => (
                <div key={`${item.id}-${index}`} className='break-words text-r-14-hn text-gray-750'>
                  - {task}
                </div>
              ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CareerSection;

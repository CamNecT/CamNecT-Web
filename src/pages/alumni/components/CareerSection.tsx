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
        <div key={item.id} className='flex flex-col gap-[3px]'>
          <div className='text-r-12-hn text-gray-650'>{item.period}</div>
          <div className='flex gap-[5px]'>
            <div className='w-[120px] text-r-16-hn text-gray-900'>{item.company}</div>
            <div className='flex flex-col gap-[3px]'>
              {item.tasks.map((task, index) => (
                <div key={`${item.id}-${index}`} className='text-r-14-hn text-gray-750'>
                  - {task}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CareerSection;

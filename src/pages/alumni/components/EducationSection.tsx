import type { AlumniProfile } from '../../../types/alumni/alumniTypes';

type EducationSectionProps = {
  items: AlumniProfile['educationItems'];
};

const EducationSection = ({ items }: EducationSectionProps) => (
  <div className='flex flex-col gap-[10px]'>
    <div className='text-SB-18 text-gray-900'>학력</div>
    <div className='h-0 border border-gray-150' />
    <div className='text-R-14 flex flex-col gap-[15px]'>
      {items.map((item) => (
        <div key={item.id} className='flex flex-col gap-[3px]'>
          <div className='text-r-12-hn text-gray-650'>{item.period}</div>
          <div className='flex items-center gap-[5px]'>
            <span className='text-r-16-hn text-gray-900'>{item.school}</span>
            <span className='text-r-14-hn text-gray-750'>{item.status}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default EducationSection;

import type { AlumniProfile } from '../../../types/alumni/alumniTypes';

type CertificateSectionProps = {
  items: AlumniProfile['certificateItems'];
};

const CertificateSection = ({ items }: CertificateSectionProps) => (
  <div className='flex flex-col gap-[10px]'>
    <div className='text-SB-18 text-gray-900'>자격증</div>
    <div className='h-0 border border-gray-150' />
    <div className='text-R-14 flex flex-col gap-[15px]'>
      {items.map((item) => (
        <div key={item.id} className='flex flex-col gap-[3px]'>
          <div className='text-r-12-hn text-gray-650'>{item.date}</div>
          <div className='text-r-16-hn text-gray-900'>{item.name}</div>
        </div>
      ))}
    </div>
  </div>
);

export default CertificateSection;

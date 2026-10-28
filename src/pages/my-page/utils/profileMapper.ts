import type { MyProfileData } from "../../../api-types/profileApiTypes";
import type { EducationItem, CareerItem, CertificateItem } from "..//../../types/mypage/mypageTypes";
import type { Portfolio } from "..//../../types/portfolio/portfolioTypes";
import { findCampusMappingById, findInstitutionMappingsByName } from "../../../constants/institutionCampusMapping";

export const mapToPortfolios = (data: MyProfileData): Portfolio[] => {
  return data.portfolioProjectList.map(p => ({
    uid: data.userId.toString(),
    portfolioId: p.portfolioId.toString(),
    title: p.title,
    portfolioThumbnail: p.thumbnailUrl,
    updatedAt: new Date().toISOString(), // API 응답에 없으므로 현재 시간 사용
    portfolioVisibility: p.isPublic,
    isImportant: p.isFavorite,
  }));
};

// API 응답을 기존 EducationItem 타입으로 변환
export const mapToEducations = (data: MyProfileData): EducationItem[] => {
  return data.educations.map(e => {
    const startYear = parseInt(e.startDate.split('-')[0]);
    const endYear = e.endDate ? parseInt(e.endDate.split('-')[0]) : undefined;
    const campusMapping = e.campusId ? findCampusMappingById(e.campusId) : undefined;
    const institutionMapping = campusMapping ?? findInstitutionMappingsByName(e.schoolName)[0];
    
    return {
      id: e.educationId.toString(),
      school: e.schoolName,
      institutionId: institutionMapping?.institutionId,
      campusId: e.campusId,
      campusName: e.campusName,
      startYear,
      endYear,
      status: e.status,
    };
  });
};

// API 응답을 기존 CareerItem 타입으로 변환
export const mapToCareers = (data: MyProfileData): CareerItem[] => {
  return data.experience.map(exp => {
    const [startYear, startMonth] = exp.startDate.split('-').map(Number);
    const endYear = exp.endDate ? parseInt(exp.endDate.split('-')[0]) : undefined;
    const endMonth = exp.endDate ? parseInt(exp.endDate.split('-')[1]) : undefined;
    
    return {
      id: exp.experienceId.toString(),
      organization: exp.companyName,
      startYear,
      startMonth,
      endYear,
      endMonth,
      positions: exp.responsibilities,
    };
  });
};

// API 응답을 기존 CertificateItem 타입으로 변환
export const mapToCertificates = (data: MyProfileData): CertificateItem[] => {
  return data.certificate.map(cert => {
    const [year, month] = cert.acquiredDate.split('-').map(Number);
    
    return {
      id: cert.certificateId.toString(),
      name: cert.certificateName,
      acquiredYear: year,
      acquiredMonth: month,
    };
  });
};

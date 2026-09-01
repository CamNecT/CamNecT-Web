import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import Icon from "../../../components/Icon";
import { EDUCATION_STATUS_KR, type EducationStatus, type EducationItem } from "../../../types/mypage/mypageTypes";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { EditHeader } from "../../../layouts/headers/EditHeader";
import { useModalHistory } from "../../../hooks/useModalHistory";
import PopUp from "../../../components/Pop-up";
import { generateId } from "../../../utils/uuid";
import { getInstitution } from "../../../api/institutionApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addEducation, updateEducation, deleteEducation } from "../../../api/userInfoApi";
import { updateProfilePrivacy } from "../../../api/profileApi";
import { convertEducationToRequest } from "../utils/dataConverter";
import type { 
    EducationAddResponse, 
    EducationUpdateResponse, 
    EducationDeleteResponse 
} from "../../../api-types/userInfoApiTypes";
import type { ProfilePrivacyUpdateResponse } from "../../../api-types/profileApiTypes";
import {
    findInstitutionCampusMappingByFullName,
    formatEducationSchoolName,
    searchInstitutionCampusMappings,
} from "../../../constants/institutionCampusMapping";

interface EducationModalProps {
    userId: number;
    educations: EducationItem[];
    visibility: {  // ← 추가
        isFollowerVisible: boolean;
        educationVisibility: boolean;
        careerVisibility: boolean;
        certificateVisibility: boolean;
    };
    onClose: () => void;
}

type View = 'list' | 'add' | 'edit';

const STATUS_OPTIONS = Object.entries(EDUCATION_STATUS_KR).map(([value, label]) => ({
    value: value as EducationStatus,
    label
}));

function EducationSchoolWithStatus({
    schoolName,
    status,
}: {
    schoolName: string;
    status: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const schoolRef = useRef<HTMLSpanElement>(null);
    const statusRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const school = schoolRef.current;
        const statusElement = statusRef.current;
        if (!container || !school || !statusElement) return;

        const measureSchoolWidth = () => {
            const gap = 10;
            const availableWidth = Math.max(
                0,
                container.clientWidth - statusElement.getBoundingClientRect().width - gap
            );

            // 먼저 사용 가능한 전체 너비로 자연스럽게 줄바꿈한 뒤, 실제 각 줄 중 가장 긴 줄만큼만 학교명 영역을 줄인다
            school.style.width = `${availableWidth}px`;
            school.style.flexBasis = `${availableWidth}px`;

            const range = document.createRange();
            range.selectNodeContents(school);
            const renderedLineWidths = Array.from(range.getClientRects()).map((rect) => rect.width);
            range.detach();

            const measuredWidth = Math.min(
                availableWidth,
                Math.ceil(Math.max(0, ...renderedLineWidths))
            );
            school.style.width = `${measuredWidth}px`;
            school.style.flexBasis = `${measuredWidth}px`;
        };

        measureSchoolWidth();
        const resizeObserver = new ResizeObserver(measureSchoolWidth);
        resizeObserver.observe(container);
        document.fonts?.ready.then(measureSchoolWidth);

        return () => resizeObserver.disconnect();
    }, [schoolName, status]);

    return (
        <div ref={containerRef} className="flex w-full min-w-0 items-center gap-[10px]">
            <span ref={schoolRef} className="min-w-0 break-keep text-m-16 text-gray-900">
                {schoolName}
            </span>
            <span ref={statusRef} className="shrink-0 whitespace-nowrap text-r-14 text-gray-750">
                {status}
            </span>
        </div>
    );
}

export default function EducationModal({ userId, educations, visibility, onClose }: EducationModalProps) {
    const queryClient = useQueryClient();
    const isServerId = (id: string) => /^\d+$/.test(id);
    const initialShowPublic = visibility.educationVisibility

    const [currentView, setCurrentView] = useState<View>('list');
    const [listEducations, setListEducations] = useState<EducationItem[]>(educations);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPublic, setShowPublic] = useState(initialShowPublic);
    const [showWarning, setShowWarning] = useState(false);
    const [showSchoolInvalid, setShowSchoolInvalid] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState('');

    const [formData, setFormData] = useState<Partial<EducationItem>>({
        school: '',
        status: 'ATTENDING',
        startYear: new Date().getFullYear(),
        endYear: undefined,
    });

    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showStartYearDropdown, setShowStartYearDropdown] = useState(false);
    const [showEndYearDropdown, setShowEndYearDropdown] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

    const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
    const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

    const filteredSchools = useMemo(() => {
        return searchInstitutionCampusMappings(schoolSearchQuery);
    }, [schoolSearchQuery]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    //변경사항 추적 (리스트 전체 추적)
    const hasListChanges: boolean = useMemo(() => {
        const educationsChanged = JSON.stringify(listEducations) !== JSON.stringify(educations);
        const showPublicChanged = showPublic !== initialShowPublic;
        return educationsChanged || showPublicChanged;
    }, [listEducations, educations, showPublic, initialShowPublic]);

    //수정/추가 각각의 변경사항 추적
    const hasFormChanges: boolean = useMemo(() => {
        if (!formData.school || !formData.school.trim()) {
            return false;
        }
        if (currentView === 'add') {
            return !!(formData.school.trim() || formData.status !== 'ATTENDING' || formData.startYear !== currentYear);
        }
        if (currentView === 'edit' && editingId !== null) {
            const original = listEducations.find(e => e.id === editingId);
            if (!original) return false;
            return (
                formData.school !== original.school ||
                formData.institutionId !== original.institutionId ||
                formData.campusId !== original.campusId ||
                formData.status !== original.status ||
                formData.startYear !== original.startYear ||
                formData.endYear !== original.endYear
            );
        }
        return false;
    }, [formData, currentView, editingId, listEducations, currentYear]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const tasks: Promise<
                ProfilePrivacyUpdateResponse
                | EducationDeleteResponse
                | EducationAddResponse
                | EducationUpdateResponse
            >[] = [];
            const institutionRequests = new Map<number, ReturnType<typeof getInstitution>>();

            const verifyEducationSelection = async (education: EducationItem) => {
                if (!education.institutionId || !education.campusId) {
                    throw new Error('학교와 캠퍼스를 다시 선택해 주세요.');
                }

                let request = institutionRequests.get(education.institutionId);
                if (!request) {
                    request = getInstitution({ institutionId: education.institutionId });
                    institutionRequests.set(education.institutionId, request);
                }

                const response = await request;
                const campusExists = response.data.campuses.some(
                    (campus) => campus.campusId === education.campusId
                );

                if (!campusExists) {
                    throw new Error('선택한 학교와 캠퍼스 정보를 확인할 수 없습니다.');
                }
            };

            const addedEducations = listEducations.filter(e => !isServerId(e.id));
            const updatedEducations = listEducations.filter(n => {
                if (!isServerId(n.id)) return false;
                const original = educations.find(o => o.id === n.id);
                return original && JSON.stringify(n) !== JSON.stringify(original);
            });

            //저장 요청을 시작하기 전에 선택값을 먼저 검증
            await Promise.all(
                [...addedEducations, ...updatedEducations].map(verifyEducationSelection)
            );

            // 1. 공개여부 변경
            if (showPublic !== initialShowPublic) {
                tasks.push(updateProfilePrivacy(userId, { 
                    isFollowerVisible: visibility.isFollowerVisible,
                    isEducationVisible: showPublic,
                    isExperienceVisible: visibility.careerVisibility,
                    isCertificateVisible: visibility.certificateVisibility,
                }));
            }

            // 2. 삭제된 항목
            const deletedIds = educations
                .filter(orig => !listEducations.find(n => n.id === orig.id))
                .filter(e => isServerId(e.id))
                .map(e => Number(e.id));

            for (const id of deletedIds) {
                tasks.push(deleteEducation(userId, id));
            }

            // 3. 새로 추가된 항목
            for (const education of addedEducations) {
                const request = convertEducationToRequest(education);
                tasks.push(addEducation(userId, request));
            }

            // 4. 수정된 항목
            for (const education of updatedEducations) {
                const request = convertEducationToRequest(education);
                tasks.push(updateEducation(userId, Number(education.id), request));
            }

            await Promise.all(tasks);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
            onClose();
        },
        onError: (error) => {
            setSaveErrorMessage(
                error instanceof Error ? error.message : '정보 저장에 실패했습니다.'
            );
        },
    });

    const handleComplete = () => {
        if (!hasListChanges) {
            onClose();
            return;
        }
        saveMutation.mutate();
    };

    const handleAddEducation = () => {
        setFormData({
            school: '',
            status: 'ATTENDING',
            startYear: currentYear,
            endYear: undefined,
        });
        setSchoolSearchQuery("");
        setCurrentView('add');
    };

    const handleEditEducation = (id: string) => {
        setEditingId(id);
        const edu = listEducations.find(e => e.id === id);
        if (edu) {
            setFormData(edu);
            setSchoolSearchQuery(
                formatEducationSchoolName(edu.school, edu.campusName, edu.campusId)
            );
            setCurrentView('edit');
        }
    };

    const handleSaveForm = () => {
        const school = (formData.school ?? "").trim();
        if (!school) return;

        let resolvedFormData = formData;
        if (!formData.institutionId || !formData.campusId) {
            const exactMapping = findInstitutionCampusMappingByFullName(schoolSearchQuery);
            if (!exactMapping) {
                setShowSchoolInvalid(true);
                setShowSchoolSuggestions(true);
                return;
            }

            resolvedFormData = {
                ...formData,
                school: exactMapping.institutionName,
                institutionId: exactMapping.institutionId,
                campusId: exactMapping.campusId,
                campusName: exactMapping.campusName,
            };
        }
        
        if (!hasFormChanges) {
            setCurrentView('list');
            return;
        }

        if (currentView === 'add') {
            const newEdu: EducationItem = {
                id: generateId(),
                ...resolvedFormData as Omit<EducationItem, 'id'>
            };
            setListEducations([...listEducations, newEdu]);
        } else if (currentView === 'edit' && editingId !== null) {
            setListEducations(listEducations.map(e => 
                e.id === editingId ? { ...e, ...resolvedFormData } : e
            ));
        }
        setShowSchoolSuggestions(false); 
        setCurrentView('list');
    };

    const handleDeleteEducation = () => {
        if (editingId !== null) {
            setListEducations(listEducations.filter(e => e.id !== editingId));
            setCurrentView('list');
        }
    };

    const getStatusLabel = (status?: EducationStatus) => {
        return status ? EDUCATION_STATUS_KR[status] : "재학";
    };

    const handleModalClose = currentView === 'list' ? onClose : () => setCurrentView('list');
    const currentHasChanges = currentView === 'list' ? hasListChanges : hasFormChanges;

    useModalHistory(
        handleModalClose,
        currentHasChanges,
        () => setShowWarning(true)
    )

    const handleFormClose = () => {
        if (hasFormChanges) {
            setShowWarning(true);
        } else {
            setCurrentView('list');
        }
    };
    
    const handleListClose = () => {
        if (hasListChanges) {
            setShowWarning(true);
        } else {
            onClose();
        }
    };

    //학력 리스트 화면
    if (currentView === 'list') {
        return (
            <div className="flex items-center justify-center fixed inset-0 z-50 bg-white">
                <div className="w-full max-w-[430px] h-full min-h-0 bg-white flex flex-col"> 
                    <HeaderLayout
                        headerSlot = {
                            <EditHeader
                                title="학력"
                                leftAction = {{onClick: handleListClose}}
                                rightElement = {
                                    <button
                                        className={`text-b-16-hn transition-colors ${
                                            hasListChanges && !saveMutation.isPending ? 'text-primary' : 'text-gray-650'
                                        }`}
                                        onClick={handleComplete}
                                        disabled={!hasListChanges || saveMutation.isPending}
                                    >
                                        {saveMutation.isPending ? '저장중..' : '완료'}
                                    </button>
                                }
                            />
                        }
                    >
                        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto border-t border-gray-150">
                            {/* 학력 비공개 토글 */}
                            <div className="flex items-center justify-between px-[25px] py-[15px] border-b border-gray-150">
                                <span className="text-sb-14-hn text-gray-900">학력 비공개</span>
                                <button
                                    onClick={() => setShowPublic(!showPublic)}
                                    className={`relative w-[50px] h-[24px] rounded-full transition-colors ${
                                        showPublic ? 'bg-gray-300' : 'bg-primary'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform ${
                                            showPublic ? 'translate-x-[2px]' : 'translate-x-[28px]'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* 학력 리스트 */}
                            <div className="w-full flex flex-col">
                                {listEducations
                                    .slice()
                                    .sort((a, b) => {
                                        if (b.startYear !== a.startYear) {
                                            return b.startYear - a.startYear;
                                        }
                                        const aEnd = a.endYear || 9999;
                                        const bEnd = b.endYear || 9999;
                                        return bEnd - aEnd;
                                    })
                                    .map((edu, index) => (
                                    <div
                                        key={edu.id}
                                        className="w-full flex justify-between items-center gap-[10px] px-[25px] py-[20px] border-b border-gray-150"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-[20px]">
                                            <span className="text-m-16 text-gray-650 min-w-[24px] shrink-0 text-center">{index + 1}</span>
                                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-[7px]">
                                                <span className="text-r-12-hn text-gray-650">
                                                    {edu.startYear}{edu.endYear ? `~${edu.endYear}` : '~현재'}
                                                </span>
                                                <EducationSchoolWithStatus
                                                    schoolName={formatEducationSchoolName(
                                                        edu.school,
                                                        edu.campusName,
                                                        edu.campusId
                                                    )}
                                                    status={getStatusLabel(edu.status)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <button className="min-w-[25px] shrink-0 text-sb-14-hn text-gray-650"
                                            onClick={() => handleEditEducation(edu.id)}>
                                            수정
                                        </button>
                                    </div>
                                ))}

                                {/* 학력 추가 버튼 */}
                                <button
                                    onClick={handleAddEducation}
                                    className="flex items-center px-[25px] py-[15px] gap-[5px]"
                                >
                                    <svg viewBox="0 0 20 20" fill="none" className="w-[20px] h-[20px] block shrink-0">
                                        <path 
                                            d="M10 3.75V16.25M16.25 10H3.75" 
                                            stroke="#00C56C" 
                                            strokeWidth="1.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"/>
                                    </svg>
                                    <span className="text-m-14 text-primary">학력 추가</span>
                                </button>
                            </div>
                        </div>
                    </HeaderLayout>
                </div>
                <PopUp
                    isOpen={showWarning}
                    type="warning"
                    title="변경사항이 있습니다.\n나가시겠습니까?"
                    content="저장하지 않을 시 변경사항이 삭제됩니다."
                    leftButtonText="나가기"
                    onLeftClick={() => {
                        setShowWarning(false);
                        onClose();
                    }}
                    onRightClick={() => setShowWarning(false)}
                />
            </div>
        );
    }

    // 추가/수정 화면
    return (
        <div className="flex items-center justify-center fixed inset-0 z-50 bg-white">
            <div className="w-full max-w-[430px] h-full bg-white flex flex-col">    
                <HeaderLayout
                    headerSlot = {
                        <EditHeader
                            title= {currentView === 'add' ? '학력 추가' : '학력 수정'}
                            leftAction = {{onClick: handleFormClose}}
                            rightElement = {
                                <button
                                    className={`text-b-16-hn transition-colors ${
                                        hasFormChanges ? 'text-primary' : 'text-gray-650'
                                    }`}
                                    onClick={handleSaveForm}
                                    disabled={!hasFormChanges}
                                >
                                    완료
                                </button>
                            }
                        />
                    }
                >
                    <div className="w-full h-full flex-1 overflow-y-auto px-[25px] py-[20px] border-t border-gray-150">
                        <div className="flex flex-col gap-[15px]">
                            {/* 학교 이름 */}
                            <div className="flex flex-col gap-[10px] relative">
                                <span className="text-sb-16-hn text-gray-900">학교 이름</span>
                                <input
                                    type="text"
                                    value={schoolSearchQuery}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSchoolSearchQuery(value);
                                        setFormData(prev => ({
                                            ...prev,
                                            school: value,
                                            institutionId: undefined,
                                            campusId: undefined,
                                            campusName: undefined,
                                        }));
                                        setShowSchoolSuggestions(value.length > 0);
                                    }}
                                    onFocus={() => setShowSchoolSuggestions(schoolSearchQuery.length > 0)}
                                    placeholder="학교 이름을 입력해 주세요"
                                    className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] text-r-16-hn text-gray-750 placeholder:text-gray-650 focus:outline-none"
                                />

                                {showSchoolSuggestions && filteredSchools.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                        {filteredSchools.map((institution) => (
                                            <button
                                                key={institution.campusId}
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        school: institution.institutionName,
                                                        institutionId: institution.institutionId,
                                                        campusId: institution.campusId,
                                                        campusName: institution.campusName,
                                                    }));
                                                    setSchoolSearchQuery(institution.fullCampusName);
                                                    setShowSchoolSuggestions(false);
                                                }}
                                                className="w-full flex p-[15px] text-r-16-hn text-gray-650 border-b border-gray-150 last:border-b-0 hover:bg-gray-200"
                                            >
                                                {institution.fullCampusName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* education 상태 */}
                            <div className="relative flex flex-col gap-[10px]">
                                <span className="text-sb-16-hn text-gray-900">재학 상태</span>
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="w-full p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                >
                                    <span className="text-r-16-hn text-gray-750">{getStatusLabel(formData.status)}</span>
                                    <Icon name="arrow_down" 
                                            className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}/>
                                </button>

                                {showStatusDropdown && (
                                    <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                        {STATUS_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setFormData({ ...formData, status: option.value });
                                                    setShowStatusDropdown(false);
                                                }}
                                                className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                    formData.status === option.value ? 'text-primary' : 'text-gray-650'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 기간 */}
                            <div className="w-full flex flex-col gap-[10px]">
                                <span className="text-sb-16-hn text-gray-900">재학 기간</span>
                                <div className="flex gap-[7px] justify-center items-center">
                                    {/* 시작 연도 */}
                                    <div className="flex-1 relative min-w-[110px]">
                                        <button
                                            onClick={() => setShowStartYearDropdown(!showStartYearDropdown)}
                                            className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                        >
                                            <span className="text-r-16-hn text-gray-750">{formData.startYear}년</span>
                                            
                                            <Icon name="arrow_down" 
                                            className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showStartYearDropdown ? 'rotate-180' : ''}`}/>
                                        </button>

                                        {showStartYearDropdown && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                {years
                                                    .filter(year => {
                                                        if (formData.endYear) {
                                                            return year <= formData.endYear;
                                                        }
                                                        return true;
                                                    })
                                                    .map((year) => (
                                                    <button
                                                        key={year}
                                                        onClick={() => {
                                                            setFormData({ ...formData, startYear: year });
                                                            setShowStartYearDropdown(false);
                                                        }}
                                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                            formData.startYear === year ? 'text-primary' : 'text-gray-650'
                                                        }`}
                                                    >
                                                        {year}년
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-[15px] h-0 border-[2px] rounded-full border-gray-750"/>

                                    {/* 종료 연도 */}
                                    <div className="flex-1 relative min-w-[110px]">
                                        <button
                                            onClick={() => setShowEndYearDropdown(!showEndYearDropdown)}
                                            className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                        >
                                            <span className="text-r-16-hn text-gray-750">{formData.endYear ? `${formData.endYear}년` : '현재'}</span>
                                            <Icon name="arrow_down" 
                                            className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showEndYearDropdown ? 'rotate-180' : ''}`}/>
                                        </button>

                                        {showEndYearDropdown && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                <button
                                                    onClick={() => {
                                                        setFormData({ ...formData, endYear: undefined });
                                                        setShowEndYearDropdown(false);
                                                    }}
                                                    className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                        !formData.endYear ? 'text-primary' : 'text-gray-650'
                                                    }`}
                                                >
                                                    현재
                                                </button>
                                                {years
                                                    .filter(year => {
                                                        if (formData.startYear !== undefined) {
                                                            return year >= formData.startYear;
                                                        }
                                                        return true;
                                                    })
                                                    .map((year) => (
                                                    <button
                                                        key={year}
                                                        onClick={() => {
                                                            setFormData({ ...formData, endYear: year });
                                                            setShowEndYearDropdown(false);
                                                        }}
                                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                            formData.endYear === year ? 'text-primary' : 'text-gray-650'
                                                        }`}
                                                    >
                                                        {year}년
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 삭제 버튼 (수정 모드일 때만) */}
                            {currentView === 'edit' && (
                                <button
                                    onClick={handleDeleteEducation}
                                    className="flex text-m-14 text-red mt-[20px]"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    </div>
                </HeaderLayout>
            </div>
            <PopUp
                isOpen={showWarning}
                type="warning"
                title="변경사항이 있습니다.\n나가시겠습니까?"
                content="저장하지 않을 시 변경사항이 삭제됩니다."
                leftButtonText="나가기"
                onLeftClick={() => {
                    setShowWarning(false);
                    setCurrentView('list');
                }}
                onRightClick={() => setShowWarning(false)}
            />
            <PopUp
                isOpen={showSchoolInvalid}
                type="error"
                title="해당 학교의 데이터가 없습니다"
                content="원하는 학교의 입력이 불가하다면\n문의사항에 남겨주세요."
                buttonText="확인"
                onClick={() => setShowSchoolInvalid(false)}
            />
            <PopUp
                isOpen={!!saveErrorMessage}
                type="error"
                title="저장 실패"
                content={saveErrorMessage}
                buttonText="확인"
                onClick={() => setSaveErrorMessage('')}
            />
        </div>
    );
}

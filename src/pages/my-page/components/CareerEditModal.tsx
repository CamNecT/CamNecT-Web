import { useState, useEffect, useMemo } from "react";
import Icon from "../../../components/Icon";
import { type CareerItem } from "../../../types/mypage/mypageTypes";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { EditHeader } from "../../../layouts/headers/EditHeader";
import { useModalHistory } from "../../../hooks/useModalHistory";
import PopUp from "../../../components/Pop-up";
import { generateId } from "../../../utils/uuid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExperience, updateExperience, deleteExperience } from "../../../api/userInfoApi";
import { updateProfilePrivacy } from "../../../api/profileApi";
import { convertCareerToRequest } from "../utils/dataConverter";
import type { 
    ExperienceAddResponse, 
    ExperienceUpdateResponse, 
    ExperienceDeleteResponse 
} from "../../../api-types/userInfoApiTypes";
import type { ProfilePrivacyUpdateResponse } from "../../../api-types/profileApiTypes";

interface CareerModalProps {
    userId: number;
    careers: CareerItem[];
    visibility: {
        isFollowerVisible: boolean;
        educationVisibility: boolean;
        careerVisibility: boolean;
        certificateVisibility: boolean;
    };
    onClose: () => void;
}

type View = 'list' | 'add' | 'edit';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CareerModal({ userId, careers, visibility, onClose }: CareerModalProps) {
    const queryClient = useQueryClient();
    const isServerId = (id: string) => /^\d+$/.test(id);
    const initialShowPublic = visibility.careerVisibility;
    
    const [currentView, setCurrentView] = useState<View>('list');
    const [listCareers, setListCareers] = useState<CareerItem[]>(careers);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPublic, setShowPublic] = useState(initialShowPublic);
    const [showWarning, setShowWarning] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState('');
    
    const [formData, setFormData] = useState<Partial<CareerItem>>({
        organization: '',
        positions: [],
        startYear: new Date().getFullYear(),
        startMonth: 1,
        endYear: undefined,
        endMonth: undefined,
    });

    const [showStartYearDropdown, setShowStartYearDropdown] = useState(false);
    const [showStartMonthDropdown, setShowStartMonthDropdown] = useState(false);
    const [showEndYearDropdown, setShowEndYearDropdown] = useState(false);
    const [showEndMonthDropdown, setShowEndMonthDropdown] = useState(false);
    
    const [newPosition, setNewPosition] = useState('');

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 변경사항 추적 (리스트 전체 추적)
    const hasListChanges: boolean = useMemo(() => {
        const careersChanged = JSON.stringify(listCareers) !== JSON.stringify(careers);
        const showPublicChanged = showPublic !== initialShowPublic;
        return careersChanged || showPublicChanged;
    }, [listCareers, careers, showPublic, initialShowPublic]);

    // 수정/추가 각각의 변경사항 추적
    const hasFormChanges: boolean = useMemo(() => {
        if (!formData.organization || !formData.organization.trim()) {
            return false;
        }
        if (currentView === 'add') {
            return !!(formData.organization.trim());
        }
        if (currentView === 'edit' && editingId !== null) {
            const original = listCareers.find(c => c.id === editingId);
            if (!original) return false;
            return JSON.stringify(formData) !== JSON.stringify(original);
        }
        return false;
    }, [formData, currentView, editingId, listCareers]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const tasks: Promise<
                | ProfilePrivacyUpdateResponse
                | ExperienceDeleteResponse
                | ExperienceAddResponse
                | ExperienceUpdateResponse
            >[] = [];

            // 1. 공개여부 변경
            if (showPublic !== initialShowPublic) {
                tasks.push(updateProfilePrivacy(userId, { 
                    isFollowerVisible: visibility.isFollowerVisible,
                    isEducationVisible: visibility.educationVisibility,
                    isExperienceVisible: showPublic,
                    isCertificateVisible: visibility.certificateVisibility,
                }));
            }

            // 2. 삭제된 항목
            const deletedIds = careers
                .filter(orig => !listCareers.find(n => n.id === orig.id))
                .filter(c => isServerId(c.id))
                .map(c => Number(c.id));

            for (const id of deletedIds) {
                tasks.push(deleteExperience(userId, id));
            }

            // 3. 새로 추가된 항목
            const addedCareers = listCareers.filter(c => !isServerId(c.id));

            for (const career of addedCareers) {
                const request = convertCareerToRequest(career);
                tasks.push(addExperience(userId, request));
            }

            // 4. 수정된 항목
            const updatedCareers = listCareers.filter(n => {
                if (!isServerId(n.id)) return false;
                const original = careers.find(o => o.id === n.id);
                return original && JSON.stringify(n) !== JSON.stringify(original);
            });

            for (const career of updatedCareers) {
                const request = convertCareerToRequest(career);
                tasks.push(updateExperience(userId, Number(career.id), request));
            }

            await Promise.all(tasks);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
            onClose();
        },
        onError: () => {
            setSaveErrorMessage('정보 저장에 실패했습니다. 다시 시도해주세요.');
        },
    });

    const handleComplete = () => {
        if (!hasListChanges) {
            onClose();
            return;
        }
        saveMutation.mutate();
    };

    const handleAddCareer = () => {
        setFormData({
            organization: '',
            positions: [],
            startYear: currentYear,
            startMonth: 1,
            endYear: currentYear,
            endMonth: 12,
        });
        setNewPosition('');
        setCurrentView('add');
    };

    const handleEditCareer = (id: string) => {
        setEditingId(id);
        const career = listCareers.find(c => c.id === id);
        if (career) {
            setFormData(career);
            setNewPosition('');
            setCurrentView('edit');
        }
    };

    const handleSaveForm = () => {
        if (!formData.organization || !formData.organization.trim()) {
            return;
        }
        
        if (!hasFormChanges) {
            setCurrentView('list');
            return;
        }

        if (currentView === 'add') {
            const newCareer: CareerItem = {
                id: generateId(),
                ...formData as Omit<CareerItem, 'id'>
            };
            setListCareers([...listCareers, newCareer]);
        } else if (currentView === 'edit' && editingId !== null) {
            setListCareers(listCareers.map(c => 
                c.id === editingId ? { ...c, ...formData } : c
            ));
        }
        setCurrentView('list');
    };

    const handleDeleteCareer = () => {
        if (editingId !== null) {
            setListCareers(listCareers.filter(c => c.id !== editingId));
            setCurrentView('list');
        }
    };

    const handleAddPosition = () => {
        if (newPosition.trim()) {
            setFormData({
                ...formData,
                positions: [...(formData.positions || []), newPosition.trim()]
            });
            setNewPosition('');
        }
    };

    const handleRemovePosition = (index: number) => {
        setFormData({
            ...formData,
            positions: (formData.positions || []).filter((_, i) => i !== index)
        });
    };

    //newPosition이 비워질 때 textarea 높이를 초기화하기 위해
    useEffect(() => {
        if (newPosition === '') {
            const textarea = document.getElementById('positionTextarea');
            if (textarea) {
                textarea.style.height = 'auto';
            }
        }
    }, [newPosition]);

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

    //경력 리스트 화면
    if (currentView === 'list') {
        return (
            <div className="flex items-center justify-center fixed inset-0 z-50 bg-white">
                <div className="w-full max-w-[430px] h-full bg-white flex flex-col"> 
                    <HeaderLayout
                        headerSlot = {
                            <EditHeader
                                title="경력"
                                leftAction = {{onClick: handleListClose}}
                                rightElement = {
                                    <button
                                        className={`text-b-16-hn transition-colors ${
                                            hasListChanges ? 'text-primary' : 'text-gray-650'
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
                        <div className="flex flex-col flex-1 overflow-y-auto border-t border-gray-150">
                            {/* 경력 비공개 토글 */}
                            <div className="flex items-center justify-between px-[25px] py-[15px] border-b border-gray-150">
                                <span className="text-sb-14-hn text-gray-900">경력 비공개</span>
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

                            {/* 경력 리스트 */}
                            <div className="w-full flex flex-col">
                                {listCareers
                                    .slice()
                                    .sort((a, b) => {
                                        // 시작 연도 비교
                                        if (b.startYear !== a.startYear) {
                                            return b.startYear - a.startYear;
                                        }
                                        // 시작 월 비교
                                        if (b.startMonth !== a.startMonth) {
                                            return b.startMonth - a.startMonth;
                                        }
                                        // 종료 연도 비교 (현재 근무중이면 9999로 취급)
                                        const aEndYear = a.endYear || 9999;
                                        const bEndYear = b.endYear || 9999;
                                        if (bEndYear !== aEndYear) {
                                            return bEndYear - aEndYear;
                                        }
                                        // 종료 월 비교
                                        const aEndMonth = a.endMonth || 12;
                                        const bEndMonth = b.endMonth || 12;
                                        return bEndMonth - aEndMonth;
                                    })
                                    .map((career, index) => (
                                    <div
                                        key={career.id}
                                        className="w-full flex justify-between items-center px-[25px] py-[15px] border-b border-gray-150"
                                    >
                                        <div className="flex items-center gap-[20px]">
                                            <span className="text-m-16 text-gray-650 min-w-[24px] text-center">{index + 1}</span>
                                            <div className="flex flex-col justify-center gap-[7px] max-w-[200px]">
                                                <span className="text-r-12-hn text-gray-650">
                                                    {career.startYear}.{String(career.startMonth).padStart(2, '0')}
                                                    {career.endYear && career.endMonth 
                                                        ? `~${career.endYear}.${String(career.endMonth).padStart(2, '0')}`
                                                        : '~현재'}
                                                </span>
                                                <span className="text-m-16 text-gray-900 pb-[3px]">{career.organization}</span>
                                                <div className="flex flex-col gap-[2px]">
                                                    {career.positions.map((p, posIndex) => (
                                                        <span key={posIndex} className="text-r-14 text-gray-750">
                                                            - {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button className="min-w-[25px] text-sb-14-hn text-gray-650"
                                            onClick={() => handleEditCareer(career.id)}>
                                            수정
                                        </button>
                                    </div>
                                ))}

                                {/* 경력 추가 버튼 */}
                                <button
                                    onClick={handleAddCareer}
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
                                    <span className="text-m-14 text-primary">경력 추가</span>
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
                            title= {currentView === 'add' ? '경력 추가' : '경력 수정'}
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

                    {/* 수정/삭제 */}
                    <div className="w-full h-full flex-1 overflow-y-auto px-[25px] py-[20px] border-t border-gray-150">
                        <div className="flex flex-col gap-[15px]">
                            {/* 근무처 */}
                            <div className="flex flex-col gap-[10px]">
                                <span className="text-sb-16-hn text-gray-900">근무처</span>
                                <input
                                    type="text"
                                    value={formData.organization || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, organization: e.target.value });
                                    }}
                                    placeholder="근무처 이름을 입력해 주세요"
                                    className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] text-r-16-hn text-gray-750 placeholder:text-gray-650 focus:outline-none"
                                />
                            </div>

                            {/* 기간 */}
                            <div className="w-full flex flex-col gap-[10px]">
                                <span className="text-sb-16-hn text-gray-900">기간</span>
                                
                                {/* 시작 */}
                                <div className="flex gap-[10px] items-center">
                                    <div className="flex-1 relative min-w-[110px]">
                                        <button
                                            onClick={() => setShowStartYearDropdown(!showStartYearDropdown)}
                                            className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                        >
                                            <span className="text-r-16-hn text-gray-750">{formData.startYear}년</span>
                                            <Icon name="toggleDown" 
                                                className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showStartYearDropdown ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {showStartYearDropdown && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                {years
                                                    .filter(year => {
                                                        if (formData.endYear) {
                                                            return year <= formData.endYear; // 종료 연도 이하만
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

                                    <div className="flex-1 relative min-w-[110px]">
                                        <button
                                            onClick={() => setShowStartMonthDropdown(!showStartMonthDropdown)}
                                            className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                        >
                                            <span className="text-r-16-hn text-gray-750">{formData.startMonth}월</span>
                                            <Icon name="toggleDown" 
                                                className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showStartMonthDropdown ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {showStartMonthDropdown && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                {MONTHS
                                                    .filter(month => {
                                                        if (formData.endYear === formData.startYear && formData.endMonth) {
                                                            return month <= formData.endMonth; // 종료 월 이하만
                                                        }
                                                        return true;
                                                    })
                                                    .map((month) => (
                                                    <button
                                                        key={month}
                                                        onClick={() => {
                                                            setFormData({ ...formData, startMonth: month });
                                                            setShowStartMonthDropdown(false);
                                                        }}
                                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                            formData.startMonth === month ? 'text-primary' : 'text-gray-650'
                                                        }`}
                                                    >
                                                        {month}월
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <span className="flex-1 text-r-14-hn text-gray-650 min-w-[25px] max-w-[65px]">부터</span>
                                </div>

                                {/* 종료 */}
                                <div className="flex gap-[10px] items-center">
                                    <div className="flex-1 relative min-w-[110px]">
                                        <button
                                            onClick={() => setShowEndYearDropdown(!showEndYearDropdown)}
                                            className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                        >
                                            <span className="text-r-16-hn text-gray-750">
                                                {formData.endYear ? `${formData.endYear}년` : '현재'}
                                            </span>
                                            <Icon name="toggleDown" 
                                                className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showEndYearDropdown ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {showEndYearDropdown && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                <button
                                                    onClick={() => {
                                                        setFormData({ ...formData, endYear: undefined, endMonth: undefined });
                                                        setShowEndYearDropdown(false);
                                                    }}
                                                    className={`flex w-full p-[15px] border-gray-150 border-b text-r-16-hn ${
                                                        !formData.endYear ? 'text-primary' : 'text-gray-650'
                                                    }`}
                                                >
                                                    현재
                                                </button>
                                                {years
                                                    .filter(year => {
                                                        if (formData.startYear !== undefined) {
                                                            return year >= formData.startYear; // 시작 연도 이상만
                                                        }
                                                        return true;
                                                    })
                                                    .map((year) => (
                                                    <button
                                                        key={year}
                                                        onClick={() => {
                                                            setFormData({ ...formData, endYear: year, endMonth: formData.endMonth || 12 });
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

                                    {formData.endYear && (
                                        <div className="flex-1 relative min-w-[110px]">
                                            <button
                                                onClick={() => setShowEndMonthDropdown(!showEndMonthDropdown)}
                                                className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                            >
                                                <span className="text-r-16-hn text-gray-750">{formData.endMonth}월</span>
                                                <Icon name="toggleDown" 
                                                    className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showEndMonthDropdown ? 'rotate-180' : ''}`}/>
                                            </button>
                                            {showEndMonthDropdown && (
                                                <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                    {MONTHS
                                                        .filter(month => {
                                                            if (formData.endYear === formData.startYear && formData.startMonth !== undefined) {
                                                                return month >= formData.startMonth; // 시작 월 이상만
                                                            }
                                                            return true;
                                                        })
                                                        .map((month) => (
                                                        <button
                                                            key={month}
                                                            onClick={() => {
                                                                setFormData({ ...formData, endMonth: month });
                                                                setShowEndMonthDropdown(false);
                                                            }}
                                                            className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                                formData.endMonth === month ? 'text-primary' : 'text-gray-650'
                                                            }`}
                                                        >
                                                            {month}월
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <span className="flex-1 text-r-14-hn text-gray-650 min-w-[25px] max-w-[65px]">까지</span>
                                </div>
                            </div>

                            {/* 직위 및 담당 업무 */}
                            <div className="flex flex-col gap-[10px]">
                                <span className="text-sb-16-hn text-gray-900">직위 및 담당 업무</span>
                                
                                {/* 새 직위 입력 */}
                                <div className="min-h-[51px] flex items-center gap-[20px] p-[15px] mb-[5px] border-b border-gray-150">
                                    <textarea
                                        id="positionTextarea"
                                        rows={1}
                                        value={newPosition}
                                        onChange={(e) => {
                                            setNewPosition(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        placeholder="내용을 입력해 주세요"
                                        className="flex-1 text-r-16-hn text-gray-750 resize-none overflow-hidden placeholder:text-gray-650 focus:outline-none"
                                    />
                                    {newPosition.length > 0 && (<button
                                        onClick={handleAddPosition}
                                        className="text-sb-14 text-primary"
                                    >
                                        추가
                                    </button>)}
                                </div>

                                {/* 입력된 직위 목록 */}
                                {formData.positions && formData.positions.length > 0 && (
                                    <div className="flex flex-col">
                                        {formData.positions.map((position, idx) => (
                                            <div key={idx} className="flex items-center justify-between px-[15px] py-[10px] border-b border-gray-150">
                                                <span className="flex-1 text-r-16-hn text-gray-750">{position}</span>
                                                <button
                                                    onClick={() => handleRemovePosition(idx)}
                                                    className="text-red text-sb-14-hn"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 삭제 버튼 (수정 모드일 때만) */}
                            {currentView === 'edit' && (
                                <button
                                    onClick={handleDeleteCareer}
                                    className="flex text-m-14 text-red mt-[20px]"
                                >
                                    경력 삭제
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
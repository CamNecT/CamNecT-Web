import { useState, useEffect, useMemo } from "react";
import Icon from "../../../components/Icon";
import { type CertificateItem } from "../../../types/mypage/mypageTypes";
import { HeaderLayout } from "../../../layouts/HeaderLayout";
import { EditHeader } from "../../../layouts/headers/EditHeader";
import { useModalHistory } from "../../../hooks/useModalHistory";
import PopUp from "../../../components/Pop-up";
import { generateId } from "../../../utils/uuid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCertificate, updateCertificate, deleteCertificate } from "../../../api/userInfoApi";
import { updateProfilePrivacy } from "../../../api/profileApi";
import { convertCertificateToRequest } from "../utils/dataConverter";
import type { 
    CertificateAddResponse, 
    CertificateUpdateResponse, 
    CertificateDeleteResponse 
} from "../../../api-types/userInfoApiTypes";
import type { ProfilePrivacyUpdateResponse } from "../../../api-types/profileApiTypes";

interface CertificateModalProps {
    userId: number;
    certificates: CertificateItem[];
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

export default function CertificateModal({ userId, certificates, visibility, onClose }: CertificateModalProps) {
    const queryClient = useQueryClient();
    const isServerId = (id: string) => /^\d+$/.test(id);
    const initialShowPublic = visibility.certificateVisibility;
    
    const [currentView, setCurrentView] = useState<View>('list');
    const [listCertificates, setListCertificates] = useState<CertificateItem[]>(certificates);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPublic, setShowPublic] = useState(initialShowPublic);
    const [showWarning, setShowWarning] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState('');
    
    const [formData, setFormData] = useState<Partial<CertificateItem>>({
        name: '',
        acquiredYear: new Date().getFullYear(),
        acquiredMonth: 1,
    });

    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 변경사항 추적 (리스트 전체 추적)
    const hasListChanges: boolean = useMemo(() => {
        const certificatesChanged = JSON.stringify(listCertificates) !== JSON.stringify(certificates);
        const showPublicChanged = showPublic !== initialShowPublic;
        return certificatesChanged || showPublicChanged;
    }, [listCertificates, certificates, showPublic, initialShowPublic]);

    // 수정/추가 각각의 변경사항 추적
    const hasFormChanges: boolean = useMemo(() => {
        if (!formData.name || !formData.name.trim()) {
            return false;
        }
        if (currentView === 'add') {
            return !!(formData.name.trim());
        }
        if (currentView === 'edit' && editingId !== null) {
            const original = listCertificates.find(c => c.id === editingId);
            if (!original) return false;
            return (
                formData.name !== original.name ||
                formData.acquiredYear !== original.acquiredYear ||
                formData.acquiredMonth !== original.acquiredMonth
            );
        }
        return false;
    }, [formData, currentView, editingId, listCertificates]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const tasks: Promise<
                | ProfilePrivacyUpdateResponse
                | CertificateDeleteResponse
                | CertificateAddResponse
                | CertificateUpdateResponse
            >[] = [];

            // 1. 공개여부 변경
            if (showPublic !== initialShowPublic) {
                tasks.push(updateProfilePrivacy(userId, { 
                    isFollowerVisible: visibility.isFollowerVisible,
                    isEducationVisible: visibility.educationVisibility,
                    isExperienceVisible: visibility.careerVisibility,
                    isCertificateVisible: showPublic,
                }));
            }

            // 2. 삭제된 항목
            const deletedIds = certificates
                .filter(orig => !listCertificates.find(n => n.id === orig.id))
                .filter(c => isServerId(c.id))
                .map(c => Number(c.id));

            for (const id of deletedIds) {
                tasks.push(deleteCertificate(userId, id));
            }

            // 3. 새로 추가된 항목
            const addedCertificates = listCertificates.filter(c => !isServerId(c.id));

            for (const certificate of addedCertificates) {
                const request = convertCertificateToRequest(certificate);
                tasks.push(addCertificate(userId, request));
            }

            // 4. 수정된 항목
            const updatedCertificates = listCertificates.filter(n => {
                if (!isServerId(n.id)) return false;
                const original = certificates.find(o => o.id === n.id);
                return original && JSON.stringify(n) !== JSON.stringify(original);
            });

            for (const certificate of updatedCertificates) {
                const request = convertCertificateToRequest(certificate);
                tasks.push(updateCertificate(userId, Number(certificate.id), request));
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

    const handleAddCertificate = () => {
        setFormData({
            name: '',
            acquiredYear: currentYear,
            acquiredMonth: 1,
        });
        setCurrentView('add');
    };

    const handleEditCertificate = (id: string) => {
        setEditingId(id);
        const cert = listCertificates.find(c => c.id === id);
        if (cert) {
            setFormData(cert);
            setCurrentView('edit');
        }
    };

    const handleSaveForm = () => {
        if (!formData.name || !formData.name.trim()) {
            return;
        }
        
        if (!hasFormChanges) {
            setCurrentView('list');
            return;
        }

        if (currentView === 'add') {
            const newCert: CertificateItem = {
                id: generateId(),
                ...formData as Omit<CertificateItem, 'id'>
            };
            setListCertificates([...listCertificates, newCert]);
        } else if (currentView === 'edit' && editingId !== null) {
            setListCertificates(listCertificates.map(c => 
                c.id === editingId ? { ...c, ...formData } : c
            ));
        }
        setCurrentView('list');
    };

    const handleDeleteCertificate = () => {
        if (editingId !== null) {
            setListCertificates(listCertificates.filter(c => c.id !== editingId));
            setCurrentView('list');
        }
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

    // 자격증 리스트 화면
    if (currentView === 'list') {
        return (
            <div className="flex items-center justify-center fixed inset-0 z-50 bg-white">
                <div className="w-full max-w-[430px] h-full bg-white flex flex-col"> 
                    <HeaderLayout
                        headerSlot = {
                            <EditHeader
                                title="자격증"
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
                            {/* 자격증 비공개 토글 */}
                            <div className="flex items-center justify-between px-[25px] py-[15px] border-b border-gray-150">
                                <span className="text-sb-14-hn text-gray-900">자격증 비공개</span>
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

                            {/* 자격증 리스트 */}
                            <div className="w-full flex flex-col">
                                {listCertificates
                                    .slice()
                                    .sort((a, b) => {
                                        // 연도 비교
                                        if (b.acquiredYear !== a.acquiredYear) {
                                            return b.acquiredYear - a.acquiredYear;
                                        }
                                        // 같은 연도면 월 비교
                                        return b.acquiredMonth - a.acquiredMonth;
                                    })
                                    .map((cert, index) => (
                                    <div
                                        key={cert.id}
                                        className="flex items-center justify-between px-[25px] py-[15px] border-b border-gray-150"
                                    >
                                        <div className="flex items-center gap-[20px]">
                                            <span className="text-m-16 text-gray-650 min-w-[24px] text-center">{index + 1}</span>
                                            <div className="flex flex-col gap-[7px]">
                                                <span className="text-r-12-hn text-gray-650">
                                                    {cert.acquiredYear}.{String(cert.acquiredMonth).padStart(2, '0')}
                                                </span>
                                                <span className="text-m-16 text-gray-900">{cert.name}</span>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            className="text-sb-14-hn text-gray-650"
                                            onClick={() => handleEditCertificate(cert.id)}
                                        >
                                            수정
                                        </button>
                                    </div>
                                ))}

                                {/* 자격증 추가 버튼 */}
                                <button
                                    onClick={handleAddCertificate}
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
                                    <span className="text-m-14 text-primary">자격증 추가</span>
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
                            title= {currentView === 'add' ? '자격증 추가' : '자격증 수정'}
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
                        <div className="flex flex-col gap-[17px]">
                            {/* 자격증 */}
                            <div className="flex flex-col gap-[10px]">
                                <span className="text-sb-16-hn text-gray-900">자격증</span>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="자격증 이름을 입력해 주세요"
                                    className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] text-r-16-hn text-gray-750 placeholder:text-gray-650 focus:outline-none"
                                />
                            </div>

                            {/* 취득 일자 */}
                            <div className="w-full flex flex-col gap-[10px]">
                                <span className="text-sb-16-hn text-gray-900">취득 일자</span>
                                <div className="flex gap-[7px] items-center">
                                    {/* 연도 */}
                                    <div className="flex-1 relative min-w-[110px]">
                                        <button
                                            onClick={() => setShowYearDropdown(!showYearDropdown)}
                                            className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                        >
                                            <span className="text-r-16-hn text-gray-750">{formData.acquiredYear}년</span>
                                            <Icon name="toggleDown" 
                                                className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {showYearDropdown && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                {years.map((year) => (
                                                    <button
                                                        key={year}
                                                        onClick={() => {
                                                            setFormData({ ...formData, acquiredYear: year });
                                                            setShowYearDropdown(false);
                                                        }}
                                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                            formData.acquiredYear === year ? 'text-primary' : 'text-gray-650'
                                                        }`}
                                                    >
                                                        {year}년
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 월 */}
                                    <div className="flex-1 relative min-w-[82px]">
                                        <button
                                            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                                            className="w-full h-[52px] p-[15px] border border-gray-150 rounded-[5px] flex items-center justify-between focus:outline-none"
                                        >
                                            <span className="text-r-16-hn text-gray-750">{formData.acquiredMonth}월</span>
                                            <Icon name="toggleDown" 
                                                className={`w-[24px] h-[24px] block shrink-0 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {showMonthDropdown && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-100 border border-gray-150 rounded-[5px] z-10 max-h-[200px] overflow-y-auto">
                                                {MONTHS.map((month) => (
                                                    <button
                                                        key={month}
                                                        onClick={() => {
                                                            setFormData({ ...formData, acquiredMonth: month });
                                                            setShowMonthDropdown(false);
                                                        }}
                                                        className={`flex w-full p-[15px] border-gray-150 border-b last:border-b-0 text-r-16-hn ${
                                                            formData.acquiredMonth === month ? 'text-primary' : 'text-gray-650'
                                                        }`}
                                                    >
                                                        {month}월
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
                                    onClick={handleDeleteCertificate}
                                    className="flex text-m-14 text-red mt-[20px]"
                                >
                                    자격증 삭제
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
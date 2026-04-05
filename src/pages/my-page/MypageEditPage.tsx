import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "../../components/Icon";
import InfoSection from "./components/InfoSection";
import ImageEditModal from "./components/ImageEditModal";
import { useProfileEdit } from "./hooks/useProfileEdit";
import { useProfileEditModals } from "./hooks/useProfileEditModal";
import TagsEditModal from "./components/TagsEditModal";
import IntroEditModal from "./components/IntroEditModal";
import EducationEditModal from "./components/EducationEditModal";
import CareerEditModal from "./components/CareerEditModal";
import CertificateEditModal from "./components/CertificateEditModal";
import { HeaderLayout } from "../../layouts/HeaderLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import defaultProfileImg from "../../assets/image/defaultProfileImg.png";
import PopUp from "../../components/Pop-up";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { requestProfilePresign, requestTagList } from "../../api/auth";
import { useFileUpload } from "../../hooks/useFileUpload";
import axios from "axios";
import { updateProfileImage,  updateProfilePrivacy } from "../../api/profileApi";

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;

const MAX_SIZE_MB = 20;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const MypageEditPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const authUser = useAuthStore(state => state.user);
    const userId = authUser?.id ? parseInt(authUser.id) : 0;
    const pageRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isError } = useProfileEdit(userId);
    const { currentModal, openModal, closeModal } = useProfileEditModals();

    const [confirm, setConfirm] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [imageErrorMessage, setImageErrorMessage] = useState('');
    const [isImageUploading, setIsImageUploading] = useState(false);

    const { prepareFile } = useFileUpload({
        maxSizeMB: MAX_SIZE_MB,
        allowedTypes: ALLOWED_IMAGE_TYPES,
    });

    // 태그 리스트 조회
    const { data: tagList } = useQuery({
        queryKey: ["tagList"],
        queryFn: () => requestTagList(),
    });

    // 태그 데이터 포맷팅
    const { tagIdToName } = useMemo(() => {
        const tags = tagList?.data?.flatMap(cat =>
            cat.tags.map(tag => ({ id: tag.id, name: tag.name }))
        ) ?? [];
        const m = new Map<number, string>();
        for (const t of tags) m.set(t.id, t.name);
        return { allTags: tags, tagIdToName: m };
    }, [tagList]);

    const handleClose = () => { 
        navigate(-1);
    };

    //modal 열리면 스크롤 lock
    useEffect(() => {
        if (currentModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [currentModal]);

    const handleSelectImage = (file: File) => {
        closeModal();

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setImageErrorMessage('이미지는 webp / jpeg / png 형식만 업로드 가능합니다.');
            return;
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setImageErrorMessage(`이미지가 파일 용량 제한을 초과합니다. (최대 ${MAX_SIZE_MB}MB)`);
            return;
        }

        const prepared = prepareFile(file);
        if (!prepared) {
            setImageErrorMessage('파일을 업로드할 수 없어요. 형식/용량을 확인해주세요.');
            return;
        }

        //서버에 사진 업로드
        setIsImageUploading(true);
        imageUploadMutation.mutate(prepared.file);
    };

    const handleDeleteImage = () => {
        closeModal();
        setIsImageUploading(true);
        imageDeleteMutation.mutate();
    };

    const imageUploadMutation = useMutation({
        mutationFn: async (file: File) => {
            // presigned URL 요청
            const presignResponse = await requestProfilePresign({
                userId: userId!,
                contentType: file.type,
                size: file.size,
                originalFilename: file.name,
            });

            const { uploadUrl, fileKey, requiredHeaders } = presignResponse.data;

            // S3 업로드
            await axios.put(uploadUrl, file, { headers: requiredHeaders });

            // 프로필 업데이트
            await updateProfileImage(userId!, { profileImageKey: fileKey });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
            setIsImageUploading(false);
        },
        onError: () => {
            setIsImageUploading(false);
            setSaveError('이미지 업로드에 실패했습니다.');
        },
    });

    const imageDeleteMutation = useMutation({
        mutationFn: () => updateProfileImage(userId!, { profileImageKey: null }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
            setIsImageUploading(false);
        },
        onError: () => {
            setIsImageUploading(false);
            setSaveError('이미지 삭제에 실패했습니다. 다시 시도해주세요.');
        },
    });

    const followerVisibilityMutation = useMutation({
        mutationFn: (isVisible: boolean) => 
            updateProfilePrivacy(userId!, { 
                isFollowerVisible: isVisible,                              //새 값
                isEducationVisible: data?.visibility.educationVisibility ?? false,   //기존 값 유지
                isExperienceVisible: data?.visibility.careerVisibility ?? false,     //기존 값 유지
                isCertificateVisible: data?.visibility.certificateVisibility ?? false, //기존 값 유지
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
        },
        onError: (error) => {
            console.error("팔로워 공개여부 변경 실패:", error);
            setSaveError('설정 변경에 실패했습니다. 다시 시도해주세요.');
        },
    });

        // 유저를 찾을 수 없음.
    if (!userId || 0) {
        return (
            <PopUp
                type="error"
                title="유저 아이디 확인 불가"
                content="잠시 후 다시 시도해주세요."
                isOpen={true}
                rightButtonText='확인'
                onClick={() => navigate(-1)}
            />
        );
    }

    // 로딩 중
    if (isLoading || !data) {
        return (
            <PopUp
                type="loading"
                isOpen={true}
            />
        );
    }

    // 에러 또는 데이터 없음
    if (isError) {
        return (
            <PopUp
                type="error"
                title="일시적 오류"
                content="잠시 후 다시 시도해주세요."
                isOpen={true}
                rightButtonText='확인'
                onClick={() => navigate(-1)}
            />
        );
    }

    const { user, visibility, educations, careers, certificates } = data;
    
    return (
        <div>
            <HeaderLayout
                headerSlot = {
                    <MainHeader
                        title="프로필 수정"
                        leftAction={{onClick: handleClose}}
                    />
                }
            >
                <div className="w-full bg-white relative border-t border-gray-150">
                    <div ref={pageRef} className="w-full h-full bg-white overflow-y-auto">

                        {/* 프로필 사진 선택 */}
                        <section className="w-full">
                            <div className="w-full flex items-center gap-[15px] px-[25px] py-[15px] border-b border-gray-150">
                                <button className="relative h-[56px] w-[56px]"
                                onClick={() => openModal('image')}>
                                    <img
                                    src={user.profileImg ?? DEFAULT_PROFILE_IMAGE}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null; //이미지 깨짐 방지
                                        e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                                    }}
                                    alt="프로필"
                                    className="h-[56px] w-[56px] rounded-full"
                                />
                                    <div className="absolute top-0 h-[56px] w-[56px] rounded-full bg-gray-900/60"></div>
                                    <Icon name="cameraWhite" className="absolute top-[16px] left-[16px] block shrink-0" />
                                </button>
                                
                                <div className="flex flex-col flex-1 gap-[6px]">
                                    <div className="text-B-18-hn text-gray-900">{user.name}</div>
                                    <div className="text-R-12-hn text-gray-750 break-keep">
                                        {user.major} {user.gradeNumber}학번
                                    </div>
                                </div>
                            </div>

                            {/* 태그 및 자기소개 */}
                            <div className="w-full flex flex-col border-b border-gray-150 px-[25px] pt-[18px] pb-[23px] gap-[23px]">
                                <div className="w-full flex flex-col gap-[7px]">
                                    <div className="flex items-center justify-between">
                                        <div className="text-SB-14 text-black">태그</div>
                                        <button onClick={() => openModal('tags')}
                                        className="text-R-12-hn text-gray-650 flex items-center gap-[2px]">
                                            수정하기
                                            <Icon name="more2" className="w-[10px] h-[10px] block shrink-0"/>
                                        </button>
                                    </div>
                                    <div className="w-full flex flex-wrap gap-[5px] pl-[4px]">
                                        {user.userTags.map((id: number) => (
                                            <span
                                                key={id}
                                                className="flex justify-center items-center rounded-[3px] border border-primary bg-green-50 px-[5px] py-[3px] text-R-12-hn text-primary"
                                            >
                                                {tagIdToName.get(id) ?? `#${id}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full flex flex-col gap-[7px]">
                                    <div className="flex items-center justify-between">
                                        <div className="text-SB-14 text-black">자기 소개</div>
                                        <button onClick={() => openModal('intro')}
                                        className="text-R-12-hn text-gray-650 flex items-center gap-[2px]">
                                            수정하기
                                            <Icon name="more2" className="w-[10px] h-[10px] block shrink-0"/>
                                        </button>
                                    </div>
                                    <div className="w-full flex text-R-14 text-gray-750 leading-[1.5] pl-[4px] line-clamp-3 whitespace-pre-line break-keep [overflow-wrap:anywhere]">
                                        {user.introduction}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full py-[15px] px-[25px] flex justify-between items-center">
                                <span className="text-SB-14 text-gray-900">팔로잉/팔로워 수 비공개</span>
                                <button
                                    onClick={() => {
                                        const newValue = !data.visibility.isFollowerVisible;
                                        followerVisibilityMutation.mutate(newValue);  // 즉시 저장
                                    }}
                                    disabled={followerVisibilityMutation.isPending}
                                    className={`relative w-[50px] h-[24px] rounded-full transition-colors duration-300 ease-in-out ${
                                        data.visibility.isFollowerVisible ? 'bg-gray-300' : 'bg-primary'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform duration-300 ease-in-out ${
                                            data.visibility.isFollowerVisible ? "translate-x-0" : "translate-x-[26px]"
                                        }`}
                                    />
                                </button>
                            </div>
                        </section>

                        {/* Divider */}
                        <div className="w-full h-[10px] bg-gray-150"></div>

                        <div className="flex flex-col gap-[40px] py-[30px] px-[25px]">
                            <InfoSection
                                type="education"
                                items={educations}
                                isEdit={true}
                                onEditClick={() => openModal('education')}
                            />

                            <InfoSection
                                type="career"
                                items={careers}
                                isEdit={true}
                                onEditClick={() => openModal('career')}
                            />

                            <InfoSection
                                type="certificate"
                                items={certificates}
                                isEdit={true}
                                onEditClick={() => openModal('certificate')}
                            />
                        </div>
                    </div> 
                </div>
            </HeaderLayout>

            <ImageEditModal
                isOpen={currentModal === 'image'}
                onClose={closeModal}
                onSelect={handleSelectImage}
                onDelete={handleDeleteImage}
            />
            {currentModal === 'tags' && (
                <TagsEditModal
                    userId={userId}
                    tagIds={user.userTags || []}
                    onClose={closeModal}
                />
            )}
            {currentModal === 'intro' && (
                <IntroEditModal
                    userId={userId}
                    initialStatement={user.introduction}
                    onClose={closeModal}
                />
            )}
            {currentModal === 'education' && (
                <EducationEditModal
                    userId={userId}
                    educations={data.educations}
                    visibility={visibility}
                    onClose={closeModal}
                />
            )}
            {currentModal === 'career' && (
                <CareerEditModal
                    userId={userId}
                    careers={data.careers}
                    visibility={visibility}
                    onClose={closeModal}
                />
            )}
            {currentModal === 'certificate' && (
                <CertificateEditModal
                    userId={userId}
                    certificates={data.certificates}
                    visibility={visibility}
                    onClose={closeModal}
                />
            )}
            <PopUp
                isOpen={leaveOpen}
                type="warning"
                title={"변경사항이 있습니다.\n나가시겠습니까?"}
                content="저장하지 않을 시 변경사항이 삭제됩니다."
                leftButtonText="나가기"
                onLeftClick={() => {
                setLeaveOpen(false);
                navigate(-1);
                }}
                onRightClick={() => setLeaveOpen(false)}
            />
            <PopUp
                isOpen={confirm}
                type="confirm"
                title="프로필이 저장되었습니다!"
                buttonText="확인"
                onClick={() => {
                    setConfirm(false);
                    navigate(-1);
                }}
            />
            <PopUp
                isOpen={!!saveError}
                type="error"
                title="일시적 오류"
                content={saveError || ""}
                buttonText="확인"
                onClick={() => setSaveError(null)}
            />
            <PopUp
                isOpen={!!imageErrorMessage}
                type="error"
                title="업로드할 수 없는 파일"
                content={imageErrorMessage}
                buttonText="확인"
                onClick={() => setImageErrorMessage('')}
            />
            <PopUp
                type="loading"
                isOpen={isImageUploading}
            />
        </div>
    );
};
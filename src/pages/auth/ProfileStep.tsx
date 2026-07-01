import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { requestProfilePresign } from "../../api/auth";
import Button from "../../components/Button";
import ButtonWhite from "../../components/ButtonWhite";
import Icon from "../../components/Icon";
import Input from "../../components/Input";
import PopUp from "../../components/Pop-up";
import { useAuthStore } from "../../store/useAuthStore";
import { useSignupStore } from "../../store/useSignupStore";
import { uploadFileToS3 } from "../../utils/s3Upload";

interface ProfileStepProps {
  onNext: () => void;
}

export const ProfileStep = ({ onNext }: ProfileStepProps) => {
  const { storedIntroduction, storedProfileImage, setProfileImage, setSelfIntroduction, setProfileImageKey } = useSignupStore(
    useShallow((state) => ({
      storedIntroduction: state.selfIntroduction,
      storedProfileImage: state.profileImage,
      setProfileImage: state.setProfileImage,
      setSelfIntroduction: state.setSelfIntroduction,
      setProfileImageKey: state.setProfileImageKey,
    }))
  );

  const userId = useAuthStore((state) => state.user?.id ? Number(state.user.id) : null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [introduction, setIntroduction] = useState(storedIntroduction || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(storedProfileImage);
  const [showPreview, setShowPreview] = useState(!!storedProfileImage);
  const [showErrorPopUp, setShowErrorPopUp] = useState(false);

  // 상태 변경 시 전역 스토어 동기화
  useEffect(() => {
    setSelfIntroduction(introduction || null);
  }, [introduction, setSelfIntroduction]);

  useEffect(() => {
    setProfileImage(selectedFile);
  }, [selectedFile, setProfileImage]);

  // useMemo : 같은 의존성에 대해 같은 결과 캐싱 
  const previewUrl = useMemo(() => {
    return selectedFile ? URL.createObjectURL(selectedFile) : null;
  }, [selectedFile]);

  // URL cleanup (메모리 누수 방지)
  useEffect(() => {

    // cleanup : 언마운트 or 의존성 변경 시 실행
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 파일 첨부
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  const presignMutation = useMutation({
    mutationFn: requestProfilePresign
  })

  // 다음 버튼 클릭
  const handleNext = async () => {
    // 파일첨부 된 것 있으면 전역상태 set함수 호출
    setSelfIntroduction(introduction || null);
    setProfileImage(selectedFile);

    if (selectedFile && userId) {
      setIsSubmitting(true);
      try {
        // 1. Presign URL 발급
        const presignResponse = await presignMutation.mutateAsync({
          userId,
          contentType: selectedFile.type,
          size: selectedFile.size,
          originalFilename: selectedFile.name,
        });

        // 2. S3 직접 업로드
        await uploadFileToS3(
          presignResponse.data.uploadUrl,
          selectedFile,
          presignResponse.data.requiredHeaders
        );

        // 3. 발급받은 Key 저장 (다음 단계에서 사용)
        setProfileImageKey(presignResponse.data.fileKey);

        onNext();
      } catch (error) {
        console.error("프로필 업로드 에러:", error);
        setShowErrorPopUp(true);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // 사진이 없거나 유저 ID가 없는 경우
      if (selectedFile && !userId) {
        console.error("유저 ID가 없어 업로드를 중단합니다.");
      }
      setProfileImageKey(null); 
      onNext();
    }
  };

  return (
    <div className="flex flex-col overflow-hidden absolute inset-0 bg-white px-[25px]">
      <h1 className="flex-none relative z-10 pt-[86px] text-[24px] font-bold leading-[140%] tracking-[-0.6px] text-gray-900">
        <p>인증 자료 제출 완료!</p>
        <p>프로필을 설정해볼까요?</p>
      </h1>

      {/* 프로필 사진 업로드 + 자기소개 영역 (나머지 공간 차지) */}
      <div className="flex-1 overflow-y-auto w-full pt-[55px] flex flex-col items-center">
        {showPreview && previewUrl ? (
          <div className="mx-auto relative w-[100px] h-[100px] flex-none">
            <img
              src={previewUrl}
              alt="프로필 미리보기"
              className="w-[100px] h-[100px] rounded-full object-cover"
            />
            <label
              htmlFor="profileImage"
              className="absolute inset-0 cursor-pointer rounded-full"
            >
              <span className="sr-only">프로필 사진 변경</span>
            </label>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="mx-auto relative w-[100px] h-[100px] bg-primary rounded-full flex-none">
            <label
              htmlFor="profileImage"
              className="absolute inset-0 cursor-pointer"
            >
              <span className="sr-only">프로필 사진 업로드</span>
            </label>

            <label 
              htmlFor="profileImage"
              className="absolute bottom-0 right-0 w-[32px] h-[32px] bg-[#646464] rounded-full border-2 border-white flex items-center justify-center z-10 cursor-pointer"
            >
              <Icon
                name="camera"
                className="w-[20px] h-[20px] text-white"
              />
            </label>

            <input
              type="file"
              id="profileImage"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        <div className="mt-[30px] flex flex-col w-full max-w-[325px] flex-none">
          <label className="text-m-16 tracking-[-0.4px] text-gray-750 mb-1 block">
            자기소개
          </label>

          <Input
            width="100%"
            placeholder="자기소개 내용을 입력해주세요! (최대 100자)"
            value={introduction || ""}
            onChange={(e) => setIntroduction(e.target.value)}
            maxLength={100}
            height={130}
          />

          <div className="mt-2 self-end text-R-12 text-gray-650">
            {(introduction?.length || 0)}/100
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 (바닥에서 60px 유지) */}
      <div className="flex-none pt-[20px] pb-[60px] w-full flex justify-center">
        <div className="flex items-center gap-[10px] w-full max-w-[325px]">
          <ButtonWhite
            label="건너뛰기"
            onClick={onNext}
            className="flex-1 h-[50px] rounded-[10px]"
          />

          <Button
            disabled={!(introduction && selectedFile) || isSubmitting}
            label={isSubmitting ? "업로드 중..." : "다음"}
            onClick={handleNext}
            className="flex-1 h-[50px] rounded-[10px]"
          />
        </div>
      </div>

      {showErrorPopUp && (
        <PopUp
          isOpen={showErrorPopUp}
          type="error"
          title="업로드 실패"
          content="이미지 업로드 중 오류가 발생했습니다\n다시 시도해 주세요."
          buttonText="확인"
          onClick={() => setShowErrorPopUp(false)}
        />
      )}
    </div>
  );
};

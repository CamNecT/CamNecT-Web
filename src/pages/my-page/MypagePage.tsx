import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstitution, getMajor } from "../../api/institutionApi";
import { getMyProfile } from "../../api/profileApi";
import defaultProfileImg from "../../assets/image/defaultProfileImg.png";
import Button from "../../components/Button";
import PopUp from "../../components/Pop-up";
import { FullLayout } from "../../layouts/FullLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";
import InfoSection from "./components/InfoSection";
import PortfolioSection from "./components/PortfolioSection";
import { SideBar } from "./components/SideBar";
import { mapToCareers, mapToCertificates, mapToEducations, mapToPortfolios } from "./utils/profileMapper";

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;

export const MypagePage = () => {
  const navigate = useNavigate();
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const authUser = useAuthStore(state => state.user);
  const userId = authUser?.id ? parseInt(authUser.id) : null;

  // 프로필 데이터 조회
  const { 
    data: profileResponse, 
    isLoading: isProfileLoading, 
    isError: isProfileError 
  } = useQuery({
    queryKey: ["myProfile", userId],
    queryFn: () => getMyProfile({ loginUserId: userId! }),
    enabled: !!userId,
  });

  const profileData = profileResponse?.data;

  // 학교 정보 조회
  const { data: institutionResponse, isLoading: isInstitutionLoading, isError: isInstitutionError } = useQuery({
    queryKey: ["institution", profileData?.basics.institutionId],
    queryFn: () => getInstitution({
      institutionId: profileData!.basics.institutionId,
    }),
    enabled: !!profileData?.basics.institutionId,
  });

  // 전공 정보 조회 (프로필 데이터가 로드된 후에만)
  const { data: majorResponse, isLoading: isMajorLoading, isError: isMajorError } = useQuery({
    queryKey: ["major", profileData?.basics.institutionId, profileData?.basics.majorId],
    queryFn: () => getMajor({
      institutionId: profileData!.basics.institutionId,
      majorId: profileData!.basics.majorId,
    }),
    enabled: !!profileData?.basics.institutionId && !!profileData?.basics.majorId,
  });

  // 로딩 중
  if (isProfileLoading || isInstitutionLoading || isMajorLoading) {
    return (
      <PopUp
        type="loading"
        isOpen={true}
      />
    );
  }

  // 에러 발생
  if (isProfileError || !profileData || isInstitutionError || isMajorError) {
    return (
      <PopUp
        type="error"
        title="일시적 오류"
        content="잠시 후 다시 시도해주세요."
        isOpen={true}
        rightButtonText="확인"
        onClick={() => navigate(-1)}
      />
    );
  }

  // 데이터 변환
  const portfolios = mapToPortfolios(profileData);
  const educations = mapToEducations(profileData);
  const careers = mapToCareers(profileData);
  const certificates = mapToCertificates(profileData);

  // 학교명과 전공명 가져오기
  const schoolName = institutionResponse?.data.nameKor || "";
  const majorName = majorResponse?.data.nameKor || "";

  // user 객체 생성
  const user = {
    uid: profileData.userId.toString(),
    name: profileData.name,
    profileImg: profileData.basics.profileImageUrl ?? null,
    univ: schoolName, 
    major: majorName,
    gradeNumber: profileData.basics.studentNo ? profileData.basics.studentNo.slice(2, 4) : "00",
    userTags: profileData.tags.map(t => t.name),
    following: profileData.following,
    follower: profileData.follower,
    introduction: profileData.basics.bio || "",
    point: profileData.myPoint,
  };

  const sideBarUser = {
    uid: profileData.userId.toString(),
    name: profileData.name,
    univ: schoolName,
    major: majorName,
    gradeNumber: profileData.basics.studentNo ? profileData.basics.studentNo.slice(2, 4) : "00",
    point: profileData.myPoint,
  };

  return (
    <>
      <FullLayout
        headerSlot={
          <MainHeader
            title="마이페이지"
            leftAction={{ icon: 'mypageOption', onClick: () => setIsSideBarOpen(true) }}
          />
        }
      >
        <div className="w-full bg-white border-t border-gray-150">
          {/* 프로필 */}
          <section className="px-[25px] pt-[40px] pb-[33px] flex flex-col gap-[20px]">
            <div className="flex flex-1 flex-col gap-[22px]">
              <div className="w-full flex items-start gap-[33px]">
                <img
                  src={user.profileImg ?? DEFAULT_PROFILE_IMAGE}
                  onError={(e) => {
                    e.currentTarget.onerror = null; //이미지 깨짐 방지->S3에서 403
                    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                  }}
                  alt="프로필"
                  className="h-[84px] w-[84px] shrink-0 rounded-full object-cover"
                />
                <div className="w-full flex flex-col gap-[17px]">
                  <div className="flex gap-[10px]">
                    <div className="w-full flex flex-col gap-[6px]">
                      <div className="text-B-18-hn text-gray-900">{user.name}</div>
                      <div className="text-R-12-hn text-gray-750 break-keep">
                        {user.major} {user.gradeNumber}학번
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex flex-wrap gap-[5px]">
                    {user.userTags.map((t, idx) => (
                      <span
                        key={idx}
                        className="flex justify-center items-center rounded-[3px] border border-primary bg-green-50 px-[5px] py-[3px] text-R-12-hn text-primary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-start">
                <button
                  className="flex flex-col justify-center items-start gap-[7px] pl-[3px] pt-[3px] min-w-[51px]"
                  onClick={() => navigate("/me/follower")}
                >
                  <div className="flex justify-start items-align gap-[3px]">
                    <span className="text-R-14-hn text-gray-900">팔로잉</span>
                    <span className="text-SB-14-hn text-gray-900">{profileData.following}</span>
                  </div>
                  <div className="flex justify-start items-align gap-[3px] w-[117px]">
                    <span className="text-R-14-hn text-gray-900">팔로워</span>
                    <span className="text-SB-14-hn text-gray-900">{profileData.follower}</span>
                  </div>
                </button>

                <p className="line-clamp-3 min-h-[63px] leading-[1.5] break-keep whitespace-pre-line text-R-14 text-gray-750 [overflow-wrap:anywhere]">
                  {user.introduction}
                </p>
              </div>
            </div>
            <Button
              label="프로필 수정하기"
              font="SB-14-hn"
              className="h-[40px] max-w-none rounded-[6px] bg-primary"
              onClick={() => navigate("/me/edit")}
            />
          </section>

          {/*divider*/}
          <div className="w-full h-[10px] bg-gray-150"></div>

          <div className="flex flex-col gap-[30px] py-[30px] px-[25px]">
            <PortfolioSection portfolios={portfolios} />

            <InfoSection type="education" items={educations} isEdit={false} />

            <InfoSection type="career" items={careers} isEdit={false} />

            <InfoSection type="certificate" items={certificates} isEdit={false} />
          </div>
        </div>
      </FullLayout>
      <SideBar
        isOpen={isSideBarOpen}
        onClose={() => setIsSideBarOpen(false)}
        user={sideBarUser}
      />
    </>
  );
};
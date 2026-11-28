import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstitution, getMajor } from "../../api/institutionApi";
import { getMyProfile } from "../../api/profileApi";
import defaultProfileImg from "../../assets/image/defaultProfileImg.png";
import Button from "../../components/Button";
import { ExpandableIntroduction } from "../../components/ExpandableIntroduction";
import PopUp from "../../components/Pop-up";
import { FullLayout } from "../../layouts/FullLayout";
import { MainHeader } from "../../layouts/headers/MainHeader";
import { useAuthStore } from "../../store/useAuthStore";
import InfoSection from "./components/InfoSection";
import PortfolioSection from "./components/PortfolioSection";
import { SideBar } from "./components/SideBar";
import GuestMypageView from "./components/GuestMypageView";
import { mapToCareers, mapToCertificates, mapToEducations, mapToPortfolios } from "./utils/profileMapper";

const DEFAULT_PROFILE_IMAGE = defaultProfileImg;

export const MypagePage = () => {
  const navigate = useNavigate();
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const authUser = useAuthStore(state => state.user);
  // 승인 대기 사용자처럼 user 정보만 있고 정식 세션이 없는 경우도 비회원으로 처리
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userId = authUser?.id ? parseInt(authUser.id) : null;

  // 프로필 데이터 조회
  const { 
    data: profileResponse, 
    isLoading: isProfileLoading, 
    isError: isProfileError 
  } = useQuery({
    queryKey: ["myProfile", userId],
    queryFn: () => getMyProfile({ loginUserId: userId! }),
    enabled: isAuthenticated && !!userId,
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

  // 비회원이면 개인 데이터 조회 없이 비회원 마이페이지 표시
  if (!isAuthenticated) {
    return <GuestMypageView />;
  }

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
            leftAction={{ icon: 'menu', onClick: () => setIsSideBarOpen(true) }}
          />
        }
      >
        <div className="w-full bg-white border-t border-gray-150">
          {/* 프로필 */}
          <section className="flex flex-col [padding:clamp(32px,10cqw,40px)_clamp(18px,7cqw,25px)_clamp(24px,8cqw,30px)] [gap:clamp(18px,6cqw,24px)]">
            <div className="grid items-start [grid-template-columns:auto_minmax(0,1fr)] [column-gap:clamp(24px,6cqw,32px)] [row-gap:clamp(14px,4.5cqw,20px)]">
              <img
                src={user.profileImg ?? DEFAULT_PROFILE_IMAGE}
                onError={(e) => {
                  e.currentTarget.onerror = null; //이미지 깨짐 방지->S3에서 403
                  e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                }}
                alt="프로필"
                className="h-[clamp(64px,22.4cqw,84px)] w-[clamp(64px,22.4cqw,84px)] shrink-0 rounded-full object-cover"
              />

              <div className="flex min-w-0 flex-col [gap:clamp(10px,3.5cqw,14px)]">
                <div className="flex flex-col gap-[6px]">
                  <div className="text-B-18-hn text-gray-900">{user.name}</div>
                  <div className="text-R-12-hn text-gray-750 break-keep">
                    {user.major} {user.gradeNumber}학번
                  </div>
                </div>

                <div className="flex flex-wrap [gap:clamp(3px,1.5cqw,5px)]">
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

              <button
                type="button"
                className="flex flex-col items-start [gap:clamp(2px,2cqw,4px)] [padding:11px_clamp(2px,1cqw,3px)] pl-[3px] [grid-column:1/2] [grid-row:2/3]"
                onClick={() => navigate("/me/follower")}
              >
                <div className="flex items-center [gap:clamp(2px,1cqw,3px)]">
                  <span className="text-R-14-hn text-gray-900">팔로잉</span>
                  <span className="text-SB-14-hn text-gray-900">{profileData.following}</span>
                </div>
                <div className="flex items-center [gap:clamp(2px,1cqw,3px)]">
                  <span className="text-R-14-hn text-gray-900">팔로워</span>
                  <span className="text-SB-14-hn text-gray-900">{profileData.follower}</span>
                </div>
              </button>

              <ExpandableIntroduction
                text={user.introduction}
                className="[padding-top:clamp(8px,3cqw,11px)] [grid-column:2/3] [grid-row:2/3]"
                textClassName="leading-[1.5] break-keep text-R-14 text-gray-750"
              />
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

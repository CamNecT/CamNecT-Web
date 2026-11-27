import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { GlobalErrorFallback } from "../components/GlobalErrorFallback";
import { ActivityPage } from "../pages/activity/ActivityPage";
import ActivityPostPage from "../pages/activity/ActivityPostPage";
import { ExternalActivityPostPage } from "../pages/activity/ExternalActivityPostPage";
import { RecruitDetailPage } from "../pages/activity/RecruitDetailPage";
import { RecruitWritePage } from "../pages/activity/RecruitWritePage";
import { ActivityWritePage } from "../pages/activity/WritePage";
import { AdminVerificationDetail } from "../pages/admin/AdminVerificationDetail";
import { AdminVerificationList } from "../pages/admin/AdminVerificationList";
import { AdminReportDetail } from "../pages/admin/AdminReportDetail";
import { AdminReportList } from "../pages/admin/AdminReportList";
import { AdminWritePage } from "../pages/admin/AdminWritePage";
import { ExternalWritePage } from "../pages/admin/ExternalPostWritePage";
import { JobWritePage } from "../pages/admin/JobPostWritePage";
import { AdminCommunityPage } from "../pages/admin/AdminCommunityPage";
import { AlumniSearchPage } from "../pages/alumni/AlumniPage";
import { AlumniPortfolioDetailPage } from "../pages/alumni/portfolio/AlumniPortfolioDetailPage";
import { AlumniPortfolioListPage } from "../pages/alumni/portfolio/AlumniPortfolioListPage";
import { AlumniProfilePage } from "../pages/alumni/ProfilePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { SignUpPage } from "../pages/auth/SignUpPage";
import { ChatListPage } from "../pages/coffee-chat/ChatListPage";
import { ChatRequestListPage } from "../pages/coffee-chat/ChatRequestListPage";
import { ChatRequestRoomPage } from "../pages/coffee-chat/ChatRequestRoomPage";
import { ChatRoomPage } from "../pages/coffee-chat/ChatRoomPage";
import { CommunityPage } from "../pages/community/CommunityPage";
import CommunityPostPage from "../pages/community/CommunityPostPage";
import { WritePage } from "../pages/community/WritePage";
import { HomePage } from "../pages/home/HomePage";
import { NotificationPage } from "../pages/home/NotificationPage";
import IconPreviewPage from "../pages/IconPreviewPage";
import { MypageEditPage } from "../pages/my-page/MypageEditPage";
import { FollowerPage } from "../pages/my-page/MypageFollowerPage";
import { MypagePage } from "../pages/my-page/MypagePage";
import { AccountSettingsPage } from "../pages/my-page/sidebar/AccountSettingsPage";
import { DeleteAccountPage } from "../pages/my-page/sidebar/DeleteAccountPage";
import { EditPasswordPage } from "../pages/my-page/sidebar/EditPasswordPage";
import { MyBookmarksPage } from "../pages/my-page/sidebar/MyBookmarksPage";
import { MyPostsPage } from "../pages/my-page/sidebar/MyPostPage";
import { MySettingsPage } from "../pages/my-page/sidebar/MySettingsPage";
import { PhoneSettingsPage } from "../pages/my-page/sidebar/PhoneSettingsPage";
import { TermsPage } from "../pages/my-page/sidebar/TermsPage";
import { OnboardingPage } from "../pages/onboarding/OnboardingPage";
import { PortfolioDetailPage } from "../pages/portfolio/PortfolioDetailPage";
import { PortfolioListPage } from "../pages/portfolio/PortfolioListPage";
import { Schedule } from "../pages/schedule/Schedule";
import { ShopDetailPage } from "../pages/shop/ShopDetailPage";
import { ShopPointHistoryPage } from "../pages/shop/ShopHistoryPage";
import { ShopPage } from "../pages/shop/ShopPage";
import { AuthGuard } from "./AuthGuard";
import { AdminGuard } from "./AdminGuard";
import { AlumniProfileAccessGuard } from "./AlumniProfileAccessGuard";
import { FindAccountPage } from "../pages/auth/FindAccountPage";

export const router = createBrowserRouter([

    {
        path: "/",
        element: <App />, // 모든 화면을 감싸는 컴포넌트 (큰 틀)
        // 하위 route의 예상하지 못한 렌더링 오류를 도메인 UI와 분리된 최종 fallback으로 전달한다.
        errorElement: <GlobalErrorFallback />,

        // App의 Outlet 태그에 넣을 contents
        children: [
        
            {
                index: true,
                element: <OnboardingPage />,
            },
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "signup",
                element: <SignUpPage />,
            },

            {
                path: "find-account",
                children: [
                    { path: ":tab", element: <FindAccountPage /> },
                ]
            },
            {
                path: "icon-preview",
                element: <IconPreviewPage />,
            },

            {
                // 비회원 공개 범위는 홈·공모전 미리보기 (추천 동문·개인 데이터 제외)
                path: "home",
                children: [
                    {
                        index: true,
                        element: <HomePage />,
                    },
                    {
                        element: <AuthGuard />,
                        children: [
                            {
                                path: "notices",
                                element: <NotificationPage />,
                            },
                        ],
                    },
                ],
            },
            {
                // 비회원 공개 범위는 메인·전체/정보/질문 목록, 정보글 상세·댓글·대댓글·첨부
                // 질문글은 제목 등 목록 표시 정보만 공개
                path: "community",
                children: [
                    {
                        index: true,
                        element: <CommunityPage />,
                    },
                    {
                        // 정보글과 질문글이 같은 URL을 사용하며, 상세 열람 권한은 서버가 판단한다.
                        path: "post/:postId",
                        element: <CommunityPostPage />,
                    },
                    {
                        element: <AuthGuard />,
                        children: [
                            {
                                path: "write",
                                element: <WritePage />,
                            },
                            {
                                path: "edit/:postId",
                                element: <WritePage />,
                            },
                        ],
                    },
                ],
            },
            {
                // 비회원 공개 범위는 동아리·스터디·대외활동·취업정보 목록·상세·댓글·대댓글
                // 팀원 모집은 회원 전용
                path: "activity",
                children: [
                    {
                        index: true,
                        element: <ActivityPage />,
                    },
                    {
                        path: "internal/:postId",
                        element: <ActivityPostPage />,
                    },
                    {
                        // 대외활동과 취업정보 공고가 공유하는 상세 경로다.
                        path: "external/:postId",
                        element: <ExternalActivityPostPage />,
                    },
                    {
                        element: <AuthGuard />,
                        children: [
                            {
                                path: "write",
                                element: <ActivityWritePage />,
                            },
                            {
                                path: "edit/:postId",
                                element: <ActivityWritePage />,
                            },
                            {
                                path: "recruit/:recruitId",
                                element: <RecruitDetailPage />,
                            },
                            {
                                path: ":activityId/recruit-write",
                                children: [
                                    {
                                        index: true,
                                        element: <RecruitWritePage />,
                                    },
                                    {
                                        path: ":recruitId",
                                        element: <RecruitWritePage />,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },

            // 도메인 전체에 로그인이 필요한 경로
            {
                element: <AuthGuard />,
                children: [
                    {
                        path: "admin",
                        element: <AdminGuard />,
                        children: [
                            {
                                path: "school-verification",
                                element: <AdminVerificationList />,
                            },
                            {
                                path: "school-verification/:id",
                                element: <AdminVerificationDetail />,
                            },
                            {
                                path: "reports",
                                children: [
                                    {
                                        index: true,
                                        element: <AdminReportList />,
                                    },
                                    {
                                        path: ":caseId",
                                        element: <AdminReportDetail />,
                                    }
                                ]
                            },
                            {
                                path:"post",
                                children: [
                                    {
                                        index: true,
                                        element: <AdminWritePage/>
                                    },
                                    {
                                        path: "external", 
                                        children: [
                                            {
                                                index: true,
                                                element: <ExternalWritePage />,
                                            },
                                            {
                                                path: ":postId",
                                                element: <ExternalWritePage />,
                                            }
                                        ]
                                    },
                                    {
                                        path: "job", 
                                        children: [
                                            {
                                                index: true,
                                                element: <JobWritePage />,
                                            },
                                            {
                                                path: ":postId",
                                                element: <JobWritePage />,
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                path: "community",
                                element: <AdminCommunityPage />,
                            },
                        ]
                    },
                
                    {
                        path: "alumni",
                        children: [
                            {
                                index: true,
                                element: <AlumniSearchPage />,
                            },
                            {
                                path: "profile",
                                children: [
                                    {
                                        path: ":id",
                                        element: <AlumniProfileAccessGuard />,
                                        children: [
                                            {
                                                index: true,
                                                element: <AlumniProfilePage />,
                                            },
                                            {
                                                path: "portfolio",
                                                element: <AlumniPortfolioListPage />,
                                            },
                                            {
                                                path: "portfolio/:portfolioId",
                                                element: <AlumniPortfolioDetailPage />,
                                            },
                                        ],
                                    }
                                ]
                            },
                        ]
                    },

                    {
                        path: "chat",
                        children: [
                            {
                                index: true,
                                element: <ChatListPage />,
                            },
                            {
                                path: ":id",
                                element: <ChatRoomPage />,
                            },
                            {
                                path: "requests", 
                                children: [
                                    {
                                        index: true,
                                        element: <ChatRequestListPage />,
                                    },
                                    {
                                        path: ":id",
                                        element: <ChatRequestRoomPage />,
                                    }
                                ]
                            }
                        ]
                        
                    },
                    {
                        path: "schedule",
                        element: <Schedule />,
                    },
                    {
                        path: "me",
                        children: [
                            {
                                index: true,
                                element: <MypagePage />
                            },
                            {
                                path: "edit",
                                element: <MypageEditPage />
                            },
                            {
                                path: "follower",
                                element: <FollowerPage />
                            },
                            {
                                path: "portfolio",
                                children: [
                                    {
                                        index: true,
                                        element: <PortfolioListPage />
                                    },
                                    {
                                        path: ":portfolioId",
                                        element: <PortfolioDetailPage />
                                    },
                                ]
                            },
                            {
                                path: "posts",
                                element: <MyPostsPage />
                            },
                            {
                                path: "bookmarks",
                                element: <MyBookmarksPage />
                            },
                            {
                                path: "settings",
                                children: [
                                    {
                                        index: true,
                                        element: <MySettingsPage/>
                                    },
                                    {
                                        path: "account",
                                        children: [
                                            {
                                                index: true,
                                                element: <AccountSettingsPage/>
                                            },
                                            {
                                                path: "password",
                                                element: <EditPasswordPage/>
                                            },
                                            {
                                                path: "phone",
                                                element: <PhoneSettingsPage/>
                                            },
                                            {
                                                path: "delete-account",
                                                element: <DeleteAccountPage/>
                                            }
                                        ]
                                    },
                                    {
                                        path: "terms",
                                        element: <TermsPage/>
                                    }
                                ]
                            },
                        ]
                    },
                    {
                        path: "shop",
                        children: [
                            {
                                index: true,
                                element: <ShopPage />,
                            },
                            {
                                path: "history",
                                element: <ShopPointHistoryPage />,
                            },
                            {
                                path: ":productId",
                                element: <ShopDetailPage />,
                            },
                        ]
                    },
                ]
            },
        ]
    }
]);

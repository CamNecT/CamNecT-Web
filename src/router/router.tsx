import { createBrowserRouter } from "react-router-dom";
import App from "../App";
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
import { MypageEditPage } from "../pages/my-page/MypageEditPage";
import { FollowerPage } from "../pages/my-page/MypageFollowerPage";
import { MypagePage } from "../pages/my-page/MypagePage";
import { AccountSettingsPage } from "../pages/my-page/sidebar/AccountSettingsPage";
import { DeleteAccountPage } from "../pages/my-page/sidebar/DeleteAccountPage";
import { EditPasswordPage } from "../pages/my-page/sidebar/EditPasswordPage";
import { MyBookmarksPage } from "../pages/my-page/sidebar/MyBookmarksPage";
import { MyPostsPage } from "../pages/my-page/sidebar/MyPostPage";
import { MySettingsPage } from "../pages/my-page/sidebar/MySettingsPage";
import { TermsPage } from "../pages/my-page/sidebar/TermsPage";
import { OnboardingPage } from "../pages/onboarding/OnboardingPage";
import { PortfolioDetailPage } from "../pages/portfolio/PortfolioDetailPage";
import { PortfolioListPage } from "../pages/portfolio/PortfolioListPage";
import { Schedule } from "../pages/schedule/Schedule";
import { ShopDetailPage } from "../pages/shop/ShopDetailPage";
import { ShopPage } from "../pages/shop/ShopPage";
import { AuthGuard } from "./AuthGuard";

export const router = createBrowserRouter([

    {
        path: "/",
        element: <App />, // 모든 화면을 감싸는 컴포넌트 (큰 틀)

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

            // 로그인 필수 페이지들 
            {
                element: <AuthGuard/>,
                children: [
                    {
                        path: "admin",
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
                                        path: ":reportId",
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
                        path: "home",
                        children: [
                            {
                                index: true,
                                element: <HomePage />,
                            },
                            {
                                path: "notices",
                                element: <NotificationPage />,
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
                                        element: <AlumniProfilePage />,
                                    },
                                    {
                                        path: ":id/portfolio",
                                        element: <AlumniPortfolioListPage />,
                                    },
                                    {
                                        path: ":id/portfolio/:portfolioId",
                                        element: <AlumniPortfolioDetailPage />,
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
                        path: "activity",
                        children: [
                            {
                                index: true,
                                element: <ActivityPage />,
                            },
                            {
                                path: "write",
                                element: <ActivityWritePage />,
                            },
                            {
                                path: "edit/:postId",
                                element: <ActivityWritePage />,
                            },
                            {
                                path: "internal/:postId",
                                element: <ActivityPostPage />,
                            },
                            {
                                path: "external/:postId",
                                element: <ExternalActivityPostPage />
                            },
                            {
                                path: "recruit/:recruitId",
                                element: <RecruitDetailPage/>
                            },
                            {
                                path:":activityId/recruit-write",
                                children: [
                                    {
                                        index: true,
                                        element: <RecruitWritePage/>
                                    },
                                    {
                                        path: ":recruitId",
                                        element: <RecruitWritePage/>
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
                        path: "community",
                        element: <CommunityPage />,
                    },
                    {
                        path: "community/post/:postId",
                        element: <CommunityPostPage />,
                    },
                    {
                        path: "shop",
                        children: [
                            {
                                index: true,
                                element: <ShopPage />,
                            },
                            {
                                path: ":productId",
                                element: <ShopDetailPage />,
                            },
                        ]
                    },
                    {
                        path: "community",
                        children: [
                            {
                                index: true,
                                element: <CommunityPage />,
                            },
                            {
                                path: "write",
                                element: <WritePage />,
                            },
                            {
                                path: "edit/:postId",
                                element: <WritePage />,
                            },
                            {
                                path: "post/:postId",
                                element: <CommunityPostPage />,
                            },
                        ]
                    },
                    {
                        path: "community/write",
                        element: <WritePage />,
                    },
                    {
                        path: "community/edit/:postId",
                        element: <WritePage />,
                    },
                ]
            },
        ]
    }
]);

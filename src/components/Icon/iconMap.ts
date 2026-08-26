const figmaSvgs = import.meta.glob("./svg/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const getFigmaSvg = (name: string) => figmaSvgs[`./svg/${name}.svg`];

// Figma export에 아직 없는 기존 아이콘은 legacyIconMap에 임시 유지합니다.
// Figma SVG가 추가되면 ./svg에 파일을 넣고 figmaIconNames에 이름을 등록해서 사용합니다.
const legacyIconMap = {
  close: `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.1 2.9H13.9L18.1 7.1V13.9L13.9 18.1H7.1L2.9 13.9V7.1L7.1 2.9Z" stroke="#FF3838" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.1 8.1L12.9 12.9M12.9 8.1L8.1 12.9" stroke="#FF3838" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  follow: `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2.75V4.25M8 4.25V5.74999M8 4.25H9.5M8 4.25H6.5M5.375 2.1875C5.375 2.63505 5.19721 3.06427 4.88074 3.38074C4.56427 3.69721 4.13505 3.875 3.6875 3.875C3.23995 3.875 2.81072 3.69721 2.49426 3.38074C2.17779 3.06427 2 2.63505 2 2.1875C2 1.73995 2.17779 1.31072 2.49426 0.994257C2.81072 0.67779 3.23995 0.5 3.6875 0.5C4.13505 0.5 4.56427 0.67779 4.88074 0.994257C5.19721 1.31072 5.375 1.73995 5.375 2.1875ZM0.5 8.61749V8.56249C0.5 7.71712 0.835825 6.90636 1.4336 6.30859C2.03137 5.71082 2.84212 5.375 3.6875 5.375C4.53288 5.375 5.34363 5.71082 5.9414 6.30859C6.53918 6.90636 6.875 7.71712 6.875 8.56249V8.61699C5.91274 9.19654 4.81031 9.50189 3.687 9.49999C2.5215 9.49999 1.431 9.17749 0.5 8.61699V8.61749Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  reply: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.4902 12L20.2402 15.75M20.2402 15.75L16.4902 19.5M20.2402 15.75H3.74023V4.49902" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.75 7.97222L6.75 13.75L15.75 0.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  checkWhite: `<svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.75 7.97222L6.75 13.75L15.75 0.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  checkCircle: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 10.625L9.375 12.5L12.5 8.125M17.5 10C17.5 10.9849 17.306 11.9602 16.9291 12.8701C16.5522 13.7801 15.9997 14.6069 15.3033 15.3033C14.6069 15.9997 13.7801 16.5522 12.8701 16.9291C11.9602 17.306 10.9849 17.5 10 17.5C9.01509 17.5 8.03982 17.306 7.12987 16.9291C6.21993 16.5522 5.39314 15.9997 4.6967 15.3033C4.00026 14.6069 3.44781 13.7801 3.0709 12.8701C2.69399 11.9602 2.5 10.9849 2.5 10C2.5 8.01088 3.29018 6.10322 4.6967 4.6967C6.10322 3.29018 8.01088 2.5 10 2.5C11.9891 2.5 13.8968 3.29018 15.3033 4.6967C16.7098 6.10322 17.5 8.01088 17.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  logOut: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#FF3838" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17L21 12L16 7" stroke="#FF3838" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke="#FF3838" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const figmaIconNames = [
  "Navigation_home_stroke",
  "Navigation_home_fill",
  "Navigation_Alumni_search_stroke",
  "Navigation_Alumni_search_fill",
  "Navigation_coffee_chat_stroke",
  "Navigation_coffee_chat_fill",
  "Navigation_coffee_chat_fill_alert",
  "Navigation_coffee_chat_stroke_alert",
  "Navigation_activities_stroke",
  "Navigation_activities_fill",
  "Navigation_mypage_stroke",
  "Navigation_mypage_fill",
  "Navigation_approve_stroke",
  "Navigation_approve_fill",
  "Navigation_report_stroke",
  "Navigation_report_fill",
  "Navigation_activities_write_stroke",
  "Navigation_activities_write_fill",
  "Navigation_community_stroke",
  "Navigation_community_fill",
  "Frame",
  "remove",
  "arrow_left",
  "arrow_right",
  "folder",
  "arrow_down",
  "image",
  "link",
  "search",
    "expand_more",
  "report",
  "add",
  "camera",
  "x",
  "trash",
  "download",
  "menu",
  "more_menu",
  "filter",
  "thumbs_up_stroke",
  "thumbs_up_fill",
  "writing",
  "account",
  "comment_edit",
  "favorites_stroke",
  "favorites_fill",
  "visible",
  "bookmark_stroke",
  "bookmark_fill",
  "comment",
  "coffeechat_request_basic",
  "visible_off",
  "written_post",
  "settings",
  "send",
  "bell_notification",
] as const;

type FigmaIconName = (typeof figmaIconNames)[number];
type LegacyIconName = keyof typeof legacyIconMap;
export type IconName = FigmaIconName | LegacyIconName;

const figmaIconMap = Object.fromEntries(
  figmaIconNames.map((name) => [name, getFigmaSvg(name)])
) as Record<FigmaIconName, string>;

export const iconMap: Record<IconName, string> = {
  ...legacyIconMap,
  ...figmaIconMap,
} as Record<IconName, string>;

export const ICON_NAMES = Object.keys(iconMap) as IconName[];
export const defaultBlackIconMap: Partial<Record<IconName, true>> = {
  arrow_left: true,
  search: true,
};

//활성/비활성 아이콘 쌍이 있으면, activeIconMap에 연결합니다.
export const activeIconMap: Partial<Record<IconName, IconName>> = {
  Navigation_home_stroke: "Navigation_home_fill",
  Navigation_Alumni_search_stroke: "Navigation_Alumni_search_fill",
  Navigation_coffee_chat_stroke: "Navigation_coffee_chat_fill",
  Navigation_coffee_chat_stroke_alert: "Navigation_coffee_chat_fill_alert",
  Navigation_activities_stroke: "Navigation_activities_fill",
  Navigation_mypage_stroke: "Navigation_mypage_fill",
  Navigation_approve_stroke: "Navigation_approve_fill",
  Navigation_report_stroke: "Navigation_report_fill",
  Navigation_activities_write_stroke: "Navigation_activities_write_fill",
  Navigation_community_stroke: "Navigation_community_fill",
  thumbs_up_stroke: "thumbs_up_fill",
  favorites_stroke: "favorites_fill",
  bookmark_stroke: "bookmark_fill",
};

export const inactiveIconMap = Object.fromEntries(
  Object.entries(activeIconMap).map(([inactive, active]) => [active, inactive])
) as Partial<Record<IconName, IconName>>;

// Icon 폴더 내부의 public API입니다.
// 실제 React 컴포넌트는 Icon.tsx, 아이콘 이름 목록과 SVG 매핑은 iconMap.ts가 담당합니다.
// 이 파일은 폴더 밖에서 내부 파일명을 직접 참조하지 않도록 default export, ICON_NAMES, 타입을 한곳에서 다시 내보냅니다.
export { default } from "./Icon";
export { ICON_NAMES } from "./iconMap";
export type { IconName, IconProps } from "./Icon";

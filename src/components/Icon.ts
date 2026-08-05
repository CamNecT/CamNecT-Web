// src/components/Icon 폴더를 컴포넌트 외부에 공개하는 최상위 진입점입니다.
// 다른 파일에서는 내부 구조를 몰라도 `import Icon from "../components/Icon"`처럼 가져올 수 있습니다.
// 실제 구현과 타입 export는 폴더 내부의 index.ts에 위임합니다.
export { default, ICON_NAMES } from "./Icon/index";
export type { IconName, IconProps } from "./Icon/index";

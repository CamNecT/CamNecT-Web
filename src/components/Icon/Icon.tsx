import type { CSSProperties, MouseEvent } from "react";
import {
  activeIconMap,
  defaultBlackIconMap,
  iconMap,
  inactiveIconMap,
  type IconName,
} from "./iconMap";

type IconSize = number | string;

type IconProps = {
  name: IconName;
  active?: boolean;
  color?: string;
  size?: IconSize;
  width?: IconSize;
  height?: IconSize;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

// 새 아이콘은 src/components/Icon/svg/{name}.svg로 추가한 뒤 iconMap.ts의 figmaIconNames에 등록해서
// <Icon name="{name}" size={24} /> 형태로 사용합니다. stroke/fill 쌍은 activeIconMap에 연결하면 active prop으로 전환됩니다.
const toCssSize = (value?: IconSize) =>
  value === undefined ? undefined : typeof value === "number" ? `${value}px` : value;

const resolveIconName = (name: IconName, active?: boolean) => {
  if (active === true) {
    return activeIconMap[name] ?? name;
  }

  if (active === false) {
    return inactiveIconMap[name] ?? name;
  }

  return name;
};

const getDefaultColor = (name: IconName, active?: boolean) => {
  if (name === "logOut") {
    return "";
  }

  if (defaultBlackIconMap[name]) {
    return "text-black";
  }

  if (active || name.endsWith("_fill")) {
    return "text-[var(--ColorMain,#00C56C)]";
  }

  return "text-[var(--ColorGray2,#A1A1A1)]";
};

const Icon = ({
  name,
  active,
  color,
  size,
  width,
  height,
  className = "",
  style,
  onClick,
}: IconProps) => {
  const resolvedName = resolveIconName(name, active);
  const svg = iconMap[resolvedName];
  const defaultColorClass = color ? "" : getDefaultColor(resolvedName, active);

  if (!svg) {
    return null;
  }

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    if (!onClick) {
      return;
    }

    event.stopPropagation();
    onClick();
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full ${
        onClick ? "cursor-pointer active:scale-95 active:brightness-95 transition" : ""
      } ${defaultColorClass} ${className}`}
      style={{
        width: toCssSize(width ?? size),
        height: toCssSize(height ?? size),
        color,
        ...style,
      }}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export type { IconName, IconProps };
export default Icon;

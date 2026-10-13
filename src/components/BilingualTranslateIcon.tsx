import type React from "react";

interface BilingualTranslateIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

/**
 * Custom bilingual Translate / Language icon representing Hindi ("हि") on top
 * and English ("A" / Latin) on the bottom, replacing the default Chinese/Latin icon.
 */
export default function BilingualTranslateIcon({
  className,
  style,
  size = 18,
}: BilingualTranslateIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Hindi "हि" glyph on top-left */}
      <text
        x="0.5"
        y="11.5"
        fontSize="12"
        fontWeight="700"
        fontFamily="'Noto Sans Devanagari', 'Nirmala UI', sans-serif"
        fill="currentColor"
        stroke="none"
        letterSpacing="-0.5px"
      >
        हि
      </text>

      {/* English "A" glyph on bottom-right (matching Lucide stroke-weight and geometry) */}
      <path
        d="M22 22 L17 10 L12 22"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 18.2 H20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/699f775333a30acfe3b73c4e/a189521e3_DynamicBlueSwooshwithCohesiveTypography9.jpg";

/**
 * AppLogo — renders the BwanguSpares logo with:
 *  - transparent background (mix-blend-mode)
 *  - dark mode: invert filter to show white swoosh on dark bg
 *  - optional pulse animation
 */
export default function AppLogo({ size = 40, animate = false, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="BwanguSpares"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        objectFit: "cover",
        mixBlendMode: "multiply",        // removes white bg in light mode
        animation: animate ? "logo-pulse 2s ease-in-out infinite" : undefined,
      }}
      className={`dark:invert dark:mix-blend-normal ${className}`}
    />
  );
}
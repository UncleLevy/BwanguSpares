import React, { useEffect, useRef } from "react";

export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const state = useRef({
    x: 0,
    y: 0,
    ringX: 0,
    ringY: 0,
    isHovering: false,
    isClicking: false,
    isVisible: true,
  });
  const raf = useRef(null);

  useEffect(() => {
    // Skip on touch devices or inside dashboards
    if (window.matchMedia("(pointer: coarse)").matches) return;
    // Hide native cursor everywhere on desktop
    document.documentElement.style.cursor = "none";

    const handleMouseMove = (e) => {
      state.current.x = e.clientX;
      state.current.y = e.clientY;
      state.current.isVisible = true;
    };

    const handleMouseDown = () => {
      state.current.isClicking = true;
    };

    const handleMouseUp = () => {
      state.current.isClicking = false;
    };

    const handleMouseEnter = (e) => {
      const target = e.target.closest(
        "a, button, [role='button'], [role='tab'], [role='option'], [role='menuitem'], [role='combobox'], input, textarea, select, label"
      );
      state.current.isHovering = !!target;
    };

    const handleMouseLeave = (e) => {
      // Only hide cursor when leaving the window entirely, not when entering portals
      if (!e.relatedTarget) {
        state.current.isHovering = false;
        state.current.isVisible = false;
      }
    };

    const animate = () => {
      // Smooth ring following with easing
      const dx = state.current.x - state.current.ringX;
      const dy = state.current.y - state.current.ringY;
      state.current.ringX += dx * 0.25;
      state.current.ringY += dy * 0.25;

      if (ringRef.current) {
        const scale = state.current.isClicking ? 0.85 : state.current.isHovering ? 1.3 : 1;
        ringRef.current.style.transform = `translate(${state.current.ringX - 20}px, ${state.current.ringY - 20}px) scale(${scale})`;
        ringRef.current.style.opacity = state.current.isVisible ? "1" : "0";
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${state.current.x - 5}px, ${state.current.y - 5}px)`;
        dotRef.current.style.opacity = state.current.isVisible ? "1" : "0";
      }

      raf.current = requestAnimationFrame(animate);
    };

    const handleBlur = () => { state.current.isVisible = false; };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleMouseEnter, true);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleBlur);

    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleMouseEnter, true);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleBlur);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Outer ring - sleeker minimalist design */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none hidden md:block transition-opacity duration-200"
        style={{
          willChange: "transform, opacity",
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "1.5px solid rgba(6, 182, 212, 0.6)",
            background: "rgba(6, 182, 212, 0.02)",
            boxShadow: "inset 0 0 12px rgba(6, 182, 212, 0.08)",
            transition: "border-color 0.2s ease-out, box-shadow 0.2s ease-out",
          }}
        />
      </div>

      {/* Inner dot - sharp and responsive */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none hidden md:block transition-opacity duration-150"
        style={{
          willChange: "transform, opacity",
          width: 10,
          height: 10,
          borderRadius: "50%",
          marginLeft: -5,
          marginTop: -5,
          background: "rgba(6, 182, 212, 1)",
          boxShadow:
            "0 0 8px rgba(6, 182, 212, 0.8), 0 0 16px rgba(6, 182, 212, 0.4)",
        }}
      />
    </>
  );
}
import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const dot = useRef({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const raf = useRef(null);

  useEffect(() => {
    // Only on desktop
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseDown = () => setClicking(true);
    const onMouseUp = () => setClicking(false);

    const onMouseOver = (e) => {
      const el = e.target.closest("a, button, [role='button'], [role='tab'], input, textarea, select");
      setHovering(!!el);
    };

    const animate = () => {
      // Smooth outer ring lags behind
      dot.current.x += (pos.current.x - dot.current.x) * 0.12;
      dot.current.y += (pos.current.y - dot.current.y) * 0.12;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${dot.current.x - 20}px, ${dot.current.y - 20}px)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onMouseOver);
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onMouseOver);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // Don't render on touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <>
      {/* Outer ring */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none hidden md:block"
        style={{ willChange: "transform" }}
      >
        <div
          className="transition-all duration-150"
          style={{
            width: hovering ? 48 : clicking ? 28 : 40,
            height: hovering ? 48 : clicking ? 28 : 40,
            borderRadius: "50%",
            border: `2px solid ${hovering ? "rgba(6,182,212,0.8)" : "rgba(6,182,212,0.5)"}`,
            background: hovering ? "rgba(6,182,212,0.08)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: hovering ? "blur(2px)" : "none",
          }}
        >
          {/* Gear icon inside cursor when hovering */}
          {hovering && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(6,182,212,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          )}
        </div>
      </div>

      {/* Inner dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none hidden md:block"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: clicking ? "rgba(6,182,212,1)" : "rgba(6,182,212,0.9)",
          boxShadow: "0 0 6px rgba(6,182,212,0.6)",
          willChange: "transform",
          transition: "width 0.1s, height 0.1s, background 0.1s",
        }}
      />

      {/* Hide native cursor on desktop */}
      <style>{`
        @media (pointer: fine) {
          * { cursor: none !important; }
        }
      `}</style>
    </>
  );
}
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

/**
 * Mobile-only sticky top bar.
 * - Left:  back chevron (browser history or explicit backTo target)
 * - Center: page title (truncated)
 * - Right:  optional slot for action buttons (passed as `actions` prop)
 */
export default function AppHeader({ title, backTo, actions, className }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (backTo) {
      navigate(createPageUrl(backTo));
    } else {
      navigate(createPageUrl("Home"));
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
        "border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40 md:hidden",
        className
      )}
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 6px)",
        paddingBottom: "6px",
        paddingLeft: "max(8px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(8px, env(safe-area-inset-right, 0px))",
        minHeight: 52,
      }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                   text-slate-600 dark:text-slate-300
                   active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Title */}
      {title ? (
        <h1 className="flex-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate text-center px-2">
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}

      {/* Actions slot — pass JSX via `actions` prop */}
      <div className="flex-shrink-0 flex items-center gap-1 min-w-[40px] justify-end">
        {actions || null}
      </div>
    </div>
  );
}
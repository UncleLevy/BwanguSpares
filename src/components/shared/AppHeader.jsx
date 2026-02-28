import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

/**
 * AppHeader — unified native-style header for child screens.
 *
 * Props:
 *  title      - Page/section title
 *  backTo     - Page name to navigate back to (e.g. "BrowseProducts"). Falls back to history.
 *  action     - Optional React node rendered on the right side
 *  className  - Extra classes
 *  hideOnDesktop - If true (default), only renders on mobile (md:hidden). Pass false to show everywhere.
 */
export default function AppHeader({ title, backTo, action, className, hideOnDesktop = true }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(createPageUrl(backTo));
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40",
        hideOnDesktop ? "md:hidden" : "",
        className
      )}
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all shrink-0"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4 text-slate-700" />
      </button>
      <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex-1 truncate">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

/**
 * AppHeader — unified header shown inside dashboard/content pages on mobile.
 * Auto-shows a back button when `backTo` is provided or when there's history.
 *
 * Props:
 *  title      - Page/section title
 *  backTo     - Page name to navigate back to (e.g. "Home"). If omitted, uses browser history.
 *  action     - Optional React node rendered on the right side
 *  className  - Extra classes on the header element
 */
export default function AppHeader({ title, backTo, action, className }) {
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
        "flex items-center gap-3 py-3 px-1 mb-4",
        className
      )}
    >
      {(backTo !== undefined || window.history.length > 1) && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>
      )}
      <h1 className="text-xl font-bold text-slate-900 flex-1 truncate">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
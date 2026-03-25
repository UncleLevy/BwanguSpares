import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

/**
 * Mobile-only sticky header with:
 *  - Back button (uses browser history, or falls back to `backTo` page, then Home)
 *  - Optional page title
 *  - Home shortcut icon (always visible so users are never stranded)
 *  - Safe-area-inset-top padding for notched devices
 */
export default function AppHeader({ title, backTo }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // If we have real history to go back to, use it
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
      className="flex items-center gap-2 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40 md:hidden"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
        paddingBottom: "8px",
        paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        minHeight: 56,
      }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Title */}
      {title && (
        <h1 className="flex-1 text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
          {title}
        </h1>
      )}
      {!title && <div className="flex-1" />}

      {/* Home shortcut — always shown so users can escape any screen */}
      <Link
        to={createPageUrl("Home")}
        aria-label="Go to Home"
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
    </div>
  );
}
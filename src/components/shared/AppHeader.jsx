import React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNav } from "@/lib/navigationContext";

/**
 * AppHeader — unified native-style header for child screens.
 *
 * Props:
 *  title         - Page/section title (string or node)
 *  backTo        - Page name to fall back to if the stack is empty (e.g. "BrowseProducts")
 *  action        - Optional React node rendered on the right side
 *  className     - Extra wrapper classes
 *  hideOnDesktop - If true (default), only renders on mobile (md:hidden)
 */
export default function AppHeader({ title, backTo, action, className, hideOnDesktop = true }) {
  const { pop } = useNav();

  return (
    <div
      role="banner"
      className={cn(
        "flex items-center gap-2 px-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40",
        hideOnDesktop ? "md:hidden" : "",
        className
      )}
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
        paddingBottom: "10px",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 4px)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 8px)",
      }}
    >
      <button
        onClick={() => pop(backTo)}
        aria-label="Go back"
        className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 active:opacity-60 transition-opacity shrink-0"
        style={{ minWidth: 44, minHeight: 44, paddingLeft: 4 }}
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-sm font-medium leading-none hidden xs:block">Back</span>
      </button>

      <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex-1 text-center truncate px-2">
        {title}
      </h1>

      {/* Keep right side balanced whether action exists or not */}
      <div className="shrink-0" style={{ minWidth: 44 }}>
        {action}
      </div>
    </div>
  );
}
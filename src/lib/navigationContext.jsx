/**
 * navigationContext.jsx
 *
 * Provides a React context for iOS-style independent per-tab navigation stacks.
 * Each root tab owns its own history stack. Pushing a route records it under the
 * active tab; going back pops from that tab's stack instead of the browser stack.
 *
 * Also tracks the last navigation direction ("forward" | "back") so animated
 * transitions can mirror native iOS push/pop physics.
 */

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── Tab roots — same as BottomNav tab pages ────────────────────────────────
export const TAB_ROOTS = ["Home", "BrowseProducts", "FindNearby", "Cart", "BuyerDashboard", "ShopDashboard", "AdminDashboard"];

// Module-level stacks (survive re-renders and context re-mounts)
const tabStacks = {};
TAB_ROOTS.forEach(t => { tabStacks[t] = [createPageUrl(t)]; });

// Derive which tab "owns" a given pathname
export function ownerTabFor(pathname) {
  return TAB_ROOTS.find(t => {
    const root = createPageUrl(t);
    return pathname === root || pathname.startsWith(root + "?") || pathname.startsWith(root + "/");
  }) ?? null;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const NavContext = createContext(null);

export function NavProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [direction, setDirection] = useState("forward"); // "forward" | "back"
  const prevPathRef = useRef(location.pathname + location.search);

  /** Push a full URL into the correct tab stack and navigate forward. */
  const push = useCallback((url) => {
    const tab = ownerTabFor(new URL(url, window.location.origin).pathname);
    if (tab) {
      const stack = tabStacks[tab];
      if (stack[stack.length - 1] !== url) stack.push(url);
    }
    setDirection("forward");
    navigate(url);
  }, [navigate]);

  /**
   * Pop the current tab's stack.
   * Falls back to tab root → Home if stack is empty.
   */
  const pop = useCallback((fallbackPage) => {
    const tab = ownerTabFor(location.pathname);
    if (tab && tabStacks[tab].length > 1) {
      tabStacks[tab].pop(); // remove current
      const prev = tabStacks[tab][tabStacks[tab].length - 1];
      setDirection("back");
      navigate(prev, { replace: true });
      return;
    }
    // No stack history — use explicit fallback or go to tab root / Home
    setDirection("back");
    if (fallbackPage) {
      navigate(createPageUrl(fallbackPage), { replace: true });
    } else if (tab) {
      navigate(createPageUrl(tab), { replace: true });
    } else {
      navigate(createPageUrl("Home"), { replace: true });
    }
  }, [navigate, location.pathname]);

  /**
   * Switch to a tab. If already on that tab, scroll to top (reset stack).
   * Otherwise restore the last known position on that tab.
   */
  const switchTab = useCallback((tabPage) => {
    const tabRoot = createPageUrl(tabPage);
    const stack = tabStacks[tabPage];
    const currentTabRoot = createPageUrl(ownerTabFor(location.pathname) ?? "");
    const alreadyOnTab = location.pathname === tabRoot ||
      location.pathname.startsWith(tabRoot + "?") ||
      location.pathname.startsWith(tabRoot + "/");

    if (alreadyOnTab) {
      // Double-tap: reset to root
      tabStacks[tabPage] = [tabRoot];
      setDirection("back");
      navigate(tabRoot, { replace: true });
    } else {
      const dest = stack && stack.length > 0 ? stack[stack.length - 1] : tabRoot;
      setDirection("forward");
      navigate(dest);
    }
  }, [navigate, location.pathname]);

  /** Record a navigation that happened outside this context (e.g. <Link>). */
  const recordNavigation = useCallback((pathname, search = "") => {
    const url = pathname + search;
    const tab = ownerTabFor(pathname);
    if (!tab) return;
    const stack = tabStacks[tab];
    if (stack[stack.length - 1] !== url) stack.push(url);
  }, []);

  const value = {
    direction,
    push,
    pop,
    switchTab,
    recordNavigation,
    tabStacks,
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside <NavProvider>");
  return ctx;
}
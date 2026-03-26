import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Try localStorage first, fallback to sessionStorage for APK
    try {
      const saved = localStorage.getItem("darkMode") || sessionStorage.getItem("darkMode");
      if (saved !== null) return saved === "true";
    } catch (e) {}
    // Fallback to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Apply dark mode on mount
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    // Try localStorage, fallback to sessionStorage for APK
    try {
      localStorage.setItem("darkMode", String(newMode));
    } catch (e) {
      sessionStorage.setItem("darkMode", String(newMode));
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
}
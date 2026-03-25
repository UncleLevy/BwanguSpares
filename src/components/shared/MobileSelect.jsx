import React, { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * MobileSelect — always renders a bottom-sheet drawer on touch/mobile (<768px)
 * and a standard Shadcn Select on desktop.
 *
 * Props mirror a simplified <Select>:
 *   value, onValueChange, options: [{value, label}], placeholder, className, triggerClassName
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function MobileSelect({
  value,
  onValueChange,
  options = [],
  placeholder = "Select",
  triggerClassName,
  className,
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selectedLabel = options.find((o) => o.value === value)?.label;

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center justify-between w-full min-h-[44px] px-3 rounded-xl border border-input bg-background text-sm text-left",
            triggerClassName,
            className
          )}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
        </button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-1 max-h-[60vh] overflow-y-auto">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 min-h-[52px] rounded-xl text-sm text-left transition-colors",
                    value === opt.value
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: standard Shadcn Select
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-11 rounded-xl", triggerClassName, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
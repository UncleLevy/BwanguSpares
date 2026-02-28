import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * MobileSelect — renders a native bottom-sheet drawer on mobile (<md)
 * and a standard Shadcn Select on desktop.
 *
 * Props mirror a simplified <Select>:
 *   value, onValueChange, options: [{value, label}], placeholder, className, triggerClassName
 */
export default function MobileSelect({ value, onValueChange, options = [], placeholder = "Select", triggerClassName }) {
  const [open, setOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const selectedLabel = options.find(o => o.value === value)?.label;

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center justify-between w-full h-11 px-3 rounded-xl border border-input bg-background text-sm text-left",
            triggerClassName
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
            <div className="px-4 pb-6 space-y-1 max-h-[60vh] overflow-y-auto">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onValueChange(opt.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-colors",
                    value === opt.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                  {value === opt.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: standard Select
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-11 rounded-xl", triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
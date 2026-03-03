import React from "react";
import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

/**
 * A sortable table header cell.
 * Props:
 *  - field: string key to sort by
 *  - sort: { field, dir } current sort state
 *  - onSort: (field) => void
 *  - children: label
 */
export default function SortableTableHead({ field, sort, onSort, children, className = "" }) {
  const isActive = sort?.field === field;
  const dir = isActive ? sort.dir : null;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {isActive ? (
          dir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />
        )}
      </span>
    </TableHead>
  );
}

/**
 * Helper: toggle sort field/direction.
 * Usage: setSort(prev => toggleSort(prev, field))
 */
export function toggleSort(current, field) {
  if (current?.field === field) {
    return { field, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { field, dir: "asc" };
}

/**
 * Helper: sort an array by a sort state.
 * Usage: sortData(rows, sort)
 */
export function sortData(data, sort) {
  if (!sort?.field) return data;
  return [...data].sort((a, b) => {
    let av = a[sort.field]; let bv = b[sort.field];
    if (av == null) av = ""; if (bv == null) bv = "";
    // numeric
    if (typeof av === "number" && typeof bv === "number") {
      return sort.dir === "asc" ? av - bv : bv - av;
    }
    // date strings
    const da = Date.parse(av); const db = Date.parse(bv);
    if (!isNaN(da) && !isNaN(db)) {
      return sort.dir === "asc" ? da - db : db - da;
    }
    // string
    const cmp = String(av).localeCompare(String(bv));
    return sort.dir === "asc" ? cmp : -cmp;
  });
}
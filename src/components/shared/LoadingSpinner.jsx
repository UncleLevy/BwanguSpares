import React from "react";
import { Package } from "lucide-react";

export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizeMap = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Package className={`${sizeMap[size]} text-blue-600 animate-spin`} />
    </div>
  );
}
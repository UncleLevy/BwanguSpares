import React from "react";

export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-3 h-3 border-1.5",
    md: "w-4 h-4 border-2",
    lg: "w-6 h-6 border-2",
  };

  return (
    <div className={`${sizeClasses[size]} border-white border-t-transparent rounded-full animate-spin ${className}`} />
  );
}
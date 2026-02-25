import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
          <Package className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="text-lg text-slate-500 mt-2">Page not found</p>
        <p className="text-sm text-slate-400 mt-1">The page you're looking for doesn't exist or has been moved.</p>
        <Link to={createPageUrl("Home")}>
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
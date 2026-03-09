import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Car, X } from "lucide-react";

export default function VehicleFilterSidebar({ vehicleFilter, onFilterChange }) {
  const [allVehicles, setAllVehicles] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(vehicleFilter.vehicle_brand || "");
  const [selectedModel, setSelectedModel] = useState(vehicleFilter.vehicle_model || "");
  const [selectedYear, setSelectedYear] = useState(vehicleFilter.vehicle_year ? String(vehicleFilter.vehicle_year) : "");

  useEffect(() => {
    base44.entities.Vehicle.filter({ status: "active" }, "brand", 500).then(setAllVehicles);
  }, []);

  const brands = useMemo(() => [...new Set(allVehicles.map(v => v.brand))].sort(), [allVehicles]);

  const models = useMemo(() => {
    if (!selectedBrand) return [];
    return [...new Set(allVehicles.filter(v => v.brand === selectedBrand).map(v => v.model))].sort();
  }, [allVehicles, selectedBrand]);

  const years = useMemo(() => {
    if (!selectedModel || !selectedBrand) return [];
    const match = allVehicles.find(v => v.brand === selectedBrand && v.model === selectedModel);
    return (match?.years || []).slice().sort((a, b) => b - a);
  }, [allVehicles, selectedBrand, selectedModel]);

  const handleBrandChange = (val) => {
    setSelectedBrand(val);
    setSelectedModel("");
    setSelectedYear("");
    onFilterChange({ vehicle_brand: val || null, vehicle_model: null, vehicle_year: null });
  };

  const handleModelChange = (val) => {
    setSelectedModel(val);
    setSelectedYear("");
    onFilterChange({ vehicle_brand: selectedBrand, vehicle_model: val || null, vehicle_year: null });
  };

  const handleYearChange = (val) => {
    setSelectedYear(val);
    onFilterChange({ vehicle_brand: selectedBrand, vehicle_model: selectedModel, vehicle_year: val ? parseInt(val) : null });
  };

  const handleReset = () => {
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    onFilterChange({ vehicle_brand: null, vehicle_model: null, vehicle_year: null });
  };

  const isActive = !!selectedBrand;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-700"}`}>
            <Car className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">My Vehicle</span>
        </div>
        {isActive && (
          <button onClick={handleReset} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isActive && (
        <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-2">
          Showing parts compatible with your vehicle
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Brand</label>
          <Select value={selectedBrand} onValueChange={handleBrandChange}>
            <SelectTrigger className="mt-1.5 h-9 text-sm">
              <SelectValue placeholder="Select brand..." />
            </SelectTrigger>
            <SelectContent>
              {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Model</label>
          <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedBrand}>
            <SelectTrigger className="mt-1.5 h-9 text-sm disabled:opacity-50">
              <SelectValue placeholder={selectedBrand ? "Select model..." : "Select brand first"} />
            </SelectTrigger>
            <SelectContent>
              {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Year <span className="normal-case font-normal">(optional)</span></label>
          <Select value={selectedYear} onValueChange={handleYearChange} disabled={!selectedModel}>
            <SelectTrigger className="mt-1.5 h-9 text-sm disabled:opacity-50">
              <SelectValue placeholder={selectedModel ? "Any year" : "Select model first"} />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isActive && (
        <Button variant="outline" size="sm" onClick={handleReset} className="w-full text-xs">
          Clear Vehicle Filter
        </Button>
      )}
    </div>
  );
}
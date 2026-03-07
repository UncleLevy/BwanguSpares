import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function VehicleFilterPanel({ onFilterChange, onClose }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);

  // Load vehicles on mount
  useEffect(() => {
    (async () => {
      const vehs = await base44.entities.Vehicle.filter({ status: "active" }, "brand", 100);
      // Get unique brands
      const uniqueBrands = [...new Set(vehs.map(v => v.brand))];
      setVehicles(uniqueBrands);
    })();
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setSelectedModel("");
      return;
    }
    (async () => {
      const vehs = await base44.entities.Vehicle.filter({ brand: selectedBrand, status: "active" });
      const uniqueModels = [...new Set(vehs.map(v => v.model))];
      setModels(uniqueModels);
      setSelectedModel("");
      setYears([]);
      setSelectedYear("");
    })();
  }, [selectedBrand]);

  // Load years when model changes
  useEffect(() => {
    if (!selectedModel || !selectedBrand) {
      setYears([]);
      setSelectedYear("");
      return;
    }
    (async () => {
      const vehs = await base44.entities.Vehicle.filter({
        brand: selectedBrand,
        model: selectedModel,
        status: "active"
      });
      if (vehs.length > 0) {
        const allYears = vehs[0].years || [];
        setYears(allYears.sort((a, b) => b - a));
      }
      setSelectedYear("");
    })();
  }, [selectedModel, selectedBrand]);

  const handleApply = () => {
    onFilterChange({
      vehicle_brand: selectedBrand,
      vehicle_model: selectedModel,
      vehicle_year: selectedYear ? parseInt(selectedYear) : null
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    onFilterChange({
      vehicle_brand: null,
      vehicle_model: null,
      vehicle_year: null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 space-y-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Filter by Vehicle</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand</label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select brand..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBrand && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedModel && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select year (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Apply Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
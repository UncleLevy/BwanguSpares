import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/shared/MobileSelect";
import { Input } from "@/components/ui/input";

export default function AddressInput({ 
  value = { region: "", town: "", address: "" }, 
  onChange,
  errors = {}
}) {
  const [regions, setRegions] = useState([]);
  const [towns, setTowns] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingTowns, setLoadingTowns] = useState(false);

  // Load regions on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Region.list();
        setRegions(r);
      } catch (e) {
        console.error("Failed to load regions:", e);
      } finally {
        setLoadingRegions(false);
      }
    })();
  }, []);

  // Load towns when region changes
  useEffect(() => {
    if (!value.region) {
      setTowns([]);
      return;
    }

    setLoadingTowns(true);
    (async () => {
      try {
        const t = await base44.entities.Town.filter({ region_id: value.region });
        setTowns(t || []);
      } catch (e) {
        console.error("Failed to load towns:", e);
        setTowns([]);
      } finally {
        setLoadingTowns(false);
      }
    })();
  }, [value.region]);

  const handleRegionChange = (regionId) => {
    onChange({ ...value, region: regionId, town: "" });
  };

  const handleTownChange = (townName) => {
    onChange({ ...value, town: townName });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Region *</Label>
        <MobileSelect
          value={value.region || ""}
          onValueChange={handleRegionChange}
          placeholder={loadingRegions ? "Loading regions..." : "Select region"}
          triggerClassName="mt-1 w-full rounded-xl"
          options={regions.map(r => ({ value: r.id, label: r.name }))}
        />
        {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
      </div>

      <div>
        <Label>Town *</Label>
        <MobileSelect
          value={value.town || ""}
          onValueChange={handleTownChange}
          placeholder={loadingTowns ? "Loading towns..." : !value.region ? "Select region first" : "Select town"}
          triggerClassName="mt-1 w-full rounded-xl"
          options={towns.map(t => ({ value: t.name, label: t.name }))}
        />
        {errors.town && <p className="text-xs text-red-500 mt-1">{errors.town}</p>}
      </div>

      <div>
        <Label>Detailed Address</Label>
        <Input 
          value={value.address || ""} 
          onChange={(e) => onChange({ ...value, address: e.target.value })} 
          placeholder="Street address, apartment, etc." 
          className="mt-1 rounded-xl"
        />
        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
      </div>
    </div>
  );
}
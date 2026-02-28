import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AddressInput({ 
  value = { region: "", town: "", address: "" }, 
  onChange,
  errors = {}
}) {
  const [regions, setRegions] = useState([]);
  const [towns, setTowns] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

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

  useEffect(() => {
    if (value.region) {
      (async () => {
        try {
          const t = await base44.entities.Town.filter({ region_name: value.region });
          setTowns(t);
        } catch (e) {
          console.error("Failed to load towns:", e);
        }
      })();
    } else {
      setTowns([]);
    }
  }, [value.region]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Region *</Label>
        <Select value={value.region || ""} onValueChange={(v) => onChange({ ...value, region: v, town: "" })}>
          <SelectTrigger className="mt-1 rounded-xl">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
      </div>

      <div>
        <Label>Town *</Label>
        <Select value={value.town || ""} onValueChange={(v) => onChange({ ...value, town: v })} disabled={!value.region}>
          <SelectTrigger className="mt-1 rounded-xl">
            <SelectValue placeholder={value.region ? "Select town" : "Select region first"} />
          </SelectTrigger>
          <SelectContent>
            {towns.map(t => (
              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
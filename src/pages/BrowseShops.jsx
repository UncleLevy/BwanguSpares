import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, Star, Store, Navigation, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function BrowseShops() {
  const [shops, setShops] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  useEffect(() => {
    (async () => {
      const [s, r] = await Promise.all([
        base44.entities.Shop.filter({ status: "approved" }),
        base44.entities.Region.list(),
      ]);
      setShops(s);
      setRegions(r);
      setLoading(false);
    })();
  }, []);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false)
    );
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const allFilteredShops = shops
    .filter(s => {
      const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.address?.toLowerCase().includes(search.toLowerCase());
      const matchRegion = regionFilter === "all" || s.region === regionFilter;
      return matchSearch && matchRegion;
    })
    .map(s => ({
      ...s,
      distance: userLoc && s.latitude && s.longitude ? getDistance(userLoc.lat, userLoc.lng, s.latitude, s.longitude) : null
    }))
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      return 0;
    });

  const totalPages = Math.ceil(allFilteredShops.length / PAGE_SIZE);
  const filteredShops = allFilteredShops.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Shops" }]} />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Auto Parts Shops</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Verified dealers across Zambia</p>
        </div>
        <Button variant="outline" onClick={getLocation} disabled={locating}
          className="gap-2 text-sm border-blue-200 text-blue-600 hover:bg-blue-50">
          <Navigation className="w-4 h-4" />
          {locating ? "Locating..." : userLoc ? "Location found" : "Use my location"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shops..." className="pl-10 h-11 rounded-xl" />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl animate-pulse">
              <div className="h-36 bg-slate-100 dark:bg-slate-700 rounded-t-2xl" />
              <div className="p-5 space-y-3"><div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-2/3" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShops.map(shop => (

            <Link key={shop.id} to={createPageUrl("ShopProfile") + `?id=${shop.id}`}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover-lift">
              <div className="relative h-36 bg-gradient-to-br from-blue-500 to-blue-700">
                {shop.cover_url ? (
                  <img src={shop.cover_url} alt="" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="flex items-center justify-center h-full"><Store className="w-14 h-14 text-white/20" /></div>
                )}
                {(shop.slot_type === "premium" || shop.slot_type === "standard") && (
                  <Badge className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-sm text-white border-0 text-[10px] gap-1">
                    <ShieldCheck className="w-3 h-3" /> Pro
                  </Badge>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{shop.name}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {shop.region_name || "Zambia"}</span>
                  {shop.rating > 0 && (
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {shop.rating.toFixed(1)}</span>
                  )}
                </div>
                {shop.distance !== null && (
                  <Badge variant="outline" className="mt-2 text-[11px] border-blue-200 text-blue-600">
                    <Navigation className="w-3 h-3 mr-1" /> {shop.distance.toFixed(1)} km away
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <Button variant="outline" size="sm" onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }} disabled={page === 1} className="rounded-xl">
            ← Prev
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} size="sm" variant={p === page ? "default" : "outline"}
                onClick={() => { setPage(p); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="rounded-xl w-9">
                {p}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }} disabled={page === totalPages} className="rounded-xl">
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
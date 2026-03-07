import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MapPin, Navigation, Search, Store, Wrench, Clock, Star,
  Filter, X, ChevronRight, LocateFixed, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet marker icons for Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:34px;height:34px;background:#2563eb;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);font-size:14px;">🏪</div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
});

const techIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:34px;height:34px;background:#059669;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);font-size:14px;">🔧</div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
});

const userIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(239,68,68,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function travelTime(km) {
  const mins = Math.round((km / 40) * 60);
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `~${h}h ${m > 0 ? m + "m" : ""}`;
}

function FlyToUser({ userLoc }) {
  const map = useMap();
  useEffect(() => {
    if (userLoc) map.flyTo([userLoc.lat, userLoc.lng], 13, { duration: 1.2 });
  }, [userLoc]);
  return null;
}

const SPECIALIZATION_LABELS = {
  engine: "Engine", electrical: "Electrical", body_work: "Body Work",
  transmission: "Transmission", brakes: "Brakes", general: "General",
  diagnostics: "Diagnostics", ac_heating: "AC/Heating", tyres: "Tyres"
};

export default function FindNearby() {
  const [tab, setTab] = useState("shops"); // "shops" | "technicians"
  const [shops, setShops] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mapCenter, setMapCenter] = useState([-13.1339, 27.8493]); // Zambia center

  useEffect(() => {
    (async () => {
      const [s, t] = await Promise.all([
        base44.entities.Shop.filter({ status: "approved" }),
        base44.entities.Technician.list(),
      ]);
      setShops(s);
      setTechnicians(t);
      setLoading(false);
    })();
    // Auto-locate
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          setMapCenter([loc.lat, loc.lng]);
        },
        () => {}
      );
    }
  }, []);

  const locateMe = () => {
    setLocating(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setMapCenter([loc.lat, loc.lng]);
        setLocating(false);
      },
      () => { setLocating(false); setLocError(true); }
    );
  };

  // Attach shop info to technicians
  const techsWithShop = technicians.map(t => {
    const shop = shops.find(s => s.id === t.shop_id);
    return { ...t, shopData: shop };
  });

  const enrichShops = shops
    .filter(s => s.latitude && s.longitude)
    .filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.address?.toLowerCase().includes(search.toLowerCase()))
    .map(s => ({
      ...s,
      distance: userLoc ? haversine(userLoc.lat, userLoc.lng, s.latitude, s.longitude) : null,
    }))
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });

  const enrichTechs = techsWithShop
    .filter(t => t.shopData?.latitude && t.shopData?.longitude)
    .filter(t => !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.specialization?.toLowerCase().includes(search.toLowerCase()))
    .map(t => ({
      ...t,
      lat: t.shopData.latitude,
      lng: t.shopData.longitude,
      distance: userLoc ? haversine(userLoc.lat, userLoc.lng, t.shopData.latitude, t.shopData.longitude) : null,
    }))
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });

  const items = tab === "shops" ? enrichShops : enrichTechs;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-col gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === "shops" ? "Search shops..." : "Search technicians, specialization..."}
              className="pl-10 h-10 rounded-xl text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <Button
            variant={userLoc ? "default" : "outline"}
            size="sm"
            onClick={locateMe}
            disabled={locating}
            className={`gap-2 shrink-0 ${userLoc ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"}`}
          >
            <LocateFixed className="w-4 h-4" />
            <span className="hidden sm:inline">{locating ? "Locating..." : userLoc ? "Located" : "My Location"}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTab("shops"); setSelected(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "shops" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
          >
            <Store className="w-3.5 h-3.5" /> Shops ({enrichShops.length})
          </button>
          <button
            onClick={() => { setTab("technicians"); setSelected(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "technicians" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
          >
            <Wrench className="w-3.5 h-3.5" /> Technicians ({enrichTechs.length})
          </button>
          {!userLoc && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 ml-auto">
              <AlertCircle className="w-3.5 h-3.5" /> Enable location for distances
            </span>
          )}
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* List panel */}
        <div className="w-full md:w-80 lg:w-96 overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shrink-0 order-2 md:order-1" style={{ maxHeight: "40vh", minHeight: "30vh" }}>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MapPin className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-slate-500 text-sm">
                {search ? "No results found" : tab === "shops" ? "No shops with location data" : "No technicians found"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {items.map(item => (
                tab === "shops" ? (
                  <ShopCard key={item.id} shop={item} selected={selected?.id === item.id} onClick={() => setSelected(item)} />
                ) : (
                  <TechCard key={item.id} tech={item} selected={selected?.id === item.id} onClick={() => setSelected(item)} />
                )
              ))}
            </div>
          )}
        </div>

        {/* Map panel */}
        <div className="flex-1 order-1 md:order-2 overflow-hidden" style={{ minHeight: "45vh" }}>
          <MapContainer
            center={mapCenter}
            zoom={userLoc ? 13 : 7}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FlyToUser userLoc={userLoc} />

            {/* User location */}
            {userLoc && (
              <>
                <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                  <Popup>
                    <div className="text-sm font-medium text-slate-700">📍 You are here</div>
                  </Popup>
                </Marker>
                <Circle center={[userLoc.lat, userLoc.lng]} radius={500} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 1 }} />
              </>
            )}

            {/* Shop markers */}
            {tab === "shops" && enrichShops.map(shop => (
              <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={shopIcon}
                eventHandlers={{ click: () => setSelected(shop) }}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-slate-900 text-sm">{shop.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{shop.address}</p>
                    {shop.distance !== null && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-blue-600 font-medium">{shop.distance.toFixed(1)} km</span>
                        <span className="text-xs text-slate-500">{travelTime(shop.distance)}</span>
                      </div>
                    )}
                    {shop.rating > 0 && <p className="text-xs text-amber-600 mt-1">⭐ {shop.rating.toFixed(1)}</p>}
                    <a href={createPageUrl("ShopProfile") + `?id=${shop.id}`}
                      className="mt-2 block text-center text-xs bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700">
                      View Shop →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Technician markers */}
            {tab === "technicians" && enrichTechs.map(tech => (
              <Marker key={tech.id} position={[tech.lat, tech.lng]} icon={techIcon}
                eventHandlers={{ click: () => setSelected(tech) }}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-slate-900 text-sm">{tech.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{SPECIALIZATION_LABELS[tech.specialization] || tech.specialization}</p>
                    <p className="text-xs text-slate-400 mt-0.5">@ {tech.shopData?.name}</p>
                    {tech.distance !== null && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-emerald-600 font-medium">{tech.distance.toFixed(1)} km</span>
                        <span className="text-xs text-slate-500">{travelTime(tech.distance)}</span>
                      </div>
                    )}
                    {tech.hourly_rate > 0 && <p className="text-xs text-blue-600 mt-1">K{tech.hourly_rate}/hr</p>}
                    <a href={createPageUrl("ShopProfile") + `?id=${tech.shop_id}`}
                      className="mt-2 block text-center text-xs bg-emerald-600 text-white py-1 px-3 rounded-lg hover:bg-emerald-700">
                      Visit Shop →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

function ShopCard({ shop, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selected ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" : "bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}
    >
      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
        <Store className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{shop.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{shop.address || shop.region_name}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {shop.distance !== null ? (
            <>
              <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Navigation className="w-3 h-3" /> {shop.distance.toFixed(1)} km
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" /> {travelTime(shop.distance)}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400">Distance unavailable</span>
          )}
          {shop.rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {shop.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <Link to={createPageUrl("ShopProfile") + `?id=${shop.id}`} onClick={e => e.stopPropagation()}
        className="shrink-0 p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function TechCard({ tech, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selected ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700" : "bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 overflow-hidden">
        {tech.photo_url ? (
          <img src={tech.photo_url} alt={tech.name} className="w-full h-full object-cover" />
        ) : (
          <Wrench className="w-5 h-5 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{tech.name}</p>
          <Badge variant="outline" className="text-[10px] border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
            {SPECIALIZATION_LABELS[tech.specialization] || tech.specialization}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">@ {tech.shopData?.name}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {tech.distance !== null ? (
            <>
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Navigation className="w-3 h-3" /> {tech.distance.toFixed(1)} km
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" /> {travelTime(tech.distance)}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400">Distance unavailable</span>
          )}
          {tech.hourly_rate > 0 && (
            <span className="text-xs text-blue-600 font-medium">K{tech.hourly_rate}/hr</span>
          )}
        </div>
      </div>
      <Link to={createPageUrl("ShopProfile") + `?id=${tech.shop_id}`} onClick={e => e.stopPropagation()}
        className="shrink-0 p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
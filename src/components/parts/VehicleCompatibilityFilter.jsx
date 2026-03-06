import React, { useState } from "react";
import { Car, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const VEHICLES = {
  Toyota: {
    Corolla: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Hilux: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "Land Cruiser": ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "RAV4": ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Prado: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Fortuner: ["2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Camry: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Vitz: ["1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020"],
    Harrier: ["1997","1998","1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
  },
  Nissan: {
    "NP300 / Navara": ["2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "X-Trail": ["2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Tiida: ["2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018"],
    Sunny: ["1990","1991","1992","1993","1994","1995","1996","1997","1998","1999","2000","2001","2002","2003","2004","2005","2006"],
    "Patrol": ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Serena: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019"],
  },
  Mazda: {
    "Mazda 3": ["2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "Mazda 6": ["2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "BT-50": ["2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "CX-5": ["2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "Demio": ["1996","1997","1998","1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019"],
  },
  Mitsubishi: {
    "Pajero": ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "L200 / Triton": ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "Eclipse Cross": ["2017","2018","2019","2020","2021","2022","2023"],
    "Outlander": ["2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "Colt": ["2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012"],
  },
  Honda: {
    Civic: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "CR-V": ["1997","1998","1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Accord: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Fit: ["2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Pilot: ["2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
  },
  Isuzu: {
    "D-Max": ["2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "MU-X": ["2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Trooper: ["1993","1994","1995","1996","1997","1998","1999","2000","2001","2002","2003","2004","2005"],
  },
  Volkswagen: {
    Polo: ["2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Golf: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Tiguan: ["2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Amarok: ["2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
  },
  Ford: {
    Ranger: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "EcoSport": ["2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Everest: ["2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    Focus: ["1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019"],
  },
  Suzuki: {
    "Swift": ["2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "Vitara": ["1988","1989","1990","1991","1992","1993","1994","1995","1996","1997","1998","1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
    "Jimny": ["1998","1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"],
  },
};

export default function VehicleCompatibilityFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [make, setMake] = useState(value?.make || "");
  const [model, setModel] = useState(value?.model || "");
  const [year, setYear] = useState(value?.year || "");

  const makes = Object.keys(VEHICLES).sort();
  const models = make ? Object.keys(VEHICLES[make] || {}).sort() : [];
  const years = (make && model) ? (VEHICLES[make]?.[model] || []).slice().reverse() : [];

  const handleMakeChange = (m) => {
    setMake(m); setModel(""); setYear("");
    onChange({ make: m, model: "", year: "" });
  };
  const handleModelChange = (m) => {
    setModel(m); setYear("");
    onChange({ make, model: m, year: "" });
  };
  const handleYearChange = (y) => {
    setYear(y);
    onChange({ make, model, year: y });
  };

  const clear = () => {
    setMake(""); setModel(""); setYear("");
    onChange({ make: "", model: "", year: "" });
    setOpen(false);
  };

  const hasFilter = make || model || year;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all w-full md:w-auto ${
          hasFilter
            ? "bg-blue-600 text-white border-blue-600 shadow-md"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400"
        }`}
      >
        <Car className="w-4 h-4 shrink-0" />
        <span className="truncate">
          {hasFilter
            ? [make, model, year].filter(Boolean).join(" · ")
            : "Filter by Vehicle"}
        </span>
        {hasFilter
          ? <X className="w-3.5 h-3.5 ml-auto shrink-0" onClick={e => { e.stopPropagation(); clear(); }} />
          : open ? <ChevronUp className="w-3.5 h-3.5 ml-auto shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0" />
        }
      </button>

      {open && (
        <div className="mt-2 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-600" /> Find parts for your vehicle
            </p>
            {hasFilter && (
              <button onClick={clear} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Make */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Make</label>
              <select
                value={make}
                onChange={e => handleMakeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select make</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Model</label>
              <select
                value={model}
                onChange={e => handleModelChange(e.target.value)}
                disabled={!make}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select model</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Year</label>
              <select
                value={year}
                onChange={e => handleYearChange(e.target.value)}
                disabled={!model}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Any year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {make && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <Car className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Showing parts compatible with: <strong>{[make, model, year].filter(Boolean).join(" ")}</strong>
                {!model && " — select a model to narrow down further"}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
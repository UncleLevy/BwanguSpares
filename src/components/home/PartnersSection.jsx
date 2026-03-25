import React from "react";

const PARTNERS = [
  {
    name: "Toyota",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Toyota_logo_%28Red%29.svg/320px-Toyota_logo_%28Red%29.svg.png",
    url: "https://www.toyota.com",
    type: "Brand Partner",
  },
  {
    name: "Bosch",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Bosch-logo.svg/320px-Bosch-logo.svg.png",
    url: "https://www.bosch.com",
    type: "Technology Partner",
  },
  {
    name: "NGK Spark Plugs",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/NGK_Spark_Plugs_logo.svg/320px-NGK_Spark_Plugs_logo.svg.png",
    url: "https://www.ngksparkplugs.com",
    type: "Brand Partner",
  },
  {
    name: "Castrol",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/29/Castrol_logo.svg/320px-Castrol_logo.svg.png",
    url: "https://www.castrol.com",
    type: "Sponsor",
  },
  {
    name: "Bridgestone",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Bridgestone_logo.svg/320px-Bridgestone_logo.svg.png",
    url: "https://www.bridgestone.com",
    type: "Brand Partner",
  },
  {
    name: "Denso",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Denso_logo.svg/320px-Denso_logo.svg.png",
    url: "https://www.denso.com",
    type: "Technology Partner",
  },
];

export default function PartnersSection() {
  return (
    <section className="py-14 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Trusted By</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Our Partners & Sponsors</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">We collaborate with world-class brands to bring you quality parts</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PARTNERS.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-12 flex items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-10 max-w-[100px] object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  className="hidden w-16 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg items-center justify-center text-xs font-bold text-slate-500"
                >
                  {partner.name[0]}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{partner.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{partner.type}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
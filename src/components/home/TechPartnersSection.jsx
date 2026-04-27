import React from "react";

const TECH_PARTNERS = [
  {
    name: "Lenco",
    description: "Card Payments",
    url: "https://lenco.co",
    logo: "https://media.base44.com/images/public/699f775333a30acfe3b73c4e/03423413d_image.png",
    bg: "bg-white dark:bg-slate-100",
  },
  {
    name: "MTN MoMo",
    description: "Mobile Money",
    url: "https://mtn.com",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/MTN_Logo.svg/320px-MTN_Logo.svg.png",
    bg: "bg-yellow-50 dark:bg-yellow-50",
  },
  {
    name: "Airtel Money",
    description: "Mobile Payments",
    url: "https://airtel.africa",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Airtel_Africa_logo.svg/320px-Airtel_Africa_logo.svg.png",
    bg: "bg-red-50 dark:bg-red-50",
  },
  {
    name: "Zamtel",
    description: "Connectivity Partner",
    url: "https://zamtel.zm",
    logo: "https://zamtel.zm/wp-content/uploads/2020/07/zamtel-logo.png",
    bg: "bg-blue-50 dark:bg-blue-50",
  },
  {
    name: "Yango",
    description: "Delivery & Logistics",
    url: "https://yango.com",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Yango_logo.svg/320px-Yango_logo.svg.png",
    bg: "bg-white dark:bg-slate-100",
  },
  {
    name: "Base44",
    description: "Platform Infrastructure",
    url: "https://base44.com",
    logo: "https://base44.com/favicon.ico",
    bg: "bg-slate-50 dark:bg-slate-100",
  },
];

export default function TechPartnersSection() {
  return (
    <section className="py-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2">Powered By</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Technology Partners</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Best-in-class technology providers powering the BwanguSpares platform
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TECH_PARTNERS.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-cyan-200 dark:hover:border-cyan-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl ${partner.bg} flex items-center justify-center overflow-hidden shadow-sm border border-slate-100`}>
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <span style={{ display: 'none' }} className="w-12 h-12 items-center justify-center text-xl font-bold text-slate-500">
                  {partner.name.charAt(0)}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {partner.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{partner.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
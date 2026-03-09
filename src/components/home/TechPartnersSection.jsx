import React from "react";

const TECH_PARTNERS = [
  {
    name: "MoneyUnify",
    description: "Payment Gateway",
    url: "https://moneyunify.com",
    icon: "💳",
    color: "from-green-500 to-emerald-600",
  },
  {
    name: "Yango",
    description: "Delivery & Logistics",
    url: "https://yango.com",
    icon: "🚗",
    color: "from-yellow-400 to-orange-500",
  },
  {
    name: "MTN MoMo",
    description: "Mobile Money",
    url: "https://mtn.com",
    icon: "📱",
    color: "from-yellow-400 to-yellow-600",
  },
  {
    name: "Airtel Money",
    description: "Mobile Payments",
    url: "https://airtel.com",
    icon: "📲",
    color: "from-red-500 to-red-700",
  },
  {
    name: "Stripe",
    description: "Card Payments",
    url: "https://stripe.com",
    icon: "🔐",
    color: "from-indigo-500 to-purple-600",
  },
  {
    name: "Zamtel",
    description: "Connectivity Partner",
    url: "https://zamtel.zm",
    icon: "📡",
    color: "from-blue-500 to-cyan-600",
  },
];

export default function TechPartnersSection() {
  return (
    <section className="py-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${partner.color} flex items-center justify-center text-2xl shadow-md`}>
                {partner.icon}
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
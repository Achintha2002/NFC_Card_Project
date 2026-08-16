"use client";

import { motion } from "framer-motion";
import { Check, X, ShoppingCart, CheckCircle } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { useCart } from "../../../context/CartContext";

export default function PricingPage() {
  const { isLight } = useTheme();
  const { addItem, items, openCart } = useCart();

  const inCart = (id: string) => items.some((i) => i.id === id);

  return (
    <main className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        className="text-center max-w-3xl mx-auto mb-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight mb-6 transition-colors ${isLight ? "text-neutral-950" : "text-white"}`}>
          Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">pricing.</span>
        </h1>
        <p className={`text-lg transition-colors ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
          Start for free, upgrade when you need more. The physical card is a one-time purchase.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`rounded-[2rem] p-10 transition-all flex flex-col border ${
            isLight
              ? "bg-white border-neutral-200 shadow-lg shadow-neutral-100"
              : "bg-neutral-900/90 border-neutral-800 text-white shadow-md shadow-black/30"
          }`}
        >
          <div className="mb-8">
            <h3 className={`text-2xl font-bold mb-2 ${isLight ? "text-neutral-950" : "text-white"}`}>Standard Profile</h3>
            <p className="text-neutral-400 mb-6">Everything you need to network digitally.</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-extrabold ${isLight ? "text-neutral-950" : "text-white"}`}>LKR 0</span>
              <span className="text-neutral-400 font-medium">/forever</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 mb-10">
            {[
              "Unlimited taps",
              "Custom profile link",
              "Up to 5 social/contact links",
              "QR Code sharing",
              "Standard analytics (views)",
              "Basic templates"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-rose-500 shrink-0" />
                <span className={isLight ? "text-neutral-600" : "text-neutral-300"}>{feature}</span>
              </div>
            ))}
            {[
              "Personal Portfolio Website",
              "Custom domain (coming soon)",
              "CRM integrations",
              "Lead capture forms"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 opacity-40">
                <X className="w-5 h-5 text-neutral-400 shrink-0" />
                <span className="text-neutral-400">{feature}</span>
              </div>
            ))}
          </div>

          {inCart("plan-standard") ? (
            <button
              onClick={openCart}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                isLight
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Added to Cart · View Cart
            </button>
          ) : (
            <button
              onClick={() => addItem({
                id: "plan-standard",
                name: "Standard Profile",
                price: "LKR 0 / forever",
                priceNum: 0,
                type: "plan",
                badge: "FREE",
              })}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                isLight
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "bg-white/10 text-rose-400 hover:bg-white/15"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Get Started Free
            </button>
          )}
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className={`rounded-[2rem] p-10 relative flex flex-col overflow-hidden transition-all border ${
            isLight
              ? "bg-neutral-950 text-white border-neutral-800 shadow-xl shadow-neutral-300/40"
              : "bg-neutral-900/95 text-white border-rose-500/30 shadow-lg shadow-black/40"
          }`}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px]" />

          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-orange-400 text-white px-6 py-1.5 rounded-b-xl text-xs font-bold uppercase tracking-widest shadow-md">
            Recommended for Professionals
          </div>

          <div className="mb-8 mt-4 relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2">TAGIT Pro</h3>
            <p className="text-neutral-400 mb-6">Advanced features for serious networkers.</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-white">LKR 1,490</span>
              <span className="text-neutral-400 font-medium">/month</span>
            </div>
            <p className="text-xs text-indigo-300 mt-2">Billed annually at LKR 14,900</p>
          </div>

          <div className="flex-1 space-y-4 mb-10 relative z-10">
            {[
              "Everything in Standard",
              "Personal Portfolio Website (worth LKR 15,000+/yr)",
              "Unlimited links",
              "Lead capture forms",
              "Advanced analytics & tap locations",
              "Premium themes & custom CSS",
              "Export to CRM (HubSpot, Salesforce)",
              "Custom domain (coming soon)"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="text-neutral-300">{feature}</span>
              </div>
            ))}
          </div>

          {inCart("plan-pro") ? (
            <button
              onClick={openCart}
              className="relative z-10 w-full py-4 rounded-xl font-bold text-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Added to Cart · View Cart
            </button>
          ) : (
            <button
              onClick={() => addItem({
                id: "plan-pro",
                name: "TAGIT Pro",
                price: "LKR 1,490 / month",
                priceNum: 1490,
                type: "plan",
                badge: "PRO",
              })}
              className="relative z-10 w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-lg hover:shadow-rose-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 text-center"
      >
        <p className="text-neutral-400 text-lg mb-4">Don&apos;t have a physical card yet?</p>
        <a href="/products" className="inline-flex items-center gap-2 text-rose-500 font-bold hover:text-rose-600 transition-colors">
          Browse our premium cards starting at LKR 4,500 <span aria-hidden="true">&rarr;</span>
        </a>
      </motion.div>
    </main>
  );
}

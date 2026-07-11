"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Truck, Store, CreditCard, Building2,
  Banknote, Smartphone, ChevronRight, Package, ShieldCheck,
  RotateCcw, Tag, Minus, Plus, ArrowLeft, Sparkles, Lock
} from "lucide-react";

interface CardConfig {
  productName: string;
  basePrice: number;
  customBgPrice: number;
  totalPrice: number;
  foilColor: string;
  foilLabel: string;
  accentColor: string;
  bgColor: string;
  bgImage: string | null;
  displayName: string;
  designation: string;
  email: string;
  phone: string;
  website: string;
  fontStyle: string;
}

const STEPS = ["Design", "Details", "Payment", "Confirm"];

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, Amex", icon: CreditCard, badge: null },
  { id: "bank", label: "Bank Transfer", desc: "Direct bank deposit", icon: Building2, badge: null },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive", icon: Banknote, badge: "Delivery only" },
  { id: "payhere", label: "PayHere", desc: "Secure online payment", icon: Smartphone, badge: "Popular" },
];

function MiniCardPreview({ config }: { config: CardConfig }) {
  const isPVC = config.productName?.toLowerCase().includes("pvc");
  const cardStyle = isPVC 
    ? { backgroundColor: config.bgColor || "#f8f9fa" }
    : { background: "linear-gradient(135deg, #232427 0%, #1a1b1d 40%, #0e0f10 100%)" };

  const textColor = isPVC && config.bgColor === "#f8f9fa" ? "#000" : (isPVC ? "#fff" : config.foilColor);

  return (
    <div className="w-full aspect-[1.586] rounded-2xl relative overflow-hidden shadow-2xl flex flex-col justify-between p-5" style={cardStyle}>
      {config.bgImage && <div className="absolute inset-0" style={{ backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: isPVC ? 1 : 0.5 }} />}
      <div className="relative z-10 flex justify-between items-start">
        <div className="w-10 h-7 rounded-sm opacity-80" style={{ background: `linear-gradient(135deg, ${config.foilColor}, ${config.foilColor}aa)`, boxShadow: `0 0 12px ${config.accentColor}40` }} />
        <div className="w-7 h-7 rounded-full border-2 opacity-60" style={{ borderColor: config.accentColor }} />
      </div>
      <div className="relative z-10" style={{ color: textColor }}>
        <p className="font-black text-lg tracking-widest leading-none">{config.displayName || "YOUR NAME"}</p>
        <p className="opacity-70 text-xs font-medium tracking-wider mt-1">{config.designation || "YOUR TITLE"}</p>
        <div className="mt-3 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.accentColor }} />
          <p className="opacity-50 text-[9px] font-medium tracking-widest">NFC · TAGIT</p>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<CardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [delivery, setDelivery] = useState<"delivery" | "pickup">("delivery");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [bankRef, setBankRef] = useState("");

  useEffect(() => {
    const fetchDesign = async () => {
      const id = searchParams.get("id");
      if (!id) {
        setError("No design ID provided. Please go back and finalize your design.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:4000/api/v1/designs/${id}`);
        const data = await res.json();
        
        if (data.success && data.design) {
          const parsed = data.design as CardConfig;
          setConfig(parsed);
          if (parsed.displayName !== "JOHN DOE") setFullName(parsed.displayName);
          if (parsed.email !== "john@tagit.com") setEmail(parsed.email);
          if (parsed.phone !== "+1 (555) 123-4567") setPhone(parsed.phone);
        } else {
          setError(data.message || "Failed to load design.");
        }
      } catch (err) {
        setError("Failed to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesign();
  }, [searchParams]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-neutral-500 font-bold animate-pulse">Loading your custom design...</p></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-rose-500 font-bold">{error}</p>
        <button onClick={() => router.push("/")} className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold">Go Back to Studio</button>
      </div>
    );
  }

  const basePrice = config?.basePrice ?? 2500;
  const customBgPrice = config?.customBgPrice ?? 0;
  const cardUnitPrice = basePrice + customBgPrice;
  const freeDelivery = quantity >= 5;
  const deliveryFee = delivery === "delivery" && !freeDelivery ? 300 : 0;
  const subtotal = cardUnitPrice * quantity;
  const total = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = "TAGIT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setOrderNumber(num);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="max-w-lg w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.5 }} className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-300/50">
            <CheckCircle className="w-16 h-16 text-white" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-3">Order Confirmed</p>
            <h1 className="text-5xl font-black text-neutral-900 tracking-tight mb-3">Thank you!</h1>
            <p className="text-neutral-500 font-medium mb-2">Your order has been placed successfully.</p>
            <div className="inline-block bg-neutral-900 text-white px-6 py-2.5 rounded-full font-black tracking-widest text-sm mb-8">{orderNumber}</div>
            <div className="bg-white rounded-[2rem] p-8 border border-neutral-100 shadow-lg text-left space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm"><span className="text-neutral-500 font-medium">Product</span><span className="font-bold text-neutral-900">{config?.productName} x {quantity}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-neutral-500 font-medium">Delivery</span><span className="font-bold text-neutral-900">{delivery === "delivery" ? "Home Delivery" : "Pick Up In Store"}</span></div>
              <div className="w-full h-px bg-neutral-100" />
              <div className="flex justify-between items-center"><span className="font-black text-neutral-900">Total Paid</span><span className="font-black text-2xl text-neutral-900">LKR {total.toLocaleString()}</span></div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => router.push("/")} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-4 rounded-2xl font-bold text-sm transition-all">Back to Home</button>
              <button onClick={() => router.push("/products")} className="flex-1 bg-neutral-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg">Order Another</button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-bold text-sm transition-colors"><ArrowLeft className="w-4 h-4" />Back to Studio</button>
          <span className="text-xl font-black text-neutral-900 tracking-tight">TAGIT</span>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><Lock className="w-3 h-3" />Secure Checkout</div>
        </div>
      </header>

      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${idx < 3 ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-300 text-neutral-400"}`}>
                    {idx < 2 ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${idx < 3 ? "text-neutral-900" : "text-neutral-300"}`}>{step}</span>
                </div>
                {idx < STEPS.length - 1 && <div className={`h-0.5 w-16 mx-2 mb-4 rounded-full transition-all ${idx < 2 ? "bg-neutral-900" : "bg-neutral-200"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_420px] gap-10 items-start">
          <div className="space-y-8">

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center"><Package className="w-5 h-5 text-white" /></div>
                <div><h2 className="text-xl font-black text-neutral-900">Delivery Details</h2><p className="text-neutral-400 text-sm font-medium">Where should we send your card?</p></div>
              </div>
              <div className="grid grid-cols-1 gap-5">
                <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] rounded">Full Name *</label><input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Shehan Fernando" className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] rounded">Email *</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                  <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] rounded">Phone *</label><input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 000 0000" className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                </div>
                <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] rounded">Address Line 1</label><input type="text" value={address1} onChange={e => setAddress1(e.target.value)} placeholder="e.g. 123 Galle Road" className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] rounded">Address Line 2</label><input type="text" value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Apartment, Suite, etc." className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] rounded">City</label><input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Colombo" className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                  <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] rounded">Postal Code</label><input type="text" value={postal} onChange={e => setPostal(e.target.value)} placeholder="e.g. 00100" className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center"><Truck className="w-5 h-5 text-white" /></div>
                <div><h2 className="text-xl font-black text-neutral-900">Delivery Method</h2><p className="text-neutral-400 text-sm font-medium">Order 5+ cards for free delivery!</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([{ id: "delivery", label: "Home Delivery", desc: freeDelivery ? "Free (5+ cards)" : "+ LKR 300", icon: Truck, highlight: freeDelivery }, { id: "pickup", label: "Pick Up In Store", desc: "Free — Colombo 07", icon: Store, highlight: false }] as const).map(opt => (
                  <button key={opt.id} type="button" onClick={() => setDelivery(opt.id)} className={`relative p-6 rounded-[1.5rem] border-2 text-left transition-all ${delivery === opt.id ? "border-neutral-900 bg-neutral-900 text-white shadow-2xl shadow-neutral-900/20" : "border-neutral-200 hover:border-neutral-400"}`}>
                    {opt.highlight && delivery !== opt.id && <span className="absolute -top-3 left-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Free!</span>}
                    <opt.icon className={`w-7 h-7 mb-3 ${delivery === opt.id ? "text-white" : "text-neutral-400"}`} />
                    <p className={`font-black text-base ${delivery === opt.id ? "text-white" : "text-neutral-900"}`}>{opt.label}</p>
                    <p className={`text-sm font-bold mt-1 ${delivery === opt.id ? "text-white/70" : opt.highlight ? "text-emerald-600" : "text-neutral-400"}`}>{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div>
                  <p className="font-black text-neutral-900">Quantity</p>
                  <p className="text-neutral-500 text-sm font-medium">{quantity < 5 ? `${5 - quantity} more for free delivery!` : "Free delivery unlocked! 🎉"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-white border-2 border-neutral-200 hover:border-neutral-900 flex items-center justify-center transition-all shadow-sm"><Minus className="w-4 h-4 text-neutral-600" /></button>
                  <span className="text-3xl font-black text-neutral-900 w-8 text-center tabular-nums">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center transition-all shadow-lg hover:bg-black"><Plus className="w-4 h-4 text-white" /></button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center"><CreditCard className="w-5 h-5 text-white" /></div>
                <div><h2 className="text-xl font-black text-neutral-900">Payment Method</h2><p className="text-neutral-400 text-sm font-medium">All transactions are 256-bit encrypted.</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {PAYMENT_METHODS.map(pm => {
                  const isDisabled = pm.id === "cod" && delivery === "pickup";
                  return (
                    <button key={pm.id} type="button" disabled={isDisabled} onClick={() => !isDisabled && setPaymentMethod(pm.id)} className={`relative p-5 rounded-[1.5rem] border-2 text-left transition-all ${isDisabled ? "opacity-40 cursor-not-allowed border-neutral-100" : paymentMethod === pm.id ? "border-neutral-900 bg-neutral-900 text-white shadow-xl shadow-neutral-900/20" : "border-neutral-200 hover:border-neutral-400"}`}>
                      {pm.badge && <span className={`absolute -top-3 right-4 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${pm.badge === "Popular" ? "bg-rose-500 text-white" : "bg-amber-400 text-amber-900"}`}>{pm.badge}</span>}
                      <pm.icon className={`w-6 h-6 mb-3 ${paymentMethod === pm.id ? "text-white" : "text-neutral-500"}`} />
                      <p className={`font-black text-sm ${paymentMethod === pm.id ? "text-white" : "text-neutral-900"}`}>{pm.label}</p>
                      <p className={`text-xs font-medium mt-0.5 ${paymentMethod === pm.id ? "text-white/60" : "text-neutral-400"}`}>{pm.desc}</p>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence mode="wait">
                {paymentMethod === "card" && (
                  <motion.div key="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Card Number</label><input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Expiry</label><input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM / YY" maxLength={7} className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                      <div className="relative"><label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">CVC</label><input type="text" value={cardCvc} onChange={e => setCardCvc(e.target.value)} placeholder="123" maxLength={4} className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                    </div>
                  </motion.div>
                )}
                {paymentMethod === "bank" && (
                  <motion.div key="bank" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 space-y-3">
                    <p className="font-black text-neutral-900 text-sm">Bank Transfer Details</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-neutral-400 font-medium">Bank</span><span className="font-bold text-neutral-900">Commercial Bank of Ceylon</span></div>
                      <div className="flex justify-between"><span className="text-neutral-400 font-medium">Account Name</span><span className="font-bold text-neutral-900">TAGIT (PVT) LTD</span></div>
                      <div className="flex justify-between"><span className="text-neutral-400 font-medium">Account No.</span><span className="font-bold text-neutral-900">1234 5678 9012</span></div>
                      <div className="flex justify-between"><span className="text-neutral-400 font-medium">Branch</span><span className="font-bold text-neutral-900">Colombo Main</span></div>
                    </div>
                    <div className="relative mt-4"><label className="absolute -top-2.5 left-4 bg-neutral-50 px-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Transaction Reference</label><input type="text" value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="e.g. TXN-00123456" className="w-full px-5 py-4 bg-white border border-neutral-200 rounded-2xl focus:border-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300" /></div>
                  </motion.div>
                )}
                {paymentMethod === "cod" && (
                  <motion.div key="cod" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-center gap-4">
                    <Banknote className="w-6 h-6 text-amber-600 shrink-0" />
                    <p className="text-amber-800 font-bold text-sm">Please have the exact amount ready at the time of delivery. Available with Home Delivery only.</p>
                  </motion.div>
                )}
                {paymentMethod === "payhere" && (
                  <motion.div key="payhere" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center gap-4">
                    <Smartphone className="w-6 h-6 text-blue-600 shrink-0" />
                    <p className="text-blue-800 font-bold text-sm">You will be redirected to PayHere secure gateway after placing the order.</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-neutral-100">
                {([{ icon: Lock, label: "SSL Secured" }, { icon: ShieldCheck, label: "100% Guarantee" }, { icon: RotateCcw, label: "Free Returns" }] as const).map(badge => (
                  <div key={badge.label} className="flex flex-col items-center gap-1.5"><badge.icon className="w-5 h-5 text-neutral-400" /><span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{badge.label}</span></div>
                ))}
              </div>
            </motion.div>

          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-28 space-y-6">
            {config && (
              <div className="bg-white rounded-[2.5rem] p-6 border border-neutral-100 shadow-sm">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Your Card Design</p>
                <MiniCardPreview config={config} />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-neutral-400 font-medium">Product</span><span className="font-bold text-neutral-900">{config.productName}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-400 font-medium">Primary Color</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: config.foilColor }} /><span className="font-bold text-neutral-900">{config.foilLabel}</span></div></div>
                  {config.bgImage && <div className="flex justify-between text-xs"><span className="text-neutral-400 font-medium">Custom Background</span><span className="font-bold text-emerald-600">+ LKR 500</span></div>}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Price Breakdown</p>
              <div className="space-y-4">
                <div className="flex justify-between text-sm"><span className="text-neutral-600 font-medium">{config?.productName || "Card"} x {quantity}</span><span className="font-bold text-neutral-900">LKR {subtotal.toLocaleString()}</span></div>
                {customBgPrice > 0 && <div className="flex justify-between text-sm"><span className="text-neutral-600 font-medium">Custom Bg x {quantity}</span><span className="font-bold text-neutral-900">LKR {(customBgPrice * quantity).toLocaleString()}</span></div>}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-neutral-600 font-medium">Delivery</span>
                  <AnimatePresence mode="wait">
                    {deliveryFee === 0 ? (
                      <motion.span key="free" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="font-bold text-emerald-600 flex items-center gap-1"><Sparkles className="w-3 h-3" />Free</motion.span>
                    ) : (
                      <motion.span key="paid" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="font-bold text-neutral-900">LKR {deliveryFee.toLocaleString()}</motion.span>
                    )}
                  </AnimatePresence>
                </div>
                {quantity < 5 && delivery === "delivery" && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-xs font-bold text-amber-700 flex items-center gap-2"><Tag className="w-3.5 h-3.5 shrink-0" />Add {5 - quantity} more card{5 - quantity > 1 ? "s" : ""} for free delivery!</div>
                )}
                <div className="h-px bg-neutral-100 my-2" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mb-1">Total</p>
                    <motion.p key={total} initial={{ scale: 0.95, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl font-black text-neutral-900 tracking-tight">LKR {total.toLocaleString()}</motion.p>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full mt-8 bg-neutral-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black tracking-widest uppercase text-sm transition-all shadow-xl hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 flex items-center justify-center gap-3 group">
                <Lock className="w-4 h-4" />Place Order<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-[10px] text-neutral-400 font-medium mt-4">By placing an order you agree to our Terms & Conditions.</p>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-neutral-500 font-bold animate-pulse">Loading checkout...</p></div>}>
      <OrderPageContent />
    </Suspense>
  );
}

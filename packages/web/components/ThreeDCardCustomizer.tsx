"use client";

import React, { useState, useEffect } from "react";
import { Settings2, User, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";

// --- OPTIONS ---
const FOIL_COLORS = [
  { id: "gold", label: "24k Gold", value: "#cfa15a", light: "#e6c583" },
  { id: "silver", label: "Sterling Silver", value: "#cfcfcf", light: "#ffffff" },
  { id: "rose", label: "Rose Gold", value: "#c08c85", light: "#d9b3ae" },
  { id: "black", label: "Obsidian Black", value: "#1a1b1e", light: "#2a2c31" },
  { id: "graphite", label: "Graphite", value: "#3a3b3c", light: "#4f5154" },
];

const ACCENT_COLORS = [
  { id: "cyan", label: "Neon Cyan", value: "#29b6d8" },
  { id: "green", label: "Matrix Green", value: "#00FF66" },
  { id: "purple", label: "Cyber Purple", value: "#B026FF" },
  { id: "orange", label: "Blaze Orange", value: "#FF5500" },
  { id: "dark_cyan", label: "Deep Cyan", value: "#0b5b6d" },
  { id: "crimson", label: "Dark Crimson", value: "#8a0303" },
];

const PVC_FOIL_COLORS = [
  { id: "white", label: "Frost White", value: "#d1d5db", light: "#f3f4f6" },
  { id: "gold", label: "Premium Gold", value: "#cfa15a", light: "#e6c583" },
  { id: "silver", label: "Bright Silver", value: "#cfcfcf", light: "#ffffff" },
  { id: "rose", label: "Rose Gold", value: "#b76e79", light: "#e0bfb8" },
  { id: "cyan", label: "Cyber Cyan", value: "#06b6d4", light: "#22d3ee" },
  { id: "amber", label: "Warm Amber", value: "#f59e0b", light: "#fbbf24" },
  { id: "black", label: "Midnight Black", value: "#0f172a", light: "#1e293b" },
  { id: "navy", label: "Deep Navy", value: "#172554", light: "#1e3a8a" },
];

const PVC_ACCENT_COLORS = [
  { id: "white", label: "Frost White", value: "#e5e7eb" },
  { id: "gold", label: "Premium Gold", value: "#cfa15a" },
  { id: "silver", label: "Bright Silver", value: "#cfcfcf" },
  { id: "gray", label: "Subtle Gray", value: "#9ca3af" },
  { id: "black", label: "Onyx Black", value: "#111827" },
  { id: "emerald", label: "Deep Emerald", value: "#064e3b" },
];

const PVC_BACKGROUND_COLORS = [
  { id: "matte-black", label: "Matte Black", value: "#303236" },
  { id: "pure-white", label: "Pure White", value: "#f8f9fa" },
  { id: "premium-gold", label: "Premium Gold", value: "#cfa15a" },
  { id: "silver", label: "Bright Silver", value: "#e5e7eb" },
  { id: "navy", label: "Midnight Navy", value: "#0f172a" },
  { id: "rose", label: "Rose Gold", value: "#b76e79" },
];

const CARD_FONTS = [
  { id: "sans", label: "Modern Sans", value: "font-sans", family: "sans-serif" },
  { id: "serif", label: "Classic Serif", value: "font-serif", family: "serif" },
  { id: "mono", label: "Tech Mono", value: "font-mono", family: "monospace" },
];

const PVC_BACKGROUNDS = [
  { id: "bg1", label: "Brushed Metal", url: "/backgrounds/dark_brushed_metal_1783795668673.png" },
  { id: "bg2", label: "Carbon Fiber", url: "/backgrounds/carbon_fiber_dark_1783795677260.png" },
  { id: "bg3", label: "Dark Silk", url: "/backgrounds/dark_silk_waves_1783795686700.png" },
  { id: "bg4", label: "Midnight Gradient", url: "/backgrounds/midnight_gradient_1783795711427.png" },
  { id: "bg5", label: "Black Leather", url: "/backgrounds/black_leather_1783795721569.png" },
  { id: "bg6", label: "Pure Obsidian", url: "/backgrounds/pure_black_obsidian_1783795738075.png" },
];

function RealisticQRCode({ color = "var(--gold)", bgColor = "#0e0f10", logoBg = "#f4efe6", logoMark = "#0e0f10", hideLogo = false }: { color?: string, bgColor?: string, logoBg?: string, logoMark?: string, hideLogo?: boolean }) {
  const size = 29;
  const cellSize = 100 / size;
  const rects = [];

  const isAnchor = (cx: number, cy: number, x: number, y: number, w: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return (dx >= 0 && dx < w && dy >= 0 && dy < w);
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Anchors (7x7) + 1 module quiet zone (8x8 total exclusion)
      if (isAnchor(0, 0, x, y, 8) || isAnchor(size - 8, 0, x, y, 8) || isAnchor(0, size - 8, x, y, 8)) continue;

      // Alignment (5x5) at 20,20
      if (isAnchor(20, 20, x, y, 5)) continue;

      // Center logo cutout (11x11 in center to be safe) - skip if hideLogo
      if (!hideLogo && x >= 9 && x <= 19 && y >= 9 && y <= 19) continue;

      // Timing patterns (dotted lines connecting anchors)
      if (x === 6 || y === 6) {
        if (x === 6 && y > 7 && y < size - 7) {
          if (y % 2 === 0) rects.push(<rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize + 0.3} height={cellSize + 0.3} fill={color} />);
          continue;
        }
        if (y === 6 && x > 7 && x < size - 7) {
          if (x % 2 === 0) rects.push(<rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize + 0.3} height={cellSize + 0.3} fill={color} />);
          continue;
        }
      }

      // Pseudo-random fill (approx 50% density)
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      if (hash - Math.floor(hash) > 0.5) {
        rects.push(<rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize + 0.3} height={cellSize + 0.3} fill={color} />);
      }
    }
  }

  const drawAnchor = (ax: number, ay: number) => (
    <g transform={`translate(${ax * cellSize}, ${ay * cellSize})`} fill={color}>
      <rect x="0" y="0" width={7 * cellSize} height={7 * cellSize} />
      <rect x={1 * cellSize} y={1 * cellSize} width={5 * cellSize} height={5 * cellSize} fill={bgColor} />
      <rect x={2 * cellSize} y={2 * cellSize} width={3 * cellSize} height={3 * cellSize} />
    </g>
  );

  const drawAlignment = (ax: number, ay: number) => (
    <g transform={`translate(${ax * cellSize}, ${ay * cellSize})`} fill={color}>
      <rect x="0" y="0" width={5 * cellSize} height={5 * cellSize} />
      <rect x={1 * cellSize} y={1 * cellSize} width={3 * cellSize} height={3 * cellSize} fill={bgColor} />
      <rect x={2 * cellSize} y={2 * cellSize} width={1 * cellSize} height={1 * cellSize} />
    </g>
  );

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="0" y="0" width="100" height="100" fill={bgColor} />

      {rects}

      {drawAnchor(0, 0)}
      {drawAnchor(size - 7, 0)}
      {drawAnchor(0, size - 7)}
      {drawAlignment(20, 20)}

      {!hideLogo && (
        <>
          <rect x={32} y={32} width={36} height={36} rx={5} fill={logoBg} />
          <g transform="translate(40, 37) scale(0.42)">
            <rect x="2" y="14" width="15" height="7" rx="2" fill={logoMark} />
            <path d="M12 14 L26 14 L26 34 Q26 49 19 55 Q12 49 12 34 Z" fill={logoMark} />
            <path d="M24 16 L39 3" stroke={logoMark} strokeWidth="7" strokeLinecap="round" />
            <circle cx="40" cy="2" r="5.5" fill={logoMark} />
          </g>
        </>
      )}
    </svg>
  );
}

export function PremiumHeroGraphic() {
  const dots = [];
  for (let x = 15; x <= 135; x += 8) {
    for (let y = 35; y <= 155; y += 8) {
      const dist = Math.sqrt(Math.pow(x - 75, 2) + Math.pow(y - 95, 2));
      const maxDist = 52;
      if (dist < maxDist) {
        // Create a 3D sphere illusion by making dots larger in the center
        const normalized = 1 - (dist / maxDist);
        const r = normalized * 2.8;
        const opacity = normalized * 0.9 + 0.1;
        dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="var(--cyan)" opacity={opacity} />);
      }
    }
  }

  return (
    <svg className="circuit-box" viewBox="0 0 150 190" fill="none" style={{ overflow: 'visible' }}>

      {/* Background ambient glow */}
      <circle cx="75" cy="95" r="45" fill="var(--cyan)" opacity="0.12" filter="blur(12px)" />

      {/* Technical Hexagonal Frame */}
      <polygon points="75,20 140,57 140,133 75,170 10,133 10,57" fill="none" stroke="var(--cyan)" strokeWidth="0.5" opacity="0.2" />

      {/* Halftone Sphere Core */}
      {dots}

      {/* NFC / Communication Orbital Rings */}
      <ellipse cx="75" cy="95" rx="65" ry="20" stroke="var(--cyan)" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.8" transform="rotate(-30 75 95)" />
      <ellipse cx="75" cy="95" rx="72" ry="12" stroke="var(--cyan)" strokeWidth="1" opacity="0.5" transform="rotate(40 75 95)" />
      <ellipse cx="75" cy="95" rx="80" ry="30" stroke="var(--cyan)" strokeWidth="0.5" strokeDasharray="1 4" opacity="0.6" transform="rotate(10 75 95)" />

      {/* Center Focus Reticle */}
      <circle cx="75" cy="95" r="6" fill="none" stroke="var(--cyan)" strokeWidth="1.5" />
      <circle cx="75" cy="95" r="2" fill="var(--cyan)" />

      {/* Connecting Data Lines */}
      <path d="M 75 20 L 75 43" stroke="var(--cyan)" strokeWidth="1" opacity="0.6" strokeDasharray="2 2" />
      <path d="M 75 147 L 75 170" stroke="var(--cyan)" strokeWidth="1" opacity="0.6" strokeDasharray="2 2" />
      <path d="M 10 95 L 23 95" stroke="var(--cyan)" strokeWidth="1" opacity="0.6" strokeDasharray="2 2" />
      <path d="M 127 95 L 140 95" stroke="var(--cyan)" strokeWidth="1" opacity="0.6" strokeDasharray="2 2" />

      {/* Edge Accents */}
      <path d="M 5 45 L 5 25 L 25 25" fill="none" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.7" />
      <path d="M 145 45 L 145 25 L 125 25" fill="none" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.7" />
      <path d="M 5 145 L 5 165 L 25 165" fill="none" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.7" />
      <path d="M 145 145 L 145 165 L 125 165" fill="none" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

export default function ThreeDCardCustomizer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productName = searchParams.get("product") || "Executive Metal";
  const isPVC = productName.trim().toLowerCase().includes("pvc");

  const currentFoils = isPVC ? PVC_FOIL_COLORS : FOIL_COLORS;
  const currentAccents = isPVC ? PVC_ACCENT_COLORS : ACCENT_COLORS;

  const [activeTab, setActiveTab] = useState<"design" | "details">("design");
  const [designSubTab, setDesignSubTab] = useState<"colors" | "backgrounds">("colors");

  const [foil, setFoil] = useState(currentFoils[0]);
  const [accentColor, setAccentColor] = useState(currentAccents[0].value);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgColor, setBgColor] = useState(PVC_BACKGROUND_COLORS[0].value);
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgImageFile(file);
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  // Sync state if product changes via soft navigation
  useEffect(() => {
    setFoil(currentFoils[0]);
    setAccentColor(currentAccents[0].value);
  }, [isPVC]);

  const [displayName, setDisplayName] = useState("JOHN DOE");
  const [designation, setDesignation] = useState("CHIEF ARCHITECT");
  const [email, setEmail] = useState("john@tagit.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [website, setWebsite] = useState("www.tagit.com");
  const [fontStyle, setFontStyle] = useState(CARD_FONTS[0]);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);

  // Pricing Logic
  const basePrice = isPVC ? 1500 : 2500;
  const customBgPrice = bgImage ? 500 : 0;
  const totalPrice = basePrice + customBgPrice;

  const [isSaving, setIsSaving] = useState(false);

  const saveDesignToBackend = async (status: "CART" | "TEMPORARY") => {
    setIsSaving(true);
    try {
      const cardConfig = {
        productName,
        basePrice,
        customBgPrice,
        totalPrice,
        foilColor: foil.value,
        foilLabel: foil.label,
        accentColor,
        bgColor,
        bgImage, // this will be updated by the backend if a file is uploaded
        displayName,
        designation,
        email,
        phone,
        website,
        fontStyle: fontStyle.label,
      };

      const formData = new FormData();
      formData.append("status", status);
      formData.append("config", JSON.stringify(cardConfig));
      if (bgImageFile) {
        formData.append("bgImageFile", bgImageFile);
      }

      const res = await fetch("http://localhost:4000/api/v1/designs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.design) {
        return data.design.id;
      } else {
        throw new Error("Failed to save design");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving your design. Please try again.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuyNow = async () => {
    const designId = await saveDesignToBackend("TEMPORARY");
    if (designId) {
      router.push(`/order?id=${designId}`);
    }
  };

  const handleAddToCart = async () => {
    const designId = await saveDesignToBackend("CART");
    if (designId) {
      alert("Design added to cart! It will be saved for 3 days.");
      setIsCheckoutMode(false);
    }
  };

  return (
    <div className="w-full h-full max-w-[1600px] mx-auto px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">

      {/* LEFT: 3D Preview (7 cols) */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center relative h-full min-h-0 bg-zinc-200/50 rounded-[3rem] overflow-hidden">
        {/* Studio Ambient Glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[800px] h-[800px] bg-gradient-to-tr from-cyan-400/20 via-purple-500/10 to-emerald-400/20 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-pulse" style={{ animationDuration: '4s' }}></div>
        </div>

        {/* Toggle Buttons */}
        <div className="absolute top-8 flex gap-4 bg-white/50 backdrop-blur-md p-1.5 rounded-full border border-black/5 shadow-sm z-10">
          <button onClick={() => setIsFlipped(false)} className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${!isFlipped ? "bg-black text-white shadow-md" : "text-zinc-600 hover:text-black hover:bg-white/50"}`}>Front</button>
          <button onClick={() => setIsFlipped(true)} className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${isFlipped ? "bg-black text-white shadow-md" : "text-zinc-600 hover:text-black hover:bg-white/50"}`}>Back</button>
        </div>

        {/* Card Render */}
        <div
          className="card-container cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{
            "--gold": foil.value,
            "--gold-light": foil.light,
            "--cyan": accentColor,
          } as React.CSSProperties}
        >
          <div className={`card-flipper shadow-2xl transition-all duration-700 ${isFlipped ? "is-flipped" : "hover:scale-[1.02]"}`}>

            {/* FRONT FACE */}
            <div className="card-face">
              {isPVC ? (
                <div 
                  className={`w-full h-full relative overflow-hidden flex items-center justify-center ${fontStyle.value}`}
                  style={{
                    backgroundColor: bgColor,
                    backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {bgImage && <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}></div>}
                  {/* Centered Logo */}
                  <div className="flex items-center gap-3.5 relative z-10 -mt-2">
                    <span className="text-[42px] font-light tracking-[0.25em]" style={{ color: foil.light }}>TAG IT</span>
                    <svg className="w-[32px] h-[44px] overflow-visible mb-1" viewBox="0 0 46 52" fill="none">
                      <path d="M8 21 A 7 7 0 0 1 8 31" stroke={foil.light} strokeWidth="3.5" strokeLinecap="round" />
                      <path d="M16 15 A 15 15 0 0 1 16 37" stroke={foil.light} strokeWidth="3.5" strokeLinecap="round" />
                      <path d="M24 9 A 23 23 0 0 1 24 43" stroke={foil.light} strokeWidth="3.5" strokeLinecap="round" />
                      <path d="M32 3 A 31 31 0 0 1 32 49" stroke={foil.light} strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Bottom Left QR & Info */}
                  <div className="absolute bottom-5 left-7 flex items-end gap-3.5 z-10">
                    <div className="w-[58px] h-[58px] bg-transparent flex-shrink-0">
                      <RealisticQRCode color={accentColor} bgColor="#303236" hideLogo={true} />
                    </div>
                    <div className="flex flex-col justify-end gap-2 pb-1.5">
                      <svg className="w-[16px] h-[18px] overflow-visible" viewBox="0 0 46 52" fill="none">
                        <path d="M8 21 A 7 7 0 0 1 8 31" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
                        <path d="M16 15 A 15 15 0 0 1 16 37" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
                        <path d="M24 9 A 23 23 0 0 1 24 43" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
                      </svg>
                      <span className="text-[8.5px] text-zinc-400 font-medium tracking-[0.08em] whitespace-nowrap opacity-90">
                        SCAN OR TAP FOR CONTACT
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={`front-content relative overflow-hidden ${fontStyle.value}`}
                  style={{
                    backgroundColor: bgColor,
                    backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {bgImage && <div className="absolute inset-0 z-0 pointer-events-none rounded-[18px]" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}></div>}
                  <PremiumHeroGraphic />
                  <div className="logo-group relative z-10">
                    <svg className="t-icon h-[140px] w-auto" viewBox="0 0 100 120" fill="none">
                      {/* T Shape */}
                      <path d="M 15 30 L 15 46 L 31 46 L 47 30 Z" fill="var(--gold)" />
                      <path d="M 59 30 L 85 30 L 85 46 L 55 46 L 55 110 L 39 110 L 39 50 L 59 30 Z" fill="var(--gold)" />

                      {/* Foreground lines (gold stroke) */}
                      <g stroke="var(--gold)" strokeWidth="3" strokeLinecap="round">
                        <line x1="55" y1="38" x2="85" y2="26" />
                        <line x1="55" y1="38" x2="85" y2="50" />
                        <line x1="85" y1="26" x2="85" y2="50" />
                        <line x1="55" y1="38" x2="25" y2="70" />
                      </g>

                      {/* Nodes with dark background borders for embossed effect */}
                      <circle cx="55" cy="38" r="9" fill="var(--gold)" stroke="#17181a" strokeWidth="4" />
                      <circle cx="85" cy="26" r="7" fill="var(--gold)" stroke="#17181a" strokeWidth="3" />
                      <circle cx="85" cy="50" r="7" fill="var(--gold)" stroke="#17181a" strokeWidth="3" />
                      <circle cx="25" cy="70" r="5" fill="var(--gold)" stroke="#17181a" strokeWidth="3" />
                    </svg>
                    <div className="divider"></div>
                    <div className="brand-name relative pr-[20px]">
                      TAGIT
                      <svg viewBox="0 0 36 36" className="absolute top-[2px] right-[0px] w-[18px] h-[18px] text-[var(--gold-light)] overflow-visible">
                        <path d="M 4 12 A 6 6 0 0 1 4 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 12 6 A 14 14 0 0 1 12 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 20 0 A 22 22 0 0 1 20 36" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="cyberlink">CYBERLINK</div>
                </div>
              )}
            </div>

            {/* BACK FACE */}
            <div className="card-face card-face-back">
              {isPVC ? (
                <div 
                  className={`flex flex-col items-center justify-center h-full text-[#e0e2e5] relative ${fontStyle.value}`}
                  style={{
                    backgroundColor: bgColor,
                    backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {bgImage && <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}></div>}
                  {/* Top Right Logo */}
                  <div className="absolute top-6 right-8 flex items-center gap-2 opacity-90 z-10" style={{ color: foil.value }}>
                    <svg className="w-[14px] h-[18px] overflow-visible" viewBox="0 0 46 52" fill="none">
                      <circle cx="12" cy="26" r="5" fill="currentColor" />
                      <path d="M26 14 A 14 14 0 0 1 26 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      <path d="M40 4 A 26 26 0 0 1 40 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span className="text-[12px] font-medium tracking-[0.15em]">TAGIT</span>
                  </div>

                  {/* Centered Info */}
                  <div className="text-center w-full flex flex-col items-center mt-3 relative z-10">
                    <h3 className="text-[23px] tracking-[0.12em] uppercase mb-1.5 font-semibold" style={{ color: foil.light }}>{displayName || "JOHN DOE"}</h3>
                    <p className="text-[10.5px] tracking-[0.2em] uppercase mb-6 font-medium" style={{ color: foil.value }}>{designation || "CHIEF ARCHITECT"}</p>
                    <div className="text-[11.5px] text-[#a1a8b3] space-y-1.5 font-medium tracking-wide">
                      {email && <p>{email.toLowerCase()}</p>}
                      {phone && <p>{phone}</p>}
                      {website && <p>{website.toLowerCase()}</p>}
                    </div>

                    {/* Bottom Center NFC - In document flow now */}
                    <div className="mt-5 flex justify-center w-full">
                      <svg viewBox="0 0 100 100" className="w-[36px] h-[36px]" style={{ color: accentColor }} fill="none" stroke="currentColor">
                        {/* Dot */}
                        <circle cx="50" cy="50" r="7.5" fill="currentColor" stroke="none" />
                        {/* Inner Left Arc */}
                        <path d="M36 34 A 20 20 0 0 0 36 66" strokeWidth="4.5" strokeLinecap="round" />
                        {/* Inner Right Arc */}
                        <path d="M64 34 A 20 20 0 0 1 64 66" strokeWidth="4.5" strokeLinecap="round" />
                        {/* Outer Left Arc */}
                        <path d="M22 18 A 38 38 0 0 0 22 82" strokeWidth="4.5" strokeLinecap="round" />
                        {/* Outer Right Arc */}
                        <path d="M78 18 A 38 38 0 0 1 78 82" strokeWidth="4.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={`back-content relative overflow-hidden ${fontStyle.value}`}
                  style={{
                    backgroundColor: bgColor,
                    backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {bgImage && <div className="absolute inset-0 z-0 pointer-events-none rounded-[18px]" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}></div>}
                  <div className="info-sec relative z-10">
                    <div className="info-field">
                      <div className="info-label">NAME</div>
                      <div className="info-value">{displayName || "JOHN DOE"}</div>
                    </div>
                    <div className="info-field">
                      <div className="info-label">DESIGNATION</div>
                      <div className="info-value">{designation || "CHIEF ARCHITECT"}</div>
                    </div>
                    {(email || phone || website) && (
                      <div className="mt-4 text-[10px] space-y-1 text-[#a1a8b3] font-medium tracking-wide">
                        {email && <div>{email.toLowerCase()}</div>}
                        {phone && <div>{phone}</div>}
                        {website && <div>{website.toLowerCase()}</div>}
                      </div>
                    )}
                  </div>
                  <div className="qr-wrap relative z-10">
                    <RealisticQRCode />
                  </div>
                  <svg className="nfc-icon overflow-visible flex-shrink-0" viewBox="0 0 46 52" fill="none">
                    <path d="M8 21 A 7 7 0 0 1 8 31" stroke="var(--cyan)" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M16 15 A 15 15 0 0 1 16 37" stroke="var(--cyan)" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M24 9 A 23 23 0 0 1 24 43" stroke="var(--cyan)" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M32 3 A 31 31 0 0 1 32 49" stroke="var(--cyan)" strokeWidth="4.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="absolute bottom-8 text-xs text-zinc-400 font-medium tracking-widest uppercase">Click card to flip</p>
      </div>

      {/* RIGHT: Controls Panel */}
      <div className="lg:col-span-5 flex flex-col h-full min-h-0 pb-2 lg:pb-0">
        <div className="bg-white/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 ring-neutral-900/5 flex flex-col h-full overflow-hidden relative">

          <AnimatePresence mode="wait">
            {!isCheckoutMode ? (
              <motion.div
                key="studio"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full min-h-0"
              >
                <div className="p-6 lg:p-8 pb-4 border-b border-neutral-900/5 shrink-0 z-10 relative">
                  <h2 className="text-3xl font-black text-neutral-900 tracking-tight mb-1">Studio</h2>
                  <p className="text-neutral-500 text-sm mb-8 font-medium">Fine-tune your premium {productName} card.</p>

            {/* Apple-style Segmented Control */}
            <div className="flex bg-neutral-900/5 p-1.5 rounded-[1.25rem] relative">
              {[
                { id: "design", label: "Design", icon: Settings2 },
                { id: "details", label: "Engraving", icon: User },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 relative flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors z-10 ${activeTab === tab.id ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}
                >
                  {activeTab === tab.id && (
                    <motion.div layoutId="active-tab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-neutral-900/5" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                  )}
                  <tab.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 lg:p-8 flex-1 overflow-y-auto space-y-10 scrollbar-hide relative" style={{ maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)" }}>
            {activeTab === "design" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Mini Nav for Design Tab */}
                <div className="flex bg-neutral-900/5 p-1 rounded-full relative w-fit mx-auto mb-2">
                  {[
                    { id: "colors", label: "Colors" },
                    { id: "backgrounds", label: "Backgrounds" },
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setDesignSubTab(subTab.id as any)}
                      className={`relative px-6 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-colors z-10 ${designSubTab === subTab.id ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}
                    >
                      {designSubTab === subTab.id && (
                        <motion.div layoutId="active-sub-tab" className="absolute inset-0 bg-white rounded-full shadow-sm border border-neutral-900/5" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      <span className="relative z-10">{subTab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Colors View */}
                {designSubTab === "colors" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 pl-1">
                        {isPVC ? "Primary Color (Logos/Text)" : "Foil Overlay (Logos/QR)"}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {currentFoils.map((fc) => (
                          <button key={fc.id} onClick={() => setFoil(fc)} className={`relative py-3 px-2 rounded-[1.25rem] border flex flex-col items-center justify-center gap-2.5 text-[11px] text-center leading-tight font-bold transition-all group ${foil.id === fc.id ? "border-neutral-900 ring-1 ring-neutral-900 bg-white text-neutral-900 shadow-md" : "border-neutral-900/10 bg-white/50 text-neutral-600 hover:border-neutral-900/30 hover:bg-white"}`}>
                            <div className="w-7 h-7 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-black/10 group-hover:scale-110 transition-transform" style={{ backgroundColor: fc.value }}></div>
                            <span>{fc.label}</span>
                          </button>
                        ))}
                        <label className={`relative py-3 px-2 rounded-[1.25rem] border flex flex-col items-center justify-center gap-2.5 text-[11px] text-center leading-tight font-bold transition-all group cursor-pointer ${foil.id === "custom" ? "border-neutral-900 ring-1 ring-neutral-900 bg-white text-neutral-900 shadow-md" : "border-neutral-900/10 bg-white/50 text-neutral-600 hover:border-neutral-900/30 hover:bg-white"}`}>
                          <div className="w-7 h-7 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-black/10 group-hover:scale-110 transition-transform bg-gradient-to-tr from-rose-500 via-purple-500 to-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </div>
                          <span>Custom Color</span>
                          <input type="color" className="absolute opacity-0 w-0 h-0" value={foil.value} onChange={(e) => setFoil({ id: "custom", label: "Custom", value: e.target.value, light: e.target.value })} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 pl-1">
                        {isPVC ? "Accent Color (QR/NFC)" : "Neon Accent (Circuit/WiFi)"}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {currentAccents.map((ac) => (
                          <button key={ac.id} onClick={() => setAccentColor(ac.value)} className={`relative py-4 px-4 rounded-[1.25rem] border flex flex-col items-center justify-center gap-3 text-xs font-bold transition-all group ${accentColor === ac.value ? "border-neutral-900 ring-1 ring-neutral-900 bg-white text-neutral-900 shadow-md" : "border-neutral-900/10 bg-white/50 text-neutral-600 hover:border-neutral-900/30 hover:bg-white"}`}>
                            <div className="w-7 h-7 rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] border border-white/20 group-hover:scale-110 transition-transform" style={{ backgroundColor: ac.value }}></div>{ac.label}
                          </button>
                        ))}
                        <label className={`relative py-4 px-4 rounded-[1.25rem] border flex flex-col items-center justify-center gap-3 text-xs font-bold transition-all group cursor-pointer ${!currentAccents.some(ac => ac.value === accentColor) ? "border-neutral-900 ring-1 ring-neutral-900 bg-white text-neutral-900 shadow-md" : "border-neutral-900/10 bg-white/50 text-neutral-600 hover:border-neutral-900/30 hover:bg-white"}`}>
                          <div className="w-7 h-7 rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] border border-white/20 group-hover:scale-110 transition-transform bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </div>
                          <span>Custom Color</span>
                          <input type="color" className="absolute opacity-0 w-0 h-0" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Backgrounds View */}
                {designSubTab === "backgrounds" && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 pl-1">
                        Base Color
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {PVC_BACKGROUND_COLORS.map((bgC) => (
                          <button key={bgC.id} onClick={() => { setBgColor(bgC.value); setBgImage(null); }} className={`relative py-3 px-2 rounded-[1.25rem] border flex flex-col items-center justify-center gap-2.5 text-[11px] text-center leading-tight font-bold transition-all group ${bgColor === bgC.value && !bgImage ? "border-neutral-900 ring-1 ring-neutral-900 bg-white text-neutral-900 shadow-md" : "border-neutral-900/10 bg-white/50 text-neutral-600 hover:border-neutral-900/30 hover:bg-white"}`}>
                            <div className="w-7 h-7 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-black/10 group-hover:scale-110 transition-transform" style={{ backgroundColor: bgC.value }}></div>
                            <span>{bgC.label}</span>
                          </button>
                        ))}
                        <label className={`relative py-3 px-2 rounded-[1.25rem] border flex flex-col items-center justify-center gap-2.5 text-[11px] text-center leading-tight font-bold transition-all group cursor-pointer ${!PVC_BACKGROUND_COLORS.some(bgC => bgC.value === bgColor) && !bgImage ? "border-neutral-900 ring-1 ring-neutral-900 bg-white text-neutral-900 shadow-md" : "border-neutral-900/10 bg-white/50 text-neutral-600 hover:border-neutral-900/30 hover:bg-white"}`}>
                          <div className="w-7 h-7 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-black/10 group-hover:scale-110 transition-transform bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </div>
                          <span>Custom Color</span>
                          <input type="color" className="absolute opacity-0 w-0 h-0" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setBgImage(null); }} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-4 pl-1 pr-1">
                        <div className="flex items-center gap-2">
                          <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                            Card Background
                          </label>
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">+ LKR 500</span>
                        </div>
                        {bgImage && (
                          <button onClick={() => setBgImage(null)} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider transition-colors">
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {PVC_BACKGROUNDS.map((bg) => (
                          <button key={bg.id} onClick={() => setBgImage(bg.url)} className={`relative h-14 rounded-xl border overflow-hidden transition-all group ${bgImage === bg.url ? "border-neutral-900 ring-2 ring-neutral-900 shadow-md" : "border-neutral-900/10 hover:border-neutral-900/40"}`}>
                            <img src={bg.url} alt={bg.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </button>
                        ))}
                      </div>
                      <label className="relative flex items-center justify-center w-full py-3 px-4 rounded-[1.25rem] border border-dashed border-neutral-900/20 bg-white/40 hover:bg-white text-xs font-bold text-neutral-600 transition-colors cursor-pointer group">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <span className="group-hover:text-neutral-900 transition-colors">Upload Custom Image</span>
                      </label>
                      {bgImage && (
                        <div className="mt-5 px-1 bg-white/40 p-4 rounded-2xl border border-neutral-900/5">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                              Overlay Darkness
                            </label>
                            <span className="text-[10px] font-bold text-neutral-500">{overlayOpacity}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="90" 
                            value={overlayOpacity} 
                            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900" 
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            {activeTab === "details" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 pl-1">
                    Typography Style
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {CARD_FONTS.map((font) => (
                      <button key={font.id} onClick={() => setFontStyle(font)} className={`relative py-3 px-2 rounded-[1.25rem] border flex items-center justify-center text-[11px] font-bold transition-all group ${fontStyle.id === font.id ? "border-neutral-900 ring-1 ring-neutral-900 bg-white text-neutral-900 shadow-md" : "border-neutral-900/10 bg-white/50 text-neutral-600 hover:border-neutral-900/30 hover:bg-white"} ${font.value}`}>
                        {font.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative group">
                  <label className="absolute -top-2.5 left-4 bg-white/80 backdrop-blur-md px-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] rounded">Cardholder Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value.toUpperCase())} className="w-full px-5 py-4 bg-white/60 border border-neutral-900/10 rounded-[1.25rem] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300 shadow-sm" placeholder="e.g. JOHN DOE" />
                </div>
                <div className="relative group">
                  <label className="absolute -top-2.5 left-4 bg-white/80 backdrop-blur-md px-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] rounded">Official Title</label>
                  <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value.toUpperCase())} className="w-full px-5 py-4 bg-white/60 border border-neutral-900/10 rounded-[1.25rem] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300 shadow-sm" placeholder="e.g. CHIEF ARCHITECT" />
                </div>
                <div className="relative group">
                  <label className="absolute -top-2.5 left-4 bg-white/80 backdrop-blur-md px-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] rounded">Email (Optional)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-white/60 border border-neutral-900/10 rounded-[1.25rem] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300 shadow-sm" placeholder="e.g. john@tagit.com" />
                </div>
                <div className="relative group">
                  <label className="absolute -top-2.5 left-4 bg-white/80 backdrop-blur-md px-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] rounded">Mobile No (Optional)</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-5 py-4 bg-white/60 border border-neutral-900/10 rounded-[1.25rem] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300 shadow-sm" placeholder="e.g. +1 (555) 123-4567" />
                </div>
                <div className="relative group">
                  <label className="absolute -top-2.5 left-4 bg-white/80 backdrop-blur-md px-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] rounded">Web Address (Optional)</label>
                  <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-5 py-4 bg-white/60 border border-neutral-900/10 rounded-[1.25rem] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all text-neutral-900 font-bold placeholder-neutral-300 shadow-sm" placeholder="e.g. www.tagit.com" />
                </div>
              </motion.div>
            )}
          </div>
          <div className="p-4 shrink-0 mt-auto bg-transparent z-10 pt-2">
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-2xl p-2 pl-6 rounded-[1.75rem] border border-neutral-900/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-0.5">Total Investment</p>
                <p className="text-xl font-bold text-neutral-900 tracking-tight">LKR {totalPrice.toLocaleString()}</p>
              </div>
              <button onClick={() => setIsCheckoutMode(true)} className="px-8 py-4 rounded-2xl font-black text-white uppercase tracking-[0.15em] text-xs bg-neutral-900 hover:bg-black shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                Finalize Design
              </button>
            </div>
          </div>
              </motion.div>
            ) : (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full min-h-0"
              >
                <div className="p-6 lg:p-8 pb-4 shrink-0 flex items-center justify-between border-b border-neutral-900/5">
                  <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Order Summary</h2>
                  <button onClick={() => setIsCheckoutMode(false)} className="w-10 h-10 rounded-full bg-neutral-900/5 flex items-center justify-center hover:bg-neutral-900/10 transition-colors">
                    <svg className="w-5 h-5 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                </div>

                <div className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col justify-center space-y-6">
                  {/* Premium Receipt Card */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-neutral-900/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-neutral-900 to-neutral-700"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col">
                        <span className="text-neutral-900 font-black text-xl tracking-tight">{productName}</span>
                        <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Premium NFC Card</span>
                      </div>
                      <span className="font-black text-lg text-neutral-900">LKR {basePrice.toLocaleString()}</span>
                    </div>

                    {customBgPrice > 0 && (
                      <div className="flex justify-between items-center mb-6 p-4 rounded-2xl bg-neutral-900/5 border border-neutral-900/5">
                        <div className="flex flex-col">
                          <span className="text-neutral-900 font-bold text-sm">Custom Background</span>
                          <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Premium Add-on</span>
                        </div>
                        <span className="font-bold text-sm text-neutral-900">LKR {customBgPrice.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="w-full border-t border-dashed border-neutral-200 my-6"></div>
                    
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Total Investment</span>
                        <span className="text-neutral-900 font-black text-4xl tracking-tighter leading-none">LKR {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Value Prop */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm tracking-wide mb-1">Free Lifetime Software</h4>
                      <p className="text-emerald-50 text-xs font-medium leading-relaxed opacity-90">Includes powerful digital profile management with absolutely zero monthly fees forever.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 lg:p-8 pt-4 shrink-0 bg-white/80 backdrop-blur-xl border-t border-neutral-900/5 space-y-3">
                  <button onClick={handleBuyNow} disabled={isSaving} className="w-full bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white py-5 rounded-2xl font-black tracking-[0.15em] uppercase text-xs transition-all shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] active:translate-y-0 flex items-center justify-center gap-3 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    {isSaving ? "Saving..." : "Buy Now"}
                    {!isSaving && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                  </button>
                  <button onClick={handleAddToCart} disabled={isSaving} className="w-full bg-white disabled:opacity-50 border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-neutral-900 py-4 rounded-2xl font-black tracking-[0.15em] uppercase text-xs transition-all flex items-center justify-center gap-3">
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

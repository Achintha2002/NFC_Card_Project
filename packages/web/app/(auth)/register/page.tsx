"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Lock, Mail, User, AtSign, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const DynamicGoogleLoginButton = dynamic(
  () => import("../../../components/GoogleLoginButton").then((m) => m.GoogleLoginButton),
  { ssr: false }
);

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithApple } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAppleClick = async (forceDemo = false) => {
    if (forceDemo) {
      setIsSubmitting(true);
      setError(null);
      const res = await loginWithApple("mock_apple_token_" + Date.now());
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => router.push("/products"), 700);
      } else {
        setError(res.error || "Apple demo signup failed.");
        setIsSubmitting(false);
      }
      return;
    }

    // Check if real Apple ID script is loaded on window
    if (typeof window !== "undefined" && (window as any).AppleID && (window as any).AppleID.auth) {
      try {
        await (window as any).AppleID.auth.init({
          clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "cards.tagit.web",
          scope: "name email",
          redirectURI: window.location.origin + "/login",
          usePopup: true,
        });
        const data = await (window as any).AppleID.auth.signIn();
        if (data && data.authorization && data.authorization.id_token) {
          setIsSubmitting(true);
          setError(null);
          const res = await loginWithApple(data.authorization.id_token, data.user);
          if (res.success) {
            setIsSuccess(true);
            setTimeout(() => router.push("/products"), 700);
          } else {
            setError(res.error || "Apple sign-in failed.");
            setIsSubmitting(false);
          }
          return;
        }
      } catch {
        setError("Real Apple ID popup closed or Client ID not configured. To authenticate with live Apple ID, set NEXT_PUBLIC_APPLE_CLIENT_ID in .env.local.");
        return;
      }
    } else {
      setError("Apple Sign-In SDK loading... Please check internet connection and try again.");
    }
  };

  // Password requirement checks
  const reqMinLength = password.length >= 8;
  const reqUppercase = /[A-Z]/.test(password);
  const reqNumber = /[0-9]/.test(password);
  const isPasswordValid = reqMinLength && reqUppercase && reqNumber;

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!displayName || !username || !email || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your password meets all requirements below.");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await register({
      displayName: displayName.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
    });

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/products");
      }, 700);
    } else {
      setError(result.error || "Could not create account. Username or email may already exist.");
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      {/* Header — compact for zero-scroll */}
      <div className="mb-4 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 mb-1">
          Create your account
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-neutral-600">
          Set up your digital presence in under a minute and start tapping.
        </p>
      </div>

      {/* Error / Success Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="mb-3 p-3 rounded-xl bg-rose-50 border-2 border-rose-200 flex items-start gap-2.5 text-rose-900 text-xs shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-black block text-rose-950">Registration Error</span>
              <span className="font-semibold text-rose-800">{error}</span>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-3 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-xs shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="font-black text-emerald-950">Account created! Redirecting...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form — tight compact spacing */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row 1: Side-by-Side Display Name & Username (2 columns on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-[11px] font-black uppercase tracking-wider text-neutral-800 mb-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-rose-600 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                disabled={isSubmitting || isSuccess}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border-2 border-neutral-200 hover:border-neutral-300 text-neutral-950 placeholder-neutral-400 text-xs font-bold shadow-2xs focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Choose Username */}
          <div>
            <label htmlFor="username" className="block text-[11px] font-black uppercase tracking-wider text-neutral-800 mb-1">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-rose-600 transition-colors">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={handleUsernameChange}
                placeholder="alexmorgan"
                disabled={isSubmitting || isSuccess}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border-2 border-neutral-200 hover:border-neutral-300 text-neutral-950 placeholder-neutral-400 text-xs font-bold shadow-2xs focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all disabled:opacity-50 font-mono"
              />
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-600 pl-0.5 truncate">
              <span>URL:</span>
              <span className="text-rose-700 font-black bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate">
                tagit.cards/p/{username || "user"}
              </span>
            </div>
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="email" className="block text-[11px] font-black uppercase tracking-wider text-neutral-800 mb-1">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-rose-600 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              disabled={isSubmitting || isSuccess}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border-2 border-neutral-200 hover:border-neutral-300 text-neutral-950 placeholder-neutral-400 text-xs font-bold shadow-2xs focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-wider text-neutral-800 mb-1">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-rose-600 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              disabled={isSubmitting || isSuccess}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border-2 border-neutral-200 hover:border-neutral-300 text-neutral-950 placeholder-neutral-400 text-xs font-bold shadow-2xs focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting || isSuccess}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-800 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Ultra-Compact Horizontal Password Requirements Checklist */}
          <div className="mt-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 shadow-2xs grid grid-cols-3 gap-1 text-[10px] font-bold">
            <div className={`flex items-center justify-center gap-1 ${reqMinLength ? "text-emerald-700 font-black" : "text-neutral-500 font-semibold"}`}>
              {reqMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
              <span className="truncate">8+ chars</span>
            </div>
            <div className={`flex items-center justify-center gap-1 ${reqUppercase ? "text-emerald-700 font-black" : "text-neutral-500 font-semibold"}`}>
              {reqUppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
              <span className="truncate">1 uppercase</span>
            </div>
            <div className={`flex items-center justify-center gap-1 ${reqNumber ? "text-emerald-700 font-black" : "text-neutral-500 font-semibold"}`}>
              {reqNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
              <span className="truncate">1 number</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isSuccess || !isPasswordValid}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Account Created!
            </>
          ) : (
            <>
              Create Your TAGIT Card <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-black">
          <span className="bg-white lg:bg-[#FCFCFD] px-3 text-neutral-400 tracking-wider">Or 1-Click Social Sign Up</span>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-1 gap-3">
        <DynamicGoogleLoginButton
          onStart={() => {
            setIsSubmitting(true);
            setError(null);
          }}
          onSuccess={() => {
            setIsSuccess(true);
          }}
          onError={(msg) => {
            setError(msg);
            setIsSubmitting(false);
          }}
          disabled={isSubmitting || isSuccess}
        />
      </div>

      {/* Footer Login Switch */}
      <div className="mt-3 pt-2.5 border-t border-neutral-200 text-center">
        <p className="text-xs font-semibold text-neutral-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-neutral-950 font-black hover:text-rose-600 transition-colors inline-flex items-center gap-1"
          >
            Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

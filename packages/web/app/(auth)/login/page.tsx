"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Lock, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const DynamicGoogleLoginButton = dynamic(
  () => import("../../../components/GoogleLoginButton").then((m) => m.GoogleLoginButton),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithApple } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        setError(res.error || "Apple demo login failed.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await login({ email: email.trim(), password });

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/products");
      }, 700);
    } else {
      setError(result.error || "Invalid credentials. Please try again.");
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
      {/* Header */}
      <div className="mb-5 text-center sm:text-left">
        <h1 className="text-3xl font-black tracking-tight text-neutral-950 mb-1.5">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-neutral-600">
          Sign in to access your digital NFC card dashboard and analytics.
        </p>
      </div>

      {/* Error Alert Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="mb-4 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-200 flex items-start gap-2.5 text-rose-900 text-xs shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-black block text-rose-950 text-xs">Authentication Failed</span>
              <span className="font-semibold text-rose-800">{error}</span>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-xs shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="font-black text-emerald-950">Login successful! Redirecting...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-[11px] font-black uppercase tracking-wider text-neutral-800 mb-1.5">
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
              placeholder="you@company.com"
              disabled={isSubmitting || isSuccess}
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white border-2 border-neutral-200 hover:border-neutral-300 text-neutral-950 placeholder-neutral-400 text-xs font-bold shadow-2xs focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-wider text-neutral-800">
              Password
            </label>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Please contact support@tagit.cards to reset your password or use the mobile app.");
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 transition-colors font-extrabold"
            >
              Forgot password?
            </Link>
          </div>
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
              placeholder="••••••••••••"
              disabled={isSubmitting || isSuccess}
              className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border-2 border-neutral-200 hover:border-neutral-300 text-neutral-950 placeholder-neutral-400 text-xs font-bold shadow-2xs focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all disabled:opacity-50"
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
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-neutral-300 bg-white text-rose-600 focus:ring-rose-500/20 focus:ring-offset-0 transition-colors cursor-pointer"
            />
            Remember me on this device
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none mt-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing you in...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Redirecting...
            </>
          ) : (
            <>
              Sign In to TAGIT <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase font-black">
          <span className="bg-white lg:bg-[#FCFCFD] px-3 text-neutral-400 tracking-wider">Or continue with</span>
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

      {/* Footer Register Switch */}
      <div className="mt-5 pt-4 border-t border-neutral-200 text-center">
        <p className="text-xs font-semibold text-neutral-600">
          Don&apos;t have a TAGIT card account yet?{" "}
          <Link
            href="/register"
            className="text-neutral-950 font-black hover:text-rose-600 transition-colors inline-flex items-center gap-1"
          >
            Create an Account <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

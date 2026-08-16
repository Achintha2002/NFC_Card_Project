"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Smartphone,
  Building2,
  Briefcase,
  Globe,
  FileText,
  Calendar,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  Download,
  Key,
  CreditCard,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/api";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Theme State (Default: light mode to match NFC Studio Customizer & Homepage)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED" | "STEALTH">("ACTIVE");

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form when user loads
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/profile");
      return;
    }
    if (user?.profile) {
      setDisplayName(user.profile.displayName || "");
      setUsername(user.profile.username || "");
      setBio(user.profile.bio || "");
      setPhone(user.profile.phone || "");
      setPublicEmail(user.profile.email || "");
      setCompany(user.profile.company || "");
      setJobTitle(user.profile.jobTitle || "");
      setWebsite(user.profile.website || "");
      setStatus(user.profile.status || "ACTIVE");
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === "light" ? "bg-neutral-50 text-neutral-900" : "bg-neutral-950 text-white"} flex items-center justify-center transition-colors`}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-sm font-medium opacity-80">Loading User Account & Profile Data...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      // 1. Instant update for standard fields
      await apiClient.patch("/profile/instant", {
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        email: publicEmail.trim() || undefined,
        company: company.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        website: website.trim() || undefined,
      });

      // 2. If displayName changed, trigger moderated patch
      if (user.profile?.displayName !== displayName.trim() && displayName.trim().length >= 2) {
        await apiClient.patch("/profile/moderated", {
          displayName: displayName.trim(),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to update profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Privacy Toggle
  const handleTogglePrivacy = async () => {
    setIsTogglingPrivacy(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.patch("/profile/privacy");
      if (res.data?.data?.status) {
        setStatus(res.data.data.status);
      } else {
        setStatus(status === "ACTIVE" ? "STEALTH" : "ACTIVE");
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || "Failed to toggle privacy status.");
    } finally {
      setIsTogglingPrivacy(false);
    }
  };

  // Format Join Date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not Recorded";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen ${
        isLight ? "bg-neutral-50 text-neutral-950" : "bg-neutral-950 text-neutral-100"
      } flex flex-col font-sans selection:bg-rose-500/30 selection:text-white relative overflow-hidden transition-colors duration-300`}
    >
      {/* Background Ambient Glows */}
      <div
        className={`absolute top-[-15%] left-[-10%] w-[45vw] h-[45vw] rounded-full blur-[140px] pointer-events-none transition-all ${
          isLight ? "bg-rose-500/10" : "bg-rose-600/15"
        }`}
      />
      <div
        className={`absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[140px] pointer-events-none transition-all ${
          isLight ? "bg-orange-400/10" : "bg-amber-600/15"
        }`}
      />

      {/* ── Top Luxury Navigation Bar ── */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-colors duration-300 ${
          isLight
            ? "bg-white/80 border-neutral-200/80 text-neutral-900 shadow-sm"
            : "bg-neutral-950/80 border-neutral-800/80 text-white"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2.5 transition-colors group px-3.5 py-2 rounded-xl font-semibold text-sm border ${
                isLight
                  ? "text-neutral-600 hover:text-neutral-950 bg-white hover:bg-neutral-100 border-neutral-200/80 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent hover:border-neutral-800"
              }`}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <div className={`h-6 w-px hidden sm:block ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
            <h1 className="text-lg font-bold tracking-tight">
              User Profile & Account Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(isLight ? "dark" : "light")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${
                isLight
                  ? "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                  : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200"
              }`}
              title="Toggle Light / Dark Mode"
            >
              {isLight ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Dark Mode</span>
                </>
              )}
            </button>

            <Link
              href="/customize"
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border shadow-sm ${
                isLight
                  ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white"
                  : "bg-neutral-900 border-neutral-800 hover:border-rose-500/50 text-neutral-300 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              NFC Studio Customizer
            </Link>

            {username && (
              <Link
                href={`/p/${username}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20 active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Public Card
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Layout ── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Left Sidebar: Account Identity & Status Card ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className={`rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden transition-all duration-300 border ${
                isLight
                  ? "bg-white/95 border-neutral-200/80 shadow-xl shadow-neutral-200/60"
                  : "bg-neutral-900/90 border-neutral-800/80 shadow-2xl"
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-rose-500/15 via-orange-500/15 to-amber-500/15 border-b ${
                  isLight ? "border-neutral-100" : "border-neutral-800/50"
                }`}
              />
              
              {/* Profile Avatar */}
              <div className="relative pt-12 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 p-[2px] shadow-xl mb-4">
                  <div
                    className={`w-full h-full rounded-3xl flex items-center justify-center overflow-hidden ${
                      isLight ? "bg-white text-neutral-900" : "bg-neutral-950 text-white"
                    }`}
                  >
                    {user.profile?.profilePicture ? (
                      <img
                        src={user.profile.profilePicture}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black bg-gradient-to-tr from-rose-500 to-amber-500 bg-clip-text text-transparent">
                        {(user.profile?.displayName || user.email || "U").substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className={`text-2xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                  {user.profile?.displayName || user.email.split("@")[0]}
                </h2>
                <p className="text-sm font-medium text-rose-500 mt-1 font-mono">
                  @{username || "user"}
                </p>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      isLight
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-800"
                        : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300"
                    }`}
                  >
                    <Shield className="w-3 h-3 text-amber-500" />
                    Role: {user.role || "USER"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      isLight
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-800"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    <CreditCard className="w-3 h-3 text-rose-500" />
                    Tier: {user.subscriptionTier}
                  </span>
                </div>
              </div>

              <div className={`border-t my-6 ${isLight ? "border-neutral-200/80" : "border-neutral-800/80"}`} />

              {/* Account Metrics & Sign-up Details */}
              <div className="space-y-3.5 text-sm">
                <div
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200/80 text-neutral-800"
                      : "bg-neutral-950/60 border-neutral-800/60 text-neutral-200"
                  }`}
                >
                  <span className={`flex items-center gap-2 ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                    <Calendar className="w-4 h-4 text-neutral-500" /> Join Date:
                  </span>
                  <span className="font-semibold">{formatDate(user.createdAt)}</span>
                </div>

                <div
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200/80 text-neutral-800"
                      : "bg-neutral-950/60 border-neutral-800/60 text-neutral-200"
                  }`}
                >
                  <span className={`flex items-center gap-2 ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                    <Key className="w-4 h-4 text-neutral-500" /> Auth Provider:
                  </span>
                  <span className="font-semibold capitalize">
                    {user.authProvider || "Email & Password"}
                  </span>
                </div>

                <div
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200/80 text-neutral-800"
                      : "bg-neutral-950/60 border-neutral-800/60 text-neutral-200"
                  }`}
                >
                  <span className={`flex items-center gap-2 ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                    <Sparkles className="w-4 h-4 text-rose-500" /> Total NFC Taps:
                  </span>
                  <span className="font-bold text-rose-500 text-base">{user.profile?.tapCount || 0}</span>
                </div>
              </div>

              {/* Privacy Toggle Action */}
              <div className={`mt-6 pt-6 border-t flex flex-col gap-3 ${isLight ? "border-neutral-200/80" : "border-neutral-800/80"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                    Public Profile Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      status === "STEALTH"
                        ? "bg-amber-500/20 text-amber-600 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                    }`}
                  >
                    {status === "STEALTH" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {status === "STEALTH" ? "Stealth / Hidden" : "Active / Visible"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePrivacy}
                  disabled={isTogglingPrivacy}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isLight
                      ? "border-neutral-300 hover:border-neutral-400 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 shadow-sm"
                      : "border-neutral-700 hover:border-neutral-500 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-200"
                  }`}
                >
                  {isTogglingPrivacy ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
                  ) : status === "STEALTH" ? (
                    <Eye className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-amber-500" />
                  )}
                  {status === "STEALTH" ? "Make Profile Public (Active)" : "Switch to Stealth (Hidden)"}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 flex flex-col gap-2.5">
                {/* Portfolio CTA */}
                {(user.subscriptionTier === 'PREMIUM' || user.subscriptionTier === 'CORPORATE') ? (
                  <Link
                    href="/portfolio"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    Edit Executive Portfolio
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
                      isLight
                        ? "border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                        : "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Unlock Portfolio Website
                  </Link>
                )}

                {username && (
                  <a
                    href={`/api/v1/profile/${username}/vcard`}
                    download
                    className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
                      isLight
                        ? "border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-800"
                        : "border-neutral-800 hover:border-neutral-700 bg-neutral-950/80 text-neutral-300 hover:text-white"
                    }`}
                  >
                    <Download className="w-4 h-4 text-rose-500" />
                    Download vCard (.vcf)
                  </a>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Account
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Column: Sign-Up Data & Profile Details Form ── */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Account Credentials & Registration Data Card (Read-Only Security Section) */}
            <div
              className={`rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 border ${
                isLight
                  ? "bg-white/95 border-neutral-200/80 shadow-xl shadow-neutral-200/60"
                  : "bg-neutral-900/90 border-neutral-800/80 shadow-2xl"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Account & Sign-Up Credentials
                  </h3>
                  <p className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                    Security details established when your account was registered.
                  </p>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border ${
                  isLight
                    ? "bg-neutral-50/90 border-neutral-200/80"
                    : "bg-neutral-950/60 border-neutral-800/60"
                }`}
              >
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
                    Registered Email Address (Login ID)
                  </label>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-mono text-sm select-all ${
                      isLight
                        ? "bg-white border-neutral-200 text-neutral-800 shadow-sm"
                        : "bg-neutral-900 border-neutral-800 text-neutral-300"
                    }`}
                  >
                    <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Used for authentication, notifications, and security recovery.
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
                    NFC Profile Username (Unique ID)
                  </label>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-mono text-sm ${
                      isLight
                        ? "bg-white border-neutral-200 text-neutral-800 shadow-sm"
                        : "bg-neutral-900 border-neutral-800 text-neutral-300"
                    }`}
                  >
                    <span className="text-rose-500 font-bold shrink-0">tagit.lk/p/</span>
                    <span className={`truncate font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>{username}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Unique slug linked directly to your NFC chip identifier.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Editable Profile & Contact Form */}
            <form
              onSubmit={handleSaveProfile}
              className={`rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 border space-y-6 ${
                isLight
                  ? "bg-white/95 border-neutral-200/80 shadow-xl shadow-neutral-200/60"
                  : "bg-neutral-900/90 border-neutral-800/80 shadow-2xl"
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-6 ${isLight ? "border-neutral-200/80" : "border-neutral-800/80"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                      Public Profile Information
                    </h3>
                    <p className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                      Update the personal and contact data displayed on your public NFC tap page.
                    </p>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile Updated!
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Display Name */}
                <div className="md:col-span-2">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    Display Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors shadow-sm ${
                        isLight
                          ? "bg-neutral-50/80 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white"
                          : "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-rose-500"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    This name is highlighted at the top of your digital business card.
                  </p>
                </div>

                {/* Bio / Elevator Pitch */}
                <div className="md:col-span-2">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    Professional Bio / Elevator Pitch
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-4 top-3.5 text-neutral-400" />
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share what you do, your achievements, or your company vision..."
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors resize-none shadow-sm ${
                        isLight
                          ? "bg-neutral-50/80 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white"
                          : "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-rose-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Public Phone Number */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    Public Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors shadow-sm ${
                        isLight
                          ? "bg-neutral-50/80 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white"
                          : "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-rose-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Public Contact Email */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    Public Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      value={publicEmail}
                      onChange={(e) => setPublicEmail(e.target.value)}
                      placeholder="contact@company.com"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors shadow-sm ${
                        isLight
                          ? "bg-neutral-50/80 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white"
                          : "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-rose-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="TAGIT Smart Solutions"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors shadow-sm ${
                        isLight
                          ? "bg-neutral-50/80 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white"
                          : "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-rose-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    Job Title / Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Chief Executive Officer"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors shadow-sm ${
                        isLight
                          ? "bg-neutral-50/80 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white"
                          : "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-rose-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="md:col-span-2">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    Primary Website / Portfolio URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.tagit.lk"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors font-mono shadow-sm ${
                        isLight
                          ? "bg-neutral-50/80 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white"
                          : "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-rose-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`pt-6 border-t flex items-center justify-end gap-4 ${isLight ? "border-neutral-200/80" : "border-neutral-800/80"}`}>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className={`px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${
                    isLight
                      ? "border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900 bg-white"
                      : "border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:shadow-rose-500/35 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Save Account & Profile
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>

        </div>
      </main>
    </div>
  );
}

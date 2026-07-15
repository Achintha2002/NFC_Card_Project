"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  ExternalLink,
  RefreshCw,
  Clock,
  Activity,
  Globe2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { apiClient, ApiResponse } from "@/services/api";

interface AnalyticsDashboardProps {
  theme?: "light" | "dark";
}

interface AnalyticsData {
  summary: {
    totalTaps: number;
    totalLinkClicks: number;
    clickThroughRate: number;
    uniqueVisitors: number;
  };
  tapsByDevice: Array<{ device: string; count: number; percentage: number }>;
  tapsByLocation: Array<{ location: string; country: string; city: string; count: number; percentage: number }>;
  activityOverTime: Array<{ date: string; taps: number; clicks: number }>;
  topClickedLinks: Array<{ id: string; platform: string; label: string; url: string; clickCount: number; isActive: boolean }>;
  recentActivity: Array<{
    id: string;
    type: "TAP" | "CLICK";
    timestamp: string;
    location: string;
    device: string;
    browser: string;
    os: string;
    detail: string;
  }>;
}

export function AnalyticsDashboard({ theme = "light" }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "links" | "activity">("overview");

  const isLight = theme === "light";

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ApiResponse<AnalyticsData>>("/profile/analytics");
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      } else {
        throw new Error(res.data.message || res.data.error || "Could not load analytics data.");
      }
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || "Could not load analytics data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading && !data) {
    return (
      <div
        className={`w-full rounded-3xl p-12 flex flex-col items-center justify-center gap-4 border transition-colors ${
          isLight
            ? "bg-white/95 border-neutral-200 shadow-xl"
            : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
        }`}
      >
        <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
        <p className={`text-sm font-semibold ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
          Aggregating Full-Granularity NFC Taps & Click Analytics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={`w-full rounded-3xl p-8 border transition-colors ${
          isLight ? "bg-white/95 border-neutral-200 shadow-xl" : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
        }`}
      >
        <div className="flex items-center gap-3 text-rose-500 font-bold mb-2">
          <AlertCircle className="w-5 h-5" />
          <span>Error Loading Analytics</span>
        </div>
        <p className={`text-sm mb-4 ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>{error}</p>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-600 transition-colors shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Aggregation
        </button>
      </div>
    );
  }

  const { summary, tapsByDevice, tapsByLocation, activityOverTime, topClickedLinks, recentActivity } = data;

  // Maximum value for time series bars
  const maxActivity = Math.max(1, ...activityOverTime.map((a) => Math.max(a.taps, a.clicks)));

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in-up">
      {/* Top Header & Refresh Bar */}
      <div
        className={`rounded-3xl p-6 backdrop-blur-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isLight
            ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/60"
            : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-black tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
              Full-Granularity Analytics Intelligence
            </h2>
            <p className={`text-xs font-medium ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
              Real-time NFC card taps, geolocations, device metrics, & link performance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Sub-tab navigation */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isLight ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950 border-neutral-800"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveSubTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === "overview"
                  ? isLight
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "bg-neutral-800 text-white shadow-sm"
                  : isLight
                  ? "text-neutral-600 hover:text-neutral-900"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("links")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === "links"
                  ? isLight
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "bg-neutral-800 text-white shadow-sm"
                  : isLight
                  ? "text-neutral-600 hover:text-neutral-900"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Links ({topClickedLinks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("activity")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === "activity"
                  ? isLight
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "bg-neutral-800 text-white shadow-sm"
                  : isLight
                  ? "text-neutral-600 hover:text-neutral-900"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Live Feed
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border transition-all ${
              isLight
                ? "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            }`}
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── 4 KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Total Taps */}
        <div
          className={`rounded-3xl p-6 backdrop-blur-xl border transition-all relative overflow-hidden ${
            isLight
              ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
              : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
              Total NFC Taps
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isLight ? "text-neutral-900" : "text-white"}`}>
            {summary.totalTaps.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Profile views tracked</span>
          </div>
        </div>

        {/* Card 2: Total Link Clicks */}
        <div
          className={`rounded-3xl p-6 backdrop-blur-xl border transition-all relative overflow-hidden ${
            isLight
              ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
              : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
              Total Link Clicks
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isLight ? "text-neutral-900" : "text-white"}`}>
            {summary.totalLinkClicks.toLocaleString()}
          </div>
          <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
            <span>Interaction actions recorded</span>
          </div>
        </div>

        {/* Card 3: Click-Through Rate */}
        <div
          className={`rounded-3xl p-6 backdrop-blur-xl border transition-all relative overflow-hidden ${
            isLight
              ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
              : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
              Click-Through Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isLight ? "text-neutral-900" : "text-white"}`}>
            {summary.clickThroughRate}%
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-500">
            <span>Overall conversion efficiency</span>
          </div>
        </div>

        {/* Card 4: Unique Visitors */}
        <div
          className={`rounded-3xl p-6 backdrop-blur-xl border transition-all relative overflow-hidden ${
            isLight
              ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
              : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
              Unique Visitors
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isLight ? "text-neutral-900" : "text-white"}`}>
            {summary.uniqueVisitors.toLocaleString()}
          </div>
          <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
            <span>Distinct IP networks tracked</span>
          </div>
        </div>
      </div>

      {/* ── Subtab: Overview (Charts & Breakdowns) ── */}
      {activeSubTab === "overview" && (
        <>
          {/* Time Series Chart */}
          <div
            className={`rounded-3xl p-6 backdrop-blur-xl border transition-all ${
              isLight
                ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
                : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className={`text-base font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                  30-Day Activity Trend
                </h3>
                <p className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                  Daily profile views (Taps) compared to link clicks over the last month.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" /> NFC Taps
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" /> Link Clicks
                </span>
              </div>
            </div>

            {/* Custom Bar Chart Grid */}
            <div className="h-56 flex items-end justify-between gap-1 pt-6 px-2 border-b border-neutral-200/50 dark:border-neutral-800/50 overflow-x-auto pb-2">
              {activityOverTime.map((item, idx) => {
                const tapHeight = Math.max(8, (item.taps / maxActivity) * 180);
                const clickHeight = Math.max(6, (item.clicks / maxActivity) * 180);
                const shortDate = item.date.slice(5); // MM-DD

                return (
                  <div key={item.date} className="flex flex-col items-center flex-1 min-w-[20px] group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 bg-neutral-900 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap pointer-events-none">
                      <span className="font-bold text-neutral-300">{item.date}</span>
                      <span className="text-rose-400 font-semibold">Taps: {item.taps}</span>
                      <span className="text-amber-400 font-semibold">Clicks: {item.clicks}</span>
                    </div>

                    <div className="flex items-end justify-center gap-0.5 w-full">
                      {/* Taps Bar */}
                      <div
                        style={{ height: `${tapHeight}px` }}
                        className="w-2.5 sm:w-3 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm group-hover:opacity-80 transition-all"
                      />
                      {/* Clicks Bar */}
                      <div
                        style={{ height: `${clickHeight}px` }}
                        className="w-2.5 sm:w-3 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm group-hover:opacity-80 transition-all"
                      />
                    </div>
                    {/* Date label (show every 5th day on small screens) */}
                    {(idx % 5 === 0 || idx === activityOverTime.length - 1) && (
                      <span className={`text-[9px] font-bold mt-2 ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                        {shortDate}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device Breakdown & Locations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Devices */}
            <div
              className={`rounded-3xl p-6 backdrop-blur-xl border transition-all flex flex-col justify-between ${
                isLight
                  ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
                  : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                      Device Breakdown
                    </h3>
                    <p className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                      NFC card readers and browsers categorized by hardware type.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {tapsByDevice.length === 0 ? (
                    <p className="text-xs italic text-neutral-400 py-4 text-center">No device data recorded yet.</p>
                  ) : (
                    tapsByDevice.map((device) => {
                      const Icon = device.device === "Mobile" ? Smartphone : device.device === "Tablet" ? Tablet : Monitor;
                      return (
                        <div key={device.device} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-rose-500" />
                              <span className={isLight ? "text-neutral-800" : "text-neutral-200"}>{device.device}</span>
                            </span>
                            <span className={isLight ? "text-neutral-900" : "text-white"}>
                              {device.count.toLocaleString()} taps ({device.percentage}%)
                            </span>
                          </div>
                          <div className={`w-full h-2.5 rounded-full overflow-hidden ${isLight ? "bg-neutral-100" : "bg-neutral-800"}`}>
                            <div
                              style={{ width: `${Math.max(5, device.percentage)}%` }}
                              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Geographic Locations */}
            <div
              className={`rounded-3xl p-6 backdrop-blur-xl border transition-all flex flex-col justify-between ${
                isLight
                  ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
                  : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                      Top Geographic Locations
                    </h3>
                    <p className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                      City and country resolution of card readers (anonymized IP).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                  {tapsByLocation.length === 0 ? (
                    <p className="text-xs italic text-neutral-400 py-4 text-center">No location data recorded yet.</p>
                  ) : (
                    tapsByLocation.map((loc) => (
                      <div key={loc.location} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className={`truncate max-w-[180px] ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                              {loc.location}
                            </span>
                          </span>
                          <span className={isLight ? "text-neutral-900" : "text-white"}>
                            {loc.count.toLocaleString()} ({loc.percentage}%)
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? "bg-neutral-100" : "bg-neutral-800"}`}>
                          <div
                            style={{ width: `${Math.max(4, loc.percentage)}%` }}
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Subtab: Links Performance Table ── */}
      {activeSubTab === "links" && (
        <div
          className={`rounded-3xl p-6 backdrop-blur-xl border transition-all ${
            isLight
              ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
              : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                Link Click Performance Matrix
              </h3>
              <p className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                Detailed ranking of every link on your profile by conversion volume.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-xs uppercase font-extrabold tracking-wider ${
                    isLight ? "border-neutral-200 text-neutral-500" : "border-neutral-800 text-neutral-400"
                  }`}
                >
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Link Label / Platform</th>
                  <th className="py-3 px-4">Target URL</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-sm font-semibold">
                {topClickedLinks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs italic opacity-70">
                      No links created on this profile yet.
                    </td>
                  </tr>
                ) : (
                  topClickedLinks.map((link, idx) => (
                    <tr key={link.id} className="hover:bg-rose-500/5 transition-colors">
                      <td className="py-3.5 px-4 font-black text-rose-500">#{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-extrabold uppercase">
                            {link.platform}
                          </span>
                          <span className={isLight ? "text-neutral-900 font-bold" : "text-white font-bold"}>
                            {link.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-xs opacity-80">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 text-rose-500 truncate"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        {link.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-500/10 text-neutral-500 border border-neutral-500/20">
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-base">
                        {link.clickCount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Subtab: Real-time Live Activity Feed ── */}
      {activeSubTab === "activity" && (
        <div
          className={`rounded-3xl p-6 backdrop-blur-xl border transition-all ${
            isLight
              ? "bg-white/95 border-neutral-200 shadow-xl shadow-neutral-200/50"
              : "bg-neutral-900/90 border-neutral-800 shadow-2xl"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                Live Activity Stream (Last 25 Events)
              </h3>
              <p className={`text-xs ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                Real-time feed of taps and interactions captured with device and location tags.
              </p>
            </div>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Monitoring
            </span>
          </div>

          <div className="flex flex-col divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
            {recentActivity.length === 0 ? (
              <p className="text-xs italic text-neutral-400 py-8 text-center">No activity recorded yet.</p>
            ) : (
              recentActivity.map((event) => {
                const isTap = event.type === "TAP";
                const timeAgo = new Date(event.timestamp).toLocaleString();

                return (
                  <div
                    key={event.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-500/5 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                          isTap
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {isTap ? <Activity className="w-5 h-5" /> : <MousePointerClick className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded ${
                              isTap ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {event.type}
                          </span>
                          <span className={`text-sm font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                            {event.detail}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold opacity-80 flex-wrap">
                          <span className="flex items-center gap-1 text-amber-500">
                            <MapPin className="w-3.5 h-3.5" /> {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5" /> {event.device} ({event.os}; {event.browser})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold opacity-70 self-end sm:self-center">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

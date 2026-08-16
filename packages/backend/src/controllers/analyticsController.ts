// ============================================================
//  TAGIT — Analytics Controller
//  User-facing analytics for tap events and link clicks.
//  All endpoints are protected and scoped to the authenticated user's profile.
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/responseHelper';

// ── Helpers ───────────────────────────────────────────────────

/** Returns the start of the day N days ago as a Date */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================
//  GET /api/v1/analytics/taps
//  Returns tap analytics for the authenticated user's profile.
//  Supports ?days=7|30|90 query param.
// ============================================================

export async function getTapAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { profileId } = req.user!;
    const days = Math.min(Number(req.query.days ?? 30), 90);
    const since = daysAgo(days);

    const [totalTaps, recentTaps, profile] = await Promise.all([
      // Total all-time taps
      prisma.tapAnalytics.count({ where: { profileId } }),
      // Taps in selected period
      prisma.tapAnalytics.findMany({
        where: { profileId, tappedAt: { gte: since } },
        orderBy: { tappedAt: 'asc' },
        select: { tappedAt: true, deviceType: true, country: true, city: true, referrer: true },
      }),
      // Profile tap count (legacy counter)
      prisma.profile.findUnique({
        where: { id: profileId },
        select: { tapCount: true },
      }),
    ]);

    // Group taps by date for chart
    const tapsByDate: Record<string, number> = {};
    for (const tap of recentTaps) {
      const date = tap.tappedAt.toISOString().split('T')[0];
      tapsByDate[date] = (tapsByDate[date] ?? 0) + 1;
    }

    // Top countries
    const countryCount: Record<string, number> = {};
    for (const tap of recentTaps) {
      if (tap.country) countryCount[tap.country] = (countryCount[tap.country] ?? 0) + 1;
    }
    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Device breakdown
    const deviceCount: Record<string, number> = {};
    for (const tap of recentTaps) {
      deviceCount[tap.deviceType] = (deviceCount[tap.deviceType] ?? 0) + 1;
    }

    sendSuccess(res, {
      totalTaps,
      periodTaps: recentTaps.length,
      legacyTapCount: profile?.tapCount ?? 0,
      days,
      tapsByDate,
      topCountries,
      deviceBreakdown: deviceCount,
    });
  } catch (error) {
    console.error('getTapAnalytics error:', error);
    sendError(res, 'Failed to fetch tap analytics.', 500);
  }
}

// ============================================================
//  GET /api/v1/analytics/links
//  Returns link click analytics for the authenticated user's profile.
// ============================================================

export async function getLinkClickAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { profileId } = req.user!;
    const days = Math.min(Number(req.query.days ?? 30), 90);
    const since = daysAgo(days);

    // Get all links for this profile with their click counts
    const links = await prisma.link.findMany({
      where: { profileId },
      include: {
        clicks: {
          where: { clickedAt: { gte: since } },
          select: { clickedAt: true, deviceType: true, country: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const linkStats = links.map((link) => ({
      id: link.id,
      platform: link.platform,
      label: link.label,
      url: link.url,
      isActive: link.isActive,
      totalClicks: link.clicks.length,
      clicksByDate: link.clicks.reduce((acc, c) => {
        const date = c.clickedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    }));

    // Sort by click count descending for top links
    const topLinks = [...linkStats].sort((a, b) => b.totalClicks - a.totalClicks).slice(0, 5);

    sendSuccess(res, {
      days,
      linkStats,
      topLinks,
      totalLinkClicks: linkStats.reduce((sum, l) => sum + l.totalClicks, 0),
    });
  } catch (error) {
    console.error('getLinkClickAnalytics error:', error);
    sendError(res, 'Failed to fetch link click analytics.', 500);
  }
}

// ============================================================
//  GET /api/v1/analytics/summary
//  Returns a combined analytics summary for the dashboard.
// ============================================================

export async function getAnalyticsSummary(req: Request, res: Response): Promise<void> {
  try {
    const { profileId } = req.user!;
    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [taps7, taps30, linkClicks30, leadsCount, profile] = await Promise.all([
      prisma.tapAnalytics.count({ where: { profileId, tappedAt: { gte: since7 } } }),
      prisma.tapAnalytics.count({ where: { profileId, tappedAt: { gte: since30 } } }),
      prisma.linkClickAnalytics.count({ where: { profileId, clickedAt: { gte: since30 } } }),
      prisma.lead.count({ where: { profileId } }),
      prisma.profile.findUnique({
        where: { id: profileId },
        select: { tapCount: true, username: true, displayName: true },
      }),
    ]);

    sendSuccess(res, {
      tapsLast7Days: taps7,
      tapsLast30Days: taps30,
      linkClicksLast30Days: linkClicks30,
      totalLeads: leadsCount,
      totalTaps: profile?.tapCount ?? 0,
      profile: { username: profile?.username, displayName: profile?.displayName },
    });
  } catch (error) {
    console.error('getAnalyticsSummary error:', error);
    sendError(res, 'Failed to fetch analytics summary.', 500);
  }
}

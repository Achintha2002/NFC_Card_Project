// ============================================================
//  NEXUS Mobile — Analytics Card Component (v2.0)
//  Displays real-time tap count, link clicks, CTR %, top
//  device/location, and interactive Live Activity modal.
// ============================================================

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Colors, Radius, Typography, Shadow, Spacing } from '../constants/theme';
import { AnalyticsData } from '../hooks/useProfile';

interface AnalyticsCardProps {
  tapCount: number;
  analytics?: AnalyticsData | null;
  isLoading?: boolean;
}

export function AnalyticsCard({ tapCount, analytics, isLoading = false }: AnalyticsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const countAnim   = useRef(new Animated.Value(0)).current;

  // ── Shimmer animation (runs always for the gradient background) ──
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [shimmerAnim]);

  // ── Count-up animation when tapCount changes ──────────────────
  useEffect(() => {
    countAnim.setValue(0);
    Animated.timing(countAnim, {
      toValue: tapCount,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [tapCount, countAnim]);

  const animatedCount = countAnim.interpolate({
    inputRange: [0, tapCount || 1],
    outputRange: ['0', String(tapCount)],
  });

  const glowOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.5],
  });

  if (isLoading) {
    return <AnalyticsCardSkeleton />;
  }

  const summary = analytics?.summary;
  const topLocation = analytics?.tapsByLocation?.[0];
  const topDevice = analytics?.tapsByDevice?.[0];

  return (
    <>
      <View style={[styles.card, Shadow.lg]}>
        {/* Animated glow background */}
        <Animated.View style={[styles.glowOverlay, { opacity: glowOpacity }]} />

        <View style={styles.content}>
          {/* Left: Metric */}
          <View>
            <Text style={styles.metricLabel}>Total Card Taps</Text>
            <Animated.Text style={styles.metricValue}>
              {animatedCount}
            </Animated.Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendIcon}>📈</Text>
              <Text style={styles.trendText}>
                {summary ? `${summary.uniqueVisitors} Unique IPs` : 'All time views'}
              </Text>
            </View>
          </View>

          {/* Right: Icon or CTR pill */}
          <View style={styles.iconWrapper}>
            {summary ? (
              <View style={styles.ctrBadge}>
                <Text style={styles.ctrBadgeText}>{summary.clickThroughRate}%</Text>
                <Text style={styles.ctrBadgeLabel}>CTR</Text>
              </View>
            ) : (
              <Text style={styles.cardIcon}>⚡</Text>
            )}
          </View>
        </View>

        {/* Middle: Expanded Stats Row (v2.0) */}
        {analytics && (
          <View style={styles.expandedStatsRow}>
            <View style={styles.expandedStatItem}>
              <Text style={styles.expandedStatValue}>{summary?.totalLinkClicks ?? 0}</Text>
              <Text style={styles.expandedStatLabel}>Link Clicks</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.expandedStatItem}>
              <Text style={[styles.expandedStatValue, { fontSize: 13 }]} numberOfLines={1}>
                {topLocation ? topLocation.location : 'Global'}
              </Text>
              <Text style={styles.expandedStatLabel}>Top Region</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.expandedStatItem}>
              <Text style={[styles.expandedStatValue, { fontSize: 13 }]} numberOfLines={1}>
                {topDevice ? `${topDevice.device} (${topDevice.percentage}%)` : 'Unknown'}
              </Text>
              <Text style={styles.expandedStatLabel}>Top Device</Text>
            </View>
          </View>
        )}

        {/* Bottom: Action / Quick Stats Row */}
        <View style={styles.statsRow}>
          {analytics ? (
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => setIsModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDetailsBtnText}>✦ View Detailed Analytics Feed</Text>
            </TouchableOpacity>
          ) : (
            <>
              <StatPill label="Today" value={Math.floor(tapCount * 0.05)} />
              <View style={styles.divider} />
              <StatPill label="This Week" value={Math.floor(tapCount * 0.2)} />
              <View style={styles.divider} />
              <StatPill label="This Month" value={Math.floor(tapCount * 0.6)} />
            </>
          )}
        </View>
      </View>

      {/* ── Detailed Analytics Modal ────────────────────────────── */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.title}>Analytics Intelligence</Text>
              <Text style={modalStyles.subtitle}>Full-granularity NFC Taps & Link Clicks</Text>
            </View>
            <TouchableOpacity
              style={modalStyles.closeBtn}
              onPress={() => setIsModalOpen(false)}
            >
              <Text style={modalStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.scroll} contentContainerStyle={modalStyles.scrollContent}>
            {/* KPI Summary Banner */}
            <View style={modalStyles.kpiBox}>
              <View style={modalStyles.kpiItem}>
                <Text style={modalStyles.kpiVal}>{summary?.totalTaps ?? tapCount}</Text>
                <Text style={modalStyles.kpiLbl}>Total Taps</Text>
              </View>
              <View style={modalStyles.kpiItem}>
                <Text style={modalStyles.kpiVal}>{summary?.totalLinkClicks ?? 0}</Text>
                <Text style={modalStyles.kpiLbl}>Total Clicks</Text>
              </View>
              <View style={modalStyles.kpiItem}>
                <Text style={modalStyles.kpiVal}>{summary?.clickThroughRate ?? 0}%</Text>
                <Text style={modalStyles.kpiLbl}>CTR</Text>
              </View>
              <View style={modalStyles.kpiItem}>
                <Text style={modalStyles.kpiVal}>{summary?.uniqueVisitors ?? 0}</Text>
                <Text style={modalStyles.kpiLbl}>Unique IPs</Text>
              </View>
            </View>

            {/* Top Links Matrix */}
            <Text style={modalStyles.sectionTitle}>Link Click Ranking</Text>
            <View style={modalStyles.listCard}>
              {!analytics?.topClickedLinks?.length ? (
                <Text style={modalStyles.emptyText}>No links recorded yet.</Text>
              ) : (
                analytics.topClickedLinks.map((link, i) => (
                  <View key={link.id} style={modalStyles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.rowTitle}>
                        #{i + 1} {link.label} ({link.platform})
                      </Text>
                      <Text style={modalStyles.rowSub} numberOfLines={1}>{link.url}</Text>
                    </View>
                    <View style={modalStyles.badge}>
                      <Text style={modalStyles.badgeText}>{link.clickCount} clicks</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Live Activity Stream */}
            <Text style={modalStyles.sectionTitle}>Live Activity Feed</Text>
            <View style={modalStyles.listCard}>
              {!analytics?.recentActivity?.length ? (
                <Text style={modalStyles.emptyText}>No recent activity found.</Text>
              ) : (
                analytics.recentActivity.map((event) => (
                  <View key={event.id} style={modalStyles.activityRow}>
                    <View style={modalStyles.typeIconBox}>
                      <Text style={modalStyles.typeIconText}>
                        {event.type === 'TAP' ? '⚡' : '🖱️'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.activityDetail}>{event.detail}</Text>
                      <Text style={modalStyles.activityMeta}>
                        📍 {event.location} • 📱 {event.device}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AnalyticsCardSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ]),
    ).start();
  }, [shimmer]);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.10)'],
  });

  return (
    <View style={[styles.card, Shadow.md]}>
      <Animated.View style={{ height: 110, borderRadius: Radius.lg, backgroundColor: bg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    backgroundColor: 'rgba(100, 81, 250, 0.08)',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xxl,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: Typography.xxxl,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: {
    fontSize: 12,
  },
  trendText: {
    color: '#34D399',
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(100, 81, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100, 81, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 24,
  },
  ctrBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrBadgeText: {
    color: '#A78BFA',
    fontSize: Typography.sm,
    fontWeight: '900',
  },
  ctrBadgeLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expandedStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  expandedStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  expandedStatValue: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: '800',
    marginBottom: 2,
  },
  expandedStatLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewDetailsBtn: {
    width: '100%',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtnText: {
    color: '#F43F5E',
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statPill: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F23',
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.lg,
    fontWeight: '900',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: Typography.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F1F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  kpiBox: {
    flexDirection: 'row',
    backgroundColor: '#161618',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    justifyContent: 'space-between',
  },
  kpiItem: {
    alignItems: 'center',
    flex: 1,
  },
  kpiVal: {
    color: '#F43F5E',
    fontSize: Typography.lg,
    fontWeight: '900',
  },
  kpiLbl: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: Typography.md,
    fontWeight: '800',
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: '#161618',
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: Typography.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  rowSub: {
    color: '#9CA3AF',
    fontSize: Typography.xs,
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: '#F43F5E',
    fontSize: Typography.xs,
    fontWeight: '800',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconText: {
    fontSize: 16,
  },
  activityDetail: {
    color: '#E5E7EB',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  activityMeta: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
});

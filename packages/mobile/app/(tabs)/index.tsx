// ============================================================
//  TAGIT Mobile — Dashboard Home Screen
//  Tab 1: Analytics overview + Stealth Mode quick toggle
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../constants/theme';
import { AnalyticsCard } from '../../components/AnalyticsCard';
import { StealthToggle } from '../../components/StealthToggle';
import { useMyProfile, useProfileAnalytics } from '../../hooks/useProfile';

export default function DashboardScreen() {
  const { data: profile, isLoading: isProfileLoading, isError, refetch: refetchProfile, isRefetching: isProfileRefetching } = useMyProfile();
  const { data: analytics, isLoading: isAnalyticsLoading, refetch: refetchAnalytics, isRefetching: isAnalyticsRefetching } = useProfileAnalytics();

  const isLoading = isProfileLoading || isAnalyticsLoading;
  const isRefetching = isProfileRefetching || isAnalyticsRefetching;

  const handleRefresh = useCallback(() => {
    refetchProfile();
    refetchAnalytics();
  }, [refetchProfile, refetchAnalytics]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back{profile?.displayName ? ',' : ''}
            </Text>
            <Text style={styles.username}>
              {isLoading ? '...' : (profile?.displayName ?? 'TAGIT User')} ✦
            </Text>
          </View>

          {/* Profile picture placeholder */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
        </View>

        {/* ── NFC Card Preview ────────────────────────────── */}
        <NfcCardPreview
          username={profile?.username}
          isLoading={isLoading}
        />

        {/* ── Analytics ───────────────────────────────────── */}
        <SectionLabel>Analytics Intelligence</SectionLabel>
        <AnalyticsCard
          tapCount={profile?.tapCount ?? 0}
          analytics={analytics}
          isLoading={isLoading}
        />

        {/* ── Privacy ─────────────────────────────────────── */}
        <SectionLabel>Privacy</SectionLabel>
        <StealthToggle
          isActive={profile?.status === 'STEALTH'}
          disabled={isLoading || profile?.status === 'SUSPENDED'}
        />

        {isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              ⚠️ Unable to load your profile. Pull down to retry.
            </Text>
          </View>
        )}

        {/* ── Pending Reviews ──────────────────────────────── */}
        {(profile?.verificationRequests?.length ?? 0) > 0 && (
          <>
            <SectionLabel>Pending Reviews</SectionLabel>
            <View style={[styles.pendingCard, Shadow.sm]}>
              {profile!.verificationRequests.map((req) => (
                <View key={req.id} style={styles.pendingRow}>
                  <Text style={styles.pendingField}>
                    🔍 {req.fieldName}
                  </Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>PENDING</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.pendingNote}>
                AI moderation is reviewing your changes. They&apos;ll go live shortly.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={sectionStyles.label}>{children}</Text>
  );
}

function NfcCardPreview({ username, isLoading }: { username?: string; isLoading: boolean }) {
  const cardUrl = username
    ? `${process.env.EXPO_PUBLIC_API_URL?.replace(':4000', ':3000') ?? 'http://localhost:3000'}/p/${username}`
    : null;

  return (
    <View style={[nfcStyles.card, Shadow.lg]}>
      <View style={nfcStyles.glowOrb} />
      <View style={nfcStyles.content}>
        <View style={nfcStyles.chipIcon}>
          <Text style={{ fontSize: 18 }}>💳</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={nfcStyles.cardLabel}>Your NFC Card URL</Text>
          <Text style={nfcStyles.cardUrl} numberOfLines={1}>
            {isLoading ? '...' : (cardUrl ?? 'Set up your profile')}
          </Text>
        </View>
        <TouchableOpacity
          style={nfcStyles.shareBtn}
          accessibilityLabel="Share your NFC card link"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 16 }}>↗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgBase },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: Typography.regular,
  },
  username: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginTop: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgLayer2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
    padding: 14,
    gap: 10,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingField: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    textTransform: 'capitalize',
  },
  pendingBadge: {
    backgroundColor: Colors.warning + '30',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  pendingNote: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    lineHeight: 18,
  },
});

const sectionStyles = StyleSheet.create({
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});

const nfcStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    backgroundColor: Colors.bgLayer2,
  },
  glowOrb: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  chipIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgLayer1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  cardUrl: {
    color: Colors.accent,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgLayer1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

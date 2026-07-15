// ============================================================
//  NEXUS Mobile — Profile React Query Hooks
//  Wraps all profile-related API calls with TanStack Query
//  for caching, optimistic updates, and background refetching.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '../services/api';
import { AxiosError } from 'axios';

// ── Types ─────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  website?: string | null;
  profilePicture?: string | null;
  companyLogo?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'STEALTH';
  tapCount: number;
  links: ProfileLink[];
  verificationRequests: VerificationRequest[];
  updatedAt: string;
}

export interface ProfileLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface VerificationRequest {
  id: string;
  fieldName: string;
  newValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNote?: string | null;
  requestedAt: string;
}

export interface InstantUpdatePayload {
  bio?: string;
  phone?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
}

export interface AnalyticsData {
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
    type: 'TAP' | 'CLICK';
    timestamp: string;
    location: string;
    device: string;
    browser: string;
    os: string;
    detail: string;
  }>;
}

// ── Query Keys ────────────────────────────────────────────────
export const profileKeys = {
  all:       ['profile'] as const,
  me:        () => [...profileKeys.all, 'me'] as const,
  analytics: () => [...profileKeys.all, 'analytics'] as const,
};

// ── Hooks ─────────────────────────────────────────────────────

/**
 * Fetches the authenticated user's own profile including all
 * links (active + inactive) and pending verification requests.
 */
export function useMyProfile() {
  return useQuery<Profile, AxiosError>({
    queryKey: profileKeys.me(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Profile>>('/profile/me');
      if (!res.data.data) throw new Error('No profile data in response');
      return res.data.data;
    },
    staleTime: 1000 * 30, // Consider fresh for 30 seconds
    retry: 2,
  });
}

/**
 * Fetches full-granularity aggregated analytics for the authenticated user's profile.
 * Cached with staleTime: 5 mins to prevent heavy database re-aggregations on tab switches.
 */
export function useProfileAnalytics() {
  return useQuery<AnalyticsData, AxiosError>({
    queryKey: profileKeys.analytics(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AnalyticsData>>('/profile/analytics');
      if (!res.data.data) throw new Error('No analytics data in response');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes caching
    retry: 2,
  });
}

/**
 * Instantly updates standard profile fields (bio, phone, email, etc.)
 * Uses optimistic update — UI reflects changes immediately.
 */
export function useInstantUpdate() {
  const queryClient = useQueryClient();

  return useMutation<Profile, AxiosError, InstantUpdatePayload, { previousProfile?: Profile }>({
    mutationFn: async (data) => {
      const res = await apiClient.patch<ApiResponse<Profile>>('/profile/instant', data);
      if (!res.data.data) throw new Error('No profile data returned');
      return res.data.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.me() });

      // Snapshot the previous value for rollback
      const previousProfile = queryClient.getQueryData<Profile>(profileKeys.me());

      // Optimistically update cache
      queryClient.setQueryData<Profile>(profileKeys.me(), (old) =>
        old ? { ...old, ...newData } : old,
      );

      return { previousProfile };
    },
    onError: (_err, _newData, context) => {
      // Roll back to the previous value on error
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.me(), context.previousProfile);
      }
    },
    onSettled: () => {
      // Always refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

/**
 * Toggles the profile's privacy status between ACTIVE and STEALTH.
 * Uses optimistic update to flip the toggle immediately in the UI.
 */
export function useTogglePrivacy() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; status: string }, AxiosError, void, { previousProfile?: Profile }>({
    mutationFn: async () => {
      const res = await apiClient.patch<ApiResponse<{ id: string; status: string }>>(
        '/profile/privacy',
      );
      if (!res.data.data) throw new Error('No data returned');
      return res.data.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKeys.me() });
      const previousProfile = queryClient.getQueryData<Profile>(profileKeys.me());

      // Optimistically toggle
      queryClient.setQueryData<Profile>(profileKeys.me(), (old) => {
        if (!old) return old;
        return {
          ...old,
          status: old.status === 'STEALTH' ? 'ACTIVE' : 'STEALTH',
        };
      });

      return { previousProfile };
    },
    onError: (_err, _void, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.me(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

/**
 * Submits a moderated update (displayName, profilePicture, companyLogo).
 * Returns information about the pending verification requests created.
 */
export function useModeratedUpdate() {
  const queryClient = useQueryClient();

  return useMutation<
    { pendingFields: string[]; message: string },
    AxiosError,
    FormData
  >({
    mutationFn: async (formData) => {
      const res = await apiClient.patch<
        ApiResponse<{ pendingFields: string[]; message: string }>
      >('/profile/moderated', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!res.data.data) throw new Error('No data returned');
      return res.data.data;
    },
    onSuccess: () => {
      // Refetch profile to pick up new pending verification requests
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

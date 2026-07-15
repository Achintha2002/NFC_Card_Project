// ============================================================
//  NEXUS Mobile — Link Management React Query Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '../services/api';
import { AxiosError } from 'axios';
import { ProfileLink } from './useProfile';

// ── Query Keys ────────────────────────────────────────────────
export const linkKeys = {
  all:  ['links'] as const,
  list: () => [...linkKeys.all, 'list'] as const,
};

export interface CreateLinkPayload {
  platform: string;
  url: string;
  label: string;
  iconType?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

// ── Hooks ─────────────────────────────────────────────────────

/**
 * Fetches all links (active + inactive) for the authenticated user's profile.
 */
export function useLinks() {
  return useQuery<ProfileLink[], AxiosError>({
    queryKey: linkKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ProfileLink[]>>('/links');
      return res.data.data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Creates a new link. Adds it to the cache optimistically.
 */
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation<ProfileLink, AxiosError, CreateLinkPayload>({
    mutationFn: async (data) => {
      const res = await apiClient.post<ApiResponse<ProfileLink>>('/links', data);
      if (!res.data.data) throw new Error('No link data returned');
      return res.data.data;
    },
    onSuccess: (newLink) => {
      queryClient.setQueryData<ProfileLink[]>(linkKeys.list(), (old = []) => [
        ...old,
        newLink,
      ]);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.list() });
    },
  });
}

/**
 * Toggles a link's isActive state.
 * Optimistically flips the toggle in the UI — no loading state required.
 */
export function useToggleLink() {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; isActive: boolean; label: string; platform: string },
    AxiosError,
    string, // linkId
    { previousLinks?: ProfileLink[] }
  >({
    mutationFn: async (linkId) => {
      const res = await apiClient.patch<
        ApiResponse<{ id: string; isActive: boolean; label: string; platform: string }>
      >(`/links/${linkId}/toggle`);
      if (!res.data.data) throw new Error('No data returned');
      return res.data.data;
    },
    onMutate: async (linkId) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.list() });
      const previousLinks = queryClient.getQueryData<ProfileLink[]>(linkKeys.list());

      // Optimistically flip
      queryClient.setQueryData<ProfileLink[]>(linkKeys.list(), (old = []) =>
        old.map((link) =>
          link.id === linkId ? { ...link, isActive: !link.isActive } : link,
        ),
      );

      return { previousLinks };
    },
    onError: (_err, _linkId, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(linkKeys.list(), context.previousLinks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.list() });
    },
  });
}

/**
 * Deletes a link. Removes it from the cache optimistically.
 */
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string, { previousLinks?: ProfileLink[] }>({
    mutationFn: async (linkId) => {
      await apiClient.delete(`/links/${linkId}`);
    },
    onMutate: async (linkId) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.list() });
      const previousLinks = queryClient.getQueryData<ProfileLink[]>(linkKeys.list());

      queryClient.setQueryData<ProfileLink[]>(linkKeys.list(), (old = []) =>
        old.filter((link) => link.id !== linkId),
      );

      return { previousLinks };
    },
    onError: (_err, _linkId, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(linkKeys.list(), context.previousLinks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.list() });
    },
  });
}

/**
 * Reorders links via a batch PATCH. Updates sort order client-side first.
 */
export function useReorderLinks() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, ReorderItem[], { previousLinks?: ProfileLink[] }>({
    mutationFn: async (items) => {
      await apiClient.patch('/links/reorder', items);
    },
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.list() });
      const previousLinks = queryClient.getQueryData<ProfileLink[]>(linkKeys.list());

      // Apply sort order updates optimistically
      queryClient.setQueryData<ProfileLink[]>(linkKeys.list(), (old = []) => {
        const orderMap = new Map(items.map((i) => [i.id, i.sortOrder]));
        return [...old]
          .map((link) => ({
            ...link,
            sortOrder: orderMap.get(link.id) ?? link.sortOrder,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      });

      return { previousLinks };
    },
    onError: (_err, _items, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(linkKeys.list(), context.previousLinks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.list() });
    },
  });
}

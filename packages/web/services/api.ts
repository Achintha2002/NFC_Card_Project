// ============================================================
//  TAGIT Web — Axios API Client
//  Configured with base URL, auth interceptors, and error handling.
// ============================================================

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const LOCAL_STORAGE_KEYS = {
  accessToken:  'tagit_access_token',
  refreshToken: 'tagit_refresh_token',
};

/** Typed API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

// ── Token Storage Helpers ─────────────────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_KEYS.refreshToken);
}

export function persistTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(LOCAL_STORAGE_KEYS.refreshToken, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.refreshToken);
}

// ── Create Axios Instance ─────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request Interceptor — Inject Auth Token ───────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor — Handle 401 Token Refresh ──────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Auto-refresh on 401 Unauthorized (once)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        const res = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${API_URL}/api/v1/auth/refresh`,
          { refreshToken },
        );

        const newAccessToken = res.data.data?.accessToken;
        if (!newAccessToken) throw new Error('Refresh response missing token');

        // Persist new access token while keeping existing refresh token
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.accessToken, newAccessToken);
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear all tokens
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ── Social Auth Endpoints ─────────────────────────────────────
export async function googleLoginApi(idToken: string) {
  const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/google', { idToken });
  return response.data;
}

export async function appleLoginApi(identityToken: string, user?: any) {
  const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/apple', { identityToken, user });
  return response.data;
}

// ── Admin Suite API Methods ───────────────────────────────────

export async function getAdminAnalytics() {
  const response = await apiClient.get<ApiResponse<any>>('/admin/analytics');
  return response.data;
}

export async function getAdminInventory() {
  const response = await apiClient.get<ApiResponse<any[]>>('/admin/inventory');
  return response.data;
}

export async function upsertAdminProduct(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/admin/inventory', data);
  return response.data;
}

export async function deleteAdminProduct(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/admin/inventory/${id}`);
  return response.data;
}

export async function getAdminNfcCards() {
  const response = await apiClient.get<ApiResponse<any[]>>('/admin/cards');
  return response.data;
}

export async function createAdminNfcBatch(data: { batchNumber: string; productId: string; count: number; description?: string }) {
  const response = await apiClient.post<ApiResponse<any>>('/admin/cards/batch', data);
  return response.data;
}

export async function assignAdminNfcCard(data: { cardId?: string; uid?: string; userEmail?: string }) {
  const response = await apiClient.post<ApiResponse<any>>('/admin/cards/assign', data);
  return response.data;
}

export async function getAdminOrders(status?: string) {
  const url = status && status !== 'ALL' ? `/admin/orders?status=${status}` : '/admin/orders';
  const response = await apiClient.get<ApiResponse<any[]>>(url);
  return response.data;
}

export async function updateAdminOrder(id: string, data: { status?: string; trackingNumber?: string; courier?: string }) {
  const response = await apiClient.patch<ApiResponse<any>>(`/admin/orders/${id}`, data);
  return response.data;
}

export async function getAdminUsers() {
  const response = await apiClient.get<ApiResponse<any[]>>('/admin/users');
  return response.data;
}

export async function updateAdminUser(id: string, data: { role?: string; subscriptionTier?: string; profileStatus?: string }) {
  const response = await apiClient.patch<ApiResponse<any>>(`/admin/users/${id}`, data);
  return response.data;
}

export async function createAdminUser(data: any) {
  const response = await apiClient.post<ApiResponse<any>>('/admin/users', data);
  return response.data;
}

export async function getAdminVerifications() {
  const response = await apiClient.get<ApiResponse<any[]>>('/admin/verifications');
  return response.data;
}

export async function moderateAdminVerification(id: string, data: { status: 'APPROVED' | 'REJECTED'; moderationNote?: string }) {
  const response = await apiClient.patch<ApiResponse<any>>(`/admin/verifications/${id}`, data);
  return response.data;
}

// ── Portfolio API Methods ─────────────────────────────────────

export interface PortfolioUpdateData {
  theme?: 'MIDNIGHT_LUXE' | 'ARCTIC_FROST' | 'SUNSET_EMBER' | 'OCEAN_DEPTH' | 'MONOCHROME_ELITE' | 'PURE_LIGHT';
  primaryColor?: string;
  accentColor?: string;
  headline?: string | null;
  subheadline?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  heroImageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface SectionCreateData {
  type: 'HERO' | 'ABOUT' | 'EXPERIENCE' | 'PROJECTS' | 'SKILLS' | 'TESTIMONIALS' | 'GALLERY' | 'CONTACT' | 'STATS' | 'CUSTOM_HTML';
  title?: string;
  content?: Record<string, unknown>;
}

export interface SectionUpdateData {
  title?: string;
  isVisible?: boolean;
  content?: Record<string, unknown>;
}

export async function getMyPortfolio() {
  const response = await apiClient.get<ApiResponse<any>>('/portfolio/me');
  return response.data;
}

export async function createPortfolio() {
  const response = await apiClient.post<ApiResponse<any>>('/portfolio');
  return response.data;
}

export async function updatePortfolio(data: PortfolioUpdateData) {
  const response = await apiClient.patch<ApiResponse<any>>('/portfolio', data);
  return response.data;
}

export async function togglePortfolioPublish() {
  const response = await apiClient.patch<ApiResponse<any>>('/portfolio/publish');
  return response.data;
}

export async function addPortfolioSection(data: SectionCreateData) {
  const response = await apiClient.post<ApiResponse<any>>('/portfolio/sections', data);
  return response.data;
}

export async function updatePortfolioSection(sectionId: string, data: SectionUpdateData) {
  const response = await apiClient.patch<ApiResponse<any>>(`/portfolio/sections/${sectionId}`, data);
  return response.data;
}

export async function deletePortfolioSection(sectionId: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/portfolio/sections/${sectionId}`);
  return response.data;
}

export async function reorderPortfolioSections(sectionIds: string[]) {
  const response = await apiClient.patch<ApiResponse<any>>('/portfolio/sections/reorder', { sectionIds });
  return response.data;
}

export async function uploadPortfolioImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const response = await apiClient.post<ApiResponse<{ url: string }>>('/portfolio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export { apiClient };

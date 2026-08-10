import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  // Required for the server's anonymous-requester cookie to be sent/stored
  // at all — client and server are different origins (different ports).
  withCredentials: true,
});

export interface CreateShortUrlPayload {
  url: string;
  alias?: string;
  /** Days until the link stops working. Omitted = never expires. */
  expiresInDays?: number;
}

export interface ShortUrlData {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  expiresAt: string | null;
  /** Shown once, at creation — required to view this link's analytics later. */
  statsToken: string;
}

export interface ShortUrlStats {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  expiresAt: string | null;
  clickCount: number;
  lastClickedAt: string | null;
}

export interface AnalyticsBreakdownEntry {
  label: string;
  count: number;
}

export interface RecentClick {
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  countryCode: string | null;
  referrer: string | null;
  clickedAt: string;
}

export interface ShortUrlAnalytics {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  createdAt: string;
  byBrowser: AnalyticsBreakdownEntry[];
  byOs: AnalyticsBreakdownEntry[];
  byDevice: AnalyticsBreakdownEntry[];
  byCountry: AnalyticsBreakdownEntry[];
  byReferrer: AnalyticsBreakdownEntry[];
  recentClicks: RecentClick[];
}

export interface ApiErrorPayload {
  error: string;
  code: string;
  category?: string | null;
  riskScore?: number | null;
}

export function isApiErrorPayload(data: unknown): data is ApiErrorPayload {
  return typeof data === "object" && data !== null && "error" in data && "code" in data;
}

export async function createShortUrl(payload: CreateShortUrlPayload): Promise<ShortUrlData> {
  const { data } = await api.post<{ success: true; data: ShortUrlData }>("/api/shorten", payload);
  return data.data;
}

export async function getShortUrlStats(shortCode: string): Promise<ShortUrlStats> {
  const { data } = await api.get<{ success: true; data: ShortUrlStats }>(`/api/shorten/${shortCode}`);
  return data.data;
}

export async function getShortUrlAnalytics(
  shortCode: string,
  statsToken: string,
): Promise<ShortUrlAnalytics> {
  const { data } = await api.get<{ success: true; data: ShortUrlAnalytics }>(
    `/api/shorten/${shortCode}/analytics`,
    { headers: { "x-stats-token": statsToken } },
  );
  return data.data;
}

export default api;

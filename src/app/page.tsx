"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Link2, Loader2, RefreshCw, ExternalLink, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CopyButton from "@/components/CopyButton";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import {
  createShortUrl,
  getShortUrlStats,
  isApiErrorPayload,
  type ShortUrlData,
} from "@/lib/api/shortUrl";

const HISTORY_KEY = "nestsms-url-shortener:history";
const MAX_HISTORY = 10;

const NEVER_EXPIRES = "never";

const VALIDITY_OPTIONS = [
  { label: "Never expires", value: NEVER_EXPIRES },
  { label: "1 day", value: "1" },
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "1 year", value: "365" },
];

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "Never expires";
  return `Expires ${new Date(expiresAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

function loadHistory(): ShortUrlData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ShortUrlData[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: ShortUrlData[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function AnalyticsButton({ item, label = "Analytics" }: { item: ShortUrlData; label?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <BarChart3 className="size-4" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link analytics</DialogTitle>
          <DialogDescription className="break-all">{item.shortUrl}</DialogDescription>
        </DialogHeader>
        <AnalyticsPanel shortCode={item.shortCode} statsToken={item.statsToken} />
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(NEVER_EXPIRES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShortUrlData | null>(null);
  const [clickCount, setClickCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<ShortUrlData[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setClickCount(null);
    setLoading(true);
    try {
      const data = await createShortUrl({
        url,
        alias: alias || undefined,
        expiresInDays: expiresInDays === NEVER_EXPIRES ? undefined : Number(expiresInDays),
      });
      setResult(data);
      setClickCount(0);
      const nextHistory = [data, ...history.filter((h) => h.shortCode !== data.shortCode)];
      setHistory(nextHistory);
      saveHistory(nextHistory);
      setUrl("");
      setAlias("");
      setExpiresInDays(NEVER_EXPIRES);
    } catch (err) {
      if (axios.isAxiosError(err) && isApiErrorPayload(err.response?.data)) {
        setError(err.response!.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshClicks = async (shortCode: string) => {
    setRefreshing(true);
    try {
      const stats = await getShortUrlStats(shortCode);
      setClickCount(stats.clickCount);
    } catch {
      // ignore — stale count is fine, user can retry
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Shorten links, track every click
        </h1>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-lg mx-auto">
          Paste a long URL below and get a short, shareable link instantly — with clicks, devices
          and locations you can check any time.
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="url" className="text-sm font-medium">
                Long URL
              </label>
              <Input
                id="url"
                type="url"
                required
                placeholder="https://example.com/a/very/long/path"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="alias" className="text-sm font-medium">
                  Custom alias <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  id="alias"
                  type="text"
                  placeholder="my-cool-link"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9-]+"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="validity" className="text-sm font-medium">
                  Link validity
                </label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger id="validity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALIDITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} size="lg" className="self-start">
              {loading ? <Loader2 className="animate-spin" /> : <Link2 />}
              Shorten
            </Button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-primary hover:underline break-all inline-flex items-center gap-1 min-w-0 flex-1"
                >
                  {result.shortUrl}
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
                <CopyButton value={result.shortUrl} />
              </div>
              <p className="text-muted-foreground text-sm mt-1 break-all">→ {result.originalUrl}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                <span>{clickCount ?? 0} clicks</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatExpiry(result.expiresAt)}
                </span>
                <button
                  type="button"
                  onClick={() => refreshClicks(result.shortCode)}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  disabled={refreshing}
                >
                  <RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} />
                  Refresh
                </button>
                <AnalyticsButton item={result} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your recent links</CardTitle>
            <CardDescription>Saved on this device only.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {history.map((item) => (
              <div
                key={item.shortCode}
                className="flex items-center justify-between gap-4 border-b border-border last:border-0 pb-3 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary hover:underline text-sm font-medium truncate block"
                  >
                    {item.shortUrl}
                  </a>
                  <p className="text-muted-foreground text-xs truncate">{item.originalUrl}</p>
                </div>
                <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
                  {formatExpiry(item.expiresAt)}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <AnalyticsButton item={item} />
                  <CopyButton value={item.shortUrl} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getShortUrlAnalytics,
  type AnalyticsBreakdownEntry,
  type ShortUrlAnalytics,
} from "@/lib/api/shortUrl";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-0.5">{value.toLocaleString()}</p>
    </div>
  );
}

/** Single-series magnitude bars — sequential (one hue), direct-labeled, no legend needed. */
function Breakdown({ title, entries }: { title: string; entries: AnalyticsBreakdownEntry[] }) {
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map((e) => e.count));
  return (
    <div>
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <div key={e.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-muted-foreground" title={e.label}>
              {e.label}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max((e.count / max) * 100, 6)}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm tabular-nums">{e.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPanel({
  shortCode,
  statsToken,
}: {
  shortCode: string;
  statsToken: string;
}) {
  const [data, setData] = useState<ShortUrlAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getShortUrlAnalytics(shortCode, statsToken)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load analytics for this link.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shortCode, statsToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="animate-spin size-5" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-destructive py-6">{error ?? "No data available."}</p>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <p className="text-sm text-muted-foreground break-all">{data.originalUrl}</p>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Total clicks" value={data.totalClicks} />
        <StatTile label="Unique visitors" value={data.uniqueClicks} />
      </div>

      {data.recentClicks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clicks yet — share the link to start seeing activity here.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 min-w-0">
            <Breakdown title="Top browsers" entries={data.byBrowser} />
            <Breakdown title="Top operating systems" entries={data.byOs} />
            <Breakdown title="Top devices" entries={data.byDevice} />
            <Breakdown title="Top countries" entries={data.byCountry} />
          </div>
          <Breakdown title="Top referrers" entries={data.byReferrer} />

          <div className="min-w-0">
            <p className="text-sm font-medium mb-2">Recent clicks</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/60 text-muted-foreground text-xs">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Time</th>
                    <th className="text-left font-medium px-3 py-2">IP address</th>
                    <th className="text-left font-medium px-3 py-2">Device</th>
                    <th className="text-left font-medium px-3 py-2">Location</th>
                    <th className="text-left font-medium px-3 py-2">Referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentClicks.map((c, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                        {new Date(c.clickedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                        {c.ipAddress ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {[c.browser, c.os].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{c.country ?? "—"}</td>
                      <td className="px-3 py-2 max-w-[160px] truncate" title={c.referrer ?? undefined}>
                        {c.referrer ?? "Direct"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

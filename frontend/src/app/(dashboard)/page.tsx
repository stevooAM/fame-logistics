"use client";

import { useAuth } from "@/providers/auth-provider";
import { useDashboard } from "@/hooks/use-dashboard";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, extraEntries, feedNext, loadingMore, loadMore } =
    useDashboard();

  // Determine the role name — fall back to empty string so role checks still work
  const roleName = user?.role?.name ?? "";

  // Combine initial feed results with any Load More pages
  const allEntries = [
    ...(data?.feed.results ?? []),
    ...extraEntries,
  ];

  // feedNext from the hook tracks the pagination cursor across Load More calls
  // On first load with no extra pages, use the feed.next from initial data
  const activeFeedNext =
    extraEntries.length > 0
      ? feedNext
      : (data?.feed.next ?? null);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#2B3E50" }}>
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome back
          {user?.first_name ? `, ${user.first_name}` : ""}. Here&apos;s
          what&apos;s happening.
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={data?.kpis ?? null} role={roleName} />

      {/* Quick Actions */}
      <QuickActions role={roleName} />

      {/* Activity Feed */}
      <ActivityFeed
        entries={allEntries}
        feedNext={activeFeedNext}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        loading={loading}
      />
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { DashboardStatsSkeleton } from "@/components/SkeletonLoaders";
import { OnboardingWizard, useOnboarding } from "@/components/OnboardingWizard";
import { ReportExportButton } from "@/components/ReportExportButton";
import { DashboardWidgets, WidgetType } from "@/components/dashboard/DashboardWidgets";
import {
  StatsCompaniesWidget,
  StatsCampaignsWidget,
  StatsLeadsWidget,
  StatsPerformanceWidget,
  ChartCampaignsWidget,
  ChartLeadsWidget,
  RecentCampaignsWidget,
  TopLeadsWidget,
  UpcomingEventsWidget,
  NotificationsWidget,
  QuickActionsWidget,
} from "@/components/dashboard/WidgetComponents";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  
  // Onboarding wizard
  const { showOnboarding, closeOnboarding, completeOnboarding } = useOnboarding();

  // Query options for caching
  const queryOptions = {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  };

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, queryOptions);
  const { data: recentCampaigns, isLoading: campaignsLoading } = trpc.dashboard.recentCampaigns.useQuery(undefined, queryOptions);
  const { data: topLeads, isLoading: leadsLoading } = trpc.dashboard.topLeads.useQuery(undefined, queryOptions);
  const { data: performanceData, isLoading: perfLoading } = trpc.dashboard.performanceChart.useQuery({ days: parseInt(dateRange) }, queryOptions);
  const { data: industryData, isLoading: industryLoading } = trpc.dashboard.leadsByIndustry.useQuery(undefined, queryOptions);
  const { data: upcomingEvents } = trpc.calendar.getUpcoming.useQuery({ limit: 5 }, queryOptions);
  const { data: notifications } = trpc.notifications.list.useQuery({ limit: 5 }, queryOptions);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32); // Account for padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Render widget content based on type
  const renderWidget = (widgetId: WidgetType) => {
    switch (widgetId) {
      case "stats-companies":
        return <StatsCompaniesWidget data={stats?.companies} />;
      case "stats-campaigns":
        return <StatsCampaignsWidget data={stats?.campaigns} />;
      case "stats-leads":
        return <StatsLeadsWidget data={stats?.leads} />;
      case "stats-performance":
        return (
          <StatsPerformanceWidget
            data={{
              openRate: String(stats?.leads?.openRate || 0),
              replyRate: String(stats?.leads?.replyRate || 0),
            }}
          />
        );
      case "chart-campaigns":
        return <ChartCampaignsWidget data={performanceData} />;
      case "chart-leads":
        return <ChartLeadsWidget data={industryData} />;
      case "recent-campaigns":
        return <RecentCampaignsWidget data={recentCampaigns} />;
      case "top-leads":
        return <TopLeadsWidget data={topLeads} />;
      case "upcoming-events":
        return <UpcomingEventsWidget data={upcomingEvents} />;
      case "notifications":
        return <NotificationsWidget data={notifications} />;
      case "quick-actions":
        return <QuickActionsWidget />;
      default:
        return <div>Widget ikke funnet</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Laster dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center p-8 bg-card rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Logg inn for å fortsette</h2>
          <p className="text-muted-foreground mb-6">Du må være logget inn for å se dashboardet</p>
          <Link href="/login">
            <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              Logg inn
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
      
      <div className="space-y-6" ref={containerRef}>
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Velkommen tilbake, {user.name?.split(' ')[0] || 'bruker'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Her er en oversikt over din aktivitet</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Siste 7 dager</SelectItem>
                <SelectItem value="30">Siste 30 dager</SelectItem>
                <SelectItem value="90">Siste 90 dager</SelectItem>
              </SelectContent>
            </Select>
            <ReportExportButton
              type="dashboard"
              data={{
                user: { name: user.name || '', email: user.email || '' },
                dateRange: `Siste ${dateRange} dager`,
                stats: {
                  companies: stats?.companies || { total: 0, withEmail: 0, withPhone: 0 },
                  campaigns: stats?.campaigns || { total: 0, active: 0, completed: 0 },
                  leads: stats?.leads || { total: 0, sent: 0, opened: 0, replied: 0 },
                  performance: {
                    openRate: String(stats?.leads?.openRate || '0'),
                    replyRate: String(stats?.leads?.replyRate || '0'),
                    clickRate: String(stats?.leads?.clickRate || '0'),
                  },
                },
                recentCampaigns: (recentCampaigns || []).map((c: any) => ({
                  name: c.name,
                  status: c.status,
                  sent: c.sent,
                  opened: c.opened,
                  openRate: c.openRate,
                })),
                topLeads: (topLeads || []).map((l: any) => ({
                  companyName: l.companyName,
                  email: l.email,
                  score: l.score,
                  status: l.status,
                })),
                industryData: industryData || [],
              }}
            />
          </div>
        </div>

        {/* Customizable Widgets Grid */}
        {statsLoading ? (
          <DashboardStatsSkeleton />
        ) : (
          <DashboardWidgets
            renderWidget={renderWidget}
            width={containerWidth}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

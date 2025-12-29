import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, TrendingUp, Users, Search, FileText, ArrowUpRight, Sparkles, BarChart3, Calendar, Download, LogIn, Clock, Target, Eye, MessageSquare, ChevronRight, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Link } from "wouter";
import { useState } from "react";
import { DashboardStatsSkeleton, ChartsSkeleton } from "@/components/SkeletonLoaders";
import { OnboardingTutorial, QuickStartCard, FeatureCards } from "@/components/OnboardingTutorial";
import { OnboardingWizard, useOnboarding } from "@/components/OnboardingWizard";
import { ReportExportButton } from "@/components/ReportExportButton";
import { generateDashboardReport, type DashboardReportData } from "@/lib/pdfReportGenerator";

// Chart colors
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

// Status colors
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  paused: 'bg-orange-100 text-orange-700',
  new: 'bg-indigo-100 text-indigo-700',
  contacted: 'bg-blue-100 text-blue-700',
  interested: 'bg-purple-100 text-purple-700',
  qualified: 'bg-green-100 text-green-700',
  converted: 'bg-emerald-100 text-emerald-700',
};

// Status labels in Norwegian
const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  scheduled: 'Planlagt',
  sending: 'Sender',
  completed: 'Fullført',
  paused: 'Pauset',
  new: 'Ny',
  contacted: 'Kontaktet',
  interested: 'Interessert',
  qualified: 'Kvalifisert',
  converted: 'Konvertert',
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');
  
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
  const { data: statusData, isLoading: statusLoading } = trpc.dashboard.leadStatusDistribution.useQuery(undefined, queryOptions);

  const isLoading = statsLoading || campaignsLoading || leadsLoading;



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Laster dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Logg inn for å fortsette</h2>
          <p className="text-gray-600 mb-6">Du må være logget inn for å se dashboardet</p>
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
      
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Velkommen tilbake, {user.name?.split(' ')[0] || 'bruker'}! 👋
            </h1>
            <p className="text-gray-500 mt-1">Her er en oversikt over din aktivitet</p>
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

        {/* Stats Cards */}
        {statsLoading ? (
          <DashboardStatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Companies */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-3xl font-bold mb-1">
                  {stats?.companies.total.toLocaleString() || 0}
                </div>
                <p className="text-blue-100 text-sm">Bedrifter i databasen</p>
                <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-xs">
                  <span className="text-blue-100">Med e-post: {stats?.companies.withEmail || 0}</span>
                  <span className="text-blue-100">Med tlf: {stats?.companies.withPhone || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Campaigns */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  {(stats?.campaigns.active || 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs">{stats?.campaigns.active} aktive</span>
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold mb-1">
                  {stats?.campaigns.total || 0}
                </div>
                <p className="text-indigo-100 text-sm">Totalt kampanjer</p>
                <div className="mt-3 pt-3 border-t border-white/20 text-xs text-indigo-100">
                  {stats?.campaigns.completed || 0} fullført
                </div>
              </CardContent>
            </Card>

            {/* Leads */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <Target className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-3xl font-bold mb-1">
                  {stats?.leads.total || 0}
                </div>
                <p className="text-purple-100 text-sm">Totalt leads</p>
                <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-xs">
                  <span className="text-purple-100">Sendt: {stats?.leads.sent || 0}</span>
                  <span className="text-purple-100">Åpnet: {stats?.leads.opened || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <Activity className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-3xl font-bold mb-1">
                  {(() => {
                    const rate: any = stats?.leads.openRate;
                    return typeof rate === 'number' ? rate.toFixed(1) : (typeof rate === 'string' ? parseFloat(rate).toFixed(1) : '0.0');
                  })()}%
                </div>
                <p className="text-pink-100 text-sm">Åpningsrate</p>
                <div className="mt-3 pt-3 border-t border-white/20 text-xs text-pink-100">
                  Svarrate: {(() => {
                    const rate: any = stats?.leads.replyRate;
                    return typeof rate === 'number' ? rate.toFixed(1) : (typeof rate === 'string' ? parseFloat(rate).toFixed(1) : '0.0');
                  })()}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <CardTitle>Hurtighandlinger</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/search">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">Søk bedrifter</span>
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-300 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Ny kampanje</span>
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="font-medium">E-postmaler</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-lg">Kampanjeytelse</CardTitle>
                </div>
              </div>
              <CardDescription>E-poster sendt, åpnet og besvart</CardDescription>
            </CardHeader>
            <CardContent>
              {perfLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : performanceData && performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Area type="monotone" dataKey="sent" stroke="#6366f1" fillOpacity={1} fill="url(#colorSent)" name="Sendt" />
                    <Area type="monotone" dataKey="opened" stroke="#10b981" fillOpacity={1} fill="url(#colorOpened)" name="Åpnet" />
                    <Line type="monotone" dataKey="replied" stroke="#f59e0b" strokeWidth={2} name="Besvart" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-sm">Ingen data ennå</p>
                  <p className="text-xs mt-1">Start en kampanje for å se statistikk</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Leads per bransje</CardTitle>
              </div>
              <CardDescription>Fordeling av leads etter næring</CardDescription>
            </CardHeader>
            <CardContent>
              {industryLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                </div>
              ) : industryData && industryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={industryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis dataKey="industry" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Antall" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-gray-500">
                  <Target className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-sm">Ingen leads ennå</p>
                  <p className="text-xs mt-1">Søk etter bedrifter og legg til leads</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Campaigns */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Nylige kampanjer</CardTitle>
                </div>
                <Link href="/campaigns">
                  <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                    Se alle <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentCampaigns && recentCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {recentCampaigns.map((campaign: any) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{campaign.sent} sendt</span>
                            <span>•</span>
                            <span>{campaign.openRate}% åpnet</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={STATUS_COLORS[campaign.status] || 'bg-gray-100 text-gray-700'}>
                        {STATUS_LABELS[campaign.status] || campaign.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Ingen kampanjer ennå</p>
                  <Link href="/campaigns">
                    <Button variant="link" className="mt-2 text-blue-600">
                      Opprett din første kampanje
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Leads */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Topp leads</CardTitle>
                </div>
                <Link href="/leads">
                  <Button variant="ghost" size="sm" className="gap-1 text-purple-600">
                    Se alle <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : topLeads && topLeads.length > 0 ? (
                <div className="space-y-3">
                  {topLeads.map((lead: any) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{lead.companyName}</p>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-indigo-600">Score: {lead.score}</div>
                        </div>
                        <Badge className={STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-700'}>
                          {STATUS_LABELS[lead.status] || lead.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Ingen leads ennå</p>
                  <Link href="/search">
                    <Button variant="link" className="mt-2 text-purple-600">
                      Søk etter bedrifter
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <QuickStartCard />
          </div>
          <div className="lg:col-span-2">
            <FeatureCards />
          </div>
        </div>

        <OnboardingTutorial />
      </div>
    </DashboardLayout>
  );
}

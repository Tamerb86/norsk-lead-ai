import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Download, 
  TrendingUp, 
  Users, 
  Mail, 
  MousePointerClick, 
  MessageSquare,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Clock,
  Target,
  Rocket,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { DashboardStatsSkeleton } from "@/components/SkeletonLoaders";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

// Empty State Component
function EmptyState({ 
  title, 
  description, 
  icon, 
  actionLabel, 
  actionHref,
  tips 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  tips?: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-4">{description}</p>
      {tips && tips.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4 max-w-sm">
          <p className="text-xs font-medium text-blue-800 mb-1">💡 Tips:</p>
          <ul className="text-xs text-blue-700 space-y-1 text-left">
            {tips.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600">
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// Full Page Empty State
function FullPageEmptyState() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/30">
        <CardContent className="pt-12 pb-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
            <PageHelp title="Analyser" description={PAGE_DESCRIPTIONS.analytics} />
            <p className="text-slate-600 max-w-md mx-auto mb-8">
              Start med å opprette din første kampanje for å se detaljert analyse av e-postytelse, 
              lead-engasjement og konverteringsrater.
            </p>

            {/* Quick Start Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-medium text-slate-900 text-sm mb-1">1. Finn leads</h4>
                <p className="text-xs text-slate-500">Søk og filtrer bedrifter</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-medium text-slate-900 text-sm mb-1">2. Opprett kampanje</h4>
                <p className="text-xs text-slate-500">Send personlige e-poster</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                </div>
                <h4 className="font-medium text-slate-900 text-sm mb-1">3. Følg med</h4>
                <p className="text-xs text-slate-500">Se resultater her</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search">
                <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Users className="w-4 h-4" />
                  Finn leads
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Opprett kampanje
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsContent() {
  const [dateRange, setDateRange] = useState("30");

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));

  // Fetch analytics data with caching to reduce API calls
  const queryOptions = {
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time
    refetchOnWindowFocus: false,
    retry: 1,
  };

  const { data: campaignPerf, isLoading: loadingCampaign } = trpc.analytics.campaignPerformance.useQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }, queryOptions);

  const { data: leadAnalytics, isLoading: loadingLeads } = trpc.analytics.leadAnalytics.useQuery(undefined, queryOptions);
  const { data: sequenceAnalytics, isLoading: loadingSequences } = trpc.analytics.sequenceAnalytics.useQuery(undefined, queryOptions);
  const { data: heatmap, isLoading: loadingHeatmap } = trpc.analytics.engagementHeatmap.useQuery(undefined, queryOptions);
  const { data: topPerformers, isLoading: loadingTop } = trpc.analytics.topPerformers.useQuery(undefined, queryOptions);

  const isLoading = loadingCampaign || loadingLeads || loadingSequences || loadingHeatmap || loadingTop;

  // Check if there's any data at all
  const hasNoData = !isLoading && 
    (!campaignPerf?.overview.totalCampaigns || campaignPerf.overview.totalCampaigns === 0) &&
    (!leadAnalytics?.engagementMetrics.totalLeads || leadAnalytics.engagementMetrics.totalLeads === 0);

  const exportToPDF = () => {
    alert("PDF export coming soon!");
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <DashboardStatsSkeleton />
      </div>
    );
  }

  // Show full page empty state if no data at all
  if (hasNoData) {
    return <FullPageEmptyState />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 mt-2">Comprehensive insights into your campaigns and leads</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Siste 7 dager</SelectItem>
              <SelectItem value="30">Siste 30 dager</SelectItem>
              <SelectItem value="90">Siste 90 dager</SelectItem>
              <SelectItem value="365">Siste år</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Eksporter PDF
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Totalt kampanjer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900">
                {campaignPerf?.overview.totalCampaigns || 0}
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">E-poster sendt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900">
                {campaignPerf?.overview.totalSent || 0}
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Åpningsrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900">
                {(campaignPerf?.overview.avgOpenRate || 0).toFixed(1)}%
              </div>
              <MousePointerClick className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Svarrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900">
                {(campaignPerf?.overview.avgReplyRate || 0).toFixed(1)}%
              </div>
              <MessageSquare className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Kampanjeytelse over tid</CardTitle>
          <CardDescription>Spor åpninger, klikk og svar i valgt periode</CardDescription>
        </CardHeader>
        <CardContent>
          {campaignPerf?.timeline && campaignPerf.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={campaignPerf.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opens" stroke="#6366f1" strokeWidth={2} name="Åpninger" />
                <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} name="Klikk" />
                <Line type="monotone" dataKey="replies" stroke="#ec4899" strokeWidth={2} name="Svar" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="Ingen kampanjedata"
              description="Når du sender e-poster, vil du se åpningsrater, klikk og svar over tid her."
              icon={<LineChartIcon className="w-8 h-8 text-indigo-500" />}
              actionLabel="Opprett kampanje"
              actionHref="/campaigns"
              tips={[
                "Send minst én kampanje for å se trender",
                "Data oppdateres i sanntid",
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Lead Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead-statusfordeling</CardTitle>
            <CardDescription>Nåværende status for alle leads</CardDescription>
          </CardHeader>
          <CardContent>
            {leadAnalytics?.statusDistribution && leadAnalytics.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadAnalytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {leadAnalytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Ingen leads ennå"
                description="Legg til leads i kampanjene dine for å se statusfordeling."
                icon={<PieChartIcon className="w-8 h-8 text-purple-500" />}
                actionLabel="Søk bedrifter"
                actionHref="/search"
              />
            )}
          </CardContent>
        </Card>

        {/* Top Industries */}
        <Card>
          <CardHeader>
            <CardTitle>Topp bransjer</CardTitle>
            <CardDescription>Leads etter bransjesektor</CardDescription>
          </CardHeader>
          <CardContent>
            {leadAnalytics?.topIndustries && leadAnalytics.topIndustries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadAnalytics.topIndustries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="industry" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Ingen bransjedata"
                description="Når du har leads fra ulike bransjer, vil du se fordelingen her."
                icon={<BarChart3 className="w-8 h-8 text-pink-500" />}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Send Times (Hourly) */}
        <Card>
          <CardHeader>
            <CardTitle>Beste sendetidspunkt (time)</CardTitle>
            <CardDescription>Åpningsrater etter time på dagen</CardDescription>
          </CardHeader>
          <CardContent>
            {heatmap?.hourly && heatmap.hourly.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={heatmap.hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: "Time", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Åpningsrate %", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="openRate" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Ikke nok data"
                description="Send flere e-poster for å se hvilke tidspunkter som gir best engasjement."
                icon={<Clock className="w-8 h-8 text-amber-500" />}
                tips={[
                  "Beste sendetider varierer etter bransje",
                  "Prøv å sende på ulike tidspunkter",
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Best Send Days */}
        <Card>
          <CardHeader>
            <CardTitle>Beste sendedager</CardTitle>
            <CardDescription>Åpningsrater etter ukedag</CardDescription>
          </CardHeader>
          <CardContent>
            {heatmap?.daily && heatmap.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={heatmap.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: "Åpningsrate %", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="openRate" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Ikke nok data"
                description="Send e-poster på ulike dager for å se hvilke som fungerer best."
                icon={<Clock className="w-8 h-8 text-pink-500" />}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Beste kampanjer</CardTitle>
            <CardDescription>Kampanjer med høyest åpningsrate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers?.topCampaigns && topPerformers.topCampaigns.length > 0 ? (
                topPerformers.topCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{campaign.name}</div>
                        <div className="text-sm text-slate-600">
                          {campaign.sent} sendt • {campaign.opened} åpnet
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{campaign.openRate.toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">Åpningsrate</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Ingen toppresultater ennå"
                  description="Dine beste kampanjer vil vises her etter hvert som du samler data."
                  icon={<Target className="w-8 h-8 text-green-500" />}
                  actionLabel="Start din første kampanje"
                  actionHref="/campaigns"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Industries by Reply Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Topp bransjer etter svarrate</CardTitle>
            <CardDescription>Bransjer med høyest engasjement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers?.topIndustries && topPerformers.topIndustries.length > 0 ? (
                topPerformers.topIndustries.map((industry, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{industry.industry}</div>
                        <div className="text-sm text-slate-600">
                          {industry.total} leads • {industry.replied} svart
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{industry.replyRate.toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">Svarrate</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Ikke nok data"
                  description="Du trenger minst 5 leads per bransje for å se statistikk."
                  icon={<BarChart3 className="w-8 h-8 text-purple-500" />}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequence Analytics */}
      {sequenceAnalytics && sequenceAnalytics.overview.totalSequences > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sekvensytelse</CardTitle>
            <CardDescription>Fullføringsrater og påmeldingsstatistikk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-sm text-indigo-600 font-medium">Totalt sekvenser</div>
                <div className="text-2xl font-bold text-indigo-900 mt-1">
                  {sequenceAnalytics.overview.totalSequences}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Totalt påmeldt</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {sequenceAnalytics.overview.totalEnrolled}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Fullført</div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {sequenceAnalytics.overview.totalCompleted}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Gj.snitt fullføringsrate</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {sequenceAnalytics.overview.avgCompletionRate.toFixed(1)}%
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sequenceAnalytics.sequencePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalEnrolled" fill="#6366f1" name="Påmeldt" />
                <Bar dataKey="completed" fill="#10b981" name="Fullført" />
                <Bar dataKey="active" fill="#f59e0b" name="Aktiv" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Analytics() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}

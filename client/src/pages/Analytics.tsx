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
import { Download, TrendingUp, Users, Mail, MousePointerClick, MessageSquare } from "lucide-react";
import { DashboardStatsSkeleton } from "@/components/SkeletonLoaders";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function AnalyticsContent() {
  const [dateRange, setDateRange] = useState("30");

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));

  // Fetch analytics data
  const { data: campaignPerf, isLoading: loadingCampaign } = trpc.analytics.campaignPerformance.useQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const { data: leadAnalytics, isLoading: loadingLeads } = trpc.analytics.leadAnalytics.useQuery();
  const { data: sequenceAnalytics, isLoading: loadingSequences } = trpc.analytics.sequenceAnalytics.useQuery();
  const { data: heatmap, isLoading: loadingHeatmap } = trpc.analytics.engagementHeatmap.useQuery();
  const { data: topPerformers, isLoading: loadingTop } = trpc.analytics.topPerformers.useQuery();

  const isLoading = loadingCampaign || loadingLeads || loadingSequences || loadingHeatmap || loadingTop;

  const exportToPDF = () => {
    // TODO: Implement PDF export
    alert("PDF export coming soon!");
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <DashboardStatsSkeleton />
      </div>
    );
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
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Campaigns</CardTitle>
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
              <CardTitle className="text-sm font-medium text-slate-600">Emails Sent</CardTitle>
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
              <CardTitle className="text-sm font-medium text-slate-600">Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">
                  {campaignPerf?.overview.avgOpenRate.toFixed(1) || 0}%
                </div>
                <MousePointerClick className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Reply Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">
                  {campaignPerf?.overview.avgReplyRate.toFixed(1) || 0}%
                </div>
                <MessageSquare className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance Over Time</CardTitle>
            <CardDescription>Track opens, clicks, and replies over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={campaignPerf?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opens" stroke="#6366f1" strokeWidth={2} name="Opens" />
                <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} name="Clicks" />
                <Line type="monotone" dataKey="replies" stroke="#ec4899" strokeWidth={2} name="Replies" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Distribution</CardTitle>
              <CardDescription>Current status of all leads</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadAnalytics?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(leadAnalytics?.statusDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Industries */}
          <Card>
            <CardHeader>
              <CardTitle>Top Industries</CardTitle>
              <CardDescription>Leads by industry sector</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadAnalytics?.topIndustries || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="industry" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Send Times (Hourly) */}
          <Card>
            <CardHeader>
              <CardTitle>Best Send Times (Hourly)</CardTitle>
              <CardDescription>Open rates by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={heatmap?.hourly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: "Hour", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Open Rate %", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="openRate" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Best Send Days */}
          <Card>
            <CardHeader>
              <CardTitle>Best Send Days</CardTitle>
              <CardDescription>Open rates by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={heatmap?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: "Open Rate %", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="openRate" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Campaigns with highest open rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers?.topCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{campaign.name}</div>
                        <div className="text-sm text-slate-600">
                          {campaign.sent} sent • {campaign.opened} opened
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{campaign.openRate.toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">Open Rate</div>
                    </div>
                  </div>
                ))}
                {(!topPerformers?.topCampaigns || topPerformers.topCampaigns.length === 0) && (
                  <div className="text-center py-8 text-slate-500">No campaigns yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Industries by Reply Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Top Industries by Reply Rate</CardTitle>
              <CardDescription>Industries with highest engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers?.topIndustries.map((industry, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{industry.industry}</div>
                        <div className="text-sm text-slate-600">
                          {industry.total} leads • {industry.replied} replied
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{industry.replyRate.toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">Reply Rate</div>
                    </div>
                  </div>
                ))}
                {(!topPerformers?.topIndustries || topPerformers.topIndustries.length === 0) && (
                  <div className="text-center py-8 text-slate-500">Not enough data yet (min 5 leads per industry)</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sequence Analytics */}
        {sequenceAnalytics && sequenceAnalytics.overview.totalSequences > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sequence Performance</CardTitle>
              <CardDescription>Completion rates and enrollment statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-indigo-600 font-medium">Total Sequences</div>
                  <div className="text-2xl font-bold text-indigo-900 mt-1">
                    {sequenceAnalytics.overview.totalSequences}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total Enrolled</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {sequenceAnalytics.overview.totalEnrolled}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Completed</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {sequenceAnalytics.overview.totalCompleted}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Avg Completion Rate</div>
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
                  <Bar dataKey="totalEnrolled" fill="#6366f1" name="Enrolled" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="active" fill="#f59e0b" name="Active" />
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

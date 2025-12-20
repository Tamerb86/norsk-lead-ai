import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, TrendingUp, Users, Search, FileText, ArrowUpRight, Sparkles, BarChart3, Calendar, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import { Link } from "wouter";
import { useState } from "react";
import { DashboardStatsSkeleton, ChartsSkeleton } from "@/components/SkeletonLoaders";

// Chart colors
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');

  // Sample data for charts (in production, this would come from API based on dateRange)
  const campaignPerformanceData = [
    { date: 'Jan 1', sent: 120, opened: 85, replied: 23 },
    { date: 'Jan 8', sent: 150, opened: 102, replied: 31 },
    { date: 'Jan 15', sent: 180, opened: 125, replied: 38 },
    { date: 'Jan 22', sent: 200, opened: 145, replied: 45 },
    { date: 'Jan 29', sent: 165, opened: 118, replied: 35 },
    { date: 'Feb 5', sent: 190, opened: 138, replied: 42 },
    { date: 'Feb 12', sent: 220, opened: 165, replied: 52 },
  ];

  const leadsByIndustryData = [
    { industry: 'IT', count: 145 },
    { industry: 'Consulting', count: 98 },
    { industry: 'Construction', count: 76 },
    { industry: 'Retail', count: 65 },
    { industry: 'Healthcare', count: 54 },
    { industry: 'Finance', count: 43 },
  ];

  const leadStatusData = [
    { name: 'Contacted', value: 245 },
    { name: 'Interested', value: 132 },
    { name: 'Replied', value: 87 },
    { name: 'Closed', value: 54 },
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('NorskLeads Analytics Report', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Date Range: Last ${dateRange} days`, 20, 38);
    
    // Add stats
    doc.setFontSize(14);
    doc.text('Overview Statistics', 20, 50);
    doc.setFontSize(11);
    doc.text(`Total Companies: ${stats?.companies.total || 0}`, 20, 60);
    doc.text(`Total Campaigns: ${stats?.campaigns.total || 0}`, 20, 68);
    doc.text(`Total Leads: ${stats?.leads.total || 0}`, 20, 76);
    const openRateValue: any = stats?.leads.openRate;
    const openRate = typeof openRateValue === 'number' ? openRateValue.toFixed(1) : (typeof openRateValue === 'string' ? parseFloat(openRateValue).toFixed(1) : '0.0');
    const replyRateValue: any = stats?.leads.replyRate;
    const replyRate = typeof replyRateValue === 'number' ? replyRateValue.toFixed(1) : (typeof replyRateValue === 'string' ? parseFloat(replyRateValue).toFixed(1) : '0.0');
    doc.text(`Open Rate: ${openRate}%`, 20, 84);
    doc.text(`Reply Rate: ${replyRate}%`, 20, 92);
    
    // Add campaign performance data
    doc.setFontSize(14);
    doc.text('Campaign Performance', 20, 110);
    doc.setFontSize(10);
    let y = 120;
    campaignPerformanceData.forEach(item => {
      doc.text(`${item.date}: Sent ${item.sent}, Opened ${item.opened}, Replied ${item.replied}`, 20, y);
      y += 8;
    });
    
    // Add leads by industry
    doc.setFontSize(14);
    doc.text('Leads by Industry', 20, y + 10);
    doc.setFontSize(10);
    y += 20;
    leadsByIndustryData.forEach(item => {
      doc.text(`${item.industry}: ${item.count} leads`, 20, y);
      y += 8;
    });
    
    // Save PDF
    doc.save(`norskleads-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 absolute top-0"></div>
          </div>
          <p className="text-sm text-gray-600 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Modern Header with Gradient */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NorskLeads
                </h1>
                <p className="text-sm text-gray-600">Norwegian Lead Generation Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Welcome, {user.name || user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards with Modern Design */}
        {statsLoading ? (
          <DashboardStatsSkeleton />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Companies Card */}
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Companies
                </CardTitle>
                <ArrowUpRight className="w-5 h-5 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-3">
                {stats?.companies.total.toLocaleString() || 0}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">With email</span>
                  <span className="font-semibold text-white">{stats?.companies.withEmail.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">With phone</span>
                  <span className="font-semibold text-white">{stats?.companies.withPhone.toLocaleString() || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Card */}
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-500 to-indigo-600">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-indigo-100 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Campaigns
                </CardTitle>
                <ArrowUpRight className="w-5 h-5 text-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-3">
                {stats?.campaigns.total || 0}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-indigo-100">{stats?.campaigns.active || 0} active campaigns</span>
              </div>
            </CardContent>
          </Card>

          {/* Leads Card */}
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-purple-600">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Leads
                </CardTitle>
                <ArrowUpRight className="w-5 h-5 text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-3">
                {stats?.leads.total || 0}
              </div>
              <div className="text-sm text-purple-100">
                Total leads generated
              </div>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-pink-500 to-rose-600">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-pink-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance
                </CardTitle>
                <ArrowUpRight className="w-5 h-5 text-pink-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-3">
                {(() => {
                  const rate: any = stats?.leads.openRate;
                  return typeof rate === 'number' ? rate.toFixed(1) : (typeof rate === 'string' ? parseFloat(rate).toFixed(1) : '0.0');
                })()}%
              </div>
              <div className="text-sm text-pink-100">
                Average open rate
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Quick Actions with Modern Design */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </div>
            <CardDescription>Start working with Norwegian companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/search">
                <Button 
                  className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-lg group" 
                  variant="outline"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold">Search Companies</span>
                </Button>
              </Link>
              
              <Link href="/campaigns">
                <Button 
                  className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-300 hover:scale-105 hover:shadow-lg group" 
                  variant="outline"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold">Create Campaign</span>
                </Button>
              </Link>
              
              <Link href="/templates">
                <Button 
                  className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-2 border-indigo-200 text-indigo-700 hover:text-indigo-800 transition-all duration-300 hover:scale-105 hover:shadow-lg group" 
                  variant="outline"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold">Email Templates</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="mt-8 mb-6">
          {statsLoading ? (
            <ChartsSkeleton />
          ) : (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-xl">Analytics & Reports</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToPDF()}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Line Chart - Campaign Performance Over Time */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Campaign Performance Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Emails Sent" />
                    <Line type="monotone" dataKey="opened" stroke="#10b981" strokeWidth={2} name="Opened" />
                    <Line type="monotone" dataKey="replied" stroke="#8b5cf6" strokeWidth={2} name="Replied" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Leads by Industry */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Leads by Industry (Næringskode)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leadsByIndustryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="industry" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Number of Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Lead Status Distribution */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Lead Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Recent Activity Section (Placeholder for future) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Recent Campaigns</CardTitle>
              <CardDescription>Your latest email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No recent campaigns</p>
                <p className="text-xs mt-1">Create your first campaign to get started</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Leads</CardTitle>
              <CardDescription>Leads with highest engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No leads yet</p>
                <p className="text-xs mt-1">Start a campaign to generate leads</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

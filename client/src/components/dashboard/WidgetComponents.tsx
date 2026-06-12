import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Mail,
  Users,
  TrendingUp,
  Search,
  FileText,
  ArrowUpRight,
  Eye,
  MessageSquare,
  ChevronRight,
  Calendar,
  Phone,
  Plus,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Status colors
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  sending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  paused: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  new: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  contacted: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  interested: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  qualified: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  converted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Utkast",
  scheduled: "Planlagt",
  sending: "Sender",
  completed: "Fullført",
  paused: "Pauset",
  new: "Ny",
  contacted: "Kontaktet",
  interested: "Interessert",
  qualified: "Kvalifisert",
  converted: "Konvertert",
};

// Stats Widget: Companies
interface StatsCompaniesProps {
  data?: { total: number; withEmail: number; withPhone: number };
}

export function StatsCompaniesWidget({ data }: StatsCompaniesProps) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-bold text-foreground">
        {data?.total?.toLocaleString() || 0}
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          <span>{data?.withEmail?.toLocaleString() || 0} med e-post</span>
        </div>
        <div className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          <span>{data?.withPhone?.toLocaleString() || 0} med telefon</span>
        </div>
      </div>
    </div>
  );
}

// Stats Widget: Campaigns
interface StatsCampaignsProps {
  data?: { total: number; active: number; completed: number };
}

export function StatsCampaignsWidget({ data }: StatsCampaignsProps) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-bold text-foreground">
        {data?.total || 0}
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>{data?.active || 0} aktive</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{data?.completed || 0} fullført</span>
        </div>
      </div>
    </div>
  );
}

// Stats Widget: Leads
interface StatsLeadsProps {
  data?: { total: number; sent: number; opened: number; replied: number };
}

export function StatsLeadsWidget({ data }: StatsLeadsProps) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-bold text-foreground">
        {data?.total || 0}
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          <span>{data?.sent || 0} sendt</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{data?.opened || 0} åpnet</span>
        </div>
      </div>
    </div>
  );
}

// Stats Widget: Performance
interface StatsPerformanceProps {
  data?: { openRate: string; replyRate: string; clickRate?: string };
}

export function StatsPerformanceWidget({ data }: StatsPerformanceProps) {
  const openRate = parseFloat(data?.openRate || "0");
  const replyRate = parseFloat(data?.replyRate || "0");

  return (
    <div className="h-full flex flex-col justify-center space-y-3">
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Åpningsrate</span>
          <span className="font-medium">{openRate.toFixed(1)}%</span>
        </div>
        <Progress value={openRate} className="h-2" />
      </div>
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Svarrate</span>
          <span className="font-medium">{replyRate.toFixed(1)}%</span>
        </div>
        <Progress value={replyRate} className="h-2" />
      </div>
    </div>
  );
}

// Chart Widget: Campaigns Performance
interface ChartCampaignsProps {
  data?: Array<{ date: string; sent: number; opened: number; replied: number }>;
}

export function ChartCampaignsWidget({ data }: ChartCampaignsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen data ennå</p>
          <Link href="/campaigns">
            <Button variant="link" size="sm" className="mt-2">
              Opprett kampanje
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Area
          type="monotone"
          dataKey="sent"
          stroke="#6366f1"
          fillOpacity={1}
          fill="url(#colorSent)"
          name="Sendt"
        />
        <Area
          type="monotone"
          dataKey="opened"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorOpened)"
          name="Åpnet"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Chart Widget: Leads by Industry
interface ChartLeadsProps {
  data?: Array<{ industry: string; count: number }>;
}

export function ChartLeadsWidget({ data }: ChartLeadsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen leads ennå</p>
          <Link href="/search">
            <Button variant="link" size="sm" className="mt-2">
              Søk etter bedrifter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="industry" type="category" tick={{ fontSize: 11 }} width={100} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Antall" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Recent Campaigns Widget
interface RecentCampaignsProps {
  data?: Array<{
    id: number;
    name: string;
    status: string;
    sentEmails: number;
    openRate: string;
  }>;
}

export function RecentCampaignsWidget({ data }: RecentCampaignsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen kampanjer ennå</p>
          <Link href="/campaigns">
            <Button variant="link" size="sm" className="mt-2">
              Opprett din første kampanje
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((campaign) => (
        <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{campaign.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className={STATUS_COLORS[campaign.status] || ""}>
                    {STATUS_LABELS[campaign.status] || campaign.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {campaign.sentEmails} sendt
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{campaign.openRate}%</p>
              <p className="text-xs text-muted-foreground">åpningsrate</p>
            </div>
          </div>
        </Link>
      ))}
      <Link href="/campaigns">
        <Button variant="ghost" size="sm" className="w-full">
          Se alle kampanjer
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

// Top Leads Widget
interface TopLeadsProps {
  data?: Array<{
    id: number;
    companyName: string;
    email: string;
    score: number;
    status: string;
  }>;
}

export function TopLeadsWidget({ data }: TopLeadsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen leads ennå</p>
          <Link href="/search">
            <Button variant="link" size="sm" className="mt-2">
              Finn dine første leads
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
    if (score >= 60) return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300";
    if (score >= 40) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
    return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((lead) => (
        <Link key={lead.id} href={`/leads/${lead.id}`}>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{lead.companyName}</p>
                <p className="text-xs text-muted-foreground">{lead.email}</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-md text-sm font-medium ${getScoreColor(lead.score)}`}>
              {lead.score}
            </div>
          </div>
        </Link>
      ))}
      <Link href="/leads">
        <Button variant="ghost" size="sm" className="w-full">
          Se alle leads
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

// Upcoming Events Widget
interface UpcomingEventsProps {
  data?: Array<{
    id: number;
    title: string;
    type: string;
    startTime: string;
    companyName?: string;
  }>;
}

export function UpcomingEventsWidget({ data }: UpcomingEventsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen kommende hendelser</p>
          <Link href="/calendar">
            <Button variant="link" size="sm" className="mt-2">
              Planlegg en hendelse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 4).map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(event.startTime).toLocaleDateString("nb-NO", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
      <Link href="/calendar">
        <Button variant="ghost" size="sm" className="w-full">
          Se kalender
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

// Notifications Widget
interface NotificationsProps {
  data?: Array<{
    id: number;
    title: string;
    message: string | null;
    type: string;
    isRead: boolean;
  }>;
}

export function NotificationsWidget({ data }: NotificationsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen nye varsler</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 4).map((notification) => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg ${notification.isRead ? "bg-muted/30" : "bg-primary/5"}`}
        >
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {notification.message}
          </p>
        </div>
      ))}
    </div>
  );
}

// Quick Actions Widget
export function QuickActionsWidget() {
  const actions = [
    { icon: Search, label: "Søk bedrifter", href: "/search", color: "bg-blue-500" },
    { icon: Plus, label: "Ny kampanje", href: "/campaigns/new", color: "bg-green-500" },
    { icon: FileText, label: "Ny mal", href: "/templates/new", color: "bg-purple-500" },
    { icon: Calendar, label: "Planlegg", href: "/calendar", color: "bg-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Button
            variant="outline"
            className="w-full h-full flex flex-col items-center justify-center gap-2 py-4"
          >
            <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
              <action.icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs">{action.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}

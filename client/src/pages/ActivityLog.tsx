import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  User,
  Building2,
  Mail,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  LogIn,
  LogOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

// Action icons and colors
const actionConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  create: { icon: <Plus className="h-4 w-4" />, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", label: "Opprettet" },
  update: { icon: <Edit className="h-4 w-4" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", label: "Oppdatert" },
  delete: { icon: <Trash2 className="h-4 w-4" />, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", label: "Slettet" },
  view: { icon: <Eye className="h-4 w-4" />, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "Vist" },
  export: { icon: <Download className="h-4 w-4" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", label: "Eksportert" },
  login: { icon: <LogIn className="h-4 w-4" />, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", label: "Logget inn" },
  logout: { icon: <LogOut className="h-4 w-4" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", label: "Logget ut" },
  send: { icon: <Mail className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300", label: "Sendt" },
  sync: { icon: <RefreshCw className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", label: "Synkronisert" },
};

// Entity icons
const entityIcons: Record<string, React.ReactNode> = {
  company: <Building2 className="h-4 w-4" />,
  lead: <User className="h-4 w-4" />,
  campaign: <Mail className="h-4 w-4" />,
  template: <FileText className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
};

export default function ActivityLog() {
  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
    search: "",
  });
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["activityLogs", filters, page],
    queryFn: () => trpcClient.activityLog.getLogs.query({
      entityType: filters.entityType || undefined,
      action: filters.action || undefined,
      limit,
      offset: page * limit,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ["activityStats"],
    queryFn: () => trpcClient.activityLog.getStats.query({ days: 30 }),
  });

  const getActionConfig = (action: string) => {
    return actionConfig[action] || { 
      icon: <Activity className="h-4 w-4" />, 
      color: "bg-gray-100 text-gray-700", 
      label: action 
    };
  };

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: nb });
    } catch {
      return date;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-6 w-6 text-indigo-600" />
              Aktivitetslogg
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Se alle handlinger utført i systemet
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats && Array.isArray(stats) ? (
            <>
              <Card className="dark:bg-gray-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.filter((s: any) => s.action === 'create').reduce((acc: number, s: any) => acc + Number(s.count), 0)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Opprettet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.filter((s: any) => s.action === 'update').reduce((acc: number, s: any) => acc + Number(s.count), 0)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Oppdatert</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.filter((s: any) => s.action === 'export').reduce((acc: number, s: any) => acc + Number(s.count), 0)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Eksportert</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <LogIn className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.filter((s: any) => s.action === 'login').reduce((acc: number, s: any) => acc + Number(s.count), 0)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Innlogginger</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="dark:bg-gray-800">
                  <CardContent className="pt-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Filters */}
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Søk i aktiviteter..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <Select
                value={filters.entityType || "all"}
                onValueChange={(value) => setFilters({ ...filters, entityType: value === "all" ? "" : value })}
              >
                <SelectTrigger className="w-full sm:w-[180px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Alle typer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle typer</SelectItem>
                  <SelectItem value="company">Bedrifter</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="campaign">Kampanjer</SelectItem>
                  <SelectItem value="template">Maler</SelectItem>
                  <SelectItem value="user">Brukere</SelectItem>
                  <SelectItem value="calendar">Kalender</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.action || "all"}
                onValueChange={(value) => setFilters({ ...filters, action: value === "all" ? "" : value })}
              >
                <SelectTrigger className="w-full sm:w-[180px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Alle handlinger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle handlinger</SelectItem>
                  <SelectItem value="create">Opprettet</SelectItem>
                  <SelectItem value="update">Oppdatert</SelectItem>
                  <SelectItem value="delete">Slettet</SelectItem>
                  <SelectItem value="view">Vist</SelectItem>
                  <SelectItem value="export">Eksportert</SelectItem>
                  <SelectItem value="login">Innlogging</SelectItem>
                  <SelectItem value="send">Sendt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Nylige aktiviteter</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Siste 30 dager
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border rounded-lg dark:border-gray-700">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs && Array.isArray(logs) && logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log: any) => {
                  const config = getActionConfig(log.action);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Action Icon */}
                      <div className={`p-2 rounded-full ${config.color}`}>
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.user_name || log.user_email || "Ukjent bruker"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {log.entity_type && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              {entityIcons[log.entity_type]}
                              {log.entity_type}
                            </Badge>
                          )}
                        </div>
                        {log.entity_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                            {log.entity_name}
                          </p>
                        )}
                        {log.details && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {typeof log.details === 'string' 
                              ? JSON.parse(log.details).message || log.details 
                              : log.details.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {formatTime(log.createdAt)}
                          {log.ip_address && ` • ${log.ip_address}`}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="dark:bg-gray-700 dark:border-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Forrige
                  </Button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Side {page + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={logs.length < limit}
                    className="dark:bg-gray-700 dark:border-gray-600"
                  >
                    Neste
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ingen aktiviteter funnet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Aktiviteter vil vises her når du bruker systemet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

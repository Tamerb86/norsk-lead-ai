import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Users,
  Building2,
  Mail,
  TrendingUp,
  Shield,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Search,
  CreditCard,
  DollarSign,
  Activity,
  Calendar,
  Crown,
  Zap,
  Database,
  Server,
  Globe,
  Settings,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  activeSubscriptions: number;
  revenue: number;
  freeUsers?: number;
  basicUsers?: number;
  proUsers?: number;
}

interface AdminUser {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  lastLogin?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  });
  const [importLoading, setImportLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      window.location.href = "/dashboard";
    }
  }, [authLoading, user]);

  // Fetch admin data
  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats
      const statsRes = await fetch("/api/admin/stats", { credentials: "include" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch users
      const usersRes = await fetch("/api/admin/users", { credentials: "include" });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (err) {
      setError("Kunne ikke hente data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setSuccess("Rolle oppdatert");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Kunne ikke oppdatere rolle");
      }
    } catch (err) {
      setError("Kunne ikke oppdatere rolle");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      const res = await fetch(`/api/admin/users/${deleteDialog.user.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== deleteDialog.user!.id));
        setSuccess("Bruker slettet");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Kunne ikke slette bruker");
      }
    } catch (err) {
      setError("Kunne ikke slette bruker");
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleImportCompanies = async () => {
    setImportLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/import-companies", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setSuccess("Import startet. Sjekk logger for fremdrift.");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError("Kunne ikke starte import");
      }
    } catch (err) {
      setError("Kunne ikke starte import");
    } finally {
      setImportLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate subscription breakdown
  const freeUsers = users.filter(u => !u.subscriptionPlan || u.subscriptionPlan === 'free').length;
  const basicUsers = users.filter(u => u.subscriptionPlan === 'basic').length;
  const proUsers = users.filter(u => u.subscriptionPlan === 'pro').length;

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Oversikt og administrasjon av systemet</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Oppdater
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Totale brukere</p>
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Månedlig inntekt</p>
                  <p className="text-3xl font-bold">{(stats?.revenue || 0).toLocaleString()} kr</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Aktive abonnementer</p>
                  <p className="text-3xl font-bold">{stats?.activeSubscriptions || 0}</p>
                </div>
                <CreditCard className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">E-poster sendt</p>
                  <p className="text-3xl font-bold">{(stats?.totalEmailsSent || 0).toLocaleString()}</p>
                </div>
                <Mail className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Zap className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gratis brukere</p>
                  <p className="text-xl font-bold text-gray-900">{freeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Crown className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Basic abonnenter</p>
                  <p className="text-xl font-bold text-gray-900">{basicUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Crown className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pro abonnenter</p>
                  <p className="text-xl font-bold text-gray-900">{proUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Users className="h-4 w-4 mr-2" />
              Brukere
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Building2 className="h-4 w-4 mr-2" />
              Bedrifter
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <CreditCard className="h-4 w-4 mr-2" />
              Abonnementer
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Brukere</CardTitle>
                    <CardDescription>
                      Administrer brukerkontoer og tilganger
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Søk brukere..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Opprettet</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "-"}</TableCell>
                        <TableCell className="text-gray-500">{u.email || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            u.subscriptionPlan === 'pro' ? 'default' :
                            u.subscriptionPlan === 'basic' ? 'secondary' : 'outline'
                          } className={
                            u.subscriptionPlan === 'pro' ? 'bg-purple-100 text-purple-700' :
                            u.subscriptionPlan === 'basic' ? 'bg-blue-100 text-blue-700' : ''
                          }>
                            {u.subscriptionPlan === 'pro' ? 'Pro' :
                             u.subscriptionPlan === 'basic' ? 'Basic' : 'Gratis'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value)}
                            disabled={u.id === user?.id}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString("nb-NO")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteDialog({ open: true, user: u })}
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Bedriftsdatabase</CardTitle>
                <CardDescription>
                  Administrer bedriftsdata fra Brønnøysund
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-blue-600">Totale bedrifter</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {stats?.totalCompanies?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600">Med e-post</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">~40%</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-purple-600">Med nettside</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">~35%</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    onClick={handleImportCompanies}
                    disabled={importLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {importLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importerer...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Importer bedrifter
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500">
                    Sist oppdatert: {stats?.totalCompanies ? "I dag" : "Aldri"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-4">
              {/* Revenue Overview */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Månedlig inntekt</p>
                        <p className="text-2xl font-bold text-green-700">
                          {(stats?.revenue || 0).toLocaleString()} NOK
                        </p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Betalende kunder</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {basicUsers + proUsers}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Snitt per kunde</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {(basicUsers + proUsers) > 0 
                            ? Math.round((stats?.revenue || 0) / (basicUsers + proUsers)) 
                            : 0} NOK
                        </p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Plans Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Abonnementsplaner</CardTitle>
                  <CardDescription>Oversikt over tilgjengelige planer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Free Plan */}
                    <div className="rounded-lg border-2 border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Gratis</h4>
                        <Badge variant="outline" className="text-gray-500">
                          {freeUsers} brukere
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-3">0 NOK<span className="text-sm font-normal text-gray-500">/mnd</span></p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 50 bedrifter/mnd</li>
                        <li>• 1 kampanje</li>
                        <li>• 100 e-poster/mnd</li>
                      </ul>
                    </div>

                    {/* Basic Plan */}
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-900">Basic</h4>
                        <Badge className="bg-blue-100 text-blue-700">
                          {basicUsers} brukere
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 mb-3">499 NOK<span className="text-sm font-normal text-blue-600">/mnd</span></p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 1,000 bedrifter/mnd</li>
                        <li>• 5 kampanjer</li>
                        <li>• 5,000 e-poster/mnd</li>
                      </ul>
                    </div>

                    {/* Pro Plan */}
                    <div className="rounded-lg border-2 border-purple-200 bg-purple-50/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-purple-900">Pro</h4>
                        <Badge className="bg-purple-100 text-purple-700">
                          {proUsers} brukere
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 mb-3">1,299 NOK<span className="text-sm font-normal text-purple-600">/mnd</span></p>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Ubegrenset bedrifter</li>
                        <li>• Ubegrenset kampanjer</li>
                        <li>• 25,000 e-poster/mnd</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe Configuration */}
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Stripe konfigurasjon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700 mb-3">
                    For å aktivere betalinger, legg til følgende miljøvariabler i Railway:
                  </p>
                  <div className="bg-white rounded-lg p-3 font-mono text-xs space-y-1 border border-yellow-200">
                    <p className="text-gray-600">STRIPE_SECRET_KEY=<span className="text-yellow-600">sk_live_...</span></p>
                    <p className="text-gray-600">STRIPE_PUBLISHABLE_KEY=<span className="text-yellow-600">pk_live_...</span></p>
                    <p className="text-gray-600">STRIPE_WEBHOOK_SECRET=<span className="text-yellow-600">whsec_...</span></p>
                    <p className="text-gray-600">STRIPE_PRICE_ID_BASIC=<span className="text-yellow-600">price_...</span></p>
                    <p className="text-gray-600">STRIPE_PRICE_ID_PRO=<span className="text-yellow-600">price_...</span></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Systemstatus</CardTitle>
                  <CardDescription>Oversikt over systemkomponenter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-gray-500" />
                      <span>API Server</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 text-sm">Operativ</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-gray-500" />
                      <span>Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 text-sm">Tilkoblet</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span>E-post tjeneste</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 text-sm">Aktiv</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <span>Stripe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-600 text-sm">Venter konfigurasjon</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Miljøvariabler</CardTitle>
                  <CardDescription>Status for konfigurerte variabler</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">NODE_ENV</span>
                    <Badge className="bg-green-100 text-green-700">production</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">DATABASE_URL</span>
                    <Badge className="bg-green-100 text-green-700">Konfigurert</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">RESEND_API_KEY</span>
                    <Badge className="bg-green-100 text-green-700">Konfigurert</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">STRIPE_SECRET_KEY</span>
                    <Badge className="bg-yellow-100 text-yellow-700">Mangler</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">OPENAI_API_KEY</span>
                    <Badge className="bg-green-100 text-green-700">Konfigurert</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Slett bruker</DialogTitle>
              <DialogDescription>
                Er du sikker på at du vil slette {deleteDialog.user?.name || deleteDialog.user?.email}?
                Denne handlingen kan ikke angres.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, user: null })}
              >
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
              >
                Slett
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

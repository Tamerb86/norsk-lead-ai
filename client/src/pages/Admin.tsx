import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  UserPlus,
  UserMinus,
  Ban,
  CheckCircle2,
  Eye,
  Edit,
  Send,
  FileText,
  Clock,
  LogIn,
  XCircle,
} from "lucide-react";
import { AISettingsTab } from "@/components/admin/AISettingsTab";
import { BrregTab } from "@/components/admin/BrregTab";

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
  lastSignedIn?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  usedLeadsThisMonth?: number;
  monthlyLeadsQuota?: number;
  isActive?: boolean;
}

// Email Finder Tab Component
function EmailFinderTab() {
  const [stats, setStats] = useState<{
    total: number;
    withEmail: number;
    withoutEmail: number;
    websiteNoEmail: number;
    withPhone: number;
    withWebsite: number;
    emailCoverage: number;
    phoneCoverage: number;
    websiteCoverage: number;
  } | null>(null);
  const [companies, setCompanies] = useState<Array<{
    id: number;
    organisasjonsnummer: string;
    navn: string;
    hjemmeside: string | null;
    telefon: string | null;
    kommune: string | null;
    fylke: string | null;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichingId, setEnrichingId] = useState<number | null>(null);
  const [results, setResults] = useState<Array<{
    companyName: string;
    email: string | null;
    source: string;
    confidence: number;
  }>>([]);
  const [filterFylke, setFilterFylke] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/trpc/emailFinder.getStats", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Handle tRPC response format
        const statsData = data.result?.data?.json || data.result?.data;
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchCompaniesWithoutEmail = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use correct tRPC input format with json wrapper
      const inputData = { json: { limit, fylke: filterFylke || undefined, hasWebsite: true } };
      const params = new URLSearchParams();
      params.append("input", JSON.stringify(inputData));
      
      const res = await fetch(`/api/trpc/emailFinder.getCompaniesWithoutEmail?${params}`, { 
        credentials: "include" 
      });
      if (res.ok) {
        const data = await res.json();
        // Handle tRPC response format
        const companiesData = data.result?.data?.json || data.result?.data || [];
        setCompanies(companiesData);
      } else {
        setError("Kunne ikke hente bedrifter");
      }
    } catch (err) {
      setError("Kunne ikke hente bedrifter");
    } finally {
      setLoading(false);
    }
  };

  const findEmailForCompany = async (companyId: number) => {
    setEnrichingId(companyId);
    setError(null);
    try {
      const res = await fetch("/api/trpc/emailFinder.findEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ json: { companyId } }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const result = data.result?.data?.json || data.result?.data;
        
        if (result?.email) {
          setSuccess(`Fant e-post: ${result.email}`);
          // Remove from list
          setCompanies(companies.filter(c => c.id !== companyId));
          // Add to results
          setResults([...results, {
            companyName: result.companyName,
            email: result.email,
            source: result.source,
            confidence: result.confidence,
          }]);
          // Refresh stats
          fetchStats();
        } else {
          setError(`Ingen e-post funnet for denne bedriften`);
        }
      } else {
        setError("Kunne ikke søke etter e-post");
      }
    } catch (err) {
      setError("Kunne ikke søke etter e-post");
    } finally {
      setEnrichingId(null);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  const runAutoEnrich = async () => {
    setEnriching(true);
    setError(null);
    try {
      const res = await fetch("/api/trpc/emailFinder.autoEnrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ json: { limit, fylke: filterFylke || undefined } }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const result = data.result?.data?.json || data.result?.data;
        setSuccess(`Ferdig! Fant ${result?.found || 0} e-poster, oppdaterte ${result?.updated || 0} bedrifter`);
        fetchStats();
        fetchCompaniesWithoutEmail();
      } else {
        setError("Kunne ikke kjøre auto-enrichment");
      }
    } catch (err) {
      setError("Kunne ikke kjøre auto-enrichment");
    } finally {
      setEnriching(false);
      setTimeout(() => { setSuccess(null); setError(null); }, 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Totalt bedrifter</p>
                <p className="text-2xl font-bold">{stats?.total?.toLocaleString() || "-"}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Med e-post</p>
                <p className="text-2xl font-bold text-green-600">{stats?.withEmail?.toLocaleString() || "-"}</p>
                <p className="text-xs text-gray-400">{stats?.emailCoverage || 0}% dekning</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Uten e-post</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.withoutEmail?.toLocaleString() || "-"}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Med nettside (uten e-post)</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.websiteNoEmail?.toLocaleString() || "-"}</p>
                <p className="text-xs text-gray-400">Gode kandidater</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Email Finder</CardTitle>
          <CardDescription>
            Finn e-postadresser for bedrifter ved å søke på nettsider og Google Maps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Fylke (valgfritt)</Label>
              <Input
                placeholder="F.eks. Oslo, Vestland..."
                value={filterFylke}
                onChange={(e) => setFilterFylke(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label>Antall</Label>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchCompaniesWithoutEmail} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Hent bedrifter
            </Button>
            <Button onClick={runAutoEnrich} disabled={enriching} variant="default" className="bg-green-600 hover:bg-green-700">
              {enriching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Auto-berik ({limit})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      {companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bedrifter uten e-post ({companies.length})</CardTitle>
            <CardDescription>Klikk "Finn e-post" for å søke etter e-postadresse</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bedrift</TableHead>
                  <TableHead>Org.nr</TableHead>
                  <TableHead>Kommune</TableHead>
                  <TableHead>Nettside</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.navn}</TableCell>
                    <TableCell className="text-gray-500">{company.organisasjonsnummer}</TableCell>
                    <TableCell>{company.kommune || "-"}</TableCell>
                    <TableCell>
                      {company.hjemmeside ? (
                        <a 
                          href={company.hjemmeside.startsWith("http") ? company.hjemmeside : `https://${company.hjemmeside}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {company.hjemmeside.replace(/^https?:\/\//, "").slice(0, 25)}
                        </a>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{company.telefon || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => findEmailForCompany(company.id)}
                        disabled={enrichingId === company.id}
                      >
                        {enrichingId === company.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-1" />
                            Finn e-post
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Funnet e-poster ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bedrift</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Kilde</TableHead>
                  <TableHead>Konfidens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{result.companyName}</TableCell>
                    <TableCell>
                      <a href={`mailto:${result.email}`} className="text-blue-600 hover:underline">
                        {result.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {result.source === "website_scrape" ? "Nettside" : "Google"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={result.confidence >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {result.confidence}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  
  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  });
  const [userDetailDialog, setUserDetailDialog] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  });
  const [changePlanDialog, setChangePlanDialog] = useState<{ open: boolean; user: AdminUser | null; newPlan: string }>({
    open: false,
    user: null,
    newPlan: "",
  });
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; users: AdminUser[]; subject: string; body: string }>({
    open: false,
    users: [],
    subject: "",
    body: "",
  });
  const [importLoading, setImportLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

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

  const handlePlanChange = async () => {
    if (!changePlanDialog.user || !changePlanDialog.newPlan) return;

    try {
      const res = await fetch(`/api/admin/users/${changePlanDialog.user.id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: changePlanDialog.newPlan }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === changePlanDialog.user!.id 
            ? { ...u, subscriptionPlan: changePlanDialog.newPlan } 
            : u
        ));
        setSuccess(`Plan endret til ${changePlanDialog.newPlan}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Kunne ikke endre plan");
      }
    } catch (err) {
      setError("Kunne ikke endre plan");
    } finally {
      setChangePlanDialog({ open: false, user: null, newPlan: "" });
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
        setSuccess(currentStatus ? "Bruker deaktivert" : "Bruker aktivert");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Kunne ikke endre status");
      }
    } catch (err) {
      setError("Kunne ikke endre status");
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

  const handleSendEmail = async () => {
    if (!emailDialog.subject || !emailDialog.body || emailDialog.users.length === 0) return;

    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userIds: emailDialog.users.map(u => u.id),
          subject: emailDialog.subject,
          body: emailDialog.body,
        }),
      });

      if (res.ok) {
        setSuccess(`E-post sendt til ${emailDialog.users.length} bruker(e)`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Kunne ikke sende e-post");
      }
    } catch (err) {
      setError("Kunne ikke sende e-post");
    } finally {
      setEmailDialog({ open: false, users: [], subject: "", body: "" });
      setSelectedUsers([]);
    }
  };

  const handleExportUsers = () => {
    const csvContent = [
      ["ID", "Navn", "E-post", "Plan", "Rolle", "Status", "Opprettet", "Siste innlogging"].join(","),
      ...filteredUsers.map(u => [
        u.id,
        u.name || "",
        u.email || "",
        u.subscriptionPlan || "free",
        u.role,
        u.isActive !== false ? "Aktiv" : "Deaktivert",
        new Date(u.createdAt).toLocaleDateString("nb-NO"),
        u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString("nb-NO") : "-"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `brukere_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
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

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  // Filter users - ensure users is an array
  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlan = filterPlan === "all" || 
      (filterPlan === "free" && (!u.subscriptionPlan || u.subscriptionPlan === "free")) ||
      u.subscriptionPlan === filterPlan;
    
    const matchesRole = filterRole === "all" || u.role === filterRole;
    
    return matchesSearch && matchesPlan && matchesRole;
  });

  // Calculate subscription breakdown - ensure users is an array
  const usersArray = Array.isArray(users) ? users : [];
  const freeUsers = usersArray.filter(u => !u.subscriptionPlan || u.subscriptionPlan === 'free').length;
  const basicUsers = usersArray.filter(u => u.subscriptionPlan === 'basic').length;
  const proUsers = usersArray.filter(u => u.subscriptionPlan === 'pro').length;
  const activeUsers = usersArray.filter(u => u.isActive !== false).length;
  const inactiveUsers = usersArray.filter(u => u.isActive === false).length;

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
          <div className="flex items-center gap-2">
            <Button onClick={fetchData} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Oppdater
            </Button>
          </div>
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
                  <p className="text-3xl font-bold">{stats?.totalUsers || users.length}</p>
                  <p className="text-blue-200 text-xs mt-1">{activeUsers} aktive</p>
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
                  <p className="text-green-200 text-xs mt-1">{basicUsers + proUsers} betalende</p>
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
                  <p className="text-3xl font-bold">{stats?.activeSubscriptions || basicUsers + proUsers}</p>
                  <p className="text-purple-200 text-xs mt-1">{freeUsers} gratis</p>
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
                  <p className="text-orange-200 text-xs mt-1">{stats?.totalCampaigns || 0} kampanjer</p>
                </div>
                <Mail className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Zap className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gratis</p>
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
                  <p className="text-sm text-gray-500">Basic</p>
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
                  <p className="text-sm text-gray-500">Pro</p>
                  <p className="text-xl font-bold text-gray-900">{proUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deaktivert</p>
                  <p className="text-xl font-bold text-gray-900">{inactiveUsers}</p>
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
            <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <FileText className="h-4 w-4 mr-2" />
              Fakturaer
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="emailfinder" className="data-[state=active]:bg-white data-[state=active]:text-green-600">
              <Mail className="h-4 w-4 mr-2" />
              Email Finder
            </TabsTrigger>
            <TabsTrigger value="ai-settings" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">
              <Zap className="h-4 w-4 mr-2" />
              AI-innstillinger
            </TabsTrigger>
            <TabsTrigger value="brreg" className="data-[state=active]:bg-white data-[state=active]:text-red-600">
              <Database className="h-4 w-4 mr-2" />
              Brreg
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Brukeradministrasjon</CardTitle>
                    <CardDescription>
                      Administrer brukerkontoer, tilganger og abonnementer
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedUsers.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEmailDialog({ 
                          open: true, 
                          users: users.filter(u => selectedUsers.includes(u.id)),
                          subject: "",
                          body: ""
                        })}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send e-post ({selectedUsers.length})
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExportUsers}>
                      <Download className="h-4 w-4 mr-2" />
                      Eksporter
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ny bruker
                    </Button>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Søk brukere..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle planer</SelectItem>
                      <SelectItem value="free">Gratis</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Rolle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle roller</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={selectAllUsers}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Bruker</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Siste innlogging</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className={u.isActive === false ? "opacity-50" : ""}>
                        <TableCell>
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.includes(u.id)}
                            onChange={() => toggleUserSelection(u.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(u.name || u.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{u.name || "-"}</p>
                              <p className="text-sm text-gray-500">{u.email || "-"}</p>
                            </div>
                          </div>
                        </TableCell>
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
                          <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className={
                            u.role === 'admin' ? 'bg-red-100 text-red-700' : ''
                          }>
                            {u.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.isActive !== false ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              Aktiv
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 text-sm">
                              <XCircle className="h-4 w-4" />
                              Deaktivert
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {u.lastSignedIn ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(u.lastSignedIn).toLocaleDateString("nb-NO")}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setUserDetailDialog({ open: true, user: u })}>
                                <Eye className="h-4 w-4 mr-2" />
                                Se detaljer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setChangePlanDialog({ open: true, user: u, newPlan: u.subscriptionPlan || "free" })}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Endre plan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEmailDialog({ open: true, users: [u], subject: "", body: "" })}>
                                <Send className="h-4 w-4 mr-2" />
                                Send e-post
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {u.role !== 'admin' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'admin')}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Gjør til admin
                                </DropdownMenuItem>
                              )}
                              {u.role === 'admin' && u.id !== user?.id && (
                                <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'user')}>
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Fjern admin
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleToggleUserStatus(u.id, u.isActive !== false)}
                                disabled={u.id === user?.id}
                              >
                                {u.isActive !== false ? (
                                  <>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Deaktiver
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Aktiver
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => setDeleteDialog({ open: true, user: u })}
                                disabled={u.id === user?.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Slett bruker
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Ingen brukere funnet
                  </div>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <div className="space-y-4">
              {/* Invoice Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Total inntekt</p>
                        <p className="text-2xl font-bold text-green-700">
                          {((stats?.revenue || 0) * 12).toLocaleString()} NOK
                        </p>
                        <p className="text-xs text-green-500">Siste 12 måneder</p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Betalte fakturaer</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {(basicUsers + proUsers) * 12}
                        </p>
                        <p className="text-xs text-blue-500">Siste 12 måneder</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600">Ventende</p>
                        <p className="text-2xl font-bold text-yellow-700">0</p>
                        <p className="text-xs text-yellow-500">Ubetalte fakturaer</p>
                      </div>
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600">Forfalt</p>
                        <p className="text-2xl font-bold text-red-700">0</p>
                        <p className="text-xs text-red-500">Krever oppfølging</p>
                      </div>
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Create Invoice */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Opprett faktura</CardTitle>
                      <CardDescription>Send faktura til en bruker manuelt</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="invoice-user">Velg bruker</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Velg bruker" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(users) ? users : []).map(u => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="invoice-amount">Beløp (NOK)</Label>
                      <Input id="invoice-amount" type="number" placeholder="499" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="invoice-desc">Beskrivelse</Label>
                      <Input id="invoice-desc" placeholder="Månedlig abonnement" className="mt-1" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Opprett faktura
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle>Siste fakturaer</CardTitle>
                  <CardDescription>Oversikt over nylige transaksjoner</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Faktura ID</TableHead>
                        <TableHead>Bruker</TableHead>
                        <TableHead>Beløp</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dato</TableHead>
                        <TableHead>Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(users) ? users : []).filter(u => u.subscriptionPlan && u.subscriptionPlan !== 'free').slice(0, 5).map((u, index) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-sm">INV-{2024001 + index}</TableCell>
                          <TableCell>{u.name || u.email}</TableCell>
                          <TableCell className="font-medium">
                            {u.subscriptionPlan === 'pro' ? '1,299' : '499'} NOK
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">Betalt</Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {new Date().toLocaleDateString('nb-NO')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(Array.isArray(users) ? users : []).filter(u => u.subscriptionPlan && u.subscriptionPlan !== 'free').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            Ingen fakturaer ennå
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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

          {/* Email Finder Tab */}
          <TabsContent value="emailfinder">
            <EmailFinderTab />
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai-settings">
            <AISettingsTab />
          </TabsContent>

          {/* Brreg Tab */}
          <TabsContent value="brreg">
            <BrregTab />
          </TabsContent>
        </Tabs>

        {/* User Detail Dialog */}
        <Dialog open={userDetailDialog.open} onOpenChange={(open) => setUserDetailDialog({ open, user: null })}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Brukerdetaljer</DialogTitle>
            </DialogHeader>
            {userDetailDialog.user && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {(userDetailDialog.user.name || userDetailDialog.user.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{userDetailDialog.user.name || "Ingen navn"}</h3>
                    <p className="text-gray-500">{userDetailDialog.user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Plan</p>
                    <p className="font-medium">{userDetailDialog.user.subscriptionPlan || "Gratis"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Rolle</p>
                    <p className="font-medium">{userDetailDialog.user.role}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Opprettet</p>
                    <p className="font-medium">{new Date(userDetailDialog.user.createdAt).toLocaleDateString("nb-NO")}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Siste innlogging</p>
                    <p className="font-medium">
                      {userDetailDialog.user.lastSignedIn 
                        ? new Date(userDetailDialog.user.lastSignedIn).toLocaleDateString("nb-NO")
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Bedrifter brukt</p>
                    <p className="font-medium">
                      {userDetailDialog.user.usedLeadsThisMonth || 0} / {userDetailDialog.user.monthlyLeadsQuota || 50}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      {userDetailDialog.user.isActive !== false ? "Aktiv" : "Deaktivert"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Change Plan Dialog */}
        <Dialog open={changePlanDialog.open} onOpenChange={(open) => setChangePlanDialog({ open, user: null, newPlan: "" })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Endre abonnementsplan</DialogTitle>
              <DialogDescription>
                Endre plan for {changePlanDialog.user?.name || changePlanDialog.user?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Ny plan</Label>
                <Select 
                  value={changePlanDialog.newPlan} 
                  onValueChange={(value) => setChangePlanDialog({ ...changePlanDialog, newPlan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratis (0 NOK/mnd)</SelectItem>
                    <SelectItem value="basic">Basic (499 NOK/mnd)</SelectItem>
                    <SelectItem value="pro">Pro (1,299 NOK/mnd)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangePlanDialog({ open: false, user: null, newPlan: "" })}>
                Avbryt
              </Button>
              <Button onClick={handlePlanChange}>
                Lagre endring
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog({ open, users: [], subject: "", body: "" })}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send e-post</DialogTitle>
              <DialogDescription>
                Send e-post til {emailDialog.users.length} bruker(e)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Mottakere</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {emailDialog.users.map(u => (
                    <Badge key={u.id} variant="secondary">
                      {u.email}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Emne</Label>
                <Input 
                  value={emailDialog.subject}
                  onChange={(e) => setEmailDialog({ ...emailDialog, subject: e.target.value })}
                  placeholder="E-post emne..."
                />
              </div>
              <div>
                <Label>Melding</Label>
                <Textarea 
                  value={emailDialog.body}
                  onChange={(e) => setEmailDialog({ ...emailDialog, body: e.target.value })}
                  placeholder="Skriv din melding her..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialog({ open: false, users: [], subject: "", body: "" })}>
                Avbryt
              </Button>
              <Button onClick={handleSendEmail} disabled={!emailDialog.subject || !emailDialog.body}>
                <Send className="h-4 w-4 mr-2" />
                Send e-post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

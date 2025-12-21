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
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  activeSubscriptions: number;
  revenue: number;
}

interface AdminUser {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  lastLogin?: string;
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

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
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
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-pink-500" />
              Admin Panel
            </h1>
            <p className="text-gray-400">Administrer brukere og systeminnstillinger</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="border-gray-600 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-900/50 border-green-800">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Totale brukere</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Bedrifter i database</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.totalCompanies?.toLocaleString() || 0}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">E-poster sendt</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.totalEmailsSent?.toLocaleString() || 0}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Aktive abonnementer</p>
                  <p className="text-2xl font-bold text-white">{stats?.activeSubscriptions || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-pink-500">
              Brukere
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-pink-500">
              Bedrifter
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-pink-500">
              System
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Brukere</CardTitle>
                    <CardDescription className="text-gray-400">
                      Administrer brukerkontoer og tilganger
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Søk brukere..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Navn</TableHead>
                      <TableHead className="text-gray-400">E-post</TableHead>
                      <TableHead className="text-gray-400">Rolle</TableHead>
                      <TableHead className="text-gray-400">Opprettet</TableHead>
                      <TableHead className="text-gray-400">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className="border-gray-700">
                        <TableCell className="text-white">{u.name || "-"}</TableCell>
                        <TableCell className="text-gray-300">{u.email || "-"}</TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value)}
                            disabled={u.id === user?.id}
                          >
                            <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString("nb-NO")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Bedriftsdatabase</CardTitle>
                <CardDescription className="text-gray-400">
                  Administrer bedriftsdata fra Brønnøysund
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleImportCompanies}
                    disabled={importLoading}
                    className="bg-gradient-to-r from-pink-500 to-purple-600"
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
                  <p className="text-sm text-gray-400">
                    Sist oppdatert: {stats?.totalCompanies ? "I dag" : "Aldri"}
                  </p>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Database statistikk</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Totale bedrifter:</span>
                      <span className="text-white ml-2">
                        {stats?.totalCompanies?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Med e-post:</span>
                      <span className="text-white ml-2">~40%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Systeminnstillinger</CardTitle>
                <CardDescription className="text-gray-400">
                  Konfigurer systemparametere
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">API Status</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400">Operativ</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Database</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400">Tilkoblet</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Miljøvariabler</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">NODE_ENV</span>
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        production
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Database</span>
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        Konfigurert
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Stripe</span>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                        Venter konfigurasjon
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Slett bruker</DialogTitle>
              <DialogDescription className="text-gray-400">
                Er du sikker på at du vil slette {deleteDialog.user?.name || deleteDialog.user?.email}?
                Denne handlingen kan ikke angres.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, user: null })}
                className="border-gray-600 text-white"
              >
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700"
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

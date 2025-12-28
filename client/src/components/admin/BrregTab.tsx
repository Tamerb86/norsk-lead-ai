import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  User,
  Users,
  MapPin,
  Calendar,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Database,
  ArrowRight,
  Info,
} from "lucide-react";

interface BrregCompany {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: string;
  hjemmeside?: string | null;
  forretningsadresse?: string | null;
  poststed?: string | null;
  postnummer?: string | null;
  kommune?: string | null;
  naeringskode?: string | null;
  naeringsbeskrivelse?: string | null;
  antallAnsatte?: number | null;
  stiftelsesdato?: string | null;
  konkurs?: boolean;
  underAvvikling?: boolean;
}

interface BrregEnrichedData {
  company: BrregCompany;
  ceo: { navn: string; tittel?: string } | null;
  boardMembers: Array<{ navn: string; rolle: string }>;
}

export function BrregTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "orgNr">("name");
  const [searchResults, setSearchResults] = useState<BrregCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Company detail dialog
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    data: BrregEnrichedData | null;
    loading: boolean;
  }>({
    open: false,
    data: null,
    loading: false,
  });

  // Import dialog
  const [importDialog, setImportDialog] = useState<{
    open: boolean;
    params: {
      kommunenummer?: string;
      naeringskode?: string;
      fraAntallAnsatte?: number;
      tilAntallAnsatte?: number;
    };
    loading: boolean;
    result: { total: number; imported: number; skipped: number } | null;
  }>({
    open: false,
    params: {},
    loading: false,
    result: null,
  });

  // Sync dialog
  const [syncDialog, setSyncDialog] = useState<{
    open: boolean;
    loading: boolean;
    result: {
      total: number;
      success: number;
      failed: number;
      updated: Array<{ id: number; navn: string }>;
      errors: Array<{ id: number; error: string }>;
    } | null;
  }>({
    open: false,
    loading: false,
    result: null,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setSearchResults([]);
    
    try {
      const params: Record<string, string> = {};
      if (searchType === "name") {
        params.navn = searchQuery;
      } else {
        params.organisasjonsnummer = searchQuery.replace(/\s/g, "");
      }
      params.size = "20";
      
      const inputData = { json: params };
      const queryParams = new URLSearchParams();
      queryParams.append("input", JSON.stringify(inputData));
      
      const res = await fetch(`/api/trpc/brreg.search?${queryParams}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        const result = data.result?.data?.json || data.result?.data;
        setSearchResults(result?.companies || []);
        if (result?.companies?.length === 0) {
          setError("Ingen bedrifter funnet");
        }
      } else {
        setError("Kunne ikke søke i Brreg");
      }
    } catch (err) {
      setError("Feil ved søk i Brreg");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orgNr: string) => {
    setDetailDialog({ open: true, data: null, loading: true });
    
    try {
      const inputData = { json: { orgNr } };
      const queryParams = new URLSearchParams();
      queryParams.append("input", JSON.stringify(inputData));
      
      const res = await fetch(`/api/trpc/brreg.enrichCompany?${queryParams}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        const result = data.result?.data?.json || data.result?.data;
        setDetailDialog({ open: true, data: result, loading: false });
      } else {
        setDetailDialog({ open: false, data: null, loading: false });
        setError("Kunne ikke hente bedriftsdetaljer");
      }
    } catch (err) {
      setDetailDialog({ open: false, data: null, loading: false });
      setError("Feil ved henting av bedriftsdetaljer");
    }
  };

  const handleImport = async () => {
    setImportDialog({ ...importDialog, loading: true, result: null });
    
    try {
      const res = await fetch("/api/trpc/brreg.importFromSearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ json: { ...importDialog.params, size: 100 } }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const result = data.result?.data?.json || data.result?.data;
        setImportDialog({
          ...importDialog,
          loading: false,
          result: {
            total: result?.total || 0,
            imported: result?.imported || 0,
            skipped: result?.skipped || 0,
          },
        });
        setSuccess(`Importerte ${result?.imported || 0} nye bedrifter fra Brreg`);
      } else {
        setImportDialog({ ...importDialog, loading: false });
        setError("Kunne ikke importere bedrifter");
      }
    } catch (err) {
      setImportDialog({ ...importDialog, loading: false });
      setError("Feil ved import fra Brreg");
    }
  };

  const handleBulkSync = async () => {
    setSyncDialog({ open: true, loading: true, result: null });
    
    try {
      const res = await fetch("/api/trpc/brreg.bulkSync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ json: { limit: 50 } }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const result = data.result?.data?.json || data.result?.data;
        setSyncDialog({
          open: true,
          loading: false,
          result: result,
        });
        setSuccess(`Synkroniserte ${result?.success || 0} bedrifter med Brreg`);
      } else {
        setSyncDialog({ open: true, loading: false, result: null });
        setError("Kunne ikke synkronisere med Brreg");
      }
    } catch (err) {
      setSyncDialog({ open: true, loading: false, result: null });
      setError("Feil ved synkronisering med Brreg");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Database className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Brønnøysundregistrene (Brreg)</h3>
              <p className="text-sm text-red-700 mt-1">
                Offisiell norsk bedriftsregister med data om alle registrerte selskaper i Norge.
                Gratis API uten autentisering.
              </p>
              <div className="flex gap-4 mt-3">
                <a 
                  href="https://data.brreg.no/enhetsregisteret/api/docs/index.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  API-dokumentasjon
                </a>
                <a 
                  href="https://www.brreg.no/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  brreg.no
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Søk i Brreg
          </CardTitle>
          <CardDescription>
            Søk etter bedrifter direkte i Brønnøysundregistrene
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Select value={searchType} onValueChange={(v: "name" | "orgNr") => setSearchType(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Bedriftsnavn</SelectItem>
                    <SelectItem value="orgNr">Org.nummer</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={searchType === "name" ? "Søk etter bedriftsnavn..." : "F.eks. 123456789"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2">Søk</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Org.nr</TableHead>
                    <TableHead>Navn</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Kommune</TableHead>
                    <TableHead>Ansatte</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((company) => (
                    <TableRow key={company.organisasjonsnummer}>
                      <TableCell className="font-mono text-sm">
                        {company.organisasjonsnummer}
                      </TableCell>
                      <TableCell className="font-medium">{company.navn}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.organisasjonsform || "-"}</Badge>
                      </TableCell>
                      <TableCell>{company.kommune || "-"}</TableCell>
                      <TableCell>{company.antallAnsatte ?? "-"}</TableCell>
                      <TableCell>
                        {company.konkurs ? (
                          <Badge variant="destructive">Konkurs</Badge>
                        ) : company.underAvvikling ? (
                          <Badge variant="secondary">Under avvikling</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">Aktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(company.organisasjonsnummer)}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Detaljer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Importer fra Brreg
            </CardTitle>
            <CardDescription>
              Importer nye bedrifter fra Brreg til databasen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setImportDialog({ ...importDialog, open: true })}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Start import
            </Button>
          </CardContent>
        </Card>

        {/* Sync Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Synkroniser data
            </CardTitle>
            <CardDescription>
              Oppdater eksisterende bedrifter med data fra Brreg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleBulkSync}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Synkroniser 50 bedrifter
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Company Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ ...detailDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bedriftsdetaljer fra Brreg</DialogTitle>
          </DialogHeader>
          
          {detailDialog.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : detailDialog.data ? (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">{detailDialog.data.company.navn}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Org.nummer:</span>
                    <span className="ml-2 font-mono">{detailDialog.data.company.organisasjonsnummer}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2">{detailDialog.data.company.organisasjonsform || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Stiftet:</span>
                    <span className="ml-2">{detailDialog.data.company.stiftelsesdato || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ansatte:</span>
                    <span className="ml-2">{detailDialog.data.company.antallAnsatte ?? "-"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Adresse:</span>
                    <span className="ml-2">
                      {detailDialog.data.company.forretningsadresse}, {detailDialog.data.company.postnummer} {detailDialog.data.company.poststed}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Næring:</span>
                    <span className="ml-2">
                      {detailDialog.data.company.naeringskode} - {detailDialog.data.company.naeringsbeskrivelse || "-"}
                    </span>
                  </div>
                  {detailDialog.data.company.hjemmeside && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Nettside:</span>
                      <a 
                        href={detailDialog.data.company.hjemmeside.startsWith("http") ? detailDialog.data.company.hjemmeside : `https://${detailDialog.data.company.hjemmeside}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        {detailDialog.data.company.hjemmeside}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* CEO */}
              {detailDialog.data.ceo && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Daglig leder
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="font-medium">{detailDialog.data.ceo.navn}</p>
                    <p className="text-sm text-gray-600">{detailDialog.data.ceo.tittel || "Daglig leder"}</p>
                  </div>
                </div>
              )}

              {/* Board Members */}
              {detailDialog.data.boardMembers && detailDialog.data.boardMembers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Styremedlemmer
                  </h4>
                  <div className="space-y-2">
                    {detailDialog.data.boardMembers.map((member, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                        <span className="font-medium">{member.navn}</span>
                        <Badge variant="outline">{member.rolle}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Ingen data tilgjengelig</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog.open} onOpenChange={(open) => setImportDialog({ ...importDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer bedrifter fra Brreg</DialogTitle>
            <DialogDescription>
              Velg kriterier for import av nye bedrifter
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Kommunenummer (valgfritt)</Label>
              <Input
                placeholder="F.eks. 0301 for Oslo"
                value={importDialog.params.kommunenummer || ""}
                onChange={(e) => setImportDialog({
                  ...importDialog,
                  params: { ...importDialog.params, kommunenummer: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>Næringskode (valgfritt)</Label>
              <Input
                placeholder="F.eks. 62 for IT-tjenester"
                value={importDialog.params.naeringskode || ""}
                onChange={(e) => setImportDialog({
                  ...importDialog,
                  params: { ...importDialog.params, naeringskode: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min. ansatte</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={importDialog.params.fraAntallAnsatte || ""}
                  onChange={(e) => setImportDialog({
                    ...importDialog,
                    params: { ...importDialog.params, fraAntallAnsatte: parseInt(e.target.value) || undefined }
                  })}
                />
              </div>
              <div>
                <Label>Maks. ansatte</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={importDialog.params.tilAntallAnsatte || ""}
                  onChange={(e) => setImportDialog({
                    ...importDialog,
                    params: { ...importDialog.params, tilAntallAnsatte: parseInt(e.target.value) || undefined }
                  })}
                />
              </div>
            </div>

            {importDialog.result && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Fant {importDialog.result.total} bedrifter. 
                  Importerte {importDialog.result.imported} nye, 
                  hoppet over {importDialog.result.skipped} eksisterende.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialog({ open: false, params: {}, loading: false, result: null })}
            >
              Lukk
            </Button>
            <Button onClick={handleImport} disabled={importDialog.loading}>
              {importDialog.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importerer...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={syncDialog.open} onOpenChange={(open) => setSyncDialog({ ...syncDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Synkroniseringsresultat</DialogTitle>
          </DialogHeader>
          
          {syncDialog.loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-500">Synkroniserer med Brreg...</p>
            </div>
          ) : syncDialog.result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{syncDialog.result.total}</p>
                  <p className="text-sm text-gray-500">Totalt</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{syncDialog.result.success}</p>
                  <p className="text-sm text-gray-500">Oppdatert</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{syncDialog.result.failed}</p>
                  <p className="text-sm text-gray-500">Feilet</p>
                </div>
              </div>

              {syncDialog.result.updated.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Oppdaterte bedrifter:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {syncDialog.result.updated.slice(0, 10).map((u) => (
                      <div key={u.id} className="text-sm bg-green-50 rounded px-2 py-1">
                        {u.navn}
                      </div>
                    ))}
                    {syncDialog.result.updated.length > 10 && (
                      <p className="text-sm text-gray-500">
                        ...og {syncDialog.result.updated.length - 10} flere
                      </p>
                    )}
                  </div>
                </div>
              )}

              {syncDialog.result.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Feil:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {syncDialog.result.errors.slice(0, 5).map((e) => (
                      <div key={e.id} className="text-sm bg-red-50 rounded px-2 py-1">
                        ID {e.id}: {e.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Ingen resultat</p>
          )}

          <DialogFooter>
            <Button onClick={() => setSyncDialog({ open: false, loading: false, result: null })}>
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

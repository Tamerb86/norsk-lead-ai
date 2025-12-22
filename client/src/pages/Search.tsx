import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Search as SearchIcon, Mail, Phone, Globe, Filter, X, ArrowUpDown, Info, Download, ChevronLeft, ChevronRight, Save, Bookmark, Trash2, LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SearchTableSkeleton } from "@/components/SkeletonLoaders";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { toastSuccess, toastError, toastInfo } from "@/lib/toast-utils";
import { COMMON_NAERINGSKODER } from "../../../shared/naeringskoder";

export default function Search() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [query, setQuery] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasWebsite, setHasWebsite] = useState(false);
  
  // New filters
  const [poststed, setPoststed] = useState(""); // City filter
  const [naeringskode, setNaeringskode] = useState("");
  const [organisasjonsform, setOrganisasjonsform] = useState("");
  const [foundedAfter, setFoundedAfter] = useState("");
  const [foundedBefore, setFoundedBefore] = useState("");
  const [minEmployees, setMinEmployees] = useState("");
  const [maxEmployees, setMaxEmployees] = useState("");
  
  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'employees' | 'founded' | 'recent'>('employees');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [showFilters, setShowFilters] = useState(false);
  const [naeringskodeSearch, setNaeringskodeSearch] = useState("");
  
  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const itemsPerPage = 20;

  // Save Filter
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  const { data: savedFiltersData, refetch: refetchSavedFilters } = trpc.savedFilters.list.useQuery();
  const createFilterMutation = trpc.savedFilters.create.useMutation({
    onSuccess: () => {
      toastSuccess("Filter lagret!", {
        description: "Filteret er tilgjengelig i listen"
      });
      setShowSaveDialog(false);
      setFilterName("");
      refetchSavedFilters();
    },
    onError: (error) => {
      toastError("Kunne ikke lagre filter", {
        description: error.message
      });
    },
  });

  const deleteFilterMutation = trpc.savedFilters.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Filter slettet", {
        description: "Filteret er fjernet fra listen"
      });
      refetchSavedFilters();
    },
    onError: (error) => {
      toastError("Kunne ikke slette filter", {
        description: error.message
      });
    },
  });

  const { data, isLoading, refetch, isFetching } = trpc.companies.search.useQuery({
    query,
    hasEmail,
    hasPhone,
    hasWebsite,
    poststed: poststed || undefined,
    naeringskode: naeringskode || undefined,
    organisasjonsform: organisasjonsform || undefined,
    foundedAfter: foundedAfter || undefined,
    foundedBefore: foundedBefore || undefined,
    minEmployees: minEmployees ? parseInt(minEmployees) : undefined,
    maxEmployees: maxEmployees ? parseInt(maxEmployees) : undefined,
    sortBy,
    sortOrder,
    limit: 50,
  }, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Debug: Log data state
  console.log('Search data:', { data, isLoading, isFetching, hasData: !!data, companiesCount: data?.companies?.length });

  const handleSearch = () => {
    refetch();
  };

  const exportToCSV = () => {
    if (!data || !data.companies || data.companies.length === 0) {
      toastError("Ingen data å eksportere", {
        description: "Søk først etter bedrifter"
      });
      return;
    }

    exportCompaniesToCSV(data.companies);
  };

  const exportSelectedToCSV = () => {
    if (!data || !data.companies || selectedCompanies.length === 0) {
      toastError("Ingen valgte bedrifter å eksportere", {
        description: "Velg bedrifter først"
      });
      return;
    }

    const selectedData = data.companies.filter(c => selectedCompanies.includes(c.id));
    exportCompaniesToCSV(selectedData);
    toastSuccess(`${selectedData.length} bedrifter eksportert`, {
      description: "CSV-filen er lastet ned"
    });
  };

  const exportCompaniesToCSV = (companies: any[]) => {

    const headers = [
      "Bedriftsnavn",
      "Organisasjonsnummer",
      "E-post",
      "Telefon",
      "Nettside",
      "Næringskode",
      "Organisasjonsform",
      "Antall ansatte",
      "Stiftelsesdato"
    ];

    const rows = companies.map(company => [
      company.navn || "",
      company.organisasjonsnummer || "",
      company.epostadresse || "",
      company.telefon || "",
      company.hjemmeside || "",
      company.naeringskode1 || "",
      company.organisasjonsform || "",
      company.antallAnsatte?.toString() || "",
      company.stiftelsesdato ? (typeof company.stiftelsesdato === 'string' ? company.stiftelsesdato : company.stiftelsesdato.toISOString().split('T')[0]) : ""
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `norskleads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (companies.length === data?.companies.length) {
      toastSuccess(`${companies.length} bedrifter eksportert`, {
        description: "CSV-filen er lastet ned"
      });
    }
  };

  const resetFilters = () => {
    setQuery("");
    setHasEmail(false);
    setHasPhone(false);
    setHasWebsite(false);
    setPoststed("");
    setNaeringskode("");
    setOrganisasjonsform("");
    setFoundedAfter("");
    setFoundedBefore("");
    setMinEmployees("");
    setMaxEmployees("");
    setSortBy('employees');
    setSortOrder('desc');
    setNaeringskodeSearch("");
    setCurrentPage(1);
    setSelectedCompanies([]);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toastError("Navn påkrevd", {
        description: "Skriv inn et navn for filteret"
      });
      return;
    }

    const filters = {
      query,
      hasEmail,
      hasPhone,
      hasWebsite,
      poststed,
      naeringskode,
      organisasjonsform,
      foundedAfter,
      foundedBefore,
      minEmployees,
      maxEmployees,
      sortBy,
      sortOrder,
    };

    createFilterMutation.mutate({
      name: filterName,
      filters,
    });
  };

  const applySavedFilter = (filters: any) => {
    setQuery(filters.query || "");
    setHasEmail(filters.hasEmail || false);
    setHasPhone(filters.hasPhone || false);
    setHasWebsite(filters.hasWebsite || false);
    setPoststed(filters.poststed || "");
    setNaeringskode(filters.naeringskode || "");
    setOrganisasjonsform(filters.organisasjonsform || "");
    setFoundedAfter(filters.foundedAfter || "");
    setFoundedBefore(filters.foundedBefore || "");
    setMinEmployees(filters.minEmployees || "");
    setMaxEmployees(filters.maxEmployees || "");
    setSortBy(filters.sortBy || 'employees');
    setSortOrder(filters.sortOrder || 'desc');
    setCurrentPage(1);
    toastSuccess("Filter anvendt!", {
      description: "Søkekriteriene er oppdatert"
    });
  };

  // Pagination helpers
  const companies = data?.companies || [];
  const totalPages = Math.ceil(companies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = companies.slice(startIndex, endIndex);

  // Selection helpers
  const toggleCompany = (id: number) => {
    setSelectedCompanies(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === paginatedCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(paginatedCompanies.map(c => c.id));
    }
  };

  const isAllSelected = paginatedCompanies.length > 0 && selectedCompanies.length === paginatedCompanies.length;
  const selectedNaeringskode = COMMON_NAERINGSKODER.find(n => n.code === naeringskode);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Logg inn for å søke</h2>
          <p className="text-gray-600 mb-6">Du må være logget inn for å søke i bedriftsdatabasen</p>
          <Link href="/login">
            <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Logg inn
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Har du ikke en konto? <Link href="/register" className="text-blue-600 hover:underline">Registrer deg</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NorskLeads</h1>
                  <p className="text-sm text-gray-600">Søk i norske bedrifter</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="w-5 h-5 text-blue-600" />
                Søk etter bedrifter
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                  data-onboarding="filter-button"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? "Skjul filtre" : "Vis filtre"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Nullstill
                </Button>
                {savedFiltersData && savedFiltersData.length > 0 && (
                  <Select onValueChange={(value) => {
                    const filter = savedFiltersData.find(f => f.id === parseInt(value));
                    if (filter) applySavedFilter(filter.filters);
                  }}>
                    <SelectTrigger className="w-[180px] h-9">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        <span className="text-sm">Lagrede filtre</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {savedFiltersData.map((filter) => (
                        <SelectItem key={filter.id} value={filter.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{filter.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFilterMutation.mutate({ id: filter.id });
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Lagre filter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lagre søkefilter</DialogTitle>
                      <DialogDescription>
                        Gi filteret et navn slik at du enkelt kan bruke det igjen senere.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="filterName">Filternavn</Label>
                      <Input
                        id="filterName"
                        placeholder="F.eks. IT-bedrifter i Oslo"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Avbryt
                      </Button>
                      <Button onClick={saveCurrentFilter}>
                        Lagre
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {data && data.companies && data.companies.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={exportToCSV}
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Download className="w-4 h-4" />
                    Last ned CSV
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Basic Search */}
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="search" className="text-base font-medium">Søk etter bedriftsnavn eller organisasjonsnummer</Label>
                <Input
                  id="search"
                  placeholder="Skriv inn bedriftsnavn eller org.nr..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="mt-2"
                  data-onboarding="search-input"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasEmail"
                    checked={hasEmail}
                    onCheckedChange={(checked) => setHasEmail(checked as boolean)}
                  />
                  <label
                    htmlFor="hasEmail"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                    Har e-post
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPhone"
                    checked={hasPhone}
                    onCheckedChange={(checked) => setHasPhone(checked as boolean)}
                  />
                  <label
                    htmlFor="hasPhone"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-green-600" />
                    Har telefon
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasWebsite"
                    checked={hasWebsite}
                    onCheckedChange={(checked) => setHasWebsite(checked as boolean)}
                  />
                  <label
                    htmlFor="hasWebsite"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-purple-600" />
                    Har nettside
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-6 space-y-6 animate-slide-up">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Avanserte filtre
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* City (Poststed) */}
                  <div className="space-y-2">
                    <Label htmlFor="poststed">By (Poststed)</Label>
                    <Input
                      id="poststed"
                      placeholder="F.eks. Oslo, Bergen, Trondheim..."
                      value={poststed}
                      onChange={(e) => setPoststed(e.target.value)}
                    />
                  </div>

                  {/* Næringskode */}
                  <div className="space-y-2">
                    <Label htmlFor="naeringskode" className="flex items-center gap-2">
                      Bransje (Næringskode)
                      <Info className="w-4 h-4 text-gray-400" />
                    </Label>
                    <Select value={naeringskode} onValueChange={setNaeringskode}>
                      <SelectTrigger id="naeringskode">
                        <SelectValue placeholder="Velg bransje..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <div className="px-2 py-2 border-b sticky top-0 bg-white z-10">
                          <Input
                            placeholder="Søk etter bransje..."
                            value={naeringskodeSearch}
                            onChange={(e) => setNaeringskodeSearch(e.target.value)}
                            className="h-8"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <SelectItem value="all">Alle bransjer</SelectItem>
                        {COMMON_NAERINGSKODER
                          .filter(item => 
                            naeringskodeSearch === "" ||
                            item.name.toLowerCase().includes(naeringskodeSearch.toLowerCase()) ||
                            item.description.toLowerCase().includes(naeringskodeSearch.toLowerCase()) ||
                            item.code.includes(naeringskodeSearch)
                          )
                          .map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-gray-500">{item.code} - {item.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedNaeringskode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-blue-900">{selectedNaeringskode.name}</p>
                        <p className="text-blue-700 text-xs mt-1">{selectedNaeringskode.description}</p>
                        <p className="text-blue-600 text-xs mt-1">Kode: {selectedNaeringskode.code}</p>
                      </div>
                    )}
                  </div>

                  {/* Organisasjonsform */}
                  <div className="space-y-2">
                    <Label htmlFor="organisasjonsform">Organisasjonsform</Label>
                    <Select value={organisasjonsform} onValueChange={setOrganisasjonsform}>
                      <SelectTrigger id="organisasjonsform">
                        <SelectValue placeholder="Velg organisasjonsform..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle former</SelectItem>
                        <SelectItem value="AS">
                          <div className="flex flex-col">
                            <span className="font-medium">AS - Aksjeselskap</span>
                            <span className="text-xs text-gray-500">Privat aksjeselskap</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ASA">
                          <div className="flex flex-col">
                            <span className="font-medium">ASA - Allmennaksjeselskap</span>
                            <span className="text-xs text-gray-500">Børsnotert selskap</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ENK">
                          <div className="flex flex-col">
                            <span className="font-medium">ENK - Enkeltpersonforetak</span>
                            <span className="text-xs text-gray-500">Enkeltmannsforetak</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="NUF">
                          <div className="flex flex-col">
                            <span className="font-medium">NUF - Norskregistrert utenlandsk foretak</span>
                            <span className="text-xs text-gray-500">Utenlandsk filial</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="DA">
                          <div className="flex flex-col">
                            <span className="font-medium">DA - Ansvarlig selskap</span>
                            <span className="text-xs text-gray-500">Deltakere med delt ansvar</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stiftelsesdato */}
                  <div className="space-y-2">
                    <Label>Stiftelsesdato</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="foundedAfter" className="text-xs text-gray-600">Fra dato</Label>
                        <Input
                          id="foundedAfter"
                          type="date"
                          value={foundedAfter}
                          onChange={(e) => setFoundedAfter(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="foundedBefore" className="text-xs text-gray-600">Til dato</Label>
                        <Input
                          id="foundedBefore"
                          type="date"
                          value={foundedBefore}
                          onChange={(e) => setFoundedBefore(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Antall ansatte */}
                  <div className="space-y-2">
                    <Label>Antall ansatte</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="minEmployees" className="text-xs text-gray-600">Minimum</Label>
                        <Input
                          id="minEmployees"
                          type="number"
                          placeholder="Min"
                          value={minEmployees}
                          onChange={(e) => setMinEmployees(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxEmployees" className="text-xs text-gray-600">Maksimum</Label>
                        <Input
                          id="maxEmployees"
                          type="number"
                          placeholder="Maks"
                          value={maxEmployees}
                          onChange={(e) => setMaxEmployees(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sorting */}
                <div className="border-t pt-4">
                  <Label className="flex items-center gap-2 mb-3">
                    <ArrowUpDown className="w-4 h-4" />
                    Sortering
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Navn</SelectItem>
                        <SelectItem value="employees">Antall ansatte</SelectItem>
                        <SelectItem value="founded">Stiftelsesdato</SelectItem>
                        <SelectItem value="recent">Nylig registrert</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Stigende</SelectItem>
                        <SelectItem value="desc">Synkende</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSearch} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" size="lg">
              <SearchIcon className="w-5 h-5 mr-2" />
              Søk
            </Button>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-yellow-100 rounded text-sm">
          <p>Debug: isLoading={String(isLoading)}, isFetching={String(isFetching)}, hasData={String(!!data)}, companiesCount={data?.companies?.length || 0}</p>
        </div>

        {/* Results */}
        <div className="mt-8">
          {(isLoading || isFetching) ? (
            <SearchTableSkeleton />
          ) : data && data.companies && data.companies.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Fant <span className="font-semibold text-gray-900">{data.companies.length}</span> bedrifter
                  </p>
                  {selectedCompanies.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {selectedCompanies.length} valgt
                      </span>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => setLocation(`/campaigns/new?companyIds=${selectedCompanies.join(',')}`)}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Opprett kampanje
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => exportSelectedToCSV()}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Eksporter valgte
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedCompanies([])}
                          className="border-gray-400 text-gray-600 hover:bg-gray-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Fjern valg
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {paginatedCompanies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm cursor-pointer">
                      Velg alle på siden
                    </Label>
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                {paginatedCompanies.map((company: any) => (
                  <Card key={company.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <Checkbox
                            id={`company-${company.id}`}
                            checked={selectedCompanies.includes(company.id)}
                            onCheckedChange={() => toggleCompany(company.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                                <Building2 className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900">{company.navn}</h3>
                                <p className="text-sm text-gray-600 mt-1">Org.nr: {company.organisasjonsnummer}</p>
                                
                                <div className="flex flex-wrap gap-4 mt-3">
                                  {company.epostadresse && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-4 h-4 text-blue-600" />
                                      <a href={`mailto:${company.epostadresse}`} className="text-blue-600 hover:underline">
                                        {company.epostadresse}
                                      </a>
                                    </div>
                                  )}
                                  {company.telefon && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-green-600" />
                                      <a href={`tel:${company.telefon}`} className="text-green-600 hover:underline">
                                        {company.telefon}
                                      </a>
                                    </div>
                                  )}
                                  {company.hjemmeside && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Globe className="w-4 h-4 text-purple-600" />
                                      <a href={company.hjemmeside} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                                        Nettside
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {company.naeringskode1 && (
                                  <div className="mt-3 inline-block">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {company.naeringskode1}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                onClick={() => setLocation(`/campaigns/new?companyId=${company.id}`)}
                              >
                                Opprett kampanje
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Forrige
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={pageNum === currentPage ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Neste
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : data && data.companies && data.companies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen resultater</h3>
                <p className="text-gray-600">Prøv å justere søkekriteriene dine</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}

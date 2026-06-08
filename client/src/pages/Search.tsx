import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2,
  Search as SearchIcon,
  Mail,
  Phone,
  Globe,
  Filter,
  Download,
  ChevronDown,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Info,
  X,
  RotateCcw,
} from "lucide-react";
import { LeadScoreBadge } from "@/components/LeadScoreBadge";
import { EmailVerificationBadge } from "@/components/EmailVerificationBadge";
import { AIEmailWriter } from "@/components/AIEmailWriter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toastError, toastSuccess } from "@/lib/toast-utils";
import { exportCompaniesToCSV } from "@/lib/export-utils";
import { useLocation } from "wouter";
import { COMMON_NAERINGSKODER } from "../../../shared/naeringskoder";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";

export default function Search() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
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
  const [sortBy, setSortBy] = useState<"employees" | "age">("employees");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [naeringskodeSearch, setNaeringskodeSearch] = useState("");
  
  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const itemsPerPage = 20;

  // Debounce the free-text query so we don't fire a query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Reset to first page whenever any filter changes (keeps results consistent)
  useEffect(() => {
    setCurrentPage(1);
  }, [hasEmail, hasPhone, hasWebsite, poststed, naeringskode, organisasjonsform, foundedAfter, foundedBefore, minEmployees, maxEmployees, sortBy, sortOrder]);

  const resetAll = () => {
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
    setSortBy("employees");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Chips for every active filter, each removable with one click
  const activeFilters = useMemo(() => {
    const f: { key: string; label: string; onRemove: () => void }[] = [];
    if (query) f.push({ key: "q", label: `Søk: ${query}`, onRemove: () => setQuery("") });
    if (hasEmail) f.push({ key: "email", label: "Har e-post", onRemove: () => setHasEmail(false) });
    if (hasPhone) f.push({ key: "phone", label: "Har telefon", onRemove: () => setHasPhone(false) });
    if (hasWebsite) f.push({ key: "web", label: "Har nettside", onRemove: () => setHasWebsite(false) });
    if (poststed) f.push({ key: "city", label: `By: ${poststed}`, onRemove: () => setPoststed("") });
    if (naeringskode && naeringskode !== "all") {
      const n = COMMON_NAERINGSKODER.find((x) => x.code === naeringskode);
      f.push({ key: "nk", label: `Bransje: ${n ? n.name : naeringskode}`, onRemove: () => setNaeringskode("") });
    }
    if (organisasjonsform && organisasjonsform !== "all") f.push({ key: "of", label: `Form: ${organisasjonsform}`, onRemove: () => setOrganisasjonsform("") });
    if (foundedAfter) f.push({ key: "fa", label: `Stiftet etter: ${foundedAfter}`, onRemove: () => setFoundedAfter("") });
    if (foundedBefore) f.push({ key: "fb", label: `Stiftet før: ${foundedBefore}`, onRemove: () => setFoundedBefore("") });
    if (minEmployees) f.push({ key: "min", label: `Min ansatte: ${minEmployees}`, onRemove: () => setMinEmployees("") });
    if (maxEmployees) f.push({ key: "max", label: `Maks ansatte: ${maxEmployees}`, onRemove: () => setMaxEmployees("") });
    return f;
  }, [query, hasEmail, hasPhone, hasWebsite, poststed, naeringskode, organisasjonsform, foundedAfter, foundedBefore, minEmployees, maxEmployees]);

  // Save Filter
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  const { data: savedFiltersData, refetch: refetchSavedFilters } = trpc.savedFilters.list.useQuery();
  const createFilterMutation = trpc.savedFilters.create.useMutation({
    onSuccess: () => {
      toastSuccess("Filter lagret!", {
        description: "Du kan nå bruke dette filteret senere"
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

  // Calculate offset for server-side pagination
  const offset = (currentPage - 1) * itemsPerPage;

  const normalizedNaeringskode =
    !naeringskode || naeringskode === "all" ? undefined : naeringskode;

  const normalizedOrganisasjonsform =
    !organisasjonsform || organisasjonsform === "all" ? undefined : organisasjonsform;

  const { data, isLoading, refetch, isFetching, error, isError } = trpc.companies.search.useQuery({
    query: debouncedQuery,
    hasEmail,
    hasPhone,
    hasWebsite,
    poststed: poststed || undefined,
    naeringskode: normalizedNaeringskode,
    organisasjonsform: normalizedOrganisasjonsform,
    foundedAfter: foundedAfter || undefined,
    foundedBefore: foundedBefore || undefined,
    minEmployees: minEmployees ? parseInt(minEmployees) : undefined,
    maxEmployees: maxEmployees ? parseInt(maxEmployees) : undefined,
    sortBy,
    sortOrder,
    limit: itemsPerPage,
    offset: offset,
  }, {
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000, // cache identical searches for 30s
    placeholderData: (prev) => prev, // keep showing previous results while refetching
    retry: 1,
  });

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
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

  const toggleCompanySelection = (companyId: number) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const selectAllOnPage = () => {
    if (!data?.companies) return;
    const idsOnPage = data.companies.map((c) => c.id);
    setSelectedCompanies(idsOnPage);
  };

  const clearSelection = () => {
    setSelectedCompanies([]);
  };

  const handleBulkCreateLeads = () => {
    if (selectedCompanies.length === 0) {
      toastError("Ingen bedrifter valgt", {
        description: "Velg minst én bedrift for å opprette leads"
      });
      return;
    }

    toastSuccess("Leads opprettet", {
      description: `Opprettet leads for ${selectedCompanies.length} bedrifter (demo)`
    });
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
    setNaeringskode(
      filters.naeringskode && filters.naeringskode !== "all"
        ? filters.naeringskode
        : ""
    );
    setOrganisasjonsform(
      filters.organisasjonsform && filters.organisasjonsform !== "all"
        ? filters.organisasjonsform
        : ""
    );
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

  // Pagination helpers - Server-side pagination
  const companies = data?.companies || [];
  const totalResults = data?.total || 0;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    refetch();
  };

  const handleSortChange = (newSortBy: "employees" | "age") => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setCurrentPage(1);
    refetch();
  };

  const selectedNaeringskode = COMMON_NAERINGSKODER.find(n => n.code === naeringskode);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-2xl shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">Logg inn for å fortsette</h2>
          <p className="text-muted-foreground mb-6">Du må være logget inn for å søke i bedriftsdatabasen</p>
          <a href="/login">
            <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              Logg inn
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <PageHelp 
                title="Søk bedrifter i Norge"
                description={PAGE_DESCRIPTIONS.search}
              />
            </div>
            <p className="text-gray-600 mt-1">
              Finn relevante bedrifter basert på bransje, størrelse, lokasjon og mer. Perfekt for B2B-salg og leadgenerering.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={!data || !data.companies || data.companies.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Eksporter til CSV
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setShowSaveDialog(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Lagre filter
            </Button>
          </div>
        </div>

        {/* Main Search Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SearchIcon className="w-5 h-5 text-blue-600" />
              Søkekriterier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Search Row */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="query">Søk etter bedrift</Label>
                <Input
                  id="query"
                  placeholder="Navn, organisasjonsnummer, domenenavn..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || isFetching}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <SearchIcon className="w-4 h-4 mr-2" />
                  {isLoading || isFetching ? "Søker..." : "Søk"}
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  onClick={resetAll}
                  disabled={activeFilters.length === 0}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Nullstill
                </Button>
              </div>
            </div>

            {/* Basic Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEmail"
                  checked={hasEmail}
                  onCheckedChange={(checked) => setHasEmail(!!checked)}
                />
                <Label htmlFor="hasEmail" className="text-sm">
                  Har e-post
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPhone"
                  checked={hasPhone}
                  onCheckedChange={(checked) => setHasPhone(!!checked)}
                />
                <Label htmlFor="hasPhone" className="text-sm">
                  Har telefon
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWebsite"
                  checked={hasWebsite}
                  onCheckedChange={(checked) => setHasWebsite(!!checked)}
                />
                <Label htmlFor="hasWebsite" className="text-sm">
                  Har nettside
                </Label>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-sm ml-auto"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                <Filter className="w-4 h-4" />
                {showAdvanced ? "Skjul avanserte filtre" : "Vis avanserte filtre"}
                {activeFilters.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold h-5 min-w-[1.25rem] px-1.5">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-gray-500">Aktive filtre:</span>
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={f.onRemove}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-xs hover:bg-blue-100 transition-colors"
                  >
                    {f.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs text-gray-500 hover:text-red-600 underline ml-1"
                >
                  Fjern alle
                </button>
              </div>
            )}

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      Anbefalt strategi
                    </Label>
                    <p className="text-xs text-gray-600">
                      Kombiner bransje, størrelse og lokasjon for å finne de mest relevante bedriftene for dine tjenester.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Sortering
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={sortBy === "employees" ? "default" : "outline"}
                        onClick={() => handleSortChange("employees")}
                      >
                        Antall ansatte
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={sortBy === "age" ? "default" : "outline"}
                        onClick={() => handleSortChange("age")}
                      >
                        Selskapsalder
                      </Button>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <ChevronDown className="w-3 h-3" />
                        {sortOrder === "desc" ? "Synkende" : "Stigende"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Select
                      value={naeringskode || "all"}
                      onValueChange={(value) => setNaeringskode(value === "all" ? "" : value)}
                    >
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
                    <Select
                      value={organisasjonsform || "all"}
                      onValueChange={(value) => setOrganisasjonsform(value === "all" ? "" : value)}
                    >
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
                            <span className="text-xs text-gray-500">Delt ansvar</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Founded Date Range */}
                  <div className="space-y-2">
                    <Label>Stiftelsesdato</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="foundedAfter" className="text-xs text-gray-500">Fra</Label>
                        <Input
                          id="foundedAfter"
                          type="date"
                          value={foundedAfter}
                          onChange={(e) => setFoundedAfter(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="foundedBefore" className="text-xs text-gray-500">Til</Label>
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
                      <Input
                        placeholder="Min"
                        value={minEmployees}
                        onChange={(e) => setMinEmployees(e.target.value)}
                      />
                      <Input
                        placeholder="Maks"
                        value={maxEmployees}
                        onChange={(e) => setMaxEmployees(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Filters */}
        {savedFiltersData && savedFiltersData.length > 0 && (
          <Card className="border-dashed border-gray-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Lagrede filtre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {savedFiltersData.map((filter) => (
                  <DropdownMenu key={filter.id}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Filter className="w-3 h-3" />
                        {filter.name}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => applySavedFilter(filter.filters)}>
                        Bruk filter
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteFilterMutation.mutate({ id: filter.id })}
                      >
                        Slett
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results & Actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Results Summary & Bulk Actions */}
          <div className="lg:w-72">
            <Card className="border-0 shadow-md sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Resultater & handlinger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-2xl font-bold">{totalResults}</p>
                    <p className="text-xs text-gray-500">bedrifter funnet</p>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <p>Side {currentPage} av {totalPages || 1}</p>
                    <p>{itemsPerPage} per side</p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">Valgte bedrifter</p>
                    <span className="text-sm font-semibold">{selectedCompanies.length}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllOnPage}
                      disabled={!companies.length}
                    >
                      Velg alle på side
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearSelection}
                      disabled={!selectedCompanies.length}
                    >
                      Nullstill valg
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                    onClick={handleBulkCreateLeads}
                    disabled={!selectedCompanies.length}
                  >
                    Opprett leads ({selectedCompanies.length})
                  </Button>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 mt-0.5 text-blue-500" />
                      Bruk AI for å generere tilpassede e-poster til valgte bedrifter etter at leads er opprettet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company List */}
          <div className="flex-1 space-y-4">
            {isError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4">
                  <p className="text-sm text-red-800">
                    Det oppstod en feil under søket: {error?.message}
                  </p>
                </CardContent>
              </Card>
            )}

            {isLoading || isFetching ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <SearchIcon className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-pulse" />
                  <p className="text-gray-700 font-medium">Søker etter bedrifter...</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Vi henter data basert på kriteriene dine. Dette kan ta noen sekunder.
                  </p>
                </CardContent>
              </Card>
            ) : companies.length > 0 ? (
              <>
                {/* Companies List */}
                <div className="space-y-3">
                  {companies.map((company) => (
                    <Card key={company.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          {/* Left side: main info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedCompanies.includes(company.id)}
                                onCheckedChange={() => toggleCompanySelection(company.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-500" />
                                    {company.navn}
                                  </h3>
                                  <LeadScoreBadge score={company.leadScore || 0} />
                                </div>
                                <p className="text-xs text-gray-500">
                                  Org.nr: {company.organisasjonsnummer} • {company.poststed}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-700 mt-2">
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">Kontakt</p>
                                {company.epost && (
                                  <p className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-blue-500" />
                                    <span className="truncate">{company.epost}</span>
                                    <EmailVerificationBadge status={company.emailVerificationStatus || "unknown"} />
                                  </p>
                                )}
                                {company.telefon && (
                                  <p className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-green-500" />
                                    <span>{company.telefon}</span>
                                  </p>
                                )}
                                {company.hjemmeside && (
                                  <p className="flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-purple-500" />
                                    <a
                                      href={company.hjemmeside.startsWith("http") ? company.hjemmeside : `https://${company.hjemmeside}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {company.hjemmeside.replace(/^https?:\/\//, "")}
                                    </a>
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">Nøkkeltall</p>
                                <p>
                                  Ansatte:{" "}
                                  <span className="font-semibold">
                                    {company.antallAnsatte ?? "Ukjent"}
                                  </span>
                                </p>
                                <p>
                                  Omsetning:{" "}
                                  <span className="font-semibold">
                                    {company.omsetning ? `${company.omsetning.toLocaleString("nb-NO")} kr` : "Ukjent"}
                                  </span>
                                </p>
                                <p>
                                  Stiftet:{" "}
                                  <span className="font-semibold">
                                    {company.stiftelsesdato || "Ukjent"}
                                  </span>
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">Bransje & form</p>
                                {company.naeringskode1 && (
                                  <p className="text-xs text-gray-700">
                                    <span className="font-semibold">Bransje: </span>
                                    {company.naeringskode1}
                                  </p>
                                )}
                                {company.organisasjonsform && (
                                  <p className="text-xs text-gray-700">
                                    <span className="font-semibold">Form: </span>
                                    {company.organisasjonsform}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right side: actions */}
                          <div className="w-full md:w-64 space-y-3 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                            <div className="flex flex-col gap-2">
                              <AIEmailWriter
                                companyName={company.navn}
                                companyEmail={company.epost || ""}
                                companyWebsite={company.hjemmeside || ""}
                                leadScore={company.leadScore || 0}
                              />

                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  navigator.clipboard.writeText(company.epost || "");
                                  toastSuccess("E-post kopiert", { description: company.epost || "" });
                                }}
                                disabled={!company.epost}
                              >
                                Kopier e-post
                              </Button>

                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                onClick={() => setLocation(`/campaigns?newCampaign=true&companyId=${company.id}`)}
                              >
                                Opprett kampanje
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">
                    Viser {companies.length} av {totalResults} bedrifter
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Forrige
                    </Button>
                    <span className="text-xs text-gray-600">
                      Side {currentPage} av {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      Neste
                    </Button>
                  </div>
                </div>
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
        </div>
      </div>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lagre søkefilter</DialogTitle>
            <DialogDescription>
              Lagre dette filteret slik at du enkelt kan bruke det igjen senere.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filterName">Navn på filter</Label>
              <Input
                id="filterName"
                placeholder="F.eks. 'Store AS i Oslo med e-post'"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Avbryt
            </Button>
            <Button
              onClick={saveCurrentFilter}
              disabled={createFilterMutation.isPending}
            >
              {createFilterMutation.isPending ? "Lagrer..." : "Lagre filter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

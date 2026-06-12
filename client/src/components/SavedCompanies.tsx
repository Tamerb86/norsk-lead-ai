import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bookmark,
  BookmarkCheck,
  Trash2,
  Mail,
  Phone,
  Globe,
  MoreVertical,
  FolderPlus,
  Search,
  Building2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toastSuccess, toastError } from "@/lib/toast-utils";

interface SavedCompany {
  id: number;
  companyId: number;
  listName: string;
  notes: string | null;
  createdAt: string;
  company: {
    id: number;
    navn: string;
    organisasjonsnummer: string;
    epost: string | null;
    telefon: string | null;
    hjemmeside: string | null;
    poststed: string | null;
    organisasjonsform: string | null;
    antallAnsatte: number | null;
  };
}

export function SavedCompaniesButton({ companyId, companyName }: { companyId: number; companyName: string }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [listName, setListName] = useState("default");
  const [newListName, setNewListName] = useState("");

  const { data: savedStatus } = trpc.savedCompanies.checkSaved.useQuery({ companyId });
  
  const saveMutation = trpc.savedCompanies.save.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCompanies"] });
      toastSuccess("Bedrift lagret", { description: `${companyName} er lagt til i listen` });
      setIsDialogOpen(false);
    },
    onError: () => {
      toastError("Kunne ikke lagre", { description: "Prøv igjen senere" });
    },
  });

  const removeMutation = trpc.savedCompanies.remove.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCompanies"] });
      toastSuccess("Bedrift fjernet", { description: `${companyName} er fjernet fra listen` });
    },
    onError: () => {
      toastError("Kunne ikke fjerne", { description: "Prøv igjen senere" });
    },
  });

  const handleSave = () => {
    const finalListName = newListName || listName;
    saveMutation.mutate({ companyId, listName: finalListName });
  };

  const handleRemove = () => {
    removeMutation.mutate({ companyId });
  };

  const isSaved = savedStatus?.isSaved;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={isSaved ? handleRemove : () => setIsDialogOpen(true)}
        className={isSaved ? "text-yellow-500 hover:text-yellow-600" : "text-gray-400 hover:text-yellow-500"}
        data-onboarding="save-company"
      >
        {isSaved ? (
          <BookmarkCheck className="h-5 w-5 fill-current" />
        ) : (
          <Bookmark className="h-5 w-5" />
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lagre bedrift</DialogTitle>
            <DialogDescription>
              Lagre {companyName} i en liste for å finne den igjen senere.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Velg liste</label>
              <select
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="default">Standard liste</option>
                <option value="favorites">Favoritter</option>
                <option value="to-contact">Skal kontaktes</option>
                <option value="potential">Potensielle kunder</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Eller opprett ny liste</label>
              <Input
                placeholder="Skriv inn listenavn..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Lagrer..." : "Lagre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SavedCompaniesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeList, setActiveList] = useState("all");
  const queryClient = useQueryClient();

  const { data: savedCompanies, isLoading } = trpc.savedCompanies.getAll.useQuery();
  const { data: lists } = trpc.savedCompanies.getLists.useQuery();

  const removeMutation = trpc.savedCompanies.remove.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCompanies"] });
      toastSuccess("Bedrift fjernet");
    },
  });

  const filteredCompanies = savedCompanies?.filter((sc: SavedCompany) => {
    const matchesSearch = sc.company.navn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesList = activeList === "all" || sc.listName === activeList;
    return matchesSearch && matchesList;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lagrede bedrifter</h2>
          <p className="text-muted-foreground">
            {savedCompanies?.length || 0} bedrifter lagret
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i lagrede bedrifter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lists Tabs */}
      <Tabs value={activeList} onValueChange={setActiveList}>
        <TabsList>
          <TabsTrigger value="all">Alle ({savedCompanies?.length || 0})</TabsTrigger>
          {lists?.map((list: string) => (
            <TabsTrigger key={list} value={list}>
              {list === "default" ? "Standard" : list}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeList} className="mt-4">
          {filteredCompanies?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Ingen lagrede bedrifter</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Klikk på bokmerke-ikonet ved en bedrift for å lagre den her.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCompanies?.map((saved: SavedCompany) => (
                <Card key={saved.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{saved.company.navn}</h3>
                          <Badge variant="outline" className="text-xs">
                            {saved.company.organisasjonsform}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          Org.nr: {saved.company.organisasjonsnummer}
                          {saved.company.poststed && ` • ${saved.company.poststed}`}
                          {saved.company.antallAnsatte && ` • ${saved.company.antallAnsatte} ansatte`}
                        </p>

                        <div className="flex items-center gap-4 mt-3">
                          {saved.company.epost && (
                            <a
                              href={`mailto:${saved.company.epost}`}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <Mail className="h-4 w-4" />
                              {saved.company.epost}
                            </a>
                          )}
                          {saved.company.telefon && (
                            <a
                              href={`tel:${saved.company.telefon}`}
                              className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              {saved.company.telefon}
                            </a>
                          )}
                          {saved.company.hjemmeside && (
                            <a
                              href={saved.company.hjemmeside}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-purple-600 hover:underline"
                            >
                              <Globe className="h-4 w-4" />
                              Nettside
                            </a>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Legg til i kampanje
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FolderPlus className="h-4 w-4 mr-2" />
                            Flytt til liste
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => removeMutation.mutate({ companyId: saved.companyId })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Fjern fra lagrede
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

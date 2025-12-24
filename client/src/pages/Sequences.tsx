import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Play, Pause, Archive, Edit, Trash2, Users } from "lucide-react";
import { toastSuccess, toastError, toastDeleteWithUndo } from "@/lib/toast-utils";

export default function Sequences() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
  });

  const { data: sequences, isLoading, refetch } = trpc.sequences.getAll.useQuery();
  const createMutation = trpc.sequences.create.useMutation({
    onSuccess: () => {
      toastSuccess("Sequence opprettet!", { description: "Din nye sequence er klar til bruk" });
      setIsCreateDialogOpen(false);
      setNewSequence({ name: "", description: "" });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke opprette sequence", { description: error.message });
    },
  });

  const updateMutation = trpc.sequences.update.useMutation({
    onSuccess: () => {
      toastSuccess("Sequence oppdatert!");
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke oppdatere sequence", { description: error.message });
    },
  });

  const deleteMutation = trpc.sequences.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Sequence slettet!");
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke slette sequence", { description: error.message });
    },
  });

  const handleCreate = () => {
    if (!newSequence.name.trim()) {
      toastError("Navn påkrevd", { description: "Vennligst skriv inn et navn for sequencen" });
      return;
    }
    createMutation.mutate(newSequence);
  };

  const handleStatusChange = (id: number, status: "active" | "paused" | "archived") => {
    updateMutation.mutate({ id, status });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Er du sikker på at du vil slette "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Aktiv</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">Pauset</Badge>;
      case "archived":
        return <Badge className="bg-gray-500">Arkivert</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">E-postsekvenser</h1>
            <p className="text-gray-600">
              Automatiser oppfølgings-e-poster med multi-step workflows
            </p>
          </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ny Sequence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opprett Ny Sequence</DialogTitle>
              <DialogDescription>
                Lag en ny email sequence med flere steg
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  placeholder="F.eks. Onboarding Sequence"
                  value={newSequence.name}
                  onChange={(e) =>
                    setNewSequence({ ...newSequence, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  placeholder="Beskriv hva denne sequencen gjør..."
                  value={newSequence.description}
                  onChange={(e) =>
                    setNewSequence({ ...newSequence, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Oppretter..." : "Opprett"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sequences Grid */}
      {!sequences || sequences.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ingen sequences ennå</h3>
          <p className="text-muted-foreground mb-6">
            Kom i gang ved å opprette din første email sequence
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Opprett Sequence
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sequences.map((sequence) => (
            <Card key={sequence.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{sequence.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sequence.description || "Ingen beskrivelse"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/sequences/${sequence.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rediger
                      </Link>
                    </DropdownMenuItem>
                    {sequence.status === "active" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(sequence.id, "paused")}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                    )}
                    {sequence.status === "paused" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(sequence.id, "active")}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Aktiver
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(sequence.id, "archived")}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Arkiver
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(sequence.id, sequence.name)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slett
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(sequence.status)}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sequence.totalSteps}
                    </div>
                    <div className="text-xs text-muted-foreground">Steg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sequence.totalEnrolled}
                    </div>
                    <div className="text-xs text-muted-foreground">Påmeldt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sequence.totalCompleted}
                    </div>
                    <div className="text-xs text-muted-foreground">Fullført</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t flex gap-2">
                  <Button asChild variant="outline" className="flex-1" size="sm">
                    <Link href={`/sequences/${sequence.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rediger
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1" size="sm">
                    <Link href={`/sequences/${sequence.id}/enrollments`}>
                      <Users className="h-4 w-4 mr-2" />
                      Påmeldte
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}

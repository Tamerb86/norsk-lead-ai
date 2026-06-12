import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Mail, Phone, Globe, Briefcase, Hash, Clock, AlertCircle, Sparkles, ArrowRight, CheckCircle2, TrendingUp, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { KanbanBoardSkeleton } from "@/components/SkeletonLoaders";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Leads() {
  const { user } = useAuth();
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { data: leadsData, isLoading, refetch } = trpc.leads.list.useQuery({ campaignId: 0 });
  const leads = leadsData?.leads;
  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toastSuccess("Status oppdatert!", {
        description: "Lead-statusen er endret"
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke oppdatere status", {
        description: error.message
      });
    },
  });

  // Note: Delete functionality would need to be added to backend

  const toggleLead = (leadId: number) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedLeads.length === 0) return;

    try {
      await Promise.all(
        selectedLeads.map(leadId => 
          updateStatusMutation.mutateAsync({ id: leadId, status: bulkStatus as any })
        )
      );
      toastSuccess(`${selectedLeads.length} leads oppdatert!`, {
        description: "Statusen er endret for alle valgte leads"
      });
      setSelectedLeads([]);
      setBulkStatus("");
    } catch (error: any) {
      toastError("Noen leads kunne ikke oppdateres", {
        description: "Prøv igjen senere"
      });
    }
  };

  if (!user) return null;

  // Group leads by status for Kanban columns
  const columns = {
    contacted: { title: "Kontaktet", color: "blue", items: [] as any[] },
    interested: { title: "Interessert", color: "green", items: [] as any[] },
    replied: { title: "Svart", color: "purple", items: [] as any[] },
    closed: { title: "Lukket", color: "pink", items: [] as any[] },
  };

  // Distribute leads into columns
  if (leads) {
    leads.forEach((item) => {
      const status = item.lead.status;
      // Map various statuses to our 4 main columns
      if (status === 'pending' || status === 'sent' || status === 'delivered' || status === 'opened' || status === 'clicked') {
        columns.contacted.items.push(item);
      } else if (status === 'interested') {
        columns.interested.items.push(item);
      } else if (status === 'replied') {
        columns.replied.items.push(item);
      } else if (status === 'not_interested' || status === 'bounced' || status === 'unsubscribed') {
        columns.closed.items.push(item);
      } else {
        // Default to contacted
        columns.contacted.items.push(item);
      }
    });
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // No movement
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Get the lead ID from draggableId
    const leadId = parseInt(draggableId.replace('lead-', ''));

    // Map column ID to status
    const statusMap: Record<string, string> = {
      contacted: 'sent',
      interested: 'interested',
      replied: 'replied',
      closed: 'not_interested',
    };

    const newStatus = statusMap[destination.droppableId];

    // Update the status
    updateStatusMutation.mutate({
      id: leadId,
      status: newStatus,
    });
  };

  const getColumnGradient = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-500 to-indigo-600';
      case 'green':
        return 'from-green-500 to-emerald-600';
      case 'purple':
        return 'from-purple-500 to-pink-600';
      case 'pink':
        return 'from-pink-500 to-rose-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getColumnBg = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'purple':
        return 'bg-purple-50 border-purple-200';
      case 'pink':
        return 'bg-pink-50 border-pink-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Calculate stats
  const stats = {
    contacted: columns.contacted.items.length,
    interested: columns.interested.items.length,
    replied: columns.replied.items.length,
    closed: columns.closed.items.length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Kontaktet</p>
                  <p className="text-3xl font-bold mt-1">{stats.contacted}</p>
                </div>
                <Mail className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Interessert</p>
                  <p className="text-3xl font-bold mt-1">{stats.interested}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100">Svart</p>
                  <p className="text-3xl font-bold mt-1">{stats.replied}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-pink-100">Lukket</p>
                  <p className="text-3xl font-bold mt-1">{stats.closed}</p>
                </div>
                <Clock className="w-10 h-10 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeads.length > 0 && (
          <Card className="mb-6 border-2 border-blue-500 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-900 bg-blue-200 px-3 py-1 rounded-full">
                    {selectedLeads.length} leads valgt
                  </span>
                  <div className="flex items-center gap-2">
                    <Select value={bulkStatus} onValueChange={setBulkStatus}>
                      <SelectTrigger className="w-[200px] bg-white">
                        <SelectValue placeholder="Velg ny status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contacted">Kontaktet</SelectItem>
                        <SelectItem value="interested">Interessert</SelectItem>
                        <SelectItem value="replied">Svart</SelectItem>
                        <SelectItem value="not_interested">Ikke interessert</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      onClick={handleBulkStatusUpdate}
                      disabled={!bulkStatus || updateStatusMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Oppdater status
                    </Button>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedLeads([])}
                  className="border-gray-400 text-gray-600 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Fjern valg
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board */}
        {isLoading ? (
          <KanbanBoardSkeleton />
        ) : leads && leads.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(columns).map(([columnId, column]) => (
                <div key={columnId} className="flex flex-col">
                  {/* Column Header */}
                  <div className={`p-4 rounded-t-xl border-2 ${getColumnBg(column.color)}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">{column.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getColumnGradient(column.color)} text-white shadow-sm`}>
                        {column.items.length}
                      </span>
                    </div>
                  </div>

                  {/* Droppable Column */}
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 space-y-3 rounded-b-xl border-2 border-t-0 ${getColumnBg(column.color)} min-h-[400px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-opacity-70' : ''
                        }`}
                      >
                        {column.items.map((item, index) => (
                          <Draggable
                            key={item.lead.id}
                            draggableId={`lead-${item.lead.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...(provided.draggableProps as any) /* rbd types clash with React 19 CSSProperties */}
                                {...provided.dragHandleProps}
                                className={`p-4 bg-white rounded-lg border-2 ${
                                  selectedLeads.includes(item.lead.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                } shadow-sm hover:shadow-md transition-all cursor-move ${
                                  snapshot.isDragging ? 'shadow-xl rotate-2 scale-105' : ''
                                }`}
                              >
                                {/* Checkbox */}
                                <div className="flex items-start gap-2 mb-3">
                                  <Checkbox
                                    checked={selectedLeads.includes(item.lead.id)}
                                    onCheckedChange={() => toggleLead(item.lead.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                {/* Company Header */}
                                <div className="flex items-start gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColumnGradient(column.color)} flex items-center justify-center shadow-md flex-shrink-0`}>
                                    <Building2 className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-gray-900 truncate">
                                      {item.company?.navn || "Unknown Company"}
                                    </h4>
                                    {item.company?.organisasjonsnummer && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {item.company.organisasjonsnummer}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2">
                                  {item.company?.epostadresse && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                      <span className="text-gray-700 truncate">{item.company.epostadresse}</span>
                                    </div>
                                  )}
                                  {item.company?.telefon && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Phone className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                      <span className="text-gray-700">{item.company.telefon}</span>
                                    </div>
                                  )}
                                  {item.company?.hjemmeside && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Globe className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                                      <a
                                        href={item.company.hjemmeside}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:underline truncate"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {item.company.hjemmeside.replace(/^https?:\/\//, '')}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Industry Badge */}
                                {item.company?.naeringsbeskrivelse1 && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 truncate">
                                      {item.company.naeringsbeskrivelse1}
                                    </p>
                                  </div>
                                )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Empty State */}
                        {column.items.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p className="text-sm">Ingen leads her</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        ) : (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ingen leads ennå</h3>
                <p className="text-gray-600 mb-6">
                  Start en kampanje for å generere leads
                </p>
                <Link href="/dashboard/campaigns">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Opprett Kampanje
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

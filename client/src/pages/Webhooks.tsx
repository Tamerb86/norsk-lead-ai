import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";
import { 
  Webhook, 
  Plus, 
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Copy,
  ExternalLink,
  Zap,
  AlertTriangle
} from "lucide-react";

const WEBHOOK_EVENTS = [
  { value: "lead.created", label: "Lead opprettet", category: "Leads" },
  { value: "lead.updated", label: "Lead oppdatert", category: "Leads" },
  { value: "lead.deleted", label: "Lead slettet", category: "Leads" },
  { value: "campaign.created", label: "Kampanje opprettet", category: "Kampanjer" },
  { value: "campaign.sent", label: "Kampanje sendt", category: "Kampanjer" },
  { value: "campaign.completed", label: "Kampanje fullført", category: "Kampanjer" },
  { value: "email.opened", label: "E-post åpnet", category: "E-post" },
  { value: "email.clicked", label: "Lenke klikket", category: "E-post" },
  { value: "email.replied", label: "E-post besvart", category: "E-post" },
  { value: "email.bounced", label: "E-post returnert", category: "E-post" },
  { value: "subscription.created", label: "Abonnement opprettet", category: "Abonnement" },
  { value: "subscription.cancelled", label: "Abonnement avsluttet", category: "Abonnement" },
];

export default function Webhooks() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [isDeliveriesDialogOpen, setIsDeliveriesDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
  });

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: () => trpcClient.webhooks.list.query(),
  });

  // Fetch deliveries for selected webhook
  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ["webhookDeliveries", selectedWebhook?.id],
    queryFn: () => trpcClient.webhooks.getDeliveries.query({ webhookId: selectedWebhook.id }),
    enabled: !!selectedWebhook,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => trpcClient.webhooks.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Webhook opprettet!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke opprette webhook");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ webhookId, isActive }: { webhookId: number; isActive: boolean }) =>
      trpcClient.webhooks.update.mutate({ webhookId, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook oppdatert!");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (webhookId: number) => trpcClient.webhooks.delete.mutate({ webhookId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook slettet!");
    },
  });

  // Test mutation
  const testMutation = useMutation({
    mutationFn: (webhookId: number) => trpcClient.webhooks.test.mutate({ webhookId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhookDeliveries"] });
      toast.success("Test-webhook sendt!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke sende test");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      secret: "",
      events: [],
    });
  };

  const handleCreate = () => {
    if (formData.events.length === 0) {
      toast.error("Velg minst én hendelse");
      return;
    }
    createMutation.mutate(formData);
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setFormData({ ...formData, secret });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopiert til utklippstavle!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Suksess</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Feilet</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Venter</Badge>;
      case "retrying":
        return <Badge className="bg-yellow-500"><RefreshCw className="mr-1 h-3 w-3" />Prøver igjen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Group events by category
  const eventsByCategory = WEBHOOK_EVENTS.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof WEBHOOK_EVENTS>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <PageHelp title="Webhooks" description={PAGE_DESCRIPTIONS.webhooks} />
            <p className="text-muted-foreground">
              Integrer med eksterne systemer ved å motta hendelser i sanntid
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ny webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Opprett ny webhook</DialogTitle>
                <DialogDescription>
                  Konfigurer en webhook for å motta hendelser fra NorskLeads
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Navn</Label>
                    <Input
                      placeholder="F.eks. Slack-integrasjon"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Endpoint URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/webhook"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Hemmelighet (valgfritt)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Brukes til å signere forespørsler"
                        value={formData.secret}
                        onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                      />
                      <Button type="button" variant="outline" onClick={generateSecret}>
                        Generer
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vi signerer forespørsler med HMAC-SHA256 slik at du kan verifisere at de kommer fra oss
                    </p>
                  </div>
                </div>
                
                {/* Events Selection */}
                <div className="space-y-4">
                  <Label>Hendelser å lytte på</Label>
                  {Object.entries(eventsByCategory).map(([category, events]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {events.map((event) => (
                          <div key={event.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={event.value}
                              checked={formData.events.includes(event.value)}
                              onCheckedChange={() => toggleEvent(event.value)}
                            />
                            <label
                              htmlFor={event.value}
                              className="text-sm cursor-pointer"
                            >
                              {event.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Oppretter..." : "Opprett webhook"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt webhooks</CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{webhooks?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive</CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {webhooks?.filter((w: any) => w.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vellykkede</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {webhooks?.reduce((acc: number, w: any) => acc + (w.successful_deliveries || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feilede</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {webhooks?.reduce((acc: number, w: any) => acc + (w.failed_deliveries || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <CardTitle>Dine webhooks</CardTitle>
            <CardDescription>
              Administrer webhooks og se leveringshistorikk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : webhooks?.length === 0 ? (
              <div className="text-center py-8">
                <Webhook className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Ingen webhooks ennå</h3>
                <p className="text-muted-foreground">
                  Opprett din første webhook for å integrere med eksterne systemer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks?.map((webhook: any) => (
                  <Card key={webhook.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) =>
                            updateMutation.mutate({ webhookId: webhook.id, isActive: checked })
                          }
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{webhook.name}</h4>
                            {webhook.is_active ? (
                              <Badge className="bg-green-500">Aktiv</Badge>
                            ) : (
                              <Badge variant="secondary">Inaktiv</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {webhook.url}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(webhook.url)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {JSON.parse(webhook.events || "[]").slice(0, 3).map((event: string) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {WEBHOOK_EVENTS.find((e) => e.value === event)?.label || event}
                              </Badge>
                            ))}
                            {JSON.parse(webhook.events || "[]").length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{JSON.parse(webhook.events || "[]").length - 3} mer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-muted-foreground mr-4">
                          <div>{webhook.total_deliveries || 0} leveringer</div>
                          <div className="text-xs">
                            {webhook.last_delivery_status && (
                              <span className={webhook.last_delivery_status === "success" ? "text-green-500" : "text-destructive"}>
                                Siste: {webhook.last_delivery_status}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setIsDeliveriesDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Logg
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testMutation.mutate(webhook.id)}
                          disabled={testMutation.isPending}
                        >
                          <Play className="mr-1 h-4 w-4" />
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deliveries Dialog */}
        <Dialog open={isDeliveriesDialogOpen} onOpenChange={setIsDeliveriesDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Leveringslogg: {selectedWebhook?.name}</DialogTitle>
              <DialogDescription>
                Siste 50 leveringer til denne webhooken
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              {deliveriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : deliveries?.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Ingen leveringer ennå</h3>
                </div>
              ) : (
                deliveries?.map((delivery: any) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusBadge(delivery.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {WEBHOOK_EVENTS.find((e) => e.value === delivery.event_type)?.label || delivery.event_type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(delivery.created_at).toLocaleString("nb-NO")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {delivery.response_status && (
                        <span className={delivery.response_status < 400 ? "text-green-500" : "text-destructive"}>
                          HTTP {delivery.response_status}
                        </span>
                      )}
                      {delivery.response_time && (
                        <span className="text-muted-foreground">
                          {delivery.response_time}ms
                        </span>
                      )}
                      {delivery.error_message && (
                        <span className="text-destructive text-xs max-w-[200px] truncate">
                          {delivery.error_message}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

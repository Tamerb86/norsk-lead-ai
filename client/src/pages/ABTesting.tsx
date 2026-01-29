import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";
import { 
  FlaskConical, 
  Plus, 
  Play, 
  Trophy, 
  BarChart3, 
  Mail, 
  MousePointer, 
  MessageSquare,
  Clock,
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function ABTesting() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    testType: "subject" as "subject" | "content" | "sender" | "send_time",
    sampleSize: 20,
    winningCriteria: "open_rate" as "open_rate" | "click_rate" | "reply_rate",
    autoSelectWinner: true,
    testDurationHours: 24,
    variantA: { subject: "", body: "" },
    variantB: { subject: "", body: "" },
  });

  // Fetch A/B tests
  const { data: tests, isLoading } = useQuery({
    queryKey: ["abTests"],
    queryFn: () => trpc.abTests.list.query(),
  });

  // Fetch campaigns for selection
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => trpc.campaigns.list.query(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => trpc.abTests.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abTests"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("A/B-test opprettet!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke opprette test");
    },
  });

  // Start test mutation
  const startMutation = useMutation({
    mutationFn: (testId: number) => trpc.abTests.start.mutate({ testId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abTests"] });
      toast.success("Test startet!");
    },
  });

  // Select winner mutation
  const selectWinnerMutation = useMutation({
    mutationFn: ({ testId, winnerId }: { testId: number; winnerId: "A" | "B" }) =>
      trpc.abTests.selectWinner.mutate({ testId, winnerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abTests"] });
      toast.success("Vinner valgt!");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      testType: "subject",
      sampleSize: 20,
      winningCriteria: "open_rate",
      autoSelectWinner: true,
      testDurationHours: 24,
      variantA: { subject: "", body: "" },
      variantB: { subject: "", body: "" },
    });
    setSelectedCampaignId(null);
  };

  const handleCreate = () => {
    if (!selectedCampaignId) {
      toast.error("Velg en kampanje");
      return;
    }
    createMutation.mutate({
      campaignId: selectedCampaignId,
      ...formData,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Utkast</Badge>;
      case "running":
        return <Badge className="bg-blue-500">Kjører</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Fullført</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Avbrutt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case "subject": return "Emne";
      case "content": return "Innhold";
      case "sender": return "Avsender";
      case "send_time": return "Sendetid";
      default: return type;
    }
  };

  const getCriteriaLabel = (criteria: string) => {
    switch (criteria) {
      case "open_rate": return "Åpningsrate";
      case "click_rate": return "Klikkrate";
      case "reply_rate": return "Svarrate";
      default: return criteria;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <PageHelp title="A/B-testing" description={PAGE_DESCRIPTIONS.abTesting} />
            <p className="text-muted-foreground">
              Test ulike versjoner av e-postene dine for å finne hva som fungerer best
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ny A/B-test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Opprett ny A/B-test</DialogTitle>
                <DialogDescription>
                  Konfigurer testen din og definer de to variantene
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Testnavn</Label>
                    <Input
                      placeholder="F.eks. Test av emnelinjer - Januar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Kampanje</Label>
                    <Select
                      value={selectedCampaignId?.toString() || ""}
                      onValueChange={(v) => setSelectedCampaignId(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kampanje" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns?.map((c: any) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Testtype</Label>
                      <Select
                        value={formData.testType}
                        onValueChange={(v: any) => setFormData({ ...formData, testType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subject">Emnelinje</SelectItem>
                          <SelectItem value="content">Innhold</SelectItem>
                          <SelectItem value="sender">Avsender</SelectItem>
                          <SelectItem value="send_time">Sendetidspunkt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Vinnerkriterium</Label>
                      <Select
                        value={formData.winningCriteria}
                        onValueChange={(v: any) => setFormData({ ...formData, winningCriteria: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open_rate">Åpningsrate</SelectItem>
                          <SelectItem value="click_rate">Klikkrate</SelectItem>
                          <SelectItem value="reply_rate">Svarrate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Utvalgsstørrelse ({formData.sampleSize}%)</Label>
                      <Input
                        type="range"
                        min="5"
                        max="50"
                        value={formData.sampleSize}
                        onChange={(e) => setFormData({ ...formData, sampleSize: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Prosent av mottakere som får testvarianter
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Testvarighet (timer)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="168"
                        value={formData.testDurationHours}
                        onChange={(e) => setFormData({ ...formData, testDurationHours: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Variants */}
                <Tabs defaultValue="A" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="A">Variant A</TabsTrigger>
                    <TabsTrigger value="B">Variant B</TabsTrigger>
                  </TabsList>
                  <TabsContent value="A" className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Emnelinje A</Label>
                      <Input
                        placeholder="Skriv emnelinje for variant A"
                        value={formData.variantA.subject}
                        onChange={(e) => setFormData({
                          ...formData,
                          variantA: { ...formData.variantA, subject: e.target.value }
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Innhold A (valgfritt)</Label>
                      <Textarea
                        placeholder="Skriv e-postinnhold for variant A"
                        rows={4}
                        value={formData.variantA.body}
                        onChange={(e) => setFormData({
                          ...formData,
                          variantA: { ...formData.variantA, body: e.target.value }
                        })}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="B" className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Emnelinje B</Label>
                      <Input
                        placeholder="Skriv emnelinje for variant B"
                        value={formData.variantB.subject}
                        onChange={(e) => setFormData({
                          ...formData,
                          variantB: { ...formData.variantB, subject: e.target.value }
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Innhold B (valgfritt)</Label>
                      <Textarea
                        placeholder="Skriv e-postinnhold for variant B"
                        rows={4}
                        value={formData.variantB.body}
                        onChange={(e) => setFormData({
                          ...formData,
                          variantB: { ...formData.variantB, body: e.target.value }
                        })}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Oppretter..." : "Opprett test"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt tester</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tests?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kjører nå</CardTitle>
              <Play className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tests?.filter((t: any) => t.status === "running").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fullført</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tests?.filter((t: any) => t.status === "completed").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utkast</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tests?.filter((t: any) => t.status === "draft").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <Card>
          <CardHeader>
            <CardTitle>Dine A/B-tester</CardTitle>
            <CardDescription>
              Administrer og overvåk dine pågående og fullførte tester
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tests?.length === 0 ? (
              <div className="text-center py-8">
                <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Ingen tester ennå</h3>
                <p className="text-muted-foreground">
                  Opprett din første A/B-test for å optimalisere e-postene dine
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tests?.map((test: any) => (
                  <Card key={test.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{test.name}</h4>
                          {getStatusBadge(test.status)}
                          {test.winner_id && (
                            <Badge className="bg-yellow-500">
                              <Trophy className="mr-1 h-3 w-3" />
                              Vinner: {test.winner_id}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Kampanje: {test.campaign_name} • Type: {getTestTypeLabel(test.test_type)} • 
                          Kriterium: {getCriteriaLabel(test.winning_criteria)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {test.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => startMutation.mutate(test.id)}
                            disabled={startMutation.isPending}
                          >
                            <Play className="mr-1 h-4 w-4" />
                            Start
                          </Button>
                        )}
                        {test.status === "running" && !test.winner_id && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectWinnerMutation.mutate({ testId: test.id, winnerId: "A" })}
                            >
                              Velg A
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectWinnerMutation.mutate({ testId: test.id, winnerId: "B" })}
                            >
                              Velg B
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Variant Stats */}
                    {test.variants && test.variants.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {test.variants.map((variant: any) => (
                          <div
                            key={variant.variant_id}
                            className={`p-3 rounded-lg border ${
                              test.winner_id === variant.variant_id
                                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                                : "border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Variant {variant.variant_id}</span>
                              {test.winner_id === variant.variant_id && (
                                <Trophy className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{variant.open_rate?.toFixed(1) || 0}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MousePointer className="h-3 w-3 text-muted-foreground" />
                                <span>{variant.click_rate?.toFixed(1) || 0}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                <span>{variant.reply_rate?.toFixed(1) || 0}%</span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Sendt: {variant.sent_count || 0} • Åpnet: {variant.opened_count || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

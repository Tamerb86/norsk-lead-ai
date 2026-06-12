import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";
import { 
  Target, 
  Plus, 
  Flame, 
  Thermometer,
  Snowflake,
  TrendingUp,
  Settings,
  Trash2,
  Edit,
  Building2,
  Mail,
  MousePointer
} from "lucide-react";

export default function LeadScoring() {
  const queryClient = useQueryClient();
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | undefined>(undefined);
  
  // Form state for new rule
  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    ruleType: "engagement" as "engagement" | "company_attribute" | "behavior",
    condition: "",
    operator: "equals" as "equals" | "contains" | "greater_than" | "less_than" | "not_equals",
    value: "",
    scoreChange: 10,
    priority: 0,
  });

  // Fetch lead scores
  const { data: scores, isLoading: scoresLoading } = useQuery({
    queryKey: ["leadScores", selectedTier],
    queryFn: () => trpcClient.leadScoringAdvanced.getScores.query(selectedTier ? { tier: selectedTier as any } : undefined),
  });

  // Fetch scoring rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ["scoringRules"],
    queryFn: () => trpcClient.leadScoringAdvanced.getRules.query(),
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (data: any) => trpcClient.leadScoringAdvanced.createRule.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoringRules"] });
      setIsRuleDialogOpen(false);
      resetRuleForm();
      toast.success("Regel opprettet!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke opprette regel");
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: number) => trpcClient.leadScoringAdvanced.deleteRule.mutate({ ruleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoringRules"] });
      toast.success("Regel slettet!");
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: number; isActive: boolean }) =>
      trpcClient.leadScoringAdvanced.updateRule.mutate({ ruleId, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoringRules"] });
      toast.success("Regel oppdatert!");
    },
  });

  const resetRuleForm = () => {
    setRuleForm({
      name: "",
      description: "",
      ruleType: "engagement",
      condition: "",
      operator: "equals",
      value: "",
      scoreChange: 10,
      priority: 0,
    });
  };

  const handleCreateRule = () => {
    createRuleMutation.mutate(ruleForm);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "very_hot":
        return <Flame className="h-5 w-5 text-red-500" />;
      case "hot":
        return <Flame className="h-5 w-5 text-orange-500" />;
      case "warm":
        return <Thermometer className="h-5 w-5 text-yellow-500" />;
      case "cold":
      default:
        return <Snowflake className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "very_hot":
        return <Badge className="bg-red-500">Veldig varm</Badge>;
      case "hot":
        return <Badge className="bg-orange-500">Varm</Badge>;
      case "warm":
        return <Badge className="bg-yellow-500 text-black">Lun</Badge>;
      case "cold":
      default:
        return <Badge className="bg-blue-500">Kald</Badge>;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "very_hot": return "Veldig varm";
      case "hot": return "Varm";
      case "warm": return "Lun";
      case "cold": return "Kald";
      default: return tier;
    }
  };

  const getConditionOptions = (ruleType: string) => {
    switch (ruleType) {
      case "engagement":
        return [
          { value: "email_opened", label: "E-post åpnet" },
          { value: "email_clicked", label: "Lenke klikket" },
          { value: "email_replied", label: "Svart på e-post" },
          { value: "email_bounced", label: "E-post returnert" },
        ];
      case "company_attribute":
        return [
          { value: "company_size", label: "Bedriftsstørrelse" },
          { value: "industry", label: "Bransje" },
          { value: "location", label: "Lokasjon" },
          { value: "has_website", label: "Har nettside" },
          { value: "has_email", label: "Har e-post" },
        ];
      case "behavior":
        return [
          { value: "page_visit", label: "Sidebesøk" },
          { value: "form_submit", label: "Skjema sendt" },
          { value: "download", label: "Nedlasting" },
        ];
      default:
        return [];
    }
  };

  // Calculate tier counts
  const tierCounts = {
    very_hot: scores?.filter((s: any) => s.tier === "very_hot").length || 0,
    hot: scores?.filter((s: any) => s.tier === "hot").length || 0,
    warm: scores?.filter((s: any) => s.tier === "warm").length || 0,
    cold: scores?.filter((s: any) => s.tier === "cold").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <PageHelp title="Lead Scoring" description={PAGE_DESCRIPTIONS.leadScoring} />
            <p className="text-muted-foreground">
              Automatisk rangering av leads basert på engasjement og egenskaper
            </p>
          </div>
        </div>

        {/* Tier Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-all ${selectedTier === "very_hot" ? "ring-2 ring-red-500" : ""}`}
            onClick={() => setSelectedTier(selectedTier === "very_hot" ? undefined : "very_hot")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veldig varme</CardTitle>
              <Flame className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tierCounts.very_hot}</div>
              <p className="text-xs text-muted-foreground">80+ poeng</p>
              <Progress value={80} className="mt-2 h-1" />
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${selectedTier === "hot" ? "ring-2 ring-orange-500" : ""}`}
            onClick={() => setSelectedTier(selectedTier === "hot" ? undefined : "hot")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Varme</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tierCounts.hot}</div>
              <p className="text-xs text-muted-foreground">50-79 poeng</p>
              <Progress value={65} className="mt-2 h-1" />
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${selectedTier === "warm" ? "ring-2 ring-yellow-500" : ""}`}
            onClick={() => setSelectedTier(selectedTier === "warm" ? undefined : "warm")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lune</CardTitle>
              <Thermometer className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tierCounts.warm}</div>
              <p className="text-xs text-muted-foreground">25-49 poeng</p>
              <Progress value={35} className="mt-2 h-1" />
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${selectedTier === "cold" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedTier(selectedTier === "cold" ? undefined : "cold")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kalde</CardTitle>
              <Snowflake className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tierCounts.cold}</div>
              <p className="text-xs text-muted-foreground">0-24 poeng</p>
              <Progress value={10} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">
              <Target className="mr-2 h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Settings className="mr-2 h-4 w-4" />
              Regler
            </TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTier ? `${getTierLabel(selectedTier)} leads` : "Alle leads"}
                </CardTitle>
                <CardDescription>
                  {selectedTier 
                    ? `Viser leads med ${getTierLabel(selectedTier).toLowerCase()} status`
                    : "Klikk på en kategori ovenfor for å filtrere"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scoresLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : scores?.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Ingen leads med score ennå</h3>
                    <p className="text-muted-foreground">
                      Lead scores beregnes automatisk basert på aktivitet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scores?.map((score: any) => (
                      <div
                        key={score.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getTierIcon(score.tier)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{score.company_name || `Lead #${score.lead_id}`}</span>
                              {getTierBadge(score.tier)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Engasjement: {score.engagement_score || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Bedrift: {score.company_score || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{score.total_score}</div>
                          <div className="text-xs text-muted-foreground">poeng</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Scoringsregler</CardTitle>
                  <CardDescription>
                    Definer regler for automatisk lead scoring
                  </CardDescription>
                </div>
                <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Ny regel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Opprett scoringsregel</DialogTitle>
                      <DialogDescription>
                        Definer når og hvordan leads skal få poeng
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label>Regelnavn</Label>
                        <Input
                          placeholder="F.eks. E-post åpnet"
                          value={ruleForm.name}
                          onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Beskrivelse (valgfritt)</Label>
                        <Input
                          placeholder="Beskriv regelen"
                          value={ruleForm.description}
                          onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Regeltype</Label>
                        <Select
                          value={ruleForm.ruleType}
                          onValueChange={(v: any) => setRuleForm({ ...ruleForm, ruleType: v, condition: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engagement">Engasjement</SelectItem>
                            <SelectItem value="company_attribute">Bedriftsattributt</SelectItem>
                            <SelectItem value="behavior">Atferd</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Betingelse</Label>
                          <Select
                            value={ruleForm.condition}
                            onValueChange={(v) => setRuleForm({ ...ruleForm, condition: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg betingelse" />
                            </SelectTrigger>
                            <SelectContent>
                              {getConditionOptions(ruleForm.ruleType).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Operator</Label>
                          <Select
                            value={ruleForm.operator}
                            onValueChange={(v: any) => setRuleForm({ ...ruleForm, operator: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Er lik</SelectItem>
                              <SelectItem value="not_equals">Er ikke lik</SelectItem>
                              <SelectItem value="contains">Inneholder</SelectItem>
                              <SelectItem value="greater_than">Større enn</SelectItem>
                              <SelectItem value="less_than">Mindre enn</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Verdi</Label>
                          <Input
                            placeholder="Sammenligningsverdi"
                            value={ruleForm.value}
                            onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Poengendring</Label>
                          <Input
                            type="number"
                            value={ruleForm.scoreChange}
                            onChange={(e) => setRuleForm({ ...ruleForm, scoreChange: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
                        Avbryt
                      </Button>
                      <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                        {createRuleMutation.isPending ? "Oppretter..." : "Opprett regel"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : rules?.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Ingen regler definert</h3>
                    <p className="text-muted-foreground">
                      Opprett regler for å automatisere lead scoring
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules?.map((rule: any) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) =>
                              updateRuleMutation.mutate({ ruleId: rule.id, isActive: checked })
                            }
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rule.name}</span>
                              <Badge variant="outline">{rule.rule_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {rule.condition} {rule.operator} {rule.value}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-lg font-bold ${rule.score_change > 0 ? "text-green-500" : "text-red-500"}`}>
                            {rule.score_change > 0 ? "+" : ""}{rule.score_change}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

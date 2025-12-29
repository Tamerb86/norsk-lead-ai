import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Sparkles,
  Building2,
  Mail,
  TrendingUp,
  Target,
  Search,
  Copy,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
} from "lucide-react";

export default function AIInsights() {
  // Lead Insights
  const [leadCompany, setLeadCompany] = useState("");
  const [leadIndustry, setLeadIndustry] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadWebsite, setLeadWebsite] = useState("");

  const insightsMutation = trpc.ai.generateLeadInsights.useMutation({
    onSuccess: () => {
      toast.success("Innsikt generert!");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    },
  });

  // Company Research
  const [researchCompany, setResearchCompany] = useState("");
  const [researchWebsite, setResearchWebsite] = useState("");

  const researchMutation = trpc.ai.researchCompany.useMutation({
    onSuccess: () => {
      toast.success("Forskning fullført!");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    },
  });

  // Email Sequence
  const [seqCompany, setSeqCompany] = useState("");
  const [seqGoal, setSeqGoal] = useState<"nurture" | "conversion" | "reengagement" | "onboarding">("nurture");
  const [seqSteps, setSeqSteps] = useState(5);

  const sequenceMutation = trpc.ai.generateEmailSequence.useMutation({
    onSuccess: () => {
      toast.success("Sekvens generert!");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    },
  });

  // Personalized Outreach
  const [outreachCompany, setOutreachCompany] = useState("");
  const [outreachContact, setOutreachContact] = useState("");
  const [outreachTrigger, setOutreachTrigger] = useState("");
  const [outreachProduct, setOutreachProduct] = useState("");
  const [outreachValue, setOutreachValue] = useState("");

  const outreachMutation = trpc.ai.generatePersonalizedOutreach.useMutation({
    onSuccess: () => {
      toast.success("Outreach generert!");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopiert!");
  };

  const goalLabels = {
    nurture: "Bygge relasjon",
    conversion: "Konvertere til kunde",
    reengagement: "Gjenoppta kontakt",
    onboarding: "Introdusere produkt",
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Innsikt
          </h1>
          <p className="text-muted-foreground mt-1">
            Bruk AI til å analysere leads og generere personalisert innhold
          </p>
        </div>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Lead-innsikt
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Bedriftsforskning
          </TabsTrigger>
          <TabsTrigger value="sequence" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-postsekvens
          </TabsTrigger>
          <TabsTrigger value="outreach" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personalisert outreach
          </TabsTrigger>
        </TabsList>

        {/* Lead Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Analyser lead
                </CardTitle>
                <CardDescription>
                  Få AI-drevet innsikt om en potensiell kunde
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bedriftsnavn *</Label>
                    <Input
                      placeholder="F.eks. Norsk Tech AS"
                      value={leadCompany}
                      onChange={(e) => setLeadCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bransje</Label>
                    <Input
                      placeholder="F.eks. IT"
                      value={leadIndustry}
                      onChange={(e) => setLeadIndustry(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kontaktperson</Label>
                    <Input
                      placeholder="F.eks. Ola Nordmann"
                      value={leadContact}
                      onChange={(e) => setLeadContact(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nettside</Label>
                    <Input
                      placeholder="www.example.no"
                      value={leadWebsite}
                      onChange={(e) => setLeadWebsite(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    insightsMutation.mutate({
                      companyName: leadCompany,
                      industry: leadIndustry || undefined,
                      contactName: leadContact || undefined,
                      website: leadWebsite || undefined,
                      language: "norwegian",
                    })
                  }
                  disabled={!leadCompany || insightsMutation.isPending}
                >
                  {insightsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generer innsikt
                </Button>
              </CardContent>
            </Card>

            {insightsMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Innsikt for {leadCompany}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      <p className="text-sm">{insightsMutation.data.summary}</p>

                      <Separator />

                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Styrker
                        </h4>
                        <ul className="space-y-1">
                          {insightsMutation.data.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Muligheter
                        </h4>
                        <ul className="space-y-1">
                          {insightsMutation.data.opportunities.map((o, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {o}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Risikoer
                        </h4>
                        <ul className="space-y-1">
                          {insightsMutation.data.risks.map((r, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {r}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium mb-2">Anbefalte handlinger</h4>
                        <div className="space-y-2">
                          {insightsMutation.data.recommendedActions.map((a, i) => (
                            <Card key={i} className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{a.action}</span>
                                <Badge
                                  variant={
                                    a.priority === "high"
                                      ? "destructive"
                                      : a.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {a.priority === "high"
                                    ? "Høy"
                                    : a.priority === "medium"
                                    ? "Medium"
                                    : "Lav"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {a.reason}
                              </p>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4" />
                          Beste tid å kontakte
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {insightsMutation.data.bestTimeToContact}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Samtalepunkter</h4>
                        <div className="flex flex-wrap gap-1">
                          {insightsMutation.data.suggestedTalkingPoints.map(
                            (tp, i) => (
                              <Badge key={i} variant="outline">
                                {tp}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Company Research Tab */}
        <TabsContent value="research">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Forsk på bedrift
                </CardTitle>
                <CardDescription>
                  Få detaljert informasjon om en bedrift
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bedriftsnavn *</Label>
                  <Input
                    placeholder="F.eks. Equinor ASA"
                    value={researchCompany}
                    onChange={(e) => setResearchCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nettside (valgfritt)</Label>
                  <Input
                    placeholder="www.example.no"
                    value={researchWebsite}
                    onChange={(e) => setResearchWebsite(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    researchMutation.mutate({
                      companyName: researchCompany,
                      website: researchWebsite || undefined,
                      language: "norwegian",
                    })
                  }
                  disabled={!researchCompany || researchMutation.isPending}
                >
                  {researchMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Start forskning
                </Button>
              </CardContent>
            </Card>

            {researchMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle>{researchCompany}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Oversikt</h4>
                        <p className="text-sm text-muted-foreground">
                          {researchMutation.data.overview}
                        </p>
                      </div>

                      {researchMutation.data.keyPeople.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Nøkkelpersoner</h4>
                          <div className="space-y-2">
                            {researchMutation.data.keyPeople.map((p, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <span>{p.name}</span>
                                <Badge variant="secondary">{p.title}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Smertepunkter</h4>
                        <ul className="space-y-1">
                          {researchMutation.data.painPoints.map((p, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground"
                            >
                              • {p}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Muligheter</h4>
                        <ul className="space-y-1">
                          {researchMutation.data.opportunities.map((o, i) => (
                            <li key={i} className="text-sm text-green-600">
                              • {o}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Konkurrenter</h4>
                        <div className="flex flex-wrap gap-1">
                          {researchMutation.data.competitors.map((c, i) => (
                            <Badge key={i} variant="outline">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Samtalepunkter</h4>
                        <div className="space-y-2">
                          {researchMutation.data.talkingPoints.map((tp, i) => (
                            <Card key={i} className="p-2">
                              <p className="text-sm">{tp}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Email Sequence Tab */}
        <TabsContent value="sequence">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Generer e-postsekvens
                </CardTitle>
                <CardDescription>
                  Lag en automatisert e-postkampanje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bedriftsnavn *</Label>
                  <Input
                    placeholder="F.eks. Norsk Tech AS"
                    value={seqCompany}
                    onChange={(e) => setSeqCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mål</Label>
                  <Select
                    value={seqGoal}
                    onValueChange={(v) => setSeqGoal(v as typeof seqGoal)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(goalLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Antall steg: {seqSteps}</Label>
                  <Input
                    type="range"
                    min={2}
                    max={10}
                    value={seqSteps}
                    onChange={(e) => setSeqSteps(Number(e.target.value))}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    sequenceMutation.mutate({
                      companyName: seqCompany,
                      goal: seqGoal,
                      steps: seqSteps,
                      language: "norwegian",
                    })
                  }
                  disabled={!seqCompany || sequenceMutation.isPending}
                >
                  {sequenceMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generer sekvens
                </Button>
              </CardContent>
            </Card>

            {sequenceMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle>{sequenceMutation.data.name}</CardTitle>
                  <CardDescription>
                    {sequenceMutation.data.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {sequenceMutation.data.steps.map((step, i) => (
                        <Card key={i} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>Dag {step.day}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  `Emne: ${step.subject}\n\n${step.body}`
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <h4 className="font-medium text-sm mb-1">
                            {step.subject}
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {step.body}
                          </p>
                          <p className="text-xs text-blue-500 mt-2">
                            Formål: {step.purpose}
                          </p>
                          {step.waitCondition && (
                            <p className="text-xs text-orange-500">
                              Vent: {step.waitCondition}
                            </p>
                          )}
                        </Card>
                      ))}

                      {sequenceMutation.data.tips.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Tips</h4>
                          <ul className="space-y-1">
                            {sequenceMutation.data.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground"
                              >
                                💡 {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Personalized Outreach Tab */}
        <TabsContent value="outreach">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personalisert outreach
                </CardTitle>
                <CardDescription>
                  Generer skreddersydd kontakt basert på trigger-hendelser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bedriftsnavn *</Label>
                    <Input
                      placeholder="F.eks. Norsk Tech AS"
                      value={outreachCompany}
                      onChange={(e) => setOutreachCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kontaktperson</Label>
                    <Input
                      placeholder="F.eks. Ola Nordmann"
                      value={outreachContact}
                      onChange={(e) => setOutreachContact(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Trigger/anledning</Label>
                  <Input
                    placeholder="F.eks. Nylig finansieringsrunde, ny ansettelse"
                    value={outreachTrigger}
                    onChange={(e) => setOutreachTrigger(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ditt produkt/tjeneste *</Label>
                  <Input
                    placeholder="Hva tilbyr du?"
                    value={outreachProduct}
                    onChange={(e) => setOutreachProduct(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Verdiforslag *</Label>
                  <Textarea
                    placeholder="Hvilken verdi gir du kunden?"
                    value={outreachValue}
                    onChange={(e) => setOutreachValue(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    outreachMutation.mutate({
                      companyName: outreachCompany,
                      contactName: outreachContact || undefined,
                      trigger: outreachTrigger || undefined,
                      yourProduct: outreachProduct,
                      valueProposition: outreachValue,
                      language: "norwegian",
                    })
                  }
                  disabled={
                    !outreachCompany ||
                    !outreachProduct ||
                    !outreachValue ||
                    outreachMutation.isPending
                  }
                >
                  {outreachMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generer outreach
                </Button>
              </CardContent>
            </Card>

            {outreachMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Personalisert outreach</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>E-post</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `Emne: ${outreachMutation.data!.subject}\n\n${
                              outreachMutation.data!.body
                            }`
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Card className="p-3">
                      <p className="font-medium text-sm mb-2">
                        {outreachMutation.data.subject}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {outreachMutation.data.body}
                      </p>
                    </Card>
                  </div>

                  {outreachMutation.data.linkedInMessage && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>LinkedIn-melding</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              outreachMutation.data!.linkedInMessage!
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Card className="p-3">
                        <p className="text-sm text-muted-foreground">
                          {outreachMutation.data.linkedInMessage}
                        </p>
                      </Card>
                    </div>
                  )}

                  <div>
                    <Label>Oppfølgingsforslag</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {outreachMutation.data.followUpSuggestion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

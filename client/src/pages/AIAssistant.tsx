import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, Message } from "@/components/AIChatBox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  Target,
  TrendingUp,
  Copy,
  RefreshCw,
  Mic,
  Shield,
  Zap,
} from "lucide-react";

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "Du er en intelligent salgsassistent for NorskLeads.",
    },
  ]);

  // Quick suggestions
  const suggestionsQuery = trpc.ai.getQuickSuggestions.useQuery(
    { language: "norwegian" },
    { staleTime: 60000 }
  );

  // Chat mutation
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    },
    onError: (error) => {
      toast.error("Kunne ikke få svar: " + error.message);
    },
  });

  // Objection handling
  const [objection, setObjection] = useState("");
  const [objectionProduct, setObjectionProduct] = useState("");
  const objectionMutation = trpc.ai.handleObjection.useMutation({
    onSuccess: () => {
      toast.success("Svar generert!");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    },
  });

  // Pitch generator
  const [pitchProduct, setPitchProduct] = useState("");
  const [pitchAudience, setPitchAudience] = useState("");
  const [pitchUSPs, setPitchUSPs] = useState("");
  const [pitchDuration, setPitchDuration] = useState<"30s" | "60s" | "2min">("60s");
  const pitchMutation = trpc.ai.generatePitch.useMutation({
    onSuccess: () => {
      toast.success("Pitch generert!");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    },
  });

  // Conversation analysis
  const [conversation, setConversation] = useState("");
  const conversationMutation = trpc.ai.analyzeConversation.useMutation({
    onSuccess: () => {
      toast.success("Analyse fullført!");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages, language: "norwegian" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopiert til utklippstavlen!");
  };

  const suggestedPrompts = [
    "Hjelp meg å skrive en salgs-e-post",
    "Analyser mine beste leads",
    "Gi meg tips for kald-oppsøking",
    "Hvordan håndterer jeg prisinnvendinger?",
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Salgsassistent
          </h1>
          <p className="text-muted-foreground mt-1">
            Din intelligente partner for salg og lead-generering
          </p>
        </div>
      </div>

      {/* Quick Suggestions */}
      {suggestionsQuery.data && (
        <div className="flex flex-wrap gap-2">
          {suggestionsQuery.data.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage(suggestion)}
              disabled={chatMutation.isPending}
            >
              <Zap className="h-3 w-3 mr-1" />
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat med AI
              </CardTitle>
              <CardDescription>
                Still spørsmål, få råd, og la AI hjelpe deg med salgsoppgaver
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={chatMutation.isPending}
                placeholder="Skriv en melding til AI-assistenten..."
                height="500px"
                emptyStateMessage="Start en samtale med din AI-salgsassistent"
                suggestedPrompts={suggestedPrompts}
              />
            </CardContent>
          </Card>
        </div>

        {/* Tools Sidebar */}
        <div className="space-y-6">
          <Tabs defaultValue="objections" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="objections">
                <Shield className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="pitch">
                <Mic className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="analyze">
                <TrendingUp className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            {/* Objection Handler */}
            <TabsContent value="objections">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Innvendingshåndtering
                  </CardTitle>
                  <CardDescription>
                    Få AI-genererte svar på salgsinnvendinger
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Innvending</Label>
                    <Textarea
                      placeholder="F.eks. 'Det er for dyrt'"
                      value={objection}
                      onChange={(e) => setObjection(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ditt produkt (valgfritt)</Label>
                    <Input
                      placeholder="F.eks. CRM-system"
                      value={objectionProduct}
                      onChange={(e) => setObjectionProduct(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      objectionMutation.mutate({
                        objection,
                        product: objectionProduct || undefined,
                        language: "norwegian",
                      })
                    }
                    disabled={!objection || objectionMutation.isPending}
                  >
                    {objectionMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2" />
                    )}
                    Generer svar
                  </Button>

                  {objectionMutation.data && (
                    <ScrollArea className="h-64 mt-4">
                      <div className="space-y-3">
                        {objectionMutation.data.responses.map((r, i) => (
                          <Card key={i} className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{r.approach}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(r.response)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm">{r.response}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Oppfølging: {r.followUp}
                            </p>
                          </Card>
                        ))}
                        {objectionMutation.data.tips.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Tips:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {objectionMutation.data.tips.map((tip, i) => (
                                <li key={i}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pitch Generator */}
            <TabsContent value="pitch">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="h-5 w-5 text-green-500" />
                    Pitch-generator
                  </CardTitle>
                  <CardDescription>
                    Lag overbevisende salgspitcher
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Produkt/tjeneste *</Label>
                    <Input
                      placeholder="Hva selger du?"
                      value={pitchProduct}
                      onChange={(e) => setPitchProduct(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Målgruppe *</Label>
                    <Input
                      placeholder="Hvem er kunden?"
                      value={pitchAudience}
                      onChange={(e) => setPitchAudience(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unike salgsargumenter</Label>
                    <Input
                      placeholder="Kommaseparert liste"
                      value={pitchUSPs}
                      onChange={(e) => setPitchUSPs(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Varighet</Label>
                    <Select
                      value={pitchDuration}
                      onValueChange={(v) => setPitchDuration(v as typeof pitchDuration)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30s">30 sekunder</SelectItem>
                        <SelectItem value="60s">60 sekunder</SelectItem>
                        <SelectItem value="2min">2 minutter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      pitchMutation.mutate({
                        product: pitchProduct,
                        targetAudience: pitchAudience,
                        uniqueSellingPoints: pitchUSPs
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                        duration: pitchDuration,
                        language: "norwegian",
                      })
                    }
                    disabled={
                      !pitchProduct || !pitchAudience || pitchMutation.isPending
                    }
                  >
                    {pitchMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generer pitch
                  </Button>

                  {pitchMutation.data && (
                    <Card className="mt-4 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Din pitch:</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(pitchMutation.data!.pitch)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {pitchMutation.data.pitch}
                      </p>
                      <div className="mt-4">
                        <p className="text-sm font-medium">Call-to-action:</p>
                        <p className="text-sm text-muted-foreground">
                          {pitchMutation.data.callToAction}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1">
                        {pitchMutation.data.keyMessages.map((msg, i) => (
                          <Badge key={i} variant="outline">
                            {msg}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversation Analyzer */}
            <TabsContent value="analyze">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Samtaleanalyse
                  </CardTitle>
                  <CardDescription>
                    Analyser salgssamtaler og få coaching
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Lim inn samtalen</Label>
                    <Textarea
                      placeholder="Kopier inn e-postutveksling eller samtalelogg..."
                      value={conversation}
                      onChange={(e) => setConversation(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      conversationMutation.mutate({
                        conversation,
                        language: "norwegian",
                      })
                    }
                    disabled={!conversation || conversationMutation.isPending}
                  >
                    {conversationMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Target className="h-4 w-4 mr-2" />
                    )}
                    Analyser samtale
                  </Button>

                  {conversationMutation.data && (
                    <ScrollArea className="h-64 mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Stemning:</span>
                          <Badge
                            variant={
                              conversationMutation.data.sentiment === "positive"
                                ? "default"
                                : conversationMutation.data.sentiment ===
                                  "negative"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {conversationMutation.data.sentiment === "positive"
                              ? "Positiv"
                              : conversationMutation.data.sentiment ===
                                "negative"
                              ? "Negativ"
                              : "Nøytral"}
                          </Badge>
                        </div>

                        {conversationMutation.data.objections.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Innvendinger:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {conversationMutation.data.objections.map(
                                (obj, i) => (
                                  <li key={i}>• {obj}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {conversationMutation.data.opportunities.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Muligheter:
                            </p>
                            <ul className="text-sm text-green-600 space-y-1">
                              {conversationMutation.data.opportunities.map(
                                (opp, i) => (
                                  <li key={i}>• {opp}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {conversationMutation.data.suggestedResponses.length >
                          0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Foreslåtte svar:
                            </p>
                            {conversationMutation.data.suggestedResponses.map(
                              (resp, i) => (
                                <Card key={i} className="p-2 mb-2">
                                  <p className="text-sm">{resp}</p>
                                </Card>
                              )
                            )}
                          </div>
                        )}

                        {conversationMutation.data.coachingTips.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Coaching-tips:
                            </p>
                            <ul className="text-sm text-blue-600 space-y-1">
                              {conversationMutation.data.coachingTips.map(
                                (tip, i) => (
                                  <li key={i}>💡 {tip}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

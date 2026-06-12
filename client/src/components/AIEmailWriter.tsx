import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Wand2, 
  Mail, 
  Lightbulb,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AIEmailWriterProps {
  companyName?: string;
  industry?: string;
  location?: string;
  contactName?: string;
  onEmailGenerated?: (subject: string, body: string) => void;
}

export function AIEmailWriter({
  companyName: initialCompanyName = "",
  industry: initialIndustry = "",
  location: initialLocation = "",
  contactName: initialContactName = "",
  onEmailGenerated,
}: AIEmailWriterProps) {
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [industry, setIndustry] = useState(initialIndustry);
  const [location, setLocation] = useState(initialLocation);
  const [contactName, setContactName] = useState(initialContactName);
  const [purpose, setPurpose] = useState<"sales" | "partnership" | "introduction" | "followup" | "custom">("sales");
  const [customPurpose, setCustomPurpose] = useState("");
  const [tone, setTone] = useState<"formal" | "friendly" | "professional">("professional");
  const [language, setLanguage] = useState<"norwegian" | "english">("norwegian");
  const [productOrService, setProductOrService] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [subjectVariants, setSubjectVariants] = useState<string[]>([]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const result = await trpcClient.ai.generateEmail.mutate({
        companyName,
        industry: industry || undefined,
        location: location || undefined,
        contactName: contactName || undefined,
        purpose,
        customPurpose: purpose === "custom" ? customPurpose : undefined,
        tone,
        language,
        productOrService: productOrService || undefined,
        additionalContext: additionalContext || undefined,
      });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedSubject(data.subject);
      setGeneratedBody(data.body);
      setTips(data.tips || []);
      toast.success("E-post generert!");
      if (onEmailGenerated) {
        onEmailGenerated(data.subject, data.body);
      }
    },
    onError: (error) => {
      toast.error("Kunne ikke generere e-post: " + (error as Error).message);
    },
  });

  const improveMutation = useMutation({
    mutationFn: async (instruction: string) => {
      const result = await trpcClient.ai.improveEmail.mutate({
        originalEmail: `Emne: ${generatedSubject}\n\n${generatedBody}`,
        instruction,
        language,
      });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedSubject(data.subject);
      setGeneratedBody(data.body);
      setTips(data.tips || []);
      toast.success("E-post forbedret!");
    },
    onError: (error) => {
      toast.error("Kunne ikke forbedre e-post: " + (error as Error).message);
    },
  });

  const subjectsMutation = useMutation({
    mutationFn: async () => {
      const result = await trpcClient.ai.generateSubjects.mutate({
        emailBody: generatedBody,
        count: 5,
        language,
      });
      return result;
    },
    onSuccess: (data) => {
      setSubjectVariants(data);
      toast.success("Emnelinjer generert!");
    },
    onError: (error) => {
      toast.error("Kunne ikke generere emnelinjer: " + (error as Error).message);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopiert til utklippstavlen!");
  };

  const purposeLabels = {
    sales: "Salg",
    partnership: "Partnerskap",
    introduction: "Introduksjon",
    followup: "Oppfølging",
    custom: "Egendefinert",
  };

  const toneLabels = {
    formal: "Formelt",
    friendly: "Vennlig",
    professional: "Profesjonelt",
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI E-postskriver
        </CardTitle>
        <CardDescription>
          Generer profesjonelle e-poster med kunstig intelligens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generer ny</TabsTrigger>
            <TabsTrigger value="result" disabled={!generatedBody}>
              Resultat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Bedriftsnavn *</Label>
                <Input
                  id="companyName"
                  placeholder="F.eks. Norsk Teknologi AS"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Kontaktperson</Label>
                <Input
                  id="contactName"
                  placeholder="F.eks. Ola Nordmann"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Formål *</Label>
                <Select value={purpose} onValueChange={(v) => setPurpose(v as typeof purpose)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(purposeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(toneLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Språk</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="norwegian">Norsk</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {purpose === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customPurpose">Beskriv formålet</Label>
                <Input
                  id="customPurpose"
                  placeholder="F.eks. Invitere til et webinar om..."
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                />
              </div>
            )}

            {/* Advanced Options Toggle */}
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>Avanserte innstillinger</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Bransje</Label>
                    <Input
                      id="industry"
                      placeholder="F.eks. IT, Bygg, Helse"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasjon</Label>
                    <Input
                      id="location"
                      placeholder="F.eks. Oslo, Bergen"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productOrService">Produkt/tjeneste du tilbyr</Label>
                  <Input
                    id="productOrService"
                    placeholder="F.eks. CRM-system, Markedsføringstjenester"
                    value={productOrService}
                    onChange={(e) => setProductOrService(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalContext">Tilleggsinformasjon</Label>
                  <Textarea
                    id="additionalContext"
                    placeholder="Andre detaljer som kan være nyttige..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => generateMutation.mutate()}
              disabled={!companyName || generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generer e-post
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="result" className="space-y-4 mt-4">
            {generatedBody && (
              <>
                {/* Subject */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Emnelinje</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedSubject)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => subjectsMutation.mutate()}
                        disabled={subjectsMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 ${subjectsMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={generatedSubject}
                    onChange={(e) => setGeneratedSubject(e.target.value)}
                    className="font-medium"
                  />
                  
                  {/* Subject Variants */}
                  {subjectVariants.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subjectVariants.map((variant, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setGeneratedSubject(variant)}
                        >
                          {variant}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>E-postinnhold</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedBody)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={generatedBody}
                    onChange={(e) => setGeneratedBody(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Tips */}
                {tips.length > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-amber-700 dark:text-amber-400">Tips</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
                      {tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Improve Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => improveMutation.mutate("Gjør den kortere og mer direkte")}
                    disabled={improveMutation.isPending}
                  >
                    Kortere
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => improveMutation.mutate("Gjør den mer overbevisende")}
                    disabled={improveMutation.isPending}
                  >
                    Mer overbevisende
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => improveMutation.mutate("Legg til mer personlig touch")}
                    disabled={improveMutation.isPending}
                  >
                    Mer personlig
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => improveMutation.mutate("Gjør call-to-action tydeligere")}
                    disabled={improveMutation.isPending}
                  >
                    Bedre CTA
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                    Generer på nytt
                  </Button>
                  <Button
                    onClick={() => {
                      copyToClipboard(`Emne: ${generatedSubject}\n\n${generatedBody}`);
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Kopier alt
                  </Button>
                  {onEmailGenerated && (
                    <Button
                      variant="default"
                      onClick={() => onEmailGenerated(generatedSubject, generatedBody)}
                    >
                      Bruk denne e-posten
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AIEmailWriter;

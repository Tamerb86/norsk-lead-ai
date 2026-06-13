import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, FileText, Plus, Edit, Trash2, Mail, Sparkles, Eye, Copy, Download, Search, Filter, BookTemplate, CheckCircle } from "lucide-react";
import { TemplatesListSkeleton } from "@/components/SkeletonLoaders";
import { Link } from "wouter";
import { toast } from "sonner";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import { VariableInserter } from "@/components/VariableInserter";
import { replaceVariables } from "@/lib/template-variables";
import { prebuiltTemplates, templateCategories, EmailTemplate } from "@/data/emailTemplates";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";

export default function Templates() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-templates");
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
  });

  const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery();
  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toastSuccess("Mal opprettet!", {
        description: "Malen er klar til bruk i kampanjer"
      });
      setShowCreateForm(false);
      setFormData({ name: "", subject: "", body: "" });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke opprette mal", {
        description: error.message
      });
    },
  });

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Mal slettet", {
        description: "Malen er fjernet fra listen"
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke slette mal", {
        description: error.message
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toastError("Alle felt er påkrevd", {
        description: "Fyll ut navn, emne og innhold"
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess("Kopiert!", {
      description: "Teksten er kopiert til utklippstavlen"
    });
  };

  const usePrebuiltTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.nameNo,
      subject: template.subject,
      body: template.body,
    });
    setShowCreateForm(true);
    setActiveTab("my-templates");
    toastSuccess("Mal lastet!", {
      description: "Rediger malen og lagre den som din egen"
    });
  };

  const insertVariableInSubject = (variable: string) => {
    const input = document.getElementById('subject') as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || formData.subject.length;
      const newValue = formData.subject.slice(0, start) + variable + formData.subject.slice(start);
      setFormData({ ...formData, subject: newValue });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const insertVariableInBody = (variable: string) => {
    const textarea = document.getElementById('body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart || formData.body.length;
      const newValue = formData.body.slice(0, start) + variable + formData.body.slice(start);
      setFormData({ ...formData, body: newValue });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // Filter prebuilt templates
  const filteredPrebuiltTemplates = prebuiltTemplates.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      template.nameNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.descriptionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <PageHelp title="Maler" description={PAGE_DESCRIPTIONS.templates} />
            <p className="text-gray-600">Lag og administrer e-postmaler</p>
          </div>
          <Button 
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setActiveTab("my-templates");
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ny mal
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="my-templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mine maler
            </TabsTrigger>
            <TabsTrigger value="prebuilt" className="flex items-center gap-2">
              <BookTemplate className="w-4 h-4" />
              Ferdiglagde maler
            </TabsTrigger>
          </TabsList>

          {/* Preview Modal - Shared */}
          {previewTemplate && (
            <Card className="mb-6 border-0 shadow-2xl bg-white fixed inset-4 z-50 overflow-auto">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-xl">Forhåndsvisning: {previewTemplate.name || previewTemplate.nameNo}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                    ✕ Lukk
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 max-w-4xl mx-auto">
                <div className="space-y-6">
                  {/* Variables Info */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 mb-1">Om dynamiske variabler</p>
                        <p className="text-xs text-amber-700">Tekst i doble klammer som <code className="bg-amber-100 px-1 rounded">{'{{company_name}}'}</code> erstattes automatisk med ekte data når e-posten sendes. For eksempel blir <code className="bg-amber-100 px-1 rounded">{'{{company_name}}'}</code> til "Bedrift AS".</p>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold mb-2">EMNE:</p>
                    <p className="text-base font-semibold text-gray-900">{previewTemplate.subject}</p>
                  </div>

                  {/* Body */}
                  <div className="p-6 bg-white rounded-lg border-2 border-gray-200 shadow-inner">
                    <p className="text-xs text-gray-500 font-semibold mb-3">INNHOLD:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {previewTemplate.body}
                    </p>
                  </div>

                  {/* Available Variables */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-3">TILGJENGELIGE VARIABLER:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { var: '{{company_name}}', desc: 'Bedriftsnavn' },
                        { var: '{{contact_name}}', desc: 'Kontaktperson' },
                        { var: '{{industry}}', desc: 'Bransje' },
                        { var: '{{sender_name}}', desc: 'Ditt navn' },
                        { var: '{{sender_company}}', desc: 'Din bedrift' },
                        { var: '{{sender_phone}}', desc: 'Ditt telefonnummer' },
                      ].map((item) => (
                        <div key={item.var} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <code className="text-xs text-purple-600 font-mono">{item.var}</code>
                          <span className="text-xs text-gray-500">→ {item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        usePrebuiltTemplate(previewTemplate);
                        setPreviewTemplate(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Bruk denne malen
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                      Lukk
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {previewTemplate && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setPreviewTemplate(null)} />}

          {/* My Templates Tab */}
          <TabsContent value="my-templates">
            {/* Create Form */}
            {showCreateForm && (
              <Card className="mb-6 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-xl">Opprett ny mal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                        Malnavn *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="F.eks. Kald kontakt - Introduksjon"
                        className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                          E-postemne *
                        </Label>
                        <VariableInserter onInsert={insertVariableInSubject} />
                      </div>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Samarbeidsmulighet med {{company_name}}"
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {formData.subject && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">Forhåndsvisning:</p>
                          <p className="text-sm text-gray-800">{replaceVariables(formData.subject)}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label htmlFor="body" className="text-sm font-semibold text-gray-700">
                          E-postinnhold *
                        </Label>
                        <VariableInserter onInsert={insertVariableInBody} />
                      </div>
                      <Textarea
                        id="body"
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        placeholder="Hei {{contact_name}},&#10;&#10;Jeg la merke til at {{company_name}} gjør flott arbeid..."
                        rows={12}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                      />
                      {formData.body && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">Forhåndsvisning:</p>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">{replaceVariables(formData.body)}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleCreate} 
                        disabled={createMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {createMutation.isPending ? "Oppretter..." : "Opprett mal"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Avbryt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Templates Grid */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-xl">Mine maler</CardTitle>
                  </div>
                  {templates && templates.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {templates.length} mal{templates.length !== 1 ? 'er' : ''}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <TemplatesListSkeleton />
                ) : templates && templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="group p-6 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                      >
                        {/* Template Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                              <p className="text-xs text-gray-500">E-postmal</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Er du sikker på at du vil slette denne malen?")) {
                                deleteMutation.mutate({ id: template.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Subject Preview */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-blue-600 font-semibold">EMNE</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 hover:bg-blue-100"
                              onClick={() => copyToClipboard(template.subject)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">{template.subject}</p>
                        </div>

                        {/* Body Preview */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-600 font-semibold">INNHOLD</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 hover:bg-gray-200"
                              onClick={() => copyToClipboard(template.body)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                            {template.body}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Forhåndsvis
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                            onClick={() => {
                              setFormData({
                                name: template.name,
                                subject: template.subject,
                                body: template.body,
                              });
                              setShowCreateForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Rediger
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen maler ennå</h3>
                    <p className="text-sm text-gray-500 mb-6">Opprett din første e-postmal eller bruk en ferdiglagd mal</p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => setShowCreateForm(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Opprett ny mal
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setActiveTab("prebuilt")}
                      >
                        <BookTemplate className="w-4 h-4 mr-2" />
                        Se ferdiglagde maler
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prebuilt Templates Tab */}
          <TabsContent value="prebuilt">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookTemplate className="w-5 h-5 text-purple-600" />
                      <CardTitle className="text-xl">Ferdiglagde maler</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {prebuiltTemplates.length} maler
                    </Badge>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Søk i maler..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {templateCategories.slice(0, 6).map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className={selectedCategory === category.id ? "bg-purple-600 hover:bg-purple-700" : ""}
                        >
                          {category.nameNo}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredPrebuiltTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrebuiltTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="group p-5 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30"
                      >
                        {/* Template Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-gray-900">{template.nameNo}</h3>
                              <Badge variant="outline" className="text-xs mt-1">
                                {template.categoryNo}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3">
                          {template.descriptionNo}
                        </p>

                        {/* Subject Preview */}
                        <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                          <p className="text-xs text-purple-600 font-semibold mb-1">EMNE</p>
                          <p className="text-sm text-gray-700 truncate">{template.subject}</p>
                        </div>

                        {/* Body Preview */}
                        <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 font-semibold mb-1">INNHOLD</p>
                          <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">
                            {template.body}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Se
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            onClick={() => usePrebuiltTemplate(template)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Bruk
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Search className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen maler funnet</h3>
                    <p className="text-sm text-gray-500 mb-4">Prøv et annet søk eller velg en annen kategori</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      Nullstill filter
                    </Button>
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

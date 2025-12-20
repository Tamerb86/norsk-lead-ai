import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, FileText, Plus, Edit, Trash2, Mail, Sparkles, Eye, Copy } from "lucide-react";
import { TemplatesListSkeleton } from "@/components/SkeletonLoaders";
import { Link } from "wouter";
import { toast } from "sonner";
import { toastSuccess, toastError, toastDeleteWithUndo } from "@/lib/toast-utils";
import { VariableInserter } from "@/components/VariableInserter";
import { replaceVariables } from "@/lib/template-variables";

export default function Templates() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
  });
  const [subjectCursorPos, setSubjectCursorPos] = useState(0);
  const [bodyCursorPos, setBodyCursorPos] = useState(0);
  const subjectInputRef = useState<HTMLInputElement | null>(null)[0];
  const bodyTextareaRef = useState<HTMLTextAreaElement | null>(null)[0];

  const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery();
  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toastSuccess("Template opprettet!", {
        description: "Malen er klar til bruk i kampanjer"
      });
      setShowCreateForm(false);
      setFormData({ name: "", subject: "", body: "" });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke opprette template", {
        description: error.message
      });
    },
  });

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Template slettet", {
        description: "Malen er fjernet fra listen"
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke slette template", {
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    NorskLeads
                  </h1>
                  <p className="text-sm text-gray-600">Email Templates</p>
                </div>
              </div>
            </Link>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-xl">Create New Template</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Template Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Cold Outreach Template"
                    className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                      Email Subject *
                    </Label>
                    <VariableInserter onInsert={insertVariableInSubject} />
                  </div>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Partnership Opportunity with {{company_name}}"
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
                      Email Body *
                    </Label>
                    <VariableInserter onInsert={insertVariableInBody} />
                  </div>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Hi {{contact_name}},&#10;&#10;I noticed {{company_name}} is doing great work in..."
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
                    {createMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Modal */}
        {previewTemplate && (
          <Card className="mb-6 border-0 shadow-2xl bg-white">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-xl">Template Preview</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-2">SUBJECT:</p>
                  <p className="text-base font-semibold text-gray-900">{previewTemplate.subject}</p>
                </div>
                <div className="p-6 bg-white rounded-lg border-2 border-gray-200 shadow-inner">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {previewTemplate.body}
                  </p>
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
                <CardTitle className="text-xl">Your Templates</CardTitle>
              </div>
              {templates && templates.length > 0 && (
                <span className="text-sm text-gray-500">
                  {templates.length} template{templates.length !== 1 ? 's' : ''}
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
                          <p className="text-xs text-gray-500">Email Template</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this template?")) {
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
                        <p className="text-xs text-blue-600 font-semibold">SUBJECT</p>
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
                        <p className="text-xs text-gray-600 font-semibold">BODY</p>
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
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                        onClick={() => {
                          toast.info("Edit feature coming soon!");
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
                <p className="text-sm text-gray-500 mb-6">Create your first email template to streamline your outreach</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

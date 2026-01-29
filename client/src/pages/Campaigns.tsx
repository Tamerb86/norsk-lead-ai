import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Mail, Plus, Trash2, Send, Eye, Clock, CheckCircle2, Sparkles, Users, X, Settings, Shield, User, LogOut, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CampaignsListSkeleton } from "@/components/SkeletonLoaders";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { toastSuccess, toastError, toastDeleteWithUndo, toastWithViewDetails } from "@/lib/toast-utils";
import { AIEmailWriter } from "@/components/AIEmailWriter";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";

export default function Campaigns() {
  const { user } = useAuth();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const newCampaignParam = urlParams.get('newCampaign');
  const companyIdsParam = urlParams.get('companyIds');
  const companyIdParam = urlParams.get('companyId');
  
  const [showCreateForm, setShowCreateForm] = useState(newCampaignParam === 'true');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>(() => {
    if (companyIdsParam) {
      return companyIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    }
    if (companyIdParam) {
      const id = parseInt(companyIdParam);
      return isNaN(id) ? [] : [id];
    }
    return [];
  });
  const [formData, setFormData] = useState({
    name: "",
    emailSubject: "",
    emailBody: "",
    senderName: "",
    senderEmail: "",
    scheduledFor: "",
    isDraft: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'drafts'>('all');
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);

  const handleAIEmailGenerated = (subject: string, body: string) => {
    setFormData({
      ...formData,
      emailSubject: subject,
      emailBody: body,
    });
    toast.success("AI-generert innhold lagt til i skjemaet!");
  };

  const renderPreviewEmail = () => {
    return formData.emailBody
      .replace(/{{company_name}}/g, "Example Company AS")
      .replace(/{{contact_name}}/g, "John Doe");
  };

  const { data: campaigns, isLoading, refetch } = trpc.campaigns.list.useQuery();
  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: (data) => {
      toastWithViewDetails(
        "Kampanje opprettet!",
        () => window.location.href = `/campaigns/${data.id}`,
        {
          description: "Kampanjen er klar til å sendes"
        }
      );
      setShowCreateForm(false);
      setFormData({
        name: "",
        emailSubject: "",
        emailBody: "",
        senderName: "",
        senderEmail: "",
        scheduledFor: "",
        isDraft: false,
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke opprette kampanje", {
        description: error.message
      });
    },
  });

  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Kampanje slettet", {
        description: "Kampanjen er fjernet fra listen"
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke slette kampanje", {
        description: error.message
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name) {
      toastError("Kampanjenavn er påkrevd", {
        description: "Skriv inn et navn for kampanjen"
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditDraft = (campaign: any) => {
    setFormData({
      name: campaign.name || "",
      emailSubject: campaign.emailSubject || "",
      emailBody: campaign.emailBody || "",
      senderName: campaign.senderName || "",
      senderEmail: campaign.senderEmail || "",
      scheduledFor: campaign.scheduledFor || "",
      isDraft: true,
    });
    setEditingCampaignId(campaign.id);
    setShowCreateForm(true);
  };

  const filteredCampaigns = campaigns?.filter(c => 
    filterTab === 'all' ? true : c.status === 'draft'
  );

  const draftCount = campaigns?.filter(c => c.status === 'draft').length || 0;

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Send className="w-3 h-3" />;
      case 'draft':
        return <Clock className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle2 className="w-3 h-3" />;
      default:
        return <Mail className="w-3 h-3" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <PageHelp title="Kampanjer" description={PAGE_DESCRIPTIONS.campaigns} />
            <p className="text-gray-600">Administrer dine e-postkampanjer</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            data-onboarding="new-campaign"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ny kampanje
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-xl">Create New Campaign</CardTitle>
                </div>
                {selectedCompanyIds.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
                    <Users className="w-4 h-4" />
                    <span>{selectedCompanyIds.length} bedrift{selectedCompanyIds.length !== 1 ? 'er' : ''} valgt</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Campaign Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Q1 2024 Outreach"
                    className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="senderName" className="text-sm font-semibold text-gray-700">
                      Sender Name
                    </Label>
                    <Input
                      id="senderName"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                      placeholder="Your Name"
                      className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="senderEmail" className="text-sm font-semibold text-gray-700">
                      Sender Email
                    </Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      value={formData.senderEmail}
                      onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                      placeholder="you@company.com"
                      className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* AI Email Writer */}
                <div className="my-6">
                  <AIEmailWriter
                    onEmailGenerated={handleAIEmailGenerated}
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                    Email Subject
                  </Label>
                  <Input
                    id="subject"
                    value={formData.emailSubject}
                    onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                    placeholder="Partnership Opportunity"
                    className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="body" className="text-sm font-semibold text-gray-700">
                    Email Body
                  </Label>
                  <Textarea
                    id="body"
                    value={formData.emailBody}
                    onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                    placeholder="Hi {{company_name}},&#10;&#10;I wanted to reach out..."
                    rows={10}
                    className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                  />
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">Available Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      <code className="px-2 py-1 bg-white rounded text-xs text-blue-600 border border-blue-200">{`{{company_name}}`}</code>
                      <code className="px-2 py-1 bg-white rounded text-xs text-blue-600 border border-blue-200">{`{{contact_name}}`}</code>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduledFor" className="text-sm font-semibold text-gray-700">
                    Schedule for later (optional)
                  </Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    className="mt-1.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={() => setShowPreview(true)} 
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={() => {
                      setFormData({ ...formData, isDraft: true });
                      handleCreate();
                    }} 
                    disabled={createMutation.isPending}
                    variant="outline"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button 
                    onClick={() => {
                      setFormData({ ...formData, isDraft: false });
                      handleCreate();
                    }} 
                    disabled={createMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {createMutation.isPending ? "Creating..." : "Create & Send"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-xl">Your Campaigns</CardTitle>
              </div>
              {campaigns && campaigns.length > 0 && (
                <span className="text-sm text-gray-500">
                  {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Button
                variant={filterTab === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTab('all')}
                className={filterTab === 'all' ? 'bg-blue-600' : ''}
              >
                All Campaigns
              </Button>
              <Button
                variant={filterTab === 'drafts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTab('drafts')}
                className={filterTab === 'drafts' ? 'bg-blue-600' : ''}
              >
                Drafts
                {draftCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {draftCount}
                  </span>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <CampaignsListSkeleton />
            ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="group p-6 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </span>
                        </div>
                        
                        {campaign.emailSubject && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-600 font-medium mb-1">Subject:</p>
                            <p className="text-sm text-gray-700">{campaign.emailSubject}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Recipients</p>
                              <p className="text-lg font-bold text-gray-900">{campaign.totalRecipients || 0}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <Send className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Sent</p>
                              <p className="text-lg font-bold text-gray-900">{campaign.totalSent || 0}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Eye className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Opened</p>
                              <p className="text-lg font-bold text-gray-900">{campaign.totalOpened || 0}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Open Rate</p>
                              <p className="text-lg font-bold text-gray-900">
                                {campaign.totalSent ? ((campaign.totalOpened || 0) / campaign.totalSent * 100).toFixed(1) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {campaign.status === 'draft' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                            onClick={() => handleEditDraft(campaign)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Edit Draft
                          </Button>
                        )}
                        {campaign.status !== 'draft' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this campaign?")) {
                              deleteMutation.mutate({ id: campaign.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-sm text-gray-500 mb-6">Create your first campaign to start reaching out to Norwegian companies</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      {/* Email Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Email Preview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-4 pb-4 border-b border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">From:</span>
                  <span className="text-sm text-gray-900">{formData.senderName || "Your Name"} &lt;{formData.senderEmail || "your@email.com"}&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Subject:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.emailSubject || "(No subject)"}</span>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700">
                  {renderPreviewEmail() || "(No content)"}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}

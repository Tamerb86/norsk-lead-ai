import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Key, 
  Plus, 
  Trash2, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  Zap,
  Globe,
  Mail,
  Database,
  RefreshCw,
  AlertCircle,
  Brain,
  Search,
  Building2,
  Sparkles
} from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast-utils";

// Service categories
const SERVICE_CATEGORIES = {
  ai: {
    title: "AI-modeller",
    description: "Tjenester for tekstgenerering og AI-funksjoner",
    icon: Brain,
    color: "from-purple-500 to-indigo-500",
    providers: ["openai", "anthropic", "google", "azure"]
  },
  email: {
    title: "E-posttjenester",
    description: "Finn og verifiser e-postadresser",
    icon: Mail,
    color: "from-orange-500 to-red-500",
    providers: ["hunter"]
  },
  enrichment: {
    title: "Databerikelse",
    description: "Berik bedrifts- og kontaktdata",
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    providers: ["clearbit", "apollo"]
  }
};

// Provider details
const PROVIDERS = {
  openai: { 
    name: "OpenAI", 
    icon: Bot, 
    color: "bg-green-500",
    category: "ai",
    description: "GPT-4, GPT-3.5 og andre modeller",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
  },
  anthropic: { 
    name: "Anthropic", 
    icon: Bot, 
    color: "bg-purple-500",
    category: "ai",
    description: "Claude 3 modeller",
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
  },
  google: { 
    name: "Google AI", 
    icon: Bot, 
    color: "bg-blue-500",
    category: "ai",
    description: "Gemini Pro modeller",
    models: ["gemini-pro", "gemini-pro-vision"]
  },
  azure: { 
    name: "Azure OpenAI", 
    icon: Bot, 
    color: "bg-cyan-500",
    category: "ai",
    description: "Microsoft Azure-hostet OpenAI",
    models: ["gpt-4", "gpt-35-turbo"]
  },
  hunter: { 
    name: "Hunter.io", 
    icon: Mail, 
    color: "bg-orange-500",
    category: "email",
    description: "Finn e-postadresser fra domener",
    models: []
  },
  clearbit: { 
    name: "Clearbit", 
    icon: Database, 
    color: "bg-indigo-500",
    category: "enrichment",
    description: "Berik bedriftsdata automatisk",
    models: []
  },
  apollo: { 
    name: "Apollo.io", 
    icon: Globe, 
    color: "bg-pink-500",
    category: "enrichment",
    description: "Finn kontakter og leads",
    models: []
  },
};

export function AISettingsTab() {
  const [activeCategory, setActiveCategory] = useState<string>("ai");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addCategory, setAddCategory] = useState<string | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});

  // Fetch integrations
  const { data: integrations, isLoading, refetch } = trpc.aiSettings.getIntegrations.useQuery();

  // Mutations
  const createMutation = trpc.aiSettings.createIntegration.useMutation({
    onSuccess: () => {
      toastSuccess("Integrasjon opprettet", { description: "Integrasjonen ble lagt til." });
      setShowAddDialog(false);
      setAddCategory(null);
      refetch();
    },
    onError: (error) => {
      toastError("Feil", { description: error.message });
    },
  });

  const updateMutation = trpc.aiSettings.updateIntegration.useMutation({
    onSuccess: () => {
      toastSuccess("Integrasjon oppdatert", { description: "Endringene ble lagret." });
      setEditingIntegration(null);
      refetch();
    },
    onError: (error) => {
      toastError("Feil", { description: error.message });
    },
  });

  const deleteMutation = trpc.aiSettings.deleteIntegration.useMutation({
    onSuccess: () => {
      toastSuccess("Integrasjon slettet", { description: "Integrasjonen ble fjernet." });
      refetch();
    },
    onError: (error) => {
      toastError("Feil", { description: error.message });
    },
  });

  const testMutation = trpc.aiSettings.testIntegration.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toastSuccess("Tilkobling vellykket", { description: result.message });
      } else {
        toastError("Tilkobling mislyktes", { description: result.message });
      }
    },
    onError: (error) => {
      toastError("Feil", { description: error.message });
    },
  });

  const toggleApiKeyVisibility = (id: number) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskApiKey = (key: string | null) => {
    if (!key) return "Ikke konfigurert";
    if (key.length <= 8) return "••••••••";
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
  };

  const getIntegrationsByCategory = (category: string) => {
    const categoryProviders = SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]?.providers || [];
    return integrations?.filter((i: any) => categoryProviders.includes(i.provider)) || [];
  };

  const openAddDialog = (category: string) => {
    setAddCategory(category);
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Integrasjoner
        </h2>
        <p className="text-gray-500 mt-1">
          Administrer API-nøkler og innstillinger for eksterne tjenester
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {Object.entries(SERVICE_CATEGORIES).map(([key, cat]) => {
            const Icon = cat.icon;
            const count = getIntegrationsByCategory(key).length;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.title}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="government" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Offentlige API</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Models Tab */}
        <TabsContent value="ai" className="space-y-4">
          <CategorySection
            category="ai"
            integrations={getIntegrationsByCategory("ai")}
            onAdd={() => openAddDialog("ai")}
            onEdit={setEditingIntegration}
            onDelete={(id) => deleteMutation.mutate({ id })}
            onTest={(id) => testMutation.mutate({ id })}
            showApiKey={showApiKey}
            toggleApiKeyVisibility={toggleApiKeyVisibility}
            maskApiKey={maskApiKey}
            testLoading={testMutation.isPending}
          />
        </TabsContent>

        {/* Email Services Tab */}
        <TabsContent value="email" className="space-y-4">
          <CategorySection
            category="email"
            integrations={getIntegrationsByCategory("email")}
            onAdd={() => openAddDialog("email")}
            onEdit={setEditingIntegration}
            onDelete={(id) => deleteMutation.mutate({ id })}
            onTest={(id) => testMutation.mutate({ id })}
            showApiKey={showApiKey}
            toggleApiKeyVisibility={toggleApiKeyVisibility}
            maskApiKey={maskApiKey}
            testLoading={testMutation.isPending}
          />
        </TabsContent>

        {/* Data Enrichment Tab */}
        <TabsContent value="enrichment" className="space-y-4">
          <CategorySection
            category="enrichment"
            integrations={getIntegrationsByCategory("enrichment")}
            onAdd={() => openAddDialog("enrichment")}
            onEdit={setEditingIntegration}
            onDelete={(id) => deleteMutation.mutate({ id })}
            onTest={(id) => testMutation.mutate({ id })}
            showApiKey={showApiKey}
            toggleApiKeyVisibility={toggleApiKeyVisibility}
            maskApiKey={maskApiKey}
            testLoading={testMutation.isPending}
          />
        </TabsContent>

        {/* Government APIs Tab */}
        <TabsContent value="government" className="space-y-4">
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-600 to-slate-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Offentlige API-er</CardTitle>
                  <CardDescription>Gratis tilgang til norske offentlige registre</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <BrregSettingsCard />
        </TabsContent>
      </Tabs>

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) setAddCategory(null);
      }}>
        <DialogContent className="max-w-md">
          <AddIntegrationForm 
            category={addCategory}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            onCancel={() => {
              setShowAddDialog(false);
              setAddCategory(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Integration Dialog */}
      {editingIntegration && (
        <Dialog open={!!editingIntegration} onOpenChange={() => setEditingIntegration(null)}>
          <DialogContent className="max-w-md">
            <EditIntegrationForm
              integration={editingIntegration}
              onSubmit={(data) => updateMutation.mutate({ id: editingIntegration.id, ...data })}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingIntegration(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Category Section Component
function CategorySection({
  category,
  integrations,
  onAdd,
  onEdit,
  onDelete,
  onTest,
  showApiKey,
  toggleApiKeyVisibility,
  maskApiKey,
  testLoading
}: {
  category: string;
  integrations: any[];
  onAdd: () => void;
  onEdit: (integration: any) => void;
  onDelete: (id: number) => void;
  onTest: (id: number) => void;
  showApiKey: Record<number, boolean>;
  toggleApiKeyVisibility: (id: number) => void;
  maskApiKey: (key: string | null) => string;
  testLoading: boolean;
}) {
  const categoryInfo = SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES];
  const Icon = categoryInfo?.icon || Bot;
  const availableProviders = categoryInfo?.providers || [];

  return (
    <>
      {/* Category Header Card */}
      <Card className={`bg-gradient-to-r ${categoryInfo?.color || 'from-gray-500 to-gray-600'} text-white`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-white">{categoryInfo?.title}</CardTitle>
                <CardDescription className="text-white/80">{categoryInfo?.description}</CardDescription>
              </div>
            </div>
            <Button 
              onClick={onAdd}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Legg til
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Available Providers Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Tilgjengelige leverandører</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableProviders.map((providerId) => {
                  const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
                  const isConfigured = integrations.some((i: any) => i.provider === providerId);
                  return (
                    <Badge 
                      key={providerId} 
                      variant={isConfigured ? "default" : "outline"}
                      className={isConfigured ? "bg-green-100 text-green-800" : ""}
                    >
                      {provider?.name}
                      {isConfigured && <CheckCircle className="w-3 h-3 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations List */}
      {integrations.length > 0 ? (
        <div className="grid gap-4">
          {integrations.map((integration: any) => {
            const providerInfo = PROVIDERS[integration.provider as keyof typeof PROVIDERS] || {
              name: integration.provider,
              icon: Bot,
              color: "bg-gray-500"
            };
            const ProviderIcon = providerInfo.icon;

            return (
              <Card key={integration.id} className={`${!integration.isEnabled ? 'opacity-60' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${providerInfo.color} flex items-center justify-center`}>
                        <ProviderIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          {integration.isDefault && (
                            <Badge className="bg-green-100 text-green-800">Standard</Badge>
                          )}
                          {integration.isEnabled ? (
                            <Badge className="bg-blue-100 text-blue-800">Aktiv</Badge>
                          ) : (
                            <Badge variant="secondary">Deaktivert</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {providerInfo.name} {integration.model && `• ${integration.model}`}
                        </p>
                        
                        {/* API Key Display */}
                        <div className="flex items-center gap-2 mt-3">
                          <Key className="w-4 h-4 text-gray-400" />
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {showApiKey[integration.id] 
                              ? integration.apiKey || "Ikke konfigurert"
                              : maskApiKey(integration.apiKey)
                            }
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(integration.id)}
                          >
                            {showApiKey[integration.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTest(integration.id)}
                        disabled={testLoading}
                      >
                        {testLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Test</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(integration)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDelete(integration.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ingen integrasjoner</h3>
              <p className="text-gray-500 mb-4">
                Legg til din første {categoryInfo?.title.toLowerCase()} integrasjon
              </p>
              <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Legg til integrasjon
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Add Integration Form
function AddIntegrationForm({ 
  category,
  onSubmit, 
  isLoading, 
  onCancel 
}: { 
  category: string | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    provider: "",
    name: "",
    apiKey: "",
    apiEndpoint: "",
    model: "",
    isEnabled: true,
    isDefault: false,
  });

  const categoryInfo = category ? SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES] : null;
  const availableProviders = categoryInfo?.providers || Object.keys(PROVIDERS);
  const selectedProvider = PROVIDERS[formData.provider as keyof typeof PROVIDERS];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getCategoryTitle = () => {
    switch (category) {
      case "ai": return "AI-modell";
      case "email": return "E-posttjeneste";
      case "enrichment": return "Databerikelse";
      default: return "Integrasjon";
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Legg til {getCategoryTitle()}</DialogTitle>
        <DialogDescription>
          {categoryInfo?.description || "Konfigurer en ny tjeneste med API-nøkkel"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Leverandør</Label>
          <Select 
            value={formData.provider} 
            onValueChange={(v) => {
              const provider = PROVIDERS[v as keyof typeof PROVIDERS];
              setFormData({ 
                ...formData, 
                provider: v, 
                name: provider?.name || "",
                model: provider?.models?.[0] || ""
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg leverandør..." />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((providerId) => {
                const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
                if (!provider) return null;
                return (
                  <SelectItem key={providerId} value={providerId}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${provider.color}`} />
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedProvider?.description && (
            <p className="text-xs text-gray-500">{selectedProvider.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Navn</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="F.eks. OpenAI Production"
          />
        </div>

        <div className="space-y-2">
          <Label>API-nøkkel</Label>
          <Input
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </div>

        {selectedProvider?.models && selectedProvider.models.length > 0 && (
          <div className="space-y-2">
            <Label>Modell</Label>
            <Select 
              value={formData.model} 
              onValueChange={(v) => setFormData({ ...formData, model: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg modell..." />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider.models.map((m: string) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Egendefinert API-endepunkt (valgfritt)</Label>
          <Input
            value={formData.apiEndpoint}
            onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isEnabled}
              onCheckedChange={(v) => setFormData({ ...formData, isEnabled: v })}
            />
            <Label>Aktiver integrasjon</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
            />
            <Label>Sett som standard</Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit" disabled={isLoading || !formData.provider || !formData.name || !formData.apiKey}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Legg til
        </Button>
      </DialogFooter>
    </form>
  );
}

// Edit Integration Form
function EditIntegrationForm({ 
  integration,
  onSubmit, 
  isLoading, 
  onCancel 
}: { 
  integration: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: integration.name,
    apiKey: integration.apiKey || "",
    apiEndpoint: integration.apiEndpoint || "",
    model: integration.model || "",
    isEnabled: integration.isEnabled,
    isDefault: integration.isDefault,
  });

  const selectedProvider = PROVIDERS[integration.provider as keyof typeof PROVIDERS];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Rediger integrasjon</DialogTitle>
        <DialogDescription>
          Oppdater innstillingene for {integration.name}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className={`w-10 h-10 rounded-lg ${selectedProvider?.color || 'bg-gray-500'} flex items-center justify-center`}>
            {selectedProvider?.icon && <selectedProvider.icon className="w-5 h-5 text-white" />}
          </div>
          <div>
            <p className="font-medium">{selectedProvider?.name || integration.provider}</p>
            <p className="text-sm text-gray-500">{selectedProvider?.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Navn</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>API-nøkkel</Label>
          <Input
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="La stå tom for å beholde eksisterende"
          />
        </div>

        {selectedProvider?.models && selectedProvider.models.length > 0 && (
          <div className="space-y-2">
            <Label>Modell</Label>
            <Select 
              value={formData.model} 
              onValueChange={(v) => setFormData({ ...formData, model: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg modell..." />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider.models.map((m: string) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Egendefinert API-endepunkt (valgfritt)</Label>
          <Input
            value={formData.apiEndpoint}
            onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isEnabled}
              onCheckedChange={(v) => setFormData({ ...formData, isEnabled: v })}
            />
            <Label>Aktiver integrasjon</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
            />
            <Label>Sett som standard</Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Lagre endringer
        </Button>
      </DialogFooter>
    </form>
  );
}

// Brreg Settings Card Component
function BrregSettingsCard() {
  const [brregEnabled, setBrregEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState("1000");
  const [saving, setSaving] = useState(false);

  // Fetch current Brreg settings
  const { data: settings, refetch } = trpc.aiSettings.getSettings.useQuery(
    { category: "brreg" },
    {
      onSuccess: (data) => {
        const enabledSetting = data?.find((s: any) => s.key === "brreg_enabled");
        const limitSetting = data?.find((s: any) => s.key === "brreg_daily_limit");
        if (enabledSetting) setBrregEnabled(enabledSetting.value === "true");
        if (limitSetting) setDailyLimit(limitSetting.value);
      },
    }
  );

  const setSettingMutation = trpc.aiSettings.setSetting.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleToggle = async (enabled: boolean) => {
    setBrregEnabled(enabled);
    setSaving(true);
    try {
      await setSettingMutation.mutateAsync({
        key: "brreg_enabled",
        value: enabled.toString(),
        description: "Enable/disable Brreg API integration",
        category: "brreg",
        isSecret: false,
      });
      toastSuccess(
        enabled ? "Brreg aktivert" : "Brreg deaktivert",
        { description: enabled ? "Brreg-integrasjonen er nå aktiv" : "Brreg-integrasjonen er nå deaktivert" }
      );
    } catch (error) {
      toastError("Feil", { description: "Kunne ikke lagre innstillingen" });
      setBrregEnabled(!enabled);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimit = async () => {
    setSaving(true);
    try {
      await setSettingMutation.mutateAsync({
        key: "brreg_daily_limit",
        value: dailyLimit,
        description: "Daily request limit for Brreg API",
        category: "brreg",
        isSecret: false,
      });
      toastSuccess("Lagret", { description: "Daglig grense oppdatert" });
    } catch (error) {
      toastError("Feil", { description: "Kunne ikke lagre grensen" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Brønnøysundregistrene (Brreg)</CardTitle>
              <CardDescription>Offisiell norsk bedriftsregister - Gratis API</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {brregEnabled ? (
              <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
            ) : (
              <Badge variant="secondary">Deaktivert</Badge>
            )}
            <Switch
              checked={brregEnabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Daglig grense (forespørsler)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-32"
                disabled={!brregEnabled}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveLimit}
                disabled={saving || !brregEnabled}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lagre"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Status</Label>
            <div className="flex items-center gap-2">
              {brregEnabled ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700">Klar til bruk</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Deaktivert</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">API-nøkkel</span>
            <Badge variant="outline" className="bg-white">Ikke påkrevd (gratis)</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Brreg API er gratis og krever ingen autentisering. Du kan søke, hente og synkronisere bedriftsdata direkte.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AISettingsTab;

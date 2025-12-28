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
  AlertCircle
} from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast-utils";

// Provider icons and info
const PROVIDERS = {
  openai: { name: "OpenAI", icon: Bot, color: "bg-green-500" },
  anthropic: { name: "Anthropic", icon: Bot, color: "bg-purple-500" },
  google: { name: "Google AI", icon: Bot, color: "bg-blue-500" },
  azure: { name: "Azure OpenAI", icon: Bot, color: "bg-cyan-500" },
  hunter: { name: "Hunter.io", icon: Mail, color: "bg-orange-500" },
  clearbit: { name: "Clearbit", icon: Database, color: "bg-indigo-500" },
  apollo: { name: "Apollo.io", icon: Globe, color: "bg-pink-500" },
};

export function AISettingsTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});

  // Fetch integrations
  const { data: integrations, isLoading, refetch } = trpc.aiSettings.getIntegrations.useQuery();
  const { data: providers } = trpc.aiSettings.getProviders.useQuery();

  // Mutations
  const createMutation = trpc.aiSettings.createIntegration.useMutation({
    onSuccess: () => {
      toastSuccess("Integrasjon opprettet", { description: "AI-integrasjonen ble lagt til." });
      setShowAddDialog(false);
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
      toastSuccess("Integrasjon slettet", { description: "AI-integrasjonen ble fjernet." });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            AI-integrasjoner
          </h2>
          <p className="text-gray-500 mt-1">
            Administrer API-nøkler og innstillinger for AI-tjenester
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="w-4 h-4" />
              Legg til integrasjon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <AddIntegrationForm 
              providers={providers || []}
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Slik fungerer det</h4>
              <p className="text-sm text-blue-700 mt-1">
                Legg til API-nøkler for å aktivere AI-funksjoner som e-postgenerering, 
                lead-berikelse og e-postverifisering. Standard-integrasjonen brukes automatisk.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brreg Settings Card */}
      <BrregSettingsCard />

      {/* Integrations List */}
      <div className="grid gap-4">
        {integrations && integrations.length > 0 ? (
          integrations.map((integration: any) => {
            const providerInfo = PROVIDERS[integration.provider as keyof typeof PROVIDERS] || {
              name: integration.provider,
              icon: Bot,
              color: "bg-gray-500"
            };
            const Icon = providerInfo.icon;

            return (
              <Card key={integration.id} className={`${!integration.isEnabled ? 'opacity-60' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${providerInfo.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
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
                          {providerInfo.name} • {integration.model || "Ingen modell valgt"}
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

                        {/* Usage Stats */}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>Brukt: {integration.usageCount} ganger</span>
                          {integration.lastUsedAt && (
                            <span>
                              Sist brukt: {new Date(integration.lastUsedAt).toLocaleDateString('nb-NO')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate({ id: integration.id })}
                        disabled={testMutation.isPending}
                      >
                        {testMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingIntegration(integration)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Er du sikker på at du vil slette denne integrasjonen?")) {
                            deleteMutation.mutate({ id: integration.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900">Ingen integrasjoner</h3>
              <p className="text-gray-500 mt-1">
                Legg til din første AI-integrasjon for å komme i gang
              </p>
              <Button 
                className="mt-4 gap-2"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4" />
                Legg til integrasjon
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {editingIntegration && (
        <Dialog open={!!editingIntegration} onOpenChange={() => setEditingIntegration(null)}>
          <DialogContent className="max-w-md">
            <EditIntegrationForm
              integration={editingIntegration}
              providers={providers || []}
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

// Add Integration Form
function AddIntegrationForm({ 
  providers, 
  onSubmit, 
  isLoading, 
  onCancel 
}: { 
  providers: any[];
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

  const selectedProvider = providers.find(p => p.id === formData.provider);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Legg til AI-integrasjon</DialogTitle>
        <DialogDescription>
          Konfigurer en ny AI-tjeneste med API-nøkkel
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Leverandør</Label>
          <Select 
            value={formData.provider} 
            onValueChange={(v) => setFormData({ ...formData, provider: v, name: providers.find(p => p.id === v)?.name || "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg leverandør..." />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {p.description && <span className="text-gray-500 ml-2">- {p.description}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {selectedProvider?.models?.length > 0 && (
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
        <Button type="submit" disabled={isLoading || !formData.provider || !formData.name}>
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
  providers, 
  onSubmit, 
  isLoading, 
  onCancel 
}: { 
  integration: any;
  providers: any[];
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

  const selectedProvider = providers.find(p => p.id === integration.provider);

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

        {selectedProvider?.models?.length > 0 && (
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
          <Label>Egendefinert API-endepunkt</Label>
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
        { description: enabled ? "Brreg-integrasjonen er n\u00e5 aktiv" : "Brreg-integrasjonen er n\u00e5 deaktivert" }
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
              <CardTitle className="text-lg">Br\u00f8nn\u00f8ysundregistrene (Brreg)</CardTitle>
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
            <Label className="text-sm text-gray-600">Daglig grense (foresp\u00f8rsler)</Label>
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
            <span className="text-gray-600">API-n\u00f8kkel</span>
            <Badge variant="outline" className="bg-white">Ikke p\u00e5krevd (gratis)</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Brreg API er gratis og krever ingen autentisering. Du kan s\u00f8ke, hente og synkronisere bedriftsdata direkte.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AISettingsTab;

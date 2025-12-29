import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Shield,
  Check,
  CreditCard,
  Crown,
  Zap,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Download,
  FileText,
  Settings,
  Bell,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPrice, getPlanById } from "@shared/products";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";

interface UserSubscription {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface UsageStats {
  companiesUsed: number;
  companiesLimit: number;
  emailsSent: number;
  emailsLimit: number;
  campaignsActive: number;
  campaignsLimit: number;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  pdfUrl?: string;
}

export default function Account() {
  const { user, loading: authLoading, updateProfile, changePassword } = useAuth({ redirectOnUnauthenticated: true });
  
  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Subscription state
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  
  // Dialogs
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);

  // Fetch subscription data
  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
      fetch2FAStatus();
      setName(user.name || "");
    }
  }, [user]);
  
  const fetch2FAStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa/status", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.enabled);
        setBackupCodesRemaining(data.backupCodesRemaining);
      }
    } catch (error) {
      console.error("Failed to fetch 2FA status:", error);
    }
  };

  const fetchSubscriptionData = async () => {
    setSubscriptionLoading(true);
    try {
      // Fetch subscription info
      const subRes = await fetch("/api/stripe/subscription", { credentials: "include" });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      // Fetch usage stats
      const usageRes = await fetch("/api/user/usage", { credentials: "include" });
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }

      // Fetch invoices
      const invoicesRes = await fetch("/api/stripe/invoices", { credentials: "include" });
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    const result = await updateProfile({ name });
    
    setProfileLoading(false);
    if (result.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(result.error || "Kunne ikke oppdatere profil");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vennligst fyll ut alle feltene");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passordene samsvarer ikke");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Nytt passord må være minst 8 tegn");
      return;
    }

    setPasswordLoading(true);
    const result = await changePassword({ currentPassword, newPassword });
    
    setPasswordLoading(false);
    if (result.success) {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(result.error || "Kunne ikke endre passord");
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error("Failed to create portal session:", err);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setCancelDialog(false);
        fetchSubscriptionData();
      }
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
    } finally {
      setCancelLoading(false);
    }
  };

  const currentPlan = getPlanById(subscription?.plan || "free") || SUBSCRIPTION_PLANS[0];
  const isFreePlan = currentPlan.isFree;

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Kontoinnstillinger
          </h1>
          <p className="text-gray-600">Administrer din konto, abonnement og fakturering</p>
        </div>

        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="subscription" className="data-[state=active]:bg-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Abonnement
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Forbruk
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white">
              <Lock className="h-4 w-4 mr-2" />
              Sikkerhet
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-white">
              <FileText className="h-4 w-4 mr-2" />
              Fakturering
            </TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan Card */}
            <Card className={`border-2 ${isFreePlan ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isFreePlan ? 'bg-gray-100' : 'bg-blue-100'}`}>
                      {isFreePlan ? (
                        <Zap className="h-6 w-6 text-gray-600" />
                      ) : currentPlan.id === 'pro' ? (
                        <Crown className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Crown className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {currentPlan.name} Plan
                        {subscription?.status === 'active' && (
                          <Badge className="ml-2 bg-green-100 text-green-700">Aktiv</Badge>
                        )}
                        {subscription?.status === 'canceled' && (
                          <Badge className="ml-2 bg-yellow-100 text-yellow-700">Kansellert</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {formatPrice(currentPlan.priceMonthly)} per måned
                      </CardDescription>
                    </div>
                  </div>
                  {!isFreePlan && (
                    <Button variant="outline" onClick={handleManageBilling}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Administrer fakturering
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-500">Bedrifter/mnd</p>
                    <p className="text-lg font-semibold">
                      {currentPlan.limits.companiesPerMonth === -1 ? 'Ubegrenset' : currentPlan.limits.companiesPerMonth.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-500">E-poster/mnd</p>
                    <p className="text-lg font-semibold">
                      {currentPlan.limits.emailsPerMonth.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-500">Kampanjer</p>
                    <p className="text-lg font-semibold">
                      {currentPlan.limits.campaignsPerMonth === -1 ? 'Ubegrenset' : currentPlan.limits.campaignsPerMonth}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-500">Maler</p>
                    <p className="text-lg font-semibold">
                      {currentPlan.limits.templates === -1 ? 'Ubegrenset' : currentPlan.limits.templates}
                    </p>
                  </div>
                </div>

                {subscription?.currentPeriodEnd && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {subscription.status === 'canceled' ? 'Tilgang utløper: ' : 'Neste fakturering: '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('nb-NO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
              {!isFreePlan && subscription?.status === 'active' && (
                <CardFooter className="border-t bg-gray-50/50">
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setCancelDialog(true)}
                  >
                    Kanseller abonnement
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Upgrade Options */}
            {(isFreePlan || currentPlan.id === 'basic') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Oppgrader abonnementet ditt
                  </CardTitle>
                  <CardDescription>
                    Få tilgang til flere funksjoner og høyere grenser
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {SUBSCRIPTION_PLANS.filter(p => !p.isFree && p.id !== currentPlan.id).map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative rounded-xl border-2 p-5 ${
                          plan.popular ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200'
                        }`}
                      >
                        {plan.popular && (
                          <Badge className="absolute -top-2 right-4 bg-purple-600">
                            Mest populær
                          </Badge>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${plan.id === 'pro' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                            <Crown className={`h-5 w-5 ${plan.id === 'pro' ? 'text-purple-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{plan.name}</h4>
                            <p className="text-2xl font-bold">
                              {formatPrice(plan.priceMonthly)}
                              <span className="text-sm font-normal text-gray-500">/mnd</span>
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-2 mb-4">
                          {plan.features.slice(0, 5).map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full ${plan.id === 'pro' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          Oppgrader til {plan.name}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Månedlig forbruk</CardTitle>
                <CardDescription>
                  Oversikt over ditt forbruk denne måneden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Companies Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Bedrifter hentet</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usage?.companiesUsed || 0} / {currentPlan.limits.companiesPerMonth === -1 ? '∞' : currentPlan.limits.companiesPerMonth}
                    </span>
                  </div>
                  <Progress 
                    value={currentPlan.limits.companiesPerMonth === -1 ? 0 : ((usage?.companiesUsed || 0) / currentPlan.limits.companiesPerMonth) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Emails Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span className="font-medium">E-poster sendt</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usage?.emailsSent || 0} / {currentPlan.limits.emailsPerMonth.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={((usage?.emailsSent || 0) / currentPlan.limits.emailsPerMonth) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Campaigns Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Aktive kampanjer</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usage?.campaignsActive || 0} / {currentPlan.limits.campaignsPerMonth === -1 ? '∞' : currentPlan.limits.campaignsPerMonth}
                    </span>
                  </div>
                  <Progress 
                    value={currentPlan.limits.campaignsPerMonth === -1 ? 0 : ((usage?.campaignsActive || 0) / currentPlan.limits.campaignsPerMonth) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Forbruket nullstilles den 1. hver måned
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Profilinformasjon
                </CardTitle>
                <CardDescription>
                  Oppdater din personlige informasjon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                  {profileError && (
                    <Alert variant="destructive">
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {profileSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        Profilen ble oppdatert
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Navn</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-post</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        className="pl-10 bg-gray-50"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-gray-500">E-post kan ikke endres</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Rolle</Label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-md">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="capitalize">{user?.role || "viewer"}</span>
                    </div>
                  </div>

                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Lagrer...
                      </>
                    ) : (
                      "Lagre endringer"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Endre passord
                </CardTitle>
                <CardDescription>
                  Oppdater passordet ditt for å holde kontoen sikker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {passwordSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        Passordet ble endret
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Nåværende passord</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={passwordLoading}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nytt passord</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Minst 8 tegn"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Bekreft nytt passord</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordLoading}
                    />
                  </div>

                  <Button type="submit" variant="outline" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Endrer passord...
                      </>
                    ) : (
                      "Endre passord"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <TwoFactorSettings
              enabled={twoFactorEnabled}
              backupCodesRemaining={backupCodesRemaining}
              onRefresh={fetch2FAStatus}
            />

            {/* Delete Account */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Slett konto
                </CardTitle>
                <CardDescription>
                  Permanent sletting av din konto og alle data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Når du sletter kontoen din, vil alle dine data bli permanent slettet. 
                  Dette inkluderer kampanjer, leads, maler og all annen informasjon.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteAccountDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett min konto
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fakturahistorikk</CardTitle>
                    <CardDescription>
                      Oversikt over dine tidligere fakturaer
                    </CardDescription>
                  </div>
                  {!isFreePlan && (
                    <Button variant="outline" onClick={handleManageBilling}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Stripe kundeportal
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Ingen fakturaer ennå</p>
                    {isFreePlan && (
                      <p className="text-sm mt-1">Oppgrader til et betalt abonnement for å se fakturaer</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {new Date(invoice.date).toLocaleDateString('nb-NO', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(invoice.amount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                            className={invoice.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                          >
                            {invoice.status === 'paid' ? 'Betalt' : 'Venter'}
                          </Badge>
                          {invoice.pdfUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            {!isFreePlan && subscription?.stripeCustomerId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Betalingsmetode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Administrer betalingsmetoder og faktureringsinformasjon via Stripe kundeportal.
                  </p>
                  <Button variant="outline" onClick={handleManageBilling}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Administrer betalingsmetode
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Cancel Subscription Dialog */}
        <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Kanseller abonnement
              </DialogTitle>
              <DialogDescription>
                Er du sikker på at du vil kansellere abonnementet ditt?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Merk:</strong> Du vil fortsatt ha tilgang til alle funksjoner frem til slutten av din nåværende faktureringsperiode.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialog(false)}>
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kansellerer...
                  </>
                ) : (
                  "Ja, kanseller abonnement"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={deleteAccountDialog} onOpenChange={setDeleteAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Slett konto permanent
              </DialogTitle>
              <DialogDescription>
                Denne handlingen kan ikke angres. All din data vil bli permanent slettet.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Advarsel:</strong> Dette vil slette:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Alle dine kampanjer og sekvenser</li>
                  <li>• Alle lagrede leads og bedrifter</li>
                  <li>• Alle e-postmaler</li>
                  <li>• All analyse- og sporingsdata</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteAccountDialog(false)}>
                Avbryt
              </Button>
              <Button variant="destructive">
                Ja, slett min konto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

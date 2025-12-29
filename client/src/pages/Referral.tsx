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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users,
  Gift,
  Share2,
  Copy,
  Check,
  Mail,
  Trophy,
  TrendingUp,
  Sparkles,
  UserPlus,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ReferralStats {
  id: number;
  user_id: number;
  referral_code: string;
  total_invites: number;
  total_signups: number;
  total_conversions: number;
  total_rewards_earned: number;
  pending_rewards: number;
}

interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number | null;
  referral_code: string;
  referred_email: string | null;
  status: string;
  reward_type: string | null;
  reward_amount: number | null;
  reward_claimed: boolean;
  signed_up_at: string | null;
  converted_at: string | null;
  rewarded_at: string | null;
  createdAt: string;
  referred_name?: string;
  referred_user_email?: string;
}

export default function Referral() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  
  // Fetch referral stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.referral.getMyStats.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Fetch referrals list
  const { data: referrals, isLoading: referralsLoading, refetch: refetchReferrals } = trpc.referral.getMyReferrals.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Send invite mutation
  const sendInviteMutation = trpc.referral.sendInvite.useMutation({
    onSuccess: () => {
      toast.success("Invitasjon sendt!", {
        description: `En invitasjon er sendt til ${inviteEmail}`,
      });
      setInviteEmail("");
      setInviteDialogOpen(false);
      refetchStats();
      refetchReferrals();
    },
    onError: (error) => {
      toast.error("Kunne ikke sende invitasjon", {
        description: error.message,
      });
    },
  });
  
  // Claim reward mutation
  const claimRewardMutation = trpc.referral.claimReward.useMutation({
    onSuccess: () => {
      toast.success("Belønning hentet!", {
        description: "Kredittene er lagt til kontoen din",
      });
      refetchStats();
      refetchReferrals();
    },
    onError: (error) => {
      toast.error("Kunne ikke hente belønning", {
        description: error.message,
      });
    },
  });
  
  const referralCode = (stats as ReferralStats)?.referral_code || "";
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Kopiert!", {
        description: "Henvisningslenken er kopiert til utklippstavlen",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Kunne ikke kopiere lenken");
    }
  };
  
  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    setSendingInvite(true);
    try {
      await sendInviteMutation.mutateAsync({ email: inviteEmail });
    } finally {
      setSendingInvite(false);
    }
  };
  
  const handleClaimReward = async (referralId: number) => {
    await claimRewardMutation.mutateAsync({ referralId });
  };
  
  const shareOnSocial = (platform: string) => {
    const text = encodeURIComponent("Prøv NorskLeads - den beste plattformen for B2B leadgenerering i Norge! Bruk min henvisningslenke:");
    const url = encodeURIComponent(referralLink);
    
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Venter</Badge>;
      case "signed_up":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><UserPlus className="w-3 h-3 mr-1" /> Registrert</Badge>;
      case "converted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Konvertert</Badge>;
      case "rewarded":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Gift className="w-3 h-3 mr-1" /> Belønnet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (authLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  const typedStats = stats as ReferralStats | undefined;
  const typedReferrals = (referrals || []) as Referral[];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Henvisningsprogram</h1>
          <p className="text-muted-foreground">
            Inviter venner og kollegaer til NorskLeads og tjen belønninger for hver som registrerer seg.
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt invitert</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typedStats?.total_invites || 0}</div>
              <p className="text-xs text-muted-foreground">Invitasjoner sendt</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registreringer</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typedStats?.total_signups || 0}</div>
              <p className="text-xs text-muted-foreground">Nye brukere</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konverteringer</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typedStats?.total_conversions || 0}</div>
              <p className="text-xs text-muted-foreground">Betalende kunder</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opptjent</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typedStats?.total_rewards_earned || 0}</div>
              <p className="text-xs text-muted-foreground">
                {typedStats?.pending_rewards ? `+${typedStats.pending_rewards} ventende` : "Kreditter"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Referral Link Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Din henvisningslenke
              </CardTitle>
              <CardDescription>
                Del denne lenken med venner og kollegaer for å tjene belønninger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={referralLink}
                    readOnly
                    className="pr-20 font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopier
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Del på sosiale medier</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial("facebook")}
                    className="flex-1"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial("twitter")}
                    className="flex-1"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial("linkedin")}
                    className="flex-1"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Send invitasjon via e-post</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="venn@eksempel.no"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button onClick={handleSendInvite} disabled={!inviteEmail || sendingInvite}>
                    {sendingInvite ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Rewards Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Belønninger
              </CardTitle>
              <CardDescription>
                Slik fungerer henvisningsprogrammet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Ny registrering</p>
                    <p className="text-sm text-muted-foreground">+50 kreditter</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Første betaling</p>
                    <p className="text-sm text-muted-foreground">+100 kreditter</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Premium-abonnement</p>
                    <p className="text-sm text-muted-foreground">+200 kreditter</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Kreditter kan brukes til å låse opp flere leads eller premium-funksjoner.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
        
        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dine henvisninger</CardTitle>
            <CardDescription>
              Oversikt over alle dine henvisninger og deres status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referralsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : typedReferrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen henvisninger ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Del din henvisningslenke for å begynne å tjene belønninger
                </p>
                <Button onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopier henvisningslenke
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-post / Navn</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Belønning</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead className="text-right">Handling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referred_name || referral.referred_email || "Venter på registrering"}
                          </p>
                          {referral.referred_name && referral.referred_user_email && (
                            <p className="text-sm text-muted-foreground">{referral.referred_user_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>
                        {referral.reward_amount ? (
                          <span className="font-medium">+{referral.reward_amount} kreditter</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(referral.createdAt).toLocaleDateString("nb-NO", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {referral.reward_amount && !referral.reward_claimed && referral.status !== "pending" ? (
                          <Button
                            size="sm"
                            onClick={() => handleClaimReward(referral.id)}
                            disabled={claimRewardMutation.isPending}
                          >
                            {claimRewardMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Gift className="h-4 w-4 mr-1" />
                                Hent
                              </>
                            )}
                          </Button>
                        ) : referral.reward_claimed ? (
                          <Badge variant="secondary">
                            <Check className="h-3 w-3 mr-1" />
                            Hentet
                          </Badge>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Referral Code Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Din henvisningskode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-muted rounded-lg px-6 py-4">
                <span className="text-2xl font-mono font-bold tracking-wider">
                  {referralCode}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Del denne koden med venner som foretrekker å skrive inn koden manuelt ved registrering.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

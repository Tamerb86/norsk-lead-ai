import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Shield, ShieldCheck, ShieldOff, Copy, Check, AlertTriangle, Key, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorSettingsProps {
  enabled: boolean;
  backupCodesRemaining?: number;
  onRefresh: () => void;
}

export function TwoFactorSettings({ enabled, backupCodesRemaining = 0, onRefresh }: TwoFactorSettingsProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to setup 2FA");
      }
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("qr");
      setIsSetupOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunne ikke starte 2FA-oppsett");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Vennligst skriv inn en 6-sifret kode");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Invalid code");
      }
      
      setBackupCodes(data.backupCodes);
      setStep("backup");
      toast.success("Tofaktorautentisering aktivert!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ugyldig kode");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!password) {
      toast.error("Passord er påkrevd");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, code: disableCode }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to disable 2FA");
      }
      
      toast.success("Tofaktorautentisering deaktivert");
      setIsDisableOpen(false);
      setPassword("");
      setDisableCode("");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunne ikke deaktivere 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!regenerateCode || regenerateCode.length !== 6) {
      toast.error("Vennligst skriv inn en 6-sifret kode");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/regenerate-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: regenerateCode }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate backup codes");
      }
      
      setBackupCodes(data.backupCodes);
      setStep("backup");
      setIsRegenerateOpen(false);
      setIsSetupOpen(true);
      toast.success("Nye reservekoder generert!");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunne ikke generere nye koder");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast.success("Kopiert til utklippstavlen");
  };

  const copyAllBackupCodes = () => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Alle koder kopiert");
  };

  const closeSetupDialog = () => {
    setIsSetupOpen(false);
    setStep("qr");
    setVerificationCode("");
    setQrCode("");
    setSecret("");
    setBackupCodes([]);
    onRefresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tofaktorautentisering (2FA)
          </CardTitle>
          <CardDescription>
            Legg til et ekstra sikkerhetslag på kontoen din ved å kreve en kode fra autentiseringsappen din ved innlogging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {enabled ? (
            <>
              <Alert className="bg-green-50 border-green-200">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">2FA er aktivert</AlertTitle>
                <AlertDescription className="text-green-700">
                  Kontoen din er beskyttet med tofaktorautentisering.
                </AlertDescription>
              </Alert>

              {backupCodesRemaining <= 3 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Få reservekoder igjen</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Du har bare {backupCodesRemaining} reservekoder igjen. Vurder å generere nye.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Reservekoder: {backupCodesRemaining} igjen</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegenerateOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generer nye
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setIsDisableOpen(true)}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Deaktiver 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <ShieldOff className="h-4 w-4" />
                <AlertTitle>2FA er ikke aktivert</AlertTitle>
                <AlertDescription>
                  Aktiver tofaktorautentisering for å beskytte kontoen din bedre.
                </AlertDescription>
              </Alert>

              <Button onClick={handleSetup} disabled={isLoading}>
                <Shield className="h-4 w-4 mr-2" />
                {isLoading ? "Starter..." : "Aktiver 2FA"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={isSetupOpen} onOpenChange={closeSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "qr" && "Skann QR-kode"}
              {step === "verify" && "Bekreft oppsett"}
              {step === "backup" && "Lagre reservekoder"}
            </DialogTitle>
            <DialogDescription>
              {step === "qr" && "Skann denne QR-koden med autentiseringsappen din (Google Authenticator, Authy, etc.)"}
              {step === "verify" && "Skriv inn den 6-sifrede koden fra autentiseringsappen din"}
              {step === "backup" && "Lagre disse kodene på et trygt sted. Du kan bruke dem hvis du mister tilgang til autentiseringsappen."}
            </DialogDescription>
          </DialogHeader>

          {step === "qr" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCode && (
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-lg border" />
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Manuell oppføring</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeSetupDialog}>
                  Avbryt
                </Button>
                <Button onClick={() => setStep("verify")}>
                  Neste
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Bekreftelseskode</Label>
                <Input
                  id="code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("qr")}>
                  Tilbake
                </Button>
                <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6}>
                  {isLoading ? "Bekrefter..." : "Bekreft"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "backup" && (
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Disse kodene vises bare én gang. Lagre dem på et trygt sted!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded font-mono text-sm"
                  >
                    <span>{code}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(code, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full" onClick={copyAllBackupCodes}>
                <Copy className="h-4 w-4 mr-2" />
                Kopier alle koder
              </Button>

              <DialogFooter>
                <Button onClick={closeSetupDialog}>
                  Ferdig
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deaktiver tofaktorautentisering</DialogTitle>
            <DialogDescription>
              For å deaktivere 2FA, bekreft med passordet ditt og en kode fra autentiseringsappen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Passord</Label>
              <Input
                id="disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disable-code">2FA-kode</Label>
              <Input
                id="disable-code"
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center tracking-widest font-mono"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisableOpen(false)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDisable} disabled={isLoading}>
              {isLoading ? "Deaktiverer..." : "Deaktiver 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generer nye reservekoder</DialogTitle>
            <DialogDescription>
              Skriv inn en kode fra autentiseringsappen din for å generere nye reservekoder. De gamle kodene vil bli ugyldige.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="regenerate-code">2FA-kode</Label>
            <Input
              id="regenerate-code"
              placeholder="000000"
              value={regenerateCode}
              onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center tracking-widest font-mono"
              maxLength={6}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegenerateOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleRegenerate} disabled={isLoading || regenerateCode.length !== 6}>
              {isLoading ? "Genererer..." : "Generer nye koder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

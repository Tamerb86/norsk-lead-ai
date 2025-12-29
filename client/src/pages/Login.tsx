import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, ArrowRight, Shield, KeyRound } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Vennligst fyll ut alle feltene");
      return;
    }

    const result = await login({ email, password });
    
    if (result.success) {
      setLocation("/dashboard");
    } else if (result.requires2FA) {
      setRequires2FA(true);
    } else {
      setError(result.error || "Innlogging mislyktes");
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!twoFactorCode) {
      setError("Vennligst skriv inn koden");
      return;
    }

    setTwoFactorLoading(true);
    try {
      const response = await fetch("/api/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          code: twoFactorCode,
          isBackupCode: useBackupCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload auth state
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Ugyldig kode");
      }
    } catch (err) {
      setError("Noe gikk galt. Prøv igjen.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setTwoFactorCode("");
    setUseBackupCode(false);
    setError(null);
  };

  // 2FA Verification Screen
  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-2xl font-bold text-white">NorskLeads</span>
            </Link>
          </div>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Shield className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white text-center">
                Tofaktorautentisering
              </CardTitle>
              <CardDescription className="text-gray-400 text-center">
                {useBackupCode
                  ? "Skriv inn en av dine reservekoder"
                  : "Skriv inn koden fra autentiseringsappen din"}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handle2FASubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="2fa-code" className="text-gray-300">
                    {useBackupCode ? "Reservekode" : "Bekreftelseskode"}
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="2fa-code"
                      type="text"
                      placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
                      value={twoFactorCode}
                      onChange={(e) => {
                        if (useBackupCode) {
                          setTwoFactorCode(e.target.value.toUpperCase());
                        } else {
                          setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        }
                      }}
                      className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500 text-center text-xl tracking-widest font-mono"
                      disabled={twoFactorLoading}
                      maxLength={useBackupCode ? 10 : 6}
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="link"
                  className="text-gray-400 hover:text-purple-400 p-0 h-auto"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode("");
                    setError(null);
                  }}
                >
                  {useBackupCode
                    ? "Bruk autentiseringsapp i stedet"
                    : "Bruk reservekode i stedet"}
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  disabled={twoFactorLoading || (!useBackupCode && twoFactorCode.length !== 6)}
                >
                  {twoFactorLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bekrefter...
                    </>
                  ) : (
                    <>
                      Bekreft
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  onClick={handleBackToLogin}
                >
                  Tilbake til innlogging
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Normal Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-2xl font-bold text-white">NorskLeads</span>
          </Link>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white text-center">Logg inn</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Skriv inn e-post og passord for å logge inn
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-pink-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Passord</Label>
                  <Link href="/forgot-password" className="text-sm text-pink-400 hover:text-pink-300">
                    Glemt passord?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-pink-500"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logger inn...
                  </>
                ) : (
                  <>
                    Logg inn
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-gray-400 text-sm">
                Har du ikke en konto?{" "}
                <Link href="/register" className="text-pink-400 hover:text-pink-300 font-medium">
                  Registrer deg
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

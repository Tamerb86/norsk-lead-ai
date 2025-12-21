import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Mail, Lock, Shield, Check } from "lucide-react";

export default function Profile() {
  const { user, loading, updateProfile, changePassword } = useAuth({ redirectOnUnauthenticated: true });
  
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Min profil</h1>
          <p className="text-gray-400">Administrer din kontoinformasjon</p>
        </div>

        {/* Profile Info Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-pink-500" />
              Profilinformasjon
            </CardTitle>
            <CardDescription className="text-gray-400">
              Oppdater din personlige informasjon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {profileError && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              
              {profileSuccess && (
                <Alert className="bg-green-900/50 border-green-800">
                  <Check className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    Profilen ble oppdatert
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Navn</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  disabled={profileLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-gray-400"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500">E-post kan ikke endres</p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Rolle</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md">
                  <Shield className="h-4 w-4 text-pink-500" />
                  <span className="text-white capitalize">{user?.role || "viewer"}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={profileLoading}
              >
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

        {/* Change Password Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-pink-500" />
              Endre passord
            </CardTitle>
            <CardDescription className="text-gray-400">
              Oppdater passordet ditt for å holde kontoen sikker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              
              {passwordSuccess && (
                <Alert className="bg-green-900/50 border-green-800">
                  <Check className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    Passordet ble endret
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-300">Nåværende passord</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  disabled={passwordLoading}
                />
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300">Nytt passord</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minst 8 tegn"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  disabled={passwordLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Bekreft nytt passord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  disabled={passwordLoading}
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700"
                disabled={passwordLoading}
              >
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
      </div>
    </DashboardLayout>
  );
}

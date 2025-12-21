import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Lock, User, ArrowRight, Check } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError("Vennligst fyll ut alle feltene");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passordene samsvarer ikke");
      return;
    }

    if (password.length < 8) {
      setError("Passordet må være minst 8 tegn");
      return;
    }

    if (!acceptTerms) {
      setError("Du må godta vilkårene for å registrere deg");
      return;
    }

    const result = await register({ name, email, password });
    
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Registrering mislyktes");
    }
  };

  const features = [
    "Tilgang til 1M+ norske bedrifter",
    "AI-drevet leadgenerering",
    "E-postkampanjer og automatisering",
    "Gratis prøveperiode",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-2xl font-bold text-white">NorskLeads</span>
          </Link>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white text-center">Opprett konto</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Start din gratis prøveperiode i dag
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Features list */}
              <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-400" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Fullt navn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ola Nordmann"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-pink-500"
                    disabled={loading}
                  />
                </div>
              </div>

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
                <Label htmlFor="password" className="text-gray-300">Passord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minst 8 tegn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-pink-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Bekreft passord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Gjenta passordet"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-pink-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-1 border-gray-600 data-[state=checked]:bg-pink-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-400 leading-tight">
                  Jeg godtar{" "}
                  <Link to="/terms" className="text-pink-400 hover:text-pink-300">
                    vilkårene
                  </Link>{" "}
                  og{" "}
                  <Link to="/privacy" className="text-pink-400 hover:text-pink-300">
                    personvernerklæringen
                  </Link>
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oppretter konto...
                  </>
                ) : (
                  <>
                    Opprett konto
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-400 text-center">
                Har du allerede en konto?{" "}
                <Link to="/login" className="text-pink-400 hover:text-pink-300 font-medium">
                  Logg inn
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogIn } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  message?: string;
}

export default function RequireAuth({ children, message = "Du må være logget inn for å se denne siden" }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 absolute top-0"></div>
          </div>
          <p className="text-sm text-gray-600 animate-pulse">Laster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Logg inn for å fortsette</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/login">
            <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Logg inn
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Har du ikke en konto? <Link href="/register" className="text-blue-600 hover:underline">Registrer deg</Link>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

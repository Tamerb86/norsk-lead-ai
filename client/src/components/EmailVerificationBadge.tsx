import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle, XCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

interface EmailVerificationBadgeProps {
  email: string;
  compact?: boolean;
}

export function EmailVerificationBadge({ email, compact = false }: EmailVerificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const verifyMutation = trpc.ai.verifyEmail.useMutation();

  const handleVerify = () => {
    setIsOpen(true);
    if (!verifyMutation.data) {
      verifyMutation.mutate({ email });
    }
  };

  const result = verifyMutation.data;

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 gap-1"
            onClick={handleVerify}
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="text-xs">Verifiser</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <VerificationContent 
            result={result} 
            isLoading={verifyMutation.isPending} 
            email={email}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handleVerify}
        >
          <ShieldCheck className="w-4 h-4" />
          Verifiser e-post
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <VerificationContent 
          result={result} 
          isLoading={verifyMutation.isPending} 
          email={email}
        />
      </PopoverContent>
    </Popover>
  );
}

function VerificationContent({ 
  result, 
  isLoading, 
  email 
}: { 
  result: any; 
  isLoading: boolean;
  email: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Verifiserer...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Klikk for å verifisere e-postadressen
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {result.isValid ? (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
        )}
        <div>
          <h4 className="font-semibold">
            {result.isValid ? "Gyldig e-post" : "Ugyldig e-post"}
          </h4>
          <p className="text-xs text-gray-500 truncate max-w-[180px]">{email}</p>
        </div>
        <div className="ml-auto">
          <div className={`text-xl font-bold ${result.score >= 70 ? 'text-green-600' : result.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
            {result.score}%
          </div>
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Kontroller</h5>
        <div className="space-y-1.5">
          <CheckItem label="Format" passed={result.checks.format} />
          <CheckItem label="Domene" passed={result.checks.domain} />
          <CheckItem label="MX-post (e-postserver)" passed={result.checks.mx} />
          <CheckItem 
            label="Ikke midlertidig e-post" 
            passed={!result.checks.disposable} 
            warning={result.checks.disposable}
          />
          <CheckItem 
            label="Personlig e-post" 
            passed={!result.checks.roleAccount}
            warning={result.checks.roleAccount}
            warningText="Generisk e-post (info@, post@)"
          />
        </div>
      </div>

      {/* Reason */}
      {result.reason && (
        <div className="p-2 bg-red-50 rounded text-sm text-red-700">
          {result.reason}
        </div>
      )}

      {/* Suggestion */}
      {result.suggestion && (
        <div className="p-2 bg-yellow-50 rounded text-sm">
          <span className="text-yellow-700">Mente du: </span>
          <span className="font-medium text-yellow-800">{result.suggestion}</span>
        </div>
      )}
    </div>
  );
}

function CheckItem({ 
  label, 
  passed, 
  warning = false,
  warningText 
}: { 
  label: string; 
  passed: boolean;
  warning?: boolean;
  warningText?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : warning ? (
        <AlertCircle className="w-4 h-4 text-yellow-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className={`text-sm ${passed ? 'text-gray-700' : warning ? 'text-yellow-700' : 'text-red-700'}`}>
        {warning && warningText ? warningText : label}
      </span>
    </div>
  );
}

export default EmailVerificationBadge;

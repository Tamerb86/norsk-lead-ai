import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TrendingUp, Loader2, Info } from "lucide-react";

interface LeadScoreBadgeProps {
  companyId: number;
  compact?: boolean;
}

const gradeColors = {
  A: "bg-green-500 hover:bg-green-600",
  B: "bg-blue-500 hover:bg-blue-600",
  C: "bg-yellow-500 hover:bg-yellow-600",
  D: "bg-orange-500 hover:bg-orange-600",
  F: "bg-red-500 hover:bg-red-600",
};

const gradeLabels = {
  A: "Utmerket",
  B: "Veldig bra",
  C: "Bra",
  D: "Akseptabel",
  F: "Lav kvalitet",
};

export function LeadScoreBadge({ companyId, compact = false }: LeadScoreBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: score, isLoading, refetch } = trpc.leadScoring.scoreCompany.useQuery(
    { companyId },
    { enabled: isOpen }
  );

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !score) {
      refetch();
    }
  };

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">Score</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <ScoreContent score={score} isLoading={isLoading} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Se lead score
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <ScoreContent score={score} isLoading={isLoading} />
      </PopoverContent>
    </Popover>
  );
}

function ScoreContent({ score, isLoading }: { score: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Beregner score...</span>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="text-center py-4 text-gray-500">
        Kunne ikke beregne score
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with grade */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-lg">Lead Score</h4>
          <p className="text-sm text-gray-500">{gradeLabels[score.grade as keyof typeof gradeLabels]}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${gradeColors[score.grade as keyof typeof gradeColors]}`}>
            {score.grade}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{score.totalScore}</div>
            <div className="text-xs text-gray-500">av 100</div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Poengfordeling</h5>
        <div className="space-y-1.5">
          <ScoreBar label="Kontaktinfo" score={score.breakdown.contactInfo} max={25} />
          <ScoreBar label="Bedriftsstørrelse" score={score.breakdown.companySize} max={20} />
          <ScoreBar label="Bedriftsalder" score={score.breakdown.companyAge} max={15} />
          <ScoreBar label="Bransje" score={score.breakdown.industryMatch} max={20} />
          <ScoreBar label="Lokasjon" score={score.breakdown.location} max={10} />
          <ScoreBar label="Datakvalitet" score={score.breakdown.dataCompleteness} max={10} />
        </div>
      </div>

      {/* Signals */}
      {score.signals && score.signals.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Signaler
          </h5>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {score.signals.slice(0, 6).map((signal: string, i: number) => (
              <p key={i} className="text-xs text-gray-600">{signal}</p>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {score.recommendations && score.recommendations.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <h5 className="text-sm font-medium text-gray-700">Anbefalinger</h5>
          <div className="space-y-1">
            {score.recommendations.map((rec: string, i: number) => (
              <p key={i} className="text-xs text-blue-600 font-medium">{rec}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const percentage = (score / max) * 100;
  
  let barColor = "bg-red-500";
  if (percentage >= 80) barColor = "bg-green-500";
  else if (percentage >= 60) barColor = "bg-blue-500";
  else if (percentage >= 40) barColor = "bg-yellow-500";
  else if (percentage >= 20) barColor = "bg-orange-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right">{score}/{max}</span>
    </div>
  );
}

export default LeadScoreBadge;

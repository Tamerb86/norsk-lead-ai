import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Building2,
  Mail,
  Filter,
  Download,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  Zap,
  BarChart3,
  Users,
  Globe,
  Star,
  Rocket,
} from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  tip?: string;
  image?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Velkommen til NorskLeads! 🎉",
    description: "Din komplette plattform for B2B-leadgenerering i Norge. La oss vise deg hvordan du kan finne de beste bedriftene for din virksomhet.",
    icon: <Rocket className="w-12 h-12 text-blue-500" />,
    features: [
      "Tilgang til over 999,000 norske bedrifter",
      "Avanserte søk og filtreringsmuligheter",
      "AI-drevet e-postgenerering",
      "Automatisk lead-scoring",
    ],
    tip: "Du kan alltid åpne denne guiden igjen fra menyen.",
  },
  {
    id: 2,
    title: "Søk etter bedrifter",
    description: "Bruk det kraftige søkeverktøyet vårt for å finne akkurat de bedriftene du leter etter.",
    icon: <Search className="w-12 h-12 text-green-500" />,
    features: [
      "Søk på bedriftsnavn eller org.nummer",
      "Filtrer på fylke, kommune og poststed",
      "Velg bransje med næringskode",
      "Filtrer på antall ansatte",
    ],
    tip: "Prøv å kombinere flere filtre for mer presise resultater.",
  },
  {
    id: 3,
    title: "Filtrer og finn leads",
    description: "Bruk avanserte filtre for å finne bedrifter som matcher dine kriterier perfekt.",
    icon: <Filter className="w-12 h-12 text-purple-500" />,
    features: [
      "Filtrer på bedrifter med e-post",
      "Finn bedrifter med nettside",
      "Velg bedrifter med telefonnummer",
      "Sorter etter ansatte, stiftelsesdato m.m.",
    ],
    tip: "Lagre dine favorittfiltre for rask tilgang senere.",
  },
  {
    id: 4,
    title: "AI-drevet e-postgenerering",
    description: "La vår AI skrive profesjonelle e-poster tilpasset hver bedrift.",
    icon: <Sparkles className="w-12 h-12 text-yellow-500" />,
    features: [
      "Generer personlige e-poster automatisk",
      "Velg mellom norsk og engelsk",
      "Tilpass tone: profesjonell, vennlig eller direkte",
      "Ulike formål: salg, partnerskap, møteforespørsel",
    ],
    tip: "AI-en bruker bedriftsinformasjon for å lage relevante e-poster.",
  },
  {
    id: 5,
    title: "Lead Scoring",
    description: "Prioriter de beste leads med vår automatiske scoring fra A til F.",
    icon: <Target className="w-12 h-12 text-red-500" />,
    features: [
      "Automatisk scoring basert på data",
      "A-F gradering for enkel prioritering",
      "Vurdering av kontaktinfo, størrelse og bransje",
      "Fokuser på de mest lovende leads",
    ],
    tip: "Leads med score A og B har høyest sannsynlighet for konvertering.",
  },
  {
    id: 6,
    title: "Eksporter og bruk data",
    description: "Last ned dine leads og bruk dem i dine salgs- og markedsføringssystemer.",
    icon: <Download className="w-12 h-12 text-indigo-500" />,
    features: [
      "Eksporter til CSV eller Excel",
      "Velg hvilke felter du vil inkludere",
      "Importer direkte til CRM-systemer",
      "Bruk i e-postkampanjer",
    ],
    tip: "Premium-brukere kan eksportere ubegrenset antall leads.",
  },
  {
    id: 7,
    title: "Du er klar! 🚀",
    description: "Nå vet du det grunnleggende. Utforsk plattformen og finn dine første leads!",
    icon: <Star className="w-12 h-12 text-amber-500" />,
    features: [
      "Start med et enkelt søk",
      "Prøv AI e-postgeneratoren",
      "Sjekk lead scores",
      "Eksporter dine favoritter",
    ],
    tip: "Trenger du hjelp? Kontakt oss via support@norskleads.no",
  },
];

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save completion status to localStorage
    localStorage.setItem("onboarding_completed", "true");
    localStorage.setItem("onboarding_completed_at", new Date().toISOString());
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_skipped", "true");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
          <div className="flex items-center justify-between text-white mb-2">
            <span className="text-sm font-medium">
              Steg {currentStep + 1} av {totalSteps}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-2 bg-white/30" />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Indicator Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-blue-600 w-6"
                    : completedSteps.includes(index)
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Icon and Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              {step.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">{step.description}</p>
          </div>

          {/* Features List */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid gap-3">
              {step.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          {step.tip && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Tips:</strong> {step.tip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Forrige
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < totalSteps - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Hopp over
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    Kom i gang
                    <Rocket className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Neste
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed");
    const skipped = localStorage.getItem("onboarding_skipped");
    
    setHasCompleted(completed === "true");
    
    // Show onboarding if not completed and not skipped
    if (!completed && !skipped) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const openOnboarding = () => setShowOnboarding(true);
  const closeOnboarding = () => setShowOnboarding(false);
  const completeOnboarding = () => {
    setHasCompleted(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("onboarding_skipped");
    localStorage.removeItem("onboarding_completed_at");
    setHasCompleted(false);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    hasCompleted,
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}

// Quick Tour Component for specific features
interface QuickTourProps {
  feature: "search" | "filters" | "ai-email" | "lead-score" | "export";
  children: React.ReactNode;
}

const FEATURE_TIPS = {
  search: {
    title: "Søk etter bedrifter",
    description: "Skriv inn bedriftsnavn eller org.nummer for å finne leads.",
  },
  filters: {
    title: "Bruk filtre",
    description: "Kombiner filtre for å finne de perfekte leads for deg.",
  },
  "ai-email": {
    title: "AI E-postgenerator",
    description: "Klikk her for å generere en personlig e-post til denne bedriften.",
  },
  "lead-score": {
    title: "Lead Score",
    description: "Denne scoren viser hvor verdifull denne leaden er basert på tilgjengelig data.",
  },
  export: {
    title: "Eksporter leads",
    description: "Last ned dine valgte leads til CSV eller Excel.",
  },
};

export function QuickTour({ feature, children }: QuickTourProps) {
  const [showTip, setShowTip] = useState(false);
  const tip = FEATURE_TIPS[feature];

  // Check if user has seen this tip
  useEffect(() => {
    const seenTips = JSON.parse(localStorage.getItem("seen_tips") || "[]");
    if (!seenTips.includes(feature)) {
      const timer = setTimeout(() => setShowTip(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [feature]);

  const dismissTip = () => {
    const seenTips = JSON.parse(localStorage.getItem("seen_tips") || "[]");
    if (!seenTips.includes(feature)) {
      localStorage.setItem("seen_tips", JSON.stringify([...seenTips, feature]));
    }
    setShowTip(false);
  };

  return (
    <div className="relative">
      {children}
      {showTip && (
        <div className="absolute z-50 top-full left-0 mt-2 w-64 bg-blue-600 text-white rounded-lg shadow-lg p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm">{tip.title}</h4>
              <p className="text-xs text-blue-100 mt-1">{tip.description}</p>
            </div>
            <button
              onClick={dismissTip}
              className="text-blue-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-600 rotate-45" />
        </div>
      )}
    </div>
  );
}

export default OnboardingWizard;

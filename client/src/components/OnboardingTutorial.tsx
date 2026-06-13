import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users,
  Mail,
  FileText,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Sparkles,
  Building2,
  Target,
  Send,
  BarChart3,
  Rocket,
} from "lucide-react";
import { Link } from "wouter";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
  tips: string[];
  completed?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "search",
    title: "Søk etter bedrifter",
    description: "Finn potensielle kunder blant over 1 million norske bedrifter. Filtrer på bransje, størrelse, lokasjon og mer.",
    icon: <Search className="h-8 w-8 text-blue-500" />,
    link: "/search",
    linkText: "Start søk",
    tips: [
      "Bruk filtre for å finne din ideelle kunde",
      "Lagre søk for senere bruk",
      "Eksporter resultater til CSV",
    ],
  },
  {
    id: "leads",
    title: "Administrer leads",
    description: "Hold oversikt over alle dine potensielle kunder. Bruk Kanban-tavlen for å spore fremgang fra prospekt til kunde.",
    icon: <Users className="h-8 w-8 text-green-500" />,
    link: "/leads",
    linkText: "Se leads",
    tips: [
      "Dra og slipp leads mellom kolonner",
      "Filtrer leads etter status",
      "Se all kontaktinformasjon på ett sted",
    ],
  },
  {
    id: "templates",
    title: "Opprett e-postmaler",
    description: "Lag profesjonelle e-postmaler med variabler som automatisk fylles ut med bedriftsinformasjon.",
    icon: <FileText className="h-8 w-8 text-purple-500" />,
    link: "/templates",
    linkText: "Lag mal",
    tips: [
      "Bruk {{bedriftsnavn}} for personalisering",
      "Forhåndsvis malen før du sender",
      "Gjenbruk maler i flere kampanjer",
    ],
  },
  {
    id: "sequences",
    title: "Automatiser oppfølging",
    description: "Sett opp automatiske e-postsekvenser som følger opp leads over tid. Øk konverteringsraten med smart timing.",
    icon: <Zap className="h-8 w-8 text-orange-500" />,
    link: "/sequences",
    linkText: "Lag sekvens",
    tips: [
      "Start med 3-5 e-poster i sekvensen",
      "Vent 2-3 dager mellom hver e-post",
      "Stopp sekvensen når lead svarer",
    ],
  },
  {
    id: "campaigns",
    title: "Kjør kampanjer",
    description: "Kombiner alt sammen i kraftige kampanjer. Velg bedrifter, mal og sekvens - så gjør systemet resten.",
    icon: <Rocket className="h-8 w-8 text-pink-500" />,
    link: "/campaigns",
    linkText: "Start kampanje",
    tips: [
      "Start med en liten testgruppe",
      "Følg med på åpningsrate og svar",
      "Optimaliser basert på resultater",
    ],
  },
];

interface OnboardingTutorialProps {
  onComplete?: () => void;
  showOnFirstVisit?: boolean;
}

export function OnboardingTutorial({ onComplete, showOnFirstVisit = true }: OnboardingTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    // Check if user has seen the tutorial
    const hasSeenTutorial = localStorage.getItem("onboarding_completed");
    const tutorialDismissed = localStorage.getItem("onboarding_dismissed");
    
    if (showOnFirstVisit && !hasSeenTutorial && !tutorialDismissed) {
      // Show tutorial after a short delay
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
    
    // Load completed steps
    const saved = localStorage.getItem("onboarding_progress");
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
  }, [showOnFirstVisit]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsOpen(false);
    onComplete?.();
  };

  const handleDismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setIsOpen(false);
  };

  const markStepComplete = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId];
    setCompletedSteps(newCompleted);
    localStorage.setItem("onboarding_progress", JSON.stringify(newCompleted));
  };

  const progress = (completedSteps.length / tutorialSteps.length) * 100;
  const step = tutorialSteps[currentStep];

  return (
    <>
      {/* Tutorial Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="mb-2">
                Steg {currentStep + 1} av {tutorialSteps.length}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {step.icon}
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Progress value={(currentStep + 1) / tutorialSteps.length * 100} className="mb-4" />
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Tips
              </h4>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Forrige
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Link href={step.link}>
                <Button variant="outline" onClick={() => {
                  markStepComplete(step.id);
                  setIsOpen(false);
                }}>
                  {step.linkText}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              {currentStep === tutorialSteps.length - 1 ? (
                <Button onClick={handleComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Fullfør
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Neste
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Quick Start Card for Dashboard
export function QuickStartCard() {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("onboarding_progress");
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
  }, []);

  const progress = (completedSteps.length / tutorialSteps.length) * 100;
  const isComplete = completedSteps.length === tutorialSteps.length;

  if (isComplete) {
    return null;
  }

  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" />
              Kom i gang
            </CardTitle>
            <Badge variant="secondary">{completedSteps.length}/{tutorialSteps.length}</Badge>
          </div>
          <CardDescription>
            Fullfør disse stegene for å mestre NorskLeads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
          
          <div className="space-y-2">
            {tutorialSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              return (
                <Link key={step.id} href={step.link}>
                  <div 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isCompleted 
                        ? "bg-green-50 text-green-700" 
                        : "hover:bg-white/50"
                    }`}
                    onClick={() => {
                      if (!isCompleted) {
                        const newCompleted = [...completedSteps, step.id];
                        setCompletedSteps(newCompleted);
                        localStorage.setItem("onboarding_progress", JSON.stringify(newCompleted));
                      }
                    }}
                  >
                    <div className={`p-1.5 rounded-full ${isCompleted ? "bg-green-100" : "bg-white"}`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 flex items-center justify-center text-xs font-medium text-gray-500">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <span className={`text-sm ${isCompleted ? "line-through" : "font-medium"}`}>
                      {step.title}
                    </span>
                    {!isCompleted && (
                      <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setShowTutorial(true)}
          >
            <Play className="h-4 w-4 mr-2" />
            Se veiledning
          </Button>
        </CardContent>
      </Card>

      {showTutorial && (
        <OnboardingTutorial 
          showOnFirstVisit={false} 
          onComplete={() => setShowTutorial(false)}
        />
      )}
    </>
  );
}

// Feature Cards for Dashboard
export function FeatureCards() {
  const features = [
    {
      title: "Leads",
      description: "Administrer dine potensielle kunder",
      icon: <Users className="h-6 w-6 text-green-500" />,
      link: "/leads",
      color: "from-green-50 to-emerald-50 border-green-200",
    },
    {
      title: "E-postmaler",
      description: "Lag profesjonelle maler",
      icon: <FileText className="h-6 w-6 text-purple-500" />,
      link: "/templates",
      color: "from-purple-50 to-violet-50 border-purple-200",
    },
    {
      title: "Sekvenser",
      description: "Automatiser oppfølging",
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      link: "/sequences",
      color: "from-orange-50 to-amber-50 border-orange-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {features.map((feature) => (
        <Link key={feature.title} href={feature.link}>
          <Card className={`cursor-pointer hover:shadow-md transition-all bg-gradient-to-br ${feature.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

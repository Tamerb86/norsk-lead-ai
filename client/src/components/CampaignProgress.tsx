import { Check, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

const campaignSteps: Step[] = [
  {
    id: 1,
    title: "Velg bedrifter",
    description: "Søk og velg bedrifter du vil kontakte",
  },
  {
    id: 2,
    title: "Opprett kampanje",
    description: "Gi kampanjen et navn og velg innstillinger",
  },
  {
    id: 3,
    title: "Skriv e-post",
    description: "Skriv emne og innhold, eller bruk en mal",
  },
  {
    id: 4,
    title: "Forhåndsvis",
    description: "Se over e-posten før du sender",
  },
  {
    id: 5,
    title: "Send",
    description: "Send kampanjen til valgte bedrifter",
  },
];

interface CampaignProgressProps {
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
  variant?: "horizontal" | "vertical";
}

export function CampaignProgress({
  currentStep,
  completedSteps = [],
  onStepClick,
  variant = "horizontal",
}: CampaignProgressProps) {
  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);
  const isStepCurrent = (stepId: number) => stepId === currentStep;
  const isStepClickable = (stepId: number) =>
    isStepCompleted(stepId) || stepId <= currentStep;

  if (variant === "vertical") {
    return (
      <div className="space-y-4">
        {campaignSteps.map((step, index) => {
          const completed = isStepCompleted(step.id);
          const current = isStepCurrent(step.id);
          const clickable = isStepClickable(step.id);

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg transition-colors",
                current && "bg-primary/5 border border-primary/20",
                clickable && !current && "hover:bg-muted/50 cursor-pointer",
                !clickable && "opacity-50"
              )}
              onClick={() => clickable && onStepClick?.(step.id)}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  completed && "bg-green-500 border-green-500 text-white",
                  current && !completed && "border-primary bg-primary text-white",
                  !completed && !current && "border-gray-300 text-gray-400"
                )}
              >
                {completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium",
                    current && "text-primary",
                    completed && "text-green-600"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>

              {/* Arrow for current step */}
              {current && (
                <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {campaignSteps.map((step, index) => {
          const completed = isStepCompleted(step.id);
          const current = isStepCurrent(step.id);
          const clickable = isStepClickable(step.id);
          const isLast = index === campaignSteps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step */}
              <div
                className={cn(
                  "flex flex-col items-center",
                  clickable && "cursor-pointer"
                )}
                onClick={() => clickable && onStepClick?.(step.id)}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    completed && "bg-green-500 border-green-500 text-white",
                    current && !completed && "border-primary bg-primary text-white scale-110",
                    !completed && !current && "border-gray-300 text-gray-400"
                  )}
                >
                  {completed ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>

                {/* Title */}
                <p
                  className={cn(
                    "text-xs mt-2 text-center font-medium max-w-[80px]",
                    current && "text-primary",
                    completed && "text-green-600",
                    !current && !completed && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    completed ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {campaignSteps.find((s) => s.id === currentStep)?.description}
        </p>
      </div>
    </div>
  );
}

// Mini progress indicator for cards
export function CampaignProgressMini({
  currentStep,
  totalSteps = 5,
}: {
  currentStep: number;
  totalSteps?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            index < currentStep ? "bg-green-500" : "bg-gray-200"
          )}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-2">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}

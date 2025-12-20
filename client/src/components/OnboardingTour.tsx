import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export function OnboardingTour() {
  const { isActive, currentStep, currentStepData, nextStep, prevStep, skipOnboarding } =
    useOnboarding();
  const [location, setLocation] = useLocation();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Navigate to the correct page for current step
  useEffect(() => {
    if (isActive && currentStepData && currentStepData.page !== location) {
      setLocation(currentStepData.page);
    }
  }, [isActive, currentStepData, location, setLocation]);

  // Find target element and calculate tooltip position
  useEffect(() => {
    if (!isActive || !currentStepData?.target) {
      setTargetElement(null);
      return;
    }

    // Wait for page to render
    const timer = setTimeout(() => {
      const element = document.querySelector(currentStepData.target!) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Calculate tooltip position
        const rect = element.getBoundingClientRect();
        const position = currentStepData.position || "bottom";
        
        let top = 0;
        let left = 0;
        
        switch (position) {
          case "bottom":
            top = rect.bottom + window.scrollY + 16;
            left = rect.left + window.scrollX + rect.width / 2;
            break;
          case "top":
            top = rect.top + window.scrollY - 16;
            left = rect.left + window.scrollX + rect.width / 2;
            break;
          case "left":
            top = rect.top + window.scrollY + rect.height / 2;
            left = rect.left + window.scrollX - 16;
            break;
          case "right":
            top = rect.top + window.scrollY + rect.height / 2;
            left = rect.right + window.scrollX + 16;
            break;
        }
        
        setTooltipPosition({ top, left });
        
        // Highlight target element
        element.style.position = "relative";
        element.style.zIndex = "1001";
        element.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.5)";
        element.style.borderRadius = "8px";
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (targetElement) {
        targetElement.style.position = "";
        targetElement.style.zIndex = "";
        targetElement.style.boxShadow = "";
      }
    };
  }, [isActive, currentStepData, location]);

  if (!isActive || !currentStepData) {
    return null;
  }

  const isFirstStep = currentStep === 0;
  const totalSteps = 6;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[999]" onClick={skipOnboarding} />

      {/* Tooltip */}
      <Card
        className="fixed z-[1002] w-96 shadow-2xl"
        style={
          currentStepData.target
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: "translateX(-50%)",
              }
            : {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2"
              onClick={skipOnboarding}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">{currentStepData.description}</p>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Steg {currentStep + 1} av {totalSteps}
          </p>
        </CardContent>

        <CardFooter className="flex justify-between pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Forrige
          </Button>

          <Button variant="ghost" size="sm" onClick={skipOnboarding}>
            Hopp over
          </Button>

          <Button size="sm" onClick={nextStep} className="gap-1">
            {currentStep === totalSteps - 1 ? "Fullfør" : "Neste"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

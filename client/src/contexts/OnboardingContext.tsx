import React, { createContext, useContext, useState, useEffect } from "react";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  page: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
};

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Velkommen til AI Lead Generator! 🎉",
    description:
      "La oss ta en rask omvisning for å vise deg hvordan du kan finne og kontakte norske bedrifter effektivt.",
    page: "/dashboard",
  },
  {
    id: "search",
    title: "Søk etter bedrifter 🔍",
    description:
      "Bruk søkefunksjonen for å finne bedrifter basert på navn, bransje, fylke eller by. Vi har over 1 million norske bedrifter i databasen.",
    page: "/search",
    target: "[data-onboarding='search-input']",
    position: "bottom",
  },
  {
    id: "filters",
    title: "Avanserte filtre 🎯",
    description:
      "Klikk på 'Vis filtre' for å bruke avanserte søkekriterier som bransje, fylke, ansatte og omsetning.",
    page: "/search",
    target: "[data-onboarding='filter-button']",
    position: "bottom",
  },
  {
    id: "campaigns",
    title: "Opprett kampanjer 📧",
    description:
      "Lag e-postkampanjer for å nå ut til bedriftene du har funnet. Du kan lage maler og automatisere utsendelser.",
    page: "/campaigns",
    target: "[data-onboarding='new-campaign']",
    position: "bottom",
  },
  {
    id: "enrichment",
    title: "Valider kontaktinformasjon ✅",
    description:
      "Bruk våre valideringsverktøy for å sjekke e-postadresser, telefonnumre og nettsider før du sender kampanjer.",
    page: "/enrichment",
  },
  {
    id: "complete",
    title: "Du er klar! 🚀",
    description:
      "Nå vet du det grunnleggende. Begynn å søke etter bedrifter og lag din første kampanje. Lykke til!",
    page: "/dashboard",
  },
];

type OnboardingContextType = {
  isActive: boolean;
  currentStep: number;
  currentStepData: OnboardingStep | null;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed");
    if (!completed) {
      // Auto-start onboarding for new users after a short delay
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentStepData = isActive ? onboardingSteps[currentStep] : null;

  const startOnboarding = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    setIsActive(false);
    localStorage.setItem("onboarding_completed", "true");
  };

  const completeOnboarding = () => {
    setIsActive(false);
    localStorage.setItem("onboarding_completed", "true");
  };

  const restartOnboarding = () => {
    localStorage.removeItem("onboarding_completed");
    setCurrentStep(0);
    setIsActive(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        currentStepData,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        restartOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

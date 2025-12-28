import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Lightbulb, 
  ArrowRight, 
  Search, 
  Users, 
  Mail, 
  BarChart3,
  FileText,
  Zap,
  Target,
  Rocket,
  Clock,
  CheckCircle,
  TrendingUp,
  Settings,
  Shield,
  Key,
  Database,
  Bell,
  CreditCard,
  UserCog,
  Globe,
  Lock,
  Palette,
  HelpCircle,
  Building2,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";

// Tips configuration for each page
interface Tip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  delay: number; // seconds before showing
}

interface PageTips {
  [key: string]: Tip[];
}

const PAGE_TIPS: PageTips = {
  "/dashboard": [
    {
      id: "dashboard-search",
      icon: <Search className="w-5 h-5 text-blue-500" />,
      title: "Finn nye bedrifter",
      description: "Bruk søkefunksjonen for å finne potensielle kunder basert på bransje, lokasjon og størrelse.",
      actionLabel: "Søk bedrifter",
      actionHref: "/search",
      delay: 45,
    },
    {
      id: "dashboard-campaign",
      icon: <Mail className="w-5 h-5 text-purple-500" />,
      title: "Start en kampanje",
      description: "Har du leads? Opprett en e-postkampanje for å nå ut til potensielle kunder.",
      actionLabel: "Opprett kampanje",
      actionHref: "/campaigns",
      delay: 90,
    },
    {
      id: "dashboard-analytics",
      icon: <BarChart3 className="w-5 h-5 text-green-500" />,
      title: "Følg med på resultater",
      description: "Se hvordan kampanjene dine presterer i Analytics-dashboardet.",
      actionLabel: "Se Analytics",
      actionHref: "/analytics",
      delay: 120,
    },
  ],
  "/search": [
    {
      id: "search-filters",
      icon: <Target className="w-5 h-5 text-orange-500" />,
      title: "Bruk filtre for bedre resultater",
      description: "Filtrer på bransje, antall ansatte, og om bedriften har e-post eller nettside.",
      delay: 30,
    },
    {
      id: "search-save",
      icon: <Users className="w-5 h-5 text-blue-500" />,
      title: "Lagre interessante bedrifter",
      description: "Klikk på 'Legg til leads' for å lagre bedrifter du vil følge opp senere.",
      actionLabel: "Se dine leads",
      actionHref: "/leads",
      delay: 60,
    },
    {
      id: "search-email",
      icon: <Mail className="w-5 h-5 text-purple-500" />,
      title: "Generer AI-e-post",
      description: "Bruk AI til å skrive personlige e-poster til bedriftene du finner.",
      delay: 90,
    },
  ],
  "/leads": [
    {
      id: "leads-campaign",
      icon: <Rocket className="w-5 h-5 text-purple-500" />,
      title: "Klar for å ta kontakt?",
      description: "Opprett en e-postkampanje for å nå ut til dine leads automatisk.",
      actionLabel: "Opprett kampanje",
      actionHref: "/campaigns",
      delay: 45,
    },
    {
      id: "leads-sequence",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Automatiser oppfølging",
      description: "Bruk sekvenser for å sende automatiske oppfølgings-e-poster.",
      actionLabel: "Se sekvenser",
      actionHref: "/sequences",
      delay: 90,
    },
    {
      id: "leads-score",
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      title: "Prioriter dine leads",
      description: "Leads med høy score (A-B) har større sjanse for konvertering. Fokuser på disse først.",
      delay: 120,
    },
  ],
  "/campaigns": [
    {
      id: "campaigns-create",
      icon: <Mail className="w-5 h-5 text-blue-500" />,
      title: "Opprett din første kampanje",
      description: "Velg leads, skriv en e-post, og send ut til potensielle kunder.",
      delay: 30,
    },
    {
      id: "campaigns-template",
      icon: <FileText className="w-5 h-5 text-purple-500" />,
      title: "Bruk maler",
      description: "Spar tid ved å bruke ferdige e-postmaler som du kan tilpasse.",
      actionLabel: "Se maler",
      actionHref: "/templates",
      delay: 60,
    },
    {
      id: "campaigns-track",
      icon: <BarChart3 className="w-5 h-5 text-green-500" />,
      title: "Spor resultater",
      description: "Se åpningsrate, klikk og svar for hver kampanje i Analytics.",
      actionLabel: "Se Analytics",
      actionHref: "/analytics",
      delay: 90,
    },
  ],
  "/templates": [
    {
      id: "templates-ai",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Bruk AI til å skrive",
      description: "La AI generere profesjonelle e-postmaler basert på din bransje og målgruppe.",
      delay: 30,
    },
    {
      id: "templates-personalize",
      icon: <Target className="w-5 h-5 text-orange-500" />,
      title: "Personaliser malene",
      description: "Bruk variabler som {firmanavn} og {kontaktperson} for personlige e-poster.",
      delay: 60,
    },
  ],
  "/sequences": [
    {
      id: "sequences-create",
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      title: "Automatiser oppfølging",
      description: "Opprett en sekvens med flere e-poster som sendes automatisk over tid.",
      delay: 30,
    },
    {
      id: "sequences-timing",
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: "Velg riktig timing",
      description: "Vent 2-3 dager mellom hver e-post for best resultat.",
      delay: 60,
    },
  ],
  "/analytics": [
    {
      id: "analytics-empty",
      icon: <Rocket className="w-5 h-5 text-purple-500" />,
      title: "Ingen data ennå?",
      description: "Start en kampanje for å begynne å samle inn statistikk og innsikt.",
      actionLabel: "Opprett kampanje",
      actionHref: "/campaigns",
      delay: 30,
    },
    {
      id: "analytics-improve",
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      title: "Forbedre resultatene",
      description: "Lav åpningsrate? Prøv å forbedre emnelinjen. Få svar? Juster innholdet.",
      delay: 60,
    },
  ],
  "/admin": [
    {
      id: "admin-ai",
      icon: <Key className="w-5 h-5 text-blue-500" />,
      title: "Konfigurer AI-tjenester",
      description: "Legg til API-nøkler for OpenAI, Anthropic eller Google AI for å aktivere e-postgenerering.",
      delay: 30,
    },
    {
      id: "admin-email-finder",
      icon: <Mail className="w-5 h-5 text-purple-500" />,
      title: "Aktiver e-postfinner",
      description: "Koble til Hunter.io for å automatisk finne e-postadresser til bedrifter.",
      delay: 60,
    },
    {
      id: "admin-brreg",
      icon: <Building2 className="w-5 h-5 text-red-500" />,
      title: "Synkroniser med Brreg",
      description: "Hold bedriftsdataene oppdatert ved å synkronisere med Brønnøysundregistrene (gratis).",
      delay: 90,
    },
    {
      id: "admin-users",
      icon: <Users className="w-5 h-5 text-green-500" />,
      title: "Administrer brukere",
      description: "Se og administrer alle brukere, endre roller og tilganger.",
      delay: 120,
    },
    {
      id: "admin-system",
      icon: <Database className="w-5 h-5 text-orange-500" />,
      title: "Systeminnstillinger",
      description: "Konfigurer e-postserver, domene og andre systeminnstillinger.",
      delay: 150,
    },
  ],
  "/account": [
    {
      id: "account-profile",
      icon: <UserCog className="w-5 h-5 text-blue-500" />,
      title: "Oppdater profilen din",
      description: "Legg til navn, bilde og kontaktinformasjon for en mer personlig opplevelse.",
      delay: 30,
    },
    {
      id: "account-security",
      icon: <Lock className="w-5 h-5 text-red-500" />,
      title: "Sikre kontoen din",
      description: "Endre passord regelmessig og aktiver to-faktor autentisering for ekstra sikkerhet.",
      delay: 60,
    },
    {
      id: "account-notifications",
      icon: <Bell className="w-5 h-5 text-yellow-500" />,
      title: "Tilpass varsler",
      description: "Velg hvilke varsler du vil motta på e-post og i appen.",
      delay: 90,
    },
    {
      id: "account-subscription",
      icon: <CreditCard className="w-5 h-5 text-green-500" />,
      title: "Oppgrader abonnementet",
      description: "Få tilgang til flere leads, kampanjer og avanserte funksjoner med Pro-planen.",
      delay: 120,
    },
  ],
  "/settings": [
    {
      id: "settings-email",
      icon: <Mail className="w-5 h-5 text-blue-500" />,
      title: "Konfigurer e-post",
      description: "Koble til din e-postkonto for å sende kampanjer direkte fra NorskLeads.",
      delay: 30,
    },
    {
      id: "settings-domain",
      icon: <Globe className="w-5 h-5 text-purple-500" />,
      title: "Verifiser domenet ditt",
      description: "Verifiser domenet for bedre leveringsrate og unngå spam-filtre.",
      delay: 60,
    },
    {
      id: "settings-branding",
      icon: <Palette className="w-5 h-5 text-pink-500" />,
      title: "Tilpass merkevaren",
      description: "Legg til logo og farger for å gjøre e-postene mer profesjonelle.",
      delay: 90,
    },
  ],
};

// Get tips for current page
function getTipsForPage(pathname: string): Tip[] {
  // Exact match first
  if (PAGE_TIPS[pathname]) {
    return PAGE_TIPS[pathname];
  }
  
  // Check for partial matches (e.g., /campaigns/123 -> /campaigns)
  for (const [path, tips] of Object.entries(PAGE_TIPS)) {
    if (pathname.startsWith(path) && path !== "/") {
      return tips;
    }
  }
  
  // Default to dashboard tips
  return PAGE_TIPS["/dashboard"] || [];
}

interface SmartTipsProps {
  enabled?: boolean;
}

export function SmartTips({ enabled = true }: SmartTipsProps) {
  const [location] = useLocation();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("dismissedTips");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const tips = getTipsForPage(location);
  const currentTip = tips[currentTipIndex];

  // Reset when page changes
  useEffect(() => {
    setIsVisible(false);
    setIsDismissed(false);
    setCurrentTipIndex(0);
    setLastActivity(Date.now());
  }, [location]);

  // Track user activity
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    // Hide tip when user becomes active
    if (isVisible) {
      setIsVisible(false);
    }
  }, [isVisible]);

  // Listen for user activity
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity]);

  // Show tip after idle time
  useEffect(() => {
    if (!enabled || isDismissed || !currentTip) return;
    
    // Skip if this tip was permanently dismissed
    if (dismissedTips.has(currentTip.id)) {
      // Try next tip
      if (currentTipIndex < tips.length - 1) {
        setCurrentTipIndex(prev => prev + 1);
      }
      return;
    }

    const checkIdle = setInterval(() => {
      const idleTime = (Date.now() - lastActivity) / 1000;
      
      if (idleTime >= currentTip.delay && !isVisible) {
        setIsVisible(true);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [enabled, isDismissed, currentTip, lastActivity, isVisible, dismissedTips, currentTipIndex, tips.length]);

  // Dismiss current tip
  const dismissTip = () => {
    setIsVisible(false);
    
    // Move to next tip
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(prev => prev + 1);
      setLastActivity(Date.now());
    } else {
      setIsDismissed(true);
    }
  };

  // Permanently dismiss tip
  const dismissPermanently = () => {
    if (currentTip) {
      const newDismissed = new Set(dismissedTips);
      newDismissed.add(currentTip.id);
      setDismissedTips(newDismissed);
      localStorage.setItem("dismissedTips", JSON.stringify([...newDismissed]));
    }
    dismissTip();
  };

  // Don't render if disabled or no tip
  if (!enabled || !isVisible || !currentTip) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Card className="w-80 shadow-2xl border-0 bg-gradient-to-br from-white to-indigo-50/50 overflow-hidden">
        {/* Gradient top border */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Tips</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={dismissTip}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {currentTip.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                {currentTip.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {currentTip.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={dismissPermanently}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Ikke vis igjen
            </button>
            
            {currentTip.actionHref ? (
              <Link href={currentTip.actionHref}>
                <Button 
                  size="sm" 
                  className="h-8 gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {currentTip.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="h-8"
                onClick={dismissTip}
              >
                Forstått
              </Button>
            )}
          </div>

          {/* Progress dots */}
          {tips.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {tips.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentTipIndex 
                      ? "bg-indigo-500" 
                      : index < currentTipIndex 
                        ? "bg-indigo-200" 
                        : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SmartTips;

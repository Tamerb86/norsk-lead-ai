import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PageHelpProps {
  title: string;
  description: string;
}

/**
 * PageHelp Component
 * 
 * Displays a help icon (?) next to the page title with a tooltip
 * that shows the page description on hover.
 * 
 * Usage:
 * <PageHelp 
 *   title="Dashboard" 
 *   description="Oversikt over dine leads, kampanjer og aktiviteter" 
 * />
 */
export function PageHelp({ title, description }: PageHelpProps) {
  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Hjelp for ${title}`}
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            className="max-w-sm bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-lg shadow-lg"
          >
            <p className="text-sm leading-relaxed">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * Page descriptions in Norwegian
 * Used across all pages for consistent help tooltips
 */
export const PAGE_DESCRIPTIONS = {
  // Main pages
  dashboard: 'Oversikt over dine leads, kampanjer og aktiviteter. Her finner du nøkkelstatistikk og siste aktiviteter.',
  search: 'Søk etter norske bedrifter ved hjelp av Brreg API. Filtrer etter bransje, størrelse, og lokasjon.',
  campaigns: 'Administrer e-postkampanjer. Opprett, send og spor kampanjer til dine leads.',
  leads: 'Oversikt over alle dine leads. Administrer kontakter, legg til notater, og spor status.',
  analytics: 'Detaljert analyse av kampanjer og leads. Se åpningsrater, klikkrater og konverteringer.',
  
  // Advanced features
  abTesting: 'A/B-testing av e-postkampanjer. Test forskjellige versjoner og finn den beste.',
  leadScoring: 'Automatisk poengberegning av leads basert på engasjement og bedriftsattributter.',
  webhooks: 'Integrer NorskLeads med eksterne tjenester via webhooks. Automatiser arbeidsflyten din.',
  referral: 'Inviter venner og tjen belønninger. Del din henvisningslenke og få kreditter.',
  
  // AI features
  aiAssistant: 'AI-assistent for salg og markedsføring. Få hjelp til å skrive e-poster, håndtere innvendinger og mer.',
  aiInsights: 'AI-drevne innsikter om leads og bedrifter. Få anbefalinger for beste tilnærming.',
  
  // Settings
  account: 'Kontoinnstillinger. Administrer profil, abonnement, sikkerhet og preferanser.',
  activityLog: 'Logg over alle aktiviteter i kontoen din. Spor endringer og handlinger.',
  calendar: 'Kalender for møter og oppfølginger. Planlegg aktiviteter med dine leads.',
  
  // Other
  help: 'Hjelp og dokumentasjon. Finn svar på vanlige spørsmål og lær hvordan du bruker NorskLeads.',
  about: 'Om NorskLeads. Lær mer om plattformen og teamet bak.',
  contact: 'Kontakt oss. Send oss en melding hvis du har spørsmål eller tilbakemeldinger.',
  features: 'Oversikt over alle funksjoner i NorskLeads. Se hva plattformen kan tilby.',
  pricing: 'Priser og abonnementsplaner. Velg planen som passer best for deg.',
  blog: 'Blogg med tips og triks om lead generation og salg i Norge.',
  docs: 'Teknisk dokumentasjon for utviklere og avanserte brukere.',
  guide: 'Kom i gang-guide. Lær hvordan du bruker NorskLeads steg for steg.',
  templates: 'Administrer e-postmaler. Opprett og gjenbruk maler for raskere kampanjer.',
  sequences: 'Automatiserte e-postsekvenser. Sett opp drip-kampanjer og oppfølginger.',
} as const;

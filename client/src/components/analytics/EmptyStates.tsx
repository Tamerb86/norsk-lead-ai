import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BarChart3,
  Mail,
  Users,
  TrendingUp,
  Rocket,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  PieChart,
  LineChart,
  Calendar,
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  tips?: string[];
}

export function EmptyState({ title, description, icon, actionLabel, actionHref, tips }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-4">{description}</p>
      {tips && tips.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4 max-w-sm">
          <p className="text-xs font-medium text-blue-800 mb-1">💡 Tips:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            {tips.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600">
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// Empty state for the entire Analytics page when no data exists
export function AnalyticsEmptyState() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/30">
        <CardContent className="pt-12 pb-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Ingen data å vise ennå
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-8">
              Start med å opprette din første kampanje for å se detaljert analyse av e-postytelse, 
              lead-engasjement og konverteringsrater.
            </p>

            {/* Quick Start Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-medium text-slate-900 text-sm mb-1">1. Finn leads</h4>
                <p className="text-xs text-slate-500">Søk og filtrer bedrifter</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-medium text-slate-900 text-sm mb-1">2. Opprett kampanje</h4>
                <p className="text-xs text-slate-500">Send personlige e-poster</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                </div>
                <h4 className="font-medium text-slate-900 text-sm mb-1">3. Følg med</h4>
                <p className="text-xs text-slate-500">Se resultater her</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search">
                <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Users className="w-4 h-4" />
                  Finn leads
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Opprett kampanje
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Empty state for campaign performance chart
export function CampaignChartEmptyState() {
  return (
    <EmptyState
      title="Ingen kampanjedata"
      description="Når du sender e-poster, vil du se åpningsrater, klikk og svar over tid her."
      icon={<LineChart className="w-8 h-8 text-indigo-500" />}
      actionLabel="Opprett kampanje"
      actionHref="/campaigns"
      tips={[
        "Send minst én kampanje for å se trender",
        "Data oppdateres i sanntid",
      ]}
    />
  );
}

// Empty state for lead distribution pie chart
export function LeadDistributionEmptyState() {
  return (
    <EmptyState
      title="Ingen leads ennå"
      description="Legg til leads i kampanjene dine for å se statusfordeling."
      icon={<PieChart className="w-8 h-8 text-purple-500" />}
      actionLabel="Søk bedrifter"
      actionHref="/search"
    />
  );
}

// Empty state for industry chart
export function IndustryChartEmptyState() {
  return (
    <EmptyState
      title="Ingen bransjedata"
      description="Når du har leads fra ulike bransjer, vil du se fordelingen her."
      icon={<BarChart3 className="w-8 h-8 text-pink-500" />}
    />
  );
}

// Empty state for heatmap
export function HeatmapEmptyState() {
  return (
    <EmptyState
      title="Ikke nok data"
      description="Send flere e-poster for å se hvilke tidspunkter som gir best engasjement."
      icon={<Clock className="w-8 h-8 text-amber-500" />}
      tips={[
        "Beste sendetider varierer etter bransje",
        "Prøv å sende på ulike dager og tidspunkter",
      ]}
    />
  );
}

// Empty state for top performers
export function TopPerformersEmptyState() {
  return (
    <EmptyState
      title="Ingen toppresultater ennå"
      description="Dine beste kampanjer og bransjer vil vises her etter hvert som du samler data."
      icon={<Target className="w-8 h-8 text-green-500" />}
      actionLabel="Start din første kampanje"
      actionHref="/campaigns"
    />
  );
}

// Compact empty state for cards
export function CompactEmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default EmptyState;

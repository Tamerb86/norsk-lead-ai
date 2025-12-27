import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  Play,
  FileText,
  Mail,
  Users,
  BarChart3,
  Settings
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function Guide() {
  const guides = [
    {
      id: "1",
      icon: Search,
      title: "Kom i gang med NorskLeads",
      description: "Lær det grunnleggende om NorskLeads og hvordan du setter opp kontoen din.",
      steps: ["Opprett konto", "Utforsk dashboardet", "Gjør ditt første søk", "Lagre leads"],
      duration: "10 min",
      level: "Nybegynner",
    },
    {
      id: "2",
      icon: FileText,
      title: "Avansert bedriftssøk",
      description: "Mestre søkefunksjonene for å finne de mest relevante bedriftene.",
      steps: ["Bruk filtre effektivt", "Kombiner søkekriterier", "Lagre søk", "Eksporter resultater"],
      duration: "15 min",
      level: "Middels",
    },
    {
      id: "3",
      icon: Mail,
      title: "E-postkampanjer fra A til Å",
      description: "Opprett og send effektive e-postkampanjer til dine leads.",
      steps: ["Opprett mal", "Velg mottakere", "Personaliser innhold", "Send og spor"],
      duration: "20 min",
      level: "Middels",
    },
    {
      id: "4",
      icon: Users,
      title: "Automatiserte sekvenser",
      description: "Sett opp automatiske oppfølgingssekvenser for bedre konvertering.",
      steps: ["Planlegg sekvens", "Skriv e-poster", "Sett forsinkelser", "Aktiver og overvåk"],
      duration: "25 min",
      level: "Avansert",
    },
    {
      id: "5",
      icon: BarChart3,
      title: "Analyse og rapportering",
      description: "Forstå dine resultater og optimaliser kampanjene dine.",
      steps: ["Les dashboardet", "Analyser åpningsrate", "Spor konverteringer", "Lag rapporter"],
      duration: "15 min",
      level: "Middels",
    },
    {
      id: "6",
      icon: Settings,
      title: "Integrasjoner og API",
      description: "Koble NorskLeads til dine andre verktøy og systemer.",
      steps: ["Utforsk integrasjoner", "Sett opp webhook", "Bruk API", "Automatiser workflows"],
      duration: "30 min",
      level: "Avansert",
    },
  ];

  const quickTips = [
    "Start med et smalt søk og utvid gradvis for bedre resultater",
    "Bruk dynamiske variabler i e-poster for høyere svarprosent",
    "Test ulike emnelinjer for å finne hva som fungerer best",
    "Følg opp leads innen 48 timer for best konvertering",
    "Segmenter listene dine basert på bransje og størrelse",
    "Analyser resultatene ukentlig og juster strategien",
  ];

  return (
    <>
      <SEOHead
        title="Brukerveiledning - Lær å bruke NorskLeads"
        description="Komplett brukerveiledning for NorskLeads. Lær å søke etter bedrifter, sende e-postkampanjer, sette opp automatisering og mer. Steg-for-steg guider."
        keywords="norskleads guide, brukerveiledning, hvordan bruke leadgenerering, b2b tutorial, e-postkampanje guide"
        canonicalUrl="https://lead.nexifyhub.no/guide"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Hvordan bruke NorskLeads for B2B leadgenerering",
          "description": "Komplett guide for å komme i gang med NorskLeads",
          "step": guides.map((guide, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": guide.title,
            "text": guide.description
          }))
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">NorskLeads</h1>
                  <p className="text-xs text-gray-600">Finn dine neste kunder</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Logg inn</Button>
              </Link>
              <Link href="/register">
                <Button>Kom i gang gratis</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs />
        </div>

        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Brukerveiledning</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Lær å bruke{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                NorskLeads
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Steg-for-steg guider som hjelper deg å få mest mulig ut av plattformen
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg">
                <Play className="w-5 h-5 mr-2" />
                Se introduksjonsvideo
              </Button>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Start gratis prøveperiode
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Guides Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Velg en guide</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {guides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <Card key={guide.id} className="hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          guide.level === "Nybegynner" ? "bg-green-100 text-green-700" :
                          guide.level === "Middels" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {guide.level}
                        </span>
                        <span className="text-xs text-gray-500">{guide.duration}</span>
                      </div>
                      <CardTitle className="text-xl">{guide.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{guide.description}</p>
                      <ul className="space-y-2 mb-4">
                        {guide.steps.map((step, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                      <Button variant="outline" className="w-full">
                        Start guide <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Tips */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Raske tips</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Enkle tips som kan forbedre resultatene dine umiddelbart
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {quickTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Klar til å komme i gang?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Opprett en gratis konto og start å finne leads i dag.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-10 py-6">
                Start gratis prøveperiode
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 border-t py-12">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600">
            <p>&copy; 2024 NorskLeads by Nexify CRM Systems AS. Laget med ❤️ i Norge.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

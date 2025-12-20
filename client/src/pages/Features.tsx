import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Search,
  Mail,
  Users,
  BarChart3,
  FileText,
  Zap,
  Database,
  Target,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Search,
      title: "Intelligent Bedriftssøk",
      description:
        "Søk blant 1,1 millioner norske bedrifter med avanserte filtre. Finn dine ideelle kunder basert på bransje, størrelse, lokasjon og mer.",
      benefits: [
        "40+ næringskoder",
        "Organisasjonsform filtrering",
        "Antall ansatte",
        "Stiftelsesdato",
      ],
    },
    {
      icon: Mail,
      title: "E-postkampanjer",
      description:
        "Send personaliserte e-postkampanjer til utvalgte bedrifter. Bruk dynamiske variabler for å tilpasse hver melding.",
      benefits: [
        "Dynamiske variabler",
        "E-postmaler",
        "Sporing av åpninger",
        "Klikkrate analyse",
      ],
    },
    {
      icon: Zap,
      title: "Automatiserte Sekvenser",
      description:
        "Opprett flertrinns e-postsekvenser med automatisk oppfølging. Sett forsinkelser og stopp ved svar.",
      benefits: [
        "Flertrinns sekvenser",
        "Automatisk oppfølging",
        "Forsinkelser mellom trinn",
        "Stopp ved svar",
      ],
    },
    {
      icon: Users,
      title: "Leads-styring",
      description:
        "Drag-and-drop Kanban-board for å spore status på alle potensielle kunder. Flytt leads gjennom salgsprosessen.",
      benefits: [
        "Kanban-board",
        "Drag-and-drop",
        "Bulkoperasjoner",
        "Status tracking",
      ],
    },
    {
      icon: BarChart3,
      title: "Avansert Analyse",
      description:
        "Få innsikt i kampanjeytelse, leads-analyse per bransje, og engagement heatmap for å optimalisere strategien.",
      benefits: [
        "Kampanjeytelse",
        "Leads-analyse",
        "Engagement heatmap",
        "Top performers",
      ],
    },
    {
      icon: FileText,
      title: "E-postmaler",
      description:
        "Bruk ferdige maler eller lag dine egne. Spar tid med gjenbrukbare maler for ulike kampanjer.",
      benefits: [
        "Ferdige maler",
        "Egendefinerte maler",
        "Dynamiske variabler",
        "Malbibliotek",
      ],
    },
    {
      icon: Database,
      title: "Brønnøysundregistrene",
      description:
        "Tilgang til oppdaterte data fra Brønnøysundregistrene. Alltid nøyaktig og pålitelig informasjon.",
      benefits: [
        "1,1M bedrifter",
        "Oppdatert data",
        "Nøyaktig informasjon",
        "GDPR-kompatibel",
      ],
    },
    {
      icon: Target,
      title: "Smart Targeting",
      description:
        "Bruk AI-drevet targeting for å finne de mest relevante kundene. Optimaliser kampanjene dine.",
      benefits: [
        "AI-drevet",
        "Relevante kunder",
        "Optimalisering",
        "Høyere konvertering",
      ],
    },
    {
      icon: TrendingUp,
      title: "ROI Tracking",
      description:
        "Spor avkastning på investering for hver kampanje. Se hvilke strategier som fungerer best.",
      benefits: [
        "ROI beregning",
        "Kampanje sammenligning",
        "Kostnad per lead",
        "Konverteringsrate",
      ],
    },
  ];

  const additionalFeatures = [
    {
      icon: Shield,
      title: "GDPR-kompatibel",
      description: "100% sikker håndtering av persondata i henhold til norsk lov.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Vi er her for deg når du trenger hjelp, hele døgnet.",
    },
    {
      icon: Zap,
      title: "Rask oppstart",
      description: "Kom i gang på 5 minutter. Ingen komplisert oppsett.",
    },
  ];

  return (
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
            <Link href="/dashboard">
              <Button>Kom i gang gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Alle funksjoner du trenger for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              B2B-suksess
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            NorskLeads gir deg alle verktøyene du trenger for å finne, kontakte og konvertere
            norske bedrifter til betalende kunder.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-10 py-6">
              Start gratis prøveperiode
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Og mye mer...</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Klar til å prøve NorskLeads?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start din gratis prøveperiode i dag. Ingen kredittkort påkrevd.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-6">
              Kom i gang gratis
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
  );
}

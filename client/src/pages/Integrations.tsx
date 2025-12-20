import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, CheckCircle2, Zap } from "lucide-react";

export default function Integrations() {
  const integrations = [
    {
      name: "Salesforce",
      description: "Synkroniser leads og kontakter automatisk med Salesforce CRM.",
      logo: "🔷",
      status: "Kommer snart",
      category: "CRM",
    },
    {
      name: "HubSpot",
      description: "Integrer med HubSpot for sømløs lead-håndtering.",
      logo: "🟠",
      status: "Kommer snart",
      category: "CRM",
    },
    {
      name: "Pipedrive",
      description: "Eksporter leads direkte til Pipedrive pipeline.",
      logo: "🟢",
      status: "Kommer snart",
      category: "CRM",
    },
    {
      name: "Slack",
      description: "Motta varsler om nye leads og kampanjer i Slack.",
      logo: "💬",
      status: "Kommer snart",
      category: "Kommunikasjon",
    },
    {
      name: "Zapier",
      description: "Koble NorskLeads til 5000+ apper via Zapier.",
      logo: "⚡",
      status: "Kommer snart",
      category: "Automatisering",
    },
    {
      name: "Google Sheets",
      description: "Eksporter data automatisk til Google Sheets.",
      logo: "📊",
      status: "Kommer snart",
      category: "Produktivitet",
    },
    {
      name: "Mailchimp",
      description: "Synkroniser e-postlister med Mailchimp.",
      logo: "🐵",
      status: "Kommer snart",
      category: "E-postmarkedsføring",
    },
    {
      name: "ActiveCampaign",
      description: "Integrer med ActiveCampaign for avansert automatisering.",
      logo: "📧",
      status: "Kommer snart",
      category: "E-postmarkedsføring",
    },
    {
      name: "Webhook API",
      description: "Bygg egne integrasjoner med vårt Webhook API.",
      logo: "🔗",
      status: "Tilgjengelig",
      category: "Utviklere",
    },
  ];

  const categories = ["Alle", "CRM", "E-postmarkedsføring", "Kommunikasjon", "Automatisering", "Produktivitet", "Utviklere"];

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
            Integrer med dine{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              favorittverktøy
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            NorskLeads fungerer sømløst med verktøyene du allerede bruker. Flere integrasjoner
            kommer snart!
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {integrations.map((integration, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{integration.logo}</div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      integration.status === "Tilgjengelig"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {integration.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{integration.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{integration.category}</span>
                  {integration.status === "Tilgjengelig" && (
                    <Button size="sm" variant="outline">
                      Koble til
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Trenger du en custom integrasjon?</h2>
              <p className="text-xl text-gray-600 mb-8">
                Vårt API gir deg full tilgang til NorskLeads-plattformen. Bygg egne
                integrasjoner eller kontakt oss for hjelp.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/docs">
                  <Button size="lg">Se API-dokumentasjon</Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Kontakt oss
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Hvorfor bruke integrasjoner?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Spar tid</h3>
              <p className="text-gray-600">
                Automatiser dataflyt mellom verktøy og eliminer manuelt arbeid.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Øk produktiviteten</h3>
              <p className="text-gray-600">
                Hold alle verktøyene dine synkronisert og oppdatert i sanntid.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Bedre innsikt</h3>
              <p className="text-gray-600">
                Kombiner data fra flere kilder for bedre beslutninger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Klar til å koble til?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start din gratis prøveperiode og utforsk alle integrasjoner.
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

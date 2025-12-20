import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, Code, Book, Zap, Shield, Database } from "lucide-react";

export default function Docs() {
  const sections = [
    {
      icon: Book,
      title: "API Oversikt",
      description: "Kom i gang med NorskLeads API",
      topics: [
        "Autentisering",
        "Rate limits",
        "Feilhåndtering",
        "Webhooks",
      ],
    },
    {
      icon: Code,
      title: "Endpoints",
      description: "Alle tilgjengelige API endpoints",
      topics: [
        "Søk bedrifter",
        "Kampanjer",
        "Leads",
        "Analyse",
      ],
    },
    {
      icon: Database,
      title: "Data Modeller",
      description: "Forstå datastrukturene",
      topics: [
        "Company object",
        "Campaign object",
        "Lead object",
        "User object",
      ],
    },
    {
      icon: Zap,
      title: "Eksempler",
      description: "Kodeeksempler og brukstilfeller",
      topics: [
        "Python",
        "JavaScript/Node.js",
        "cURL",
        "Postman collection",
      ],
    },
    {
      icon: Shield,
      title: "Sikkerhet",
      description: "Best practices for sikkerhet",
      topics: [
        "API nøkler",
        "OAuth 2.0",
        "HTTPS",
        "Data kryptering",
      ],
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
            API{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dokumentasjon
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Alt du trenger for å integrere NorskLeads i dine applikasjoner
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">Kom i gang</Button>
            <Button size="lg" variant="outline">
              Se eksempler
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">Quick Start</h2>
            <Card className="p-8 bg-gray-900 text-white">
              <pre className="overflow-x-auto">
                <code>{`# Installer NorskLeads SDK
npm install @norskleads/sdk

# Importer og initialiser
import { NorskLeads } from '@norskleads/sdk';

const client = new NorskLeads({
  apiKey: 'your_api_key_here'
});

# Søk etter bedrifter
const companies = await client.companies.search({
  industry: 'IT',
  employees: { min: 10, max: 50 },
  location: 'Oslo'
});

console.log(companies);`}</code>
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Utforsk dokumentasjonen</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sections.map((section, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <section.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{section.title}</h3>
                <p className="text-gray-600 mb-6">{section.description}</p>
                <ul className="space-y-2">
                  {section.topics.map((topic, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-blue-600 hover:underline text-sm">
                        {topic}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Trenger du hjelp?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Vårt team er her for å hjelpe deg med integrasjonen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Kontakt support
              </Button>
            </Link>
            <Link href="/help">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Besøk hjelpesenter
              </Button>
            </Link>
          </div>
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

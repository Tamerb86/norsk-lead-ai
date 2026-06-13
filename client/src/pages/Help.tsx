import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, Book, MessageCircle, Mail, HelpCircle } from "lucide-react";
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: Book,
      title: "Kom i gang",
      description: "Lær det grunnleggende om NorskLeads",
      articles: [
        "Hvordan opprette en konto",
        "Din første kampanje",
        "Søke etter bedrifter",
        "Forstå dashboardet",
      ],
    },
    {
      icon: Mail,
      title: "E-postkampanjer",
      description: "Alt om å sende kampanjer",
      articles: [
        "Opprette en kampanje",
        "Bruke e-postmaler",
        "Spore åpninger og klikk",
        "Best practices for e-post",
      ],
    },
    {
      icon: HelpCircle,
      title: "Vanlige spørsmål",
      description: "Svar på ofte stilte spørsmål",
      articles: [
        "Priser og fakturering",
        "GDPR og personvern",
        "Integrasjoner",
        "Teknisk support",
      ],
    },
  ];

  return (
    <>
      <SEOHead
        title="Hjelp og support - NorskLeads"
        description="Få hjelp med NorskLeads. Finn svar på vanlige spørsmål, lær å bruke plattformen, og kontakt vårt supportteam."
        keywords="norskleads hjelp, support, faq, vanlige spørsmål, brukerveiledning"
        canonicalUrl="https://lead.nexifyhub.no/help"
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
            <Link href="/dashboard">
              <Button>Kom i gang gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Hvordan kan vi{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              hjelpe deg?
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Søk i vår kunnskapsbase eller utforsk kategoriene nedenfor
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Søk etter hjelp..."
                className="pl-12 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {categories.map((category, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                <p className="text-gray-600 mb-6">{category.description}</p>
                <ul className="space-y-3">
                  {category.articles.map((article, idx) => (
                    <li key={idx}>
                      <a
                        href="#"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Fant du ikke det du lette etter?</h2>
              <p className="text-xl text-gray-600 mb-8">
                Vårt supportteam er klare til å hjelpe deg. Kontakt oss via chat eller e-post.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">Start live chat</Button>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Send e-post
                  </Button>
                </Link>
              </div>
            </Card>
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
    </>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { 
  Search, 
  Building2, 
  Factory, 
  Briefcase, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Users
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

interface IndustryData {
  name: string;
  slug: string;
  description: string;
  companyCount: string;
  subIndustries: string[];
  benefits: string[];
  stats: {
    avgRevenue: string;
    avgEmployees: string;
    growthRate: string;
  };
}

const industryData: Record<string, IndustryData> = {
  "bygg-og-anlegg": {
    name: "Bygg og anlegg",
    slug: "bygg-og-anlegg",
    description: "Norges største bransje med tusenvis av entreprenører, håndverkere og leverandører. Finn byggefirmaer, rørleggere, elektrikere og mer.",
    companyCount: "85,000+",
    subIndustries: ["Entreprenører", "Rørleggere", "Elektrikere", "Malere", "Snekkere", "Arkitekter"],
    benefits: [
      "Finn underleverandører og samarbeidspartnere",
      "Nå ut til beslutningstakere i byggeprosjekter",
      "Identifiser nye byggefirmaer i din region",
      "Eksporter kontaktlister for direkte markedsføring"
    ],
    stats: {
      avgRevenue: "8.5M NOK",
      avgEmployees: "12",
      growthRate: "+4.2%"
    }
  },
  "it-og-teknologi": {
    name: "IT og teknologi",
    slug: "it-og-teknologi",
    description: "Norges raskest voksende sektor med programvareutvikling, IT-konsulenter, og tech-startups. Finn din neste teknologipartner.",
    companyCount: "45,000+",
    subIndustries: ["Programvareutvikling", "IT-konsulenter", "Cybersikkerhet", "Cloud-tjenester", "AI/ML", "Fintech"],
    benefits: [
      "Finn potensielle kunder for IT-løsninger",
      "Identifiser tech-startups for investering",
      "Nå ut til IT-ledere og CTOer",
      "Bygg partnerskap med andre tech-selskaper"
    ],
    stats: {
      avgRevenue: "12M NOK",
      avgEmployees: "8",
      growthRate: "+12.5%"
    }
  },
  "handel": {
    name: "Handel",
    slug: "handel",
    description: "Detaljhandel og engroshandel i Norge. Finn butikker, nettbutikker, grossister og distributører i hele landet.",
    companyCount: "120,000+",
    subIndustries: ["Detaljhandel", "Engroshandel", "E-handel", "Import/Eksport", "Dagligvare", "Mote og klær"],
    benefits: [
      "Finn forhandlere for dine produkter",
      "Identifiser potensielle samarbeidspartnere",
      "Nå ut til innkjøpssjefer og butikkeiere",
      "Bygg distribusjonsnettverket ditt"
    ],
    stats: {
      avgRevenue: "15M NOK",
      avgEmployees: "6",
      growthRate: "+2.8%"
    }
  },
  "helse": {
    name: "Helse",
    slug: "helse",
    description: "Helsesektoren i Norge inkluderer klinikker, legekontor, tannleger, fysioterapeuter og helsetjenester.",
    companyCount: "35,000+",
    subIndustries: ["Legekontor", "Tannleger", "Fysioterapi", "Psykologi", "Apotek", "Hjemmehjelp"],
    benefits: [
      "Markedsfør medisinske produkter og tjenester",
      "Finn samarbeidspartnere i helsesektoren",
      "Nå ut til helsepersonell og klinikker",
      "Identifiser nye helsevirksomheter"
    ],
    stats: {
      avgRevenue: "5M NOK",
      avgEmployees: "4",
      growthRate: "+6.1%"
    }
  }
};

export default function IndustryLanding() {
  const params = useParams();
  const industrySlug = params.industry || "bygg-og-anlegg";
  const industry = industryData[industrySlug] || industryData["bygg-og-anlegg"];

  return (
    <>
      <SEOHead
        title={`${industry.name} - Finn ${industry.companyCount} bedrifter`}
        description={`Søk blant ${industry.companyCount} bedrifter innen ${industry.name.toLowerCase()} i Norge. ${industry.description}`}
        keywords={`${industry.name.toLowerCase()} bedrifter, ${industry.name.toLowerCase()} norge, leads ${industry.name.toLowerCase()}, b2b ${industry.name.toLowerCase()}`}
        canonicalUrl={`https://lead.nexifyhub.no/bransjer/${industrySlug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `Bedrifter innen ${industry.name} i Norge`,
          "description": industry.description,
          "numberOfItems": industry.companyCount,
          "itemListElement": industry.subIndustries.map((sub, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": sub
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
          <Breadcrumbs items={[
            { label: "Hjem", href: "/" },
            { label: "Bransjer", href: "/bransjer" },
            { label: industry.name }
          ]} />
        </div>

        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                <Factory className="w-5 h-5" />
                <span className="font-medium">Bransje</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6">
                Finn bedrifter innen{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {industry.name}
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {industry.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/search?bransje=${industry.name}`}>
                  <Button size="lg" className="text-lg px-8">
                    <Search className="w-5 h-5 mr-2" />
                    Søk i {industry.name}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Start gratis prøveperiode
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {industry.companyCount}
                  </div>
                  <div className="text-gray-600">Bedrifter i bransjen</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {industry.stats.avgEmployees}
                  </div>
                  <div className="text-gray-600">Gj.snitt ansatte</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {industry.stats.growthRate}
                  </div>
                  <div className="text-gray-600">Årlig vekst</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Sub-industries */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Underkategorier i {industry.name}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center max-w-3xl mx-auto">
              {industry.subIndustries.map((sub, index) => (
                <Link key={index} href={`/search?bransje=${sub}`}>
                  <Button variant="outline" size="lg" className="text-lg">
                    {sub}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Hvorfor bruke NorskLeads for {industry.name}?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {industry.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Other Industries */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Utforsk andre bransjer
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {Object.entries(industryData)
                .filter(([slug]) => slug !== industrySlug)
                .map(([slug, data]) => (
                  <Link key={slug} href={`/bransjer/${slug}`}>
                    <Button variant="outline">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {data.name}
                    </Button>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Klar til å finne kunder i {industry.name}?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start gratis og få tilgang til {industry.companyCount} bedrifter i dag.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-10 py-6">
                Opprett gratis konto
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

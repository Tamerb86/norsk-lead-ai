import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { 
  Search, 
  Building2, 
  MapPin, 
  Users, 
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { SEOHead, structuredDataGenerators } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

interface CityData {
  name: string;
  region: string;
  description: string;
  companyCount: string;
  topIndustries: string[];
  stats: {
    totalCompanies: string;
    newCompanies: string;
    avgEmployees: string;
  };
}

const cityData: Record<string, CityData> = {
  oslo: {
    name: "Oslo",
    region: "Oslo",
    description: "Norges hovedstad og største by med et mangfoldig næringsliv. Oslo er hjem til mange av landets største bedrifter og startups.",
    companyCount: "150,000+",
    topIndustries: ["IT og teknologi", "Finans", "Konsulentvirksomhet", "Handel", "Media"],
    stats: {
      totalCompanies: "152,847",
      newCompanies: "12,500",
      avgEmployees: "8.5",
    },
  },
  bergen: {
    name: "Bergen",
    region: "Vestland",
    description: "Norges nest største by med sterke tradisjoner innen sjøfart, fiskeri og energi. Bergen har et voksende tech-miljø.",
    companyCount: "45,000+",
    topIndustries: ["Maritim", "Energi", "Fiskeri", "Turisme", "IT"],
    stats: {
      totalCompanies: "46,234",
      newCompanies: "3,800",
      avgEmployees: "6.2",
    },
  },
  trondheim: {
    name: "Trondheim",
    region: "Trøndelag",
    description: "Teknologihovedstaden i Norge med NTNU og SINTEF. Sterk på forskning, innovasjon og teknologibedrifter.",
    companyCount: "28,000+",
    topIndustries: ["Teknologi", "Forskning", "Utdanning", "Helse", "Energi"],
    stats: {
      totalCompanies: "28,456",
      newCompanies: "2,400",
      avgEmployees: "5.8",
    },
  },
  stavanger: {
    name: "Stavanger",
    region: "Rogaland",
    description: "Oljehovedstaden i Norge med sterke bånd til energisektoren. Stavanger har også et voksende tech- og gründermiljø.",
    companyCount: "32,000+",
    topIndustries: ["Olje og gass", "Energi", "Engineering", "IT", "Finans"],
    stats: {
      totalCompanies: "32,891",
      newCompanies: "2,100",
      avgEmployees: "7.4",
    },
  },
  kristiansand: {
    name: "Kristiansand",
    region: "Agder",
    description: "Sørlandets største by med et variert næringsliv. Sterk på prosessindustri, teknologi og turisme.",
    companyCount: "15,000+",
    topIndustries: ["Prosessindustri", "Teknologi", "Handel", "Turisme", "Bygg"],
    stats: {
      totalCompanies: "15,234",
      newCompanies: "1,200",
      avgEmployees: "5.1",
    },
  },
  drammen: {
    name: "Drammen",
    region: "Viken",
    description: "Strategisk plassert mellom Oslo og Vestlandet. Drammen har et sterkt næringsliv innen logistikk og industri.",
    companyCount: "12,000+",
    topIndustries: ["Logistikk", "Industri", "Handel", "Bygg", "Transport"],
    stats: {
      totalCompanies: "12,567",
      newCompanies: "980",
      avgEmployees: "4.8",
    },
  },
  tromso: {
    name: "Tromsø",
    region: "Troms og Finnmark",
    description: "Nordens Paris og porten til Arktis. Tromsø er sentral for forskning, fiskeri og arktisk næringsliv.",
    companyCount: "8,000+",
    topIndustries: ["Fiskeri", "Forskning", "Turisme", "Helse", "Utdanning"],
    stats: {
      totalCompanies: "8,234",
      newCompanies: "650",
      avgEmployees: "4.2",
    },
  },
};

export default function CityLanding() {
  const params = useParams();
  const citySlug = params.city || "oslo";
  const city = cityData[citySlug] || cityData.oslo;

  const benefits = [
    "Tilgang til alle bedrifter i " + city.name,
    "Oppdatert kontaktinformasjon",
    "Filtrering på bransje og størrelse",
    "Eksport til Excel/CSV",
    "E-postkampanjer direkte fra plattformen",
    "GDPR-kompatibel databehandling",
  ];

  return (
    <>
      <SEOHead
        title={`Finn bedrifter i ${city.name} - ${city.companyCount} bedrifter`}
        description={`Søk blant ${city.companyCount} bedrifter i ${city.name}. Finn kontaktinformasjon, e-poster og telefonnumre. ${city.description}`}
        keywords={`bedrifter ${city.name.toLowerCase()}, leads ${city.name.toLowerCase()}, b2b ${city.name.toLowerCase()}, bedriftsdatabase ${city.region.toLowerCase()}`}
        canonicalUrl={`https://lead.nexifyhub.no/bedrifter/${citySlug}`}
        structuredData={structuredDataGenerators.localBusiness(city.name, city.region)}
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
            { label: "Bedrifter", href: "/bedrifter" },
            { label: city.name }
          ]} />
        </div>

        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{city.region}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6">
                Finn bedrifter i{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {city.name}
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {city.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/search?kommune=${city.name}`}>
                  <Button size="lg" className="text-lg px-8">
                    <Search className="w-5 h-5 mr-2" />
                    Søk i {city.name}
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
                    {city.stats.totalCompanies}
                  </div>
                  <div className="text-gray-600">Registrerte bedrifter</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {city.stats.newCompanies}
                  </div>
                  <div className="text-gray-600">Nye bedrifter siste år</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {city.stats.avgEmployees}
                  </div>
                  <div className="text-gray-600">Gj.snitt ansatte</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Top Industries */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Største bransjer i {city.name}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center max-w-3xl mx-auto">
              {city.topIndustries.map((industry, index) => (
                <Link key={index} href={`/search?kommune=${city.name}&bransje=${industry}`}>
                  <Button variant="outline" size="lg" className="text-lg">
                    {industry}
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
                Hvorfor bruke NorskLeads for {city.name}?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Other Cities */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Utforsk andre byer
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {Object.entries(cityData)
                .filter(([slug]) => slug !== citySlug)
                .map(([slug, data]) => (
                  <Link key={slug} href={`/bedrifter/${slug}`}>
                    <Button variant="outline">
                      <MapPin className="w-4 h-4 mr-2" />
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
              Klar til å finne kunder i {city.name}?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start gratis og få tilgang til {city.companyCount} bedrifter i dag.
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

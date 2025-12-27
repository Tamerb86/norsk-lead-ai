import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { SEOHead, structuredDataGenerators } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  slug: string;
}

export default function Blog() {
  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "Hvordan finne B2B-leads i Norge: En komplett guide",
      excerpt: "Lær de beste strategiene for å finne kvalifiserte B2B-leads i det norske markedet. Vi dekker alt fra bedriftssøk til e-postkampanjer.",
      date: "2024-12-20",
      readTime: "8 min",
      category: "Leadgenerering",
      slug: "hvordan-finne-b2b-leads-norge",
    },
    {
      id: "2",
      title: "5 tips for effektive kalde e-poster som får svar",
      excerpt: "Kalde e-poster trenger ikke å være ineffektive. Her er 5 beviste tips som øker svarprosenten din betydelig.",
      date: "2024-12-15",
      readTime: "6 min",
      category: "E-postmarkedsføring",
      slug: "tips-effektive-kalde-eposter",
    },
    {
      id: "3",
      title: "Bygg og anlegg: Slik finner du nye kunder i bransjen",
      excerpt: "Bygg- og anleggsbransjen i Norge er stor. Lær hvordan du kan identifisere og nå ut til potensielle kunder.",
      date: "2024-12-10",
      readTime: "7 min",
      category: "Bransjetips",
      slug: "bygg-anlegg-finn-kunder",
    },
    {
      id: "4",
      title: "GDPR og B2B-markedsføring: Hva du må vite",
      excerpt: "Forstå GDPR-regelverket og hvordan det påvirker din B2B-markedsføring i Norge. Unngå bøter og bygg tillit.",
      date: "2024-12-05",
      readTime: "10 min",
      category: "Compliance",
      slug: "gdpr-b2b-markedsforing",
    },
    {
      id: "5",
      title: "Automatisering av salgsutvikling: Fra lead til kunde",
      excerpt: "Spar tid og øk effektiviteten med automatiserte salgssekvenser. Se hvordan du setter opp en effektiv pipeline.",
      date: "2024-12-01",
      readTime: "9 min",
      category: "Automatisering",
      slug: "automatisering-salgsutvikling",
    },
    {
      id: "6",
      title: "Lokalt SEO for B2B-bedrifter i Norge",
      excerpt: "Optimaliser din online tilstedeværelse for lokale søk. Få flere leads fra bedrifter i ditt nærområde.",
      date: "2024-11-25",
      readTime: "7 min",
      category: "SEO",
      slug: "lokalt-seo-b2b-norge",
    },
  ];

  const categories = ["Alle", "Leadgenerering", "E-postmarkedsføring", "Bransjetips", "Compliance", "Automatisering", "SEO"];

  return (
    <>
      <SEOHead
        title="Blogg - Tips og guider for B2B leadgenerering"
        description="Les våre artikler om B2B leadgenerering, e-postmarkedsføring, salgsutvikling og mer. Få eksperttips for å vokse din bedrift i Norge."
        keywords="b2b blogg, leadgenerering tips, e-postmarkedsføring guide, salgsutvikling norge, b2b markedsføring"
        canonicalUrl="https://lead.nexifyhub.no/blog"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "NorskLeads Blogg",
          "description": "Tips og guider for B2B leadgenerering i Norge",
          "url": "https://lead.nexifyhub.no/blog",
          "publisher": {
            "@type": "Organization",
            "name": "NorskLeads"
          }
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
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              NorskLeads{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Blogg
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tips, guider og innsikt for å lykkes med B2B leadgenerering i Norge
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "Alle" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Tag className="w-16 h-16 text-blue-600/30" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString("nb-NO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-xl hover:text-blue-600 transition-colors">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm">
                          Les mer <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Få de nyeste tipsene rett i innboksen
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Meld deg på vårt nyhetsbrev og få ukentlige tips om B2B leadgenerering og salgsutvikling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Din e-postadresse"
                className="px-4 py-3 rounded-lg text-gray-900 flex-1"
              />
              <Button variant="secondary" size="lg">
                Abonner
              </Button>
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

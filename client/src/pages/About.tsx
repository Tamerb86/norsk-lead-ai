import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Building2, Mail, Phone, MapPin, Users, Target, Zap } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    NorskLeads
                  </h1>
                  <p className="text-xs text-gray-600">by Nexify CRM systems AS</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Kom i gang
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Om <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">NorskLeads</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Vi hjelper norske bedrifter med å finne sine neste kunder gjennom smart 
            lead generering og automatiserte salgsprosesser.
          </p>
        </div>

        {/* Company Info */}
        <Card className="max-w-4xl mx-auto mb-12">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Nexify CRM systems AS</h2>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Organisasjonsnummer</p>
                      <p>936300278</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Adresse</p>
                      <p>Oslo, Norge</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">E-post</p>
                      <p>kontakt@nexify.no</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Telefon</p>
                      <p>+47 XXX XX XXX</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Vår Visjon</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Vi tror at hver norsk bedrift fortjener tilgang til moderne verktøy for 
                  å vokse sin kundebase. NorskLeads er bygget spesifikt for det norske 
                  markedet, med full integrasjon mot Brønnøysundregistrene og støtte for 
                  norske betalingsløsninger.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Vår plattform kombinerer kraftig søketeknologi, intelligent automatisering, 
                  og brukervennlig design for å gjøre B2B-salg enklere og mer effektivt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Våre Verdier</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Kundefokus</h3>
                <p className="text-sm text-gray-600">
                  Vi setter alltid kundenes behov først og jobber kontinuerlig for å 
                  forbedre opplevelsen.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Presisjon</h3>
                <p className="text-sm text-gray-600">
                  Nøyaktige data og pålitelig teknologi er grunnlaget for alt vi gjør.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Innovasjon</h3>
                <p className="text-sm text-gray-600">
                  Vi utvikler stadig nye funksjoner for å holde deg foran konkurrentene.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="max-w-4xl mx-auto mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Hvorfor velge NorskLeads?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Norsk data, norske løsninger</h3>
                  <p className="text-gray-600">
                    Tilgang til hele det norske bedriftsregisteret med oppdatert informasjon 
                    fra Brønnøysundregistrene.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">GDPR-kompatibel</h3>
                  <p className="text-gray-600">
                    Full etterlevelse av personvernforordningen med datalagring i Norge/EU.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Enkel integrasjon</h3>
                  <p className="text-gray-600">
                    Støtte for Vipps, BankID, og andre norske betalings- og påloggingsløsninger.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Norsk kundeservice</h3>
                  <p className="text-gray-600">
                    Support på norsk fra folk som forstår det norske markedet.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Klar til å komme i gang?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Bli med tusenvis av norske bedrifter som bruker NorskLeads
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Start gratis prøveperiode
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">NorskLeads</span>
              </div>
              <p className="text-sm">
                by Nexify CRM systems AS<br />
                Org.nr: 936300278
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search">Søk bedrifter</Link></li>
                <li><Link href="/campaigns">Kampanjer</Link></li>
                <li><Link href="/leads">CRM</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Selskap</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about">Om oss</Link></li>
                <li><Link href="/privacy">Personvern</Link></li>
                <li><Link href="/terms">Vilkår</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm">
                <li>kontakt@nexify.no</li>
                <li>+47 XXX XX XXX</li>
                <li>Oslo, Norge</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2025 Nexify CRM systems AS. Alle rettigheter reservert.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

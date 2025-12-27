import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { Search, Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission
    toast.success("Takk for din henvendelse! Vi tar kontakt snart.");
    setFormData({ name: "", email: "", company: "", phone: "", message: "" });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "E-post",
      value: "support@norskleads.no",
      link: "mailto:support@norskleads.no",
    },
    {
      icon: Phone,
      title: "Telefon",
      value: "+47 XX XX XX XX",
      link: "tel:+47XXXXXXXX",
    },
    {
      icon: MapPin,
      title: "Adresse",
      value: "Oslo, Norge",
      link: null,
    },
    {
      icon: Clock,
      title: "Åpningstider",
      value: "Man-Fre: 09:00-17:00",
      link: null,
    },
  ];

  return (
    <>
      <SEOHead
        title="Kontakt oss - NorskLeads"
        description="Ta kontakt med NorskLeads-teamet. Vi er her for å hjelpe deg med B2B leadgenerering i Norge. Send oss en melding eller ring oss."
        keywords="kontakt norskleads, kundeservice, support, hjelp b2b leads"
        canonicalUrl="https://lead.nexifyhub.no/contact"
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

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Ta kontakt med{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              oss
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Vi er her for å hjelpe deg. Send oss en melding eller bruk kontaktinformasjonen
            nedenfor.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-6">Send oss en melding</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Navn *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ditt navn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">E-post *</label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="din@epost.no"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bedrift</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Din bedrift"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+47 XXX XX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Melding *</label>
                  <Textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Hvordan kan vi hjelpe deg?"
                    rows={6}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Send melding
                </Button>
              </form>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-6">Kontaktinformasjon</h2>
                <p className="text-gray-600 mb-8">
                  Du kan også nå oss direkte via e-post, telefon eller besøke vårt kontor.
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{info.title}</h3>
                        {info.link ? (
                          <a
                            href={info.link}
                            className="text-blue-600 hover:underline"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-gray-600">{info.value}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Live Chat CTA */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Trenger du hjelp nå?</h3>
                    <p className="text-gray-600 mb-4">
                      Start en live chat med vårt supportteam. Vi svarer vanligvis innen
                      få minutter.
                    </p>
                    <Button variant="outline">Start live chat</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Nexify CRM Systems AS</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Vi er et norsk selskap dedikert til å hjelpe bedrifter med å finne og konvertere
            leads. Vårt team har lang erfaring innen B2B-salg og markedsføring i Norge.
          </p>
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

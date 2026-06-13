import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion, useReducedMotion, type Easing } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { SEOHead, structuredDataGenerators } from "@/components/SEOHead";
import {
  Search,
  Mail,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Play,
  MessageCircle,
  Shield,
  Linkedin,
  Facebook,
  Twitter,
  Clock,
  Zap,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border pb-4">
      <button
        className="flex justify-between items-center w-full text-left py-4"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-medium text-lg text-foreground">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeOut" as Easing }}
        className="overflow-hidden"
      >
        <p className="text-muted-foreground pb-4">{answer}</p>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const reduce = useReducedMotion();
  const easeOut: Easing = "easeOut";

  // Gentle entrance reveal — fires on mount (deterministic; never leaves content
  // gated invisible the way scroll-triggered whileInView can), small offset,
  // short, ease-out, and fully collapses under reduced motion.
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.4, ease: easeOut, delay: reduce ? 0 : delay },
  });

  const openCrispChat = () => {
    if ((window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    }
  };

  // FAQ data for structured data
  const faqData = [
    { question: "Hva er NorskLeads?", answer: "NorskLeads er Norges ledende plattform for B2B leadgenerering. Vi gir deg tilgang til over 500,000 norske bedrifter med kontaktinformasjon." },
    { question: "Er det gratis å prøve?", answer: "Ja! Du kan starte med vår gratis plan som gir deg tilgang til 50 bedrifter per måned." },
    { question: "Hvordan finner jeg leads?", answer: "Bruk vårt avanserte søkeverktøy for å filtrere bedrifter etter bransje, lokasjon, størrelse og mer." },
    { question: "Kan jeg eksportere data?", answer: "Ja, du kan eksportere bedriftsdata til Excel eller CSV for bruk i ditt CRM-system." },
  ];

  return (
    <>
      <SEOHead
        title="Finn Bedriftskontakter i Norge - B2B Lead Generator"
        description="Norges ledende plattform for B2B leadgenerering. Søk blant 500,000+ norske bedrifter, finn kontaktinformasjon, og automatiser din salgsutvikling. Gratis prøveperiode!"
        keywords="leads norge, b2b leads, bedriftskontakter, salgsleads, leadgenerering, norske bedrifter, bedriftsdatabase, prospektering"
        canonicalUrl="https://lead.nexifyhub.no/"
        structuredData={structuredDataGenerators.faqPage(faqData)}
      />
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">NorskLeads</h1>
                <p className="text-xs text-muted-foreground">Finn dine neste kunder</p>
              </div>
            </div>
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#features">
              <Button variant="ghost">Funksjoner</Button>
            </a>
            <a href="#pricing">
              <Button variant="ghost">Priser</Button>
            </a>
            <Link href="/search">
              <Button variant="ghost">Søk bedrifter</Button>
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">
                    <User className="w-4 h-4 mr-2" />
                    {user.name || user.email}
                  </Button>
                </Link>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logg ut
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Logg inn</Button>
                </Link>
                <Link href="/register">
                  <Button>
                    Kom i gang gratis <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-background z-40 border-b border-border shadow-sm">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-lg">
                Søk bedrifter
              </Button>
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
                    <User className="w-5 h-5 mr-2" />
                    {user.name || user.email}
                  </Button>
                </Link>
                <Button variant="outline" className="w-full text-lg" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="w-5 h-5 mr-2" />
                  Logg ut
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
                    Logg inn
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full text-lg">
                    Kom i gang gratis <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 lg:pr-12">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: easeOut }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-full text-sm font-medium text-foreground"
              >
                <span className="text-xl" aria-hidden="true">🇳🇴</span>
                <span>Laget for det norske markedet</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.05, duration: reduce ? 0 : 0.4, ease: easeOut }}
                className="font-bold leading-[1.08] tracking-tight text-balance text-foreground"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
              >
                Finn dine neste kunder i{" "}
                <span className="text-primary">Norge</span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.1, duration: reduce ? 0 : 0.4, ease: easeOut }}
                className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl"
              >
                Tilgang til <span className="font-semibold text-foreground">1.1 millioner</span> norske
                bedrifter. Søk, filtrer, og send personaliserte e-postkampanjer
                til dine ideelle B2B-kunder.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.15, duration: reduce ? 0 : 0.4, ease: easeOut }}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    Start gratis prøveperiode <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <Play className="mr-2 w-5 h-5" />
                  Se hvordan det virker
                </Button>
              </motion.div>

              {/* Trust Signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.2, duration: reduce ? 0 : 0.4, ease: easeOut }}
                className="flex flex-wrap gap-3 pt-4 text-sm"
              >
                <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-foreground">Ingen kredittkort påkrevd</span>
                </div>
                <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-foreground">14 dagers gratis prøveperiode</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.2, duration: reduce ? 0 : 0.4, ease: easeOut }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative">
                {/* Main Screenshot with Video Overlay */}
                <button
                  type="button"
                  className="block w-full rounded-2xl overflow-hidden border border-border shadow-lg cursor-pointer group text-left"
                  onClick={() => setIsVideoOpen(true)}
                  aria-label="Spill av demovideo"
                >
                  <img
                    src="/dashboard-screenshot.webp"
                    alt="NorskLeads Dashboard"
                    className="w-full block"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-md transition-colors group-hover:bg-primary/90">
                      <Play className="w-8 h-8 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </button>

                {/* Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.35, duration: reduce ? 0 : 0.4, ease: easeOut }}
                  className="absolute -bottom-5 -left-5 bg-card border border-border p-5 rounded-xl shadow-sm"
                >
                  <div className="text-sm text-muted-foreground mb-1">Aktive kampanjer</div>
                  <div className="text-2xl font-semibold text-foreground">247</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.45, duration: reduce ? 0 : 0.4, ease: easeOut }}
                  className="absolute -top-5 -right-5 bg-card border border-border p-5 rounded-xl shadow-sm"
                >
                  <div className="text-sm text-muted-foreground mb-1">Åpningsrate</div>
                  <div className="text-2xl font-semibold text-green-600">68%</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why NorskLeads Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div {...reveal()} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-balance text-foreground">
              Hvorfor NorskLeads er <span className="text-primary">så viktig</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Norske B2B-selgere kaster bort tid og penger hver dag
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Problem 1: Time Waste */}
            <motion.div {...reveal(0.05)}>
              <div className="bg-card border border-border shadow-sm text-center p-8 rounded-2xl h-full transition-shadow hover:shadow-md">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-3xl font-semibold mb-3 text-foreground">
                  20+ timer/uke
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  kastet bort på manuell prospektering i stedet for salg
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-destructive font-semibold">
                    = kr 40 000/mnd i tapt tid
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Problem 2: Lost Leads */}
            <motion.div {...reveal(0.1)}>
              <div className="bg-card border border-border shadow-sm text-center p-8 rounded-2xl h-full transition-shadow hover:shadow-md">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-3xl font-semibold mb-3 text-foreground">
                  70% tapt
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  av potensielle kunder forsvinner uten systematisk oppfølging
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-destructive font-semibold">
                    = kr 100 000+ i tapt omsetning
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Solution: NorskLeads */}
            <motion.div {...reveal(0.15)}>
              <div className="bg-card border border-primary shadow-sm text-center p-8 rounded-2xl h-full transition-shadow hover:shadow-md">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-3xl font-semibold mb-3 text-foreground">
                  3x høyere
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  konverteringsrate med NorskLeads vs. manuell prospektering
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-green-600 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Spar tid. Øk salg. Voks raskere.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div {...reveal(0.2)} className="text-center mt-14">
            <p className="text-lg text-foreground mb-6">
              <strong className="font-semibold">Løsningen:</strong> Alt du trenger på én plattform - fra prospektering til lukket salg
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="text-base px-8">
                Start gratis i dag <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Real Screenshots Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...reveal()} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-balance text-foreground">
              Alt du trenger for å <span className="text-primary">finne kunder</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Kraftige verktøy for å søke, kontakte og følge opp potensielle kunder
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Search Feature */}
            <motion.div {...reveal()} className="space-y-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl">
                <Search className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold text-foreground">Avansert søk</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Søk blant <span className="font-semibold text-foreground">1.1 millioner</span> norske bedrifter med kraftige filtre.
                Finn bedrifter etter fylke, kommune, næringskode, antall
                ansatte, og mer.
              </p>
              <img
                src="/search-screenshot.webp"
                alt="Søk i norske bedrifter"
                className="rounded-2xl shadow-sm border border-border w-full"
              />
            </motion.div>

            {/* Kanban Feature */}
            <motion.div {...reveal(0.1)} className="space-y-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl">
                <Users className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold text-foreground">Administrer leads</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Organiser dine leads i et visuelt Kanban-board. Dra og slipp
                for å oppdatere status automatisk. Hold oversikt over alle
                potensielle kunder.
              </p>
              <img
                src="/leads-screenshot.webp"
                alt="Kanban board for leads"
                className="rounded-2xl shadow-sm border border-border w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div {...reveal()} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-balance text-foreground">Hvorfor NorskLeads?</h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Alt du trenger for å lykkes med B2B-salg i Norge
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Mail,
                title: "E-postkampanjer",
                description:
                  "Send personaliserte e-poster med dynamiske variabler. Automatiske oppfølginger og tracking.",
              },
              {
                icon: BarChart3,
                title: "Avansert analyse",
                description:
                  "Følg med på åpningsrate, klikkrate, og svarrate. Optimaliser kampanjene dine basert på data.",
              },
              {
                icon: Zap,
                title: "AI-drevet automatisering",
                description:
                  "La AI hjelpe deg med å skrive bedre e-poster og finne de beste tidspunktene å sende.",
              },
            ].map((feature, index) => (
              <motion.div key={index} {...reveal(index * 0.05)}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-8 space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...reveal()} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-balance text-foreground">
              Hva kundene våre sier
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Norske bedrifter som bruker NorskLeads hver dag
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Lars Olsen",
                role: "Salgssjef, TechNordic AS",
                content:
                  "NorskLeads har revolusjonert måten vi finner nye kunder på. Vi har økt antall kvalifiserte leads med 300% på bare 3 måneder.",
                rating: 5,
              },
              {
                name: "Ingrid Johansen",
                role: "Markedsansvarlig, Digital Solutions",
                content:
                  "Endelig et verktøy som er laget for det norske markedet! Dataene er nøyaktige og oppdaterte. Sparer oss for mange timer hver uke.",
                rating: 5,
              },
              {
                name: "Erik Hansen",
                role: "Gründer, Rådgivning Nord",
                content:
                  "Som liten bedrift har vi ikke råd til dyre CRM-systemer. NorskLeads gir oss alt vi trenger til en brøkdel av prisen.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div key={index} {...reveal(index * 0.05)}>
                <Card className="h-full">
                  <CardContent className="p-8 space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1" aria-label={`${testimonial.rating} av 5 stjerner`}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-amber-500 text-lg" aria-hidden="true">
                          ★
                        </span>
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-foreground leading-relaxed">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg">
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div {...reveal()} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-balance text-foreground">
                Ofte stilte spørsmål
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Alt du lurer på om NorskLeads
              </p>
            </motion.div>

            <div className="space-y-2">
              <FAQItem
                question="Hvor kommer dataene fra?"
                answer="Vi henter data fra Brønnøysundregistrene og andre offentlige kilder. Alle bedriftsdata er oppdatert og verifisert. Vi har tilgang til 1.1 millioner norske bedrifter med informasjon om organisasjonsnummer, adresse, kontaktinformasjon, næringskode, og mer."
              />
              <FAQItem
                question="Er NorskLeads GDPR-kompatibelt?"
                answer="Ja, absolutt. Vi følger alle GDPR-regler og norsk personvernlovgivning. Alle e-poster inneholder automatisk avmeldingslenke, og vi logger all samtykke og kommunikasjon. Du har full kontroll over dataene dine."
              />
              <FAQItem
                question="Hva koster NorskLeads?"
                answer="Vi tilbyr tre planer: Starter (kr 499/mnd) for små bedrifter, Pro (kr 999/mnd) for voksende selskaper, og Enterprise (kontakt oss) for store organisasjoner. Alle planer inkluderer 14 dagers gratis prøveperiode uten kredittkort."
              />
              <FAQItem
                question="Kan jeg integrere med andre systemer?"
                answer="Ja, NorskLeads kan integreres med populære CRM-systemer som HubSpot, Salesforce, og Pipedrive. Vi tilbyr også API-tilgang for custom integrasjoner på Pro og Enterprise planene."
              />
              <FAQItem
                question="Hvor mange e-poster kan jeg sende?"
                answer="Starter-planen inkluderer 1000 e-poster per måned, Pro-planen 5000 e-poster, og Enterprise har ubegrenset sending. Vi anbefaler å starte sakte og bygge opp sendevolumet gradvis for best leveringsrate."
              />
              <FAQItem
                question="Får jeg support på norsk?"
                answer="Ja! Vi tilbyr norsk support via e-post, chat, og telefon. Vårt supportteam er tilgjengelig hverdager 09:00-17:00. Enterprise-kunder får dedikert account manager."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...reveal()} className="text-center mb-14">
            <span className="inline-block px-3 py-1.5 bg-muted border border-border text-foreground rounded-full text-sm font-medium mb-4">
              Priser
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-balance text-foreground">
              Velg planen som passer for deg
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start gratis og oppgrader når du er klar. Ingen skjulte kostnader.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
            {/* Starter Plan */}
            <motion.div {...reveal()}>
              <Card className="h-full transition-shadow hover:shadow-md relative overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Starter</h3>
                  <p className="text-muted-foreground mb-6">For små bedrifter og gründere</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">kr 499</span>
                    <span className="text-muted-foreground">/mnd</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {[
                      "500 bedriftssøk/mnd",
                      "100 e-poster/mnd",
                      "1 bruker",
                      "E-post support",
                      "Grunnleggende analyse",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button variant="outline" className="w-full py-6 text-base">
                      Start gratis prøveperiode
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan - Popular */}
            <motion.div {...reveal(0.05)}>
              <Card className="h-full transition-shadow hover:shadow-md relative overflow-hidden border-primary">
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
                  Mest populær
                </div>
                <CardContent className="p-8 pt-14">
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Pro</h3>
                  <p className="text-muted-foreground mb-6">For voksende salgsavdelinger</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">kr 999</span>
                    <span className="text-muted-foreground">/mnd</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Ubegrenset bedriftssøk",
                      "5 000 e-poster/mnd",
                      "5 brukere",
                      "Prioritert support",
                      "Avansert analyse",
                      "AI e-postgenerering",
                      "CRM-integrasjoner",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="w-full py-6 text-base">
                      Start gratis prøveperiode
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div {...reveal(0.1)}>
              <Card className="h-full transition-shadow hover:shadow-md relative overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Enterprise</h3>
                  <p className="text-muted-foreground mb-6">For store organisasjoner</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">Kontakt</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Alt i Pro +",
                      "Ubegrenset e-poster",
                      "Ubegrenset brukere",
                      "Dedikert account manager",
                      "Custom integrasjoner",
                      "SLA-garanti",
                      "On-premise mulighet",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full py-6 text-base">
                    Kontakt salg
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Money back guarantee */}
          <motion.div {...reveal(0.15)} className="text-center mt-12">
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              14 dagers pengene-tilbake-garanti. Ingen spørsmål.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div {...reveal()} className="text-center mb-14">
            <span className="inline-block px-3 py-1.5 bg-muted border border-border text-foreground rounded-full text-sm font-medium mb-4">
              Slik fungerer det
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-balance text-foreground">
              Fra søk til salg på 3 enkle steg
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Finn bedrifter",
                description: "Søk blant 1.1 millioner norske bedrifter med avanserte filtre. Finn de perfekte kundene for din virksomhet.",
                icon: Search,
              },
              {
                step: "2",
                title: "Send kampanjer",
                description: "Lag personaliserte e-postkampanjer med AI-hjelp. Automatiser oppfølginger og spar tid.",
                icon: Mail,
              },
              {
                step: "3",
                title: "Lukk salg",
                description: "Følg opp leads i Kanban-boardet. Se hvem som åpner e-poster og prioriter de varmeste leadsene.",
                icon: BarChart3,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                {...reveal(index * 0.05)}
                className="text-center relative"
              >
                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
                )}

                {/* Step number */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6 relative">
                  <item.icon className="w-10 h-10 text-primary" />
                  <span className="absolute -top-1 -right-1 w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Shield,
                title: "GDPR-kompatibel",
                description: "100% sikker",
              },
              {
                icon: Clock,
                title: "24/7 Support",
                description: "Vi er her for deg",
              },
              {
                icon: Zap,
                title: "99.9% Oppetid",
                description: "Alltid tilgjengelig",
              },
              {
                icon: CheckCircle2,
                title: "Rask oppstart",
                description: "Klar på 5 min",
              },
            ].map((badge, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-card border border-border rounded-full mb-4">
                  <badge.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold mb-1 text-foreground">{badge.title}</h4>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 bg-primary rounded-2xl p-12 md:p-16 text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Klar til å finne dine neste kunder?
            </h2>
            <p className="text-lg opacity-90">
              Start din gratis prøveperiode i dag. Ingen kredittkort påkrevd.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base px-8"
                >
                  Start gratis prøveperiode <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              >
                Snakk med salg
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4 text-foreground">NorskLeads</h3>
              <p className="text-sm text-muted-foreground">
                Finn dine neste kunder i Norge med AI-drevet lead generation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-primary transition-colors cursor-pointer">
                    Funksjoner
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary transition-colors cursor-pointer">
                    Priser
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="hover:text-primary transition-colors cursor-pointer">
                    Integrasjoner
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Selskap</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors cursor-pointer">
                    Om oss
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">
                    Kontakt
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">
                    Personvern
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-primary transition-colors cursor-pointer">
                    Hjelpesenter
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-primary transition-colors cursor-pointer">
                    Dokumentasjon
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-primary transition-colors cursor-pointer">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left text-sm text-muted-foreground">
                <p>&copy; 2024 NorskLeads by Nexify CRM Systems AS</p>
                <p className="text-xs mt-1">Org.nr: 92146050 | Laget med ❤️ i Norge</p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.linkedin.com/company/nexify-crm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Følg oss på LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://www.facebook.com/nexifycrm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Følg oss på Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/nexifycrm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Følg oss på Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-md transition-colors"
          onClick={openCrispChat}
          title="Chat med oss"
          aria-label="Chat med oss"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Video Modal */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              aria-label="Lukk video"
            >
              <span className="text-2xl text-gray-800">×</span>
            </button>

            {/* YouTube Embed - Replace with actual demo video URL */}
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="NorskLeads Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}

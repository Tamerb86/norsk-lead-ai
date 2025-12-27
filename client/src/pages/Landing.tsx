import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
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

// Animated Counter Component
function AnimatedNumber({ value }: { value: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="font-bold"
    >
      {value}
    </motion.span>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-gray-200 pb-4"
      initial={false}
    >
      <button
        className="flex justify-between items-center w-full text-left py-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-lg">{question}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="text-gray-600 pb-4">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

export default function Landing() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Crisp Chat Integration - Disabled until valid CRISP_WEBSITE_ID is configured
  // To enable: Replace YOUR_CRISP_WEBSITE_ID with your actual Crisp website ID
  // useEffect(() => {
  //   (window as any).$crisp = [];
  //   (window as any).CRISP_WEBSITE_ID = "YOUR_CRISP_WEBSITE_ID";
  //   const script = document.createElement('script');
  //   script.src = 'https://client.crisp.chat/l.js';
  //   script.async = true;
  //   document.head.appendChild(script);
  //   return () => {
  //     if (document.head.contains(script)) {
  //       document.head.removeChild(script);
  //     }
  //   };
  // }, []);

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
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
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
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-white z-40 border-b shadow-lg">
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

      {/* Hero Section - Asymmetric Modern Design */}
      <section className="relative py-24 md:py-40 overflow-hidden gradient-mesh">
        {/* Floating Elements for Visual Interest */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 lg:pr-12">
              {/* Badge with Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-sm font-medium"
              >
                <span className="text-2xl">🇳🇴</span>
                <span className="gradient-text font-semibold">
                  Laget for det norske markedet
                </span>
              </motion.div>

              {/* Main Heading - Bigger & Bolder */}
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-6xl md:text-8xl font-black leading-[1.1] tracking-tight"
              >
                Finn dine neste kunder i{" "}
                <span className="gradient-text block mt-2">
                  Norge
                </span>
              </motion.h1>

              {/* Subheading - More Prominent */}
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl md:text-3xl text-gray-700 leading-relaxed font-light"
              >
                Tilgang til <span className="font-bold text-blue-600">1.1 millioner</span> norske
                bedrifter. Søk, filtrer, og send personaliserte e-postkampanjer
                til dine ideelle B2B-kunder.
              </motion.p>

              {/* CTA Buttons - Premium Design */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link href="/dashboard">
                  <Button size="lg" className="btn-premium text-lg sm:text-xl px-8 sm:px-10 py-5 sm:py-7 rounded-2xl font-semibold">
                    Start gratis prøveperiode <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="glass-card text-lg sm:text-xl px-8 sm:px-10 py-5 sm:py-7 rounded-2xl font-semibold hover:scale-105 transition-transform border-2"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <Play className="mr-2 w-5 h-5" />
                  Se hvordan det virker
                </Button>
              </motion.div>

              {/* Trust Signals - Enhanced */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-6 pt-6 text-base"
              >
                <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Ingen kredittkort påkrevd</span>
                </div>
                <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">14 dagers gratis prøveperiode</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative mt-12 lg:mt-0"
            >
              <div className="relative">
                {/* Main Screenshot with Enhanced Styling & Video Overlay */}
                <div 
                  className="relative rounded-3xl overflow-hidden shadow-2xl glow cursor-pointer group"
                  onClick={() => setIsVideoOpen(true)}
                >
                  <img
                    src="/dashboard-screenshot.webp"
                    alt="NorskLeads Dashboard"
                    className="w-full transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-blue-600 ml-1" />
                    </div>
                  </div>
                </div>
                
                {/* Floating Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl shadow-xl"
                >
                  <div className="text-sm text-gray-600 mb-1">Aktive kampanjer</div>
                  <div className="text-3xl font-bold gradient-text">247</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -top-6 -right-6 glass-card p-6 rounded-2xl shadow-xl"
                >
                  <div className="text-sm text-gray-600 mb-1">Åpningsrate</div>
                  <div className="text-3xl font-bold text-green-600">68%</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why NorskLeads Section - Enhanced with Glassmorphism */}
      <section className="py-32 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              Hvorfor NorskLeads er <span className="gradient-text">så viktig</span>
            </h2>
            <p className="text-2xl md:text-3xl text-gray-600 max-w-3xl mx-auto font-light">
              Norske B2B-selgere kaster bort tid og penger hver dag
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Problem 1: Time Waste */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <div className="glass-card text-center p-10 rounded-3xl h-full hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:rotate-6 transition-transform">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">
                  20+ timer/uke
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  kastet bort på manuell prospektering i stedet for salg
                </p>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-base text-red-600 font-bold">
                    = kr 40 000/mnd i tapt tid
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Problem 2: Lost Leads */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <div className="glass-card text-center p-10 rounded-3xl h-full hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:rotate-6 transition-transform">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">
                  70% tapt
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  av potensielle kunder forsvinner uten systematisk oppfølging
                </p>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-base text-orange-600 font-bold">
                    = kr 100 000+ i tapt omsetning
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Solution: NorskLeads */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <div className="glass-card text-center p-10 rounded-3xl h-full border-2 border-green-500 bg-gradient-to-br from-green-50 to-white hover:scale-105 transition-all duration-300 glow">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:rotate-6 transition-transform">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">
                  3x høyere
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  konverteringsrate med NorskLeads vs. manuell prospektering
                </p>
                <div className="mt-6 pt-6 border-t border-green-200">
                  <p className="text-base text-green-600 font-bold">
                    ✓ Spar tid. Øk salg. Voks raskere.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-16"
          >
            <p className="text-2xl text-gray-800 mb-8 font-light">
              <strong className="font-bold">Løsningen:</strong> Alt du trenger på én plattform - fra prospektering til lukket salg
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="btn-premium text-xl px-12 py-7 rounded-2xl font-semibold">
                Start gratis i dag <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Real Screenshots Section - Enhanced */}
      <section id="features" className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              Alt du trenger for å <span className="gradient-text">finne kunder</span>
            </h2>
            <p className="text-2xl md:text-3xl text-gray-600 max-w-3xl mx-auto font-light">
              Kraftige verktøy for å søke, kontakte og følge opp potensielle kunder
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Search Feature */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6 group"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg group-hover:scale-110 transition-transform">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold">Avansert søk</h3>
              <p className="text-gray-700 text-xl leading-relaxed">
                Søk blant <span className="font-bold text-blue-600">1.1 millioner</span> norske bedrifter med kraftige filtre.
                Finn bedrifter etter fylke, kommune, næringskode, antall
                ansatte, og mer.
              </p>
              <div className="relative group">
                <img
                  src="/search-screenshot.webp"
                  alt="Søk i norske bedrifter"
                  className="rounded-2xl shadow-2xl border border-gray-200 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent rounded-2xl" />
              </div>
            </motion.div>

            {/* Kanban Feature */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 group"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-lg group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold">Administrer leads</h3>
              <p className="text-gray-700 text-xl leading-relaxed">
                Organiser dine leads i et visuelt Kanban-board. Dra og slipp
                for å oppdatere status automatisk. Hold oversikt over alle
                potensielle kunder.
              </p>
              <div className="relative group">
                <img
                  src="/leads-screenshot.webp"
                  alt="Kanban board for leads"
                  className="rounded-2xl shadow-2xl border border-gray-200 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent rounded-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid - Hand-drawn Style */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Hvorfor NorskLeads?</h2>
            <p className="text-xl text-gray-600">
              Alt du trenger for å lykkes med B2B-salg i Norge
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Mail,
                title: "E-postkampanjer",
                description:
                  "Send personaliserte e-poster med dynamiske variabler. Automatiske oppfølginger og tracking.",
                color: "blue",
              },
              {
                icon: BarChart3,
                title: "Avansert analyse",
                description:
                  "Følg med på åpningsrate, klikkrate, og svarrate. Optimaliser kampanjene dine basert på data.",
                color: "purple",
              },
              {
                icon: Zap,
                title: "AI-drevet automatisering",
                description:
                  "La AI hjelpe deg med å skrive bedre e-poster og finne de beste tidspunktene å sende.",
                color: "indigo",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 space-y-4">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 bg-${feature.color}-100 rounded-xl`}
                    >
                      <feature.icon
                        className={`w-7 h-7 text-${feature.color}-600`}
                      />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Real Norwegian Names */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Hva kundene våre sier
            </h2>
            <p className="text-xl text-gray-600">
              Norske bedrifter som bruker NorskLeads hver dag
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-8 space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xl">
                          ★
                        </span>
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 leading-relaxed italic">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Ofte stilte spørsmål
              </h2>
              <p className="text-xl text-gray-600">
                Alt du lurer på om NorskLeads
              </p>
            </div>

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

      {/* Trust Badges */}
      <section className="py-16 bg-gray-50">
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-4">
                  <badge.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-1">{badge.title}</h4>
                <p className="text-sm text-gray-600">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-white">
            <h2 className="text-4xl md:text-5xl font-bold">
              Klar til å finne dine neste kunder?
            </h2>
            <p className="text-xl opacity-90">
              Start din gratis prøveperiode i dag. Ingen kredittkort påkrevd.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6"
                >
                  Start gratis prøveperiode <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white/10"
              >
                Snakk med salg
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">NorskLeads</h3>
              <p className="text-sm text-gray-600">
                Finn dine neste kunder i Norge med AI-drevet lead generation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/features" className="hover:text-blue-600 cursor-pointer">
                    Funksjoner
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-blue-600 cursor-pointer">
                    Priser
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="hover:text-blue-600 cursor-pointer">
                    Integrasjoner
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Selskap</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-blue-600 cursor-pointer">
                    Om oss
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-blue-600 cursor-pointer">
                    Kontakt
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-blue-600 cursor-pointer">
                    Personvern
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/help" className="hover:text-blue-600 cursor-pointer">
                    Hjelpesenter
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-blue-600 cursor-pointer">
                    Dokumentasjon
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-blue-600 cursor-pointer">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left text-sm text-gray-600">
                <p>&copy; 2024 NorskLeads by Nexify CRM Systems AS</p>
                <p className="text-xs mt-1">Org.nr: 92146050 | Laget med ❤️ i Norge</p>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.linkedin.com/company/nexify-crm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  title="Følg oss på LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.facebook.com/nexifycrm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  title="Følg oss på Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://twitter.com/nexifycrm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-400 transition-colors"
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
          className="rounded-full w-16 h-16 shadow-2xl hover:scale-110 transition-transform"
          onClick={openCrispChat}
          title="Chat med oss"
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

import { Link } from "wouter";
import { Search, Linkedin, Twitter, Facebook, Mail } from "lucide-react";

export function SEOFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: {
      title: "Produkt",
      links: [
        { label: "Funksjoner", href: "/features" },
        { label: "Priser", href: "/pricing" },
        { label: "Integrasjoner", href: "/integrations" },
        { label: "Status", href: "/status" },
      ],
    },
    resources: {
      title: "Ressurser",
      links: [
        { label: "Blogg", href: "/blog" },
        { label: "Brukerveiledning", href: "/guide" },
        { label: "Hjelp", href: "/help" },
        { label: "Dokumentasjon", href: "/docs" },
      ],
    },
    company: {
      title: "Selskap",
      links: [
        { label: "Om oss", href: "/about" },
        { label: "Kontakt", href: "/contact" },
        { label: "Personvern", href: "/privacy" },
        { label: "Vilkår", href: "/terms" },
      ],
    },
    cities: {
      title: "Populære byer",
      links: [
        { label: "Oslo", href: "/bedrifter/oslo" },
        { label: "Bergen", href: "/bedrifter/bergen" },
        { label: "Trondheim", href: "/bedrifter/trondheim" },
        { label: "Stavanger", href: "/bedrifter/stavanger" },
      ],
    },
    industries: {
      title: "Bransjer",
      links: [
        { label: "Bygg og anlegg", href: "/bransjer/bygg-og-anlegg" },
        { label: "IT og teknologi", href: "/bransjer/it-og-teknologi" },
        { label: "Handel", href: "/bransjer/handel" },
        { label: "Helse", href: "/bransjer/helse" },
      ],
    },
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/">
              <div className="flex items-center gap-3 mb-4 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">NorskLeads</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Norges ledende plattform for B2B leadgenerering. Finn dine neste kunder blant 500,000+ norske bedrifter.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://linkedin.com/company/norskleads" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/norskleads" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com/norskleads" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="mailto:support@norskleads.no"
                className="hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span className="text-sm hover:text-white transition-colors cursor-pointer">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} NorskLeads by Nexify CRM Systems AS. Alle rettigheter reservert.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy">
                <span className="hover:text-white transition-colors cursor-pointer">Personvern</span>
              </Link>
              <Link href="/terms">
                <span className="hover:text-white transition-colors cursor-pointer">Vilkår</span>
              </Link>
              <Link href="/sitemap.xml">
                <span className="hover:text-white transition-colors cursor-pointer">Sitemap</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "NorskLeads",
            "url": "https://lead.nexifyhub.no",
            "logo": "https://lead.nexifyhub.no/logo.png",
            "sameAs": [
              "https://linkedin.com/company/norskleads",
              "https://twitter.com/norskleads",
              "https://facebook.com/norskleads"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@norskleads.no",
              "contactType": "customer service",
              "availableLanguage": ["Norwegian", "English"]
            }
          })
        }}
      />
    </footer>
  );
}

export default SEOFooter;

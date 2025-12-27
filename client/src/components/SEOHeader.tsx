import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

export function SEOHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const navItems: NavItem[] = [
    {
      label: "Produkt",
      href: "/features",
      children: [
        { label: "Funksjoner", href: "/features", description: "Alle verktøy for leadgenerering" },
        { label: "Priser", href: "/pricing", description: "Velg riktig plan for deg" },
        { label: "Integrasjoner", href: "/integrations", description: "Koble til dine verktøy" },
      ],
    },
    {
      label: "Ressurser",
      href: "/blog",
      children: [
        { label: "Blogg", href: "/blog", description: "Tips og guider" },
        { label: "Brukerveiledning", href: "/guide", description: "Lær å bruke NorskLeads" },
        { label: "Hjelp", href: "/help", description: "Få svar på spørsmål" },
        { label: "Dokumentasjon", href: "/docs", description: "Teknisk dokumentasjon" },
      ],
    },
    {
      label: "Byer",
      href: "/bedrifter/oslo",
      children: [
        { label: "Oslo", href: "/bedrifter/oslo" },
        { label: "Bergen", href: "/bedrifter/bergen" },
        { label: "Trondheim", href: "/bedrifter/trondheim" },
        { label: "Stavanger", href: "/bedrifter/stavanger" },
        { label: "Kristiansand", href: "/bedrifter/kristiansand" },
        { label: "Tromsø", href: "/bedrifter/tromso" },
      ],
    },
    {
      label: "Bransjer",
      href: "/bransjer/bygg-og-anlegg",
      children: [
        { label: "Bygg og anlegg", href: "/bransjer/bygg-og-anlegg" },
        { label: "IT og teknologi", href: "/bransjer/it-og-teknologi" },
        { label: "Handel", href: "/bransjer/handel" },
        { label: "Helse", href: "/bransjer/helse" },
      ],
    },
    { label: "Søk bedrifter", href: "/search" },
  ];

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4" aria-label="Hovednavigasjon">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">NorskLeads</span>
                <p className="text-xs text-gray-600">Finn dine neste kunder</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-1 ${
                      location.startsWith(item.href) ? "text-blue-600" : ""
                    }`}
                  >
                    {item.label}
                    {item.children && <ChevronDown className="w-4 h-4" />}
                  </Button>
                </Link>

                {/* Dropdown Menu */}
                {item.children && openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}>
                        <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                          <div className="font-medium text-gray-900">{child.label}</div>
                          {child.description && (
                            <div className="text-sm text-gray-500">{child.description}</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
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
                  <Button>Kom i gang gratis</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4">
            <nav className="flex flex-col gap-2" aria-label="Mobilnavigasjon">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg">
                      {item.label}
                    </Button>
                  </Link>
                  {item.children && (
                    <div className="ml-4 flex flex-col gap-1">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-sm text-gray-600">
                            {child.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="border-t pt-4 mt-2 flex flex-col gap-2">
                {isAuthenticated && user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="w-5 h-5 mr-2" />
                        {user.name || user.email}
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                      <LogOut className="w-5 h-5 mr-2" />
                      Logg ut
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">Logg inn</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full">Kom i gang gratis</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </nav>
    </header>
  );
}

export default SEOHeader;

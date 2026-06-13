import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to Norwegian label mapping
const routeLabels: Record<string, string> = {
  "": "Hjem",
  "dashboard": "Dashboard",
  "search": "Søk bedrifter",
  "leads": "Mine leads",
  "campaigns": "Kampanjer",
  "templates": "Maler",
  "sequences": "Sekvenser",
  "analytics": "Analyse",
  "settings": "Innstillinger",
  "account": "Konto",
  "profile": "Profil",
  "admin": "Admin",
  "pricing": "Priser",
  "features": "Funksjoner",
  "about": "Om oss",
  "contact": "Kontakt",
  "help": "Hjelp",
  "docs": "Dokumentasjon",
  "privacy": "Personvern",
  "terms": "Vilkår",
  "blog": "Blogg",
  "guide": "Brukerveiledning",
  "bedrifter": "Bedrifter",
  "bransjer": "Bransjer",
  // Cities
  "oslo": "Oslo",
  "bergen": "Bergen",
  "trondheim": "Trondheim",
  "stavanger": "Stavanger",
  "kristiansand": "Kristiansand",
  "drammen": "Drammen",
  "tromso": "Tromsø",
  // Industries
  "bygg-og-anlegg": "Bygg og anlegg",
  "it-og-teknologi": "IT og teknologi",
  "handel": "Handel",
  "helse": "Helse",
};

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const [pathname] = useLocation();
  
  // Auto-generate breadcrumbs from URL if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [
      { label: "Hjem", href: "/" }
    ];
    
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Last item doesn't have href (current page)
      if (index === pathSegments.length - 1) {
        generatedItems.push({ label });
      } else {
        generatedItems.push({ label, href: currentPath });
      }
    });
    
    return generatedItems;
  })();

  // Don't show breadcrumbs on home page
  if (pathname === "/" || breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav 
      aria-label="Brødsmulesti" 
      className={`flex items-center text-sm text-gray-500 ${className}`}
    >
      <ol 
        className="flex items-center space-x-1"
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbItems.map((item, index) => (
          <li 
            key={index}
            className="flex items-center"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
            )}
            
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-blue-600 transition-colors flex items-center"
                itemProp="item"
              >
                {index === 0 && <Home className="h-4 w-4 mr-1" />}
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span 
                className="text-gray-900 font-medium"
                itemProp="name"
              >
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;

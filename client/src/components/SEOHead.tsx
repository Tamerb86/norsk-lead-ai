import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noIndex?: boolean;
  structuredData?: object;
}

const defaultMeta = {
  title: "NorskLeads - Finn Bedriftskontakter i Norge",
  description: "Norges ledende plattform for B2B leadgenerering. Søk blant 500,000+ norske bedrifter, finn kontaktinformasjon, og automatiser din salgsutvikling.",
  keywords: "leads norge, b2b leads, bedriftskontakter, salgsleads, leadgenerering, norske bedrifter",
  ogImage: "https://lead.nexifyhub.no/og-image.png",
  siteUrl: "https://lead.nexifyhub.no",
};

export function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title 
    ? `${title} | NorskLeads` 
    : defaultMeta.title;
  
  const metaDescription = description || defaultMeta.description;
  const metaKeywords = keywords || defaultMeta.keywords;
  const metaOgImage = ogImage || defaultMeta.ogImage;
  const canonical = canonicalUrl || window.location.href;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute("content", content);
    };

    // Update meta tags
    updateMetaTag("description", metaDescription);
    updateMetaTag("keywords", metaKeywords);
    updateMetaTag("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", metaDescription, true);
    updateMetaTag("og:image", metaOgImage, true);
    updateMetaTag("og:url", canonical, true);
    updateMetaTag("og:type", ogType, true);

    // Twitter
    updateMetaTag("twitter:title", fullTitle, true);
    updateMetaTag("twitter:description", metaDescription, true);
    updateMetaTag("twitter:image", metaOgImage, true);

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical);

    // Structured Data
    if (structuredData) {
      // Remove existing structured data for this page
      const existingScript = document.querySelector('script[data-seo-structured]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-structured", "true");
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Reset title on unmount if needed
    };
  }, [fullTitle, metaDescription, metaKeywords, metaOgImage, canonical, ogType, noIndex, structuredData]);

  return null; // This component doesn't render anything
}

// Pre-defined structured data generators
export const structuredDataGenerators = {
  // For landing/home page
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NorskLeads",
    "url": "https://lead.nexifyhub.no",
    "logo": "https://lead.nexifyhub.no/logo.png",
    "description": "Norges ledende plattform for B2B leadgenerering",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "NO"
    }
  }),

  // For pricing page
  product: (name: string, description: string, price: number) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock"
    }
  }),

  // For FAQ page
  faqPage: (faqs: Array<{ question: string; answer: string }>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }),

  // For blog articles
  article: (title: string, description: string, datePublished: string, author: string) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "datePublished": datePublished,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "NorskLeads",
      "logo": {
        "@type": "ImageObject",
        "url": "https://lead.nexifyhub.no/logo.png"
      }
    }
  }),

  // For local business pages (city pages)
  localBusiness: (city: string, region: string) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `NorskLeads - Bedrifter i ${city}`,
    "description": `Finn bedriftskontakter og leads i ${city}, ${region}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": region,
      "addressCountry": "NO"
    },
    "areaServed": {
      "@type": "City",
      "name": city
    }
  }),

  // Breadcrumb
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  })
};

export default SEOHead;

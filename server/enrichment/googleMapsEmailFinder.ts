import https from "https";
import http from "http";
import { URL } from "url";

export type GoogleMapsEmailResult = {
  companyName: string;
  organisasjonsnummer: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  source: "google_maps" | "website_scrape" | "not_found";
  confidence: number; // 0-100
  searchQuery: string;
  error?: string;
};

/**
 * Extract emails from text using regex
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  
  // Filter out common false positives
  return matches.filter(email => {
    const lower = email.toLowerCase();
    // Exclude image files and common non-email patterns
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.gif')) return false;
    if (lower.includes('example.com') || lower.includes('test.com')) return false;
    if (lower.includes('sentry.io') || lower.includes('wixpress.com')) return false;
    return true;
  });
}

/**
 * Extract Norwegian phone numbers from text
 */
function extractNorwegianPhones(text: string): string[] {
  // Norwegian phone patterns: +47, 47, or 8-digit numbers
  const phoneRegex = /(?:\+47|47)?[\s.-]?(?:\d{2}[\s.-]?){4}/g;
  const matches = text.match(phoneRegex) || [];
  
  return matches.map(phone => {
    // Normalize phone number
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 8) return digits;
    if (digits.length === 10 && digits.startsWith('47')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('47')) return digits.slice(2);
    return digits;
  }).filter(phone => phone.length === 8);
}

/**
 * Fetch webpage content
 */
async function fetchWebpage(url: string, timeout: number = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      timeout,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "no,en;q=0.9",
      },
    };

    const req = protocol.request(options, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        fetchWebpage(redirectUrl, timeout).then(resolve).catch(reject);
        return;
      }

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
        // Limit response size to 1MB
        if (data.length > 1024 * 1024) {
          req.destroy();
          resolve(data);
        }
      });
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

/**
 * Scrape email from company website
 */
export async function scrapeEmailFromWebsite(websiteUrl: string): Promise<{
  email: string | null;
  phone: string | null;
  confidence: number;
}> {
  try {
    // Normalize URL
    let url = websiteUrl.trim().toLowerCase();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    // Fetch main page
    const mainPageContent = await fetchWebpage(url);
    let emails = extractEmails(mainPageContent);
    let phones = extractNorwegianPhones(mainPageContent);

    // If no email found, try contact page
    if (emails.length === 0) {
      const contactPaths = ["/kontakt", "/contact", "/kontakt-oss", "/contact-us", "/om-oss", "/about"];
      
      for (const path of contactPaths) {
        try {
          const contactUrl = new URL(path, url).toString();
          const contactContent = await fetchWebpage(contactUrl);
          const contactEmails = extractEmails(contactContent);
          const contactPhones = extractNorwegianPhones(contactContent);
          
          if (contactEmails.length > 0) {
            emails = contactEmails;
            phones = [...phones, ...contactPhones];
            break;
          }
        } catch {
          // Contact page doesn't exist, continue
        }
      }
    }

    // Prioritize info@, post@, kontakt@ emails
    const priorityPrefixes = ["info@", "post@", "kontakt@", "contact@", "mail@", "firmapost@"];
    let bestEmail: string | null = null;
    let confidence = 0;

    for (const prefix of priorityPrefixes) {
      const found = emails.find(e => e.toLowerCase().startsWith(prefix));
      if (found) {
        bestEmail = found;
        confidence = 90;
        break;
      }
    }

    // If no priority email, use first one
    if (!bestEmail && emails.length > 0) {
      bestEmail = emails[0];
      confidence = 70;
    }

    return {
      email: bestEmail,
      phone: phones.length > 0 ? phones[0] : null,
      confidence,
    };
  } catch (error) {
    return {
      email: null,
      phone: null,
      confidence: 0,
    };
  }
}

/**
 * Search Google Maps for company and extract contact info
 * Note: This uses Google's public search, not the official API
 */
export async function searchGoogleMapsForEmail(
  companyName: string,
  location: string = "Norge"
): Promise<{
  email: string | null;
  phone: string | null;
  website: string | null;
  confidence: number;
}> {
  try {
    // Build search query
    const query = encodeURIComponent(`${companyName} ${location}`);
    const searchUrl = `https://www.google.com/search?q=${query}+kontakt+email`;

    const content = await fetchWebpage(searchUrl);
    
    // Extract emails and phones from search results
    const emails = extractEmails(content);
    const phones = extractNorwegianPhones(content);

    // Try to extract website from search results
    const websiteMatch = content.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.no)[^"'\s]*/i);
    const website = websiteMatch ? websiteMatch[0] : null;

    return {
      email: emails.length > 0 ? emails[0] : null,
      phone: phones.length > 0 ? phones[0] : null,
      website,
      confidence: emails.length > 0 ? 60 : 0,
    };
  } catch (error) {
    return {
      email: null,
      phone: null,
      website: null,
      confidence: 0,
    };
  }
}

/**
 * Find email for a Norwegian company
 * Tries multiple sources: website scraping, Google search
 */
export async function findCompanyEmail(
  companyName: string,
  organisasjonsnummer: string,
  existingWebsite?: string | null,
  existingPhone?: string | null,
  location?: string
): Promise<GoogleMapsEmailResult> {
  const searchQuery = `${companyName} ${location || "Norge"}`;
  
  // First, try scraping the company website if available
  if (existingWebsite) {
    const websiteResult = await scrapeEmailFromWebsite(existingWebsite);
    
    if (websiteResult.email) {
      return {
        companyName,
        organisasjonsnummer,
        email: websiteResult.email,
        phone: websiteResult.phone || existingPhone || null,
        website: existingWebsite,
        source: "website_scrape",
        confidence: websiteResult.confidence,
        searchQuery,
      };
    }
  }

  // If no website or no email found, try Google search
  const googleResult = await searchGoogleMapsForEmail(companyName, location);
  
  if (googleResult.email) {
    return {
      companyName,
      organisasjonsnummer,
      email: googleResult.email,
      phone: googleResult.phone || existingPhone || null,
      website: googleResult.website || existingWebsite || null,
      source: "google_maps",
      confidence: googleResult.confidence,
      searchQuery,
    };
  }

  // If Google found a website, try scraping it
  if (googleResult.website && googleResult.website !== existingWebsite) {
    const newWebsiteResult = await scrapeEmailFromWebsite(googleResult.website);
    
    if (newWebsiteResult.email) {
      return {
        companyName,
        organisasjonsnummer,
        email: newWebsiteResult.email,
        phone: newWebsiteResult.phone || existingPhone || null,
        website: googleResult.website,
        source: "website_scrape",
        confidence: newWebsiteResult.confidence,
        searchQuery,
      };
    }
  }

  // No email found
  return {
    companyName,
    organisasjonsnummer,
    email: null,
    phone: existingPhone || null,
    website: existingWebsite || googleResult.website || null,
    source: "not_found",
    confidence: 0,
    searchQuery,
  };
}

/**
 * Batch find emails for multiple companies
 */
export async function findCompanyEmailsBatch(
  companies: Array<{
    navn: string;
    organisasjonsnummer: string;
    hjemmeside?: string | null;
    telefon?: string | null;
    kommune?: string | null;
  }>,
  concurrency: number = 3,
  delayMs: number = 2000
): Promise<GoogleMapsEmailResult[]> {
  const results: GoogleMapsEmailResult[] = [];
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < companies.length; i += concurrency) {
    const batch = companies.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(company =>
        findCompanyEmail(
          company.navn,
          company.organisasjonsnummer,
          company.hjemmeside,
          company.telefon,
          company.kommune
        )
      )
    );
    
    results.push(...batchResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + concurrency < companies.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

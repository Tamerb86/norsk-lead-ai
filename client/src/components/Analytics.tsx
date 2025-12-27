import { useEffect } from "react";
import { useLocation } from "wouter";

// Google Analytics 4 Configuration
// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

// Declare gtag function type
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export function initGA() {
  if (typeof window === "undefined") return;
  
  // Don't initialize in development unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_ANALYTICS) {
    console.log("Analytics disabled in development");
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Set initial timestamp
  window.gtag("js", new Date());

  // Configure GA4
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
  });
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  
  window.gtag("event", "page_view", {
    page_path: url,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

// Track custom events
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window === "undefined" || !window.gtag) return;
  
  window.gtag("event", eventName, eventParams);
}

// Pre-defined event trackers
export const analyticsEvents = {
  // User actions
  signUp: (method: string) => trackEvent("sign_up", { method }),
  login: (method: string) => trackEvent("login", { method }),
  logout: () => trackEvent("logout"),
  
  // Lead actions
  searchCompanies: (filters: Record<string, any>) => 
    trackEvent("search", { search_term: JSON.stringify(filters) }),
  viewCompany: (companyId: string, companyName: string) => 
    trackEvent("view_item", { item_id: companyId, item_name: companyName }),
  saveCompany: (companyId: string) => 
    trackEvent("add_to_wishlist", { item_id: companyId }),
  exportLeads: (count: number, format: string) => 
    trackEvent("export_leads", { count, format }),
  
  // Campaign actions
  createCampaign: (type: string) => 
    trackEvent("create_campaign", { campaign_type: type }),
  sendCampaign: (recipientCount: number) => 
    trackEvent("send_campaign", { recipient_count: recipientCount }),
  
  // Subscription actions
  viewPricing: () => trackEvent("view_pricing"),
  selectPlan: (planId: string, price: number) => 
    trackEvent("select_plan", { plan_id: planId, price }),
  startCheckout: (planId: string, price: number) => 
    trackEvent("begin_checkout", { 
      currency: "NOK", 
      value: price,
      items: [{ item_id: planId, price }]
    }),
  completePurchase: (planId: string, price: number, transactionId: string) => 
    trackEvent("purchase", {
      currency: "NOK",
      value: price,
      transaction_id: transactionId,
      items: [{ item_id: planId, price }]
    }),
  
  // Engagement
  clickCTA: (ctaName: string, location: string) => 
    trackEvent("click_cta", { cta_name: ctaName, location }),
  downloadResource: (resourceName: string) => 
    trackEvent("download", { resource_name: resourceName }),
  contactSubmit: () => trackEvent("contact_form_submit"),
  newsletterSignup: () => trackEvent("newsletter_signup"),
};

// Analytics Provider Component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return <>{children}</>;
}

// Hook for easy analytics access
export function useAnalytics() {
  return {
    trackEvent,
    trackPageView,
    events: analyticsEvents,
  };
}

export default AnalyticsProvider;

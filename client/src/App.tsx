// App.tsx - Version 1.2.0 - Enhanced lazy loading with prefetch
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { KeyboardShortcutsProvider } from "./components/KeyboardShortcuts";

// Loading component for lazy loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin dark:border-indigo-800 dark:border-t-indigo-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Laster...</p>
      </div>
    </div>
  );
}

// Eagerly loaded pages (critical path)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "@/pages/NotFound";

// Lazy loaded pages with webpackChunkName for better debugging
// Dashboard & main features
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ "./pages/Dashboard"));
const Search = lazy(() => import(/* webpackChunkName: "search" */ "./pages/Search"));
const Campaigns = lazy(() => import(/* webpackChunkName: "campaigns" */ "./pages/Campaigns"));
const Leads = lazy(() => import(/* webpackChunkName: "leads" */ "./pages/Leads"));
const Templates = lazy(() => import(/* webpackChunkName: "templates" */ "./pages/Templates"));
const Sequences = lazy(() => import(/* webpackChunkName: "sequences" */ "./pages/Sequences"));
const Analytics = lazy(() => import(/* webpackChunkName: "analytics" */ "./pages/Analytics"));
const Calendar = lazy(() => import(/* webpackChunkName: "calendar" */ "./pages/Calendar"));

// Settings & admin
const Settings = lazy(() => import(/* webpackChunkName: "settings" */ "./pages/Settings"));
const TeamSettings = lazy(() => import(/* webpackChunkName: "team-settings" */ "./pages/TeamSettings"));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ "./pages/Profile"));
const Account = lazy(() => import(/* webpackChunkName: "account" */ "./pages/Account"));
const Admin = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/Admin"));
const ActivityLog = lazy(() => import(/* webpackChunkName: "activity-log" */ "./pages/ActivityLog"));
const Referral = lazy(() => import(/* webpackChunkName: "referral" */ "./pages/Referral"));
const ABTesting = lazy(() => import(/* webpackChunkName: "ab-testing" */ "./pages/ABTesting"));
const LeadScoringPage = lazy(() => import(/* webpackChunkName: "lead-scoring" */ "./pages/LeadScoring"));
const Webhooks = lazy(() => import(/* webpackChunkName: "webhooks" */ "./pages/Webhooks"));
const ForgotPassword = lazy(() => import(/* webpackChunkName: "forgot-password" */ "@/pages/ForgotPassword"));

// Static/marketing pages
const About = lazy(() => import(/* webpackChunkName: "about" */ "./pages/About"));
const Privacy = lazy(() => import(/* webpackChunkName: "privacy" */ "./pages/Privacy"));
const Terms = lazy(() => import(/* webpackChunkName: "terms" */ "./pages/Terms"));
const Features = lazy(() => import(/* webpackChunkName: "features" */ "./pages/Features"));
const Pricing = lazy(() => import(/* webpackChunkName: "pricing" */ "./pages/Pricing"));
const Integrations = lazy(() => import(/* webpackChunkName: "integrations" */ "./pages/Integrations"));
const Contact = lazy(() => import(/* webpackChunkName: "contact" */ "./pages/Contact"));
const Help = lazy(() => import(/* webpackChunkName: "help" */ "./pages/Help"));
const Docs = lazy(() => import(/* webpackChunkName: "docs" */ "./pages/Docs"));
const Status = lazy(() => import(/* webpackChunkName: "status" */ "./pages/Status"));
const Blog = lazy(() => import(/* webpackChunkName: "blog" */ "./pages/Blog"));
const Guide = lazy(() => import(/* webpackChunkName: "guide" */ "./pages/Guide"));

// Other pages
const SentryTest = lazy(() => import(/* webpackChunkName: "sentry-test" */ "./pages/SentryTest"));
const LeadEnrichment = lazy(() => import(/* webpackChunkName: "lead-enrichment" */ "./pages/LeadEnrichment"));
const CityLanding = lazy(() => import(/* webpackChunkName: "city-landing" */ "./pages/CityLanding"));
const IndustryLanding = lazy(() => import(/* webpackChunkName: "industry-landing" */ "./pages/IndustryLanding"));

// Prefetch commonly accessed pages after initial load
function usePrefetch() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Prefetch dashboard pages when on landing/login
    if (location === "/" || location === "/login") {
      const timer = setTimeout(() => {
        // Prefetch most likely next pages
        import("./pages/Dashboard");
        import("./pages/Search");
      }, 2000); // Wait 2 seconds after page load
      return () => clearTimeout(timer);
    }
    
    // Prefetch related pages when on dashboard
    if (location === "/dashboard") {
      const timer = setTimeout(() => {
        import("./pages/Campaigns");
        import("./pages/Leads");
        import("./pages/Analytics");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location]);
}

function Router() {
  usePrefetch();
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Critical path - eagerly loaded */}
        <Route path={"/"} component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Dashboard & main features - lazy loaded */}
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/search" component={Search} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/leads" component={Leads} />
        <Route path="/templates" component={Templates} />
        <Route path="/sequences" component={Sequences} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/calendar" component={Calendar} />
        
        {/* Settings & admin - lazy loaded */}
        <Route path="/profile" component={Profile} />
        <Route path="/account" component={Account} />
        <Route path="/admin" component={Admin} />
        <Route path="/activity" component={ActivityLog} />
        <Route path="/referral" component={Referral} />
        <Route path="/ab-testing" component={ABTesting} />
        <Route path="/lead-scoring" component={LeadScoringPage} />
        <Route path="/webhooks" component={Webhooks} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/settings" component={Settings} />
        <Route path="/team" component={TeamSettings} />
        
        {/* Static/marketing pages - lazy loaded */}
        <Route path="/about" component={About} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/contact" component={Contact} />
        <Route path="/help" component={Help} />
        <Route path="/docs" component={Docs} />
        <Route path="/status" component={Status} />
        <Route path="/blog" component={Blog} />
        <Route path="/guide" component={Guide} />
        
        {/* Other pages - lazy loaded */}
        <Route path="/sentry-test" component={SentryTest} />
        <Route path="/enrichment" component={LeadEnrichment} />
        <Route path="/bedrifter/:city" component={CityLanding} />
        <Route path="/bransjer/:industry" component={IndustryLanding} />
        
        {/* 404 */}
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// PWA component (lazy loaded)
const PWAPrompt = lazy(() => import("./components/PWAPrompt"));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <KeyboardShortcutsProvider>
            <Toaster />
            <Router />
            <Suspense fallback={null}>
              <PWAPrompt />
            </Suspense>
          </KeyboardShortcutsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

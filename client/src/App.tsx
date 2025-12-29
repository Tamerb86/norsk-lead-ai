// App.tsx - Version 1.1.0 - Lazy loading for better performance
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Loading component for lazy loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Laster...</p>
      </div>
    </div>
  );
}

// Eagerly loaded pages (critical path)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "@/pages/NotFound";

// Lazy loaded pages (dashboard & main features)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Search = lazy(() => import("./pages/Search"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Leads = lazy(() => import("./pages/Leads"));
const Templates = lazy(() => import("./pages/Templates"));
const Sequences = lazy(() => import("./pages/Sequences"));
const Analytics = lazy(() => import("./pages/Analytics"));

// Lazy loaded pages (settings & admin)
const Settings = lazy(() => import("./pages/Settings"));
const TeamSettings = lazy(() => import("./pages/TeamSettings"));
const Profile = lazy(() => import("./pages/Profile"));
const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));

// Lazy loaded pages (static/marketing)
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Contact = lazy(() => import("./pages/Contact"));
const Help = lazy(() => import("./pages/Help"));
const Docs = lazy(() => import("./pages/Docs"));
const Status = lazy(() => import("./pages/Status"));
const Blog = lazy(() => import("./pages/Blog"));
const Guide = lazy(() => import("./pages/Guide"));

// Lazy loaded pages (other)
const SentryTest = lazy(() => import("./pages/SentryTest"));
const LeadEnrichment = lazy(() => import("./pages/LeadEnrichment"));
const CityLanding = lazy(() => import("./pages/CityLanding"));
const IndustryLanding = lazy(() => import("./pages/IndustryLanding"));

function Router() {
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
        
        {/* Settings & admin - lazy loaded */}
        <Route path="/profile" component={Profile} />
        <Route path="/account" component={Account} />
        <Route path="/admin" component={Admin} />
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

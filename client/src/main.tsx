import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "./lib/trpc";
import "./index.css";

// Import all pages
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Campaigns from "./pages/Campaigns";
import Leads from "./pages/Leads";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import TeamSettings from "./pages/TeamSettings";
import Sequences from "./pages/Sequences";
import Analytics from "./pages/Analytics";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Integrations from "./pages/Integrations";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Docs from "./pages/Docs";
import Status from "./pages/Status";
import LeadEnrichment from "./pages/LeadEnrichment";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create tRPC client
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

// Router component with all pages
function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Landing} />
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
      
      {/* Auth pages */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected pages (require login) */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/campaigns">
        {() => <Redirect to="/campaigns" />}
      </Route>
      <Route path="/search" component={Search} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/leads" component={Leads} />
      <Route path="/templates" component={Templates} />
      <Route path="/settings" component={Settings} />
      <Route path="/team" component={TeamSettings} />
      <Route path="/sequences" component={Sequences} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/enrichment" component={LeadEnrichment} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// App component with all providers
function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// Render the app
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

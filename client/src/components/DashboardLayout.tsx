import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Search, 
  Mail, 
  FileText, 
  Zap, 
  BarChart3,
  Settings,
  Shield,
  HelpCircle,
  Building2,
  Calendar,
  Keyboard,
  Command,
  Activity,
  Gift,
  FlaskConical,
  Target,
  Webhook,
  Sparkles,
  Brain
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { SmartTips } from './SmartTips';
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", description: "Oversikt" },
  { icon: Search, label: "Søk bedrifter", path: "/search", description: "Finn leads" },
  { icon: Users, label: "Leads", path: "/leads", description: "Administrer leads" },
  { icon: Target, label: "Lead Scoring", path: "/lead-scoring", description: "Rangering" },
  { icon: Mail, label: "Kampanjer", path: "/campaigns", description: "E-postkampanjer" },
  { icon: FlaskConical, label: "A/B-testing", path: "/ab-testing", description: "Test e-poster" },
  { icon: FileText, label: "Maler", path: "/templates", description: "E-postmaler" },
  { icon: Zap, label: "Sekvenser", path: "/sequences", description: "Automatisering" },
  { icon: Calendar, label: "Kalender", path: "/calendar", description: "Planlegging" },
  { icon: BarChart3, label: "Analyse", path: "/analytics", description: "Statistikk" },
  { icon: Webhook, label: "Webhooks", path: "/webhooks", description: "Integrasjoner" },
  { icon: Activity, label: "Aktivitet", path: "/activity", description: "Aktivitetslogg" },
  { icon: Gift, label: "Henvisning", path: "/referral", description: "Inviter venner" },
  { icon: Sparkles, label: "AI Assistent", path: "/ai-assistant", description: "Salgsassistent" },
  { icon: Brain, label: "AI Innsikt", path: "/ai-insights", description: "Lead-analyse" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              Logg inn for å fortsette
            </h1>
            <p className="text-sm text-gray-600 text-center max-w-sm">
              Du må være logget inn for å få tilgang til NorskLeads dashboard.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Logg inn
          </Button>
          <p className="text-sm text-gray-500">
            Har du ikke en konto? <Link href="/register" className="text-blue-600 hover:underline">Registrer deg</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const handleRestartTutorial = () => {
    // Clear all onboarding related localStorage items
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("onboarding_dismissed");
    localStorage.removeItem("onboarding_progress");
    localStorage.removeItem("onboarding_skipped");
    localStorage.removeItem("onboarding_completed_at");
    localStorage.removeItem("seen_tips");
    // Navigate to dashboard and reload to show tutorial
    if (location !== "/dashboard") {
      setLocation("/dashboard");
      setTimeout(() => window.location.reload(), 100);
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-border bg-sidebar fixed left-0 top-0 h-screen z-40"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-foreground truncate">
                    NorskLeads
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2 overflow-y-auto">
            <SidebarMenu className="px-2 py-1 space-y-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal rounded-lg ${
                        isActive 
                          ? "bg-primary/10 text-primary hover:bg-primary/15" 
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border">
            <div className="flex items-center justify-between mb-2 group-data-[collapsible=icon]:justify-center">
              <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Tema</span>
              <ThemeToggle />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium text-foreground truncate leading-none">
                      {user?.name || "Bruker"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user?.name || "Bruker"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <Link href="/account">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Min konto</span>
                  </DropdownMenuItem>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleRestartTutorial}
                  className="cursor-pointer"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Start veiledning på nytt</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Trigger keyboard shortcut help
                    const event = new KeyboardEvent('keydown', { key: '?', shiftKey: true });
                    window.dispatchEvent(event);
                  }}
                  className="cursor-pointer"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  <span>Hurtigtaster</span>
                  <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">?</kbd>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logg ut</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        )}
        <main className="flex-1 p-4 bg-muted/30">{children}</main>
        <SmartTips />
      </SidebarInset>
    </>
  );
}

import { useState, useEffect, useMemo } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  GripVertical,
  Settings2,
  RotateCcw,
  Plus,
  X,
  Building2,
  Mail,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  Bell,
  Target,
  Clock,
  Zap,
} from "lucide-react";

// Widget types
export type WidgetType = 
  | "stats-companies"
  | "stats-campaigns"
  | "stats-leads"
  | "stats-performance"
  | "chart-campaigns"
  | "chart-leads"
  | "recent-campaigns"
  | "top-leads"
  | "upcoming-events"
  | "notifications"
  | "quick-actions";

interface WidgetConfig {
  id: WidgetType;
  title: string;
  icon: React.ReactNode;
  description: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
}

// Available widgets configuration
export const widgetConfigs: Record<WidgetType, WidgetConfig> = {
  "stats-companies": {
    id: "stats-companies",
    title: "Bedrifter",
    icon: <Building2 className="h-4 w-4" />,
    description: "Oversikt over bedrifter i databasen",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  "stats-campaigns": {
    id: "stats-campaigns",
    title: "Kampanjer",
    icon: <Mail className="h-4 w-4" />,
    description: "Status på e-postkampanjer",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  "stats-leads": {
    id: "stats-leads",
    title: "Leads",
    icon: <Users className="h-4 w-4" />,
    description: "Antall leads og status",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  "stats-performance": {
    id: "stats-performance",
    title: "Ytelse",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Åpnings- og svarrate",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  "chart-campaigns": {
    id: "chart-campaigns",
    title: "Kampanjestatistikk",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Graf over kampanjeytelse",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  "chart-leads": {
    id: "chart-leads",
    title: "Leads per bransje",
    icon: <Target className="h-4 w-4" />,
    description: "Fordeling av leads",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  "recent-campaigns": {
    id: "recent-campaigns",
    title: "Nylige kampanjer",
    icon: <Clock className="h-4 w-4" />,
    description: "Siste kampanjer med status",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  "top-leads": {
    id: "top-leads",
    title: "Topp leads",
    icon: <Users className="h-4 w-4" />,
    description: "Beste leads etter score",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  "upcoming-events": {
    id: "upcoming-events",
    title: "Kommende hendelser",
    icon: <Calendar className="h-4 w-4" />,
    description: "Planlagte oppfølginger",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  "notifications": {
    id: "notifications",
    title: "Varsler",
    icon: <Bell className="h-4 w-4" />,
    description: "Siste varsler og aktivitet",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  "quick-actions": {
    id: "quick-actions",
    title: "Hurtighandlinger",
    icon: <Zap className="h-4 w-4" />,
    description: "Snarveier til vanlige oppgaver",
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
  },
};

// Default layout
const defaultLayout: Layout[] = [
  { i: "stats-companies", x: 0, y: 0, w: 3, h: 2 },
  { i: "stats-campaigns", x: 3, y: 0, w: 3, h: 2 },
  { i: "stats-leads", x: 6, y: 0, w: 3, h: 2 },
  { i: "stats-performance", x: 9, y: 0, w: 3, h: 2 },
  { i: "chart-campaigns", x: 0, y: 2, w: 6, h: 4 },
  { i: "chart-leads", x: 6, y: 2, w: 6, h: 4 },
  { i: "recent-campaigns", x: 0, y: 6, w: 6, h: 4 },
  { i: "top-leads", x: 6, y: 6, w: 6, h: 4 },
];

const defaultVisibleWidgets: WidgetType[] = [
  "stats-companies",
  "stats-campaigns",
  "stats-leads",
  "stats-performance",
  "chart-campaigns",
  "chart-leads",
  "recent-campaigns",
  "top-leads",
];

interface DashboardWidgetsProps {
  renderWidget: (widgetId: WidgetType) => React.ReactNode;
  width?: number;
}

export function DashboardWidgets({ renderWidget, width = 1200 }: DashboardWidgetsProps) {
  const [layout, setLayout] = useState<Layout[]>(() => {
    const saved = localStorage.getItem("dashboard-layout");
    return saved ? JSON.parse(saved) : defaultLayout;
  });

  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(() => {
    const saved = localStorage.getItem("dashboard-visible-widgets");
    return saved ? JSON.parse(saved) : defaultVisibleWidgets;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = viewportWidth < 768;
  const gridWidth = Math.min(width, viewportWidth - 32);

  // Save layout to localStorage
  useEffect(() => {
    localStorage.setItem("dashboard-layout", JSON.stringify(layout));
  }, [layout]);

  // Save visible widgets to localStorage
  useEffect(() => {
    localStorage.setItem("dashboard-visible-widgets", JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
  };

  const handleResetLayout = () => {
    setLayout(defaultLayout);
    setVisibleWidgets(defaultVisibleWidgets);
  };

  const toggleWidget = (widgetId: WidgetType) => {
    if (visibleWidgets.includes(widgetId)) {
      setVisibleWidgets(visibleWidgets.filter(id => id !== widgetId));
      setLayout(layout.filter(l => l.i !== widgetId));
    } else {
      setVisibleWidgets([...visibleWidgets, widgetId]);
      const config = widgetConfigs[widgetId];
      // Find a good position for the new widget
      const maxY = Math.max(...layout.map(l => l.y + l.h), 0);
      setLayout([
        ...layout,
        {
          i: widgetId,
          x: 0,
          y: maxY,
          w: config.defaultSize.w,
          h: config.defaultSize.h,
        },
      ]);
    }
  };

  const removeWidget = (widgetId: WidgetType) => {
    setVisibleWidgets(visibleWidgets.filter(id => id !== widgetId));
    setLayout(layout.filter(l => l.i !== widgetId));
  };

  // Filter layout to only include visible widgets
  const filteredLayout = useMemo(() => {
    return layout.filter(l => visibleWidgets.includes(l.i as WidgetType));
  }, [layout, visibleWidgets]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditing && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
              <GripVertical className="h-4 w-4" />
              <span>Dra widgets for å omorganisere</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {isEditing ? "Ferdig" : "Tilpass"}
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Widgets
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Administrer widgets</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {Object.values(widgetConfigs).map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {config.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{config.title}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={visibleWidgets.includes(config.id)}
                      onCheckedChange={() => toggleWidget(config.id)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" size="sm" onClick={handleResetLayout}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tilbakestill
                </Button>
                <Button size="sm" onClick={() => setIsSettingsOpen(false)}>
                  Ferdig
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid Layout (desktop) / stacked (mobile) */}
      {isMobile ? (
        <div className="flex flex-col gap-4">
          {visibleWidgets.map((widgetId) => {
            const config = widgetConfigs[widgetId];
            return (
              <Card key={widgetId} className="overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
                  {config.icon}
                  <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 max-h-[420px] overflow-auto">
                  {renderWidget(widgetId)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
      <GridLayout
        className="layout"
        layout={filteredLayout}
        cols={12}
        rowHeight={80}
        width={gridWidth}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".widget-drag-handle"
        margin={[16, 16]}
      >
        {visibleWidgets.map((widgetId) => {
          const config = widgetConfigs[widgetId];
          return (
            <div key={widgetId} className="widget-container">
              <Card className="h-full overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <div className="widget-drag-handle cursor-move p-1 -ml-1 rounded hover:bg-muted">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeWidget(widgetId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-0 h-[calc(100%-3rem)] overflow-auto">
                  {renderWidget(widgetId)}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </GridLayout>
      )}

      {/* Empty state */}
      {visibleWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Settings2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Ingen widgets</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Klikk på "Widgets" for å legge til widgets på dashbordet
              </p>
            </div>
            <Button onClick={() => setIsSettingsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til widgets
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

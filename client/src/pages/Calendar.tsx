import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Building2,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Bell,
  Repeat,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO, addHours } from "date-fns";
import { nb } from "date-fns/locale";

// Event type colors and icons
const eventTypeConfig: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
  follow_up: { color: "text-blue-600", bgColor: "bg-blue-100", icon: Mail, label: "Oppfølging" },
  meeting: { color: "text-purple-600", bgColor: "bg-purple-100", icon: User, label: "Møte" },
  call: { color: "text-green-600", bgColor: "bg-green-100", icon: Phone, label: "Samtale" },
  task: { color: "text-orange-600", bgColor: "bg-orange-100", icon: CheckCircle2, label: "Oppgave" },
  reminder: { color: "text-yellow-600", bgColor: "bg-yellow-100", icon: Bell, label: "Påminnelse" },
};

// Status colors
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "follow_up" as string,
    startTime: "",
    endTime: "",
    allDay: false,
    location: "",
    reminderMinutes: 30,
    color: "#6366f1",
    notes: "",
  });

  // Get events for current month
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar-events", startDate.toISOString(), endDate.toISOString()],
    queryFn: () => trpc.calendar.getEvents.query({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  });

  // Get event counts by type
  const { data: eventCounts = [] } = useQuery({
    queryKey: ["calendar-event-counts"],
    queryFn: () => trpc.calendar.getCountByType.query(),
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => trpc.calendar.create.mutate({
      ...data,
      eventType: data.eventType as any,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-event-counts"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Hendelse opprettet", description: "Hendelsen er lagt til i kalenderen." });
    },
    onError: () => {
      toast({ title: "Feil", description: "Kunne ikke opprette hendelse.", variant: "destructive" });
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number } & Partial<typeof formData>) => trpc.calendar.update.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setEditingEvent(null);
      resetForm();
      toast({ title: "Hendelse oppdatert", description: "Endringene er lagret." });
    },
    onError: () => {
      toast({ title: "Feil", description: "Kunne ikke oppdatere hendelse.", variant: "destructive" });
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => trpc.calendar.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-event-counts"] });
      toast({ title: "Hendelse slettet", description: "Hendelsen er fjernet fra kalenderen." });
    },
    onError: () => {
      toast({ title: "Feil", description: "Kunne ikke slette hendelse.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventType: "follow_up",
      startTime: "",
      endTime: "",
      allDay: false,
      location: "",
      reminderMinutes: 30,
      color: "#6366f1",
      notes: "",
    });
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Add padding days from previous month
    const firstDayOfWeek = startDate.getDay();
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday start
    
    const prevMonthDays = [];
    for (let i = paddingDays; i > 0; i--) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i);
      prevMonthDays.push(date);
    }
    
    // Add padding days for next month
    const lastDayOfWeek = endDate.getDay();
    const nextPaddingDays = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    
    const nextMonthDays = [];
    for (let i = 1; i <= nextPaddingDays; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }
    
    return [...prevMonthDays, ...days, ...nextMonthDays];
  }, [startDate, endDate]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return (events as any[]).filter((event: any) => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const defaultStart = new Date(date);
    defaultStart.setHours(9, 0, 0, 0);
    const defaultEnd = addHours(defaultStart, 1);
    
    setFormData(prev => ({
      ...prev,
      startTime: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
    }));
    setIsCreateDialogOpen(true);
  };

  // Handle edit event
  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      eventType: event.event_type,
      startTime: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
      endTime: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : "",
      allDay: event.all_day || false,
      location: event.location || "",
      reminderMinutes: event.reminder_minutes || 30,
      color: event.color || "#6366f1",
      notes: event.notes || "",
    });
    setIsCreateDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Navigation
  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
            <p className="text-gray-500">Planlegg oppfølginger og møter</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingEvent(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ny hendelse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Rediger hendelse" : "Opprett ny hendelse"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Tittel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="F.eks. Oppfølging med Bedrift AS"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="eventType">Type</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Starttid *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Sluttid</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Sted</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="F.eks. Teams-møte eller kontoradresse"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Legg til detaljer om hendelsen..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="reminderMinutes">Påminnelse</Label>
                  <Select
                    value={formData.reminderMinutes.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Ingen påminnelse</SelectItem>
                      <SelectItem value="5">5 minutter før</SelectItem>
                      <SelectItem value="15">15 minutter før</SelectItem>
                      <SelectItem value="30">30 minutter før</SelectItem>
                      <SelectItem value="60">1 time før</SelectItem>
                      <SelectItem value="1440">1 dag før</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Farge</Label>
                  <div className="flex gap-2 mt-2">
                    {["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? "border-gray-900" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingEvent(null);
                      resetForm();
                    }}
                  >
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingEvent ? "Lagre endringer" : "Opprett hendelse"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(eventTypeConfig).map(([key, config]) => {
            const count = (eventCounts as any[]).find((c: any) => c.event_type === key)?.count || 0;
            return (
              <Card key={key} className={`${config.bgColor} border-0`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                    <div>
                      <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                      <p className="text-sm text-gray-600">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, "MMMM yyyy", { locale: nb })}
              </h2>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={goToToday}>
              I dag
            </Button>
          </CardHeader>
          <CardContent>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDay(date);
                const isCurrentMonth = isSameMonth(date, currentDate);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors
                      ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                      ${isSelected ? "ring-2 ring-indigo-500" : ""}
                      ${isTodayDate ? "border-indigo-500" : "border-gray-200"}
                      hover:bg-gray-50
                    `}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isTodayDate 
                        ? "bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center" 
                        : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    }`}>
                      {format(date, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event: any) => {
                        const config = eventTypeConfig[event.event_type] || eventTypeConfig.task;
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${config.bgColor} ${config.color}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            style={{ borderLeft: `3px solid ${event.color || "#6366f1"}` }}
                          >
                            {format(new Date(event.start_time), "HH:mm")} {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayEvents.length - 3} flere
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Kommende hendelser
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Laster...</div>
            ) : (events as any[]).length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Ingen kommende hendelser</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett din første hendelse
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(events as any[])
                  .filter((e: any) => new Date(e.start_time) >= new Date())
                  .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .slice(0, 10)
                  .map((event: any) => {
                    const config = eventTypeConfig[event.event_type] || eventTypeConfig.task;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        style={{ borderLeftWidth: "4px", borderLeftColor: event.color || "#6366f1" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.start_time), "d. MMM yyyy HH:mm", { locale: nb })}
                              {event.location && (
                                <>
                                  <MapPin className="h-3 w-3 ml-2" />
                                  {event.location}
                                </>
                              )}
                            </div>
                            {event.company_name && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <Building2 className="h-3 w-3" />
                                {event.company_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[event.status]}>
                            {event.status === "scheduled" ? "Planlagt" : 
                             event.status === "completed" ? "Fullført" : "Avlyst"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Rediger
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateMutation.mutate({ id: event.id, status: "completed" })}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Merk som fullført
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteMutation.mutate(event.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Slett
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

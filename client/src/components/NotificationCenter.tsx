import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Mail,
  MailOpen,
  MousePointer,
  MessageSquare,
  CheckCircle,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
  Clock,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  relatedId: number | null;
  relatedType: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

// Notification type configuration
const NOTIFICATION_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  email_opened: { icon: MailOpen, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'E-post åpnet' },
  email_clicked: { icon: MousePointer, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Lenke klikket' },
  email_replied: { icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Svar mottatt' },
  email_bounced: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'E-post avvist' },
  email_sent: { icon: Mail, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'E-post sendt' },
  campaign_completed: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Kampanje fullført' },
  campaign_started: { icon: Mail, color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Kampanje startet' },
  lead_converted: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Lead konvertert' },
  system: { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'System' },
};

// Get link for notification
const getNotificationLink = (notification: Notification): string | null => {
  if (!notification.relatedId || !notification.relatedType) return null;
  
  switch (notification.relatedType) {
    case 'campaign':
      return `/campaigns/${notification.relatedId}`;
    case 'lead':
      return `/leads`;
    case 'sequence':
      return `/sequences/${notification.relatedId}`;
    default:
      return null;
  }
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const prevCountRef = useRef<number | undefined>(undefined);
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notifications.getAll.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 15000 } // Check every 15 seconds
  );

  // Show toast for new notifications
  useEffect(() => {
    if (unreadCount !== undefined && prevCountRef.current !== undefined) {
      if (unreadCount > prevCountRef.current) {
        // New notification received - fetch and show toast
        utils.notifications.getAll.fetch({ limit: 1 }).then((result) => {
          if (result && result.length > 0) {
            const latest = result[0] as Notification;
            const config = NOTIFICATION_CONFIG[latest.type] || NOTIFICATION_CONFIG.system;
            const Icon = config.icon;
            
            toast(
              <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div>
                  <p className="font-medium text-sm">{latest.title}</p>
                  {latest.message && (
                    <p className="text-xs text-gray-500 mt-0.5">{latest.message}</p>
                  )}
                </div>
              </div>,
              {
                duration: 5000,
                action: {
                  label: 'Se',
                  onClick: () => setIsOpen(true),
                },
              }
            );
          }
        });
      }
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, utils]);

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      toast.success('Alle varsler er markert som lest');
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }
    // Navigate to related item if applicable
    if (notification.relatedType && notification.relatedId) {
      // Handle navigation based on type
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Varsler">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <Badge
                variant="destructive"
                className="relative h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Varsler</h3>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Merk alle som lest
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Ingen varsler ennå</p>
              <p className="text-xs text-muted-foreground mt-1">
                Du får beskjed når noe skjer
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications?.map((notification: Notification) => {
                const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
                const Icon = config.icon;
                const link = getNotificationLink(notification);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer group',
                      !notification.isRead && 'bg-indigo-50/50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: nb,
                          })}
                        </span>
                        {link && (
                          <Link href={link} onClick={(e: any) => e.stopPropagation()}>
                            <span className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
                              Se detaljer
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate({ id: notification.id });
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications && notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full text-sm" size="sm">
              Se alle varsler
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

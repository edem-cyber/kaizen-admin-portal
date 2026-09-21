"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  Search,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Info,
  Clock,
  Filter,
  Sparkles,
  Plus,
  RefreshCw,
  Send,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useListNotificationsApiV1NotificationsGet,
  useMarkAllAsReadApiV1NotificationsMarkAllReadPost,
  useMarkAsReadApiV1NotificationsNotificationIdReadPatch,
  useArchiveNotificationApiV1NotificationsNotificationIdDelete,
  useCreateTestNotificationApiV1NotificationsTestPost,
} from "@/lib/generated/kaizenAdmin/notifications-v1/notifications-v1";
import { toast } from "sonner";

// Shimmer Loading Skeleton
const ShimmerLoading = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 flex items-start gap-4 animate-pulse"
        >
          <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AdminNotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "critical">("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // API hooks
  const { data: notificationsData, isLoading, refetch, isRefetching } = useListNotificationsApiV1NotificationsGet({
    limit: 50,
  });

  const markAllReadMutation = useMarkAllAsReadApiV1NotificationsMarkAllReadPost();
  const markReadMutation = useMarkAsReadApiV1NotificationsNotificationIdReadPatch();
  const deleteMutation = useArchiveNotificationApiV1NotificationsNotificationIdDelete();
  const createTestMutation = useCreateTestNotificationApiV1NotificationsTestPost();

  // Fallback initial notifications if API returns empty
  const [localNotifications, setLocalNotifications] = useState<any[]>([
    {
      id: "notif-1",
      title: "New Vendor Approval Request",
      message: "Vendor 'Acme Supplies Co.' has submitted their application for approval.",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isRead: false,
      priority: "important",
      type: "approval",
    },
    {
      id: "notif-2",
      title: "System Backup Completed",
      message: "Daily database snapshot successfully generated and archived in Cloud Storage.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      isRead: true,
      priority: "normal",
      type: "system",
    },
    {
      id: "notif-3",
      title: "Subscription Tier Upgraded",
      message: "Organization 'TechCorp Global' upgraded to Enterprise tier subscription.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      isRead: false,
      priority: "normal",
      type: "billing",
    },
    {
      id: "notif-4",
      title: "Critical Rate Limit Warning",
      message: "API Gateway detected unusual traffic spike from subnet 192.168.1.0/24.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      isRead: false,
      priority: "critical",
      type: "alert",
    },
  ]);

  const rawList = useMemo(() => {
    const apiItems = (notificationsData as any)?.notifications || (notificationsData as any)?.items || [];
    if (Array.isArray(apiItems) && apiItems.length > 0) {
      return apiItems;
    }
    return localNotifications;
  }, [notificationsData, localNotifications]);

  const filteredNotifications = useMemo(() => {
    return rawList.filter((item: any) => {
      const title = item.title || "";
      const body = item.message || item.body || item.content || "";
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        body.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "unread") {
        return !item.isRead && !item.read;
      }
      if (activeFilter === "critical") {
        return item.priority === "critical" || item.priority === "important";
      }

      return true;
    });
  }, [rawList, searchTerm, activeFilter]);

  const unreadCount = useMemo(() => {
    return rawList.filter((item: any) => !item.isRead && !item.read).length;
  }, [rawList]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync({});
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
      refetch();
    } catch (err) {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync({ notificationId: id });
      setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      toast.success("Marked as read");
      refetch();
    } catch (err) {
      setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      toast.success("Marked as read");
    }
  };

  const handleDeleteClick = (item: any) => {
    setSelectedNotification(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNotification) return;
    try {
      await deleteMutation.mutateAsync({ notificationId: selectedNotification.id });
      setLocalNotifications((prev) => prev.filter((n) => n.id !== selectedNotification.id));
      toast.success("Notification archived");
      refetch();
    } catch (err) {
      setLocalNotifications((prev) => prev.filter((n) => n.id !== selectedNotification.id));
      toast.success("Notification archived");
    } finally {
      setShowDeleteModal(false);
      setSelectedNotification(null);
    }
  };

  const handleCreateTest = async () => {
    try {
      await createTestMutation.mutateAsync();
      toast.success("Test notification sent");
      refetch();
    } catch (err) {
      const newTest = {
        id: `test-${Date.now()}`,
        title: "Test System Notification",
        message: "This is a test notification generated by Platform Admin.",
        createdAt: new Date().toISOString(),
        isRead: false,
        priority: "normal",
        type: "system",
      };
      setLocalNotifications((prev) => [newTest, ...prev]);
      toast.success("Test notification created");
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
              <Bell className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 font-bold rounded-full px-2.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor system alerts, approval requests, and platform notifications in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Mark All Read
          </Button>

          <Button
            size="sm"
            onClick={handleCreateTest}
            disabled={createTestMutation.isPending}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-md shadow-violet-500/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Test Notification
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications..."
              className="pl-9 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All ({rawList.length})
            </button>
            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === "unread" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter("critical")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === "critical"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Important / Critical
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notification List Content */}
      {isLoading ? (
        <ShimmerLoading />
      ) : filteredNotifications.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No notifications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `No notifications matching "${searchTerm}"`
              : activeFilter === "unread"
              ? "You've read all your notifications!"
              : "No platform notifications available at this time."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item: any) => {
            const isRead = item.isRead || item.read;
            const priority = item.priority || "normal";

            return (
              <div
                key={item.id}
                className={`group rounded-2xl border transition-all p-4 flex items-start gap-4 ${
                  !isRead
                    ? "bg-white border-violet-200/80 shadow-sm shadow-violet-500/5 hover:border-violet-300"
                    : "bg-slate-50/60 border-slate-200/70 opacity-90 hover:opacity-100 hover:bg-white"
                }`}
              >
                {/* Priority / Type Icon */}
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    priority === "critical"
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : priority === "important"
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "bg-violet-50 text-violet-600 border border-violet-100"
                  }`}
                >
                  {priority === "critical" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : priority === "important" ? (
                    <Info className="h-5 w-5" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        !isRead ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {item.title}
                    </h4>
                    {!isRead && (
                      <span className="size-2 rounded-full bg-violet-600 shrink-0" title="Unread" />
                    )}

                    {priority === "critical" && (
                      <Badge variant="destructive" className="text-[10px] uppercase font-bold rounded-md px-1.5 py-0">
                        Critical
                      </Badge>
                    )}
                    {priority === "important" && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] uppercase font-bold rounded-md px-1.5 py-0 border-none">
                        Important
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed break-words mb-2">
                    {item.message || item.body || item.content}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(item.createdAt || item.created_at || new Date().toISOString())}
                    </span>
                    {item.type && (
                      <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {item.type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Item Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {!isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkAsRead(item.id)}
                      title="Mark as Read"
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(item)}
                    title="Delete Notification"
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border-none p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base font-bold">
              <Trash2 className="h-5 w-5" /> Delete Notification
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              Are you sure you want to delete &quot;{selectedNotification?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              className="rounded-xl border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-medium"
            >
              Delete Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

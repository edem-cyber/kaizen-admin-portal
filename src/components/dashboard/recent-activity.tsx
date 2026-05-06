"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetApprovalHistoryApiV1ApprovalsHistoryGet } from "@/lib/generated/kaizenAdmin/approvals-v1/approvals-v1";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

export function RecentActivity() {
    const { data: history, isLoading } = useGetApprovalHistoryApiV1ApprovalsHistoryGet();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    const items = (history as any[]) || [];

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'default';
            case 'rejected': return 'destructive';
            case 'returned': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="text-sm text-center py-8 text-muted-foreground">No recent activity found.</p>
                ) : (
                    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {items.map((item, index) => (
                            <div key={index} className="relative flex items-center justify-between pl-8">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary border-4 border-white shadow"></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{item.action_taken || "Action Taken"}</span>
                                    <span className="text-xs text-muted-foreground">{item.kaizenAdmin_title}</span>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <Badge variant={getStatusVariant(item.status)} className="capitalize text-[10px]">
                                        {item.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPendingApprovalsApiV1ApprovalsPendingGet } from "@/lib/generated/kaizenAdmin/approvals-v1/approvals-v1";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function PendingApprovals() {
    const { data: pending, isLoading } = useGetPendingApprovalsApiV1ApprovalsPendingGet();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        );
    }

    const items = (pending as any[]) || [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Approvals Pending</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/approvals">View all</Link>
                </Button>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg border border-dashed">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs text-muted-foreground">No kaizenAdmins pending your approval.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">{item.title || "Untitled KaizenAdmin"}</span>
                                    <span className="text-xs text-muted-foreground">Requested by {item.requester_name || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{item.currency} {Number(item.total_amount || 0).toLocaleString()}</div>
                                        <div className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/kaizenAdmins/${item.kaizenAdmin_id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

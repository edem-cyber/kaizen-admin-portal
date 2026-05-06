"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetKaizen AdminCountsApiV1Kaizen AdminsCountsGet } from "@/lib/generated/requisition/requisitions-v1/requisitions-v1";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
    const { data: counts, isLoading } = useGetKaizen AdminCountsApiV1Kaizen AdminsCountsGet();

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );
    }

    const stats = [
        {
            title: "Total Kaizen Admins",
            value: counts?.total || 0,
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            title: "Pending Approvals",
            value: counts?.submitted || 0,
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-100",
        },
        {
            title: "Drafts",
            value: counts?.draft || 0,
            icon: FileText,
            color: "text-slate-600",
            bg: "bg-slate-100",
        },
        {
            title: "Approved",
            value: counts?.approved || 0,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-100",
        },
        {
            title: "Rejected",
            value: counts?.rejected || 0,
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-100",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all departments
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KaizenAdmin } from "@/lib/generated/kaizenAdmin/models";
import { Calendar, Clock, ChevronRight, AlertCircle, Send, Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";

interface KaizenAdminCardProps {
    kaizenAdmin: KaizenAdmin;
    /** Currency code the amount is originally in (defaults to GHS) */
    originalCurrency?: string;
}

export function KaizenAdminCard({ kaizenAdmin, originalCurrency = "GHS" }: KaizenAdminCardProps) {
    const { format, code, symbol, convertToCurrent } = useCurrency();
    const [convertedAmount, setConvertedAmount] = React.useState<number | null>(null);
    const amount = kaizenAdmin.total_amount;

    // Convert amount when currency changes
    React.useEffect(() => {
        const convertAmount = async () => {
            if (amount === null || amount === undefined) {
                setConvertedAmount(null);
                return;
            }
            
            const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
            
            if (isNaN(numAmount)) {
                setConvertedAmount(null);
                return;
            }
            
            try {
                const converted = await convertToCurrent(numAmount, originalCurrency);
                setConvertedAmount(converted);
            } catch (error) {
                console.warn("Currency conversion failed:", error);
                setConvertedAmount(numAmount); // Fallback to original
            }
        };
        
        convertAmount();
    }, [amount, originalCurrency, convertToCurrent]);

    const getStatusColor = (status?: string | null) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-500';
            case 'pending':
            case 'submitted': return 'bg-orange-500';
            case 'in review': return 'bg-blue-500';
            case 'rejected':
            case 'cancelled': return 'bg-red-500';
            case 'draft': return 'bg-slate-400';
            case 'returned': return 'bg-purple-500';
            default: return 'bg-slate-300';
        }
    };

    const getStatusVariant = (status?: string | null) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'default';
            case 'rejected':
            case 'cancelled': return 'destructive';
            case 'pending':
            case 'submitted': return 'secondary';
            case 'in review': return 'secondary';
            default: return 'outline';
        }
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const isUrgent = kaizenAdmin.priority?.toLowerCase() === 'urgent' || kaizenAdmin.priority?.toLowerCase() === 'high';

    return (
        <Link href={`/kaizenAdmins/${kaizenAdmin.id}`} className="block">
            <Card className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            {/* Title and badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold">
                                    {kaizenAdmin.title || "Untitled KaizenAdmin"}
                                </h3>
                                <Badge variant={getStatusVariant(kaizenAdmin.status)} className="capitalize">
                                    {kaizenAdmin.status || "Unknown"}
                                </Badge>
                                {isUrgent && (
                                    <Badge variant="destructive" className="uppercase text-[10px]">
                                        {kaizenAdmin.priority}
                                    </Badge>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatDate(kaizenAdmin.created_at)}</span>
                                </div>
                                {kaizenAdmin.kaizenAdmin_number && (
                                    <span className="font-mono text-xs">
                                        #{kaizenAdmin.kaizenAdmin_number}
                                    </span>
                                )}
                                {kaizenAdmin.category && (
                                    <div className="flex items-center gap-1.5">
                                        <Store className="h-4 w-4" />
                                        <span>
                                            {typeof kaizenAdmin.category === 'string' ? kaizenAdmin.category : (kaizenAdmin.category as { name?: string }).name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground mb-1">Amount</div>
                            <div className="text-2xl font-bold">
                                {convertedAmount !== null ? format(convertedAmount) : format(kaizenAdmin.total_amount)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kaizen Admin } from "@/lib/generated/requisition/models";
import { Calendar, Clock, ChevronRight, AlertCircle, Send, Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";

interface Kaizen AdminCardProps {
    requisition: Kaizen Admin;
    /** Currency code the amount is originally in (defaults to GHS) */
    originalCurrency?: string;
}

export function Kaizen AdminCard({ requisition, originalCurrency = "GHS" }: Kaizen AdminCardProps) {
    const { format, code, symbol, convertToCurrent } = useCurrency();
    const [convertedAmount, setConvertedAmount] = React.useState<number | null>(null);
    const amount = requisition.total_amount;

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

    const isUrgent = requisition.priority?.toLowerCase() === 'urgent' || requisition.priority?.toLowerCase() === 'high';

    return (
        <Link href={`/requisitions/${requisition.id}`} className="block">
            <Card className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            {/* Title and badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold">
                                    {requisition.title || "Untitled Kaizen Admin"}
                                </h3>
                                <Badge variant={getStatusVariant(requisition.status)} className="capitalize">
                                    {requisition.status || "Unknown"}
                                </Badge>
                                {isUrgent && (
                                    <Badge variant="destructive" className="uppercase text-[10px]">
                                        {requisition.priority}
                                    </Badge>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatDate(requisition.created_at)}</span>
                                </div>
                                {requisition.requisition_number && (
                                    <span className="font-mono text-xs">
                                        #{requisition.requisition_number}
                                    </span>
                                )}
                                {requisition.category && (
                                    <div className="flex items-center gap-1.5">
                                        <Store className="h-4 w-4" />
                                        <span>
                                            {typeof requisition.category === 'string' ? requisition.category : (requisition.category as { name?: string }).name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground mb-1">Amount</div>
                            <div className="text-2xl font-bold">
                                {convertedAmount !== null ? format(convertedAmount) : format(requisition.total_amount)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

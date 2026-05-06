"use client";

import { Check, Clock, AlertCircle, XCircle, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStep {
    name?: string;
    step_name?: string;
    status?: string;
    approver?: string;
    approver_name?: string;
    timestamp?: string;
    is_current?: boolean;
    [key: string]: any;
}

interface WorkflowStepperProps {
    steps: WorkflowStep[];
    className?: string;
}

export function WorkflowStepper({ steps, className }: WorkflowStepperProps) {
    if (!steps || steps.length === 0) return null;

    const getStatusIcon = (status: string, isCurrent: boolean) => {
        const s = status?.toLowerCase();
        if (s === "approved") return <Check className="h-4 w-4" />;
        if (s === "rejected") return <XCircle className="h-4 w-4" />;
        if (s === "returned") return <Undo2 className="h-4 w-4" />;
        if (isCurrent) return <Clock className="h-4 w-4" />;
        return null;
    };

    const getStatusColor = (status: string, isCurrent: boolean) => {
        const s = status?.toLowerCase();
        if (s === "approved") return "bg-green-500 text-white";
        if (s === "rejected") return "bg-red-500 text-white";
        if (s === "returned") return "bg-orange-500 text-white";
        if (isCurrent) return "bg-blue-500 text-white animate-pulse";
        return "bg-slate-200 text-slate-400";
    };

    const getLineColor = (status: string, nextStatus: string) => {
        if (status?.toLowerCase() === "approved") return "bg-green-500";
        return "bg-slate-200";
    };

    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const status = step.status || (step.completed ? "approved" : "pending");
                    const isCurrent = step.is_current || (!step.completed && steps[index - 1]?.completed) || (index === 0 && !step.completed);
                    const name = step.name || step.step_name || `Level ${index + 1}`;

                    return (
                        <div key={index} className="flex items-center gap-2 flex-1">
                            <div className="flex items-center gap-3 flex-1">
                                {/* Icon */}
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                                    getStatusColor(status, isCurrent)
                                )}>
                                    {getStatusIcon(status, isCurrent) || <span className="text-xs font-bold">{index + 1}</span>}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className={cn(
                                        "text-sm font-medium truncate",
                                        isCurrent ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {name}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {(step.approver_name as string) || (step.approver as string) || "Pending assignment"}
                                    </div>
                                </div>
                            </div>

                            {/* Connecting Line */}
                            {!isLast && (
                                <div className={cn(
                                    "h-0.5 w-8 shrink-0",
                                    getLineColor(status, steps[index + 1]?.status || "pending")
                                )} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

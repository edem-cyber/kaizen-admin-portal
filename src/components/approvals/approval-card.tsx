"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Paperclip, MoreHorizontal, User, Shield, Undo2, Loader2, MessageSquare, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    useApproveKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdApprovePost,
    useRejectKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdRejectPost,
    useReturnForModificationApiV1ApprovalsKaizenAdminsKaizenAdminIdReturnPost,
} from "@/lib/generated/kaizenAdmin/approvals-v1/approvals-v1";
import { useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@/lib/api-error";
import { Can, PERMISSION, useAuthorization } from "@/lib/authorization";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";

type ActionType = "approve" | "reject" | "return";

const ACTION_COPY: Record<
    ActionType,
    {
        title: string;
        description: (title: string) => string;
        confirmLabel: string;
        inputLabel: string;
        inputPlaceholder: string;
        inputRequired: boolean;
        buttonClass: string;
        successMessage: string;
        errorFallback: string;
    }
> = {
    approve: {
        title: "Approve kaizenAdmin?",
        description: (title) => `Approve "${title}". Add an optional comment that will be visible on the approval chain.`,
        confirmLabel: "Approve",
        inputLabel: "Comments (optional)",
        inputPlaceholder: "e.g. Looks good — cleared with finance.",
        inputRequired: false,
        buttonClass: "bg-green-600 hover:bg-green-700 text-white",
        successMessage: "KaizenAdmin approved",
        errorFallback: "Failed to approve kaizenAdmin",
    },
    reject: {
        title: "Reject kaizenAdmin?",
        description: (title) => `Reject "${title}". The requester will be notified with your reason.`,
        confirmLabel: "Reject",
        inputLabel: "Reason",
        inputPlaceholder: "Why are you rejecting this kaizenAdmin?",
        inputRequired: true,
        buttonClass: "bg-red-600 hover:bg-red-700 text-white",
        successMessage: "KaizenAdmin rejected",
        errorFallback: "Failed to reject kaizenAdmin",
    },
    return: {
        title: "Return for modification?",
        description: (title) => `Send "${title}" back to the requester so they can revise and resubmit.`,
        confirmLabel: "Return",
        inputLabel: "What needs to change?",
        inputPlaceholder: "Describe the changes you'd like the requester to make.",
        inputRequired: true,
        buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
        successMessage: "Returned for modification",
        errorFallback: "Failed to return kaizenAdmin",
    },
};

interface ApprovalCardProps {
    approval: any; // Ideally use the generated type
    isHistory?: boolean;
}

export function ApprovalCard({ approval, isHistory = false }: ApprovalCardProps) {
    const [action, setAction] = useState<ActionType | null>(null);
    const [reasonInput, setReasonInput] = useState("");
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const queryClient = useQueryClient();
    const { hasPermission } = useAuthorization();
    const canRecordPayment =
        isHistory &&
        hasPermission(PERMISSION.PAYMENTS_WRITE) &&
        String(approval.kaizenAdmin_status ?? "").toLowerCase() === "approved";

    const nested = approval.kaizenAdmin || {};
    const kaizenAdminId = approval.kaizenAdmin_id || approval.id;

    const currentStepName =
        typeof approval.current_step === "object" && approval.current_step !== null
            ? approval.current_step.name
            : typeof approval.current_step === "string"
                ? approval.current_step
                : null;

    const view = {
        title:
            approval.title ??
            approval.kaizenAdmin_title ??
            nested.title ??
            "Untitled KaizenAdmin",
        kaizenAdmin_number:
            approval.kaizenAdmin_number ?? nested.kaizenAdmin_number ?? null,
        requester:
            approval.requester ??
            approval.requester_name ??
            nested.requester_name ??
            nested.requester ??
            "Unknown Requester",
        total_amount:
            approval.total_amount ??
            nested.total_amount ??
            nested.amount ??
            null,
        currency: approval.currency ?? nested.currency ?? "GHS",
        priority: approval.priority ?? nested.priority ?? "",
        submitted_at:
            approval.submitted_at ??
            approval.decided_at ??
            nested.submitted_at ??
            nested.created_at ??
            null,
        step_name: approval.step_name ?? currentStepName,
        attachments_count:
            approval.attachments_count ?? nested.attachments_count ?? 0,
    };

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/approvals/pending"] });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/approvals/history"] });
    };

    const approveMutation = useApproveKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdApprovePost();
    const rejectMutation = useRejectKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdRejectPost();
    const returnMutation = useReturnForModificationApiV1ApprovalsKaizenAdminsKaizenAdminIdReturnPost();

    const activeMutation =
        action === "approve"
            ? approveMutation
            : action === "reject"
                ? rejectMutation
                : action === "return"
                    ? returnMutation
                    : null;
    const isPending = !!activeMutation?.isPending;

    const closeDialog = () => {
        if (isPending) return;
        setAction(null);
        setReasonInput("");
    };

    const submitAction = async () => {
        if (!action) return;
        const copy = ACTION_COPY[action];
        const trimmed = reasonInput.trim();
        if (copy.inputRequired && !trimmed) {
            toast.error(`${copy.inputLabel} is required`);
            return;
        }

        try {
            if (action === "approve") {
                await approveMutation.mutateAsync({
                    kaizenAdminId,
                    params: trimmed ? { comments: trimmed } : undefined,
                });
            } else if (action === "reject") {
                await rejectMutation.mutateAsync({
                    kaizenAdminId,
                    params: { reason: trimmed },
                });
            } else if (action === "return") {
                await returnMutation.mutateAsync({
                    kaizenAdminId,
                    params: { reason: trimmed },
                });
            }
            toast.success(copy.successMessage);
            invalidate();
            setAction(null);
            setReasonInput("");
        } catch (err) {
            toast.error(extractErrorMessage(err, copy.errorFallback));
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return "N/A";
        try {
            return new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch (e) {
            return "Invalid Date";
        }
    };

    const formatCurrency = (amount: number | string | null, currency: string = "GHS") => {
        const value = typeof amount === "string" ? parseFloat(amount) : amount;
        if (value === null || isNaN(value)) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
        }).format(value);
    };

    const getPriorityBadge = (priority: string = "") => {
        const p = priority.toLowerCase();
        if (p === "urgent") return <Badge variant="destructive" className="uppercase text-[10px] font-bold">Urgent</Badge>;
        if (p === "high") return <Badge variant="outline" className="bg-orange-500 hover:bg-orange-600 border-none text-white uppercase text-[10px] font-bold">High</Badge>;
        return null;
    };

    const getStatusBadge = () => {
        const raw = approval.status ?? approval.action ?? approval.action_taken;
        const status = raw ? String(raw).toLowerCase() : null;
        if (status === "approved") {
            return (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Approved
                </Badge>
            );
        }
        if (status === "rejected") {
            return (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 font-medium">
                    <XCircle className="h-3 w-3" />
                    Rejected
                </Badge>
            );
        }
        if (status === "returned" || status === "returned_for_modification") {
            return (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-medium">
                    <Undo2 className="h-3 w-3" />
                    Returned
                </Badge>
            );
        }
        if (isHistory) {
            return null;
        }
        return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-medium">
                <Clock className="h-3 w-3" />
                Pending
            </Badge>
        );
    };

    return (
        <>
            <Card className="hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg text-foreground">
                                    {view.title}
                                </h3>
                                {getPriorityBadge(view.priority)}
                                {isHistory && getStatusBadge()}
                                {isHistory && approval.kaizenAdmin_status && (
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                                            approval.is_terminal
                                                ? "border-muted-foreground/20 bg-muted text-muted-foreground"
                                                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300"
                                        }`}
                                        title={
                                            approval.is_terminal
                                                ? "KaizenAdmin has reached a final state"
                                                : "KaizenAdmin is still in flight"
                                        }
                                    >
                                        {!approval.is_terminal && <Clock className="h-3 w-3" />}
                                        Current: {String(approval.kaizenAdmin_status).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <User className="h-4 w-4" />
                                <span>{view.requester}</span>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground mb-1">Total Amount</div>
                            <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(view.total_amount, view.currency)}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground font-mono">
                                {view.kaizenAdmin_number || `#${kaizenAdminId?.toString().slice(0, 8)}`}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pb-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>Submitted: {formatDate(view.submitted_at)}</span>
                        </div>
                        {view.attachments_count > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Paperclip className="h-4 w-4" />
                                <span>{view.attachments_count} Attachments</span>
                            </div>
                        )}
                    </div>

                    {view.step_name && !isHistory && (
                        <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                            <Shield className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Current Step</p>
                                <p className="text-sm font-medium">
                                    {view.step_name}
                                </p>
                            </div>
                        </div>
                    )}

                    {approval.comments && isHistory && (
                        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground italic">
                            "{approval.comments}"
                        </div>
                    )}
                </CardContent>

                <CardFooter className="bg-muted/50 flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href={`/kaizenAdmins/${kaizenAdminId}?from=approvals${isHistory ? "&tab=history" : ""}`}
                        >
                            <Button variant="outline">
                                View Details
                            </Button>
                        </Link>
                        {canRecordPayment && (
                            <Button
                                variant="outline"
                                onClick={() => setIsPaymentOpen(true)}
                            >
                                <CircleDollarSign className="mr-2 h-4 w-4" />
                                Record Payment
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {!isHistory && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setAction("return")}
                                >
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Return
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => setAction("reject")}
                                >
                                    Reject
                                </Button>
                                <Button onClick={() => setAction("approve")}>
                                    Approve
                                </Button>
                            </>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/kaizenAdmins/${kaizenAdminId}/discussion`}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Open Discussion
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardFooter>
            </Card>

            <Dialog
                open={action !== null}
                onOpenChange={(open) => {
                    if (!open) closeDialog();
                }}
            >
                <DialogContent>
                    {action && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{ACTION_COPY[action].title}</DialogTitle>
                                <DialogDescription>
                                    {ACTION_COPY[action].description(
                                        view.title || "this kaizenAdmin",
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="approval_reason">
                                    {ACTION_COPY[action].inputLabel}
                                    {ACTION_COPY[action].inputRequired && (
                                        <span className="text-destructive ml-1">*</span>
                                    )}
                                </Label>
                                <Textarea
                                    id="approval_reason"
                                    rows={3}
                                    placeholder={ACTION_COPY[action].inputPlaceholder}
                                    value={reasonInput}
                                    onChange={(e) => setReasonInput(e.target.value)}
                                    disabled={isPending}
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={closeDialog}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={ACTION_COPY[action].buttonClass}
                                    disabled={isPending}
                                    onClick={submitAction}
                                >
                                    {isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {ACTION_COPY[action].confirmLabel}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {canRecordPayment && (
                <RecordPaymentDialog
                    open={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    kaizenAdminId={kaizenAdminId}
                    currency={view.currency || "GHS"}
                    onRecorded={() => setIsPaymentOpen(false)}
                />
            )}
        </>
    );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Plus,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Can, PERMISSION } from "@/lib/authorization";
import { extractErrorMessage } from "@/lib/api-error";
import {
  getPaymentHistory,
  type PaymentHistory,
  type PaymentHistoryEntry,
} from "@/lib/payments";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";
import { cn } from "@/lib/utils";

interface PaymentsTabProps {
  requisitionId: string;
  currency?: string;
}

function formatMoney(value: string | number, currency: string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PaymentsTab({ requisitionId, currency = "GHS" }: PaymentsTabProps) {
  const [history, setHistory] = useState<PaymentHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPaymentHistory(requisitionId);
      setHistory(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load payment history"));
    } finally {
      setIsLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFullyPaid = !!history?.is_fully_paid;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              Payment Summary
            </CardTitle>
            <Can permission={PERMISSION.PAYMENTS_WRITE}>
              <Button
                size="sm"
                onClick={() => setIsRecordOpen(true)}
                disabled={isFullyPaid}
              >
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </Can>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !history ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : history ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCell label="Total" value={formatMoney(history.total_amount, currency)} />
              <SummaryCell
                label="Paid to Date"
                value={formatMoney(history.amount_paid_to_date, currency)}
              />
              <SummaryCell
                label="Remaining"
                value={formatMoney(history.amount_remaining, currency)}
              />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                {isFullyPaid ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Fully Paid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                    Partial
                  </Badge>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          Payment History
        </h3>
        {isLoading && !history ? null : !history || history.payments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No payments recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Payments recorded against this requisition will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.payments.map((p, idx) => (
              <PaymentRow
                key={`${p.payment_reference}-${p.recorded_at}-${idx}`}
                entry={p}
                currency={currency}
              />
            ))}
          </div>
        )}
      </div>

      <RecordPaymentDialog
        open={isRecordOpen}
        onOpenChange={setIsRecordOpen}
        requisitionId={requisitionId}
        currency={currency}
        amountRemaining={history?.amount_remaining}
        onRecorded={() => {
          setIsRecordOpen(false);
          void refresh();
        }}
      />
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function PaymentRow({
  entry,
  currency,
}: {
  entry: PaymentHistoryEntry;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const hasLines = entry.lines && entry.lines.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {entry.payment_reference}
                </div>
                <div className="text-xs text-muted-foreground">
                  Paid {formatDateTime(entry.payment_date)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="font-bold">
                  {formatMoney(entry.amount, currency)}
                </div>
                {hasLines && (
                  <div className="text-[10px] text-muted-foreground">
                    {entry.lines.length} line{entry.lines.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>
              {hasLines && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        {hasLines && (
          <CollapsibleContent>
            <div className="border-t bg-muted/20 p-3 space-y-1.5">
              {entry.lines.map((line, i) => (
                <div
                  key={`${line.budget_code}-${i}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-muted-foreground truncate">
                      {line.budget_code}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {line.invoice_reference}
                    </div>
                  </div>
                  <div className="font-medium shrink-0">
                    {formatMoney(line.amount, currency)}
                  </div>
                </div>
              ))}
              <div className="pt-1.5 mt-1.5 border-t text-[11px] text-muted-foreground">
                Recorded {formatDateTime(entry.recorded_at)}
              </div>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}


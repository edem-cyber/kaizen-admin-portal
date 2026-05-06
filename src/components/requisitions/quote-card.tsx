"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  CheckCircle2,
  Edit3,
  Loader2,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Can, PERMISSION } from "@/lib/authorization";
import { extractErrorMessage } from "@/lib/api-error";
import {
  deleteVendorQuote,
  deselectVendorQuote,
  selectVendorQuote,
  updateVendorQuote,
  type VendorQuote,
  type VendorQuoteCreate,
  type VendorQuoteUpdate,
} from "@/lib/vendor-quotes";
import { QuoteForm } from "./quote-form";
import { QuoteDocumentsPanel } from "./quote-documents-panel";
import { cn } from "@/lib/utils";

interface QuoteCardProps {
  quote: VendorQuote;
  kaizenAdminId: string;
  vendorNameById: Record<string, string>;
  defaultCurrency?: string;
  onChanged: () => void | Promise<void>;
}

function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export function QuoteCard({
  quote,
  kaizenAdminId,
  vendorNameById,
  defaultCurrency,
  onChanged,
}: QuoteCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [selectionReason, setSelectionReason] = useState("");

  const vendorName = useMemo(() => {
    return vendorNameById[quote.vendor_id] ?? `Vendor ${quote.vendor_id.slice(0, 8)}`;
  }, [quote.vendor_id, vendorNameById]);

  const currency = quote.currency || defaultCurrency || "USD";
  const isSelected = !!quote.is_selected;

  const handleEdit = async (payload: VendorQuoteCreate) => {
    setIsBusy(true);
    try {
      // Strip immutable fields before sending the partial update
      const { vendor_id: _v, kaizenAdmin_id: _r, ...updatable } = payload;
      void _v;
      void _r;
      await updateVendorQuote(quote.id, updatable as VendorQuoteUpdate);
      toast.success("Quote updated");
      setIsEditOpen(false);
      await onChanged();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update quote"));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectConfirm = async () => {
    setIsBusy(true);
    try {
      await selectVendorQuote(quote.id, selectionReason.trim() || undefined);
      toast.success("Quote selected");
      setIsSelectOpen(false);
      setSelectionReason("");
      await onChanged();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to select quote"));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeselect = async () => {
    setIsBusy(true);
    try {
      await deselectVendorQuote(quote.id);
      toast.success("Quote deselected");
      await onChanged();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to deselect quote"));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsBusy(true);
    try {
      await deleteVendorQuote(quote.id);
      toast.success("Quote deleted");
      setIsDeleteOpen(false);
      await onChanged();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete quote"));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          "transition-shadow overflow-hidden",
          isSelected && "border-emerald-400 shadow-emerald-100/50 shadow-md",
        )}
      >
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                    isSelected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">
                      {vendorName}
                    </h3>
                    {isSelected && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  {quote.quote_number && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {quote.quote_number}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg font-bold">
                  {formatMoney(Number(quote.total_amount), currency)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Qty × Unit</div>
                <div className="font-medium">
                  {quote.quantity} × {formatMoney(Number(quote.unit_price), currency)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Valid Until</div>
                <div className="font-medium">{formatDate(quote.valid_until)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Lead Time</div>
                <div className="font-medium">{quote.delivery_lead_time}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Payment Terms</div>
                <div className="font-medium">
                  {String(quote.payment_terms).replace(/_/g, " ").toUpperCase()}
                </div>
              </div>
            </div>

            {quote.warranty_terms && (
              <div className="text-sm pt-1">
                <div className="text-xs text-muted-foreground">Warranty</div>
                <div>{quote.warranty_terms}</div>
              </div>
            )}

            {isSelected && quote.selection_reason && (
              <div className="text-sm rounded-md bg-emerald-50 border border-emerald-100 p-2.5">
                <div className="text-xs font-semibold text-emerald-800">
                  Selection reason
                </div>
                <div className="text-emerald-900">{quote.selection_reason}</div>
              </div>
            )}
          </div>

          <QuoteDocumentsPanel quoteId={quote.id} />

          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted/30 border-t">
            <Can permission={PERMISSION.VENDORS_APPROVE}>
              {isSelected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselect}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Deselect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsSelectOpen(true)}
                  disabled={isBusy}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Select
                </Button>
              )}
            </Can>
            <Can permission={PERMISSION.VENDORS_WRITE}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                disabled={isBusy}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setIsDeleteOpen(true)}
                disabled={isBusy}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </Can>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isEditOpen}
        onOpenChange={(o) => {
          if (!o && !isBusy) setIsEditOpen(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quote from {vendorName}</DialogTitle>
            <DialogDescription>
              Update pricing, terms, or warranty. The vendor cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <QuoteForm
            kaizenAdminId={kaizenAdminId}
            initialData={quote}
            defaultCurrency={defaultCurrency}
            isSubmitting={isBusy}
            onSubmit={handleEdit}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSelectOpen}
        onOpenChange={(o) => {
          if (!o && !isBusy) {
            setIsSelectOpen(false);
            setSelectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select this quote?</DialogTitle>
            <DialogDescription>
              Mark <strong>{vendorName}</strong>&rsquo;s quote (
              {formatMoney(Number(quote.total_amount), currency)}) as the
              selected vendor for this kaizenAdmin. Add an optional note to
              explain the decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="selection_reason">Selection reason (optional)</Label>
            <Textarea
              id="selection_reason"
              rows={3}
              placeholder="Why this vendor was chosen…"
              value={selectionReason}
              onChange={(e) => setSelectionReason(e.target.value)}
              disabled={isBusy}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSelectOpen(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button onClick={handleSelectConfirm} disabled={isBusy}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Select Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(o) => {
          if (!o && !isBusy) setIsDeleteOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quote?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the {formatMoney(Number(quote.total_amount), currency)} quote
              from <strong>{vendorName}</strong>. Any attached documents remain
              on file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

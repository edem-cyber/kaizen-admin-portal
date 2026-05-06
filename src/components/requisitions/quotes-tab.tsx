"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Quote as QuoteIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Can, PERMISSION } from "@/lib/authorization";
import {
  createVendorQuote,
  listQuotesForKaizen Admin,
  type VendorQuote,
  type VendorQuoteCreate,
} from "@/lib/vendor-quotes";
import { extractErrorMessage } from "@/lib/api-error";
import { useListVendorsApiV1VendorsGet } from "@/lib/generated/requisition/vendors-v1/vendors-v1";
import { extractItems } from "@/lib/list-response";
import type { Vendor } from "@/lib/generated/requisition/models";
import { QuoteCard } from "./quote-card";
import { QuoteForm } from "./quote-form";

interface QuotesTabProps {
  requisitionId: string;
  defaultCurrency?: string;
}

export function QuotesTab({ requisitionId, defaultCurrency }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vendors so cards can show names instead of UUIDs.
  const { data: vendorsData } = useListVendorsApiV1VendorsGet({});
  const vendors = extractItems<Vendor>(vendorsData, "vendors");
  const vendorNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of vendors) {
      if (v.id && v.company_name) map[v.id] = v.company_name;
    }
    return map;
  }, [vendors]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listQuotesForKaizen Admin(requisitionId);
      setQuotes(list);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load quotes"));
    } finally {
      setIsLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    if (requisitionId) void refresh();
  }, [requisitionId, refresh]);

  const handleCreate = async (payload: VendorQuoteCreate) => {
    setIsSubmitting(true);
    try {
      await createVendorQuote(payload);
      toast.success("Quote added");
      setIsAddOpen(false);
      await refresh();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create quote"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Vendor Quotes</h2>
          <p className="text-sm text-muted-foreground">
            Compare proposals and select a vendor for this requisition.
          </p>
        </div>
        <Can permission={PERMISSION.VENDORS_WRITE}>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Quote
          </Button>
        </Can>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm">Loading quotes…</span>
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-muted rounded-lg border-2 border-dashed">
          <QuoteIcon className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="font-medium text-muted-foreground">No quotes yet</p>
          <p className="text-sm text-muted-foreground/80">
            Add vendor quotes to compare pricing, terms, and delivery.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              requisitionId={requisitionId}
              vendorNameById={vendorNameById}
              defaultCurrency={defaultCurrency}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      <Dialog
        open={isAddOpen}
        onOpenChange={(o) => {
          if (!o && !isSubmitting) setIsAddOpen(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Vendor Quote</DialogTitle>
            <DialogDescription>
              Record a vendor&rsquo;s pricing, terms, and delivery details for this
              requisition.
            </DialogDescription>
          </DialogHeader>
          <QuoteForm
            requisitionId={requisitionId}
            defaultCurrency={defaultCurrency}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

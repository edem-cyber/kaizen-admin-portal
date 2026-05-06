"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Paperclip, Download, X, Undo2 } from "lucide-react";
import { useListVendorCategoriesApiV1VendorsCategoriesGet } from "@/lib/generated/kaizenAdmin/vendors-v1/vendors-v1";
import {
  downloadDocument,
  readDocumentFields,
  type DocumentListItem,
} from "@/lib/documents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PolicyConfiguration } from "@/lib/generated/kaizenAdmin/models";
import {
  applyAmountThresholds,
  computeVendorPolicyRules,
  type VendorPolicyRules,
} from "./shared/use-vendor-policy";
import {
  VendorFieldsSection,
  validateVendorAgainstPolicy,
  type VendorInfoLike,
} from "./shared/vendor-fields-section";
import { taxInclusionSuffix } from "./shared/tax-label";
import { AccountingReferenceFields } from "./shared/accounting-references-fields";

const DEFAULT_CURRENCY_FALLBACK = "USD";

/**
 * Minimal-mode kaizenAdmin schema per KaizenAdmin_Form_Selection.md §"Minimal-form request body".
 * Used when `accounting_config.require_budget_lines === false`.
 *
 * Required: title, description.
 * Recommended: total_amount, currency.
 * Optional: justification, priority, category, vendor_info, delivery_date, metadata.
 * Must NOT send budget_lines — handled by the caller's submit handler by omission.
 *
 * `allowPastDeliveryDate` relaxes the future-only refine for edit flows —
 * an existing kaizenAdmin's stored delivery_date may legitimately be in the
 * past, and we don't want to block the user from saving unrelated edits.
 */
interface MinimalKaizenAdminSchemaConfig {
  allowPastDeliveryDate?: boolean;
  requireGlAccount?: boolean;
  requireProjectCode?: boolean;
  /**
   * When non-empty, the currency must be a member of this list. An
   * empty/undefined list disables the check (no org-level restriction).
   */
  supportedCurrencies?: string[];
  /**
   * On edit, allow the existing currency to round-trip even if the org
   * has since narrowed `supported_currencies` and no longer includes it.
   * Only fresh selections are bound to the new list.
   */
  initialCurrency?: string;
}

function buildMinimalKaizenAdminSchema({
  allowPastDeliveryDate = false,
  requireGlAccount = false,
  requireProjectCode = false,
  supportedCurrencies,
  initialCurrency,
}: MinimalKaizenAdminSchemaConfig) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Keep the title under 200 characters"),
    description: z.string().trim().min(1, "Description is required"),
    total_amount: z
      .number({ error: "Enter an amount" })
      .min(0, "Must be zero or greater"),
    currency: z
      .string()
      .trim()
      .length(3, "3-letter ISO code")
      .regex(/^[A-Z]{3}$/, "Use uppercase letters")
      .refine(
        (val) => {
          if (!supportedCurrencies?.length) return true;
          if (initialCurrency && val === initialCurrency) return true;
          return supportedCurrencies.includes(val);
        },
        "Currency is not supported by your organization",
      ),
    justification: z.string().optional().or(z.literal("")),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    category: z.string().optional().or(z.literal("")),
    delivery_date: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (d) => allowPastDeliveryDate || !d || new Date(d) > new Date(),
        "Delivery date must be in the future",
      ),
    vendor_info: z
      .object({
        vendor_name: z.string().optional(),
        vendor_id: z.string().optional(),
        contact: z.string().optional(),
        tax_id: z.string().optional(),
        bank_name: z.string().optional(),
        bank_account_number: z.string().optional(),
      })
      .optional(),
    gl_account: requireGlAccount
      ? z.string().trim().min(1, "GL account is required")
      : z.string().optional().or(z.literal("")),
    project_code: requireProjectCode
      ? z.string().trim().min(1, "Project code is required")
      : z.string().optional().or(z.literal("")),
  });
}

const minimalKaizenAdminSchema = buildMinimalKaizenAdminSchema({
  allowPastDeliveryDate: false,
  requireGlAccount: false,
  requireProjectCode: false,
});

export type MinimalKaizenAdminFormValues = z.infer<typeof minimalKaizenAdminSchema>;

export interface MinimalKaizenAdminFormSubmitExtras {
  newFiles: File[];
  deleteAttachmentIds: string[];
}

interface MinimalKaizenAdminFormProps {
  initialData?: Partial<MinimalKaizenAdminFormValues>;
  existingAttachments?: DocumentListItem[];
  onSubmit: (
    data: MinimalKaizenAdminFormValues,
    extras: MinimalKaizenAdminFormSubmitExtras,
  ) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isUploading?: boolean;
  defaultCurrency?: string;
  supportedCurrencies?: string[];
  allowMultiCurrency?: boolean;
  policyConfig?: PolicyConfiguration | null;
  /**
   * "inclusive" | "exclusive" — used to decorate amount labels with an
   * "(incl. tax)" / "(excl. tax)" hint.
   */
  taxInclusion?: string | null;
  /**
   * Relax the "delivery_date must be in the future" refine. Set to true
   * for edit flows where an existing kaizenAdmin's stored delivery_date
   * may already be in the past — otherwise the user can't save any
   * edits until they change the date.
   */
  allowPastDeliveryDate?: boolean;
  requireGlAccount?: boolean;
  requireProjectCode?: boolean;
  submitLabel?: string;
}

interface CategoryOption {
  id?: string;
  name?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function MinimalKaizenAdminForm({
  initialData,
  existingAttachments = [],
  onSubmit,
  onCancel,
  isLoading,
  isUploading,
  defaultCurrency,
  supportedCurrencies,
  allowMultiCurrency = true,
  policyConfig,
  taxInclusion,
  allowPastDeliveryDate = false,
  requireGlAccount = false,
  requireProjectCode = false,
  submitLabel,
}: MinimalKaizenAdminFormProps) {
  const baseRules: VendorPolicyRules = useMemo(
    () => computeVendorPolicyRules(policyConfig),
    [policyConfig],
  );
  const initialCurrency = initialData?.currency?.toUpperCase();
  const supportedCurrenciesKey = (supportedCurrencies ?? []).join(",");
  const schema = useMemo(
    () =>
      buildMinimalKaizenAdminSchema({
        allowPastDeliveryDate,
        requireGlAccount,
        requireProjectCode,
        supportedCurrencies,
        initialCurrency,
      }),
    // supportedCurrenciesKey stabilises the dependency against array identity
    // churn across React Query refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      allowPastDeliveryDate,
      requireGlAccount,
      requireProjectCode,
      supportedCurrenciesKey,
      initialCurrency,
    ],
  );
  const baseCurrency = defaultCurrency?.trim() || DEFAULT_CURRENCY_FALLBACK;

  const { data: categoriesData } = useListVendorCategoriesApiV1VendorsCategoriesGet();
  const categories = useMemo<CategoryOption[]>(() => {
    const payload = categoriesData as unknown;
    if (!payload) return [];
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: unknown[] }).data
        : [];
    return (list as CategoryOption[]).filter((c) => c && typeof c.name === "string");
  }, [categoriesData]);

  // Currency dropdown options. If multi-currency is disabled, the form
  // locks to defaultCurrency (select is hidden).
  const currencyOptions = useMemo<string[]>(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (c?: string) => {
      if (!c) return;
      const upper = c.toUpperCase();
      if (seen.has(upper)) return;
      seen.add(upper);
      out.push(upper);
    };
    push(baseCurrency);
    (supportedCurrencies ?? []).forEach(push);
    return out;
  }, [baseCurrency, supportedCurrencies]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MinimalKaizenAdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      total_amount: initialData?.total_amount ?? 0,
      currency: (initialData?.currency ?? baseCurrency).toUpperCase(),
      justification: initialData?.justification ?? "",
      priority: initialData?.priority ?? "normal",
      category: initialData?.category ?? "",
      delivery_date: initialData?.delivery_date ?? "",
      vendor_info:
        initialData?.vendor_info ?? { vendor_name: "", contact: "" },
      gl_account: initialData?.gl_account ?? "",
      project_code: initialData?.project_code ?? "",
    },
  });

  const priority = watch("priority");
  const currency = watch("currency");
  const category = watch("category");
  const watchedTotal = watch("total_amount");
  const totalAmount = Number(watchedTotal) || 0;
  const policyRules: VendorPolicyRules = useMemo(
    () => applyAmountThresholds(baseRules, totalAmount, policyConfig),
    [baseRules, totalAmount, policyConfig],
  );

  // Attachment handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(
    new Set(),
  );

  const handleFilePick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 25MB`);
        continue;
      }
      picked.push(file);
    }
    setPendingFiles((prev) => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleDeleteExisting = (id: string) => {
    setMarkedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onValid = (values: MinimalKaizenAdminFormValues) => {
    // Count attachments that will remain after save. Quote-attachment
    // enforcement keys off this, so deletions are subtracted too.
    const remainingExisting = existingAttachments.filter(
      (a) => !a.id || !markedForDeletion.has(a.id),
    ).length;
    const totalAttached = remainingExisting + pendingFiles.length;

    const violation = validateVendorAgainstPolicy(
      policyRules,
      values.vendor_info,
      totalAttached,
    );
    if (violation) {
      toast.error(violation);
      return;
    }

    onSubmit(values, {
      newFiles: pendingFiles,
      deleteAttachmentIds: Array.from(markedForDeletion),
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="e.g. Office chairs for new hires"
            disabled={isLoading}
            {...register("title")}
            aria-invalid={!!errors.title}
            className={cn(
              errors.title && "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="What are you requesting, and why?"
            disabled={isLoading}
            {...register("description")}
            aria-invalid={!!errors.description}
            className={cn(
              errors.description &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_amount">
            Total amount
            <span className="text-muted-foreground font-normal">
              {taxInclusionSuffix(taxInclusion)}
            </span>
          </Label>
          <Input
            id="total_amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            disabled={isLoading}
            {...register("total_amount", { valueAsNumber: true })}
            aria-invalid={!!errors.total_amount}
            className={cn(
              errors.total_amount &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.total_amount && (
            <p className="text-xs text-destructive">{errors.total_amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          {allowMultiCurrency && currencyOptions.length > 1 ? (
            <Select
              value={currency}
              onValueChange={(v) =>
                setValue("currency", v.toUpperCase(), { shouldValidate: true })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                    {c === baseCurrency && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (default)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Multi-currency disabled or only one option — lock to the default.
            <Input id="currency" value={baseCurrency} disabled readOnly />
          )}
          <input type="hidden" {...register("currency")} />
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) =>
              setValue(
                "priority",
                v as MinimalKaizenAdminFormValues["priority"],
                { shouldValidate: true },
              )
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category (optional)</Label>
          <Select
            value={category || undefined}
            onValueChange={(v) =>
              setValue("category", v, { shouldValidate: true })
            }
            disabled={isLoading || categories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c, i) => (
                <SelectItem key={c.id ?? c.name ?? i} value={c.name ?? ""}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_date">Delivery date (optional)</Label>
          <Input
            id="delivery_date"
            type="date"
            disabled={isLoading}
            {...register("delivery_date")}
            aria-invalid={!!errors.delivery_date}
            className={cn(
              errors.delivery_date &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.delivery_date && (
            <p className="text-xs text-destructive">
              {errors.delivery_date.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="justification">Justification (optional)</Label>
        <Textarea
          id="justification"
          rows={3}
          placeholder="Why is this needed?"
          disabled={isLoading}
          {...register("justification")}
        />
      </div>

      <VendorFieldsSection
        rules={policyRules}
        value={watch("vendor_info") as VendorInfoLike | undefined}
        onChange={(next) =>
          setValue("vendor_info", next as MinimalKaizenAdminFormValues["vendor_info"], {
            shouldValidate: true,
          })
        }
        disabled={isLoading}
        attachedQuoteCount={
          existingAttachments.filter(
            (a) => !a.id || !markedForDeletion.has(a.id),
          ).length + pendingFiles.length
        }
      />

      <AccountingReferenceFields
        requireGlAccount={requireGlAccount}
        requireProjectCode={requireProjectCode}
        glAccount={watch("gl_account") ?? ""}
        projectCode={watch("project_code") ?? ""}
        onGlAccountChange={(v) =>
          setValue("gl_account", v, { shouldValidate: true })
        }
        onProjectCodeChange={(v) =>
          setValue("project_code", v, { shouldValidate: true })
        }
        glAccountError={errors.gl_account?.message}
        projectCodeError={errors.project_code?.message}
        disabled={isLoading}
      />

      {/* Attachments */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> Attachments
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
          >
            Add files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFilePick(e.target.files)}
          />
        </div>

        {existingAttachments.length > 0 && (
          <ul className="space-y-1.5">
            {existingAttachments.map((raw) => {
              const doc = readDocumentFields(raw as unknown as Record<string, unknown>);
              if (!doc.id) return null;
              const marked = markedForDeletion.has(doc.id);
              return (
                <li
                  key={doc.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border p-2 text-sm",
                    marked && "opacity-60 line-through",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      {doc.filename ?? "Unnamed document"}
                    </p>
                    {doc.size && (
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.size)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          downloadDocument(
                            doc.id!,
                            doc.filename ?? `document-${doc.id}`,
                          )
                        }
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => toggleDeleteExisting(doc.id!)}
                      className={cn(
                        marked ? "text-emerald-600" : "text-destructive",
                      )}
                      title={marked ? "Undo delete" : "Remove"}
                    >
                      {marked ? (
                        <Undo2 className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pendingFiles.length > 0 && (
          <ul className="space-y-1.5">
            {pendingFiles.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-dashed p-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(f.size)} · pending upload
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removePendingFile(i)}
                  className="text-destructive"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {existingAttachments.length === 0 && pendingFiles.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No files yet. Add PDFs, spreadsheets, or images related to this request.
          </p>
        )}
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Fix the highlighted fields above, then try again.</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || isUploading}
          asChild={false}
        >
          <Link href="#" onClick={(e) => e.preventDefault()}>
            Cancel
          </Link>
        </Button>
        <Button type="submit" disabled={isLoading || isUploading}>
          {submitLabel ?? "Create KaizenAdmin"}
        </Button>
      </div>
    </form>
  );
}

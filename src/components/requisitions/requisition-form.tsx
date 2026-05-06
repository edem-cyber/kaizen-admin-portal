"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
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
import {
    Plus,
    Trash2,
    Calculator,
    AlertCircle,
    CheckCircle2,
    Paperclip,
    Download,
    X,
    Undo2,
} from "lucide-react";
import { useListBudgetsApiV1BudgetBudgetsGet } from "@/lib/generated/kaizenAdmin/budget-v1/budget-v1";
import { useListFiscalYearsApiV1BudgetFiscalYearsGet } from "@/lib/generated/kaizenAdmin/budget-v1/budget-v1";
import { useListVendorCategoriesApiV1VendorsCategoriesGet } from "@/lib/generated/kaizenAdmin/vendors-v1/vendors-v1";
import type { BudgetResponse } from "@/lib/generated/kaizenAdmin/models/budgetResponse";
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
import { extractItems } from "@/lib/list-response";
import {
    downloadDocument,
    readDocumentFields,
    type DocumentListItem,
} from "@/lib/documents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FieldErrors } from "react-hook-form";

const DEFAULT_CURRENCY_FALLBACK = "USD";

/**
 * Complete-form schema. Per KaizenAdmin_Form_Selection.md §"Complete-form
 * request body", "all minimal-form rules apply plus [complete-specific
 * additions]" — so the future-only delivery_date rule carries over from
 * minimal. `allowPastDeliveryDate` relaxes the refine for edit flows,
 * same as MinimalKaizenAdminForm.
 */
interface KaizenAdminSchemaConfig {
    allowPastDeliveryDate?: boolean;
    requireGlAccount?: boolean;
    requireProjectCode?: boolean;
    /**
     * When non-empty, every budget line's currency must be a member of
     * this list. Empty/undefined disables the check.
     */
    supportedCurrencies?: string[];
    /**
     * Per-line currencies on the original kaizenAdmin, indexed the same
     * as `budget_lines`. Lets edits round-trip values that are no longer
     * in `supportedCurrencies` — only fresh selections are bound to the
     * new list.
     */
    initialLines?: Array<{ currency?: string }>;
    /**
     * When false, every line's currency is locked to `baseCurrency` at
     * the schema level (belt-and-braces; `handleBudgetChange` also
     * overrides at runtime).
     */
    allowMultiCurrency?: boolean;
    baseCurrency?: string;
    /**
     * When false, lines that exceed their budget's available amount OR
     * push projected utilization past `budgetFreezeThreshold` are
     * blocked at the schema level. Undefined is treated as true
     * (permissive) — blocking on an unconfigured flag is worse UX than
     * letting the backend reject; the backend is authoritative.
     */
    allowBudgetOverride?: boolean;
    /** Percentage (0–150) above which submission is frozen. */
    budgetFreezeThreshold?: number;
}

function buildKaizenAdminSchema({
    allowPastDeliveryDate = false,
    requireGlAccount = false,
    requireProjectCode = false,
    supportedCurrencies,
    initialLines,
    allowMultiCurrency = true,
    baseCurrency,
    allowBudgetOverride = true,
    budgetFreezeThreshold,
}: KaizenAdminSchemaConfig) {
    // `category` is optional per KaizenAdmin_Form_Selection.md (both
    // minimal and complete modes). The minimum onboarding configuration
    // doesn't seed any vendor categories, so requiring one here would
    // make it impossible for a freshly-configured org to submit a
    // complete-mode kaizenAdmin. `justification` also relaxed to match
    // the doc.
    return z.object({
        // Matches minimal form + doc §"Minimal-form request body" (1–200
        // chars). Trim so pure-whitespace inputs don't slip past min(1).
        title: z
            .string()
            .trim()
            .min(1, "Title is required")
            .max(200, "Keep the title under 200 characters"),
        description: z.string().trim().min(1, "Description is required"),
        justification: z.string().optional().or(z.literal("")),
        priority: z.enum(["low", "normal", "high", "urgent"]),
        category: z.string().optional().or(z.literal("")),
        delivery_date: z
            .string()
            .optional()
            .refine(
                (d) => allowPastDeliveryDate || !d || new Date(d) > new Date(),
                "Delivery date must be in the future",
            ),
        budget_lines: z.array(z.object({
            budget_id: z.string(),
            budget_code: z.string().min(1, "Budget is required"),
            fiscal_year: z.string().min(1, "Fiscal year is required"),
            amount: z.number().min(0.01, "Amount must be greater than 0"),
            description: z.string().optional(),
            cost_center: z.string().min(1, "Cost center is required"),
            currency: z.string().min(1),
            available_amount: z.number().optional(),
            /**
             * Total budget cap for the selected budget, used by the
             * freeze-threshold refine. Populated by handleBudgetChange
             * from BudgetResponse.total_budget. Missing on edit for
             * lines the user hasn't re-selected — refine fail-opens.
             */
            budget_amount: z.number().optional(),
        })).min(1, "At least one budget line is required"),
        vendor_info: z.object({
            vendor_name: z.string().optional(),
            vendor_id: z.string().optional(),
            contact: z.string().optional(),
            tax_id: z.string().optional(),
            bank_name: z.string().optional(),
            bank_account_number: z.string().optional(),
        }).optional(),
        gl_account: requireGlAccount
            ? z.string().trim().min(1, "GL account is required")
            : z.string().optional().or(z.literal("")),
        project_code: requireProjectCode
            ? z.string().trim().min(1, "Project code is required")
            : z.string().optional().or(z.literal("")),
    }).superRefine((data, ctx) => {
        // Items 1+2: per-line currency validation driven by org config.
        // — Membership: currency must be in supported_currencies (unless
        //   it round-trips an existing line's value, which is allowed so
        //   the form doesn't block an unrelated edit when the org
        //   narrows the list after the kaizenAdmin was created).
        // — Lock: when allow_multi_currency=false, every line must match
        //   baseCurrency. Redundant with the runtime override in
        //   handleBudgetChange; kept as belt-and-braces so a bypassed
        //   handler (e.g. programmatic setValue) can't leak a non-base
        //   currency to the backend.
        data.budget_lines.forEach((line, i) => {
            const currency = line.currency;
            const lineInitial = initialLines?.[i]?.currency;

            if (currency && supportedCurrencies?.length) {
                const matchesInitial = !!lineInitial && currency === lineInitial;
                if (!matchesInitial && !supportedCurrencies.includes(currency)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["budget_lines", i, "currency"],
                        message: `${currency} is not in the list of supported currencies`,
                    });
                }
            }

            if (currency && !allowMultiCurrency && baseCurrency && currency !== baseCurrency) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["budget_lines", i, "currency"],
                    message: `Currency must be ${baseCurrency}`,
                });
            }

            // Item 5: Budget override + freeze-threshold gating. Skipped
            // when the org allows override. `available_amount` check fires
            // whenever we have it; `budget_amount` check fails open on
            // missing data (edit-mode lines without stashed total_budget).
            if (allowBudgetOverride) return;
            const avail =
                typeof line.available_amount === "number"
                    ? line.available_amount
                    : null;
            const budgetAmount =
                typeof line.budget_amount === "number" && line.budget_amount > 0
                    ? line.budget_amount
                    : null;
            const lineAmount =
                typeof line.amount === "number" ? line.amount : 0;

            if (avail != null && lineAmount > avail) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["budget_lines", i, "amount"],
                    message: `Amount exceeds available budget (${avail.toLocaleString()})`,
                });
                return;
            }

            if (budgetAmount != null && typeof budgetFreezeThreshold === "number") {
                const projectedUtilization =
                    ((budgetAmount - (avail ?? 0)) + lineAmount) /
                    budgetAmount *
                    100;
                if (projectedUtilization >= budgetFreezeThreshold) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["budget_lines", i, "amount"],
                        message: `Would push utilization to ${projectedUtilization.toFixed(0)}%, above the ${budgetFreezeThreshold}% freeze threshold`,
                    });
                }
            }
        });
    });
}

const kaizenAdminSchema = buildKaizenAdminSchema({});

export type KaizenAdminFormValues = z.infer<typeof kaizenAdminSchema>;

export interface KaizenAdminFormSubmitExtras {
    newFiles: File[];
    deleteAttachmentIds: string[];
}

interface FiscalYearOption {
    id: string;
    year_code: string;
    year_name?: string;
}

interface KaizenAdminFormProps {
    initialData?: Partial<KaizenAdminFormValues>;
    existingAttachments?: DocumentListItem[];
    onSubmit: (data: KaizenAdminFormValues, extras: KaizenAdminFormSubmitExtras) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isUploading?: boolean;
    /**
     * Org-wide default currency code (ISO 4217). Surfaced from the
     * organization's AccountingConfiguration.default_currency. Applied
     * to new budget lines when the user hasn't selected a specific
     * budget yet. Falls back to USD if the caller doesn't supply one.
     */
    defaultCurrency?: string;
    supportedCurrencies?: string[];
    organizationId?: number;
    policyConfig?: PolicyConfiguration | null;
    /**
     * If false, every budget line's currency is forced to defaultCurrency
     * and the per-line currency display becomes read-only — per
     * KaizenAdmin_Form_Selection.md §"Accounting fine-grained rules".
     */
    allowMultiCurrency?: boolean;
    /**
     * "inclusive" | "exclusive" — used to decorate amount labels with an
     * "(incl. tax)" / "(excl. tax)" hint.
     */
    taxInclusion?: string | null;
    /**
     * Relax the "delivery_date must be in the future" refine. Set to true
     * for edit flows where the stored delivery_date may already be in the
     * past — otherwise the user can't save unrelated edits.
     */
    allowPastDeliveryDate?: boolean;
    requireGlAccount?: boolean;
    requireProjectCode?: boolean;
    /**
     * From accounting_config.allow_budget_override. Undefined → true
     * (permissive). When false, lines exceeding available / utilization
     * are blocked at the schema level.
     */
    allowBudgetOverride?: boolean;
    /** From accounting_config.budget_freeze_threshold (percentage). */
    budgetFreezeThreshold?: number;
    submitLabel?: string;
}

interface CategoryOption {
    id?: string;
    name?: string;
}

function addDaysIso(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
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

export function KaizenAdminForm({
    initialData,
    existingAttachments = [],
    onSubmit,
    onCancel,
    isLoading,
    isUploading,
    defaultCurrency,
    supportedCurrencies,
    organizationId,
    policyConfig,
    allowMultiCurrency = true,
    taxInclusion,
    allowPastDeliveryDate = false,
    requireGlAccount = false,
    requireProjectCode = false,
    allowBudgetOverride = true,
    budgetFreezeThreshold,
    submitLabel,
}: KaizenAdminFormProps) {
    const baseCurrency = defaultCurrency?.trim() || DEFAULT_CURRENCY_FALLBACK;
    const isEditing = !!initialData;
    const baseRules: VendorPolicyRules = useMemo(
        () => computeVendorPolicyRules(policyConfig),
        [policyConfig],
    );
    const initialLines = useMemo<Array<{ currency?: string }> | undefined>(
        () =>
            initialData?.budget_lines?.map((line) => ({
                currency: line?.currency,
            })),
        [initialData?.budget_lines],
    );
    const supportedCurrenciesKey = (supportedCurrencies ?? []).join(",");
    const initialLinesKey = (initialLines ?? [])
        .map((l) => l.currency ?? "")
        .join(",");
    const schema = useMemo(
        () =>
            buildKaizenAdminSchema({
                allowPastDeliveryDate,
                requireGlAccount,
                requireProjectCode,
                supportedCurrencies,
                initialLines,
                allowMultiCurrency,
                baseCurrency,
                allowBudgetOverride,
                budgetFreezeThreshold,
            }),
        // *Key deps stabilise the refs across React Query refetches.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            allowPastDeliveryDate,
            requireGlAccount,
            requireProjectCode,
            supportedCurrenciesKey,
            initialLinesKey,
            allowMultiCurrency,
            baseCurrency,
            allowBudgetOverride,
            budgetFreezeThreshold,
        ],
    );

    const { data: budgetsData } = useListBudgetsApiV1BudgetBudgetsGet({});
    const { data: categoriesData } = useListVendorCategoriesApiV1VendorsCategoriesGet();
    const { data: fiscalYearsData, isLoading: isLoadingFiscalYears } =
        useListFiscalYearsApiV1BudgetFiscalYearsGet(
            { organization_id: organizationId ?? 0, limit: 50 },
            { query: { enabled: !!organizationId } },
        );

    const budgets = (budgetsData as { budgets?: BudgetResponse[] } | undefined)?.budgets ?? [];

    const fiscalYears = useMemo<FiscalYearOption[]>(() => {
        return extractItems<FiscalYearOption>(fiscalYearsData, "fiscal_years").filter(
            (fy) => !!fy?.year_code,
        );
    }, [fiscalYearsData]);

    const fiscalYearCodeToId = useMemo(() => {
        const map = new Map<string, string>();
        fiscalYears.forEach((fy) => {
            if (fy.year_code && fy.id) map.set(fy.year_code, fy.id);
        });
        return map;
    }, [fiscalYears]);

    const categories = useMemo<CategoryOption[]>(() => {
        const payload = categoriesData as unknown;
        if (!payload) return [];
        const list = Array.isArray(payload)
            ? payload
            : Array.isArray((payload as { data?: unknown }).data)
                ? ((payload as { data: unknown[] }).data)
                : [];
        return (list as CategoryOption[]).filter((c) => c && typeof c.name === "string");
    }, [categoriesData]);

    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultDeliveryDate = initialData?.delivery_date ?? addDaysIso(30);

    const form = useForm<KaizenAdminFormValues>({
        resolver: zodResolver(schema),
        defaultValues: initialData
            ? {
                  ...initialData,
                  delivery_date: defaultDeliveryDate,
                  gl_account: initialData.gl_account ?? "",
                  project_code: initialData.project_code ?? "",
              } as KaizenAdminFormValues
            : {
                  title: "",
                  description: "",
                  justification: "",
                  priority: "normal",
                  category: "",
                  delivery_date: defaultDeliveryDate,
                  budget_lines: [
                      {
                          budget_id: "",
                          budget_code: "",
                          fiscal_year: "",
                          amount: 0,
                          description: "",
                          cost_center: "GENERAL",
                          currency: baseCurrency,
                          available_amount: 0,
                      },
                  ],
                  vendor_info: { vendor_name: "", contact: "" },
                  gl_account: "",
                  project_code: "",
              },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "budget_lines",
    });

    // Backfill `budget_amount` / `available_amount` for lines loaded from
    // an existing kaizenAdmin once the budgets list resolves. Without
    // this, the freeze-threshold refine fail-opens on unchanged edit
    // lines; with it, we can gate correctly when the user leaves a line
    // untouched. Only runs when values are missing so the user's manual
    // edits aren't clobbered.
    useEffect(() => {
        if (budgets.length === 0) return;
        const current = form.getValues("budget_lines");
        current.forEach((line, index) => {
            if (!line?.budget_code) return;
            const matched = budgets.find((b) => b.budget_code === line.budget_code);
            if (!matched) return;
            if (
                line.budget_amount == null &&
                matched.total_budget != null
            ) {
                form.setValue(
                    `budget_lines.${index}.budget_amount`,
                    parseFloat(String(matched.total_budget)),
                );
            }
            if (
                (line.available_amount == null || line.available_amount === 0) &&
                matched.available_amount != null
            ) {
                form.setValue(
                    `budget_lines.${index}.available_amount`,
                    parseFloat(String(matched.available_amount)),
                );
            }
        });
        // form ref is stable; re-run only when budgets data changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budgets]);

    const budgetsForLine = (fiscalYearCode: string) => {
        if (!fiscalYearCode) return [] as BudgetResponse[];
        const fyId = fiscalYearCodeToId.get(fiscalYearCode);
        if (!fyId) return [];
        return budgets.filter((b) => b?.fiscal_year_id === fyId);
    };

    const handleFiscalYearChange = (index: number, fiscalYearCode: string) => {
        form.setValue(`budget_lines.${index}.fiscal_year`, fiscalYearCode, {
            shouldValidate: true,
        });
        form.setValue(`budget_lines.${index}.budget_id`, "");
        form.setValue(`budget_lines.${index}.budget_code`, "");
        form.setValue(`budget_lines.${index}.cost_center`, "GENERAL");
        form.setValue(`budget_lines.${index}.available_amount`, 0);
    };

    const handleBudgetChange = (index: number, budgetCode: string) => {
        const selectedBudget = budgets.find((b) => b.budget_code === budgetCode);
        if (!selectedBudget) return;
        form.setValue(`budget_lines.${index}.budget_id`, selectedBudget.id);
        form.setValue(`budget_lines.${index}.budget_code`, selectedBudget.budget_code, {
            shouldValidate: true,
        });
        form.setValue(
            `budget_lines.${index}.cost_center`,
            selectedBudget.budget_name || "GENERAL",
        );
        // When multi-currency is disabled, lines must stay on the org's
        // default currency regardless of the budget's own currency_code.
        form.setValue(
            `budget_lines.${index}.currency`,
            allowMultiCurrency
                ? selectedBudget.currency_code
                : baseCurrency,
        );
        const avail = selectedBudget.available_amount
            ? parseFloat(String(selectedBudget.available_amount))
            : 0;
        form.setValue(`budget_lines.${index}.available_amount`, avail);
        const total = selectedBudget.total_budget
            ? parseFloat(String(selectedBudget.total_budget))
            : 0;
        form.setValue(`budget_lines.${index}.budget_amount`, total);
    };

    const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(e.target.files ?? []);
        if (picked.length === 0) return;
        setNewFiles((prev) => [...prev, ...picked]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeNewFile = (index: number) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleDeleteAttachment = (id: string) => {
        setPendingDeleteIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const normalizedExisting = useMemo<DocumentListItem[]>(() => {
        return existingAttachments
            .map((raw) => readDocumentFields(raw as Record<string, unknown>))
            .filter((d) => !!d.id);
    }, [existingAttachments]);

    const totalAmount = form
        .watch("budget_lines")
        .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const policyRules: VendorPolicyRules = useMemo(
        () => applyAmountThresholds(baseRules, totalAmount, policyConfig),
        [baseRules, totalAmount, policyConfig],
    );

    const submitBusy = !!isLoading || !!isUploading;
    const hasFiscalYears = fiscalYears.length > 0;

    const submit = (values: KaizenAdminFormValues) => {
        // Quote count for the vendor-policy check: attachments that will
        // remain after save (existing minus marked-for-delete, plus newly
        // picked files).
        const remainingExisting = existingAttachments.filter(
            (a) => !a.id || !pendingDeleteIds.includes(a.id),
        ).length;
        const totalAttached = remainingExisting + newFiles.length;

        const violation = validateVendorAgainstPolicy(
            policyRules,
            values.vendor_info as VendorInfoLike | undefined,
            totalAttached,
        );
        if (violation) {
            toast.error(violation);
            return;
        }

        onSubmit(values, {
            newFiles,
            deleteAttachmentIds: pendingDeleteIds,
        });
    };

    const collectFirstError = (errors: FieldErrors<KaizenAdminFormValues>): string | null => {
        const simple = (
            [
                "title",
                "description",
                "justification",
                "category",
                "delivery_date",
            ] as const
        )
            .map((k) => errors[k]?.message)
            .find((m): m is string => !!m);
        if (simple) return simple;

        const lineErrors = errors.budget_lines;
        if (Array.isArray(lineErrors)) {
            for (let i = 0; i < lineErrors.length; i += 1) {
                const line = lineErrors[i];
                if (!line) continue;
                const keys = [
                    "fiscal_year",
                    "budget_code",
                    "amount",
                    "cost_center",
                    "currency",
                ] as const;
                for (const k of keys) {
                    const msg = (line as Record<string, { message?: string } | undefined>)[k]
                        ?.message;
                    if (msg) return `Line ${i + 1}: ${msg}`;
                }
            }
        } else if (lineErrors && "message" in lineErrors && lineErrors.message) {
            return lineErrors.message;
        }
        return null;
    };

    const onInvalid = (errors: FieldErrors<KaizenAdminFormValues>) => {
        const msg = collectFirstError(errors) ?? "Please fix the highlighted fields";
        toast.error(msg);
    };

    return (
        <form onSubmit={form.handleSubmit(submit, onInvalid)} className="space-y-8">
            <div className="space-y-6 rounded-lg border p-6 bg-card">
                <h3 className="text-lg font-semibold">General Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            {...form.register("title")}
                            placeholder="e.g. Q1 Office Equipment"
                        />
                        {form.formState.errors.title && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            onValueChange={(v) =>
                                form.setValue("priority", v as KaizenAdminFormValues["priority"])
                            }
                            defaultValue={form.getValues("priority")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
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
                        <Label htmlFor="category">Category (optional)</Label>
                        {categories.length > 0 ? (
                            <Select
                                value={form.watch("category") || undefined}
                                onValueChange={(v) =>
                                    form.setValue("category", v, { shouldValidate: true })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem
                                            key={cat.id ?? cat.name}
                                            value={cat.name as string}
                                        >
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                id="category"
                                {...form.register("category")}
                                placeholder="e.g. Operations"
                            />
                        )}
                        {form.formState.errors.category && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.category.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delivery_date">Required by</Label>
                        <Input
                            id="delivery_date"
                            type="date"
                            {...form.register("delivery_date")}
                        />
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...form.register("description")}
                            placeholder="Detailed explanation of the request..."
                        />
                        {form.formState.errors.description && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.description.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="justification">Justification (optional)</Label>
                        <Textarea
                            id="justification"
                            {...form.register("justification")}
                            placeholder="Why is this purchase necessary?"
                        />
                        {form.formState.errors.justification && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.justification.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6 rounded-lg border p-6 bg-muted/30">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Budget Allocation
                    </h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoadingFiscalYears || !hasFiscalYears}
                        onClick={() =>
                            append({
                                budget_id: "",
                                budget_code: "",
                                fiscal_year: "",
                                amount: 0,
                                description: "",
                                cost_center: "GENERAL",
                                currency: baseCurrency,
                                available_amount: 0,
                            })
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Line
                    </Button>
                </div>

                {isLoadingFiscalYears ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Loading fiscal years…
                    </div>
                ) : !hasFiscalYears ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No fiscal years configured. Create a fiscal year in{" "}
                        <Link
                            href="/configuration/fiscal-year"
                            className="font-medium text-primary underline"
                        >
                            Configuration → Fiscal Year
                        </Link>{" "}
                        before creating a kaizenAdmin.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {fields.map((field, index) => {
                            const fiscalYearCode = form.watch(`budget_lines.${index}.fiscal_year`);
                            const currencyCode = form.watch(`budget_lines.${index}.currency`);
                            const budgetCode = form.watch(`budget_lines.${index}.budget_code`);
                            const lineAmount = form.watch(`budget_lines.${index}.amount`) || 0;
                            const avail = form.watch(`budget_lines.${index}.available_amount`) || 0;
                            const isOver = lineAmount > avail && avail > 0;
                            const lineBudgets = budgetsForLine(fiscalYearCode);

                            return (
                                <div
                                    key={field.id}
                                    className="space-y-4 border-b pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="grid grid-cols-12 gap-4 items-end">
                                        <div className="col-span-12 md:col-span-3 space-y-2">
                                            <Label>Fiscal Year</Label>
                                            <Select
                                                value={fiscalYearCode || undefined}
                                                onValueChange={(v) =>
                                                    handleFiscalYearChange(index, v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select FY" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fiscalYears.map((fy) => (
                                                        <SelectItem
                                                            key={fy.year_code}
                                                            value={fy.year_code}
                                                        >
                                                            {fy.year_name ?? fy.year_code}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.formState.errors.budget_lines?.[index]
                                                ?.fiscal_year && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        form.formState.errors.budget_lines[index]
                                                            ?.fiscal_year?.message
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-12 md:col-span-4 space-y-2">
                                            <Label className="flex items-center justify-between">
                                                Budget
                                                {avail > 0 && (
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                            isOver
                                                                ? "bg-destructive/10 text-destructive"
                                                                : "bg-emerald-500/10 text-emerald-600",
                                                        )}
                                                    >
                                                        Avail: {avail.toLocaleString()}
                                                    </span>
                                                )}
                                            </Label>
                                            <Select
                                                value={budgetCode || undefined}
                                                onValueChange={(v) => handleBudgetChange(index, v)}
                                                disabled={!fiscalYearCode}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            !fiscalYearCode
                                                                ? "Select FY first"
                                                                : "Select budget"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {lineBudgets.length > 0 ? (
                                                        lineBudgets.map((budget) => (
                                                            <SelectItem
                                                                key={budget.id}
                                                                value={budget.budget_code}
                                                            >
                                                                {budget.budget_code} (
                                                                {budget.budget_name})
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="none" disabled>
                                                            No budgets available for this FY
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {form.formState.errors.budget_lines?.[index]
                                                ?.budget_code && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        form.formState.errors.budget_lines[index]
                                                            ?.budget_code?.message
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-10 md:col-span-4 space-y-2">
                                            <Label>
                                                Amount
                                                <span className="text-muted-foreground font-normal">
                                                    {taxInclusionSuffix(taxInclusion)}
                                                </span>
                                            </Label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground font-bold">
                                                    {currencyCode || baseCurrency}
                                                </span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className={cn(
                                                        "pl-12",
                                                        isOver &&
                                                            "border-destructive focus-visible:ring-destructive",
                                                    )}
                                                    {...form.register(
                                                        `budget_lines.${index}.amount`,
                                                        { valueAsNumber: true },
                                                    )}
                                                />
                                            </div>
                                            {form.formState.errors.budget_lines?.[index]
                                                ?.amount && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        form.formState.errors.budget_lines[index]
                                                            ?.amount?.message
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-2 md:col-span-1 flex justify-end items-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-xs"
                                                className="text-destructive"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Line Description</Label>
                                        <Input
                                            {...form.register(
                                                `budget_lines.${index}.description`,
                                            )}
                                            placeholder="Itemized detail..."
                                        />
                                    </div>

                                    {isOver && (
                                        <div className="flex items-center gap-1.5 text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Amount exceeds available budget (
                                            {currencyCode || baseCurrency}{" "}
                                            {avail.toLocaleString()})
                                        </div>
                                    )}
                                    {!isOver && avail > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Budget available
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                            Total KaizenAdmin Amount
                            <span className="normal-case font-normal">
                                {taxInclusionSuffix(taxInclusion)}
                            </span>
                        </p>
                        <p className="text-3xl font-bold">
                            {form.watch("budget_lines.0.currency") || baseCurrency}{" "}
                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 rounded-lg border p-6 bg-card">
                <div className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Attachments</h3>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                </div>

                {isEditing && normalizedExisting.length > 0 && (
                    <div className="space-y-2">
                        <Label>Existing files</Label>
                        <div className="space-y-1.5">
                            {normalizedExisting.map((att) => {
                                const isPendingDelete = pendingDeleteIds.includes(att.id!);
                                return (
                                    <div
                                        key={att.id}
                                        className={cn(
                                            "flex items-center justify-between gap-2 rounded-md border p-2",
                                            isPendingDelete &&
                                                "bg-destructive/5 border-destructive/40",
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span
                                                className={cn(
                                                    "truncate text-sm",
                                                    isPendingDelete &&
                                                        "line-through text-muted-foreground",
                                                )}
                                            >
                                                {att.filename ?? "Unnamed file"}
                                            </span>
                                            {att.size && (
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {formatBytes(att.size)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {!isPendingDelete && att.id && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={() =>
                                                        downloadDocument(
                                                            att.id!,
                                                            att.filename ?? `document-${att.id}`,
                                                        )
                                                    }
                                                    title="Download"
                                                >
                                                    <Download className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-xs"
                                                className={cn(
                                                    !isPendingDelete && "text-destructive",
                                                )}
                                                onClick={() =>
                                                    toggleDeleteAttachment(att.id!)
                                                }
                                                title={
                                                    isPendingDelete
                                                        ? "Undo delete"
                                                        : "Mark for deletion"
                                                }
                                            >
                                                {isPendingDelete ? (
                                                    <Undo2 className="h-3 w-3" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="attachments">Add new files</Label>
                    <Input
                        id="attachments"
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handlePickFiles}
                        className="cursor-pointer"
                    />
                </div>

                {newFiles.length > 0 && (
                    <div className="space-y-1.5">
                        {newFiles.map((file, i) => (
                            <div
                                key={`${file.name}-${i}`}
                                className="flex items-center justify-between gap-2 rounded-md border p-2"
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="truncate text-sm">{file.name}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {formatBytes(file.size)}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="text-destructive"
                                    onClick={() => removeNewFile(i)}
                                    title="Remove"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <VendorFieldsSection
                rules={policyRules}
                value={form.watch("vendor_info") as VendorInfoLike | undefined}
                onChange={(next) =>
                    form.setValue(
                        "vendor_info",
                        next as KaizenAdminFormValues["vendor_info"],
                        { shouldValidate: true },
                    )
                }
                disabled={submitBusy}
                attachedQuoteCount={
                    existingAttachments.filter(
                        (a) => !a.id || !pendingDeleteIds.includes(a.id),
                    ).length + newFiles.length
                }
            />

            <AccountingReferenceFields
                requireGlAccount={requireGlAccount}
                requireProjectCode={requireProjectCode}
                glAccount={form.watch("gl_account") ?? ""}
                projectCode={form.watch("project_code") ?? ""}
                onGlAccountChange={(v) =>
                    form.setValue("gl_account", v, { shouldValidate: true })
                }
                onProjectCodeChange={(v) =>
                    form.setValue("project_code", v, { shouldValidate: true })
                }
                glAccountError={form.formState.errors.gl_account?.message}
                projectCodeError={form.formState.errors.project_code?.message}
                disabled={submitBusy}
            />

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={submitBusy}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={submitBusy || !hasFiscalYears}>
                    {isUploading
                        ? "Uploading attachments…"
                        : isLoading
                            ? "Processing..."
                            : submitLabel ??
                              (initialData ? "Update KaizenAdmin" : "Submit KaizenAdmin")}
                </Button>
            </div>
        </form>
    );
}

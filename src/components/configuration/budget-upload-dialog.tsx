"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_CONFIG, apiRequest } from "@/lib/api-client";
import { useListFiscalYearsApiV1BudgetFiscalYearsGet } from "@/lib/generated/kaizenAdmin/budget-v1/budget-v1";
import { useUploadBudgetFileApiV1ConfigurationOrganizationIdBudgetUploadPost } from "@/lib/generated/kaizenAdmin/configuration-v1/configuration-v1";
import { extractErrorMessage } from "@/lib/api-error";
import { extractItems } from "@/lib/list-response";

interface FiscalYearOption {
  id: string;
  year_code?: string;
  year_name?: string;
}

interface BudgetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: number;
  onUploaded?: () => void;
}

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

const uploadSchema = z.object({
  fiscal_year_id: z.string().min(1, "Select a fiscal year"),
  file: z
    .instanceof(File, { message: "Pick a file" })
    .refine(
      (f) => ALLOWED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)),
      { message: "Use .xlsx, .xls, or .csv" },
    ),
  overwrite: z.boolean(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

async function downloadBlob(url: string, filename: string) {
  const blob = await apiRequest<Blob>({
    method: "GET",
    url,
    baseURL: API_CONFIG.kaizenAdminBaseUrl,
    responseType: "blob",
  });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export function BudgetUploadDialog({
  open,
  onOpenChange,
  organizationId,
  onUploaded,
}: BudgetUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState<"template" | "data" | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      fiscal_year_id: "",
      file: undefined as unknown as File,
      overwrite: false,
    },
  });

  // Reset the form each time the dialog reopens
  useEffect(() => {
    if (open) {
      reset({
        fiscal_year_id: "",
        file: undefined as unknown as File,
        overwrite: false,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, reset]);

  const fiscalYearId = watch("fiscal_year_id");
  const file = watch("file");

  const { data: fiscalYearsData } = useListFiscalYearsApiV1BudgetFiscalYearsGet(
    { organization_id: organizationId, limit: 50 },
    { query: { enabled: !!organizationId && open } },
  );

  const fiscalYears = useMemo<FiscalYearOption[]>(() => {
    return extractItems<FiscalYearOption>(fiscalYearsData, "fiscal_years").filter(
      (r) => !!r?.id,
    );
  }, [fiscalYearsData]);

  const { mutate: uploadFile, isPending: isUploading } =
    useUploadBudgetFileApiV1ConfigurationOrganizationIdBudgetUploadPost({
      mutation: {
        onSuccess: () => {
          toast.success("Budgets uploaded");
          onOpenChange(false);
          onUploaded?.();
        },
        onError: (err: unknown) => {
          toast.error(extractErrorMessage(err, "Failed to upload budgets"));
        },
      },
    });

  const onValid = (values: UploadFormValues) => {
    uploadFile({
      organizationId,
      data: {
        // Orval generates `file: string`, but at runtime the mutator appends
        // the value to FormData directly — File works here.
        file: values.file as unknown as string,
      },
      params: {
        fiscal_year_id: values.fiscal_year_id,
        overwrite: values.overwrite,
      },
    });
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading("template");
    try {
      await downloadBlob(
        `/api/v1/configuration/${organizationId}/budget/template`,
        "budget-template.xlsx",
      );
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to download template"));
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadData = async () => {
    if (!fiscalYearId) {
      await trigger("fiscal_year_id");
      return;
    }
    setIsDownloading("data");
    try {
      const fyLabel =
        fiscalYears.find((fy) => fy.id === fiscalYearId)?.year_code ??
        fiscalYearId;
      await downloadBlob(
        `/api/v1/configuration/${organizationId}/budget/download?fiscal_year_id=${encodeURIComponent(fiscalYearId)}`,
        `budgets-${fyLabel}.xlsx`,
      );
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to download current data"));
    } finally {
      setIsDownloading(null);
    }
  };

  const disableBody = isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import budgets from file</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to bulk-create or update budgets for a fiscal year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValid)} className="space-y-5">
          <div className="space-y-2">
            <Label>Fiscal year</Label>
            <Controller
              control={control}
              name="fiscal_year_id"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={disableBody}
                >
                  <SelectTrigger
                    aria-invalid={!!errors.fiscal_year_id}
                    className={cn(
                      errors.fiscal_year_id &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  >
                    <SelectValue placeholder="Select a fiscal year" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        No fiscal years. Create one on the Fiscal Year page.
                      </div>
                    ) : (
                      fiscalYears.map((fy) => (
                        <SelectItem key={fy.id} value={fy.id}>
                          {fy.year_name ?? fy.year_code ?? fy.id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.fiscal_year_id && (
              <p className="text-xs text-destructive">{errors.fiscal_year_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_file">Budget file</Label>
            <div className="flex items-center gap-2">
              <input
                id="budget_file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null;
                  if (picked) {
                    setValue("file", picked, { shouldValidate: true });
                  } else {
                    setValue("file", undefined as unknown as File, {
                      shouldValidate: true,
                    });
                  }
                }}
                disabled={disableBody}
                aria-invalid={!!errors.file}
                className={cn(
                  "flex-1 cursor-pointer text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:bg-background file:text-sm file:font-medium file:text-foreground hover:file:bg-accent",
                  errors.file &&
                    "border border-destructive rounded-md ring-1 ring-destructive/40 p-1",
                )}
              />
            </div>
            {errors.file ? (
              <p className="text-xs text-destructive">{errors.file.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Accepts .xlsx, .xls, or .csv.{" "}
                {file && (
                  <span>
                    Picked: <span className="font-medium">{file.name}</span>
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
            <div>
              <Label htmlFor="overwrite" className="text-sm font-medium">
                Overwrite existing budgets
              </Label>
              <p className="text-xs text-muted-foreground">
                Replace matching budgets instead of skipping them.
              </p>
            </div>
            <Controller
              control={control}
              name="overwrite"
              render={({ field }) => (
                <Switch
                  id="overwrite"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disableBody}
                />
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isDownloading !== null || disableBody}
            >
              {isDownloading === "template" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
              )}
              Download template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadData}
              disabled={!fiscalYearId || isDownloading !== null || disableBody}
            >
              {isDownloading === "data" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-2 h-3.5 w-3.5" />
              )}
              Download current data
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

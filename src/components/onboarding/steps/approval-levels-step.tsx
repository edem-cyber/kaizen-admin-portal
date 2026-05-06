"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateApprovalLevelApiV1ConfigurationApprovalLevelsPost,
  useGetApprovalLevelsApiV1ConfigurationApprovalLevelsGet,
} from "@/lib/generated/kaizenAdmin/configuration-v1/configuration-v1";
import { ApprovalLevelApprovalType } from "@/lib/generated/kaizenAdmin/models";
import { useGetOrganizationRoles } from "@/lib/generated/user/organization-roles/organization-roles";
import { useGetUsers } from "@/lib/generated/user/users/users";
import { extractErrorMessage } from "@/lib/api-error";
import { extractItems } from "@/lib/list-response";
import type { BlockingIssue } from "@/lib/onboarding";

interface ApprovalLevelsStepProps {
  organizationId: number;
  currentIssue: BlockingIssue | null;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
}

interface ExistingLevel {
  id?: string;
  level_name?: string;
  sequence_order?: number | string;
  threshold_min?: string | number;
  threshold_max?: string | number | null;
  approval_type?: string;
  role?: string | null;
  user_name?: string | null;
  is_active?: boolean;
}

interface RoleOption {
  id: string;
  name: string;
}
interface UserOption {
  id: string;
  name: string;
}

// ── Single-approver form ──────────────────────────────────────────────

const singleSchema = z
  .object({
    approval_type: z.nativeEnum(ApprovalLevelApprovalType),
    role_id: z.string().optional().or(z.literal("")),
    user_id: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.approval_type === ApprovalLevelApprovalType.role && !data.role_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role_id"],
        message: "Select a role",
      });
    }
    if (
      data.approval_type === ApprovalLevelApprovalType.individual &&
      !data.user_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["user_id"],
        message: "Select a user",
      });
    }
  });

type SingleFormValues = z.infer<typeof singleSchema>;

// ── Tiered form ───────────────────────────────────────────────────────

const tierSchema = z.object({
  // Empty string means "no upper limit" — only valid on the last tier.
  max: z.string().trim(),
  approval_type: z.nativeEnum(ApprovalLevelApprovalType),
  role_id: z.string().optional().or(z.literal("")),
  user_id: z.string().optional().or(z.literal("")),
});

const tieredSchema = z
  .object({
    tiers: z.array(tierSchema).min(1, "At least one tier required"),
  })
  .superRefine((data, ctx) => {
    const { tiers } = data;
    let prevMax = 0;
    tiers.forEach((t, i) => {
      const isLast = i === tiers.length - 1;
      const path = ["tiers", i] as const;

      // Approver must be selected.
      if (t.approval_type === ApprovalLevelApprovalType.role && !t.role_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "role_id"],
          message: "Select a role",
        });
      }
      if (
        t.approval_type === ApprovalLevelApprovalType.individual &&
        !t.user_id
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, "user_id"],
          message: "Select a user",
        });
      }

      if (isLast) {
        // Last tier must be unbounded (empty max).
        if (t.max.trim() !== "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "max"],
            message: "Leave the last tier's max blank so every amount is covered",
          });
        }
      } else {
        if (t.max.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "max"],
            message: "Enter an upper amount",
          });
          return;
        }
        const n = Number(t.max);
        if (!Number.isFinite(n) || n <= prevMax) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "max"],
            message: `Must be greater than ${prevMax}`,
          });
          return;
        }
        prevMax = n;
      }
    });
  });

type TieredFormValues = z.infer<typeof tieredSchema>;

type Mode = "single" | "tiered";

export function ApprovalLevelsStep({
  organizationId,
  currentIssue,
  onComplete,
  onBack,
  backLabel,
}: ApprovalLevelsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("single");

  const { data: rolesResponse } = useGetOrganizationRoles({});
  const { data: usersResponse } = useGetUsers({ organizationId });

  const { data: existingLevelsData } =
    useGetApprovalLevelsApiV1ConfigurationApprovalLevelsGet({
      organization_id: organizationId,
      active_only: true,
      page_size: 100,
    });

  const existingLevels = useMemo<ExistingLevel[]>(() => {
    return extractItems<ExistingLevel>(existingLevelsData, "approval_levels", "levels");
  }, [existingLevelsData]);

  const hasCoveringLevel = useMemo(() => {
    return existingLevels.some((lvl) => {
      const max = lvl.threshold_max;
      return (
        (lvl.is_active ?? true) &&
        Number(lvl.threshold_min ?? 0) <= 0 &&
        (max === null || max === undefined)
      );
    });
  }, [existingLevels]);

  const roles = useMemo<RoleOption[]>(() => {
    const list = (rolesResponse as { data?: unknown[] } | undefined)?.data ?? [];
    return (list as Array<{ id?: string; name?: string }>)
      .filter((r) => r.id && r.name)
      .map((r) => ({ id: r.id as string, name: r.name as string }));
  }, [rolesResponse]);

  const users = useMemo<UserOption[]>(() => {
    const list = (usersResponse as { data?: unknown[] } | undefined)?.data ?? [];
    return (list as Array<{
      id?: string;
      firstName?: string;
      lastName?: string;
      emailAddress?: string;
    }>)
      .filter((u) => u.id)
      .map((u) => ({
        id: u.id as string,
        name:
          `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
          (u.emailAddress ?? "User"),
      }));
  }, [usersResponse]);

  const { mutateAsync } = useCreateApprovalLevelApiV1ConfigurationApprovalLevelsPost();

  const createLevel = async (
    approverType: ApprovalLevelApprovalType,
    roleId: string,
    userId: string,
    thresholdMin: string,
    thresholdMax: string | null,
    sequenceOrder: number,
  ) => {
    const roleName = roles.find((r) => r.id === roleId)?.name;
    const userName = users.find((u) => u.id === userId)?.name;
    const levelLabel =
      thresholdMax === null
        ? `Level ${sequenceOrder} ($${thresholdMin}+)`
        : `Level ${sequenceOrder} ($${thresholdMin}–$${thresholdMax})`;
    await mutateAsync({
      data: {
        level_name: sequenceOrder === 1 ? "Approver" : levelLabel,
        sequence_order: sequenceOrder,
        threshold_min: thresholdMin,
        threshold_max: thresholdMax,
        approval_type: approverType,
        role: approverType === ApprovalLevelApprovalType.role ? roleName : undefined,
        role_id:
          approverType === ApprovalLevelApprovalType.role ? roleId || undefined : undefined,
        user_id:
          approverType === ApprovalLevelApprovalType.individual ? userId || undefined : undefined,
        user_name:
          approverType === ApprovalLevelApprovalType.individual ? userName : undefined,
        is_active: true,
        requires_all: true,
        organization_id: organizationId,
      } as Parameters<typeof mutateAsync>[0]["data"],
    });
  };

  // ── Single-approver form ─────────────────────────────────────────────

  const singleForm = useForm<SingleFormValues>({
    resolver: zodResolver(singleSchema),
    defaultValues: {
      approval_type: ApprovalLevelApprovalType.role,
      role_id: "",
      user_id: "",
    },
  });

  const singleApprovalType = singleForm.watch("approval_type");
  const singleRoleId = singleForm.watch("role_id");
  const singleUserId = singleForm.watch("user_id");

  const onSingleSubmit = async (values: SingleFormValues) => {
    setIsSubmitting(true);
    try {
      await createLevel(
        values.approval_type,
        values.role_id ?? "",
        values.user_id ?? "",
        "0",
        null,
        1,
      );
      toast.success("Approval level created");
      onComplete();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create approval level"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Tiered form ──────────────────────────────────────────────────────

  const tieredForm = useForm<TieredFormValues>({
    resolver: zodResolver(tieredSchema),
    defaultValues: {
      tiers: [
        {
          max: "10000",
          approval_type: ApprovalLevelApprovalType.role,
          role_id: "",
          user_id: "",
        },
        {
          max: "",
          approval_type: ApprovalLevelApprovalType.role,
          role_id: "",
          user_id: "",
        },
      ],
    },
  });

  const {
    fields: tierFields,
    append,
    remove,
  } = useFieldArray({ control: tieredForm.control, name: "tiers" });

  const tiersWatched = tieredForm.watch("tiers");

  const removeTier = (idx: number) => {
    remove(idx);
    // After removal, re-clear the new last tier's max so it remains the
    // unbounded catch-all. Use setTimeout so the array shrink settles
    // first; otherwise setValue targets the pre-remove shape.
    setTimeout(() => {
      const latest = tieredForm.getValues("tiers");
      const lastIdx = latest.length - 1;
      if (lastIdx >= 0 && latest[lastIdx]?.max !== "") {
        tieredForm.setValue(`tiers.${lastIdx}.max`, "", {
          shouldValidate: true,
        });
      }
    }, 0);
  };

  const onTieredSubmit = async (values: TieredFormValues) => {
    setIsSubmitting(true);
    try {
      // Pre-flight: collect the sequence_orders that already exist so a
      // retry after a partial-failure loop doesn't re-POST already-created
      // tiers. The comparison is on sequence_order only; assumes earlier
      // tiers match what the user typed this time (reasonable if they're
      // retrying the same form).
      const existingSequences = new Set<number>(
        existingLevels
          .filter((lvl) => lvl.is_active ?? true)
          .map((lvl) => {
            const raw = (lvl as { sequence_order?: number | string }).sequence_order;
            const n = typeof raw === "string" ? Number(raw) : raw;
            return Number.isFinite(n) ? (n as number) : NaN;
          })
          .filter((n) => Number.isFinite(n)),
      );

      let prevMax = 0;
      let seq = 1;
      let createdCount = 0;
      let skippedCount = 0;
      for (const t of values.tiers) {
        const thresholdMin = String(prevMax);
        const isLast = seq === values.tiers.length;
        const thresholdMax = isLast ? null : String(Number(t.max));

        if (existingSequences.has(seq)) {
          skippedCount += 1;
        } else {
          await createLevel(
            t.approval_type,
            t.role_id ?? "",
            t.user_id ?? "",
            thresholdMin,
            thresholdMax,
            seq,
          );
          createdCount += 1;
        }

        if (!isLast) prevMax = Number(t.max);
        seq += 1;
      }
      toast.success(
        skippedCount > 0
          ? `Created ${createdCount} approval level${createdCount === 1 ? "" : "s"} (${skippedCount} already existed)`
          : `Created ${createdCount} approval level${createdCount === 1 ? "" : "s"}`,
      );
      onComplete();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create approval levels"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const coverageGaps =
    currentIssue?.code === "approval_coverage_gap"
      ? currentIssue.details?.gaps ?? []
      : [];

  const coveringLevel = hasCoveringLevel
    ? existingLevels.find((lvl) => {
        const max = lvl.threshold_max;
        return (
          (lvl.is_active ?? true) &&
          Number(lvl.threshold_min ?? 0) <= 0 &&
          (max === null || max === undefined)
        );
      })
    : null;

  if (coveringLevel) {
    const approverLabel =
      coveringLevel.approval_type === "individual"
        ? coveringLevel.user_name ?? "a user"
        : coveringLevel.role ?? "a role";
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approver already configured</CardTitle>
          <CardDescription>
            You&rsquo;ve already set up an approver who handles all amounts. You can add tiered
            levels or change the existing approver from Configuration → Approval Levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm mb-4">
            <p className="font-medium">Current approver</p>
            <p className="text-xs text-muted-foreground mt-1">
              {coveringLevel.level_name ?? "Approver"} &middot; {approverLabel} &middot; covers all amounts
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {onBack ? (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel ? `Back to ${backLabel}` : "Back"}
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={onComplete}>Continue</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose who approves kaizenAdmins</CardTitle>
        <CardDescription>
          Pick one approver to handle every kaizenAdmin, or tier approvers by amount so larger
          requests go to more senior reviewers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {coverageGaps.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 mb-4">
            <p className="font-medium mb-1">Uncovered amount ranges</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {coverageGaps.map((g, i) => (
                <li key={i}>
                  <span className="font-mono">{g.range}</span> — {g.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === "tiered" && existingLevels.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 mb-4">
            <p className="font-medium mb-1">
              {existingLevels.length} approval level
              {existingLevels.length === 1 ? "" : "s"} already exist
            </p>
            <p>
              Saving here will add new levels for sequence numbers not already taken.
              To edit or remove existing levels, use Configuration → Approval Levels.
            </p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 rounded-lg border p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              mode === "single"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Single approver
          </button>
          <button
            type="button"
            onClick={() => setMode("tiered")}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              mode === "tiered"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Tiered by amount
          </button>
        </div>

        {mode === "single" ? (
          <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Approver type</Label>
              <Select
                value={singleApprovalType}
                onValueChange={(v) =>
                  singleForm.setValue(
                    "approval_type",
                    v as ApprovalLevelApprovalType,
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ApprovalLevelApprovalType.role}>
                    A role (e.g. Manager, Finance)
                  </SelectItem>
                  <SelectItem value={ApprovalLevelApprovalType.individual}>
                    A specific person
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {singleApprovalType === ApprovalLevelApprovalType.role ? (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={singleRoleId || undefined}
                  onValueChange={(v) =>
                    singleForm.setValue("role_id", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    aria-invalid={!!singleForm.formState.errors.role_id}
                    className={cn(
                      singleForm.formState.errors.role_id &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No roles available in your organization.
                      </div>
                    ) : (
                      roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {singleForm.formState.errors.role_id && (
                  <p className="text-xs text-destructive">
                    {singleForm.formState.errors.role_id.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  value={singleUserId || undefined}
                  onValueChange={(v) =>
                    singleForm.setValue("user_id", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    aria-invalid={!!singleForm.formState.errors.user_id}
                    className={cn(
                      singleForm.formState.errors.user_id &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  >
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No users available in your organization.
                      </div>
                    ) : (
                      users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {singleForm.formState.errors.user_id && (
                  <p className="text-xs text-destructive">
                    {singleForm.formState.errors.user_id.message}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              This approver will handle <span className="font-medium">all amounts</span> (no
              minimum, no maximum).
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {onBack ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backLabel ? `Back to ${backLabel}` : "Back"}
                </Button>
              ) : (
                <div />
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save approver
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={tieredForm.handleSubmit(onTieredSubmit)} className="space-y-6">
            <div className="space-y-3">
              {tierFields.map((field, i) => {
                const isLast = i === tierFields.length - 1;
                const prevMax =
                  i === 0 ? 0 : Number(tiersWatched[i - 1]?.max) || 0;
                const tierErr = tieredForm.formState.errors.tiers?.[i];
                const currentType = tiersWatched[i]?.approval_type;

                return (
                  <div
                    key={field.id}
                    className="rounded-lg border p-3 space-y-3 bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">
                        Level {i + 1}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {isLast
                            ? `$${prevMax}+ (no upper limit)`
                            : `$${prevMax} – ${
                                tiersWatched[i]?.max
                                  ? "$" + tiersWatched[i].max
                                  : "—"
                              }`}
                        </span>
                      </div>
                      {tierFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeTier(i)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove level ${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {!isLast && (
                        <div className="space-y-1">
                          <Label htmlFor={`tier-max-${i}`} className="text-xs">
                            Max amount
                          </Label>
                          <Input
                            id={`tier-max-${i}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            placeholder="e.g. 10000"
                            {...tieredForm.register(`tiers.${i}.max`)}
                            aria-invalid={!!tierErr?.max}
                            className={cn(
                              "h-9",
                              tierErr?.max &&
                                "border-destructive focus-visible:ring-destructive",
                            )}
                          />
                          {tierErr?.max && (
                            <p className="text-xs text-destructive">
                              {tierErr.max.message}
                            </p>
                          )}
                        </div>
                      )}

                      <div className={cn("space-y-1", isLast && "sm:col-span-2")}>
                        <Label className="text-xs">Approver type</Label>
                        <Select
                          value={currentType}
                          onValueChange={(v) =>
                            tieredForm.setValue(
                              `tiers.${i}.approval_type`,
                              v as ApprovalLevelApprovalType,
                              { shouldValidate: true },
                            )
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ApprovalLevelApprovalType.role}>
                              Role
                            </SelectItem>
                            <SelectItem value={ApprovalLevelApprovalType.individual}>
                              Individual
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {currentType === ApprovalLevelApprovalType.role ? (
                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <Select
                          value={tiersWatched[i]?.role_id || undefined}
                          onValueChange={(v) =>
                            tieredForm.setValue(`tiers.${i}.role_id`, v, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-9",
                              tierErr?.role_id &&
                                "border-destructive focus-visible:ring-destructive",
                            )}
                          >
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {tierErr?.role_id && (
                          <p className="text-xs text-destructive">
                            {tierErr.role_id.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs">User</Label>
                        <Select
                          value={tiersWatched[i]?.user_id || undefined}
                          onValueChange={(v) =>
                            tieredForm.setValue(`tiers.${i}.user_id`, v, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-9",
                              tierErr?.user_id &&
                                "border-destructive focus-visible:ring-destructive",
                            )}
                          >
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {tierErr?.user_id && (
                          <p className="text-xs text-destructive">
                            {tierErr.user_id.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  max: "",
                  approval_type: ApprovalLevelApprovalType.role,
                  role_id: "",
                  user_id: "",
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add another tier
            </Button>

            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Tiers are stacked from $0 upward. Each tier&rsquo;s minimum is the previous
              tier&rsquo;s maximum. The last tier has no upper limit, so every amount is covered.
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {onBack ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backLabel ? `Back to ${backLabel}` : "Back"}
                </Button>
              ) : (
                <div />
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save {tierFields.length} levels
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

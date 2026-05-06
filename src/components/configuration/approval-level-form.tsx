"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ApprovalLevelApprovalType } from "@/lib/generated/kaizenAdmin/models";

const SECONDARY_NONE = "none" as const;
type SecondaryApprovalType = ApprovalLevelApprovalType | typeof SECONDARY_NONE;
import type {
  ApprovalLevel,
  ApprovalLevelCreate,
} from "@/lib/generated/kaizenAdmin/models";
import { useGetOrganizationRoles } from "@/lib/generated/user/organization-roles/organization-roles";
import { useGetUsers } from "@/lib/generated/user/users/users";

interface RoleOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
}

const numericString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Enter a valid non-negative number");

const approvalLevelSchema = z
  .object({
    level_name: z.string().trim().min(1, "Level name is required"),
    sequence_order: z
      .number({ error: "Sequence order is required" })
      .int()
      .min(1, "Must be 1 or greater"),
    threshold_min: numericString,
    threshold_max: z.string().trim().optional().or(z.literal("")),
    approval_type: z.nativeEnum(ApprovalLevelApprovalType),
    role_id: z.string().optional().or(z.literal("")),
    user_id: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean(),
    requires_all: z.boolean(),
    same_department_required: z.boolean(),
    secondary_approval_type: z.enum([
      SECONDARY_NONE,
      ApprovalLevelApprovalType.role,
      ApprovalLevelApprovalType.individual,
    ]),
    secondary_role_id: z.string().optional().or(z.literal("")),
    secondary_user_id: z.string().optional().or(z.literal("")),
    secondary_budget_category: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.approval_type === ApprovalLevelApprovalType.role && !data.role_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role_id"],
        message: "Select a role",
      });
    }
    if (data.approval_type === ApprovalLevelApprovalType.individual && !data.user_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["user_id"],
        message: "Select a user",
      });
    }
    if (data.threshold_max && !/^\d+(\.\d+)?$/.test(data.threshold_max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["threshold_max"],
        message: "Enter a valid non-negative number",
      });
    }
    if (
      data.threshold_max &&
      Number(data.threshold_max) < Number(data.threshold_min)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["threshold_max"],
        message: "Max must be greater than or equal to min",
      });
    }
    if (
      data.secondary_approval_type === ApprovalLevelApprovalType.role &&
      !data.secondary_role_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondary_role_id"],
        message: "Select a secondary role",
      });
    }
    if (
      data.secondary_approval_type === ApprovalLevelApprovalType.individual &&
      !data.secondary_user_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondary_user_id"],
        message: "Select a secondary user",
      });
    }
  });

type ApprovalLevelFormValues = z.infer<typeof approvalLevelSchema>;

export interface ApprovalLevelFormSubmit {
  level_name: string;
  sequence_order: number;
  threshold_min: string;
  threshold_max: string | null;
  approval_type: ApprovalLevelApprovalType;
  role_id: string | null;
  role: string | null;
  user_id: string | null;
  user_name: string | null;
  description: string | null;
  is_active: boolean;
  requires_all: boolean;
  same_department_required: boolean;
  secondary_approval_type: "role" | "individual" | null;
  secondary_role_id: string | null;
  secondary_role: string | null;
  secondary_user_id: string | null;
  secondary_user_name: string | null;
  secondary_budget_category: string | null;
}

interface ApprovalLevelFormProps {
  organizationId: number;
  initialData?: Partial<ApprovalLevel>;
  onSubmit: (data: ApprovalLevelFormSubmit) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ApprovalLevelForm({
  organizationId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save",
}: ApprovalLevelFormProps) {
  const { data: rolesResponse } = useGetOrganizationRoles({});
  const { data: usersResponse } = useGetUsers({ organizationId });

  const roles = useMemo<RoleOption[]>(() => {
    const payload = rolesResponse?.data;
    if (!Array.isArray(payload)) return [];
    return payload as unknown as RoleOption[];
  }, [rolesResponse]);

  const users = useMemo<UserOption[]>(() => {
    const payload = usersResponse?.data;
    if (!Array.isArray(payload)) return [];
    return (payload as unknown as Array<{
      id?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
    }>)
      .filter((u) => !!u.id)
      .map((u) => ({
        id: u.id as string,
        name:
          `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
          u.username ||
          "Unnamed user",
      }));
  }, [usersResponse]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApprovalLevelFormValues>({
    resolver: zodResolver(approvalLevelSchema),
    defaultValues: {
      level_name: initialData?.level_name ?? "",
      sequence_order: initialData?.sequence_order ?? 1,
      threshold_min:
        typeof initialData?.threshold_min === "string"
          ? initialData.threshold_min
          : initialData?.threshold_min != null
            ? String(initialData.threshold_min)
            : "",
      threshold_max:
        typeof initialData?.threshold_max === "string"
          ? initialData.threshold_max
          : initialData?.threshold_max != null
            ? String(initialData.threshold_max)
            : "",
      approval_type:
        (initialData?.approval_type as ApprovalLevelApprovalType) ??
        ApprovalLevelApprovalType.role,
      role_id: (initialData?.role_id as string) ?? "",
      user_id: (initialData?.user_id as string) ?? "",
      description: (initialData?.description as string) ?? "",
      is_active: initialData?.is_active ?? true,
      requires_all: initialData?.requires_all ?? false,
      same_department_required: initialData?.same_department_required ?? false,
      secondary_approval_type:
        (initialData?.secondary_approval_type as SecondaryApprovalType) ??
        SECONDARY_NONE,
      secondary_role_id: (initialData?.secondary_role_id as string) ?? "",
      secondary_user_id: (initialData?.secondary_user_id as string) ?? "",
      secondary_budget_category:
        (initialData?.secondary_budget_category as string) ?? "",
    },
  });

  const approvalType = watch("approval_type");
  const selectedRoleId = watch("role_id");
  const selectedUserId = watch("user_id");
  const isActive = watch("is_active");
  const requiresAll = watch("requires_all");
  const sameDepartmentRequired = watch("same_department_required");
  const secondaryType = watch("secondary_approval_type");
  const selectedSecondaryRoleId = watch("secondary_role_id");
  const selectedSecondaryUserId = watch("secondary_user_id");

  const submit = (values: ApprovalLevelFormValues) => {
    const role = values.role_id
      ? roles.find((r) => r.id === values.role_id)?.name ?? null
      : null;
    const user = values.user_id
      ? users.find((u) => u.id === values.user_id)?.name ?? null
      : null;
    const secondaryIsRole =
      values.secondary_approval_type === ApprovalLevelApprovalType.role;
    const secondaryIsIndividual =
      values.secondary_approval_type === ApprovalLevelApprovalType.individual;
    const secondaryRoleName = secondaryIsRole && values.secondary_role_id
      ? roles.find((r) => r.id === values.secondary_role_id)?.name ?? null
      : null;
    const secondaryUserName = secondaryIsIndividual && values.secondary_user_id
      ? users.find((u) => u.id === values.secondary_user_id)?.name ?? null
      : null;

    onSubmit({
      level_name: values.level_name.trim(),
      sequence_order: values.sequence_order,
      threshold_min: values.threshold_min.trim(),
      threshold_max: values.threshold_max ? values.threshold_max.trim() : null,
      approval_type: values.approval_type,
      role_id:
        values.approval_type === ApprovalLevelApprovalType.role
          ? values.role_id || null
          : null,
      role:
        values.approval_type === ApprovalLevelApprovalType.role ? role : null,
      user_id:
        values.approval_type === ApprovalLevelApprovalType.individual
          ? values.user_id || null
          : null,
      user_name:
        values.approval_type === ApprovalLevelApprovalType.individual
          ? user
          : null,
      description: values.description?.trim() || null,
      is_active: values.is_active,
      requires_all: values.requires_all,
      same_department_required: values.same_department_required,
      secondary_approval_type: secondaryIsRole
        ? "role"
        : secondaryIsIndividual
          ? "individual"
          : null,
      secondary_role_id: secondaryIsRole ? values.secondary_role_id || null : null,
      secondary_role: secondaryIsRole ? secondaryRoleName : null,
      secondary_user_id: secondaryIsIndividual
        ? values.secondary_user_id || null
        : null,
      secondary_user_name: secondaryIsIndividual ? secondaryUserName : null,
      secondary_budget_category:
        values.secondary_budget_category?.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6 pt-6">
      <div className="space-y-2">
        <Label htmlFor="level_name">Level name</Label>
        <Input
          id="level_name"
          placeholder="e.g. Department Head"
          {...register("level_name")}
        />
        {errors.level_name && (
          <p className="text-xs text-destructive">{errors.level_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sequence_order">Sequence order</Label>
          <Input
            id="sequence_order"
            type="number"
            min={1}
            step={1}
            {...register("sequence_order", { valueAsNumber: true })}
          />
          {errors.sequence_order && (
            <p className="text-xs text-destructive">
              {errors.sequence_order.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Approval type</Label>
          <Select
            value={approvalType}
            onValueChange={(value) => {
              setValue("approval_type", value as ApprovalLevelApprovalType, {
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ApprovalLevelApprovalType.role}>
                Role-based
              </SelectItem>
              <SelectItem value={ApprovalLevelApprovalType.individual}>
                Specific individual
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="threshold_min">Minimum amount</Label>
          <Input
            id="threshold_min"
            inputMode="decimal"
            placeholder="0"
            {...register("threshold_min")}
          />
          {errors.threshold_min && (
            <p className="text-xs text-destructive">
              {errors.threshold_min.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold_max">Maximum amount</Label>
          <Input
            id="threshold_max"
            inputMode="decimal"
            placeholder="Leave blank for no upper limit"
            {...register("threshold_max")}
          />
          {errors.threshold_max && (
            <p className="text-xs text-destructive">
              {errors.threshold_max.message}
            </p>
          )}
        </div>
      </div>

      {approvalType === ApprovalLevelApprovalType.role ? (
        <div className="space-y-2">
          <Label>Approver role</Label>
          <Select
            value={selectedRoleId || undefined}
            onValueChange={(value) =>
              setValue("role_id", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role_id && (
            <p className="text-xs text-destructive">{errors.role_id.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Approver</Label>
          <Select
            value={selectedUserId || undefined}
            onValueChange={(value) =>
              setValue("user_id", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.user_id && (
            <p className="text-xs text-destructive">{errors.user_id.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={2}
          placeholder="Optional notes shown when approvers review this level."
          {...register("description")}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="is_active" className="text-sm font-medium">
              Active
            </Label>
            <p className="text-xs text-muted-foreground">
              Include this level in the approval chain.
            </p>
          </div>
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue("is_active", checked, { shouldValidate: true })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="requires_all" className="text-sm font-medium">
              Require all approvers
            </Label>
            <p className="text-xs text-muted-foreground">
              Every approver at this level must approve before moving on.
            </p>
          </div>
          <Switch
            id="requires_all"
            checked={requiresAll}
            onCheckedChange={(checked) =>
              setValue("requires_all", checked, { shouldValidate: true })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="same_department_required" className="text-sm font-medium">
              Same department as requester
            </Label>
            <p className="text-xs text-muted-foreground">
              Approver must belong to the same department as the kaizenAdmin&rsquo;s requester.
            </p>
          </div>
          <Switch
            id="same_department_required"
            checked={sameDepartmentRequired}
            onCheckedChange={(checked) =>
              setValue("same_department_required", checked, { shouldValidate: true })
            }
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border/60 p-4">
        <div>
          <Label className="text-sm font-medium">Secondary approver</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Optional additional approver required at this level (e.g. for specific budget categories).
          </p>
        </div>

        <Select
          value={secondaryType}
          onValueChange={(value) =>
            setValue("secondary_approval_type", value as SecondaryApprovalType, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SECONDARY_NONE}>None</SelectItem>
            <SelectItem value={ApprovalLevelApprovalType.role}>Role-based</SelectItem>
            <SelectItem value={ApprovalLevelApprovalType.individual}>
              Specific individual
            </SelectItem>
          </SelectContent>
        </Select>

        {secondaryType === ApprovalLevelApprovalType.role && (
          <div className="space-y-2">
            <Label>Secondary role</Label>
            <Select
              value={selectedSecondaryRoleId || undefined}
              onValueChange={(value) =>
                setValue("secondary_role_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.secondary_role_id && (
              <p className="text-xs text-destructive">
                {errors.secondary_role_id.message}
              </p>
            )}
          </div>
        )}

        {secondaryType === ApprovalLevelApprovalType.individual && (
          <div className="space-y-2">
            <Label>Secondary approver</Label>
            <Select
              value={selectedSecondaryUserId || undefined}
              onValueChange={(value) =>
                setValue("secondary_user_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.secondary_user_id && (
              <p className="text-xs text-destructive">
                {errors.secondary_user_id.message}
              </p>
            )}
          </div>
        )}

        {secondaryType !== SECONDARY_NONE && (
          <div className="space-y-2">
            <Label htmlFor="secondary_budget_category">
              Budget category (optional)
            </Label>
            <Input
              id="secondary_budget_category"
              placeholder="Restrict secondary approval to a specific budget category"
              {...register("secondary_budget_category")}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export type { ApprovalLevel, ApprovalLevelCreate };

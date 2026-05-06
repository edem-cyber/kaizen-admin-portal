"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users2 } from "lucide-react";
import type { Committee } from "@/lib/generated/requisition/models";
import { useGetUsers } from "@/lib/generated/user/users/users";

const UNSET_SELECT_VALUE = "__none__";

const MEETING_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "as-needed", label: "As needed" },
];

interface UserOption {
  id: string;
  name: string;
}

const committeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Too long"),
  committee_type: z.string().trim().min(1, "Type is required"),
  description: z.string().optional(),
  chairperson_id: z.string().optional(),
  quorum: z.number({ error: "Enter a number" }).int().min(1, "Must be 1 or greater").optional(),
  meeting_frequency: z.string().optional(),
  members: z.array(z.string()),
  is_active: z.boolean(),
});

type CommitteeFormValues = z.infer<typeof committeeSchema>;

export interface CommitteeFormSubmit {
  name: string;
  committee_type: string;
  description: string | null;
  chairperson_id: string | null;
  quorum: number | null;
  meeting_frequency: string | null;
  members: string[];
  is_active: boolean;
}

interface CommitteeFormProps {
  organizationId: number;
  initialData?: Partial<Committee>;
  onSubmit: (data: CommitteeFormSubmit) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
}

export function CommitteeForm({
  organizationId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save",
  mode = "create",
}: CommitteeFormProps) {
  const { data: usersResponse } = useGetUsers({ organizationId });

  const users = useMemo<UserOption[]>(() => {
    const payload = usersResponse?.data;
    if (!Array.isArray(payload)) return [];
    return (
      payload as unknown as Array<{
        id?: string;
        firstName?: string;
        lastName?: string;
        username?: string;
      }>
    )
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
  } = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      committee_type: initialData?.committee_type ?? "",
      description: (initialData?.description as string) ?? "",
      chairperson_id: (initialData?.chairperson_id as string) ?? "",
      quorum: initialData?.quorum,
      meeting_frequency: (initialData?.meeting_frequency as string) ?? "",
      members: (initialData?.members as string[]) ?? [],
      is_active: initialData?.is_active ?? true,
    },
  });

  const chairpersonId = watch("chairperson_id");
  const meetingFrequency = watch("meeting_frequency");
  const selectedMembers = watch("members");
  const isActive = watch("is_active");

  const submit = (values: CommitteeFormValues) => {
    onSubmit({
      name: values.name.trim(),
      committee_type: values.committee_type.trim(),
      description: values.description?.trim() || null,
      chairperson_id: values.chairperson_id || null,
      quorum: values.quorum ?? null,
      meeting_frequency: values.meeting_frequency || null,
      members: values.members,
      is_active: values.is_active,
    });
  };

  const toggleMember = (userId: string, checked: boolean) => {
    const current = selectedMembers ?? [];
    const next = checked
      ? Array.from(new Set([...current, userId]))
      : current.filter((id) => id !== userId);
    setValue("members", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6 pt-6">
      <div className="space-y-2">
        <Label htmlFor="committee_name">Name</Label>
        <Input
          id="committee_name"
          placeholder="e.g. Finance Review Committee"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="committee_type">Type</Label>
          <Input
            id="committee_type"
            placeholder="e.g. finance, procurement"
            {...register("committee_type")}
          />
          {errors.committee_type && (
            <p className="text-xs text-destructive">
              {errors.committee_type.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quorum">Quorum</Label>
          <Input
            id="quorum"
            type="number"
            min={1}
            step={1}
            placeholder="Minimum approvers"
            {...register("quorum", {
              setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
            })}
          />
          {errors.quorum && (
            <p className="text-xs text-destructive">{errors.quorum.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="committee_description">Description</Label>
        <Textarea
          id="committee_description"
          rows={3}
          placeholder="Scope and responsibilities of this committee."
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Chairperson</Label>
          <Select
            value={chairpersonId || UNSET_SELECT_VALUE}
            onValueChange={(value) =>
              setValue(
                "chairperson_id",
                value === UNSET_SELECT_VALUE ? "" : value,
                { shouldValidate: true },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a chairperson" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET_SELECT_VALUE}>None</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Meeting frequency</Label>
          <Select
            value={meetingFrequency || UNSET_SELECT_VALUE}
            onValueChange={(value) =>
              setValue(
                "meeting_frequency",
                value === UNSET_SELECT_VALUE ? "" : value,
                { shouldValidate: true },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET_SELECT_VALUE}>Not set</SelectItem>
              {MEETING_FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Members</Label>
          <span className="text-xs text-muted-foreground">
            {selectedMembers?.length ?? 0} selected
          </span>
        </div>
        <div className="rounded-lg border border-border/60 divide-y max-h-64 overflow-y-auto">
          {users.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Users2 className="h-4 w-4" />
              No users available in this organization.
            </div>
          ) : (
            users.map((u) => {
              const checked = selectedMembers?.includes(u.id) ?? false;
              return (
                <label
                  key={u.id}
                  htmlFor={`member-${u.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-accent/40 transition-colors"
                >
                  <Checkbox
                    id={`member-${u.id}`}
                    checked={checked}
                    onCheckedChange={(value) => toggleMember(u.id, value === true)}
                  />
                  <span>{u.name}</span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {mode === "edit" && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
          <div>
            <Label htmlFor="is_active" className="text-sm font-medium">
              Active
            </Label>
            <p className="text-xs text-muted-foreground">
              Inactive committees are hidden from workflow routing.
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
      )}

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

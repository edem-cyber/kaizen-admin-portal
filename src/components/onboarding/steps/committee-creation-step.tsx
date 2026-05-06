"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { ArrowLeft, Loader2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateCommitteeApiV1CommitteesPost,
  useListCommitteesApiV1CommitteesGet,
} from "@/lib/generated/kaizenAdmin/committees-v1/committees-v1";
import { useUpdateCommitteeSettingsApiV1ConfigurationOrganizationIdCommitteeSettingsPatch } from "@/lib/generated/kaizenAdmin/configuration-v1/configuration-v1";
import { useGetUsers } from "@/lib/generated/user/users/users";
import { extractErrorMessage } from "@/lib/api-error";
import { extractItems } from "@/lib/list-response";

interface ExistingCommittee {
  id?: string;
  name?: string;
  chairperson_id?: string | null;
  members?: string[] | null;
  is_active?: boolean;
}

interface CommitteeCreationStepProps {
  organizationId: number;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
}

interface UserOption {
  id: string;
  name: string;
}

const COMMITTEE_TYPES = [
  { value: "finance", label: "Finance" },
  { value: "procurement", label: "Procurement" },
  { value: "executive", label: "Executive" },
  { value: "general", label: "General" },
];

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    committee_type: z.string().min(1, "Select a type"),
    chairperson_id: z.string().min(1, "Select a chairperson"),
    member_ids: z.array(z.string()).min(1, "Add at least one member"),
  })
  .superRefine((data, ctx) => {
    if (!data.member_ids.includes(data.chairperson_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["member_ids"],
        message: "The chairperson must also be a member",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function CommitteeCreationStep({
  organizationId,
  onComplete,
  onBack,
  backLabel,
}: CommitteeCreationStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: usersResponse } = useGetUsers({ organizationId });
  const { data: existingCommitteesData } = useListCommitteesApiV1CommitteesGet();

  const existingViableCommittee = useMemo<ExistingCommittee | null>(() => {
    const list = extractItems<ExistingCommittee>(
      existingCommitteesData,
      "committees",
    );
    return (
      list.find(
        (c) =>
          (c.is_active ?? true) &&
          !!c.chairperson_id &&
          Array.isArray(c.members) &&
          c.members.length > 0,
      ) ?? null
    );
  }, [existingCommitteesData]);

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "Review Committee",
      committee_type: "general",
      chairperson_id: "",
      member_ids: [],
    },
  });

  const chairpersonId = watch("chairperson_id");
  const memberIds = watch("member_ids");
  const committeeType = watch("committee_type");

  const availableMembers = users.filter((u) => !memberIds.includes(u.id));

  const addMember = (userId: string) => {
    if (!userId) return;
    if (memberIds.includes(userId)) return;
    setValue("member_ids", [...memberIds, userId], { shouldValidate: true });
  };

  const removeMember = (userId: string) => {
    setValue(
      "member_ids",
      memberIds.filter((id) => id !== userId),
      { shouldValidate: true },
    );
  };

  const { mutateAsync: createCommittee } = useCreateCommitteeApiV1CommitteesPost();
  const { mutateAsync: updateSettings } =
    useUpdateCommitteeSettingsApiV1ConfigurationOrganizationIdCommitteeSettingsPatch();

  const enableGates = async (committeeJustCreated: boolean) => {
    try {
      await updateSettings({
        organizationId,
        data: {
          uses_committee_review: true,
          uses_post_committee_approval: true,
        },
      });
      toast.success(
        committeeJustCreated
          ? "Committee created and review enabled"
          : "Review enabled",
      );
      onComplete();
    } catch (err) {
      toast.error(
        extractErrorMessage(
          err,
          committeeJustCreated
            ? "Committee was created but we couldn't enable review gates. Click the button again to retry just the settings update."
            : "Couldn't enable review gates. Try again.",
        ),
      );
    }
  };

  const onValid = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await createCommittee({
        data: {
          name: values.name.trim(),
          committee_type: values.committee_type,
          chairperson_id: values.chairperson_id,
          members: values.member_ids,
          quorum: Math.max(1, Math.ceil(values.member_ids.length / 2)),
          organization_id: organizationId,
        },
      });
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create committee"));
      setIsSubmitting(false);
      return;
    }
    await enableGates(true);
    setIsSubmitting(false);
  };

  const handleReuseExisting = async () => {
    setIsSubmitting(true);
    await enableGates(false);
    setIsSubmitting(false);
  };

  if (existingViableCommittee) {
    const chairName =
      users.find((u) => u.id === existingViableCommittee.chairperson_id)?.name ??
      "a user";
    const memberCount = existingViableCommittee.members?.length ?? 0;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Committee already exists</CardTitle>
          <CardDescription>
            &ldquo;{existingViableCommittee.name ?? "Your committee"}&rdquo; is ready. Click below
            to enable committee review gates and finish this step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm mb-4 space-y-1">
            <p>
              <span className="font-medium">Chair:</span> {chairName}
            </p>
            <p>
              <span className="font-medium">Members:</span> {memberCount}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {onBack ? (
              <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel ? `Back to ${backLabel}` : "Back"}
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={handleReuseExisting} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable committee review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your review committee</CardTitle>
        <CardDescription>
          Pick a chairperson and add at least one member. Committee review will be enabled for
          kaizenAdmins after you save.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValid)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="committee_name">Committee name</Label>
              <Input
                id="committee_name"
                disabled={isSubmitting}
                {...register("name")}
                aria-invalid={!!errors.name}
                className={cn(
                  errors.name && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Committee type</Label>
              <Select
                value={committeeType}
                onValueChange={(v) =>
                  setValue("committee_type", v, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger
                  aria-invalid={!!errors.committee_type}
                  className={cn(
                    errors.committee_type &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMITTEE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.committee_type && (
                <p className="text-xs text-destructive">{errors.committee_type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chairperson</Label>
            <Select
              value={chairpersonId || undefined}
              onValueChange={(v) => {
                setValue("chairperson_id", v, { shouldValidate: true });
                // Ensure chairperson is also a member
                if (!memberIds.includes(v)) {
                  setValue("member_ids", [...memberIds, v], { shouldValidate: true });
                }
              }}
              disabled={isSubmitting || users.length === 0}
            >
              <SelectTrigger
                aria-invalid={!!errors.chairperson_id}
                className={cn(
                  errors.chairperson_id &&
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
            {errors.chairperson_id && (
              <p className="text-xs text-destructive">{errors.chairperson_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Members</Label>
            <div
              className={cn(
                "rounded-lg border p-3 min-h-[60px]",
                errors.member_ids && "border-destructive",
              )}
            >
              {memberIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">No members added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {memberIds.map((id) => {
                    const u = users.find((x) => x.id === id);
                    const label = u?.name ?? id.slice(0, 8);
                    const isChair = id === chairpersonId;
                    return (
                      <span
                        key={id}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                          isChair
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-muted",
                        )}
                      >
                        {label}
                        {isChair && <span className="font-semibold">(chair)</span>}
                        {!isChair && (
                          <button
                            type="button"
                            onClick={() => removeMember(id)}
                            className="hover:text-destructive ml-0.5"
                            aria-label={`Remove ${label}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {availableMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <Select value="" onValueChange={addMember}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add a member…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {errors.member_ids && (
              <p className="text-xs text-destructive">{errors.member_ids.message}</p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            Quorum will default to half your committee size (rounded up). Change it later from
            Configuration → Committees.
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
              Create committee &amp; enable review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

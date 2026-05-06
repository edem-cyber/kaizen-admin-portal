"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUpdateCommitteeSettingsApiV1ConfigurationOrganizationIdCommitteeSettingsPatch } from "@/lib/generated/requisition/configuration-v1/configuration-v1";
import { extractErrorMessage } from "@/lib/api-error";
import type { IntroAnswers } from "@/lib/onboarding";

interface CommitteeSettingsStepProps {
  organizationId: number;
  introAnswers: IntroAnswers | null;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function CommitteeSettingsStep({
  organizationId,
  introAnswers,
  onComplete,
  onBack,
  backLabel,
}: CommitteeSettingsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync } =
    useUpdateCommitteeSettingsApiV1ConfigurationOrganizationIdCommitteeSettingsPatch();

  // Phase 1 only handles the "no committees" path. The Yes-committees branch
  // (create committee + flip flags back on) ships in Phase 3.
  const wantsCommittees = !!introAnswers?.use_committees;

  const handleDisable = async () => {
    setIsSubmitting(true);
    try {
      await mutateAsync({
        organizationId,
        data: {
          uses_committee_review: false,
          uses_post_committee_approval: false,
        },
      });
      toast.success("Committee gates disabled");
      onComplete();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update committee settings"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Committee review</CardTitle>
        <CardDescription>
          {wantsCommittees
            ? "You opted in to committee review. We'll walk you through setting up a committee in a later update — for now, we'll disable committee gates so the rest of setup can proceed, and you can configure a committee from Configuration → Committees afterwards."
            : "New organizations start with committee review turned on by default. Since you said no committees, we'll disable both committee gates so requisitions can be approved by a single approver."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
          <p className="font-medium">This will turn off:</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>
              <span className="font-mono text-xs">uses_committee_review</span>
            </li>
            <li>
              <span className="font-mono text-xs">uses_post_committee_approval</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4">
          {onBack ? (
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel ? `Back to ${backLabel}` : "Back"}
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={handleDisable} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disable committee gates
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

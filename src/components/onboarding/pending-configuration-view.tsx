"use client";

import { useEffect } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, Loader2, RefreshCw } from "lucide-react";
import {
  setupStatusQueryKey,
  type BlockingIssue,
  type SetupStatusResponse,
} from "@/lib/onboarding";
import type { UserDto } from "@/lib/generated/user/models/userDto";

interface PendingConfigurationViewProps {
  status: SetupStatusResponse;
}

/**
 * Non-edit users (only `configuration:read`) see this instead of the
 * wizard when their org hasn't finished setup. Lists the blocking issues
 * so they know exactly what their admin needs to complete.
 */
export function PendingConfigurationView({ status }: PendingConfigurationViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasIssues = status.blocking_issues.length > 0;
  const organizationId = (user as UserDto | null)?.organizationId;

  // If the admin finishes setup while the read-only user is viewing this
  // screen, bounce them back to the dashboard automatically.
  useEffect(() => {
    if (status.setup_complete) {
      router.push("/admin");
    }
  }, [status.setup_complete, router]);

  // Track in-flight setup-status fetches so the refresh button can show a
  // spinner and disable itself during the round-trip.
  const isRefetching = useIsFetching({
    queryKey: organizationId
      ? setupStatusQueryKey(organizationId)
      : ["onboarding:setup-status", "_no_org"],
  });

  const handleRefresh = () => {
    if (!organizationId) return;
    queryClient.invalidateQueries({
      queryKey: setupStatusQueryKey(organizationId),
    });
  };

  return (
    <div className="space-y-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              This organization&rsquo;s account is pending configuration
            </h1>
            <p className="text-sm text-muted-foreground">
              Kaizen Admins can&rsquo;t be submitted yet. An administrator needs to finish setting
              up the following:
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefetching > 0}
        >
          {isRefetching > 0 ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Check again
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {hasIssues ? (
            <ul className="space-y-3">
              {status.blocking_issues.map((issue: BlockingIssue, i: number) => (
                <li
                  key={`${issue.code}-${i}`}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0 mt-0.5 text-xs font-semibold">
                    {i + 1}
                  </div>
                  <p className="min-w-0 flex-1 text-sm">{issue.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No blocking issues reported — setup may have just finished. Try refreshing the
              page.
            </p>
          )}
        </CardContent>
      </Card>

      {status.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-muted-foreground" />
              Additional notes (non-blocking)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {status.warnings.map((w, i) => (
                <li key={`${w.code}-${i}`}>{w.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

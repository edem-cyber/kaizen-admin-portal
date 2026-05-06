"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { BlockingIssue } from "@/lib/onboarding";

interface UnknownIssueStepProps {
  issue: BlockingIssue | null;
  onDone: () => void;
  onBack?: () => void;
  backLabel?: string;
}

/**
 * Fallback step for blocking-issue codes the wizard doesn't know how to
 * resolve inline. Renders the backend message and links to the
 * corresponding Configuration sub-page so the user can handle it there,
 * then asks the wizard to refetch setup-status.
 */
export function UnknownIssueStep({ issue, onDone, onBack, backLabel }: UnknownIssueStepProps) {
  const href = issue?.remedy_step
    ? `/configuration/${issue.remedy_step}`
    : "/configuration";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>One more thing to configure</CardTitle>
            <CardDescription>
              This step is handled on a full Configuration page. Finish it there, then come back.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm mb-4">
          <p className="font-medium">{issue?.message ?? "Unspecified issue"}</p>
          {issue?.code && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">{issue.code}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onBack ? (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel ? `Back to ${backLabel}` : "Back"}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onDone}>
              I&rsquo;ve done it — recheck
            </Button>
            <Button asChild>
              <Link href={href}>Open configuration</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

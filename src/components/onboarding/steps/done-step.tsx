"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface DoneStepProps {
  onFinish: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function DoneStep({ onFinish, onBack, backLabel }: DoneStepProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>You&rsquo;re all set</CardTitle>
            <CardDescription>
              Your organization is configured. Go ahead and create your first kaizenAdmin.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2 mb-4">
          <p className="font-medium">What&rsquo;s next</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-xs">
            <li>Invite your team from Configuration → Team Members.</li>
            <li>Customize policies, vendor rules, and tax from Configuration.</li>
            <li>
              Add more approval levels (tiered by amount) from Configuration → Approval Levels.
            </li>
          </ul>
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
          <Button onClick={onFinish}>Go to dashboard</Button>
        </div>
      </CardContent>
    </Card>
  );
}

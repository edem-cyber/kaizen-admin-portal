"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportSection } from "@/lib/reports/catalog";
import { findReport, SECTION_META } from "@/lib/reports/catalog";
import { ReportRunner } from "./report-runner";
import { notFound } from "next/navigation";

interface ReportPageProps {
  section: ReportSection;
  reportId: string;
}

export function ReportPage({ section, reportId }: ReportPageProps) {
  const descriptor = findReport(section, reportId);
  if (!descriptor) {
    // Either unknown slug or belongs to a different section — treat as 404
    notFound();
  }

  const sectionMeta = SECTION_META[section];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={sectionMeta.path}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <nav className="text-xs text-muted-foreground">
            <Link href="/reports" className="hover:underline">
              Reports
            </Link>
            {" / "}
            <Link href={sectionMeta.path} className="hover:underline">
              {sectionMeta.title}
            </Link>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {descriptor.title}
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl mt-1">
            {descriptor.description}
          </p>
        </div>
      </div>

      <ReportRunner descriptor={descriptor} />
    </div>
  );
}

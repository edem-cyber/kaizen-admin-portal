"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReportSection } from "@/lib/reports/catalog";
import { reportsBySection, SECTION_META } from "@/lib/reports/catalog";

export function ReportsHub({ section }: { section: ReportSection }) {
  const meta = SECTION_META[section];
  const reports = reportsBySection(section);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {meta.title}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          {meta.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Link
            key={r.id}
            href={`${meta.path}/${r.id}`}
            className="group block focus-visible:outline-none"
          >
            <Card className="h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{r.title}</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <CardDescription className="leading-relaxed">
                  {r.description}
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

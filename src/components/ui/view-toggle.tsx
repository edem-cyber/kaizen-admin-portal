"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn("bg-slate-100 p-1 rounded-xl flex items-center shadow-inner", className)}>
      <Button 
        variant={view === "list" ? "secondary" : "ghost"} 
        size="icon" 
        onClick={() => onViewChange("list")}
        className={cn(
          "h-8 w-8 rounded-lg transition-all duration-200",
          view === "list" ? "bg-white shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-900"
        )}
        title="List View"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button 
        variant={view === "grid" ? "secondary" : "ghost"} 
        size="icon" 
        onClick={() => onViewChange("grid")}
        className={cn(
          "h-8 w-8 rounded-lg transition-all duration-200",
          view === "grid" ? "bg-white shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-900"
        )}
        title="Grid View"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}

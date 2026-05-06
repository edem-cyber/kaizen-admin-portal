"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControllerProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemName?: string;
}

export function PaginationController({
  currentPage,
  totalPages,
  totalCount,
  limit,
  onPageChange,
  className,
  itemName = "results"
}: PaginationControllerProps) {
  if (totalCount === 0) return null;

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalCount);

  // Generate page numbers to show
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 mt-4", className)}>
      <div className="text-sm text-slate-500 font-medium">
        Showing <span className="text-slate-900">{start}</span> to <span className="text-slate-900">{end}</span> of <span className="text-slate-900">{totalCount}</span> {itemName}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {getPages().map((page, i) => (
            page === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
            ) : (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl transition-all",
                  currentPage === page ? "bg-violet-100 text-violet-700 font-bold" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {page}
              </Button>
            )
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

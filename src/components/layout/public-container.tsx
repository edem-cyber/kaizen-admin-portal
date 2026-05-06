"use client";

import { ReactNode } from "react";

interface PublicContainerProps {
  children: ReactNode;
  className?: string;
}

export function PublicContainer({ children, className = "" }: PublicContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto flex items-center justify-between px-6 ${className}`}>
      {children}
    </div>
  );
}


"use client";

import { PublicNavbar } from "./public-navbar";
import { PublicFooter } from "./public-footer";

export function GrainOverlay() {
  return (
    <div className="grain-overlay">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#FDFCFB] overflow-hidden">
      {/* Moving Blobs - Violet/Purple */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/15 blur-[100px] rounded-full animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] rounded-full animate-blob animation-delay-4000 pointer-events-none" />

      {/* Subtle radial center light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#FDFCFB_70%)] opacity-80" />
    </div>
  );
}

interface PublicPageLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
}

export function PublicPageLayout({
  children,
  showNavbar = true,
  showFooter = true
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden flex flex-col">
      <MeshBackground />
      <GrainOverlay />
      <div className="fixed inset-0 grid-background -z-10" />
      {showNavbar && <PublicNavbar />}
      <div className="flex-1">
        {children}
      </div>
      {showFooter && <PublicFooter />}
    </div>
  );
}


"use client";

import Image from "next/image";

export function HeroSlider() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-white">
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.webp"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        {/* Bottom blending gradient - fades background to pure white */}
        <div className="absolute inset-x-0 bottom-0 h-160 bg-linear-to-t from-white via-white/80 to-transparent z-10" />
        {/* Top/Side readability gradients */}
        <div className="absolute inset-0 bg-linear-to-b from-white/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-white/60 via-white/20 to-transparent" />
      </div>
    </div>
  );
}

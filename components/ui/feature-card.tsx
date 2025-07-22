"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-black/20",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white/30 group-hover:text-gray-300">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg text-white group-hover:text-gray-100 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

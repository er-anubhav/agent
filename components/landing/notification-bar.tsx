'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';

interface NotificationBarProps {
  className?: string;
}

export default function NotificationBar({ className }: NotificationBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-[60] ${className}`}
      >
        <div className="bg-black text-white py-3 px-4 shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left spacer for mobile */}
            <div className="w-8 md:w-0" />
            
            {/* Main content */}
            <div className="flex items-center justify-center gap-3 flex-1">
              <Gift className="w-5 h-5 text-white animate-pulse" />
              <span className="text-sm md:text-base">
                <span className="hidden sm:inline">🎉 Special Launch Offer: </span>
                <span className="text-white">Free for First 3 Days!</span>
                <span className="hidden md:inline ml-2">Start your journey today.</span>
              </span>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setIsVisible(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 group"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 text-white/70 group-hover:text-white" />
            </button>
          </div>
        </div>
        
        {/* Subtle shadow/border at bottom */}
       
      </motion.div>
    </AnimatePresence>
  );
}

'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Shield } from 'lucide-react';

interface CTASectionProps {
  className?: string;
}

export default function CTASection({ className }: CTASectionProps) {
  const handleBookDemo = () => {
    // In a real implementation, this could open a calendar booking widget
    console.log('Book Demo clicked');
    window.open('https://calendly.com/infoassist-demo', '_blank');
  };

  const handleRequestAccess = () => {
    // In a real implementation, this could open a contact form or navigate to signup
    console.log('Request Access clicked');
    window.open('mailto:access@infoassist.tech?subject=Request%20Early%20Access', '_blank');
  };

  return (
    <section className={`pb-16 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 rounded-3xl blur-3xl" />
          
          {/* Main content container */}
          <div className="relative rounded-3xl p-12 lg:p-16 text-center overflow-hidden">
            
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gray-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-small mb-8"
              >
                <Shield className="w-4 h-4" />
                Trusted by 500+ Teams Worldwide
              </motion.div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl lg:text-4xl font-serif text-white mb-6 leading-tight"
              >
                Ready to Transform
                <span className="block text-gray-300">Your Team's Knowledge?</span>
              </motion.h2>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed"
              >
                Join innovative teams already using InfoAssist to accelerate decision-making, 
                reduce search time, and unlock the full potential of their collective knowledge.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-2 flex flex-col sm:flex-row gap-8 justify-center items-center text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Knowledge Base
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  MultiModal
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Telegram Bot Support
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

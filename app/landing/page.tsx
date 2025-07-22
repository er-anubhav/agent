'use client';
import React, { useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/hero';
import { div } from 'framer-motion/client';
import { ContainerScroll } from '@/components/ui/container-scroll';
import Image from 'next/image';
import { AnimatedList } from '@/components/ui/animated-list';
import { Sparkles } from 'lucide-react';
import { FeatureGrid } from '@/components/ui/feature-grid';
import AudienceSection from '@/components/landing/audience-section';
import { NirvanaFaq } from '@/components/ui/faq-nirvana';
import CTASection from '@/components/landing/cta-section';
import FooterLayout from '@/components/landing/footer';
import { motion } from 'framer-motion';
import { HeroVideoDialog } from '@/components/ui/hero-video-dialog';
import NotificationBar from '@/components/landing/notification-bar';

export default function Home() {
  // Demo state for testing different navbar configurations
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user] = useState({
    name: 'Alex Johnson',
    avatarUrl: '' // Leave empty to show initials
  });

  // Display cards configuration
  const defaultCards = [
    {
      icon: <Sparkles className="text-white size-4" />,
      title: "AI Knowledge Assistant",
      description: "Intelligent document processing",
      date: "Available now",
      iconClassName: "text-white",
      titleClassName: "text-white",
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Sparkles className="text-white size-4" />,
      title: "Instant Search",
      description: "Find information instantly",
      date: "Real-time results",
      iconClassName: "text-white",
      titleClassName: "text-white",
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Sparkles className="text-white size-4" />,
      title: "Smart Integration",
      description: "Connect all your knowledge sources",
      date: "Multi-platform",
      iconClassName: "text-white",
      titleClassName: "text-white",
      className:
        "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
  ];

  // Key Features data based on README.md Core Features
  const keyFeatures = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Multi-platform Document Integration",
      description: "Import and sync documents from Notion, Google Drive, PDFs, and user uploads seamlessly."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Smart AI Q&A",
      description: "Powered by advanced large language models that answer questions with context from your team's knowledge."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Document Indexing",
      description: "Upload any file, and InfoAssist immediately makes it searchable and queryable with AI processing."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: "Telegram Bot Access",
      description: "Interact with your knowledge base on the go, outside the website through our intelligent bot."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "User Authentication & Access Control",
      description: "Secure registration, login, and role-based permissions to protect your team's sensitive information."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "Unified Search Experience",
      description: "No more hopping between apps; get all answers in one place with intelligent cross-platform search."
    }
  ];

  const handleLogout = () => {
    setIsAuthenticated(false);
    console.log('User logged out');
  };

  const toggleAuthState = () => {
    setIsAuthenticated(!isAuthenticated);
  };
  return (
<>    
  {/* Notification Bar */}
  <NotificationBar />

  <div 
      className="relative min-h-screen w-full overflow-hidden bg-black font-serif font-light text-white antialiased pt-16"
      style={{
        background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
      }}
    >      {/* Navbar Component */}
      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        title="InfoAssist"
      /> 

      {/* Hero Section */}
      <Hero />

      {/* Animated List Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl text-white">Common Challenges</h2>
            <p className="text-lg text-white">Problems teams face with traditional knowledge management</p>
          </div>              <div className="max-w-2xl mx-auto">            
            <div className="h-[300px] flex flex-col justify-center">
              <AnimatedList className="max-w-full" delay={3000}>
              <div className="flex items-center p-4 space-x-4 border rounded-lg bg-white/5 backdrop-blur-sm border-white/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0h14m-14 0a2 2 0 002 2v6a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white ">Scattered knowledge silos</p>
                  <p className="text-sm text-white/70">Information trapped in Slack, Drive, Notion</p>
                </div>
              </div>

              <div className="flex items-center p-4 space-x-4 border rounded-lg bg-white/5 backdrop-blur-sm border-white/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white ">Time wasted searching</p>
                  <p className="text-sm text-white/70">Valuable hours lost hunting information</p>
                </div>
              </div>

              <div className="flex items-center p-4 space-x-4 border rounded-lg bg-white/5 backdrop-blur-sm border-white/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white ">Context loss and frustration</p>
                  <p className="text-sm text-white/70">Multiple tools break workflow</p>
                </div>
              </div>

              <div className="flex items-center p-4 space-x-4 border rounded-lg bg-white/5 backdrop-blur-sm border-white/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white ">Limited AI integration</p>
                  <p className="text-sm text-white/70">Existing assistants lack knowledge context</p>
                </div>
              </div>

              <div className="flex items-center p-4 space-x-4 border rounded-lg bg-white/5 backdrop-blur-sm border-white/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white ">Teams need unified solution</p>
                  <p className="text-sm text-white/70">Smart, context-aware knowledge access</p>
                </div>
              </div>            </AnimatedList>
            </div>
          </div>
        </div>      </section>      {/* Key Features Section */}
      <section className="px-4 py-16 mt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl text-white">Core Features</h2>
            <p className="max-w-2xl mx-auto text-lg text-white">
              Everything you need to transform your team's collective knowledge into instant, actionable insights
            </p>
          </div>
          
          <FeatureGrid features={keyFeatures} columns={3} />
        </div>
      </section>      {/* Audience Section */}
      <AudienceSection />

      {/* Video Demo Section */}
        <motion.div
          className="relative mt-16 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h3 className="mb-4 font-serif text-2xl text-white md:text-3xl">
              See InfoAssist in Action
            </h3>
            <p className="max-w-2xl mx-auto text-lg text-white/80">
              Watch how our AI-powered knowledge assistant transforms how teams find, share, 
              and utilize information with intelligent search and natural language processing.
            </p>
          </div>
          
          <HeroVideoDialog
            animationStyle="from-center"
            videoSrc="https://www.youtube.com/embed/JyM39Gt5RXg?si=oUH2YHlArPkqznMY"
            thumbnailSrc="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop&crop=entropy"
            thumbnailAlt="Watch InfoAssist Platform Demo - AI Knowledge Assistant in Action"
            className="max-w-4xl mx-auto overflow-hidden border shadow-2xl rounded-2xl border-white/20 shadow-black/10"
          />
        </motion.div>      {/* FAQ Section */}
      <NirvanaFaq />

      {/* Call to Action Section */}
      <CTASection />

      {/* Footer */}
      <FooterLayout />
    </div>
    </>
  );
}

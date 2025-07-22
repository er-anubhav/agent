'use client';
import React from 'react';
import { CircularTestimonials } from '@/components/ui/circular-testimonials';

// Testimonial data for different user types
const testimonials = [
  {
    quote: "Our onboarding process used to take weeks for new developers to find relevant documentation. With InfoAssist, new team members can instantly access our entire knowledge base through natural language queries. It's reduced our onboarding time by 70%.",
    name: "Marcus Johnson",
    designation: "Head of Developer Experience, StartupX",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
  },
  {
    quote: "The AI-powered search across our Notion workspace, GitHub repos, and Google Drive is phenomenal. InfoAssist doesn't just find documents - it understands context and provides intelligent answers. Our team productivity has increased significantly.",
    name: "Dr. Emily Rodriguez",
    designation: "CTO, HealthTech Solutions",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
  },
];

// Who benefits from InfoAssist
const audienceData = [
  {
    title: "Development Teams",
    description: "Instant access to code docs, APIs, and technical knowledge across repositories",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: "Knowledge Workers",
    description: "Smart search across documents, wikis, and team knowledge bases",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Team Leaders",
    description: "Analytics on knowledge gaps, usage insights, and team productivity metrics",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function AudienceSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4">
            Who It's For
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            InfoAssist empowers every member of your organization, from developers seeking technical docs 
            to executives making data-driven decisions
          </p>
        </div>

        {/* Audience Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {audienceData.map((audience, index) => (
            <div
              key={index}
              className="group relative p-8 bg-gradient-to-br from-white/10 to-gray-500/5 
                         backdrop-blur-sm border border-white/20 rounded-2xl 
                         hover:border-white/40 transition-all duration-300
                         hover:shadow-lg hover:shadow-black/10"
            >
              <div className="text-white mb-6 group-hover:text-gray-300 transition-colors">
                {audience.icon}
              </div>
              <h3 className="text-xl text-white mb-4 font-serif">
                {audience.title}
              </h3>
              <p className="text-white/80 leading-relaxed">
                {audience.description}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials Section */}

          <div className="text-center pt-16 mb-12">
            <h3 className="text-2xl sm:text-3xl font-serif text-white mb-4">
              What Teams Are Saying
            </h3>
            <p className="text-white/80 max-w-2xl mx-auto">
              Real feedback from teams and organizations who have transformed their 
              knowledge workflows with InfoAssist
            </p>
          </div>

          <div className="flex justify-center">
            <CircularTestimonials
              testimonials={testimonials}
              autoplay={true}
              colors={{
                name: "#ffffff",
                designation: "#c4b5fd",
                testimony: "#fffff",
                arrowBackground: "#7c3aed",
                arrowForeground: "#ffffff",
                arrowHoverBackground: "#8b5cf6",
              }}
              fontSizes={{
                name: "1.25rem",
                designation: "0.875rem",
                quote: "1rem",
              }}
            />
          </div>
        </div>
    </section>
  );
}

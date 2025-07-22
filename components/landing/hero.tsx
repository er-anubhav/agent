"use client";
 
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ContainerScroll } from "../ui/container-scroll";
import { HeroVideoDialog } from "../ui/hero-video-dialog";
 
export default function Hero() {
  return (    <section
      className="relative w-full pt-20 pb-10 overflow-hidden antialiased font-light text-white md:pb-16 md:pt-24"
    >
 
      <div className="container relative z-10 max-w-2xl px-4 mx-auto font-serif text-center md:max-w-4xl md:px-6 lg:max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >          <span className="mb-8 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-2 text-md text-white backdrop-blur-sm">
           InfoAssist - Your Team's Instant AI Knowledge Assistant
          </span>
          <h1 className="max-w-6xl mx-auto mb-8 text-3xl font-light leading-tight md:text-6xl lg:text-5xl">
            Unified Knowledge 
            <span className="block text-white/90">Instant Answers</span>
            <span className="block text-3xl text-white/80">&</span>
            <span className="block text-5xl text-white/90">AI-Powered Intelligence</span>
          </h1>
          <p className="max-w-4xl mx-auto mb-12 text-lg leading-relaxed text-white/80 md:text-xl lg:text-2xl">
            InfoAssist transforms your team's scattered knowledge into an intelligent AI assistant — 
            <span className="text-white"> instantly searchable, contextually aware, and seamlessly integrated</span> across all platforms. 
            <span className="block mt-2 text-xl text-white/70">Perfect for modern teams and knowledge-driven organizations.</span>
          </p>          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
            <Link
              href="/login"
              className="group relative w-full overflow-hidden rounded-full border border-white/30 bg-gradient-to-r from-black to-gray-800 px-10 py-4 text-lg text-white shadow-2xl shadow-black/25 transition-all duration-300 hover:scale-105 hover:border-white/50 hover:shadow-[0_0_30px_rgba(0,0,0,0.6)] sm:w-auto"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 transition-opacity duration-300 rounded-full opacity-0 bg-gradient-to-r from-white/20 to-transparent group-hover:opacity-100" />
            </Link>
            <a
              href="#core-features"
              className="flex items-center justify-center w-full gap-3 px-8 py-4 text-lg transition-all duration-300 border rounded-full group border-white/20 text-white/90 backdrop-blur-sm hover:border-white/40 hover:bg-white/5 hover:text-white sm:w-auto"
            >
              <span>Free for 3 Days</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-y-1"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </a>
          </div>        
          </motion.div>
      </div>
    </section>
  );
}

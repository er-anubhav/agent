'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './smooth-scroll.css';

interface SmoothScrollProps {
  children: React.ReactNode;
  speed?: number;
  effects?: boolean;
  className?: string;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ 
  children, 
  speed = 1,
  effects = true,
  className = '' 
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user prefers reduced motion or is on mobile
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    
    if (prefersReducedMotion || isMobile) {
      // Use native smooth scrolling for better performance
      document.documentElement.style.scrollBehavior = 'smooth';
      return;
    }

    // Register plugins
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    let smoother: ScrollSmoother;

    const initSmoothScroll = () => {
      if (!wrapperRef.current || !contentRef.current) return;

      try {
        smoother = ScrollSmoother.create({
          wrapper: wrapperRef.current,
          content: contentRef.current,
          smooth: speed,
          effects: effects,
          normalizeScroll: true,
          ignoreMobileResize: true,
          smoothTouch: 0.1, // Add minimal touch scrolling
          onUpdate: self => {
            // Throttle updates for performance
            if (self.progress % 0.01 < 0.005) {
              // Only update every 1% of scroll
              ScrollTrigger.update();
            }
          }
        });

        // Add some scroll-triggered animations
        if (effects) {
          // Parallax effect for background elements
          gsap.utils.toArray('.parallax-bg').forEach((element: any) => {
            gsap.to(element, {
              yPercent: -50,
              ease: 'none',
              scrollTrigger: {
                trigger: element,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              }
            });
          });

          // Fade in animations for sections with smoother settings
          gsap.utils.toArray('.fade-in').forEach((element: any) => {
            gsap.fromTo(element, 
              { opacity: 0, y: 20 }, // Reduced movement distance
              {
                opacity: 1,
                y: 0,
                duration: 0.8, // Faster animation
                ease: 'power1.out', // Gentler easing
                scrollTrigger: {
                  trigger: element,
                  start: 'top 85%', // Start animation earlier
                  end: 'bottom 15%',
                  toggleActions: 'play none none reverse',
                  once: true, // Only animate once for better performance
                }
              }
            );
          });
        }

      } catch (error) {
        console.warn('ScrollSmoother not available, using fallback');
        // Fallback to basic smooth scroll
        document.documentElement.style.scrollBehavior = 'smooth';
      }
    };

    // Initialize after a short delay to ensure DOM is ready
    const timer = setTimeout(initSmoothScroll, 100);

    return () => {
      clearTimeout(timer);
      if (smoother) {
        smoother.kill();
      }
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [speed, effects]);

  return (
    <div 
      id="smooth-wrapper"
      ref={wrapperRef} 
      className={`smooth-scroll-wrapper ${className}`}
    >
      <div 
        id="smooth-content"
        ref={contentRef}
        className="smooth-scroll-content"
      >
        {children}
      </div>
    </div>
  );
};

export default SmoothScroll;

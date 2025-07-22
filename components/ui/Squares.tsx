'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SquaresProps {
  speed?: number;
  squareSize?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'diagonal';
  borderColor?: string;
  hoverFillColor?: string;
  className?: string;
}

const Squares: React.FC<SquaresProps> = ({
  speed = 0.5,
  squareSize = 40,
  direction = 'diagonal',
  borderColor = '#fff',
  hoverFillColor = '#222',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing squares
    container.innerHTML = '';

    const containerWidth = container.offsetWidth || window.innerWidth;
    const containerHeight = container.offsetHeight || window.innerHeight;
    
    // Reduce square density for better performance
    const performanceMultiplier = containerWidth < 1200 ? 1.5 : 1;
    const adjustedSquareSize = squareSize * performanceMultiplier;
    
    // Calculate number of squares needed (reduce for better performance)
    const cols = Math.ceil(containerWidth / adjustedSquareSize) + 1;
    const rows = Math.ceil(containerHeight / adjustedSquareSize) + 1;

    // Create squares
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const square = document.createElement('div');
        square.className = 'animated-square';
        
        // Set initial position using adjusted size
        const x = col * adjustedSquareSize;
        const y = row * adjustedSquareSize;
        
        square.style.cssText = `
          position: absolute;
          width: ${adjustedSquareSize}px;
          height: ${adjustedSquareSize}px;
          border: 1px solid ${borderColor};
          background: transparent;
          left: ${x}px;
          top: ${y}px;
          transition: background-color 0.2s ease, opacity 0.2s ease;
          opacity: 0.1;
          pointer-events: auto;
          box-sizing: border-box;
          will-change: transform;
        `;

        // Add hover effect
        const handleMouseEnter = () => {
          square.style.backgroundColor = hoverFillColor;
          square.style.opacity = '0.6';
        };

        const handleMouseLeave = () => {
          square.style.backgroundColor = 'transparent';
          square.style.opacity = '0.15';
        };

        square.addEventListener('mouseenter', handleMouseEnter);
        square.addEventListener('mouseleave', handleMouseLeave);

        container.appendChild(square);
      }
    }

    // Animation function with throttling for better performance
    let animationId: number;
    let startTime = Date.now();
    let lastFrameTime = 0;
    const targetFPS = 30; // Limit to 30fps for better performance
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (currentTime - lastFrameTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime;
      const elapsed = (currentTime - startTime) * speed * 0.001;

      const squares = container.querySelectorAll('.animated-square') as NodeListOf<HTMLElement>;
      
      squares.forEach((square, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        let baseX = col * adjustedSquareSize;
        let baseY = row * adjustedSquareSize;
        let offsetX = 0;
        let offsetY = 0;

        // Apply movement based on direction with reduced speed
        switch (direction) {
          case 'up':
            offsetY = -(elapsed * 15) % (adjustedSquareSize * 2);
            break;
          case 'down':
            offsetY = (elapsed * 15) % (adjustedSquareSize * 2);
            break;
          case 'left':
            offsetX = -(elapsed * 15) % (adjustedSquareSize * 2);
            break;
          case 'right':
            offsetX = (elapsed * 15) % (adjustedSquareSize * 2);
            break;
          case 'diagonal':
            offsetX = -(elapsed * 10) % (adjustedSquareSize * 2); // Further reduced speed
            offsetY = -(elapsed * 10) % (adjustedSquareSize * 2);
            break;
        }

        square.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      // Debounce resize to avoid excessive re-creation
      setTimeout(() => {
        if (container) {
          const newWidth = container.offsetWidth || window.innerWidth;
          const newHeight = container.offsetHeight || window.innerHeight;
          
          if (Math.abs(newWidth - containerWidth) > 50 || Math.abs(newHeight - containerHeight) > 50) {
            // Only recreate if significant size change
            container.innerHTML = '';
            // The useEffect will handle recreation
          }
        }
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      
      // Clean up event listeners
      const squares = container.querySelectorAll('.animated-square') as NodeListOf<HTMLElement>;
      squares.forEach(square => {
        square.removeEventListener('mouseenter', () => {});
        square.removeEventListener('mouseleave', () => {});
      });
    };
  }, [isMounted, speed, squareSize, direction, borderColor, hoverFillColor]);

  if (!isMounted) {
    return <div className={`absolute inset-0 overflow-hidden ${className}`} />;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export default Squares;

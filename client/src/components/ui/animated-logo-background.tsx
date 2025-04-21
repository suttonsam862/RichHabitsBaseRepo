import React, { useEffect, useRef } from 'react';
import logoPath from '@assets/BlackPNG New Rich Habits Logo.png';

interface LogoParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface AnimatedLogoBackgroundProps {
  logoCount?: number;
  className?: string;
}

export const AnimatedLogoBackground: React.FC<AnimatedLogoBackgroundProps> = ({ 
  logoCount = 15,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<LogoParticle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Load the Rich Habits logo
    const logoImage = new Image();
    logoImage.src = logoPath;
    logoImageRef.current = logoImage;
    
    // Handle window resize to keep canvas full size
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Initialize logo particles once the image is loaded
    logoImage.onload = () => {
      const particles: LogoParticle[] = [];
      
      for (let i = 0; i < logoCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 30 + Math.random() * 100, // Random sizes between 30px and 130px
          speedX: (Math.random() - 0.5) * 0.5, // Slow horizontal movement
          speedY: (Math.random() - 0.5) * 0.5, // Slow vertical movement
          opacity: 0.03 + Math.random() * 0.08, // Very subtle opacity between 0.03 and 0.11
          rotation: Math.random() * 360, // Random initial rotation in degrees
          rotationSpeed: (Math.random() - 0.5) * 0.3 // Slow rotation speed
        });
      }
      
      particlesRef.current = particles;
      animate();
    };
    
    const animate = () => {
      if (!canvas || !ctx || !logoImageRef.current) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        ctx.save();
        
        // Move to particle center position for rotation
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        
        // Set opacity
        ctx.globalAlpha = particle.opacity;
        
        // Draw the logo
        const logoWidth = particle.size;
        const logoHeight = (logoImageRef.current!.height / logoImageRef.current!.width) * logoWidth;
        ctx.drawImage(
          logoImageRef.current!,
          -logoWidth / 2, // Center the image
          -logoHeight / 2,
          logoWidth,
          logoHeight
        );
        
        ctx.restore();
        
        // Update particle position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        
        // Handle boundary conditions - wrap around screen edges
        if (particle.x < -logoWidth) particle.x = canvas.width + logoWidth / 2;
        if (particle.x > canvas.width + logoWidth) particle.x = -logoWidth / 2;
        if (particle.y < -logoHeight) particle.y = canvas.height + logoHeight / 2;
        if (particle.y > canvas.height + logoHeight) particle.y = -logoHeight / 2;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [logoCount]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none z-0 ${className}`} 
    />
  );
};
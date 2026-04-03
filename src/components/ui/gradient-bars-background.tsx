import React from 'react';

interface GradientBarsProps {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  className?: string;
}

const GradientBars: React.FC<GradientBarsProps> = ({
  numBars = 15,
  gradientFrom = 'rgb(255, 60, 0)',
  gradientTo = 'transparent',
  animationDuration = 2,
  className = '',
}) => {
  const calculateHeight = (index: number, total: number) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 30;
    
    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);
    
    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  return (
    <>
      <style>{`
        @keyframes pulseBar {
          0% { transform: translateY(0) scaleY(var(--initial-scale)); opacity: 0.8; }
          50% { transform: translateY(-15px) scaleY(calc(var(--initial-scale) * 1.05)); opacity: 1; }
          100% { transform: translateY(0) scaleY(calc(var(--initial-scale) * 0.9)); opacity: 0.8; }
        }
      `}</style>
      
      <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
        <div 
          className="flex h-full"
          style={{
            width: '100%',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {Array.from({ length: numBars }).map((_, index) => {
            const height = calculateHeight(index, numBars);
            return (
              <div
                key={index}
                style={{
                  flex: `1 0 calc(100% / ${numBars})`,
                  maxWidth: `calc(100% / ${numBars})`,
                  height: 'calc(100% + 40px)',
                  bottom: '-20px',
                  background: `linear-gradient(to bottom, ${gradientFrom} 0%, ${gradientTo} 40%, ${gradientTo} 60%, ${gradientFrom} 100%)`,
                  transform: `scaleY(${height / 100})`,
                  transformOrigin: 'bottom',
                  transition: 'transform 0.5s ease-in-out',
                  animation: `pulseBar ${animationDuration + (index % 3)}s ease-in-out infinite alternate`,
                  animationDelay: `${index * 0.1}s`,
                  outline: '1px solid rgba(0, 0, 0, 0)',
                  boxSizing: 'border-box',
                  // @ts-ignore
                  '--initial-scale': height / 100,
                }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

interface ComponentProps {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function GradientBarsBackground({
  numBars = 7,
  gradientFrom = 'rgba(245, 158, 11, 0.2)', // Matching Hivon Amber but subtle
  gradientTo = 'transparent',
  animationDuration = 3,
  backgroundColor = 'transparent',
  children,
}: ComponentProps) {
  return (
    <section 
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ backgroundColor, zIndex: -1 }}
    >
      <GradientBars
        numBars={numBars}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        animationDuration={animationDuration}
      />
      
      {children && (
        <div className="fixed inset-0 z-10 w-full h-full">
          {children}
        </div>
      )}
    </section>
  );
}

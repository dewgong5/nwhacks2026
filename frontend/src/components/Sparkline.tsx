import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  isPositive: boolean;
}

export function Sparkline({ data, isPositive }: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const width = 64;
    const height = 24;
    const padding = 2;
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    return `M${points.join(' L')}`;
  }, [data]);

  const gradientId = useMemo(() => `sparkline-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <svg width="100%" height="100%" viewBox="0 0 64 24" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop 
            offset="0%" 
            stopColor={isPositive ? 'hsl(142, 76%, 50%)' : 'hsl(0, 84%, 60%)'} 
            stopOpacity={0.5} 
          />
          <stop 
            offset="100%" 
            stopColor={isPositive ? 'hsl(142, 76%, 50%)' : 'hsl(0, 84%, 60%)'} 
            stopOpacity={0} 
          />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={isPositive ? 'hsl(142, 76%, 50%)' : 'hsl(0, 84%, 60%)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

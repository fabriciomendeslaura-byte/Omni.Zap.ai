import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'destructive' | 'outline';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
  className?: string;
}

export const Badge = ({ className, variant = 'primary', size = 'md', children, ...props }: BadgeProps) => {
  const variants = {
    primary: 'bg-primary/10 border-primary/20 text-primary',
    secondary: 'bg-dark-muted border-dark-border text-dark-muted-foreground',
    success: 'bg-green-500/10 border-green-500/20 text-green-500',
    destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
    outline: 'bg-transparent border-dark-border text-dark-muted-foreground',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1 text-[11px]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-widest transition-all',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

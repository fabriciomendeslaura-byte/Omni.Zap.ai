import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-dark-card border border-dark-border shadow-2xl',
      muted: 'bg-dark-muted border border-dark-border',
      outline: 'bg-transparent border border-dark-border',
      glass: 'bg-dark-card/30 backdrop-blur-xl border border-dark-border/50',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-8',
      lg: 'p-12',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[32px] transition-all overflow-hidden',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

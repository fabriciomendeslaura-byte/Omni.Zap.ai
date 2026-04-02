import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground px-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted-foreground group-focus-within:text-primary transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-dark-muted border border-dark-border focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm text-white placeholder:text-dark-muted-foreground/50',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              error && 'border-destructive focus:border-destructive',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-muted-foreground group-focus-within:text-primary transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[10px] text-destructive font-bold px-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

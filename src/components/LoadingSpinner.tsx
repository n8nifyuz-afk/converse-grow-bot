import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={cn(
          'animate-spin rounded-full border-b-primary border-t-transparent border-l-transparent border-r-transparent',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {label}
        </p>
      )}
    </div>
  );
}
